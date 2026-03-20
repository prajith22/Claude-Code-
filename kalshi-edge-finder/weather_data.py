"""Weather probability estimation using Open-Meteo ensemble forecasts.

Core approach: fetch 51 ensemble members (ECMWF IFS 0.25°), compute daily
max/min per member, count how many members exceed the threshold = direct
probability estimate.
"""

from __future__ import annotations

import logging
import re
import statistics
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional

import httpx
from diskcache import Cache

from models import ConfidenceTier, KalshiMarket, ProbabilityEstimate

logger = logging.getLogger(__name__)

FORECAST_CACHE_TTL = 3600  # 60 min for forecast data
NUM_ENSEMBLE_MEMBERS = 51

# Build the hourly parameter requesting all 51 members explicitly
_MEMBER_VARS = ",".join(f"temperature_2m_member{i:02d}" for i in range(NUM_ENSEMBLE_MEMBERS))

# City coordinates for weather markets — matched against market titles/tickers
CITY_COORDS: dict[str, tuple[float, float]] = {
    "new york": (40.7128, -74.0060),
    "nyc": (40.7128, -74.0060),
    "ny": (40.7128, -74.0060),
    "los angeles": (34.0522, -118.2437),
    "la": (34.0522, -118.2437),
    "chicago": (41.8781, -87.6298),
    "chi": (41.8781, -87.6298),
    "houston": (29.7604, -95.3698),
    "phoenix": (33.4484, -112.0740),
    "philadelphia": (39.9526, -75.1652),
    "philly": (39.9526, -75.1652),
    "san antonio": (29.4241, -98.4936),
    "san diego": (32.7157, -117.1611),
    "dallas": (32.7767, -96.7970),
    "miami": (25.7617, -80.1918),
    "atlanta": (33.7490, -84.3880),
    "atl": (33.7490, -84.3880),
    "boston": (42.3601, -71.0589),
    "seattle": (47.6062, -122.3321),
    "denver": (39.7392, -104.9903),
    "washington": (38.9072, -77.0369),
    "dc": (38.9072, -77.0369),
    "nashville": (36.1627, -86.7816),
    "las vegas": (36.1699, -115.1398),
    "detroit": (42.3314, -83.0458),
    "minneapolis": (44.9778, -93.2650),
    "san francisco": (37.7749, -122.4194),
    "sf": (37.7749, -122.4194),
    "portland": (45.5155, -122.6789),
    "st. louis": (38.6270, -90.1994),
    "tampa": (27.9506, -82.4572),
    "austin": (30.2672, -97.7431),
    "charlotte": (35.2271, -80.8431),
    "indianapolis": (39.7684, -86.1581),
    "columbus": (39.9612, -82.9988),
    "memphis": (35.1495, -90.0490),
    "oklahoma city": (35.4676, -97.5164),
    "milwaukee": (43.0389, -87.9065),
    "baltimore": (39.2904, -76.6122),
    "salt lake city": (40.7608, -111.8910),
    "anchorage": (61.2181, -149.9003),
    "honolulu": (21.3069, -157.8583),
}

# Known Kalshi weather ticker patterns → city mapping
# e.g., KXHIGHNY → New York, KXHIGHCHI → Chicago
TICKER_CITY_MAP: dict[str, str] = {
    "NY": "new york",
    "CHI": "chicago",
    "LA": "los angeles",
    "HOU": "houston",
    "PHX": "phoenix",
    "MIA": "miami",
    "ATL": "atlanta",
    "BOS": "boston",
    "SEA": "seattle",
    "DEN": "denver",
    "DC": "washington",
    "DFW": "dallas",
    "SF": "san francisco",
    "LV": "las vegas",
    "DET": "detroit",
    "MSP": "minneapolis",
    "PDX": "portland",
    "STL": "st. louis",
    "TPA": "tampa",
    "AUS": "austin",
    "CLT": "charlotte",
    "IND": "indianapolis",
    "CMH": "columbus",
    "MEM": "memphis",
    "OKC": "oklahoma city",
    "MKE": "milwaukee",
    "BAL": "baltimore",
    "SLC": "salt lake city",
    "ANC": "anchorage",
    "HNL": "honolulu",
    "PHL": "philadelphia",
    "SAN": "san antonio",
    "SD": "san diego",
    "NAS": "nashville",
}


def extract_city(market: KalshiMarket) -> Optional[str]:
    """Extract city from market ticker or title."""
    ticker = market.series_ticker.upper()

    # Try ticker suffix matching (e.g., KXHIGHNY → NY)
    for code, city in TICKER_CITY_MAP.items():
        if ticker.endswith(code):
            return city

    # Fallback: search title for city names
    title_lower = market.title.lower()
    for city in sorted(CITY_COORDS.keys(), key=len, reverse=True):
        if city in title_lower:
            return city

    return None


