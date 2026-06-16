import sys
import os
# Add the parent folder of the 'app' package to the Python path to allow running directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.database import get_supabase_client
from app.repositories.stock_repository import StockRepository
from app.services.live_market_service import LiveMarketService
from app.services.daily_sync_service import DailySyncService
from app.api.endpoints.stocks import router as stocks_router
import logging

# Setup standard logging
setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    logger.info("Starting FeinTrade NEPSE Backend Server...")
    
    # 1. Validate Supabase connection
    try:
        supabase = get_supabase_client()
        # Ping check using the FeinTra table which is guaranteed to exist
        supabase.table("FeinTra").select("Symbol").limit(1).execute()
        logger.info("Successfully verified Supabase PostgreSQL connection.")
    except Exception as e:
        logger.error(f"CRITICAL: Supabase connection check failed: {e}")
        logger.warning("Server will start but DB integrations might fail.")
    
    # 2. Instantiate and start the daily sync scheduler
    live_service = LiveMarketService()
    repo = StockRepository()
    sync_service = DailySyncService(live_service, repo)
    
    try:
        sync_service.start_scheduler()
        app.state.sync_service = sync_service
    except Exception as e:
        logger.error(f"Failed to start Daily Sync Scheduler: {e}")

    yield
    
    # Shutdown tasks
    logger.info("Shutting down FeinTrade NEPSE Backend Server...")
    if hasattr(app.state, "sync_service"):
        app.state.sync_service.shutdown_scheduler()

app = FastAPI(
    title="FeinTrade NEPSE Backend",
    description="Production-grade API backend for NEPSE live caching and Supabase syncing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def get_root():
    return {
        "name": "FeinTrade NEPSE Backend",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

# Register endpoint routes
app.include_router(stocks_router, prefix="/api/v1/stocks", tags=["Stocks & Market"])

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Running FastAPI on port {settings.PORT}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
