import psycopg2

DB_URL = "postgresql://neondb_owner:npg_z1nlOREZ7gXa@ep-sparkling-heart-a1aflop0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def fix_status():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Update existing statuses
    cursor.execute("UPDATE COMPLAINT SET Status = 'Lodged' WHERE Status = 'Open';")
    cursor.execute("UPDATE COMPLAINT SET Status = 'In-Progress' WHERE Status = 'Work_InProgress';")

    try:
        cursor.execute("ALTER TABLE COMPLAINT DROP CONSTRAINT IF EXISTS complaint_status_check; ")
        cursor.execute("ALTER TABLE COMPLAINT ADD CONSTRAINT complaint_status_check CHECK (Status IN ('Lodged', 'Assigned', 'In-Progress', 'Resolved', 'Closed'));")
        print("Constraint successfully added!")
    except Exception as e:
        print("Constraint update error:", e)

if __name__ == "__main__":
    fix_status()
