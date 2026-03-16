"""Kalshi public API client with market filtering."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Optional

import httpx
from diskcache import Cache

from models import Category, FilterReason, FilteredMarket, KalshiMarket

logger = logging.getLogger(__name__)

KALSHI_API_BASE = "https://api.elections.kalshi.com/trade-api/v2"
CACHE_TTL = 3600  # 1 hour

# Keywords for hard-filter exclusions (case-insensitive)
_POLITICAL_KW = [
    "election", "president", "congress", "senate", "house of representatives",
    "democrat", "republican", "gop", "legislation", "bill pass", "impeach",
    "executive order", "governor", "mayor", "supreme court", "scotus",
    "trump", "biden", "desantis", "haley", "nominee", "veto", "filibuster",
    "electoral", "ballot", "vote", "partisan", "caucus", "primary",
]
_GEOPOLITICAL_KW = [
    "war", "invasion", "ceasefire", "treaty", "nato", "sanctions",
    "military strike", "nuclear", "missile", "annexation",
]
_CRYPTO_KW = [
    "bitcoin", "btc", "ethereum", "eth", "crypto", "token price",
    "stock price", "s&p 500 close", "nasdaq close", "share price",
    "asset price", "gold price", "oil price", "commodity price",
]
_CORPORATE_KW = [
    "will .* announce", "will .* launch", "will .* acquire",
    "will .* merge", "ipo", "ceo resign", "layoff",
]
_CULTURAL_KW = [
    "oscar", "grammy", "emmy", "super bowl winner", "nfl", "nba",
    "celebrity", "movie gross", "box office", "album", "tiktok",
    "twitter", "influencer",
]

# Keywords for INCLUDED categories
_WEATHER_KW = [
    "temperature", "high temp", "low temp", "degrees", "precipitation",
    "rain", "snow", "snowfall", "inches of snow", "weather", "heat",
    "cold", "frost", "hurricane", "tornado", "wind speed", "°f", "°c",
]
_ECONOMIC_KW = [
    "fed funds", "federal reserve", "interest rate", "rate decision",
    "rate cut", "rate hike", "cpi", "inflation", "consumer price",
    "unemployment", "jobs report", "nonfarm payroll", "non-farm payroll",
    "jobless claims", "gdp", "fomc", "pce", "core pce",
]


def _matches(text: str, keywords: list[str]) -> bool:
    text_lower = text.lower()
    for kw in keywords:
        if ".*" in kw:
            if re.search(kw, text_lower):
                return True
        elif kw in text_lower:
            return True
    return False


def classify_market(title: str) -> tuple[Optional[Category], Optional[FilterReason]]:
    """Return (Category, None) if market should be included, or (None, FilterReason) if excluded."""
    # Check exclusions first
    if _matches(title, _POLITICAL_KW):
        return None, FilterReason.POLITICAL
    if _matches(title, _GEOPOLITICAL_KW):
        return None, FilterReason.GEOPOLITICAL
    if _matches(title, _CRYPTO_KW):
        return None, FilterReason.CRYPTO
    if _matches(title, _CORPORATE_KW):
        return None, FilterReason.CORPORATE
    if _matches(title, _CULTURAL_KW):
        return None, FilterReason.CULTURAL

    # Check inclusions
    if _matches(title, _WEATHER_KW):
        return Category.WEATHER, None
    if _matches(title, _ECONOMIC_KW):
        return Category.ECONOMIC, None

    return None, FilterReason.UNSUPPORTED


async def fetch_kalshi_markets(cache: Cache) -> tuple[list[KalshiMarket], list[FilteredMarket]]:
    """Fetch open markets from Kalshi, classify and filter them."""
    cached = cache.get("kalshi_markets")
    cached_filtered = cache.get("kalshi_filtered")
    if cached is not None and cached_filtered is not None:
        logger.info("Using cached Kalshi market data (%d markets)", len(cached))
        return cached, cached_filtered

    markets: list[KalshiMarket] = []
    filtered: list[FilteredMarket] = []
    cursor: Optional[str] = None

    async with httpx.AsyncClient(timeout=30.0) as client:
        for _ in range(20):  # safety limit on pages
            params: dict = {"limit": 200, "status": "open"}
            if cursor:
                params["cursor"] = cursor

            try:
                resp = await client.get(f"{KALSHI_API_BASE}/markets", params=params)
                resp.raise_for_status()
            except httpx.HTTPError as e:
                logger.error("Kalshi API error: %s", e)
                break

            data = resp.json()
            raw_markets = data.get("markets", [])
            if not raw_markets:
                break

            for m in raw_markets:
                title = m.get("title", "") or m.get("subtitle", "") or ""
                full_text = f"{title} {m.get('subtitle', '')}"
                category, reason = classify_market(full_text)

                if reason is not None:
                    filtered.append(FilteredMarket(
                        title=title,
                        reason=reason,
                        market_id=m.get("ticker", ""),
                    ))
                    continue

                yes_price = m.get("yes_ask", 0) or m.get("last_price", 50) or 50
                no_price = 100 - yes_price

                close_str = m.get("close_time") or m.get("expiration_time")
                close_date = None
                if close_str:
                    try:
                        close_date = datetime.fromisoformat(close_str.replace("Z", "+00:00"))
                    except (ValueError, TypeError):
                        pass

                ticker = m.get("ticker", "")
                markets.append(KalshiMarket(
                    market_id=ticker,
                    title=title,
                    yes_price=yes_price,
                    no_price=no_price,
                    volume=m.get("volume", 0) or 0,
                    close_date=close_date,
                    category=category,
                    url=f"https://kalshi.com/markets/{ticker}",
                    ticker=ticker,
                    subtitle=m.get("subtitle", ""),
                ))

            cursor = data.get("cursor")
            if not cursor:
                break

    cache.set("kalshi_markets", markets, expire=CACHE_TTL)
    cache.set("kalshi_filtered", filtered, expire=CACHE_TTL)
    logger.info("Fetched %d qualifying markets, filtered %d", len(markets), len(filtered))
    return markets, filtered
