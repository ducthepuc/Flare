import json
from flask import Blueprint, jsonify, request
from user_ability import can_do, UserAbilities
import dbmanager as dbm

course_bp = Blueprint("course_bp", __name__)


@course_bp.route("/api/course/upload_course", methods=["POST"])
def upload_course():
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"result": False, "response": "Please provide a valid user token"}), 401

    usr = dbm.get_user_by_token(auth, True)
    if not usr or not can_do(usr[9], UserAbilities.WRITE_COURSE):
        return jsonify({"result": False, "response": "User does not have permission to upload a course"}), 403

    try:
        course = request.json
        title = course.get("title")
        desc = course.get("description")
        tags = course.get("tags", [])
        elements = course.get("elements", [])

        if not title or not desc:
            return jsonify({"result": False, "response": "Title and description are required"}), 400

        dbm.create_course(usr[0], title, desc, tags, elements)
        return jsonify({"result": True, "response": "Course uploaded successfully!"}), 201
    except Exception as e:
        return jsonify({"result": False, "response": f"Error: {str(e)}"}), 500


@course_bp.route("/api/tags/popular", methods=["GET"])
def popular_tags():
    try:
        tags = dbm.get_popular_tags()
        value = [{"name": tag, "count": count} for tag, count in tags]
        return jsonify({"tags": value}), 200
    except Exception as e:
        return jsonify({"result": False, "response": f"Error: {str(e)}"}), 500


@course_bp.route("/api/tags/popular/<int:limit>", methods=["GET"])
def popular_tags_limit(limit):
    try:
        tags = dbm.get_popular_tags(limit)
        value = [{"name": tag, "count": count} for tag, count in tags]
        return jsonify({"tags": value}), 200
    except Exception as e:
        return jsonify({"result": False, "response": f"Error: {str(e)}"}), 500


@course_bp.route("/api/get_course_objects", methods=["GET"])
def get_course_objects():
    try:
        courses = dbm.get_all_courses()
        courses_list = [{
            "id": c[0],
            "title": c[2],
            "creator": c[1],
            "tags": c[4].split(";")
        } for c in courses]
        return jsonify({"response": True, "result": courses_list}), 200
    except Exception as e:
        return jsonify({"response": False, "error": f"Error: {str(e)}"}), 500


@course_bp.route("/api/courses/<course_id>", methods=["GET"])
def get_course(course_id):
    try:
        course = dbm.get_course_by(course_id)
        if not course:
            return jsonify({"result": False, "response": "Course not found"}), 404
        return jsonify({"creator": course[1], "elements": json.loads(course[5])}), 200
    except Exception as e:
        return jsonify({"response": False, "error": f"Error: {str(e)}"}), 500


@course_bp.route("/api/course_progress/<course_id>", methods=["GET", "POST"])
def course_progress(course_id):
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"result": False, "response": "Unauthorized access"}), 401
    try:
        if request.method == "GET":
            progress = dbm.get_course_progress(auth, course_id)
            if not progress:
                return {"result": True, "progress": 0, "currentStep": 0}
            else:
                return {"result": True, "progress": progress[2], "currentStep": progress[2]}

        elif request.method == "POST":
            progress = dbm.get_course_progress(auth, course_id)
            if progress is None:
                dbm.add_course_progress(auth, course_id)
            else:
                dbm.set_course_progress(auth, course_id, request.json.get("currentStep", 0))
            return jsonify({"result": True, "response": "Progress updated successfully"}), 200
    except Exception as e:
        return jsonify({"response": False, "error": f"Error: {str(e)}"}), 500

@course_bp.route('/api/course/<course_id>/stars', methods=['OPTIONS'])
def preflight_check(course_id):
    response = jsonify({'message': 'Preflight check passed'})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
    return response, 200

@course_bp.route("/api/course/<course_id>/stars", methods = ["GET", "POST", "OPTIONS", "DELETE"])
def stars(course_id):
    auth = request.headers.get("Authorization")
    if not auth:
        return jsonify({"result": False, "response": "Unauthorized access"}), 401

    try:
        if request.method == "GET":
            return {"result": True, "stars": dbm.get_course_stars(course_id),
                    "hasStarred": dbm.have_we_starred(auth, course_id)}, 200
        elif request.method == "POST":
            course = dbm.get_course_by(course_id)
            if not course:
                return {"result": False, "response": "Course not found"}, 404

            r = dbm.add_course_star(auth,course_id)
            if not r:
                return {"result": False, "response": "Already starred"}, 500
            return {"result": True, "response": "Star added"}
        elif request.method == "DELETE":
            course = dbm.get_course_by(course_id)
            if not course:
                return {"result": False, "response": "Course not found"}, 404

            r = dbm.remove_course_star(auth, course_id)
            if not r:
                return {"result": False, "response": "Not starred"}, 500

            return {"result": True, "response": "Star removed"}
    except Exception as e:
        return jsonify({"response": False, "error": f"Error: {str(e)}"}), 500
