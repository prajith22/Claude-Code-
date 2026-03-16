"""Data models and edge calculation logic."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class Category(str, Enum):
    WEATHER = "WEATHER"
    ECONOMIC = "ECONOMIC"


class ConfidenceTier(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class FilterReason(str, Enum):
    POLITICAL = "political"
    CRYPTO = "crypto/asset price"
    CORPORATE = "corporate decision"
    GEOPOLITICAL = "geopolitical"
    CULTURAL = "cultural/celebrity"
    HUMAN_DECISION = "human decision"
    LOW_VOLUME = "low volume"
    UNSUPPORTED = "unsupported category"
    NO_DATA = "no estimable data source"


@dataclass
class KalshiMarket:
    market_id: str
    title: str
    yes_price: float  # cents, 0-100
    no_price: float
    volume: int
    close_date: Optional[datetime]
    category: Optional[Category] = None
    url: str = ""
    ticker: str = ""
    subtitle: str = ""


@dataclass
class ProbabilityEstimate:
    probability: float  # 0-1
    confidence_interval: float  # e.g. 0.09 means ±9%
    confidence_tier: ConfidenceTier = ConfidenceTier.MEDIUM
    data_sources: list[str] = field(default_factory=list)
    reasoning: str = ""


@dataclass
class EdgeResult:
    edge: float
    ev: float
    kelly_conservative: float
    show: bool
    side: str  # "YES" or "NO"


@dataclass
class Opportunity:
    market: KalshiMarket
    estimate: ProbabilityEstimate
    yes_edge: EdgeResult
    no_edge: EdgeResult
    best_edge: EdgeResult  # whichever side has larger edge


@dataclass
class FilteredMarket:
    title: str
    reason: FilterReason
    market_id: str = ""


@dataclass
class DashboardState:
    opportunities: list[Opportunity] = field(default_factory=list)
    filtered_markets: list[FilteredMarket] = field(default_factory=list)
    total_scanned: int = 0
    last_updated: Optional[datetime] = None
    filter_breakdown: dict[str, int] = field(default_factory=dict)


def calculate_edge(market_yes_price: float, our_probability: float, edge_threshold: float = 0.10) -> EdgeResult:
    """Calculate edge for the YES side."""
    market_implied_prob = market_yes_price / 100.0
    edge = our_probability - market_implied_prob

    payout_if_win = 1.0 - market_yes_price / 100.0
    cost = market_yes_price / 100.0
    ev = (our_probability * payout_if_win) - ((1.0 - our_probability) * cost)

    if payout_if_win > 0:
        kelly = edge / payout_if_win
    else:
        kelly = 0.0
    kelly_conservative = max(kelly * 0.25, 0.0)

    return EdgeResult(
        edge=edge,
        ev=ev,
        kelly_conservative=kelly_conservative,
        show=edge >= edge_threshold,
        side="YES",
    )


def calculate_no_edge(market_yes_price: float, our_probability: float, edge_threshold: float = 0.10) -> EdgeResult:
    """Calculate edge for the NO side."""
    no_price = 100.0 - market_yes_price
    no_probability = 1.0 - our_probability
    result = calculate_edge(no_price, no_probability, edge_threshold)
    result.side = "NO"
    return result


def evaluate_market(
    market: KalshiMarket,
    estimate: ProbabilityEstimate,
    edge_threshold: float = 0.10,
) -> Optional[Opportunity]:
    """Evaluate a market and return an Opportunity if edge >= threshold on either side."""
    yes_edge = calculate_edge(market.yes_price, estimate.probability, edge_threshold)
    no_edge = calculate_no_edge(market.yes_price, estimate.probability, edge_threshold)

    best = yes_edge if yes_edge.edge >= no_edge.edge else no_edge

    if not best.show:
        return None

    # Never show LOW confidence
    if estimate.confidence_tier == ConfidenceTier.LOW:
        return None

    return Opportunity(
        market=market,
        estimate=estimate,
        yes_edge=yes_edge,
        no_edge=no_edge,
        best_edge=best,
    )
