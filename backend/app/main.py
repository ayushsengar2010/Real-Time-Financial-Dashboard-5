from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio

from .config import settings
from .database import engine, Base
from .api import auth, portfolios, market, ai, alerts

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Financial Dashboard API",
    description="Real-time financial insights and portfolio management",
    version="1.0.0"
)

# CORS middleware
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
]
if settings.debug:
    origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(portfolios.router, prefix="/api/v1")
app.include_router(market.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/market")
async def websocket_market_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Send market updates every 5 seconds
            await asyncio.sleep(5)
            market_data = {
                "type": "market_update",
                "timestamp": "2024-01-01T00:00:00Z",
                "data": {
                    "AAPL": {"price": 150.25, "change": 1.2},
                    "GOOGL": {"price": 2800.50, "change": -0.8},
                    "MSFT": {"price": 300.75, "change": 0.5}
                }
            }
            await websocket.send_text(json.dumps(market_data))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def root():
    return {
        "message": "Financial Dashboard API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    ) 