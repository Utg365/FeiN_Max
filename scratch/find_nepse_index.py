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

try:
    # Query row where Symbol is NEPSE
    res = supabase.table("FeinTra").select("*").eq("Symbol", "NEPSE").limit(5).execute()
    print(f"NEPSE symbol rows count: {len(res.data)}")
    if res.data:
        print("Sample NEPSE rows:")
        for row in res.data:
            print(row)
    else:
        # Search for case-insensitive or partial symbols
        res_like = supabase.table("FeinTra").select("Symbol").ilike("Symbol", "%nepse%").limit(10).execute()
        print(f"Similar symbols: {[r['Symbol'] for r in res_like.data]}")
except Exception as e:
    print(f"Error: {e}")
