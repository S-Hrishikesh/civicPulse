import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps

app = Flask(__name__)
# Enable CORS for React frontend (Vite runs on port 5173 by default)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ==========================================
# DATABASE SETUP
# ==========================================
DB_URL = "postgresql://neondb_owner:npg_z1nlOREZ7gXa@ep-sparkling-heart-a1aflop0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def get_db_connection():
    return psycopg2.connect(DB_URL)

# ==========================================
# FIREBASE SETUP
# ==========================================
import os
import json

firebase_init_error = None
try:
    firebase_creds = os.environ.get("FIREBASE_CREDENTIALS")
    if firebase_creds:
        cred_dict = json.loads(firebase_creds)
        if "private_key" in cred_dict:
            cred_dict["private_key"] = cred_dict["private_key"].replace('\\n', '\n')
        cred = credentials.Certificate(cred_dict)
    else:
        cred = credentials.Certificate('firebase-key.json')
    firebase_admin.initialize_app(cred)
except Exception as e:
    firebase_init_error = str(e)
    print("FATAL FIREBASE INIT ERROR:", e)

# ==========================================
# AUTH MIDDLEWARE
# ==========================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split()
            if len(parts) == 2 and parts[0] == "Bearer":
                token = parts[1]
        
        if not token:
            return jsonify({"message": "Token is missing"}), 401
        
        try:
            current_user = auth.verify_id_token(token)
        except Exception as e:
            err_msg = str(e)
            if firebase_init_error:
                err_msg += f" | INIT_ERROR: {firebase_init_error}"
            print("Token verification failed:", err_msg)
            return jsonify({"message": "Invalid token", "error": err_msg}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# ==========================================
# ROUTES
# ==========================================

@app.route('/api/debug', methods=['GET'])
def debug_env():
    return jsonify({
        "firebase_init_error": firebase_init_error,
        "has_credentials": "FIREBASE_CREDENTIALS" in os.environ,
        "cred_preview": os.environ.get("FIREBASE_CREDENTIALS", "")[:25]
    })

@app.route('/api/auth/sync', methods=['POST'])
@token_required
def auth_sync(current_user):
    # Determine role based on request or default to citizen
    email = current_user.get('email')
    role = request.json.get('role', 'citizen') if request.json else 'citizen'
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        if role == 'citizen':
            cursor.execute("SELECT * FROM CITIZEN WHERE Email = %s", (email,))
            user = cursor.fetchone()
            if not user:
                return jsonify({"status": "needs_onboarding", "email": email}), 200
            return jsonify({"status": "success", "user": user, "role": "citizen"}), 200
        
        elif role == 'handler' or role == 'admin':
            cursor.execute("SELECT * FROM OFFICIAL WHERE Email = %s", (email,))
            official = cursor.fetchone()
            if not official:
                # Provide a dummy official record if they are testing admin/handler without DB setup
                return jsonify({"status": "success", "user": {"Email": email, "Official_ID": 999, "Dept_ID": 1, "Role": role}, "role": role}), 200
            return jsonify({"status": "success", "user": official, "role": role}), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/profile', methods=['GET', 'POST', 'PUT'])
@token_required
def profile(current_user):
    email = current_user.get('email')
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    try:
        if request.method == 'GET':
            cursor.execute("SELECT * FROM CITIZEN WHERE Email = %s", (email,))
            user = cursor.fetchone()
            return jsonify(user), 200
            
        elif request.method == 'POST':
            data = request.json
            
            # Setup dummy location master so foreign key constraints don't fail for new zipcodes
            zipcode = data.get('zipcode', '10001')
            cursor.execute("SELECT ZipCode FROM LOCATION_MASTER WHERE ZipCode = %s", (zipcode,))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO LOCATION_MASTER (ZipCode, City) VALUES (%s, 'Test City') ON CONFLICT DO NOTHING", (zipcode,))
                
            cursor.execute("""
                INSERT INTO CITIZEN (Fname, Lname, Street, ZipCode, Phone, Email)
                VALUES (%s, %s, %s, %s, %s, %s) RETURNING Citizen_ID
            """, (data.get('fname'), data.get('lname'), data.get('street'), 
                  zipcode, data.get('phone'), email))
            new_id = cursor.fetchone()['citizen_id']
            conn.commit()
            return jsonify({"citizen_id": new_id}), 201
            
        elif request.method == 'PUT':
            data = request.json
            
            zipcode = data.get('zipcode', '10001')
            cursor.execute("SELECT ZipCode FROM LOCATION_MASTER WHERE ZipCode = %s", (zipcode,))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO LOCATION_MASTER (ZipCode, City) VALUES (%s, 'Test City') ON CONFLICT DO NOTHING", (zipcode,))

            cursor.execute("""
                UPDATE CITIZEN SET Fname = %s, Lname = %s, Street = %s, ZipCode = %s, Phone = %s
                WHERE Email = %s
            """, (data.get('fname'), data.get('lname'), data.get('street'), 
                  zipcode, data.get('phone'), email))
            conn.commit()
            return jsonify({"status": "updated"}), 200
            
    except Exception as e:
        conn.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/complaints', methods=['GET'])
@token_required
def get_complaints(current_user):
    email = current_user.get('email')
    role = request.args.get('role', 'citizen')
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        if role == 'citizen':
            cursor.execute("SELECT Citizen_ID FROM CITIZEN WHERE Email = %s", (email,))
            c_row = cursor.fetchone()
            if not c_row:
                return jsonify({"error": "Citizen not found"}), 404
                
            cursor.execute("""
                SELECT c.*, cat.Cat_Name, w.Ward_Name, f.Rating, f.Comments 
                FROM COMPLAINT c
                LEFT JOIN CATEGORY cat ON c.Category_ID = cat.Category_ID
                LEFT JOIN WARD w ON c.Ward_ID = w.Ward_ID
                LEFT JOIN FEEDBACK f ON c.Complaint_ID = f.Complaint_ID
                WHERE c.Citizen_ID = %s 
                ORDER BY c.Complaint_ID DESC
            """, (c_row['citizen_id'],))
            complaints = cursor.fetchall()
            
            # Fetch logs for progress bar
            for comp in complaints:
                cursor.execute("SELECT Status, Change_Timestamp FROM COMPLAINT_LOG WHERE Complaint_ID = %s ORDER BY Log_ID ASC", (comp['complaint_id'],))
                comp['history'] = cursor.fetchall()
                
            return jsonify(complaints), 200
            
        elif role == 'handler':
            # Demo: Return all complaints for Handler to allow testing easily
            cursor.execute("""
                SELECT c.*, cat.Cat_Name, w.Ward_Name, cit.Fname as Citizen_Name, f.Rating, f.Comments
                FROM COMPLAINT c
                LEFT JOIN CATEGORY cat ON c.Category_ID = cat.Category_ID
                LEFT JOIN WARD w ON c.Ward_ID = w.Ward_ID
                LEFT JOIN CITIZEN cit ON c.Citizen_ID = cit.Citizen_ID
                LEFT JOIN FEEDBACK f ON c.Complaint_ID = f.Complaint_ID
                ORDER BY c.Complaint_ID DESC
            """)
            complaints = cursor.fetchall()
            for comp in complaints:
                cursor.execute("SELECT Status, Change_Timestamp FROM COMPLAINT_LOG WHERE Complaint_ID = %s ORDER BY Log_ID ASC", (comp['complaint_id'],))
                comp['history'] = cursor.fetchall()
            return jsonify(complaints), 200
            
        elif role == 'admin':
            cursor.execute("""
                SELECT w.Ward_Name as name, COUNT(c.Complaint_ID) as value
                FROM WARD w
                LEFT JOIN COMPLAINT c ON w.Ward_ID = c.Ward_ID
                GROUP BY w.Ward_Name
            """)
            ward_stats = cursor.fetchall()
            
            cursor.execute("""
                SELECT cat.Cat_Name as name, COUNT(c.Complaint_ID) as value
                FROM CATEGORY cat
                LEFT JOIN COMPLAINT c ON cat.Category_ID = c.Category_ID
                GROUP BY cat.Cat_Name
            """)
            cat_stats = cursor.fetchall()
            
            cursor.execute("""
                SELECT c.Complaint_ID, c.Description, w.Ward_Name, f.Rating, f.Comments,
                       (SELECT Change_Timestamp FROM COMPLAINT_LOG WHERE Complaint_ID = c.Complaint_ID AND Status = 'Lodged' ORDER BY Log_ID ASC LIMIT 1) as start_time,
                       (SELECT Change_Timestamp FROM COMPLAINT_LOG WHERE Complaint_ID = c.Complaint_ID AND Status IN ('Resolved', 'Closed') ORDER BY Log_ID DESC LIMIT 1) as end_time
                FROM COMPLAINT c
                LEFT JOIN WARD w ON c.Ward_ID = w.Ward_ID
                LEFT JOIN FEEDBACK f ON c.Complaint_ID = f.Complaint_ID
                WHERE c.Status IN ('Resolved', 'Closed')
            """)
            resolved_tasks = cursor.fetchall()
            
            import json
            workers = 24
            try:
                with open('settings.json', 'r') as f:
                    workers = json.load(f).get('workers', 24)
            except:
                pass
            
            return jsonify({
                "ward_stats": ward_stats, 
                "category_stats": cat_stats,
                "resolved_tasks": resolved_tasks,
                "active_workers": workers
            }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/complaints', methods=['POST'])
@token_required
def create_complaint(current_user):
    email = current_user.get('email')
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("SELECT Citizen_ID FROM CITIZEN WHERE Email = %s", (email,))
        c_row = cursor.fetchone()
        if not c_row:
            return jsonify({"error": "Citizen not found"}), 404
            
        # Defaults for missing data
        desc = data.get('description', 'No description provided')
        gps = data.get('gps_location', '0.0, 0.0')
        cat_id = data.get('category_id', 1) 
        ward_id = data.get('ward_id', 1)
        
        # Ensure Category/Ward exist
        cursor.execute("SELECT Category_ID FROM CATEGORY WHERE Category_ID = %s", (cat_id,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO CATEGORY (Category_ID, Cat_Name, Priority) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING", (cat_id, 'General Issue', 'Medium'))
            
        # We assume the WARD already exists from standard setup or is correctly submitted.
            
        cursor.execute("""
            INSERT INTO COMPLAINT (Description, Status, GPS_Location, Citizen_ID, Category_ID, Ward_ID) 
            VALUES (%s, 'Lodged', %s, %s, %s, %s) RETURNING Complaint_ID
        """, (desc, gps, c_row['citizen_id'], cat_id, ward_id))
        
        comp_id = cursor.fetchone()['complaint_id']
        
        # Insert initial log
        cursor.execute("INSERT INTO COMPLAINT_LOG (Complaint_ID, Status) VALUES (%s, 'Lodged')", (comp_id,))
        
        conn.commit()
        return jsonify({"message": "Success", "complaint_id": comp_id}), 201

    except Exception as e:
        conn.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/complaints/<int:comp_id>/status', methods=['PUT'])
@token_required
def update_status(current_user, comp_id):
    role = request.json.get('role', 'handler')
    if role not in ['handler', 'admin']:
        return jsonify({"error": "Forbidden"}), 403
        
    new_status = request.json.get('status')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE COMPLAINT SET Status = %s WHERE Complaint_ID = %s", (new_status, comp_id))
        cursor.execute("INSERT INTO COMPLAINT_LOG (Complaint_ID, Status) VALUES (%s, %s)", (comp_id, new_status))
        conn.commit()
        return jsonify({"message": "Status updated"}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/settings/workers', methods=['POST'])
@token_required
def update_workers(current_user):
    role = request.json.get('role', 'citizen')
    if role != 'admin': return jsonify({"error": "Forbidden"}), 403
    import json
    with open('settings.json', 'w') as f:
        json.dump({"workers": request.json.get('workers', 0)}, f)
    return jsonify({"message": "Updated"}), 200

@app.route('/api/database/tables', methods=['GET'])
@token_required
def get_tables(current_user):
    role = request.args.get('role', 'citizen')
    if role != 'admin': return jsonify({"error": "Forbidden"}), 403
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tables = [r[0] for r in cursor.fetchall()]
        return jsonify(tables), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/database/tables/<table_name>', methods=['GET'])
@token_required
def get_table_data(current_user, table_name):
    role = request.args.get('role', 'citizen')
    if role != 'admin': return jsonify({"error": "Forbidden"}), 403
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        # Simple security to prevent injection although psycopg2 handles most
        if not table_name.isalnum() and "_" not in table_name:
            raise Exception("Invalid table name")
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 100")
        data = cursor.fetchall()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/wards', methods=['GET', 'POST'])
@token_required
def handle_wards(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        if request.method == 'GET':
            cursor.execute("SELECT COUNT(*) FROM WARD")
            if cursor.fetchone()['count'] == 0:
                cursor.execute("INSERT INTO WARD (Ward_ID, Ward_Name, Population) VALUES (1, 'Central Ward', 50000), (2, 'North Ward', 35000), (3, 'South Ward', 42000)")
                conn.commit()

            cursor.execute("SELECT Ward_ID, Ward_Name FROM WARD ORDER BY Ward_ID")
            return jsonify(cursor.fetchall()), 200
            
        elif request.method == 'POST':
            role = request.json.get('role', '')
            if role != 'admin':
                return jsonify({"error": "Forbidden"}), 403
            
            ward_name = request.json.get('ward_name')
            cursor.execute("SELECT COALESCE(MAX(Ward_ID), 0) + 1 as next_id FROM WARD")
            next_id = cursor.fetchone()['next_id']
            cursor.execute("INSERT INTO WARD (Ward_ID, Ward_Name, Population) VALUES (%s, %s, %s)", (next_id, ward_name, 10000))
            conn.commit()
            return jsonify({"message": "Ward added", "ward_id": next_id}), 201
            
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/complaints/<int:comp_id>/feedback', methods=['POST'])
@token_required
def submit_feedback(current_user, comp_id):
    email = current_user.get('email')
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("SELECT Citizen_ID FROM CITIZEN WHERE Email = %s", (email,))
        c_row = cursor.fetchone()
        if not c_row: return jsonify({"error": "Unauthorized"}), 403
        
        rating = request.json.get('rating', 5)
        comments = request.json.get('comments', '')
        
        cursor.execute("""
            INSERT INTO FEEDBACK (Complaint_ID, Citizen_ID, Rating, Comments) 
            VALUES (%s, %s, %s, %s) RETURNING Feedback_ID
        """, (comp_id, c_row['citizen_id'], rating, comments))
        
        conn.commit()
        return jsonify({"message": "Feedback submitted successfully!"}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)