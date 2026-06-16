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

possible_tables = [
    "nepse_stocks",
    "nepse_daily_data",
    "stocks",
    "prices",
    "history",
    "stock_history",
    "nepse_history",
    "nepse_data",
    "daily_data",
    "nepse_daily",
    "nepse_prices"
]

print("\nProbing tables via Supabase REST API (HTTPS)...")
for table in possible_tables:
    try:
        res = supabase.table(table).select("*").limit(1).execute()
        print(f"FOUND Table '{table}' exists! Row count sample size: {len(res.data)}")
        if res.data:
            print(f"   Sample keys: {list(res.data[0].keys())}")
            print(f"   Sample row: {res.data[0]}")
    except Exception as e:
        err_msg = str(e)
        if "PGRST205" in err_msg or "Could not find the table" in err_msg:
            print(f"NOT FOUND Table '{table}'")
        else:
            print(f"ERROR Table '{table}': {err_msg}")
print("\nProbe complete.")
