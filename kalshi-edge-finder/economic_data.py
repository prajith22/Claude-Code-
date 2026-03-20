"""Economic data estimation using FRED API.

Approach: For each economic indicator market, pull the historical series from
FRED, model the distribution of recent values, and estimate P(next value > threshold).

Honest limitations:
- Fed rate decisions: FRED shows historical rates; we use recent trend + stability
  to estimate probability. Without CME FedWatch (paid API), this is a rough estimate.
- CPI/unemployment/jobs: We model recent values as a distribution and compute
  probability of exceeding a threshold. This works reasonably well for stable series.
"""

from __future__ import annotations

import logging
import math
import os
import re
import statistics
from typing import Optional

import httpx
from diskcache import Cache

from models import ConfidenceTier, KalshiMarket, ProbabilityEstimate

logger = logging.getLogger(__name__)

FORECAST_CACHE_TTL = 3600  # 60 min for FRED data
FRED_BASE = "https://api.stlouisfed.org/fred"

# FRED series IDs for economic indicators
SERIES_MAP = {
    "fed_funds": "FEDFUNDS",
    "cpi": "CPIAUCSL",
    "core_cpi": "CPILFESL",
    "cpi_yoy": "CPIAUCSL",
    "unemployment": "UNRATE",
    "nonfarm_payroll": "PAYEMS",
    "initial_claims": "ICSA",
    "pce": "PCEPI",
    "core_pce": "PCEPILFE",
    "gdp": "GDP",
}

# Mapping of indicator keywords to detect from market titles
INDICATOR_PATTERNS: list[tuple[str, list[str]]] = [
    ("fed_funds", ["fed funds", "federal reserve", "rate decision", "rate cut",
                   "rate hike", "fomc", "interest rate", "fed rate"]),
    ("core_cpi", ["core cpi", "core consumer price"]),
    ("cpi_yoy", ["cpi year", "cpi annual", "year-over-year cpi", "yoy cpi"]),
    ("cpi", ["cpi", "consumer price index", "inflation rate"]),
    ("unemployment", ["unemployment rate", "unemployment"]),
    ("nonfarm_payroll", ["nonfarm payroll", "non-farm payroll", "jobs report",
                         "jobs added", "job growth"]),
    ("initial_claims", ["jobless claims", "initial claims"]),
    ("core_pce", ["core pce"]),
    ("pce", ["pce price", "pce inflation"]),
    ("gdp", ["gdp growth", "gross domestic product"]),
]


def detect_indicator(market: KalshiMarket) -> Optional[str]:
    """Detect which economic indicator a market is about."""
    text = f"{market.title} {market.subtitle}".lower()

    for indicator, keywords in INDICATOR_PATTERNS:
        if any(kw in text for kw in keywords):
            return indicator
    return None


def extract_threshold(market: KalshiMarket, indicator: Optional[str] = None) -> Optional[tuple[str, float]]:
    """Extract threshold from market title.

    Returns (comparison, value) e.g. ("above", 3.5).
    """
    title = market.title.lower()
    ticker = market.ticker.upper()

    # Try ticker pattern first (e.g., -T350 for 3.50%)
    t_match = re.search(r"-T(\d+)", ticker)
    if t_match:
        raw = float(t_match.group(1))
        # Nonfarm payrolls: raw ticker value IS the threshold in thousands
        # (e.g., -T150 means 150K jobs). Skip decimal scaling.
        if indicator == "nonfarm_payroll":
            value = raw
        elif raw > 100:
            value = raw / 100.0  # e.g., 350 → 3.50
        elif raw > 20:
            value = raw / 10.0   # e.g., 35 → 3.5
        else:
            value = raw

    else:
        # Try to parse from title
        patterns = [
            (r"(?:above|exceed|over|at least|higher than|increase to|reach)\s*(\d+\.?\d*)\s*%?", "above"),
            (r"(\d+\.?\d*)\s*%?\s*(?:or above|or higher|or more|\+)", "above"),
            (r"(?:below|under|at most|lower than|decrease to|fall to)\s*(\d+\.?\d*)\s*%?", "below"),
            (r"(\d+\.?\d*)\s*%?\s*(?:or below|or lower|or less)", "below"),
            (r"(?:unchanged|no change|hold|pause)", "unchanged"),
        ]

        for pattern, comparison in patterns:
            match = re.search(pattern, title)
            if match:
                if comparison == "unchanged":
                    return "unchanged", 0.0
                return comparison, float(match.group(1))

        return None

    # Determine comparison direction from title
    if any(kw in title for kw in ["above", "exceed", "over", "at least", "higher", "or more"]):
        comparison = "above"
    elif any(kw in title for kw in ["below", "under", "at most", "lower", "or less"]):
        comparison = "below"
    elif any(kw in title for kw in ["cut", "decrease", "lower"]):
        comparison = "below"
    elif any(kw in title for kw in ["hike", "increase", "raise"]):
        comparison = "above"
    else:
        comparison = "above"  # default

    return comparison, value


