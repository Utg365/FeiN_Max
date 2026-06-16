import sqlite3
import sys

def check_sqlite():
    db_path = "fein_trade.db"
    print(f"Connecting to SQLite database: {db_path}...")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Tables in SQLite database: {tables}")
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM \"{table}\";")
            count = cursor.fetchone()[0]
            print(f"  - Table: {table}, Row count: {count}")
            
            # Print columns
            cursor.execute(f"PRAGMA table_info(\"{table}\");")
            cols = [f"{row[1]} ({row[2]})" for row in cursor.fetchall()]
            print(f"    Columns: {', '.join(cols)}")
            
            # Print a sample row
            if count > 0:
                cursor.execute(f"SELECT * FROM \"{table}\" LIMIT 1;")
                print(f"    Sample row: {cursor.fetchone()}")
                
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error checking SQLite: {e}")

if __name__ == "__main__":
    check_sqlite()
