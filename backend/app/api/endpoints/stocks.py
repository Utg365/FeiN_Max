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
        # 1. Fetch base stock list and last closing prices from Supabase (FeinTra)
        db_assets = {}
        try:
            # Fetch the latest 2000 records from FeinTra sorted by Date desc to ensure we get the latest record of all symbols
            db_res = repo.client.table("FeinTra").select("*").order("Date", desc=True).limit(2000).execute()
            for r in (db_res.data or []):
                symbol = r.get("Symbol")
                if not symbol:
                    continue
                
                symbol_upper = symbol.strip().upper()
                # Since we sort by Date desc, the first record we encounter for each symbol is its latest one
                if symbol_upper in db_assets:
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

                close_price = float(r.get("Close") or 0.0)

                db_assets[symbol_upper] = {
                    "symbol": symbol_upper,
                    "name": symbol_upper,
                    "exchange": "NEPSE",
                    "category": "NEPSE",
                    "price": close_price,
                    "change": pct,
                    "volatility": 0.20,
                    "volume": vol,
                    "high": float(r.get("High") or close_price),
                    "low": float(r.get("Low") or close_price),
                    "open": float(r.get("Open") or close_price),
                    "previousClose": close_price - (close_price * pct / 100.0),
                    "turnover": turnover
                }
        except Exception as db_err:
            logger.error(f"Error fetching base prices from Supabase: {db_err}")

        # 2. Fetch live updates if available from NEPSE API
        raw_live = []
        try:
            raw_live = await live_service.get_live_market()
        except Exception as e:
            logger.warning(f"Error fetching live market data from NEPSE API: {e}")

        # 3. Merge live market data on top of the base database assets
        for item in raw_live:
            symbol = item.get("symbol")
            if not symbol:
                continue
            symbol_upper = symbol.strip().upper()
            
            ltp = item.get("lastTradedPrice")
            change = item.get("percentageChange")
            vol = item.get("totalTradeQuantity")
            high = item.get("highPrice")
            low = item.get("lowPrice")
            open_p = item.get("openPrice")
            prev_close = item.get("previousClose")
            turnover = item.get("totalTradeValue")
            name = item.get("securityName") or symbol_upper

            price_val = float(ltp) if ltp is not None else 0.0
            change_val = float(change) if change is not None else 0.0

            # If symbol already in db_assets, update it with live data
            if symbol_upper in db_assets:
                db_assets[symbol_upper].update({
                    "name": name,
                    "price": price_val,
                    "change": change_val,
                    "volume": int(vol) if vol is not None else db_assets[symbol_upper]["volume"],
                    "high": float(high) if high is not None else price_val,
                    "low": float(low) if low is not None else price_val,
                    "open": float(open_p) if open_p is not None else price_val,
                    "previousClose": float(prev_close) if prev_close is not None else price_val - (price_val * change_val / 100.0),
                    "turnover": float(turnover) if turnover is not None else db_assets[symbol_upper]["turnover"]
                })
            else:
                # If it's a new symbol not in the database, add it as a new NEPSE asset
                db_assets[symbol_upper] = {
                    "symbol": symbol_upper,
                    "name": name,
                    "exchange": "NEPSE",
                    "category": "NEPSE",
                    "price": price_val,
                    "change": change_val,
                    "volatility": 0.20,
                    "volume": int(vol) if vol is not None else 0,
                    "high": float(high) if high is not None else price_val,
                    "low": float(low) if low is not None else price_val,
                    "open": float(open_p) if open_p is not None else price_val,
                    "previousClose": float(prev_close) if prev_close is not None else price_val - (price_val * change_val / 100.0),
                    "turnover": float(turnover) if turnover is not None else 0.0
                }

        # Convert back to list format
        return list(db_assets.values())
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