async def fetch_fred_series(
    series_id: str, cache: Cache, limit: int = 36
) -> Optional[list[float]]:
    """Fetch recent observations from FRED. Returns list of float values, newest first."""
    api_key = os.environ.get("FRED_API_KEY", "")
    if not api_key:
        return None

    cache_key = f"fred_{series_id}_{limit}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    params = {
        "series_id": series_id,
        "api_key": api_key,
        "file_type": "json",
        "sort_order": "desc",
        "limit": limit,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(f"{FRED_BASE}/series/observations", params=params)
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPError as e:
            logger.error("FRED API error for %s: %s", series_id, e)
            return None

    values = []
    for obs in data.get("observations", []):
        try:
            v = float(obs.get("value", ""))
            values.append(v)
        except (ValueError, TypeError):
            continue

    if values:
        cache.set(cache_key, values, expire=FORECAST_CACHE_TTL)
    return values if values else None


def estimate_from_distribution(
    values: list[float],
    comparison: str,
    threshold: float,
) -> tuple[float, float, float]:
    """Estimate probability from historical distribution.

    Returns (probability, stdev, mean).
    Uses normal approximation with recent trend weighting.
    """
    if len(values) < 3:
        return 0.5, 1.0, threshold

    # Weight recent values more heavily
    recent = values[:6]   # last 6 observations
    older = values[6:18]  # 7-18

    mean = statistics.mean(recent)
    if older:
        # Blend: 70% recent mean, 30% older mean
        older_mean = statistics.mean(older)
        mean = 0.7 * mean + 0.3 * older_mean

    stdev = statistics.stdev(values[:12]) if len(values) >= 4 else abs(mean * 0.03)
    if stdev < 0.001:
        stdev = 0.01

    z = (threshold - mean) / stdev

    if comparison == "above":
        prob = 1.0 - _normal_cdf(z)
    elif comparison == "below":
        prob = _normal_cdf(z)
    elif comparison == "unchanged":
        # P(no change) — how often did the value stay the same?
        if len(values) >= 4:
            changes = [abs(values[i] - values[i+1]) for i in range(min(len(values)-1, 12))]
            no_change = sum(1 for c in changes if c < 0.001)
            prob = no_change / len(changes)
        else:
            prob = 0.5
    else:
        prob = 0.5

    return max(0.01, min(0.99, prob)), stdev, mean


def _normal_cdf(z: float) -> float:
    """Standard normal CDF approximation (Abramowitz & Stegun)."""
    if z < -8:
        return 0.0
    if z > 8:
        return 1.0
    return 0.5 * (1.0 + math.erf(z / math.sqrt(2)))


async def estimate_economic_probability(
    market: KalshiMarket, cache: Cache
) -> Optional[ProbabilityEstimate]:
    """Estimate probability for an economic indicator market using FRED data."""
    indicator = detect_indicator(market)
    if not indicator:
        return None

    series_id = SERIES_MAP.get(indicator)
    if not series_id:
        return None

    values = await fetch_fred_series(series_id, cache)
    if not values:
        return None

    threshold_info = extract_threshold(market, indicator)
    if not threshold_info:
        return None

    comparison, threshold = threshold_info

    # For YoY CPI, compute year-over-year % change from the level series
    if indicator == "cpi_yoy" and len(values) >= 13:
        yoy_values = []
        for i in range(min(len(values) - 12, 12)):
            change = ((values[i] - values[i + 12]) / values[i + 12]) * 100
            yoy_values.append(change)
        values = yoy_values

    # For nonfarm payrolls, compute month-over-month change (jobs added)
    if indicator == "nonfarm_payroll" and len(values) >= 2:
        changes = [values[i] - values[i+1] for i in range(min(len(values)-1, 18))]
        values = changes
        # Payrolls are in thousands
        if threshold > 1000:
            threshold = threshold  # already in thousands
        elif threshold > 100:
            threshold = threshold  # e.g., 200 means 200K

    prob, stdev, mean = estimate_from_distribution(values, comparison, threshold)

    # Confidence assessment
    cv = stdev / abs(mean) if abs(mean) > 0.001 else 1.0

    if indicator == "fed_funds":
        # Fed rate is a policy decision — our estimate is inherently weaker
        tier = ConfidenceTier.MEDIUM
        ci = 0.15
        disclaimer = " (policy decision — estimate based on historical pattern, not market-implied)"
    elif cv < 0.03:
        tier = ConfidenceTier.HIGH
        ci = 0.05
        disclaimer = ""
    elif cv < 0.10:
        tier = ConfidenceTier.MEDIUM
        ci = 0.10
        disclaimer = ""
    else:
        tier = ConfidenceTier.LOW
        ci = 0.18
        disclaimer = ""

    indicator_names = {
        "fed_funds": "Fed Funds Rate",
        "cpi": "CPI",
        "core_cpi": "Core CPI",
        "cpi_yoy": "CPI YoY",
        "unemployment": "Unemployment Rate",
        "nonfarm_payroll": "Nonfarm Payrolls",
        "initial_claims": "Initial Claims",
        "pce": "PCE",
        "core_pce": "Core PCE",
        "gdp": "GDP",
    }
    name = indicator_names.get(indicator, indicator)

    return ProbabilityEstimate(
        probability=round(prob, 3),
        confidence_interval=ci,
        confidence_tier=tier,
        data_sources=[f"FRED {name} ({len(values)} observations)"],
        reasoning=(
            f"{name}: recent mean={mean:.2f}, stdev={stdev:.3f}, "
            f"threshold={threshold:.1f} ({comparison}){disclaimer}"
        ),
    )
