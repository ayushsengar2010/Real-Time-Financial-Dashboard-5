import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

import finnhub
import yfinance as yf

from ..config import settings


class MarketDataService:
    def __init__(self):
        self.symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX", "AMD", "INTC"]
        self.sectors = {
            "AAPL": "Technology",
            "GOOGL": "Communication Services",
            "MSFT": "Technology",
            "AMZN": "Consumer Discretionary",
            "TSLA": "Consumer Discretionary",
            "META": "Communication Services",
            "NVDA": "Technology",
            "NFLX": "Communication Services",
            "AMD": "Technology",
            "INTC": "Technology",
        }
        self.cache: Dict[str, Tuple[Dict, datetime]] = {}
        self.cache_ttl = timedelta(seconds=20)
        self.finnhub_client: Optional[finnhub.Client] = None

        if settings.finnhub_api_key:
            self.finnhub_client = finnhub.Client(api_key=settings.finnhub_api_key)
            print("Finnhub provider enabled.")
        else:
            print("FINNHUB_API_KEY not configured. Using yfinance as live data provider.")

    def provider_status(self) -> Dict:
        return {
            "finnhub_enabled": self.finnhub_client is not None,
            "yfinance_enabled": True,
            "cache_ttl_seconds": int(self.cache_ttl.total_seconds()),
        }

    def _normalize(self, symbol: str, quote: Dict, provider: str) -> Optional[Dict]:
        price = quote.get("c")
        previous_close = quote.get("pc")
        high = quote.get("h")
        low = quote.get("l")
        open_price = quote.get("o")
        volume = quote.get("v", 0)

        if price is None:
            return None

        change = ((price - previous_close) / previous_close * 100) if previous_close else 0
        return {
            "symbol": symbol,
            "price": round(float(price), 2),
            "change": round(float(change), 2),
            "volume": int(volume or 0),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "high": round(float(high), 2) if high is not None else None,
            "low": round(float(low), 2) if low is not None else None,
            "open": round(float(open_price), 2) if open_price is not None else None,
            "provider": provider,
        }

    def _finnhub_quote(self, symbol: str) -> Optional[Dict]:
        if not self.finnhub_client:
            return None
        quote = self.finnhub_client.quote(symbol)
        # Finnhub returns {"c":0,...} on bad symbols/rate limits
        if not quote or quote.get("c") in (None, 0):
            return None
        return self._normalize(symbol, quote, "finnhub")

    def _yfinance_quote(self, symbol: str) -> Optional[Dict]:
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info or {}

        last_price = info.get("last_price")
        prev_close = info.get("previous_close")
        day_high = info.get("day_high")
        day_low = info.get("day_low")
        day_open = info.get("open")
        volume = info.get("last_volume", 0)

        if last_price is None:
            history = ticker.history(period="1d", interval="1m")
            if history.empty:
                return None
            last_row = history.iloc[-1]
            last_price = float(last_row["Close"])
            day_high = float(history["High"].max())
            day_low = float(history["Low"].min())
            day_open = float(history.iloc[0]["Open"])
            volume = int(history["Volume"].fillna(0).sum())
            prev_close = prev_close or day_open

        quote = {
            "c": last_price,
            "pc": prev_close or last_price,
            "h": day_high if day_high is not None else last_price,
            "l": day_low if day_low is not None else last_price,
            "o": day_open if day_open is not None else last_price,
            "v": volume or 0,
        }
        return self._normalize(symbol, quote, "yfinance")

    async def _quote_from_providers(self, symbol: str) -> Optional[Dict]:
        # Try Finnhub first, then fallback to yfinance
        try:
            if self.finnhub_client:
                data = await asyncio.wait_for(asyncio.to_thread(self._finnhub_quote, symbol), timeout=4)
                if data:
                    return data
        except Exception as e:
            print(f"Finnhub fetch failed for {symbol}: {e}")

        try:
            return await asyncio.wait_for(asyncio.to_thread(self._yfinance_quote, symbol), timeout=6)
        except Exception as e:
            print(f"yfinance fetch failed for {symbol}: {e}")
            return None

    async def get_market_data(self, symbol: str) -> Optional[Dict]:
        now = datetime.now(timezone.utc)
        if symbol in self.cache:
            cached_data, timestamp = self.cache[symbol]
            if now - timestamp < self.cache_ttl:
                return cached_data

        data = await self._quote_from_providers(symbol)
        if data:
            self.cache[symbol] = (data, now)
            return data

        if symbol in self.cache:
            stale_data = self.cache[symbol][0]
            stale_data["stale"] = True
            return stale_data
        return None

    async def get_historical_data(self, symbol: str, days: int = 30) -> List[Dict]:
        def _load():
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=f"{days}d", interval="1d")
            points = []
            if hist.empty:
                return points
            for idx, row in hist.iterrows():
                points.append(
                    {
                        "date": idx.strftime("%Y-%m-%d"),
                        "open": round(float(row["Open"]), 2),
                        "high": round(float(row["High"]), 2),
                        "low": round(float(row["Low"]), 2),
                        "close": round(float(row["Close"]), 2),
                        "volume": int(row["Volume"]),
                    }
                )
            return points

        try:
            return await asyncio.to_thread(_load)
        except Exception as e:
            print(f"Historical fetch failed for {symbol}: {e}")
            return []

    async def get_market_summary(self) -> Dict:
        tasks = [self.get_market_data(symbol) for symbol in self.symbols]
        all_data = [d for d in await asyncio.gather(*tasks) if d is not None]

        gainers = [d for d in all_data if d.get("change", 0) > 0]
        losers = [d for d in all_data if d.get("change", 0) <= 0]
        most_active = sorted(all_data, key=lambda x: x.get("volume", 0), reverse=True)[:5]

        return {
            "total_symbols": len(self.symbols),
            "gainers": sorted(gainers, key=lambda x: x.get("change", 0), reverse=True),
            "losers": sorted(losers, key=lambda x: x.get("change", 0)),
            "most_active": most_active,
            "providers": self.provider_status(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

    async def get_sector_heatmap(self) -> Dict:
        tasks = [self.get_market_data(symbol) for symbol in self.symbols]
        all_data = [d for d in await asyncio.gather(*tasks) if d is not None]

        sector_map: Dict[str, List[Dict]] = {}
        for item in all_data:
            sector = self.sectors.get(item["symbol"], "Other")
            sector_map.setdefault(sector, []).append(item)

        sectors = []
        for sector, items in sector_map.items():
            avg_change = sum(i.get("change", 0) for i in items) / max(len(items), 1)
            sectors.append(
                {
                    "sector": sector,
                    "avg_change": round(avg_change, 2),
                    "stocks": sorted(items, key=lambda x: x.get("change", 0), reverse=True),
                    "count": len(items),
                }
            )

        sectors.sort(key=lambda x: x["avg_change"], reverse=True)
        return {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "sectors": sectors,
        }

    def _score_sentiment(self, title: str) -> int:
        positive_words = ["surge", "beats", "growth", "upgrade", "rally", "gain", "strong", "record", "outperform"]
        negative_words = ["drop", "miss", "downgrade", "fall", "weak", "cut", "loss", "lawsuit", "risk"]
        t = title.lower()
        score = 0
        for w in positive_words:
            if w in t:
                score += 1
        for w in negative_words:
            if w in t:
                score -= 1
        return score

    async def get_market_news(self, symbols: Optional[List[str]] = None, limit: int = 20) -> Dict:
        watch = symbols if symbols else self.symbols[:6]
        watch = [s.upper() for s in watch][:10]
        news_items = []

        def _fetch_symbol_news(symbol: str):
            ticker = yf.Ticker(symbol)
            raw = ticker.news or []
            return raw[:8]

        for symbol in watch:
            try:
                entries = await asyncio.wait_for(asyncio.to_thread(_fetch_symbol_news, symbol), timeout=6)
                for n in entries:
                    title = n.get("title") or "Untitled"
                    link = n.get("link") or ""
                    publisher = n.get("publisher") or "Unknown"
                    ts = n.get("providerPublishTime")
                    published_at = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if isinstance(ts, (int, float)) else None
                    score = self._score_sentiment(title)
                    news_items.append(
                        {
                            "symbol": symbol,
                            "title": title,
                            "publisher": publisher,
                            "link": link,
                            "published_at": published_at,
                            "sentiment_score": score,
                            "sentiment": "positive" if score > 0 else "negative" if score < 0 else "neutral",
                        }
                    )
            except Exception as e:
                print(f"News fetch failed for {symbol}: {e}")

        news_items = sorted(news_items, key=lambda x: x.get("published_at") or "", reverse=True)[:limit]
        overall_score = sum(i["sentiment_score"] for i in news_items)
        overall = "positive" if overall_score > 0 else "negative" if overall_score < 0 else "neutral"

        return {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "overall_sentiment": overall,
            "overall_score": overall_score,
            "count": len(news_items),
            "items": news_items,
        }

    async def get_portfolio_value(self, holdings: List[Dict]) -> Dict:
        total_value = 0.0
        holdings_data = []

        tasks = [self.get_market_data(holding["symbol"]) for holding in holdings]
        market_data_list = await asyncio.gather(*tasks)

        for i, holding in enumerate(holdings):
            market_data = market_data_list[i]

            if market_data and market_data.get("price") is not None:
                current_price = market_data["price"]
                current_value = current_price * holding["quantity"]
                total_value += current_value
                cost_basis = holding["average_price"] * holding["quantity"]
                gain_loss = current_value - cost_basis
                gain_loss_percent = ((current_price - holding["average_price"]) / holding["average_price"] * 100) if holding["average_price"] > 0 else 0
                holdings_data.append(
                    {
                        "symbol": holding["symbol"],
                        "quantity": holding["quantity"],
                        "average_price": holding["average_price"],
                        "current_price": current_price,
                        "current_value": round(current_value, 2),
                        "gain_loss": round(gain_loss, 2),
                        "gain_loss_percent": round(gain_loss_percent, 2),
                        "provider": market_data.get("provider", "unknown"),
                    }
                )
            else:
                holdings_data.append(
                    {
                        "symbol": holding["symbol"],
                        "quantity": holding["quantity"],
                        "average_price": holding["average_price"],
                        "current_price": None,
                        "current_value": None,
                        "gain_loss": None,
                        "gain_loss_percent": None,
                        "provider": "unavailable",
                    }
                )

        return {"total_value": round(total_value, 2), "holdings": holdings_data}


market_data_service = MarketDataService()
