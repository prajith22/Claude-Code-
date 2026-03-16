"""Central probability estimator — routes markets to the appropriate data source."""

from __future__ import annotations

import logging
from typing import Optional

from diskcache import Cache

from economic_data import estimate_economic_probability
from models import Category, KalshiMarket, ProbabilityEstimate
from weather_data import estimate_weather_probability

logger = logging.getLogger(__name__)


async def estimate_probability(
    market: KalshiMarket, cache: Cache
) -> Optional[ProbabilityEstimate]:
    """Route a market to the appropriate estimator based on its category."""
    if market.category == Category.WEATHER:
        return await estimate_weather_probability(market, cache)
    elif market.category == Category.ECONOMIC:
        return await estimate_economic_probability(market, cache)
    else:
        logger.debug("No estimator for market category: %s", market.category)
        return None
