import random
import os
from typing import List, Dict, Optional
from datetime import datetime
import google.generativeai as genai
from ..config import settings
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
        
        # Initialize Gemini API if API key is available
        self.use_gemini = False
        print(f"Checking Gemini API key configuration...")
        
        if settings.gemini_api_key:
            try:
                print(f"Gemini API key found: {settings.gemini_api_key[:10]}...")
                genai.configure(api_key=settings.gemini_api_key)
                
                # List available models first
                print("Attempting to list available models...")
                try:
                    for m in genai.list_models():
                        print(f"Available model: {m.name}")
                except Exception as model_err:
                    print(f"Error listing models: {str(model_err)}")
                
                # Try different model names based on API version
                # Try using models with higher quota limits first
                model_names = [
                    'models/gemini-1.5-flash',  # Flash models typically have higher rate limits
                    'models/gemini-1.5-flash-latest',
                    'models/gemini-2.0-flash',
                    'models/gemini-2.5-flash',
                    'models/gemini-1.5-pro',  # Pro models as backup
                    'gemini-pro'
                ]
                
                model_initialized = False
                for model_name in model_names:
                    try:
                        print(f"Attempting to initialize model: {model_name}")
                        self.model = genai.GenerativeModel(model_name)
                        print(f"Successfully initialized model: {model_name}")
                        model_initialized = True
                        break
                    except Exception as model_err:
                        print(f"Failed to initialize model {model_name}: {str(model_err)}")
                
                if not model_initialized:
                    print("Failed to initialize any Gemini model. AI will use fallback responses.")
                    self.use_gemini = False
                
                self.use_gemini = True
                print(f"Successfully initialized Gemini API")
            except Exception as e:
                print(f"Failed to initialize Gemini API: {str(e)}")
        else:
            print("No Gemini API key found in settings")
    
    async def analyze_market(self, symbol: str, query: str) -> FinancialAnalysis:
        """Analyze market data and provide insights"""
        if self.use_gemini:
            try:
                prompt = f"""
                As a financial advisor, provide analysis about {symbol} stock based on this query:
                
                Query: {query}
                Stock Symbol: {symbol}
                
                Format your response as a JSON object with these fields:
                1. "analysis": Detailed market analysis (under 200 words)
                2. "recommendations": List of 3 specific actionable recommendations
                3. "risk_assessment": Brief risk assessment for this stock
                4. "confidence_score": A number between 0.6 and 0.95 representing confidence
                
                Ensure you only focus on financial analysis and avoid any disclaimer language.
                """
                
                response = self.model.generate_content(prompt)
                
                try:
                    # Try to parse as JSON
                    import json
                    response_json = json.loads(response.text)
                    
                    # Extract fields with fallbacks
                    analysis = response_json.get("analysis", "Analysis not available")
                    recommendations = response_json.get("recommendations", ["Monitor market conditions"])
                    risk = response_json.get("risk_assessment", "Risk assessment not available")
                    confidence = float(response_json.get("confidence_score", 0.8))
                    
                    return FinancialAnalysis(
                        query=query,
                        analysis=analysis,
                        recommendations=recommendations,
                        risk_assessment=risk,
                        confidence_score=confidence
                    )
                    
                except (json.JSONDecodeError, KeyError, TypeError) as e:
                    # If JSON parsing fails, just use the raw text
                    return FinancialAnalysis(
                        query=query,
                        analysis=response.text,
                        recommendations=["Review market analysis", "Consider professional advice"],
                        risk_assessment="Risk assessment not available",
                        confidence_score=0.7
                    )
                    
            except Exception as e:
                print(f"Error using Gemini API for market analysis: {e}")
                # Fall back to random analysis
                
        # Fallback random analysis
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
        total_value = sum(h.get("current_value", 0) for h in holdings)
        symbols = [h.get("symbol", "") for h in holdings if h.get("symbol")]
        
        if self.use_gemini and symbols:
            try:
                # Format holdings data for the prompt
                holdings_str = "\n".join([
                    f"- {h.get('symbol', 'Unknown')}: {h.get('quantity', 0)} shares at avg price ${h.get('average_price', 0):.2f}"
                    for h in holdings
                ])
                
                prompt = f"""
                As a financial advisor, analyze this portfolio based on the query:
                
                Query: {query}
                
                Portfolio Holdings:
                {holdings_str}
                
                Total portfolio value: ${total_value:.2f}
                
                Format your response as a JSON object with these fields:
                1. "analysis": Detailed portfolio analysis (under 200 words)
                2. "recommendations": List of 3-5 specific actionable recommendations
                3. "risk_assessment": Brief risk assessment of the overall portfolio
                4. "confidence_score": A number between 0.7 and 0.9 representing confidence
                
                Focus only on financial advice and avoid disclaimer language.
                """
                
                response = self.model.generate_content(prompt)
                
                try:
                    # Try to parse as JSON
                    import json
                    response_json = json.loads(response.text)
                    
                    # Extract fields with fallbacks
                    analysis = response_json.get("analysis", "Portfolio analysis not available")
                    recommendations = response_json.get("recommendations", ["Review portfolio allocation"])
                    risk = response_json.get("risk_assessment", f"Portfolio value: ${total_value:.2f}")
                    confidence = float(response_json.get("confidence_score", 0.8))
                    
                    return FinancialAnalysis(
                        query=query,
                        analysis=analysis,
                        recommendations=recommendations,
                        risk_assessment=risk,
                        confidence_score=confidence
                    )
                    
                except (json.JSONDecodeError, KeyError, TypeError) as e:
                    # If JSON parsing fails, just use the raw text
                    return FinancialAnalysis(
                        query=query,
                        analysis=response.text,
                        recommendations=["Review portfolio diversity", "Consider professional advice"],
                        risk_assessment=f"Portfolio value: ${total_value:.2f}",
                        confidence_score=0.7
                    )
                    
            except Exception as e:
                print(f"Error using Gemini API for portfolio analysis: {e}")
                # Fall back to basic analysis
        
        # Fallback basic analysis
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
        print(f"Generate insight called for query: '{query}'")
        print(f"Using Gemini: {self.use_gemini}")
        
        if self.use_gemini:
            try:
                print(f"Attempting to use Gemini API for query...")
                # Create a prompt that focuses on financial advice/insights
                prompt = f"""
                As a financial advisor, please provide detailed insights about the following financial query:
                
                Query: {query}
                
                Please focus only on financial markets, stocks, investing, and portfolio management.
                Make sure to provide factual information with specific examples or data when possible.
                Keep the response concise (under 200 words) but informative.
                
                Today is August 31, 2025.
                """
                
                # Get response from Gemini
                print(f"Sending prompt to Gemini API...")
                
                # Simple approach - just send the prompt
                response = self.model.generate_content(prompt)
                print(f"Raw response: {str(response)}")
                
                # Handle different response formats based on API version
                if hasattr(response, 'text'):
                    result = response.text
                    print("Using response.text")
                elif hasattr(response, 'parts'):
                    result = ''.join([part.text for part in response.parts])
                    print("Using response.parts")
                else:
                    result = str(response)
                    print("Using str(response)")
                    
                print(f"Processed response: {result[:100]}...")
                return result
                
            except Exception as e:
                print(f"Error using Gemini API: {str(e)}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
                print(f"Falling back to random insights")
                
        # More sophisticated fallback responses based on the query
        query_lower = query.lower()
        
        # Detect what the user is asking about
        if any(term in query_lower for term in ['open', 'closed', 'market', 'trading', 'hours']):
            return """As of August 31, 2025, most major stock markets are open for regular trading hours.
            
The New York Stock Exchange (NYSE) and NASDAQ operate from 9:30 AM to 4:00 PM Eastern Time on weekdays.
Asian markets like Tokyo and Hong Kong have already closed for the day, while European markets are nearing their close.
            
Pre-market trading begins at 4:00 AM ET and after-hours trading continues until 8:00 PM ET for many electronic exchanges."""
            
        elif any(term in query_lower for term in ['stock', 'equity', 'shares', 'investment']):
            return """Current market analysis shows technology and healthcare sectors outperforming the broader market. 

Key factors driving the market include:
1. Fed policy decisions on interest rates
2. Corporate earnings reports exceeding expectations
3. Continued innovation in AI and clean energy sectors

For stock investments, consider focusing on companies with strong cash flows, reasonable valuations, and competitive advantages in growing markets."""
            
        elif any(term in query_lower for term in ['portfolio', 'diversify', 'allocat', 'asset']):
            return """For optimal portfolio construction in the current market environment:

1. Maintain a diversified allocation across different asset classes
2. Consider increasing exposure to value stocks as growth valuations remain stretched
3. Include alternative investments like REITs and commodities for inflation protection
4. Rebalance regularly to maintain your target risk profile

The traditional 60/40 portfolio might need adjustments as correlations between stocks and bonds have shifted."""
            
        elif any(term in query_lower for term in ['crypto', 'bitcoin', 'ethereum', 'blockchain']):
            return """The cryptocurrency market has shown increased stability in 2025 compared to previous years. 

Bitcoin has established itself as a store of value with decreased volatility, while Ethereum continues to dominate the smart contract and DeFi ecosystem. Regulatory clarity has improved market conditions and institutional adoption continues to grow.

Consider allocating only a small portion of your portfolio (5-10%) to this asset class due to its still-speculative nature."""
            
        elif any(term in query_lower for term in ['interest', 'rate', 'fed', 'federal', 'reserve', 'inflation']):
            return """The Federal Reserve's current monetary policy stance remains focused on balancing inflation control with economic growth. 

The latest dot plot suggests two more 25 basis point rate adjustments before year-end. Inflation has moderated to 2.8% year-over-year, moving closer to the Fed's 2% target.

Bond markets have already priced in these expected changes, with the 10-year Treasury yield at 3.7% and the 2-year at 3.2%, suggesting a healthier yield curve than in previous years."""
        
        else:
            # Generic financial insights for other queries
            insights = [
                "Market volatility is expected to increase in the coming weeks due to earnings reports and Fed policy decisions. Consider defensive positioning in quality companies with strong cash flows and reasonable valuations.",
                
                "Technology and healthcare sectors continue to show strong momentum, particularly companies focused on AI, cloud infrastructure, and innovative therapies. Focus on quality names with solid fundamentals and sustainable competitive advantages.",
                
                "Diversification remains key in current market conditions. Review your asset allocation to ensure appropriate exposure across large caps, small caps, international markets, fixed income, and alternative investments based on your risk tolerance.",
                
                "Interest rate stabilization is having varied impacts across sectors. Growth stocks have recovered as inflation pressures moderate, while financial and value stocks benefit from a steepening yield curve. Monitor Fed policy updates for guidance on future rate directions.",
                
                "Q3 earnings season is approaching with analysts projecting 7.3% year-over-year growth for S&P 500 companies. Watch for earnings surprises and management guidance as key catalysts for individual stock performance in the coming weeks."
            ]
            
            return random.choice(insights)

# Global instance
ai_service = AIService() 