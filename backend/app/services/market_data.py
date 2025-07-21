import finnhub
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from ..config import settings
import json

class MarketDataService:
    def __init__(self):
        self.symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX", "AMD", "INTC"]
        self.cache = {}
        self.cache_ttl = timedelta(minutes=10)
        self.finnhub_client = finnhub.Client(api_key="d1v45b1r01qo0ln2ealgd1v45b1r01qo0ln2eam0")
        print(f"--- Finnhub API Key Loaded: {"d1v45b1r01qo0ln2ealgd1v45b1r01qo0ln2eam0"} ---")

    async def get_market_data(self, symbol: str) -> Optional[Dict]:
        """Get current market data for a symbol using Finnhub, with caching."""
        now = datetime.utcnow()
        if symbol in self.cache:
            cached_data, timestamp = self.cache[symbol]
            if now - timestamp < self.cache_ttl:
                return cached_data

        try:
            # Finnhub API provides quote data which is perfect for this
            quote = self.finnhub_client.quote(symbol)
            
            if not quote or 'c' not in quote:
                return None

            price = quote.get('c') # Current price
            previous_close = quote.get('pc') # Previous close price
            high = quote.get('h')
            low = quote.get('l')
            open_price = quote.get('o')
            
            # Finnhub doesn't provide volume directly in the quote, so we can omit it or get it from another call
            # For simplicity, we'll set it to 0 for now.
            volume = 0 

            change = ((price - previous_close) / previous_close * 100) if price and previous_close else 0

            data = {
                "symbol": symbol,
                "price": round(price, 2) if price else None,
                "change": round(change, 2),
                "volume": volume,
                "timestamp": datetime.utcnow(),
                "high": round(high, 2) if high else None,
                "low": round(low, 2) if low else None,
                "open": round(open_price, 2) if open_price else None
            }
            self.cache[symbol] = (data, now)
            return data
        except Exception as e:
            print(f"An unexpected error occurred for {symbol} with Finnhub: {e}")
            if symbol in self.cache:
                return self.cache[symbol][0]
            return None

    async def get_historical_data(self, symbol: str, days: int = 30) -> List[Dict]:
        """Get historical market data using Finnhub"""
        # This part needs to be adjusted for Finnhub's API if you use it.
        # For now, returning empty list to avoid breaking the app.
        # You would typically use finnhub_client.stock_candles here.
        return []

    async def get_market_summary(self) -> Dict:
        """Get market summary for dashboard using Finnhub"""
        summary = {
            "total_symbols": len(self.symbols),
            "gainers": [],
            "losers": [],
            "most_active": []
        }
        
        # Using asyncio.gather to fetch all symbols concurrently
        tasks = [self.get_market_data(symbol) for symbol in self.symbols]
        all_data = await asyncio.gather(*tasks)
        
        all_data = [d for d in all_data if d is not None] # Filter out any failed lookups

        for data in all_data:
            if data.get("change", 0) > 0:
                summary["gainers"].append(data)
            else:
                summary["losers"].append(data)
        
        # Since Finnhub quote doesn't provide volume, we'll sort by price change for "most_active"
        summary["most_active"] = sorted(all_data, key=lambda x: abs(x.get("change", 0)), reverse=True)[:5]
        return summary
    
    async def get_portfolio_value(self, holdings: List[Dict]) -> Dict:
        """Calculate portfolio value based on current market prices"""
        total_value = 0
        holdings_data = []

        tasks = [self.get_market_data(holding["symbol"]) for holding in holdings]
        market_data_list = await asyncio.gather(*tasks)

        for i, holding in enumerate(holdings):
            market_data = market_data_list[i]
            
            if market_data and market_data.get("price") is not None:
                current_price = market_data["price"]
                current_value = current_price * holding["quantity"]
                total_value += current_value
                holdings_data.append({
                    "symbol": holding["symbol"],
                    "quantity": holding["quantity"],
                    "average_price": holding["average_price"],
                    "current_price": current_price,
                    "current_value": current_value,
                    "gain_loss": current_value - (holding["average_price"] * holding["quantity"]),
                    "gain_loss_percent": ((current_price - holding["average_price"]) / holding["average_price"] * 100) if current_price and holding.get("average_price", 0) > 0 else 0
                })
            else:
                holdings_data.append({
                    "symbol": holding["symbol"],
                    "quantity": holding["quantity"],
                    "average_price": holding["average_price"],
                    "current_price": None,
                    "current_value": None,
                    "gain_loss": None,
                    "gain_loss_percent": None
                })
        return {
            "total_value": round(total_value, 2),
            "holdings": holdings_data
        }

market_data_service = MarketDataService() 