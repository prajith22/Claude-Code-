"""Kalshi Edge Finder — single entry point serving FastAPI + HTMX dashboard."""

from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import uvicorn
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from diskcache import Cache
from dotenv import load_dotenv
from fastapi import FastAPI, Query, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from estimator import estimate_probability
from kalshi_client import fetch_kalshi_markets
from models import (
    DashboardState,
    FilterReason,
    FilteredMarket,
    Opportunity,
    evaluate_market,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
CACHE_DIR = BASE_DIR / ".cache"
CACHE_DIR.mkdir(exist_ok=True)

cache = Cache(str(CACHE_DIR))
state = DashboardState()

REFRESH_INTERVAL_MINUTES = 60


async def refresh_data(edge_threshold: float = 0.10) -> None:
    """Fetch markets, estimate probabilities, find edges."""
    logger.info("Starting data refresh...")
    try:
        markets, filtered, total_api_scanned = await fetch_kalshi_markets(cache)
    except Exception as e:
        logger.error("Failed to fetch Kalshi markets: %s", e)
        return

    opportunities: list[Opportunity] = []
    no_data_filtered: list[FilteredMarket] = []

    for market in markets:
        try:
            estimate = await estimate_probability(market, cache)
        except Exception as e:
            logger.warning("Estimation failed for %s: %s", market.market_id, e)
            estimate = None

        if estimate is None:
            no_data_filtered.append(FilteredMarket(
                title=market.title,
                reason=FilterReason.NO_DATA,
                market_id=market.market_id,
            ))
            continue

        opp = evaluate_market(market, estimate, edge_threshold)
        if opp is not None:
            opportunities.append(opp)

    all_filtered = filtered + no_data_filtered

    # Build filter breakdown
    breakdown: dict[str, int] = {}
    for f in all_filtered:
        key = f.reason.value
        breakdown[key] = breakdown.get(key, 0) + 1

    # Sort opportunities by edge descending
    opportunities.sort(key=lambda o: o.best_edge.edge, reverse=True)

    state.opportunities = opportunities
    state.filtered_markets = all_filtered[-50:]  # keep last 50
    state.total_scanned = total_api_scanned
    state.last_updated = datetime.now(timezone.utc)
    state.filter_breakdown = breakdown

    logger.info(
        "Refresh complete: %d scanned, %d filtered, %d opportunities",
        state.total_scanned,
        len(all_filtered),
        len(opportunities),
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start scheduler and run initial data load."""
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        refresh_data,
        "interval",
        minutes=REFRESH_INTERVAL_MINUTES,
        id="refresh",
        next_run_time=None,  # don't run immediately via scheduler
    )
    scheduler.start()

    # Initial load
    await refresh_data()

    yield

    scheduler.shutdown()
    cache.close()


app = FastAPI(title="Kalshi Edge Finder", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


# --- Template filters ---
def format_pct(value: float) -> str:
    return f"{value * 100:.1f}%"


def format_dollars(value: float, bankroll: float = 1000) -> str:
    return f"${value * bankroll:.2f}"


def edge_color(edge: float) -> str:
    if edge >= 0.20:
        return "text-green-400"
    if edge >= 0.15:
        return "text-green-500"
    if edge >= 0.10:
        return "text-yellow-400"
    return "text-gray-400"


def badge_color(category: str) -> str:
    if category == "WEATHER":
        return "bg-blue-600"
    if category == "ECONOMIC":
        return "bg-purple-600"
    return "bg-gray-600"


def confidence_color(tier: str) -> str:
    if tier == "HIGH":
        return "text-green-400"
    return "text-yellow-400"


templates.env.filters["format_pct"] = format_pct
templates.env.filters["format_dollars"] = format_dollars
templates.env.filters["edge_color"] = edge_color
templates.env.filters["badge_color"] = badge_color
templates.env.filters["confidence_color"] = confidence_color


# --- Routes ---

@app.get("/", response_class=HTMLResponse)
async def index(request: Request, bankroll: float = Query(1000), threshold: float = Query(0.10)):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "state": state,
        "bankroll": bankroll,
        "threshold": threshold,
        "refresh_minutes": REFRESH_INTERVAL_MINUTES,
    })


@app.get("/partials/opportunities", response_class=HTMLResponse)
async def opportunities_partial(request: Request, bankroll: float = Query(1000), threshold: float = Query(0.10)):
    """HTMX partial: re-render opportunity cards."""
    return templates.TemplateResponse("partials/opportunities.html", {
        "request": request,
        "state": state,
        "bankroll": bankroll,
        "threshold": threshold,
    })


@app.get("/partials/filtered", response_class=HTMLResponse)
async def filtered_partial(request: Request):
    """HTMX partial: filtered markets log."""
    return templates.TemplateResponse("partials/filtered.html", {
        "request": request,
        "filtered_markets": state.filtered_markets,
    })


@app.get("/partials/header", response_class=HTMLResponse)
async def header_partial(request: Request):
    """HTMX partial: header stats bar."""
    return templates.TemplateResponse("partials/header.html", {
        "request": request,
        "state": state,
    })


@app.post("/refresh")
async def trigger_refresh(threshold: float = Query(0.10)):
    """Manual refresh trigger."""
    await refresh_data(edge_threshold=threshold)
    return {"status": "ok", "opportunities": len(state.opportunities)}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
