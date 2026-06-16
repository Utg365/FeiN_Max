import pg8000.dbapi
import sys

def list_tables():
    print("Connecting to Supabase PostgreSQL database to list tables...")
    try:
        conn = pg8000.dbapi.connect(
            user="postgres",
            password="Umanga.100#",
            host="db.iqmogrdktayngnhebekm.supabase.co",
            port=5432,
            database="postgres"
        )
        cursor = conn.cursor()
        
        # Query list of tables in public schema
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        """)
        tables = [row[0] for row in cursor.fetchall()]
        print(f"Tables found in public schema: {tables}")
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM public.\"{table}\";")
            count = cursor.fetchone()[0]
            print(f"  - Table: {table}, Row count: {count}")
            
            # Print sample row or columns
            cursor.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}';")
            cols = [f"{row[0]} ({row[1]})" for row in cursor.fetchall()]
            print(f"    Columns: {', '.join(cols)}")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_tables()
