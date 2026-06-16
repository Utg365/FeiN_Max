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

supabase = create_client(url, key)

for symbol in ["NEPSE", "NABIL", "SHIVM"]:
    try:
        res = supabase.table("FeinTra").select("Symbol", count="exact").eq("Symbol", symbol).limit(1).execute()
        print(f"Symbol '{symbol}': {res.count} historical rows found.")
    except Exception as e:
        print(f"Error for {symbol}: {e}")
