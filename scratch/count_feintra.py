import os
from supabase import create_client

# Load settings manually from backend/.env
env_vars = {}
with open("backend/.env", "r") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env_vars[k.strip()] = v.strip()

url = env_vars.get("SUPABASE_URL")
key = env_vars.get("SUPABASE_SERVICE_ROLE_KEY")

print("Initializing Supabase Client...")
supabase = create_client(url, key)

print("Querying FeinTra table...")
try:
    # Get total count of rows
    res = supabase.table("FeinTra").select("Symbol", count="exact").limit(5).execute()
    print(f"Total row count in FeinTra: {res.count}")
    print("Sample rows:")
    for row in res.data:
        print(row)
        
    # Get some unique symbols
    res_symbols = supabase.table("FeinTra").select("Symbol").limit(5000).execute()
    symbols = list(set([row["Symbol"] for row in res_symbols.data if row.get("Symbol")]))
    print(f"Number of unique symbols found in first 5000 rows: {len(symbols)}")
    print(f"Sample symbols: {symbols[:15]}")
except Exception as e:
    print(f"Error querying FeinTra: {e}")
