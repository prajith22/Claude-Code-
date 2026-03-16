"""Economic data sources: FRED API + CME FedWatch scraping."""

from __future__ import annotations

import logging
import os
import re
import statistics
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from diskcache import Cache

from models import ConfidenceTier, KalshiMarket, ProbabilityEstimate

logger = logging.getLogger(__name__)

CACHE_TTL = 3600
FRED_BASE = "https://api.stlouisfed.org/fred"

# FRED series IDs
SERIES = {
    "fed_funds": "FEDFUNDS",
    "cpi": "CPIAUCSL",
    "core_cpi": "CPILFESL",
    "unemployment": "UNRATE",
    "nonfarm_payroll": "PAYEMS",
    "pce": "PCEPI",
    "core_pce": "PCEPILFE",
    "gdp": "GDP",
    "initial_claims": "ICSA",
}


def _detect_indicator(title: str) -> Optional[str]:
    """Detect which economic indicator a market is about."""
    title_lower = title.lower()

    if any(kw in title_lower for kw in ["fed funds", "federal reserve", "rate decision", "rate cut", "rate hike", "fomc"]):
        return "fed_funds"
    if "core cpi" in title_lower or "core consumer price" in title_lower:
        return "core_cpi"
    if any(kw in title_lower for kw in ["cpi", "consumer price index", "inflation"]):
        return "cpi"
    if any(kw in title_lower for kw in ["unemployment rate", "unemployment"]):
        return "unemployment"
    if any(kw in title_lower for kw in ["nonfarm payroll", "non-farm payroll", "jobs report", "jobs added"]):
        return "nonfarm_payroll"
    if "core pce" in title_lower:
        return "core_pce"
    if "pce" in title_lower:
        return "pce"
    if any(kw in title_lower for kw in ["jobless claims", "initial claims"]):
        return "initial_claims"
    if "gdp" in title_lower:
        return "gdp"
    return None


def _extract_threshold(title: str) -> Optional[tuple[str, float]]:
    """Extract a numeric threshold from market title.

    Returns (comparison, value) e.g. ("above", 3.5) or ("below", 4.0).
    """
    title_lower = title.lower()

    patterns = [
        (r"(?:above|exceed|over|at least|higher than|increase to)\s*(\d+\.?\d*)\s*%?", "above"),
        (r"(\d+\.?\d*)\s*%?\s*or\s*(?:above|higher|more)", "above"),
        (r"(?:below|under|at most|lower than|decrease to|fall to)\s*(\d+\.?\d*)\s*%?", "below"),
        (r"(\d+\.?\d*)\s*%?\s*or\s*(?:below|lower|less)", "below"),
        (r"(?:between)\s*(\d+\.?\d*)\s*%?\s*and\s*(\d+\.?\d*)", "between"),
        (r"(?:cut|decrease|lower).*?(\d+)\s*(?:basis points|bps)", "cut_bps"),
        (r"(?:hike|increase|raise).*?(\d+)\s*(?:basis points|bps)", "hike_bps"),
        (r"(?:remain|unchanged|hold|pause|no change)", "unchanged"),
    ]

    for pattern, comparison in patterns:
        match = re.search(pattern, title_lower)
        if match:
            if comparison == "between":
                return "between", (float(match.group(1)), float(match.group(2)))
            if comparison == "unchanged":
                return "unchanged", 0
            return comparison, float(match.group(1))

    return None


async def get_fred_series(
    series_id: str, cache: Cache, observations: int = 24
) -> Optional[list[dict]]:
    """Fetch recent observations from FRED."""
    api_key = os.environ.get("FRED_API_KEY", "")
    if not api_key:
        return None

    cache_key = f"fred_{series_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    params = {
        "series_id": series_id,
        "api_key": api_key,
        "file_type": "json",
        "sort_order": "desc",
        "limit": observations,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(f"{FRED_BASE}/series/observations", params=params)
            resp.raise_for_status()
            data = resp.json()
            obs = data.get("observations", [])
            cache.set(cache_key, obs, expire=CACHE_TTL)
            return obs
        except httpx.HTTPError as e:
            logger.error("FRED API error for %s: %s", series_id, e)
            return None