def extract_weather_params(market: KalshiMarket) -> Optional[dict]:
    """Extract weather parameters from market ticker and title.

    Returns dict with keys: metric (high/low/precip), comparison (above/below),
    threshold (float), target_date (str YYYY-MM-DD or None).
    """
    ticker = market.ticker.upper()
    title = market.title.lower()

    result = {}

    # Detect metric from ticker pattern
    has_explicit_metric = False
    if "HIGH" in ticker or "high" in title:
        result["metric"] = "high"
        has_explicit_metric = True
    elif "LOW" in ticker or "low" in title:
        result["metric"] = "low"
        has_explicit_metric = True
    elif "PRECIP" in ticker or "rain" in title or "precipitation" in title:
        result["metric"] = "precip"
        has_explicit_metric = True
    elif "SNOW" in ticker or "snow" in title:
        result["metric"] = "snow"
        has_explicit_metric = True
    else:
        result["metric"] = "high"  # default, may be overridden below

    # Extract threshold from ticker (e.g., -T60 means 60°F)
    t_match = re.search(r"-T(\d+)", ticker)
    if t_match:
        result["threshold"] = float(t_match.group(1))
    else:
        # Try title
        temp_match = re.search(r"(\d+)\s*°?\s*[fF]", title)
        if temp_match:
            result["threshold"] = float(temp_match.group(1))
        else:
            num_match = re.search(r"(?:above|below|exceed|over|under|at least|reach)\s*(\d+)", title)
            if num_match:
                result["threshold"] = float(num_match.group(1))
            else:
                return None

    # Comparison direction
    if any(kw in title for kw in ["above", "exceed", "over", "at least", "or higher", "reach"]):
        result["comparison"] = "above"
    elif any(kw in title for kw in ["below", "under", "at most", "or lower", "drop"]):
        result["comparison"] = "below"
    elif result["metric"] == "high":
        result["comparison"] = "above"
    elif result["metric"] == "low":
        result["comparison"] = "below"
    else:
        result["comparison"] = "above"

    # BUG 3 FIX: If comparison is "below" but no explicit high/low keyword was
    # found, use daily MIN (metric="low") instead of daily MAX.
    if result["comparison"] == "below" and not has_explicit_metric:
        result["metric"] = "low"

    # Extract target date from title or close_date
    target_date = _extract_date_from_title(title)
    if target_date:
        result["target_date"] = target_date
    elif market.close_date:
        result["target_date"] = market.close_date.strftime("%Y-%m-%d")
    else:
        result["target_date"] = None

    return result


def _extract_date_from_title(title: str) -> Optional[str]:
    """Try to extract a target date from market title."""
    months = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
        "jan": 1, "feb": 2, "mar": 3, "apr": 4,
        "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    }
    for month_name, month_num in months.items():
        pattern = rf"{month_name}\s+(\d{{1,2}})(?:\s*,?\s*(\d{{4}}))?"
        match = re.search(pattern, title)
        if match:
            day = int(match.group(1))
            year = int(match.group(2)) if match.group(2) else datetime.now(timezone.utc).year
            try:
                return f"{year}-{month_num:02d}-{day:02d}"
            except ValueError:
                continue
    return None


async def fetch_ensemble_forecast(
    lat: float, lon: float, cache: Cache
) -> Optional[dict]:
    """Fetch ensemble forecast from Open-Meteo (51 ECMWF IFS members, hourly)."""
    cache_key = f"ensemble_{lat:.2f}_{lon:.2f}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": _MEMBER_VARS,
        "temperature_unit": "fahrenheit",
        "timezone": "America/New_York",
        "models": "ecmwf_ifs025",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.get(
                "https://ensemble-api.open-meteo.com/v1/ensemble",
                params=params,
            )
            resp.raise_for_status()
            data = resp.json()
            cache.set(cache_key, data, expire=FORECAST_CACHE_TTL)
            return data
        except httpx.HTTPError as e:
            logger.error("Open-Meteo ensemble error: %s", e)
            return None


