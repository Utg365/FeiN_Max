import sys
sys.path.append('backend')
from app.repositories.stock_repository import StockRepository
repo = StockRepository()

for sym in ['NABIL', 'SHIVM', 'NEPSE']:
    data = repo.get_historical_data(sym, limit=1500)
    print(f"Symbol: {sym}, Total rows: {len(data)}")
    if data:
        oldest = data[0]["date"]
        newest = data[-1]["date"]
        print(f"  Oldest: {oldest}")
        print(f"  Newest: {newest}")
