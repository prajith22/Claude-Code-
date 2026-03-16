"""Weather data sources: Open-Meteo forecast + NOAA historical."""

from __future__ import annotations

import logging
import os
import re
import statistics
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from diskcache import Cache

from models import ConfidenceTier, ProbabilityEstimate

logger = logging.getLogger(__name__)

CACHE_TTL = 3600

# Major cities with coordinates for weather market matching
CITY_COORDS = {
    "new york": (40.7128, -74.0060),
    "nyc": (40.7128, -74.0060),
    "los angeles": (34.0522, -118.2437),
    "la": (34.0522, -118.2437),
    "chicago": (41.8781, -87.6298),
    "houston": (29.7604, -95.3698),
    "phoenix": (33.4484, -112.0740),
    "philadelphia": (39.9526, -75.1652),
    "san antonio": (29.4241, -98.4936),
    "san diego": (32.7157, -117.1611),
    "dallas": (32.7767, -96.7970),
    "miami": (25.7617, -80.1918),
    "atlanta": (33.7490, -84.3880),
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
    "jacksonville": (30.3322, -81.6557),
    "memphis": (35.1495, -90.0490),
    "oklahoma city": (35.4676, -97.5164),
    "milwaukee": (43.0389, -87.9065),
    "baltimore": (39.2904, -76.6122),
    "salt lake city": (40.7608, -111.8910),
    "anchorage": (61.2181, -149.9003),
    "honolulu": (21.3069, -157.8583),
}

# NOAA station IDs for major cities
NOAA_STATIONS = {
    "new york": "GHCND:USW00094728",
    "nyc": "GHCND:USW00094728",
    "chicago": "GHCND:USW00094846",
    "los angeles": "GHCND:USW00023174",
    "la": "GHCND:USW00023174",
    "miami": "GHCND:USW00012839",
    "houston": "GHCND:USW00012960",
    "phoenix": "GHCND:USW00023183",
    "denver": "GHCND:USW00023062",
    "seattle": "GHCND:USW00024233",
    "boston": "GHCND:USW00014739",
    "atlanta": "GHCND:USW00013874",
    "dallas": "GHCND:USW00013960",
    "washington": "GHCND:USW00013743",
    "dc": "GHCND:USW00013743",
    "san francisco": "GHCND:USW00023234",
    "sf": "GHCND:USW00023234",
    "minneapolis": "GHCND:USW00014922",
    "detroit": "GHCND:USW00094847",
    "philadelphia": "GHCND:USW00013739",
}


def extract_city(market_title: str) -> Optional[str]:
    """Extract a known city name from a market title."""
    title_lower = market_title.lower()
    # Try longest names first
    for city in sorted(CITY_COORDS.keys(), key=len, reverse=True):
        if city in title_lower:
            return city
    return None


def extract_temperature_threshold(title: str) -> Optional[tuple[str, float]]:
    """Extract temperature condition from market title.

    Returns (comparison, temp_f) e.g. ("above", 75.0) or ("below", 32.0).
    """
    title_lower = title.lower()

    patterns = [
        (r"(?:high|temperature).*(?:above|exceed|over|at least|reach)\s*(\d+)", "above"),
        (r"(?:above|exceed|over|at least|reach)\s*(\d+).*(?:°|degree|temp)", "above"),
        (r"(\d+)\s*°?\s*f?\s*or\s*(?:above|higher|more)", "above"),
        (r"(?:high|temperature).*(?:below|under|at most|drop)\s*(\d+)", "below"),
        (r"(?:below|under|at most)\s*(\d+).*(?:°|degree|temp)", "below"),
        (r"(\d+)\s*°?\s*f?\s*or\s*(?:below|lower|less)", "below"),
    ]

    for pattern, comparison in patterns:
        match = re.search(pattern, title_lower)
        if match:
            return comparison, float(match.group(1))

    return None