def compute_daily_extremes(ensemble_data: dict) -> dict[str, dict[str, list[float]]]:
    """Compute daily max and min temperature for each ensemble member.

    Returns: {date_str: {"max": [51 values], "min": [51 values]}}
    """
    hourly = ensemble_data.get("hourly", {})
    times = hourly.get("time", [])

    # Collect member keys
    member_keys = sorted(
        k for k in hourly.keys()
        if k.startswith("temperature_2m_member")
    )

    if not member_keys or not times:
        return {}

    # Group hourly temps by date for each member
    # {date: {member_idx: [temps...]}}
    by_date: dict[str, dict[int, list[float]]] = defaultdict(lambda: defaultdict(list))

    for i, time_str in enumerate(times):
        date_str = time_str[:10]  # "2026-03-16"
        for member_idx, key in enumerate(member_keys):
            vals = hourly.get(key, [])
            if i < len(vals) and vals[i] is not None:
                by_date[date_str][member_idx].append(vals[i])

    # Compute daily max/min per member
    result: dict[str, dict[str, list[float]]] = {}
    for date_str, members in by_date.items():
        daily_maxes = []
        daily_mins = []
        for member_idx in range(len(member_keys)):
            temps = members.get(member_idx, [])
            if temps:
                daily_maxes.append(max(temps))
                daily_mins.append(min(temps))
        if daily_maxes:
            result[date_str] = {"max": daily_maxes, "min": daily_mins}

    return result


def compute_probability_from_ensemble(
    daily_extremes: dict[str, dict[str, list[float]]],
    target_date: Optional[str],
    metric: str,
    comparison: str,
    threshold: float,
) -> Optional[tuple[float, float, int]]:
    """Count ensemble members exceeding threshold.

    Returns (probability, spread_stdev, member_count) or None.
    """
    if target_date and target_date in daily_extremes:
        data = daily_extremes[target_date]
    elif daily_extremes:
        # Use the first available date if no specific target
        data = next(iter(daily_extremes.values()))
    else:
        return None

    if metric in ("high", "precip", "snow"):
        values = data.get("max", [])
    else:
        values = data.get("min", [])

    if not values:
        return None

    if comparison == "above":
        count = sum(1 for v in values if v >= threshold)
    else:
        count = sum(1 for v in values if v <= threshold)

    probability = count / len(values)
    spread = statistics.stdev(values) if len(values) > 1 else 5.0

    return probability, spread, len(values)


async def estimate_weather_probability(
    market: KalshiMarket, cache: Cache
) -> Optional[ProbabilityEstimate]:
    """Estimate probability for a weather market using ensemble forecast."""
    city = extract_city(market)
    if not city:
        logger.debug("No city found for market %s", market.ticker)
        return None

    coords = CITY_COORDS.get(city)
    if not coords:
        return None

    params = extract_weather_params(market)
    if not params or "threshold" not in params:
        logger.debug("Could not parse weather params from %s: %s", market.ticker, market.title)
        return None

    lat, lon = coords
    ensemble_data = await fetch_ensemble_forecast(lat, lon, cache)
    if not ensemble_data:
        return None

    daily_extremes = compute_daily_extremes(ensemble_data)
    if not daily_extremes:
        return None

    result = compute_probability_from_ensemble(
        daily_extremes,
        params.get("target_date"),
        params["metric"],
        params["comparison"],
        params["threshold"],
    )

    if result is None:
        return None

    probability, spread, member_count = result
    probability = max(0.01, min(0.99, probability))

    # Confidence interval from ensemble spread
    # Wider spread = less certain
    ci = min(spread / 50.0, 0.25)  # normalize: 10°F spread → 0.20 CI
    ci = max(0.03, ci)

    # BUG 4 FIX: Use timezone-aware UTC datetime for days_out calculation
    target_date = params.get("target_date")
    if target_date:
        try:
            days_out = (datetime.strptime(target_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) -
                       datetime.now(timezone.utc)).days
        except ValueError:
            days_out = 7
    else:
        days_out = 7

    if days_out <= 3 and spread < 8:
        tier = ConfidenceTier.HIGH
    elif days_out <= 5 and spread < 12:
        tier = ConfidenceTier.MEDIUM
    elif spread > 15 or days_out > 6:
        tier = ConfidenceTier.LOW
    else:
        tier = ConfidenceTier.MEDIUM

    return ProbabilityEstimate(
        probability=round(probability, 3),
        confidence_interval=round(ci, 3),
        confidence_tier=tier,
        data_sources=[f"Open-Meteo ECMWF ensemble ({member_count} members)"],
        reasoning=(
            f"{int(probability * member_count)}/{member_count} ensemble members show "
            f"{city.title()} {params['metric']} temp {params['comparison']} "
            f"{params['threshold']:.0f}\u00b0F on {target_date or 'upcoming'} "
            f"({probability * 100:.0f}%) vs Kalshi price of "
            f"{market.yes_cents:.0f}\u00a2 \u2014 "
            f"{abs(probability - market.yes_price) * 100:.0f}% edge "
            f"(spread: {spread:.1f}\u00b0F)"
        ),
    )
