from flask import Blueprint, request, send_from_directory, abort, jsonify
import dbmanager as dbm
from dbmanager import cursor
import os

user_bp = Blueprint('generic_user', __name__)



# @user_bp.route('/api/v1/<path:uid>/picture', methods=['GET'])
# def get_pfp(uid):
#     return f"UID: {uid}"


@user_bp.route('/cdn/pfp/<path:uid>')
def get_pfp(uid):
    try:
        uid = int(uid)
        return send_from_directory("../cdn", f"images/{uid}.png")
    except Exception:
        return send_from_directory('../cdn', "images/error.png")


@user_bp.route('/api/v1/configure', methods=["PUT"])
def change_user():
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"result": False, "reason": "Please provide a valid user key"}), 401

    try:
        changes = request.json
        if not changes:
            return jsonify({"result": False, "reason": "No changes provided"}), 400

        for change, value in changes.items():
            if change == "username":
                dbm.change_display_name(auth, value)
            elif change == "bio":
                dbm.change_bio(auth, value)

        return jsonify({"result": True, "message": "Changes saved successfully"})
    except Exception as e:
        print(f"Error updating user configuration: {str(e)}")
        return jsonify({"result": False, "reason": str(e)}), 500

@user_bp.route('/api/me')
def get_me():
    auth = request.headers.get("Authorization")

    if not auth:
        return jsonify({"result": False, "reason": "Please provide a valid user key"}), 401
    
    try:
        usr = dbm.get_user_by_token(auth)
        if not usr:
            return jsonify({"result": False, "reason": "User not found"}), 404

        profile_id = usr[2]
        profile = dbm.get_profile(profile_id)

        cursor.execute("SELECT name FROM user_role WHERE id = %s", (usr[9],))
        role = cursor.fetchone()[0]

        if not profile:
            return jsonify({"result": False, "reason": "Invalid profile id"}), 404

        return jsonify({
            "result": True,
            "username": profile[1],
            "bio": profile[2],
            "streak": profile[3],
            "role": role,
            "profilePicture": f"http://localhost:5000/cdn/pfp/{usr[0]}"
        })
    except Exception as e:
        print(f"Error in get_me: {str(e)}")  # Add logging
        return jsonify({"result": False, "reason": str(e)}), 500

@user_bp.route('/api/change_pfp', methods=['POST'])
def change_pfp():
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"result": False, "reason": "Please provide a valid user key"}), 401
    
    try:
        usr = dbm.get_user_by_token(auth)
        if not usr:
            return jsonify({"result": False, "reason": "User not found"}), 404
        
        uid = usr[0]
        file = request.files.get('pfp')
        
        if not file:
            return jsonify({"result": False, "reason": "No file provided"}), 400
            
        # Ensure the images directory exists
        images_dir = os.path.join(os.path.dirname(__file__), '../cdn/images')
        os.makedirs(images_dir, exist_ok=True)
        
        # Save the file
        file_path = os.path.join(images_dir, f'{uid}.png')
        file.save(file_path)
        
        return jsonify({
            "result": True,
            "message": "Profile picture updated successfully"
        })
        
    except Exception as e:
        print(f"Error updating profile picture: {str(e)}")
        return jsonify({"result": False, "reason": str(e)}), 500