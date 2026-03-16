"""Kalshi API client using the structured Series > Event > Market hierarchy."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx
from diskcache import Cache

from models import Category, FilterReason, FilteredMarket, KalshiMarket

logger = logging.getLogger(__name__)

KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2"
CACHE_TTL = 3600  # 60 minutes

# Rate limiting
REQUEST_DELAY = 0.5  # seconds between requests
BACKOFF_BASE = 2  # seconds for first 429 retry
MAX_RETRIES = 3  # retry up to 3 times on 429 (waits: 2s, 4s, 8s)

# Kalshi category names that map to our categories
CATEGORY_MAP = {
    "Climate and Weather": Category.WEATHER,
    "Climate & Weather": Category.WEATHER,
    "Weather": Category.WEATHER,
    "Economics": Category.ECONOMIC,
    "Economy": Category.ECONOMIC,
}

# Categories we explicitly exclude
EXCLUDED_CATEGORIES = {
    "Politics", "US Politics", "Elections", "World Politics",
    "Crypto", "Cryptocurrency", "Financial Markets",
    "Entertainment", "Culture", "Sports",
    "Companies", "Corporate", "Tech",
    "Geopolitics", "World Events",
}

# Map excluded categories to filter reasons
EXCLUDE_REASON_MAP = {
    "Politics": FilterReason.POLITICAL,
    "US Politics": FilterReason.POLITICAL,
    "Elections": FilterReason.POLITICAL,
    "World Politics": FilterReason.POLITICAL,
    "Crypto": FilterReason.CRYPTO,
    "Cryptocurrency": FilterReason.CRYPTO,
    "Financial Markets": FilterReason.CRYPTO,
    "Entertainment": FilterReason.CULTURAL,
    "Culture": FilterReason.CULTURAL,
    "Sports": FilterReason.CULTURAL,
    "Companies": FilterReason.CORPORATE,
    "Corporate": FilterReason.CORPORATE,
    "Tech": FilterReason.CORPORATE,
    "Geopolitics": FilterReason.GEOPOLITICAL,
    "World Events": FilterReason.GEOPOLITICAL,
}


async def _fetch_json(client: httpx.AsyncClient, path: str, params: dict = None) -> Optional[dict]:
    """Fetch JSON from Kalshi API with rate limiting and exponential backoff on 429."""
    url = f"{KALSHI_API_BASE}{path}"

    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = await client.get(url, params=params or {})

            if resp.status_code == 429:
                if attempt >= MAX_RETRIES:
                    logger.error("Kalshi 429 on %s after %d retries, giving up", path, MAX_RETRIES)
                    return None
                wait = BACKOFF_BASE * (2 ** attempt)  # 2s, 4s, 8s
                logger.warning("Kalshi 429 on %s, retrying in %ds (attempt %d/%d)",
                               path, wait, attempt + 1, MAX_RETRIES)
                await asyncio.sleep(wait)
                continue

            resp.raise_for_status()
            return resp.json()

        except httpx.HTTPError as e:
            logger.error("Kalshi API error on %s: %s", path, e)
            return None

    return None


async def _throttled_fetch(client: httpx.AsyncClient, path: str, params: dict = None) -> Optional[dict]:
    """Fetch with a delay before the request to stay under rate limits."""
    await asyncio.sleep(REQUEST_DELAY)
    return await _fetch_json(client, path, params)


async def fetch_series(client: httpx.AsyncClient) -> list[dict]:
    """Fetch all series from Kalshi."""
    data = await _fetch_json(client, "/series")
    if not data:
        return []
    return data.get("series", [])


async def fetch_markets_for_series(
    client: httpx.AsyncClient, series_ticker: str
) -> list[dict]:
    """Fetch open markets for a given series with pagination."""
    all_markets = []
    cursor = None

    for _ in range(10):  # page limit
        params = {
            "series_ticker": series_ticker,
            "status": "open",
            "limit": 200,
        }
        if cursor:
            params["cursor"] = cursor

        data = await _throttled_fetch(client, "/markets", params)
        if not data:
            break

        markets = data.get("markets", [])
        if not markets:
            break

        all_markets.extend(markets)
        cursor = data.get("cursor")
        if not cursor:
            break

    return all_markets


def _parse_price(raw: str | float | int | None, fallback: float = 0.50) -> float:
    """Parse a price value from Kalshi (dollar strings like '0.56' or cents)."""
    if raw is None:
        return fallback
    try:
        val = float(raw)
        # If it looks like cents (> 1), convert to dollars
        if val > 1.0:
            val = val / 100.0
        return max(0.01, min(0.99, val))
    except (ValueError, TypeError):
        return fallback


def _parse_market(m: dict, series_ticker: str, category: Category) -> KalshiMarket:
    """Parse a raw Kalshi market dict into our model."""
    ticker = m.get("ticker", "")

    # Price priority: yes_ask > last_price > yes_bid
    yes_price = _parse_price(
        m.get("yes_ask_dollars") or m.get("last_price_dollars") or m.get("yes_bid_dollars")
    )
    no_price = 1.0 - yes_price

    close_str = m.get("close_time") or m.get("expiration_time")
    close_date = None
    if close_str:
        try:
            close_date = datetime.fromisoformat(close_str.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            pass

    volume_raw = m.get("volume_fp") or m.get("volume") or "0"
    try:
        volume = int(float(volume_raw))
    except (ValueError, TypeError):
        volume = 0

    return KalshiMarket(
        market_id=ticker,
        ticker=ticker,
        event_ticker=m.get("event_ticker", ""),
        series_ticker=series_ticker,
        title=m.get("title", ""),
        subtitle=m.get("subtitle", "") or m.get("yes_sub_title", "") or "",
        yes_price=yes_price,
        no_price=no_price,
        volume=volume,
        close_date=close_date,
        category=category,
        url=f"https://kalshi.com/markets/{ticker}",
    )


async def fetch_kalshi_markets(cache: Cache) -> tuple[list[KalshiMarket], list[FilteredMarket], int]:
    """Fetch markets from Kalshi using structured category filtering.

    Returns (qualifying_markets, filtered_markets, total_scanned).
    """
    cached = cache.get("kalshi_v2_markets")
    cached_filtered = cache.get("kalshi_v2_filtered")
    cached_total = cache.get("kalshi_v2_total")
    if cached is not None and cached_filtered is not None and cached_total is not None:
        logger.info("Using cached Kalshi data (%d markets)", len(cached))
        return cached, cached_filtered, cached_total

    markets: list[KalshiMarket] = []
    filtered: list[FilteredMarket] = []
    total_scanned = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Fetch all series to discover categories
        all_series = await fetch_series(client)
        logger.info("Found %d series on Kalshi", len(all_series))

        included_series: list[tuple[dict, Category]] = []

        for s in all_series:
            series_category = s.get("category", "")
            series_ticker = s.get("ticker", "")
            series_title = s.get("title", "")

            # Check if this series maps to a category we want
            our_category = None
            for kalshi_cat, cat in CATEGORY_MAP.items():
                if kalshi_cat.lower() in series_category.lower():
                    our_category = cat
                    break

            if our_category:
                included_series.append((s, our_category))
            else:
                # Track as filtered
                reason = FilterReason.UNSUPPORTED
                for excl_cat, excl_reason in EXCLUDE_REASON_MAP.items():
                    if excl_cat.lower() in series_category.lower():
                        reason = excl_reason
                        break
                filtered.append(FilteredMarket(
                    title=f"[Series] {series_title}",
                    reason=reason,
                    market_id=series_ticker,
                ))
                total_scanned += 1

        logger.info("Found %d weather/economic series", len(included_series))

        # Step 2: Fetch markets for each qualifying series (throttled)
        for series, category in included_series:
            series_ticker = series.get("ticker", "")
            raw_markets = await fetch_markets_for_series(client, series_ticker)

            for m in raw_markets:
                total_scanned += 1
                parsed = _parse_market(m, series_ticker, category)
                markets.append(parsed)

    total_scanned += len(markets)

    cache.set("kalshi_v2_markets", markets, expire=CACHE_TTL)
    cache.set("kalshi_v2_filtered", filtered, expire=CACHE_TTL)
    cache.set("kalshi_v2_total", total_scanned, expire=CACHE_TTL)

    logger.info(
        "Kalshi fetch complete: %d qualifying markets from %d series, %d filtered series",
        len(markets), len(included_series), len(filtered),
    )
    return markets, filtered, total_scanned
