from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Any
from app.services.live_market_service import LiveMarketService
from app.repositories.stock_repository import StockRepository
from app.services.daily_sync_service import DailySyncService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency providers
def get_live_market_service() -> LiveMarketService:
    return LiveMarketService()

def get_stock_repository() -> StockRepository:
    return StockRepository()

def get_sync_service(
    live_service: LiveMarketService = Depends(get_live_market_service),
    repo: StockRepository = Depends(get_stock_repository)
) -> DailySyncService:
    return DailySyncService(live_service, repo)

@router.get("/status")
async def get_market_status(live_service: LiveMarketService = Depends(get_live_market_service)):
    """Check if the NEPSE market is currently open or closed."""
    try:
        is_open = await live_service.is_market_open()
        return {"isOpen": "OPEN" if is_open else "CLOSED"}
    except Exception as e:
        logger.error(f"Error checking market status: {e}")
        return {"isOpen": "CLOSED", "error": str(e)}

@router.get("/live")
async def get_live_market_data(
    live_service: LiveMarketService = Depends(get_live_market_service),
    repo: StockRepository = Depends(get_stock_repository)
):
    """
    Get live NEPSE price updates mapped to the frontend asset structure.
    Formats assets so they can drop directly into next.js state.
    """
    try:
        raw_live = []
        try:
            raw_live = await live_service.get_live_market()
        except Exception as e:
            logger.warning(f"Error fetching live market data from NEPSE API: {e}. Falling back to Supabase DB.")

        # If the market is closed, live call failed, or no live data is returned, fall back to FeinTra latest records
        if not raw_live:
            logger.info("Live market data not available. Fetching last closing prices from Supabase DB...")
            try:
                latest_res = repo.client.table("FeinTra").select("Date").order("Date", desc=True).limit(1).execute()
                if latest_res.data:
                    latest_date = latest_res.data[0]["Date"]
                    db_res = repo.client.table("FeinTra").select("*").eq("Date", latest_date).limit(1000).execute()
                    for r in (db_res.data or []):
                        symbol = r.get("Symbol")
                        if not symbol:
                            continue
                        
                        vol_str = r.get("Volume")
                        vol = 0
                        if vol_str:
                            try:
                                vol = int(float(vol_str))
                            except Exception:
                                pass
                        
                        to_str = r.get("Turn Over")
                        turnover = 0.0
                        if to_str and to_str != "-":
                            try:
                                turnover = float(to_str)
                            except Exception:
                                pass
                        
                        pct_str = r.get("Percent Change", "0.00 %").replace("%", "").strip()
                        try:
                            pct = float(pct_str)
                        except Exception:
                            pct = 0.0

                        raw_live.append({
                            "symbol": symbol.strip().upper(),
                            "securityName": symbol.strip().upper(),
                            "lastTradedPrice": float(r.get("Close") or 0.0),
                            "percentageChange": pct,
                            "totalTradeQuantity": vol,
                            "highPrice": float(r.get("High") or r.get("Close") or 0.0),
                            "lowPrice": float(r.get("Low") or r.get("Close") or 0.0),
                            "openPrice": float(r.get("Open") or r.get("Close") or 0.0),
                            "previousClose": float(r.get("Close") or 0.0) - (float(r.get("Close") or 0.0) * pct / 100.0),
                            "totalTradeValue": turnover
                        })
            except Exception as db_err:
                logger.error(f"Error fetching fallback prices from Supabase: {db_err}")

        formatted_assets = []
        for item in raw_live:
            symbol = item.get("symbol")
            if not symbol:
                continue
            
            ltp = item.get("lastTradedPrice", 0.0)
            change = item.get("percentageChange", 0.0)
            
            formatted_assets.append({
                "symbol": symbol.strip().upper(),
                "name": item.get("securityName") or symbol,
                "exchange": "NEPSE",
                "category": "NEPSE",
                "price": float(ltp) if ltp else 0.0,
                "change": float(change) if change else 0.0,
                "volatility": 0.20,
                "volume": int(item.get("totalTradeQuantity") or 0),
                "high": float(item.get("highPrice") or ltp),
                "low": float(item.get("lowPrice") or ltp),
                "open": float(item.get("openPrice") or ltp),
                "previousClose": float(item.get("previousClose") or ltp),
                "turnover": float(item.get("totalTradeValue") or 0.0)
            })
            
        return formatted_assets
    except Exception as e:
        logger.error(f"Error fetching live market data: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch live prices.")

@router.get("/list")
async def get_all_registered_stocks(repo: StockRepository = Depends(get_stock_repository)):
    """Get list of all registered NEPSE companies from database metadata."""
    try:
        stocks = repo.get_all_stocks()
        return stocks
    except Exception as e:
        logger.error(f"Error getting stock list: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch stocks list.")

@router.get("/{symbol}/history")
async def get_stock_history(
    symbol: str,
    limit: int = 1500,
    repo: StockRepository = Depends(get_stock_repository)
):
    """Fetch historical daily logs for a given symbol from Supabase (used for charting)."""
    try:
        history = repo.get_historical_data(symbol, limit)
        if not history:
            return []
        return history
    except Exception as e:
        logger.error(f"Error fetching stock history for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch history for {symbol}.")

@router.post("/sync")
async def trigger_manual_sync(
    background_tasks: BackgroundTasks,
    sync_service: DailySyncService = Depends(get_sync_service)
):
    """Manually trigger daily sync in the background (helpful for debugging/manual updates)."""
    try:
        background_tasks.add_task(sync_service.sync_daily_prices)
        return {"status": "Sync triggered", "message": "NEPSE daily price sync running in background."}
    except Exception as e:
        logger.error(f"Error triggering manual sync: {e}")
        raise HTTPException(status_code=500, detail="Failed to trigger manual sync.")
