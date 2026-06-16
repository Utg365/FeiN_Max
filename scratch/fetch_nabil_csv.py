import urllib.request
import csv
import io

url = "https://raw.githubusercontent.com/Aabishkar2/nepse-data/main/data/company/NABIL.csv"
print(f"Fetching {url}...")
try:
    response = urllib.request.urlopen(url)
    csv_data = response.read().decode('utf-8')
    reader = csv.reader(io.StringIO(csv_data))
    header = next(reader)
    print("CSV Header:", header)
    rows = list(reader)
    print(f"Total rows: {len(rows)}")
    if rows:
        print("First row (most recent):", rows[0])
        print("Last row (oldest):", rows[-1])
except Exception as e:
    print("Error:", e)
