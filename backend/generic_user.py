from flask import Blueprint, request, send_from_directory, abort, jsonify
import dbmanager as dbm
from PIL import Image

from backend.dbmanager import pooled_query

user_bp = Blueprint('generic_user', __name__)


# @user_bp.route('/api/v1/<path:uid>/picture', methods=['GET'])
# def get_pfp(uid):
#     return f"UID: {uid}"


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
    if width > 350 or height > 350:
        return {
            "result": False
        }

    img = Image.open(file_stream.stream)
    img.save(f'../cdn/images/{uid}.png')


    return {
        "result": True
    }

@user_bp.route("/api/profile/<userid>")
def get_profile_by_id(userid):
    # auth = request.headers.get("Authorization")
    #
    # if not dbm.get_user_by_token(auth):
    #     return {"result": False, "response": "Unauthorized"}, 401
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
    print(username)
    c = dbm.pooled_query("select * from profile where username = %s", (username,))
    profile = c.fetchone()
    if not profile: return {"result": False}, 500

    c2 = dbm.pooled_query("select * from user where profile_id = %s", (profile[0],  ))
    usr = c2.fetchone()

    c3 = dbm.pooled_query("select * from course where creator = %s", (usr[0], ))
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
    # auth = request.headers.get("Authorization")
    #
    # if not dbm.get_user_by_token(auth):
    #     return {"result": False, "response": "Unauthorized"}, 401

    c1 = pooled_query("""SELECT 1 FROM user WHERE username = %s""", (username,))
    fetched = c1.fetchone()
    if not fetched:
        return {"result": False, "response": "Unknown profile"}, 500

    c2 = dbm.pooled_query("""SELECT u.id AS creator_id, COUNT(cs.course_id) AS total_stars FROM user u 
    JOIN course c ON u.id = c.creator JOIN course_stars cs ON c.id = cs.course_id WHERE u.id = %s GROUP BY u.id 
    ORDER BY total_stars DESC""", (fetched[0],))

    return {"result": True, "totalStars": c2.fetchone()[1]}

@user_bp.route("/api/users/top")
def top_users():
    users = dbm.get_top_users()
    return jsonify({
        "users": [{"username": usr[0], "stars": usr[1]} for usr in users]
    })




# @user_bp.route('/api/profile/<username>', methods=['GET'])
# def get_profile_by_username(username):
#     try:
#         print(f"Fetching profile for username: {username}")  # Debug log
#
#         cursor = dbm.execute_query("""
#             SELECT
#                 u.id as user_id,
#                 p.id as profile_id,
#                 p.username,
#                 p.description,
#                 p.streak
#             FROM profile p
#             JOIN user u ON u.profile_id = p.id
#             WHERE LOWER(p.username) = LOWER(%s)
#         """, (username,))
#
#         user_data = cursor.fetchone()
#         print(f"SQL query result: {user_data}")  # Debug log
#
#         if not user_data:
#             print(f"No user found for username: {username}")  # Debug log
#             return jsonify({"error": "Profile not found"}), 404
#
#         user_id, profile_id, db_username, bio, streak = user_data
#         print(f"Found user data: id={user_id}, profile_id={profile_id}, username={db_username}")  # Debug log
#
#         import os
#         import json
#         courses = []
#         course_dir = os.path.join(os.path.dirname(__file__), '../cdn/courses')
#         if os.path.exists(course_dir):
#             for filename in os.listdir(course_dir):
#                 if filename.endswith('.json'):
#                     try:
#                         with open(os.path.join(course_dir, filename)) as f:
#                             course_data = json.load(f)
#                             if course_data.get('creator', '').lower() == username.lower():
#                                 course_id = filename[:-5]  # Remove .json extension
#                                 courses.append({
#                                     'id': course_id,
#                                     'title': course_data.get('title', 'Untitled'),
#                                     'creator': course_data.get('creator', 'Unknown'),
#                                     'tags': course_data.get('tags', [])
#                                 })
#                     except Exception as e:
#                         print(f"Error reading course file {filename}: {e}")
#                         continue
#
#         print(f"Found {len(courses)} courses for user")  # Debug log
#
#         response_data = {
#             "id": profile_id,
#             "username": db_username,
#             "bio": bio or "",
#             "streak": streak or 0,
#             "profilePicture": f"http://localhost:5000/cdn/pfp/{user_id}",
#             "courses": courses
#         }
#         print(f"Sending response: {response_data}")  # Debug log
#         return jsonify(response_data), 200
#
#     except Exception as e:
#         print(f"Error getting profile: {str(e)}")
#         return jsonify({"error": str(e)}), 500