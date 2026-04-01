from fastapi import APIRouter, Depends, Query
from ..auth import get_current_active_user
from ..models import User
from ..services.market_data import market_data_service

router = APIRouter(prefix="/market", tags=["market"])

@router.get("/data/{symbol}")
async def get_market_data(
    symbol: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get real-time market data for a symbol"""
    data = await market_data_service.get_market_data(symbol.upper())
    return data

@router.get("/data/{symbol}/historical")
async def get_historical_data(
    symbol: str,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_active_user)
):
    """Get historical market data for a symbol"""
    data = await market_data_service.get_historical_data(symbol.upper(), days)
    return {
        "symbol": symbol.upper(),
        "days": days,
        "data": data
    }

@router.get("/summary")
async def get_market_summary(
    current_user: User = Depends(get_current_active_user)
):
    """Get market summary for dashboard"""
    summary = await market_data_service.get_market_summary()
    return summary

@router.get("/symbols")
async def get_available_symbols(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available symbols"""
    return {
        "symbols": market_data_service.symbols,
        "count": len(market_data_service.symbols)
    }

@router.get("/providers")
async def get_provider_status(
    current_user: User = Depends(get_current_active_user)
):
    """Get market data provider health/status."""
    return market_data_service.provider_status()

@router.get("/heatmap")
async def get_sector_heatmap(
    current_user: User = Depends(get_current_active_user)
):
    """Get sector-level heatmap data."""
    return await market_data_service.get_sector_heatmap()

@router.get("/news")
async def get_market_news(
    symbols: str | None = Query(None, description="Comma separated symbols, e.g. AAPL,MSFT"),
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_active_user)
):
    """Get latest market news with lightweight sentiment classification."""
    symbol_list = [s.strip().upper() for s in symbols.split(",")] if symbols else None
    return await market_data_service.get_market_news(symbol_list, limit)