def extract_date_from_title(title: str) -> Optional[datetime]:
    """Try to extract a target date from market title."""
    # Patterns like "on March 15" or "March 15, 2026"
    months = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
        "jan": 1, "feb": 2, "mar": 3, "apr": 4,
        "jun": 6, "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
    }
    title_lower = title.lower()
    for month_name, month_num in months.items():
        pattern = rf"{month_name}\s+(\d{{1,2}})(?:\s*,?\s*(\d{{4}}))?"
        match = re.search(pattern, title_lower)
        if match:
            day = int(match.group(1))
            year = int(match.group(2)) if match.group(2) else datetime.now().year
            try:
                return datetime(year, month_num, day, tzinfo=timezone.utc)
            except ValueError:
                continue
    return None


async def get_openmeteo_forecast(
    lat: float, lon: float, cache: Cache
) -> Optional[dict]:
    """Fetch 7-day hourly forecast from Open-Meteo with ensemble data."""
    cache_key = f"openmeteo_{lat:.2f}_{lon:.2f}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,precipitation_probability",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
        "temperature_unit": "fahrenheit",
        "timezone": "America/New_York",
        "forecast_days": 7,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            cache.set(cache_key, data, expire=CACHE_TTL)
            return data
        except httpx.HTTPError as e:
            logger.error("Open-Meteo error: %s", e)
            return None


async def get_openmeteo_ensemble(
    lat: float, lon: float, cache: Cache
) -> Optional[dict]:
    """Fetch ensemble forecast for confidence estimation."""
    cache_key = f"openmeteo_ensemble_{lat:.2f}_{lon:.2f}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    url = "https://ensemble-api.open-meteo.com/v1/ensemble"
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m",
        "temperature_unit": "fahrenheit",
        "timezone": "America/New_York",
        "models": "icon_seamless",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
            cache.set(cache_key, data, expire=CACHE_TTL)
            return data
        except httpx.HTTPError as e:
            logger.warning("Open-Meteo ensemble error: %s", e)
            return None


async def get_noaa_historical(
    station_id: str, month: int, day: int, cache: Cache
) -> Optional[list[float]]:
    """Fetch 30 years of historical daily max temps for a given date from NOAA CDO.

    Returns list of max temps (°F) for this date across available years.
    """
    token = os.environ.get("NOAA_API_TOKEN", "")
    if not token:
        return None

    cache_key = f"noaa_{station_id}_{month}_{day}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    now = datetime.now()
    results: list[float] = []

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Fetch in 5-year chunks to stay within NOAA limits
        for start_year in range(now.year - 30, now.year, 5):
            end_year = min(start_year + 4, now.year - 1)
            try:
                start_date = f"{start_year}-{month:02d}-{day:02d}"
                end_date = f"{end_year}-{month:02d}-{day:02d}"
            except ValueError:
                continue

            params = {
                "datasetid": "GHCND",
                "stationid": station_id,
                "datatypeid": "TMAX",
                "startdate": start_date,
                "enddate": end_date,
                "units": "standard",
                "limit": 100,
            }

            try:
                resp = await client.get(
                    "https://www.ncdc.noaa.gov/cdo-web/api/v2/data",
                    params=params,
                    headers={"token": token},
                )
                resp.raise_for_status()
                data = resp.json()
                for r in data.get("results", []):
                    # Filter to only the target month/day
                    d = r.get("date", "")
                    if f"-{month:02d}-{day:02d}" in d:
                        results.append(r["value"])
            except httpx.HTTPError as e:
                logger.warning("NOAA error for %s-%s: %s", start_year, end_year, e)
                continue

    if results:
        cache.set(cache_key, results, expire=86400)  # cache 24h
    return results if results else None


