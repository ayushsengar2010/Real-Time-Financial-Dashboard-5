import random
from typing import List, Dict, Optional
from datetime import datetime
from ..schemas import FinancialAnalysis

class AIService:
    def __init__(self):
        self.analysis_templates = {
            "market_analysis": [
                "Based on current market conditions, {symbol} shows {sentiment} momentum. The stock has {trend} over the past period with {volatility} volatility.",
                "Technical analysis indicates {symbol} is in a {position} position. Key support levels are at {support} and resistance at {resistance}.",
                "Fundamental analysis suggests {symbol} has {outlook} prospects due to {factors}."
            ],
            "portfolio_advice": [
                "Your portfolio shows {diversification} diversification. Consider {recommendations} to optimize your allocation.",
                "Risk assessment indicates {risk_level} exposure. Recommended actions: {actions}.",
                "Based on your holdings, you may want to {suggestions} to improve portfolio performance."
            ],
            "prediction": [
                "Short-term outlook for {symbol}: {prediction} with {confidence}% confidence.",
                "Expected price range for {symbol} in the next 30 days: ${low} - ${high}.",
                "Market sentiment analysis suggests {sentiment} for {symbol} in the coming weeks."
            ]
        }
    
    async def analyze_market(self, symbol: str, query: str) -> FinancialAnalysis:
        """Analyze market data and provide insights"""
        # Simulate AI analysis
        sentiment = random.choice(["bullish", "bearish", "neutral"])
        trend = random.choice(["upward", "downward", "sideways"])
        volatility = random.choice(["high", "moderate", "low"])
        
        analysis_text = self.analysis_templates["market_analysis"][0].format(
            symbol=symbol,
            sentiment=sentiment,
            trend=trend,
            volatility=volatility
        )
        
        recommendations = [
            f"Monitor {symbol} for breakout opportunities",
            "Consider setting stop-loss orders",
            "Review position sizing based on volatility"
        ]
        
        risk_assessment = f"{symbol} presents {random.choice(['low', 'medium', 'high'])} risk based on current market conditions."
        confidence_score = round(random.uniform(0.6, 0.95), 2)
        
        return FinancialAnalysis(
            query=query,
            analysis=analysis_text,
            recommendations=recommendations,
            risk_assessment=risk_assessment,
            confidence_score=confidence_score
        )
    
    async def analyze_portfolio(self, holdings: List[Dict], query: str) -> FinancialAnalysis:
        """Analyze portfolio and provide recommendations"""
        total_value = sum(h["current_value"] for h in holdings)
        diversification_score = len(holdings) / 10  # Simple diversification metric
        
        if diversification_score < 0.3:
            diversification = "low"
            recommendations = [
                "Consider diversifying across more sectors",
                "Add international exposure to your portfolio",
                "Include bonds or other fixed income assets"
            ]
        elif diversification_score < 0.7:
            diversification = "moderate"
            recommendations = [
                "Review sector allocation",
                "Consider rebalancing quarterly",
                "Monitor correlation between holdings"
            ]
        else:
            diversification = "good"
            recommendations = [
                "Maintain current diversification",
                "Focus on individual stock selection",
                "Consider tax-loss harvesting opportunities"
            ]
        
        analysis_text = self.analysis_templates["portfolio_advice"][0].format(
            diversification=diversification,
            recommendations=", ".join(recommendations[:2])
        )
        
        risk_level = random.choice(["low", "medium", "high"])
        actions = [
            "Review risk tolerance",
            "Consider hedging strategies",
            "Monitor market conditions"
        ]
        
        risk_assessment = f"Portfolio risk level: {risk_level}. Total value: ${total_value:,.2f}"
        confidence_score = round(random.uniform(0.7, 0.9), 2)
        
        return FinancialAnalysis(
            query=query,
            analysis=analysis_text,
            recommendations=recommendations,
            risk_assessment=risk_assessment,
            confidence_score=confidence_score
        )
    
    async def predict_price(self, symbol: str, timeframe: str = "30d") -> Dict:
        """Generate price predictions"""
        current_price = random.uniform(50, 500)
        volatility = random.uniform(0.05, 0.15)
        
        if timeframe == "7d":
            days = 7
        elif timeframe == "30d":
            days = 30
        else:
            days = 90
        
        # Simulate price prediction
        price_change = random.uniform(-volatility, volatility)
        predicted_price = current_price * (1 + price_change)
        
        prediction_text = self.analysis_templates["prediction"][0].format(
            symbol=symbol,
            prediction="bullish" if price_change > 0 else "bearish",
            confidence=round(random.uniform(60, 85))
        )
        
        return {
            "symbol": symbol,
            "current_price": round(current_price, 2),
            "predicted_price": round(predicted_price, 2),
            "predicted_change": round(price_change * 100, 2),
            "confidence": round(random.uniform(60, 85)),
            "analysis": prediction_text,
            "timeframe": timeframe
        }
    
    async def get_sentiment_analysis(self, symbol: str) -> Dict:
        """Analyze market sentiment for a symbol"""
        sentiments = ["positive", "negative", "neutral"]
        sentiment = random.choice(sentiments)
        
        factors = {
            "positive": ["strong earnings", "market leadership", "innovation"],
            "negative": ["market volatility", "regulatory concerns", "competition"],
            "neutral": ["stable performance", "market average", "mixed signals"]
        }
        
        return {
            "symbol": symbol,
            "sentiment": sentiment,
            "confidence": round(random.uniform(0.6, 0.9), 2),
            "factors": factors[sentiment],
            "timestamp": datetime.utcnow()
        }
    
    async def generate_insight(self, query: str, context: Optional[Dict] = None) -> str:
        """Generate general financial insights"""
        insights = [
            "Market volatility is expected to increase in the coming weeks. Consider defensive positioning.",
            "Technology stocks continue to show strong momentum. Focus on quality names with solid fundamentals.",
            "Diversification remains key in current market conditions. Review your asset allocation.",
            "Interest rate changes may impact growth stocks. Monitor Fed policy updates.",
            "Earnings season could provide trading opportunities. Watch for earnings surprises."
        ]
        
        return random.choice(insights)

# Global instance
ai_service = AIService() 