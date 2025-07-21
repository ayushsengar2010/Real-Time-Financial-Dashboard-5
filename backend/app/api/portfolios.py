from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, Portfolio, Holding
from ..schemas import PortfolioCreate, Portfolio as PortfolioSchema, HoldingCreate, Holding as HoldingSchema
from ..auth import get_current_active_user
from ..services.market_data import market_data_service

router = APIRouter(prefix="/portfolios", tags=["portfolios"])

@router.post("/", response_model=PortfolioSchema)
async def create_portfolio(
    portfolio: PortfolioCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new portfolio"""
    db_portfolio = Portfolio(
        **portfolio.dict(),
        user_id=current_user.id
    )
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio

@router.get("/", response_model=List[PortfolioSchema])
async def get_portfolios(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all portfolios for current user"""
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    return portfolios

@router.get("/{portfolio_id}", response_model=PortfolioSchema)
async def get_portfolio(
    portfolio_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific portfolio"""
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    return portfolio

@router.post("/{portfolio_id}/holdings", response_model=HoldingSchema)
async def add_holding(
    portfolio_id: int,
    holding: HoldingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a holding to a portfolio"""
    # Verify portfolio belongs to user
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    db_holding = Holding(
        **holding.dict(),
        portfolio_id=portfolio_id
    )
    db.add(db_holding)
    db.commit()
    db.refresh(db_holding)
    return db_holding

@router.get("/{portfolio_id}/holdings", response_model=List[HoldingSchema])
async def get_holdings(
    portfolio_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all holdings for a portfolio"""
    # Verify portfolio belongs to user
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio_id).all()
    return holdings

@router.get("/{portfolio_id}/value")
async def get_portfolio_value(
    portfolio_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current portfolio value with market data"""
    # Verify portfolio belongs to user
    portfolio = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id,
        Portfolio.user_id == current_user.id
    ).first()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    holdings = db.query(Holding).filter(Holding.portfolio_id == portfolio_id).all()
    
    # Convert to dict format for service
    holdings_data = [
        {
            "symbol": h.symbol,
            "quantity": h.quantity,
            "average_price": h.average_price
        }
        for h in holdings
    ]
    
    portfolio_value = await market_data_service.get_portfolio_value(holdings_data)
    
    return {
        "portfolio_id": portfolio_id,
        "portfolio_name": portfolio.name,
        **portfolio_value
    } 