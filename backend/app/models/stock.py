from pydantic import BaseModel, Field
from datetime import date
from typing import Optional

class StockBase(BaseModel):
    symbol: str = Field(..., description="Stock symbol, e.g. NABIL")
    name: str = Field(..., description="Full security name")
    sector: Optional[str] = Field(None, description="Market sector name")
    category: Optional[str] = Field(None, description="Instrument type category")

class StockCreate(StockBase):
    pass

class StockResponse(StockBase):
    class Config:
        from_attributes = True

class DailyDataBase(BaseModel):
    symbol: str
    date: date
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    ltp: Optional[float] = None
    volume: Optional[int] = 0
    turnover: Optional[float] = 0.0
    transactions: Optional[int] = 0
    point_change: Optional[float] = 0.0
    percentage_change: Optional[float] = 0.0

class DailyDataCreate(DailyDataBase):
    pass

class DailyDataResponse(DailyDataBase):
    id: int

    class Config:
        from_attributes = True
