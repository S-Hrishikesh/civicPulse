import psycopg2

DB_URL = "postgresql://neondb_owner:npg_z1nlOREZ7gXa@ep-sparkling-heart-a1aflop0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def update_schema():
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Check if we need to convert Citizen_ID to auto-increment
    try:
        cursor.execute("CREATE SEQUENCE IF NOT EXISTS citizen_id_seq;")
        cursor.execute("ALTER TABLE CITIZEN ALTER COLUMN Citizen_ID SET DEFAULT nextval('citizen_id_seq');")
        cursor.execute("ALTER SEQUENCE citizen_id_seq OWNED BY CITIZEN.Citizen_ID;")
        # Set sequence to max value to avoid conflicts if there are existing rows
        cursor.execute("SELECT MAX(Citizen_ID) FROM CITIZEN;")
        max_id = cursor.fetchone()[0]
        if max_id:
            cursor.execute(f"SELECT setval('citizen_id_seq', {max_id});")
    except Exception as e:
        print("Sequence alter error:", e)

    # Convert Complaint_ID to auto-increment
    try:
        cursor.execute("CREATE SEQUENCE IF NOT EXISTS complaint_id_seq;")
        cursor.execute("ALTER TABLE COMPLAINT ALTER COLUMN Complaint_ID SET DEFAULT nextval('complaint_id_seq');")
        cursor.execute("ALTER SEQUENCE complaint_id_seq OWNED BY COMPLAINT.Complaint_ID;")
        cursor.execute("SELECT MAX(Complaint_ID) FROM COMPLAINT;")
        max_id = cursor.fetchone()[0]
        if max_id:
            cursor.execute(f"SELECT setval('complaint_id_seq', {max_id});")
    except Exception as e:
        print("Sequence alter error:", e)
        
    # Same for ASSIGNMENT
    try:
        cursor.execute("CREATE SEQUENCE IF NOT EXISTS assignment_id_seq;")
        cursor.execute("ALTER TABLE ASSIGNMENT ALTER COLUMN Assignment_ID SET DEFAULT nextval('assignment_id_seq');")
        cursor.execute("ALTER SEQUENCE assignment_id_seq OWNED BY ASSIGNMENT.Assignment_ID;")
    except Exception as e:
        pass

    # Update Complaint Status CHECK constraint
    try:
        cursor.execute("ALTER TABLE COMPLAINT DROP CONSTRAINT IF EXISTS complaint_status_check; ")
        cursor.execute("ALTER TABLE COMPLAINT ADD CONSTRAINT complaint_status_check CHECK (Status IN ('Lodged', 'Assigned', 'In-Progress', 'Resolved', 'Closed'));")
    except Exception as e:
        print("Constraint update error:", e)
        
    # Create COMPLAINT_LOG
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS COMPLAINT_LOG (
        Log_ID SERIAL PRIMARY KEY,
        Complaint_ID INT NOT NULL,
        Status VARCHAR(20) NOT NULL,
        Change_Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (Complaint_ID) REFERENCES COMPLAINT(Complaint_ID) ON DELETE CASCADE
    );
    """)

    print("Schema updated.")

if __name__ == "__main__":
    update_schema()
