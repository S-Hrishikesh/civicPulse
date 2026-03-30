import psycopg2

DB_URL = "postgresql://neondb_owner:npg_z1nlOREZ7gXa@ep-sparkling-heart-a1aflop0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def update():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    print("Dropping old constraint...")
    cur.execute("ALTER TABLE COMPLAINT DROP CONSTRAINT IF EXISTS complaint_status_check;")
    print("Adding new constraint with 'Dismissed'...")
    cur.execute("ALTER TABLE COMPLAINT ADD CONSTRAINT complaint_status_check CHECK (Status IN ('Lodged', 'Assigned', 'In-Progress', 'Resolved', 'Closed', 'Dismissed'));")
    conn.commit()
    cur.close()
    conn.close()
    print("Success! Database constraint updated.")

if __name__ == "__main__":
    update()
