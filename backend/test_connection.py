import sys
import os
import asyncio

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_all():
    print("=== FEINTRADE BACKEND VERIFICATION SCRIPT ===")
    
    # 1. Test environment load
    print("\n[Step 1] Loading environment settings...")
    try:
        from app.core.config import settings
        print(f"  SUPABASE_URL: {settings.SUPABASE_URL}")
        print(f"  TIMEZONE: {settings.TIMEZONE}")
        print("  Environment settings loaded successfully.")
    except Exception as e:
        print(f"  ERROR: Failed to load config: {e}")
        return

    # 2. Test Supabase connection
    print("\n[Step 2] Testing Supabase connection...")
    try:
        from app.core.database import get_supabase_client
        supabase = get_supabase_client()
        # Fetch count of stocks to check connection
        res = supabase.table("nepse_stocks").select("symbol", count="exact").limit(1).execute()
        print(f"  Connection successful! Registered stock count: {res.count if hasattr(res, 'count') else 'N/A'}")
    except Exception as e:
        print(f"  WARNING: Could not connect to Supabase: {e}")
        print("  (Make sure you ran the SQL DDL schema in the Supabase SQL editor!)")

    # 3. Test AsyncNepse import and fetch
    print("\n[Step 3] Testing AsyncNepse library and live market retrieval...")
    try:
        from nepse import AsyncNepse
        print("  Importing AsyncNepse... success.")
        nepse = AsyncNepse()
        nepse.setTLSVerification(False)
        
        print("  Checking if NEPSE market is open...")
        is_open = await nepse.isNepseOpen()
        print(f"  Market status: {is_open}")
        
        print("  Fetching top 3 live market tickers...")
        live = await nepse.getLiveMarket()
        if live:
            print("  Retrieved live market tickers successfully! Sample:")
            for item in live[:3]:
                print(f"    - Symbol: {item.get('symbol')}, Price: {item.get('lastTradedPrice')}, Change: {item.get('percentageChange')}%")
        else:
            print("  Live market data returned empty (typical if market data scraper encounters block).")
            
    except Exception as e:
        print(f"  ERROR: AsyncNepse check failed: {e}")

    print("\n=== VERIFICATION COMPLETE ===")

if __name__ == "__main__":
    asyncio.run(test_all())
