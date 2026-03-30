import psycopg2

DB_URL = "postgresql://neondb_owner:npg_z1nlOREZ7gXa@ep-sparkling-heart-a1aflop0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def check_schema():
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cursor.fetchall()
    print("Tables:", tables)

    if ('citizen',) in tables or ('CITIZEN',) in tables:
        cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name ILIKE 'citizen'")
        cols = cursor.fetchall()
        import json
        with open("schema_dump.json", "w") as f:
            json.dump({
                "tables": tables,
                "citizen_cols": cols if ('citizen',) in tables or ('CITIZEN',) in tables else []
            }, f)
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_schema()
