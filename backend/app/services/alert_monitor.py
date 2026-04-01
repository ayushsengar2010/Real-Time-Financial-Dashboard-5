import asyncio
from datetime import datetime, timezone
from typing import Dict, Optional

from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import Alert, AlertEvent
from .market_data import market_data_service


class AlertMonitorService:
    def __init__(self):
        self.interval_seconds = 30
        self.cooldown_seconds = 180
        self._last_triggered: Dict[int, datetime] = {}
        self._task: Optional[asyncio.Task] = None
        self._running = False

    def _should_trigger(self, alert: Alert, market_data: Dict) -> bool:
        current_price = market_data.get("price")
        change = market_data.get("change", 0)
        if current_price is None:
            return False

        if alert.alert_type == "price_above":
            return current_price >= alert.threshold
        if alert.alert_type == "price_below":
            return current_price <= alert.threshold
        if alert.alert_type == "percentage_change":
            return abs(change) >= alert.threshold
        return False

    def _message(self, alert: Alert, market_data: Dict) -> str:
        current_price = market_data.get("price")
        change = market_data.get("change", 0)
        if alert.alert_type == "price_above":
            return f"{alert.symbol} crossed above {alert.threshold}. Current: {current_price}"
        if alert.alert_type == "price_below":
            return f"{alert.symbol} dropped below {alert.threshold}. Current: {current_price}"
        return f"{alert.symbol} moved {change}% (threshold {alert.threshold}%)"

    def _in_cooldown(self, alert_id: int) -> bool:
        last = self._last_triggered.get(alert_id)
        if not last:
            return False
        return (datetime.now(timezone.utc) - last).total_seconds() < self.cooldown_seconds

    async def check_alerts_once(self):
        db: Session = SessionLocal()
        try:
            alerts = db.query(Alert).filter(Alert.is_active.is_(True)).all()
            if not alerts:
                return

            symbol_cache: Dict[str, Optional[Dict]] = {}
            for alert in alerts:
                symbol = alert.symbol.upper()
                if symbol not in symbol_cache:
                    symbol_cache[symbol] = await market_data_service.get_market_data(symbol)
                market_data = symbol_cache[symbol]
                if not market_data:
                    continue
                if self._in_cooldown(alert.id):
                    continue
                if not self._should_trigger(alert, market_data):
                    continue

                event = AlertEvent(
                    user_id=alert.user_id,
                    alert_id=alert.id,
                    symbol=symbol,
                    alert_type=alert.alert_type,
                    threshold=alert.threshold,
                    current_price=market_data.get("price", 0),
                    change_percent=market_data.get("change"),
                    message=self._message(alert, market_data),
                )
                db.add(event)
                self._last_triggered[alert.id] = datetime.now(timezone.utc)

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Alert monitor check failed: {e}")
        finally:
            db.close()

    async def _loop(self):
        while self._running:
            await self.check_alerts_once()
            await asyncio.sleep(self.interval_seconds)

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())
        print("Alert monitor started.")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        print("Alert monitor stopped.")

    def status(self) -> Dict:
        return {
            "running": self._running,
            "interval_seconds": self.interval_seconds,
            "cooldown_seconds": self.cooldown_seconds,
            "tracked_alerts": len(self._last_triggered),
        }


alert_monitor_service = AlertMonitorService()
