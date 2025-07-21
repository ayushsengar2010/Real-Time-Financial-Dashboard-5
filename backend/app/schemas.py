from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Portfolio schemas
class PortfolioBase(BaseModel):
    name: str
    description: Optional[str] = None

class PortfolioCreate(PortfolioBase):
    pass

class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Portfolio(PortfolioBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Holding schemas
class HoldingBase(BaseModel):
    symbol: str
    quantity: float
    average_price: float

class HoldingCreate(HoldingBase):
    pass

class HoldingUpdate(BaseModel):
    quantity: Optional[float] = None
    average_price: Optional[float] = None

class Holding(HoldingBase):
    id: int
    portfolio_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Market data schemas
class MarketDataBase(BaseModel):
    symbol: str
    price: float
    volume: float
    data: Optional[dict] = None

class MarketData(MarketDataBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Alert schemas
class AlertBase(BaseModel):
    symbol: str
    alert_type: str
    threshold: float

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    alert_type: Optional[str] = None
    threshold: Optional[float] = None
    is_active: Optional[bool] = None

class Alert(AlertBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# AI Insight schemas
class AIInsightBase(BaseModel):
    query: str

class AIInsightCreate(AIInsightBase):
    pass

class AIInsight(AIInsightBase):
    id: int
    user_id: int
    response: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Financial analysis schemas
class FinancialQuery(BaseModel):
    query: str
    symbols: Optional[List[str]] = None

class FinancialAnalysis(BaseModel):
    query: str
    analysis: str
    recommendations: List[str]
    risk_assessment: str
    confidence_score: float 