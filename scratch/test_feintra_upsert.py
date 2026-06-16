import os
from supabase import create_client

env_vars = {}
with open("backend/.env", "r") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env_vars[k.strip()] = v.strip()

url = env_vars.get("SUPABASE_URL")
key = env_vars.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

print("Testing upsert into FeinTra table...")
test_row = {
    "Symbol": "TEST_STK",
    "Date": "2026-06-16",
    "Open": 100.0,
    "High": 110.0,
    "Low": 90.0,
    "Close": 105.0,
    "Percent Change": "5.00 %",
    "Volume": "1000.0",
    "Turn Over": "100000.0",
    "Sector": "TEST"
}

try:
    res = supabase.table("FeinTra").upsert([test_row]).execute()
    print("Upsert successful! Response data:", res.data)
    
    # Clean up the test row
    supabase.table("FeinTra").delete().eq("Symbol", "TEST_STK").execute()
    print("Clean up completed successfully.")
except Exception as e:
    print("Upsert failed:", e)
