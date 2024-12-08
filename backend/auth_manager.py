from flask import Blueprint, request, jsonify
import dbmanager as dbm

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/uauth:def', methods=["POST"])
def user_auth():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        user = dbm.login_user_via_auth(email, password)
        print(user)
        return {"result": True, "reason": "Cuz you put everything in correctly!",
                "data": {"username": user[5], "token": user[4], "id": user[0]}}
    except Exception as e:
        return {"result": False, "reason": str(e), "data": {}}


@auth_bp.route('/api/user_make:def', methods=["POST"])
def user_registry():
    request_data = request.json
    uname = request_data.get('name')
    email = request_data.get('email')
    pwd = request_data.get('password')
    pwd2 = request_data.get('confirm_password')
    role = request_data.get('role', 'learner')  # default to learner if not specified

    try:
        dbm.add_user(uname, pwd, pwd2, email, False, None, role)
        return jsonify({"result": True, "reason": "All info is right!"})
    except Exception as e:
        return jsonify({"result": False, "reason": str(e)})


@auth_bp.route('/api/get_user_by_token', methods=["GET"])
def get_user():
    try:
        data = request.headers

        if not data:
            return jsonify({'error': 'No data received'}), 400

        token = data.get('Authorization')

        if not token:
            return jsonify({'error': 'No token provided'}), 400

        user_data = dbm.get_user_by_token(token)
        profile_data = dbm.get_profile(user_data[2])

        if user_data:
            response = {
                'username': profile_data[1],
                'id': user_data[0]
            }
            return jsonify(response)
        else:
            return jsonify({'error': 'User not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500
