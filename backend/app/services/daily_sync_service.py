import logging
from datetime import datetime, date
import pytz
from typing import List, Dict, Any
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.repositories.stock_repository import StockRepository
from app.services.live_market_service import LiveMarketService
from app.models.stock import StockCreate, DailyDataCreate

logger = logging.getLogger(__name__)

class DailySyncService:
    def __init__(self, live_market_service: LiveMarketService, stock_repository: StockRepository):
        self.live_market_service = live_market_service
        self.repo = stock_repository
        self.scheduler = AsyncIOScheduler()
        self.tz = pytz.timezone("Asia/Kathmandu")

    async def sync_companies(self) -> List[StockCreate]:
        """Fetch latest NEPSE listed companies and upsert them into Supabase database."""
        logger.info("Starting sync of NEPSE companies metadata...")
        try:
            raw_companies = await self.live_market_service.get_companies()
            stocks_to_upsert = []
            
            for c in raw_companies:
                symbol = c.get("symbol")
                name = c.get("securityName") or c.get("companyName") or symbol
                if not symbol:
                    continue
                
                stocks_to_upsert.append(
                    StockCreate(
                        symbol=symbol.strip().upper(),
                        name=name.strip(),
                        sector=c.get("sectorName"),
                        category=c.get("instrumentType") or "STOCKS"
                    )
                )
            
            if stocks_to_upsert:
                success = self.repo.upsert_stocks(stocks_to_upsert)
                if success:
                    logger.info(f"Successfully synced metadata for {len(stocks_to_upsert)} companies.")
                else:
                    logger.error("Failed to upsert company metadata in database.")
            return stocks_to_upsert
        except Exception as e:
            logger.error(f"Error during company metadata sync: {e}")
            return []

    async def sync_daily_prices(self) -> int:
        """Fetch live market data, parse OHLCV values, and upsert daily logs to Supabase."""
        logger.info("Starting daily NEPSE price sync...")
        try:
            # 1. Ensure metadata is updated first to prevent foreign key errors
            await self.sync_companies()

            # 2. Fetch live market prices
            raw_market = await self.live_market_service.get_live_market()
            daily_records = []
            today_date = datetime.now(pytz.timezone("Asia/Kathmandu")).date()

            for item in raw_market:
                symbol = item.get("symbol")
                if not symbol:
                    continue
                
                # Parse transaction date safely from API or fallback to today
                record_date = today_date
                updated_dt_str = item.get("lastUpdatedDateTime")
                if updated_dt_str:
                    try:
                        # Extract the date part YYYY-MM-DD
                        record_date = date.fromisoformat(updated_dt_str.split("T")[0])
                    except Exception:
                        pass

                # Calculate absolute point change if missing
                ltp = item.get("lastTradedPrice", 0.0)
                prev_close = item.get("previousClose", 0.0)
                point_change = item.get("pointChange")
                if point_change is None and ltp and prev_close:
                    point_change = ltp - prev_close

                daily_records.append(
                    DailyDataCreate(
                        symbol=symbol.strip().upper(),
                        date=record_date,
                        open=item.get("openPrice") or ltp,
                        high=item.get("highPrice") or ltp,
                        low=item.get("lowPrice") or ltp,
                        close=ltp,
                        ltp=ltp,
                        volume=item.get("totalTradeQuantity") or item.get("totalTradedVolume") or 0,
                        turnover=item.get("totalTradeValue") or 0.0,
                        transactions=item.get("numberOfTrades") or 0,
                        point_change=point_change or 0.0,
                        percentage_change=item.get("percentageChange") or 0.0
                    )
                )

            if daily_records:
                success = self.repo.upsert_daily_data(daily_records)
                if success:
                    logger.info(f"Successfully upserted {len(daily_records)} daily price records to Supabase.")
                    return len(daily_records)
                else:
                    logger.error("Failed to upsert daily records in database.")
            return 0
        except Exception as e:
            logger.error(f"Error during daily price sync: {e}")
            return 0

    def start_scheduler(self):
        """Configure and start the automated daily sync scheduler (Sun-Thu 3:15 PM and 4:00 PM NST).
        
        NOTE: APScheduler uses 0=Monday ... 6=Sunday.
        NEPSE trading days: Sunday(6), Monday(0), Tuesday(1), Wednesday(2), Thursday(3)
        """
        logger.info("Initializing Daily Sync Scheduler (Asia/Kathmandu)...")
        
        # NEPSE trading days: Sun, Mon, Tue, Wed, Thu
        nepse_days = "0,1,2,3,6"  # mon,tue,wed,thu,sun
        
        # Schedule daily sync shortly after market closes (3:15 PM NST)
        self.scheduler.add_job(
            self.sync_daily_prices,
            "cron",
            day_of_week=nepse_days,
            hour=15,
            minute=15,
            timezone=self.tz,
            name="NEPSE Daily Price Sync (Primary)",
            id="nepse_sync_primary",
            replace_existing=True
        )
        
        # Backup run at 4:00 PM NST to catch any late finalized data
        self.scheduler.add_job(
            self.sync_daily_prices,
            "cron",
            day_of_week=nepse_days,
            hour=16,
            minute=0,
            timezone=self.tz,
            name="NEPSE Daily Price Sync (Backup)",
            id="nepse_sync_backup",
            replace_existing=True
        )
        
        self.scheduler.start()
        logger.info("Daily Sync Scheduler started. Jobs scheduled for 3:15 PM and 4:00 PM NST (Sun-Thu).")

    def shutdown_scheduler(self):
        """Shut down the scheduler cleanly."""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Daily Sync Scheduler stopped.")
