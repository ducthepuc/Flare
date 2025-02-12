from flask_cors import CORS
from auth_manager import auth_bp
from generic_user import user_bp
from course_api import course_bp
from lur import lurjs, lurpy, lurlua
import atexit
import socket
import token_system as ts
from dbmanager import *
import flask as f

APP_PORT = 5000
FRONTEND_PORT = 3000

ORIGINS = [f"http://localhost:{FRONTEND_PORT}"]


def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return False
        except socket.error:
            return True

# TODO: Do the endpoint boilerplate bs
app = f.Flask(__name__)

CORS(app,
     resources={r"/api/*": {
         "origins": ["http://localhost:3000"],
         "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
         "allow_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True
     }})

ts.initialize()
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(course_bp)
app.register_blueprint(lurjs.lurjs_bp)
app.register_blueprint(lurpy.lurpy_bp)
app.register_blueprint(lurlua.lurlua_bp)


def cleanup():
    """Cleanup function to close database connections"""
    print("Cleaning up database connections...")
    sql_pool.close()
    # Closing up the lighter key handling database
    ts.DBHandler.instance.cursor.close()
    ts.DBHandler.instance.db.close()
    print("Cleanup completed")

# Register the cleanup function to be called on exit
atexit.register(cleanup)

@app.route('/debug/routes')
def list_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'path': str(rule)
        })
    return f.jsonify(routes)

if __name__ == '__main__':
    if is_port_in_use(APP_PORT):
        print(f"Port {APP_PORT} is already in use. Please free up the port and try again.")
        exit(1)

    try:
        app.run(debug=True, use_reloader=False, port=APP_PORT)
    finally:
        cleanup()
