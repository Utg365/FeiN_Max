import logging
from typing import List, Dict, Any
from app.core.database import get_supabase_client
from app.models.stock import StockCreate, DailyDataCreate

logger = logging.getLogger(__name__)

class StockRepository:
    def __init__(self):
        self.client = get_supabase_client()

    def upsert_stocks(self, stocks: List[StockCreate]) -> bool:
        """Upsert a list of companies into nepse_stocks table."""
        if not stocks:
            return True
        try:
            data = [stock.model_dump() for stock in stocks]
            logger.info(f"Upserting {len(data)} stocks into 'nepse_stocks'...")
            # Supabase upsert will automatically replace existing records on primary key conflict
            self.client.table("nepse_stocks").upsert(data).execute()
            logger.info("Stock upsert completed successfully.")
            return True
        except Exception as e:
            logger.warning(f"Could not upsert to 'nepse_stocks' (table may not exist): {e}")
            return True

    def upsert_daily_data(self, daily_records: List[DailyDataCreate]) -> bool:
        """Upsert a list of daily market data records into nepse_daily_data and FeinTra."""
        if not daily_records:
            return True

        # 1. Attempt to upsert into nepse_daily_data (optional)
        try:
            data = []
            for r in daily_records:
                d = r.model_dump()
                d["date"] = d["date"].isoformat()
                data.append(d)

            logger.info(f"Upserting {len(data)} daily data records into 'nepse_daily_data'...")
            # We specify on_conflict because symbol + date is unique
            self.client.table("nepse_daily_data").upsert(data, on_conflict="symbol,date").execute()
            logger.info("Successfully upserted records into 'nepse_daily_data'.")
        except Exception as e:
            logger.warning(f"Could not upsert to 'nepse_daily_data' (table may not exist): {e}")

        # 2. Upsert into FeinTra (required) to keep historical database updated
        try:
            feintra_data = []
            for r in daily_records:
                pct_change_str = f"{r.percentage_change:.2f} %" if r.percentage_change is not None else "0.00 %"
                feintra_data.append({
                    "Symbol": r.symbol.upper(),
                    "Date": r.date.isoformat(),
                    "Open": float(r.open) if r.open else float(r.close),
                    "High": float(r.high) if r.high else float(r.close),
                    "Low": float(r.low) if r.low else float(r.close),
                    "Close": float(r.close),
                    "Percent Change": pct_change_str,
                    "Volume": str(float(r.volume or 0)),
                    "Turn Over": str(float(r.turnover or 0)),
                    "Sector": "null"
                })
            logger.info(f"Upserting {len(feintra_data)} daily records into 'FeinTra'...")
            self.client.table("FeinTra").upsert(feintra_data, on_conflict="Symbol,Date").execute()

            logger.info("Daily data upsert completed successfully for FeinTra.")
            return True
        except Exception as e:
            logger.error(f"Error upserting daily data to FeinTra: {e}")
            return False

    def get_all_stocks(self) -> List[Dict[str, Any]]:
        """Fetch all registered stocks from database."""
        try:
            response = self.client.table("nepse_stocks").select("*").execute()
            if response.data:
                return response.data
        except Exception:
            pass

        # Fallback to FeinTra latest 2000 records to extract unique symbols
        try:
            logger.info("Falling back to FeinTra for getting all registered stocks...")
            res = self.client.table("FeinTra").select("Symbol, Sector").order("Date", desc=True).limit(2000).execute()
            stocks = []
            seen = set()
            for r in (res.data or []):
                sym = r.get("Symbol")
                if sym:
                    sym_upper = sym.strip().upper()
                    if sym_upper not in seen:
                        seen.add(sym_upper)
                        stocks.append({
                            "symbol": sym_upper,
                            "name": sym_upper,
                            "sector": r.get("Sector") or "null",
                            "category": "STOCKS"
                        })
            return stocks
        except Exception as e:
            logger.error(f"Error fetching fallback stocks from FeinTra: {e}")
        return []

    def get_historical_data(self, symbol: str, limit: int = 1500) -> List[Dict[str, Any]]:
        """Fetch historical price logs for a symbol from FeinTra, sorted by date ascending."""
        try:
            data = []
            offset = 0
            page_size = 1000
            
            while len(data) < limit:
                current_limit = min(page_size, limit - len(data))
                response = (
                    self.client.table("FeinTra")
                    .select("*")
                    .eq("Symbol", symbol.upper())
                    .order("Date", desc=True)
                    .range(offset, offset + current_limit - 1)
                    .execute()
                )
                page_data = response.data or []
                data.extend(page_data)
                
                # If we retrieved fewer items than requested, we reached the end
                if len(page_data) < current_limit:
                    break
                offset += len(page_data)
                
            # Reverse to return in chronological order (ascending) for frontend charting
            data.reverse()
            
            # Map columns to lowercase keys expected by Next.js frontend
            mapped_data = []
            for r in data:
                # Safely parse Volume
                vol_str = r.get("Volume")
                volume = 0
                if vol_str:
                    try:
                        volume = int(float(vol_str))
                    except Exception:
                        pass
                
                # Safely parse Turnover
                to_str = r.get("Turn Over")
                turnover = 0.0
                if to_str and to_str != "-":
                    try:
                        turnover = float(to_str)
                    except Exception:
                        pass

                mapped_data.append({
                    "symbol": r.get("Symbol"),
                    "date": r.get("Date"),
                    "open": float(r.get("Open") or 0),
                    "high": float(r.get("High") or 0),
                    "low": float(r.get("Low") or 0),
                    "close": float(r.get("Close") or 0),
                    "ltp": float(r.get("Close") or 0),
                    "volume": volume,
                    "turnover": turnover,
                    "sector": r.get("Sector"),
                })
            return mapped_data
        except Exception as e:
            logger.error(f"Error fetching historical data from FeinTra for {symbol}: {e}")
            return []
