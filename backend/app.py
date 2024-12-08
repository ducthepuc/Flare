import flask as f
from flask_cors import CORS
from auth_manager import auth_bp
from generic_user import user_bp
from file_manager import file_bp
from lur import lurjs, lurpy, lurlua
from dbmanager import cursor, sql
import atexit
import socket

# Define a specific port for the application
APP_PORT = 5000
FRONTEND_PORT = 3000

# Update ORIGINS to only use the specific frontend port
ORIGINS = [f"http://localhost:{FRONTEND_PORT}"]

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return False
        except socket.error:
            return True

app = f.Flask(__name__)
CORS(app, 
     resources={r"/api/*": {
         "origins": ["http://localhost:3000"],
         "methods": ["GET", "POST", "PUT", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization"]
     }},
     supports_credentials=True)

app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(file_bp)
app.register_blueprint(lurjs.lurjs_bp)
app.register_blueprint(lurpy.lurpy_bp)
app.register_blueprint(lurlua.lurlua_bp)

def cleanup():
    """Cleanup function to close database connections"""
    print("Cleaning up database connections...")
    cursor.close()
    sql.close()
    print("Cleanup completed")

# Register the cleanup function to be called on exit
atexit.register(cleanup)

if __name__ == '__main__':
    if is_port_in_use(APP_PORT):
        print(f"Port {APP_PORT} is already in use. Please free up the port and try again.")
        exit(1)
    
    try:
        app.run(debug=True, use_reloader=False, port=APP_PORT)
    finally:
        cleanup()