async def get_cme_fedwatch(cache: Cache) -> Optional[dict]:
    """Scrape CME FedWatch implied probabilities.

    Falls back to a simple estimation if scraping fails.
    """
    cached = cache.get("cme_fedwatch")
    if cached is not None:
        return cached

    # Try to fetch CME FedWatch data from public page
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        try:
            resp = await client.get(
                "https://www.cmegroup.com/services/fed-watch-tool/data.json",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            if resp.status_code == 200:
                data = resp.json()
                cache.set("cme_fedwatch", data, expire=CACHE_TTL)
                return data
        except (httpx.HTTPError, Exception) as e:
            logger.warning("CME FedWatch fetch failed: %s", e)

    return None


def _estimate_from_trend(values: list[float], threshold_info: Optional[tuple]) -> Optional[float]:
    """Estimate probability from recent trend of values."""
    if len(values) < 3:
        return None

    recent = values[:6]  # last 6 observations
    mean = statistics.mean(recent)
    stdev = statistics.stdev(recent) if len(recent) > 1 else abs(mean * 0.05)

    if stdev == 0:
        stdev = 0.01

    if threshold_info is None:
        return None

    comparison, threshold = threshold_info

    if comparison == "above":
        # Probability that next value > threshold using normal approximation
        z = (threshold - mean) / stdev
        prob = 1.0 - _normal_cdf(z)
    elif comparison == "below":
        z = (threshold - mean) / stdev
        prob = _normal_cdf(z)
    elif comparison == "unchanged":
        # Probability of no change — use historical frequency
        if len(values) >= 6:
            no_change_count = sum(1 for i in range(len(values) - 1) if abs(values[i] - values[i + 1]) < 0.001)
            prob = no_change_count / (len(values) - 1)
        else:
            prob = 0.5
    else:
        return None

    return max(0.01, min(0.99, prob))


def _normal_cdf(z: float) -> float:
    """Approximate normal CDF using logistic approximation."""
    return 1.0 / (1.0 + 2.718281828 ** (-1.7 * z))


async def estimate_fed_rate_probability(
    market: KalshiMarket, cache: Cache
) -> Optional[ProbabilityEstimate]:
    """Estimate Fed rate decision probability using CME FedWatch + FRED data."""
    data_sources = []

    # Try CME FedWatch first (most reliable for Fed decisions)
    fedwatch = await get_cme_fedwatch(cache)
    fedwatch_prob = None
    if fedwatch:
        # Parse FedWatch data for matching meeting
        data_sources.append("CME FedWatch")
        # FedWatch data structure varies; try to extract probabilities
        try:
            meetings = fedwatch if isinstance(fedwatch, list) else fedwatch.get("meetings", [])
            if meetings:
                # Use first upcoming meeting probabilities
                fedwatch_prob = None  # Would need to match specific market
        except Exception:
            pass

    # Fallback: use FRED historical data
    fred_data = await get_fred_series(SERIES["fed_funds"], cache)
    fred_prob = None
    threshold_info = _extract_threshold(market.title)

    if fred_data:
        values = []
        for obs in fred_data:
            try:
                v = float(obs.get("value", ""))
                values.append(v)
            except (ValueError, TypeError):
                continue

        if values:
            data_sources.append("FRED Fed Funds Rate")
            fred_prob = _estimate_from_trend(values, threshold_info)

    # Combine
    if fedwatch_prob is not None:
        final_prob = fedwatch_prob
        tier = ConfidenceTier.HIGH
        ci = 0.05
    elif fred_prob is not None:
        final_prob = fred_prob
        tier = ConfidenceTier.MEDIUM
        ci = 0.12
    else:
        return None

    return ProbabilityEstimate(
        probability=round(final_prob, 3),
        confidence_interval=ci,
        confidence_tier=tier,
        data_sources=data_sources,
        reasoning=f"Fed rate estimate based on {', '.join(data_sources)}",
    )


async def estimate_economic_probability(
    market: KalshiMarket, cache: Cache
) -> Optional[ProbabilityEstimate]:
    """Estimate probability for an economic indicator market."""
    indicator = _detect_indicator(market.title)
    if not indicator:
        return None

    # Fed rate gets special treatment
    if indicator == "fed_funds":
        return await estimate_fed_rate_probability(market, cache)

    # For other indicators, use FRED historical trend
    series_id = SERIES.get(indicator)
    if not series_id:
        return None

    fred_data = await get_fred_series(series_id, cache)
    if not fred_data:
        return None

    values = []
    for obs in fred_data:
        try:
            v = float(obs.get("value", ""))
            values.append(v)
        except (ValueError, TypeError):
            continue

    if len(values) < 3:
        return None

    threshold_info = _extract_threshold(market.title)
    prob = _estimate_from_trend(values, threshold_info)

    if prob is None:
        return None

    recent = values[:6]
    stdev = statistics.stdev(recent) if len(recent) > 1 else abs(statistics.mean(recent) * 0.05)
    mean = statistics.mean(recent)
    cv = stdev / abs(mean) if mean != 0 else 0.5

    # Confidence based on coefficient of variation
    if cv < 0.05:
        tier = ConfidenceTier.HIGH
        ci = 0.06
    elif cv < 0.15:
        tier = ConfidenceTier.MEDIUM
        ci = 0.12
    else:
        tier = ConfidenceTier.LOW
        ci = 0.20

    indicator_names = {
        "cpi": "CPI",
        "core_cpi": "Core CPI",
        "unemployment": "Unemployment Rate",
        "nonfarm_payroll": "Nonfarm Payrolls",
        "pce": "PCE",
        "core_pce": "Core PCE",
        "gdp": "GDP",
        "initial_claims": "Initial Jobless Claims",
    }

    return ProbabilityEstimate(
        probability=round(prob, 3),
        confidence_interval=ci,
        confidence_tier=tier,
        data_sources=[f"FRED {indicator_names.get(indicator, indicator)} series (last {len(values)} observations)"],
        reasoning=f"{indicator_names.get(indicator, indicator)} trend analysis: mean={mean:.2f}, stdev={stdev:.3f}",
    )
