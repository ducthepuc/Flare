from flask import Blueprint, request, send_from_directory, abort, jsonify
import dbmanager as dbm
from PIL import Image

from dbmanager import pooled_query

user_bp = Blueprint('generic_user', __name__)

@user_bp.route('/cdn/pfp/<path:uid>')
def get_pfp(uid):
    try:
        uid = int(uid)
        return send_from_directory("../cdn", f"images/{uid}.png")
    except ValueError:
        return send_from_directory('../cdn', "images/error.png")

@user_bp.route('/api/v1/configure', methods=["PUT"])
def change_user():
    auth = request.headers.get("Authorization")
    changes = request.json

    for change, value in changes.items():
        if change == "username":
            dbm.change_display_name(auth, value)
        elif change == "bio":
            dbm.change_bio(auth, value)

    return {"response": True}

@user_bp.route('/api/me')
def get_me():
    auth = request.headers.get("Authorization")

    if auth is None:
        return {
            "result": False,
            "reason": "Please provide a valid user key"
        }

    usr = dbm.get_user_by_token(auth, True)
    if not usr:
        return {
            "result": False,
            "reason": "User not found"
        }
    profile_id = usr[2]
    profile = dbm.get_profile(profile_id)

    if not profile:
        return {
            "result": False,
            "reason": "Invalid profile id"
        }

    return {
        "username": profile[1],
        "bio": profile[2],
        "streak": profile[3],
        "profilePicture": f"http://localhost:5000/cdn/pfp/{usr[0]}",
        "role": usr[9],
        "mention": usr[6],
        "member_since": usr[7]
    }

@user_bp.route('/api/change_pfp', methods=['POST'])
def change_pfp():
    auth = request.headers.get("Authorization")

    if auth is None:
        return {
            "result": False,
            "reason": "Please provide a valid user key"
        }

    usr = dbm.get_user_by_token(auth)
    if not usr:
        return {
            "result": False,
            "reason": "User not found"
        }

    uid = usr[0]

    file_stream = request.files.get('pfp')

    img = Image.open(file_stream.stream)
    img.verify()

    width, height = img.size
    # if width > 350 or height > 350:
    #     return {
    #         "result": False
    #     }

    img = Image.open(file_stream.stream)
    img.save(f'../cdn/images/{uid}.png')

    return {
        "result": True,
        "profilePictureUrl": f"/cdn/images/{uid}.png"
    }

@user_bp.route("/api/profile/<userid>")
def get_profile_by_id(userid):
    success = False
    try:
        int(userid)
        success = True
    except ValueError:
        success = False

    try:
        if success:
            usr = dbm.get_user(userid)
        else:
            usr = dbm.pooled_query("select * from user where username = %s", (userid,)).fetchone()

        pid = usr[2]
        profile = dbm.get_profile(pid)

        return {
            "result": True,
            "username": profile[1],
            "bio": profile[2],
            "streak": profile[3],
            "profilePicture": f"http://localhost:5000/cdn/pfp/{usr[0]}",
            "role": usr[9],
            "mention": usr[6],
            "member_since": usr[7]
        }
    except dbm.OutputMessageError as err:
        return {
            "result": False,
            "response": str(err)
        }

@user_bp.route("/api/nameprofile/<username>")
def get_profile_by_username(username):
    c = dbm.pooled_query("select * from profile where username = %s", (username,))
    profile = c.fetchone()
    if not profile:
        return {"result": False}, 500

    c2 = dbm.pooled_query("select * from user where profile_id = %s", (profile[0],))
    usr = c2.fetchone()

    c3 = dbm.pooled_query("select * from course where creator = %s", (usr[0],))
    courses = []
    cs = c3.fetchall()
    if cs:
        for course in cs:
            courses.append({
                "id": course[0],
                "title": course[2],
                "creator": profile[1],
                "tags": course[4].split(";")
            })

    return {
        "result": True,
        "username": profile[1],
        "bio": profile[2],
        "profilePicture": f"http://localhost:5000/cdn/pfp/{usr[0]}",
        "courses": courses
    }

@user_bp.route("/api/users/<username>/stars")
def user_stars(username):
    c1 = pooled_query("""SELECT id FROM user WHERE username = %s""", (username,))
    fetched = c1.fetchone()
    if not fetched:
        return {"result": False, "response": "Unknown profile"}, 500

    c2 = dbm.pooled_query("""SELECT COUNT(cs.course_id) AS total_stars FROM user u 
    JOIN course c ON u.id = c.creator JOIN course_stars cs ON c.id = cs.course_id WHERE u.id = %s GROUP BY u.id 
    ORDER BY total_stars DESC""", (fetched[0],))

    result = c2.fetchone()
    if result:
        return {"result": True, "totalStars": result[0]}
    else:
        return {"result": False, "totalStars": 0}

@user_bp.route("/api/users/top")
def top_users():
    users = dbm.get_top_users()
    return jsonify({
        "users": [{"username": usr[0], "stars": usr[1]} for usr in users]
    })
