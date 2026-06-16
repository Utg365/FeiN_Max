import logging
import asyncio
import time
from typing import Dict, Any, List, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from nepse import AsyncNepse

logger = logging.getLogger(__name__)

# Sector Mapping to standard sub-indices in NEPSE
SECTOR_MAP = {
    "Commercial Banks": "Banking SubIndex",
    "Development Banks": "Development Bank Index",
    "Finance": "Finance Index",
    "Hotels And Tourism": "Hotels And Tourism Index",
    "Hydro Power": "HydroPower Index",
    "Investment": "Investment Index",
    "Life Insurance": "Life Insurance",
    "Manufacturing And Processing": "Manufacturing And Processing",
    "Microfinance": "Microfinance Index",
    "Mutual Fund": "Mutual Fund",
    "Non Life Insurance": "Non Life Insurance",
    "Others": "Others Index",
    "Tradings": "Trading Index",
}

class LiveMarketService:
    def __init__(self):
        self.nepse = AsyncNepse()
        self.nepse.setTLSVerification(False)
        
        # In-memory caches with timestamps
        self._live_market_cache: Optional[List[Dict[str, Any]]] = None
        self._live_market_time: float = 0.0
        
        self._company_list_cache: Optional[List[Dict[str, Any]]] = None
        self._company_list_time: float = 0.0
        
        self._market_status_cache: Optional[Dict[str, Any]] = None
        self._market_status_time: float = 0.0
        
        # Mutex lock for thread-safety in async context
        self._lock = asyncio.Lock()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((ConnectionError, TimeoutError, Exception)),
        reraise=True
    )
    async def _fetch_live_market_raw(self) -> List[Dict[str, Any]]:
        """Call the AsyncNepse library with automatic retries."""
        logger.info("Requesting live market data from NEPSE API...")
        data = await self.nepse.getLiveMarket()
        if not data:
            raise ValueError("Empty response from NEPSE live market")
        return data

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def _fetch_company_list_raw(self) -> List[Dict[str, Any]]:
        """Fetch the master list of all listed companies."""
        logger.info("Requesting company list from NEPSE API...")
        data = await self.nepse.getCompanyList()
        if not data:
            raise ValueError("Empty response from NEPSE company list")
        return data

    async def is_market_open(self) -> bool:
        """Check if market is currently open. Caches result for 60 seconds."""
        now = time.time()
        if self._market_status_cache and (now - self._market_status_time < 60.0):
            return self._market_status_cache.get("isOpen") == "OPEN"

        async with self._lock:
            # Double check after acquiring lock
            if self._market_status_cache and (now - self._market_status_time < 60.0):
                return self._market_status_cache.get("isOpen") == "OPEN"

            try:
                status = await self.nepse.isNepseOpen()
                self._market_status_cache = status
                self._market_status_time = now
                return status.get("isOpen") == "OPEN"
            except Exception as e:
                logger.error(f"Error checking market status: {e}")
                # Fallback: assume closed if error to avoid spamming endpoints
                return False

    async def get_live_market(self) -> List[Dict[str, Any]]:
        """Get live market stock data with rate-limit protection and smart caching."""
        now = time.time()
        is_open = await self.is_market_open()
        
        # Cache TTL: 15 seconds if market is open, 10 minutes if closed
        ttl = 15.0 if is_open else 600.0

        if self._live_market_cache and (now - self._live_market_time < ttl):
            return self._live_market_cache

        async with self._lock:
            # Double check cache after lock acquisition
            if self._live_market_cache and (now - self._live_market_time < ttl):
                return self._live_market_cache

            try:
                data = await self._fetch_live_market_raw()
                self._live_market_cache = data
                self._live_market_time = now
                return data
            except Exception as e:
                logger.error(f"Failed to fetch live market data: {e}")
                # Fallback: return old cache if available
                if self._live_market_cache:
                    logger.warning("Returning stale cached live market data as fallback.")
                    return self._live_market_cache
                # If market is closed, return empty list instead of failing
                if not is_open:
                    logger.info("Market is closed. No live market data available, returning empty list.")
                    return []
                raise e

    async def get_companies(self) -> List[Dict[str, Any]]:
        """Get listed companies with caching (TTL: 1 hour)."""
        now = time.time()
        ttl = 3600.0  # 1 hour

        if self._company_list_cache and (now - self._company_list_time < ttl):
            return self._company_list_cache

        async with self._lock:
            if self._company_list_cache and (now - self._company_list_time < ttl):
                return self._company_list_cache

            try:
                data = await self._fetch_company_list_raw()
                self._company_list_cache = data
                self._company_list_time = now
                return data
            except Exception as e:
                logger.error(f"Failed to fetch company list: {e}")
                if self._company_list_cache:
                    return self._company_list_cache
                raise e

    async def get_live_prices_map(self) -> Dict[str, Dict[str, Any]]:
        """Returns a fast-lookup dictionary of symbol -> live market details."""
        try:
            live_data = await self.get_live_market()
            # Map by symbol
            return {item["symbol"].upper(): item for item in live_data if "symbol" in item}
        except Exception as e:
            logger.error(f"Error compiling live prices map: {e}")
            return {}
