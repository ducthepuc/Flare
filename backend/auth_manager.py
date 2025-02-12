from flask import Blueprint, request, jsonify
from flask_cors import CORS
import dbmanager as dbm

auth_bp = Blueprint('auth', __name__)

CORS(auth_bp, origins=["http://localhost:3000"], methods=["GET", "POST", "OPTIONS"])

@auth_bp.route('/api/uauth:def', methods=["POST"])
def user_auth():

    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        user = dbm.login_user_via_auth(email, password)

        return {"result": True, "reason": "Cuz you put everything in correctly!",
                "data": {"username": user[5], "token": user[4], "id": user[0]}}
    except dbm.OutputMessageError as e:
        return {"result": False, "reason": str(e), "data": {}}

@auth_bp.route('/api/user_make:def', methods=["POST"])
def user_registry():
    request_data = request.json
    uname = request_data.get('name')
    email = request_data.get('email')
    pwd = request_data.get('password')
    pwd2 = request_data.get('confirm_password')

    try:
        dbm.add_user(uname, pwd, pwd2, email, False, None)

        return jsonify({"result": True, "reason": "All info is right!"})
    except dbm.OutputMessageError as e:
        return jsonify({"result": False, "reason": str(e)})