async def estimate_weather_probability(
    market: "KalshiMarket", cache: Cache
) -> Optional[ProbabilityEstimate]:
    """Estimate probability for a weather market using forecast + historical data."""
    from models import KalshiMarket

    city = extract_city(market.title)
    if not city:
        return None

    coords = CITY_COORDS.get(city)
    if not coords:
        return None

    temp_info = extract_temperature_threshold(market.title)
    target_date = extract_date_from_title(market.title)

    if not temp_info:
        # For now, only handle temperature markets
        return None

    comparison, threshold = temp_info
    lat, lon = coords
    data_sources = []

    # --- Open-Meteo forecast probability ---
    forecast_prob = None
    forecast = await get_openmeteo_forecast(lat, lon, cache)

    if forecast and target_date:
        daily = forecast.get("daily", {})
        dates = daily.get("time", [])
        maxes = daily.get("temperature_2m_max", [])

        target_str = target_date.strftime("%Y-%m-%d")
        if target_str in dates:
            idx = dates.index(target_str)
            forecast_max = maxes[idx]
            # Simple probability from point forecast — use distance from threshold
            diff = forecast_max - threshold
            if comparison == "above":
                # Use a logistic-like function based on how far forecast is from threshold
                forecast_prob = 1.0 / (1.0 + 2.718 ** (-diff / 3.0))
            else:
                forecast_prob = 1.0 / (1.0 + 2.718 ** (diff / 3.0))
            data_sources.append("Open-Meteo 7-day forecast")

    # --- Ensemble spread for confidence ---
    ensemble_spread = None
    ensemble = await get_openmeteo_ensemble(lat, lon, cache)
    if ensemble:
        hourly = ensemble.get("hourly", {})
        # Get temperature spread across ensemble members
        temps = hourly.get("temperature_2m", [])
        if temps and isinstance(temps, list) and len(temps) > 24:
            # Sample a day's worth of max temps
            valid_temps = [t for t in temps[:48] if t is not None]
            if len(valid_temps) > 5:
                ensemble_spread = statistics.stdev(valid_temps)
                data_sources.append("Open-Meteo ensemble spread")

    # --- NOAA historical base rate ---
    historical_prob = None
    station_id = NOAA_STATIONS.get(city)
    ref_date = target_date or (market.close_date if market.close_date else None)

    if station_id and ref_date:
        historicals = await get_noaa_historical(
            station_id, ref_date.month, ref_date.day, cache
        )
        if historicals and len(historicals) >= 5:
            if comparison == "above":
                count_above = sum(1 for t in historicals if t >= threshold)
            else:
                count_above = sum(1 for t in historicals if t <= threshold)
            historical_prob = count_above / len(historicals)
            data_sources.append(f"NOAA {len(historicals)}-year historical")

    # --- Combine probabilities ---
    if forecast_prob is not None and historical_prob is not None:
        # Weight forecast more heavily for near-term, historical for far-term
        days_out = (target_date - datetime.now(timezone.utc)).days if target_date else 7
        if days_out <= 3:
            forecast_weight = 0.75
        elif days_out <= 5:
            forecast_weight = 0.60
        else:
            forecast_weight = 0.45
        final_prob = forecast_weight * forecast_prob + (1 - forecast_weight) * historical_prob
    elif forecast_prob is not None:
        final_prob = forecast_prob
    elif historical_prob is not None:
        final_prob = historical_prob
    else:
        return None

    final_prob = max(0.01, min(0.99, final_prob))

    # Confidence interval from ensemble spread
    if ensemble_spread is not None:
        ci = min(ensemble_spread / 100.0 * 2, 0.25)
    elif historical_prob is not None and forecast_prob is not None:
        ci = abs(forecast_prob - historical_prob) / 2.0
    else:
        ci = 0.15

    ci = max(0.03, min(ci, 0.25))

    # Confidence tier
    if forecast_prob is not None and historical_prob is not None and ci < 0.10:
        tier = ConfidenceTier.HIGH
    elif ci > 0.20:
        tier = ConfidenceTier.LOW
    else:
        tier = ConfidenceTier.MEDIUM

    return ProbabilityEstimate(
        probability=round(final_prob, 3),
        confidence_interval=round(ci, 3),
        confidence_tier=tier,
        data_sources=data_sources,
        reasoning=f"{'Forecast' if forecast_prob else 'Historical'}-driven estimate for {city.title()} temp {comparison} {threshold}°F",
    )
