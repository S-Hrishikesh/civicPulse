import psycopg2

DB_URL = "postgresql://neondb_owner:npg_z1nlOREZ7gXa@ep-sparkling-heart-a1aflop0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def fix_official():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE OFFICIAL ADD COLUMN IF NOT EXISTS Email VARCHAR(100) UNIQUE;")
        print("Done!")
    except Exception as e:
        print(e)
        
if __name__ == "__main__":
    fix_official()
