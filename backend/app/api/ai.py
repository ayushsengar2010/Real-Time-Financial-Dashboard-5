from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from ..auth import get_current_active_user
from ..database import get_db
from ..models import User, Holding, AIInsight
from ..schemas import FinancialQuery, FinancialAnalysis
from ..services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/analyze", response_model=FinancialAnalysis)
async def analyze_market(
    query: FinancialQuery,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Analyze market data and provide AI insights"""
    # Restrict to stock/trading/finance topics
    allowed_keywords = [
        'stock', 'stocks', 'trading', 'market', 'markets', 'portfolio', 'equity', 'share', 'investment', 'invest', 'finance', 'financial', 'nasdaq', 'nyse', 'nifty', 'sensex', 'mutual fund', 'etf', 'bond', 'dividend', 'option', 'futures', 'commodities', 'forex', 'currency', 'crypto', 'bitcoin', 'bull', 'bear', 'price', 'volume', 'chart', 'analysis', 'prediction', 'gains', 'losses', 'broker', 'exchange', 'ipo', 'earnings', 'valuation', 'fundamental', 'technical', 'trend', 'risk', 'return', 'asset', 'allocation', 'index', 'indices', 'securities', 'derivative', 'order', 'buy', 'sell', 'short', 'long', 'margin', 'stop loss', 'limit', 'order book', 'liquidity', 'volatility', 'capital', 'yield', 'sector', 'industry', 'diversification', 'rebalancing', 'hedge', 'leverage', 'inflation', 'interest rate', 'fed', 'federal reserve', 'central bank', 'macroeconomics', 'microeconomics', 'economic', 'gdp', 'cpi', 'unemployment', 'growth', 'recession', 'bubble', 'crash', 'recovery', 'bullish', 'bearish', 'uptrend', 'downtrend', 'sideways', 'support', 'resistance', 'stop', 'limit', 'order', 'bid', 'ask', 'spread', 'liquidity', 'volatility', 'volume', 'turnover', 'float', 'split', 'reverse split', 'buyback', 'insider', 'institutional', 'retail', 'sentiment', 'news', 'catalyst', 'event', 'calendar', 'dividend', 'yield', 'payout', 'ex-dividend', 'record date', 'payable date', 'split', 'reverse split', 'buyback', 'insider', 'institutional', 'retail', 'sentiment', 'news', 'catalyst', 'event', 'calendar', 'dividend', 'yield', 'payout', 'ex-dividend', 'record date', 'payable date'
    ]
    q = query.query.lower()
    if not any(word in q for word in allowed_keywords):
        refusal = FinancialAnalysis(
            query=query.query,
            analysis="Sorry, I can only answer questions about stocks, trading, or financial markets.",
            recommendations=[],
            risk_assessment="",
            confidence_score=0.0
        )
        # Save refusal to database
        db_insight = AIInsight(
            user_id=current_user.id,
            query=query.query,
            response=refusal.analysis
        )
        db.add(db_insight)
        db.commit()
        return refusal
    if query.symbols and len(query.symbols) > 0:
        # Analyze specific symbols
        analysis = await ai_service.analyze_market(query.symbols[0], query.query)
    else:
        # Generate general insight
        analysis = FinancialAnalysis(
            query=query.query,
            analysis=await ai_service.generate_insight(query.query),
            recommendations=["Monitor market conditions", "Review portfolio allocation"],
            risk_assessment="General market risk assessment",
            confidence_score=0.75
        )
    
    # Save insight to database
    db_insight = AIInsight(
        user_id=current_user.id,
        query=query.query,
        response=analysis.analysis
    )
    db.add(db_insight)
    db.commit()
    
    return analysis

@router.post("/analyze-portfolio", response_model=FinancialAnalysis)
async def analyze_portfolio(
    portfolio_id: int,
    query: FinancialQuery,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Analyze user's portfolio and provide recommendations"""
    # Get portfolio holdings
    holdings = db.query(Holding).filter(
        Holding.portfolio_id == portfolio_id
    ).all()
    
    if not holdings:
        raise HTTPException(status_code=404, detail="No holdings found in portfolio")
    
    # Convert to dict format
    holdings_data = [
        {
            "symbol": h.symbol,
            "quantity": h.quantity,
            "average_price": h.average_price,
            "current_value": 0  # Will be calculated by service
        }
        for h in holdings
    ]
    
    analysis = await ai_service.analyze_portfolio(holdings_data, query.query)
    
    # Save insight to database
    db_insight = AIInsight(
        user_id=current_user.id,
        query=query.query,
        response=analysis.analysis
    )
    db.add(db_insight)
    db.commit()
    
    return analysis

@router.get("/predict/{symbol}")
async def predict_price(
    symbol: str,
    timeframe: str = Query("30d", regex="^(7d|30d|90d)$"),
    current_user: User = Depends(get_current_active_user)
):
    """Get price prediction for a symbol"""
    prediction = await ai_service.predict_price(symbol.upper(), timeframe)
    return prediction

@router.get("/sentiment/{symbol}")
async def get_sentiment(
    symbol: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get sentiment analysis for a symbol"""
    sentiment = await ai_service.get_sentiment_analysis(symbol.upper())
    return sentiment

@router.get("/insights")
async def get_user_insights(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's AI insights history"""
    insights = db.query(AIInsight).filter(
        AIInsight.user_id == current_user.id
    ).order_by(AIInsight.created_at.desc()).limit(limit).all()
    
    return insights 