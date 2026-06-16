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
    res = supabase.table("FeinTra").select("*").limit(5).execute()
    print("Full row samples:")
    for row in res.data:
        print(row)
except Exception as e:
    print(f"Error: {e}")
