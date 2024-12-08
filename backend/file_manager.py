import os
import json
from flask import request, jsonify, Blueprint, send_from_directory

file_bp = Blueprint("file_manager", __name__)

COURSE_DIRECTORY = '../cdn/courses'

def get_course_names_from_files():
    course_names = []
    for course in os.listdir(COURSE_DIRECTORY):
        if course.endswith(".json"):
            course_names.append(course.split(".")[0])
    return course_names

@file_bp.route('/api/file_upload', methods=['POST'])
def save_course():
    try:
        course_data = request.json

        if not course_data:
            return jsonify({"error": "No JSON data received"}), 400

        course_title = course_data.get('title', 'untitled_course')

        course_names = get_course_names_from_files()

        if course_title in course_names:
            return jsonify({"error": "Course title already exists"}), 400

        save_directory = os.path.join(os.path.dirname(__file__), COURSE_DIRECTORY)
        os.makedirs(save_directory, exist_ok=True)

        if 'elements' not in course_data or not isinstance(course_data['elements'], list) or not course_data['elements']:
            return jsonify({"error": "Course elements cannot be empty"}), 400

        file_path = os.path.join(save_directory, f"{course_title}.json")
        with open(file_path, 'w') as f:
            json.dump(course_data, f, indent=2)

        return jsonify({"message": "Course saved successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

    

@file_bp.route('/api/get_course_names', methods=['GET'])
def get_course_names():
    try:
        course_names = get_course_names_from_files()
        return jsonify({"course_names": course_names}), 200
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    

@file_bp.route('/api/courses/<courseTitle>', methods=['GET'])
def get_course(courseTitle):
    try:
        if ".." in courseTitle or "." in courseTitle:
            return jsonify({"error": "Invalid course title"}), 400
            
        file_path = os.path.join(COURSE_DIRECTORY, f"{courseTitle}.json")
        if not os.path.exists(file_path):
            return jsonify({"error": "Course not found"}), 404
            
        with open(file_path, 'r') as file:
            course_data = json.load(file)
            return jsonify(course_data), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@file_bp.route('/api/course-progress/<course_title>', methods=['GET'])
def get_progress(course_title):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"error": "No token provided"}), 401
        
    try:
        user_id = get_user_by_token(token)[0]
        cursor.execute(
            "SELECT current_step, completed FROM course_progress WHERE user_id = %s AND course_title = %s",
            (user_id, course_title)
        )
        result = cursor.fetchone()
        
        if result:
            return jsonify({
                "current_step": result[0],
                "completed": bool(result[1])
            })
        return jsonify({"current_step": 0, "completed": False})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@file_bp.route('/api/course-progress/<course_title>', methods=['POST'])
def save_progress(course_title):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"error": "No token provided"}), 401
        
    try:
        data = request.json
        user_id = get_user_by_token(token)[0]
        
        cursor.execute(
            """INSERT INTO course_progress (user_id, course_title, current_step, completed, last_accessed) 
               VALUES (%s, %s, %s, %s, NOW())
               ON DUPLICATE KEY UPDATE 
               current_step = VALUES(current_step),
               completed = VALUES(completed),
               last_accessed = NOW()""",
            (user_id, course_title, data['current_step'], data['completed'])
        )
        sql.commit()
        return jsonify({"message": "Progress saved successfully"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@file_bp.route('/api/in-progress-courses', methods=['GET'])
def get_in_progress_courses():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({"error": "No token provided"}), 401
        
    try:
        user_id = get_user_by_token(token)[0]
        cursor.execute("""
            SELECT cp.course_title, cp.current_step, 
                   (SELECT COUNT(*) FROM json_table(
                       (SELECT course_data FROM courses WHERE title = cp.course_title),
                       '$.elements[*]' COLUMNS (type VARCHAR(50) PATH '$.type')
                   ) as elements) as total_steps
            FROM course_progress cp
            WHERE cp.user_id = %s AND cp.completed = FALSE
            ORDER BY cp.last_accessed DESC
        """, (user_id,))
        
        courses = []
        for row in cursor.fetchall():
            courses.append({
                "title": row[0],
                "current_step": row[1],
                "total_steps": row[2]
            })
            
        return jsonify({"courses": courses})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
