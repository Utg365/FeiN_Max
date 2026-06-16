# FeinTrade NEPSE Backend Server

This is the production-grade, async FastAPI backend server for the FeinTrade NEPSE analytics platform. It automatically syncs listed stock metadata and daily closing prices (OHLCV) into **Supabase**, and serves live Last Traded Prices (LTP) with smart rate-limiting in-memory caches to remain "unbreakable" and avoid API bans.

---

## 🛠 Prerequisites

1. **Python 3.10+** (if running locally)
2. **Git** (required to install the unofficial `nepse` library directly from GitHub)
3. **Docker** and **Docker Compose** (optional, for containerized deployments)

---

## 📦 Setup & Database Schema

### 1. Run Schema inside Supabase SQL Editor
Navigate to your Supabase project's **SQL Editor** and execute the following DDL script to create the necessary tables and constraints:

```sql
-- Table: nepse_stocks (stores company information)
CREATE TABLE IF NOT EXISTS public.nepse_stocks (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sector TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: nepse_daily_data (stores historical daily market price statistics)
CREATE TABLE IF NOT EXISTS public.nepse_daily_data (
    id BIGSERIAL PRIMARY KEY,
    symbol TEXT REFERENCES public.nepse_stocks(symbol) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    open NUMERIC(12, 2),
    high NUMERIC(12, 2),
    low NUMERIC(12, 2),
    close NUMERIC(12, 2),
    ltp NUMERIC(12, 2),
    volume BIGINT DEFAULT 0,
    turnover NUMERIC(16, 2) DEFAULT 0.00,
    transactions INTEGER DEFAULT 0,
    point_change NUMERIC(12, 2) DEFAULT 0.00,
    percentage_change NUMERIC(6, 3) DEFAULT 0.000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint to prevent duplicates for a stock on the same day
    CONSTRAINT unique_symbol_date UNIQUE (symbol, date)
);

-- Index for fast query access by symbol and date
CREATE INDEX IF NOT EXISTS idx_nepse_daily_data_symbol_date ON public.nepse_daily_data (symbol, date DESC);
```

### 2. Configure Environment Variables
Create a file named `.env` in the root of the `backend` directory (using `.env.example` as a reference) and insert your credentials:

```ini
PORT=8000
DEBUG=True
SUPABASE_URL=https://iqmogrdktayngnhebekm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
TIMEZONE=Asia/Kathmandu
```

---

## 🚀 Running the Server

### Option A: Running Locally

1. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

2. Install dependencies (requires `git` installed on your machine):
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. Launch the FastAPI server:
   ```bash
   python app/main.py
   ```
   The API will now be active at **`http://localhost:8000`**. You can access the interactive Swagger documentation at **`http://localhost:8000/docs`**.

---

### Option B: Running with Docker (Recommended)

1. Build and launch the container in detached mode:
   ```bash
   docker-compose up -d --build
   ```
2. The server will launch and bind to host port `8000`. You can inspect container logs via:
   ```bash
   docker logs -f feintrade_backend
   ```

---

## 📡 API Endpoints

### Markets & Prices
* **`GET /api/v1/stocks/status`**: Checks if the NEPSE market is currently open or closed (returns `{"isOpen": "OPEN"}` or `{"isOpen": "CLOSED"}`).
* **`GET /api/v1/stocks/live`**: Fetches real-time price updates for all listed NEPSE symbols. Mapped directly to match the frontend asset structure:
  ```json
  [
    {
      "symbol": "NABIL",
      "name": "Nabil Bank Limited",
      "exchange": "NEPSE",
      "category": "NEPSE",
      "price": 620.0,
      "change": 2.15,
      "volatility": 0.2,
      "volume": 142000,
      "high": 625.0,
      "low": 618.0,
      "open": 618.0
    }
  ]
  ```
* **`GET /api/v1/stocks/list`**: Returns the list of registered companies in the database.
* **`GET /api/v1/stocks/{symbol}/history`**: Retrieves historical closing/price logs for a stock from Supabase (used for charts).

### Daily Sync Utilities
* **`POST /api/v1/stocks/sync`**: Triggers a manual background sync task to grab the current day's prices and write them into Supabase.

---

## ⏰ Automated Daily Updates

The backend initializes an internal cron scheduler (`APScheduler`) on startup:
* **Primary run**: Sun-Thu at **3:15 PM NST** (shortly after NEPSE market close).
* **Backup run**: Sun-Thu at **4:00 PM NST** (to ensure any delayed calculations are safely logged).
* Automatically updates/upserts stock names and sector metadata before storing price records to ensure reference integrity.
