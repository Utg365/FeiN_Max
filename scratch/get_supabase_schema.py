import urllib.request
import json

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

schema_url = f"{url}/rest/v1/"
print(f"Requesting OpenAPI schema from {schema_url}...")

req = urllib.request.Request(
    schema_url,
    headers={
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }
)

try:
    with urllib.request.urlopen(req) as response:
        schema = json.loads(response.read().decode('utf-8'))
        print("Schema loaded successfully!")
        
        # Extract tables from OpenAPI paths
        paths = schema.get("paths", {})
        tables = []
        for path in paths.keys():
            if path != "/" and "/" not in path[1:]:
                tables.append(path.strip("/"))
        
        print(f"Tables listed in OpenAPI schema: {list(set(tables))}")
        
        # Let's print details about the paths/definitions
        definitions = schema.get("definitions", {})
        print("Definitions (Tables/Views) details:")
        for name, def_info in definitions.items():
            properties = list(def_info.get("properties", {}).keys())
            print(f"  - {name}: {properties}")
            
except Exception as e:
    print(f"Error fetching schema: {e}")
