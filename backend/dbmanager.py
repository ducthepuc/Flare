from datetime import datetime, timedelta
from hashlib import sha256
from token_system import decrypt_token, encrypt_token, hash_token
import json, string, random
import sys
import pymysql
from dbutils.pooled_db import PooledDB

filename = "../db_secrets.json" if len(sys.argv) == 1 else "db_secrets.json"

with open(filename, "r") as f:
    db_secrets = json.load(f)

dbconfig = {
    "creator": pymysql,
    "maxconnections": 5,
    "mincached": 1,
    "maxcached": 3,
    "blocking": True, # <--- so that it waits for a connection
    "host": "localhost",
    "port": 3306,
    "database": db_secrets['name'],
    "user": db_secrets['un'],
    "password": db_secrets['pw']
}

class OutputMessageError(Exception):
    """
    Custom output error message
    Safe to use, all dbmanager.py file functions use It
    It tells safe errors for the API.
    """

    def __init__(self, msg):
        self.msg = msg

    def __str__(self):
        return repr(self.msg)

def call_safe(func, *args):
    """

    """
    func(*args)
sql_pool = PooledDB(**dbconfig)

def pooled_query(query: str, args = (), do_commit = False) -> pymysql.cursors.Cursor:
    sql = sql_pool.connection()

    try:
        with sql.cursor() as cursor:
            cursor.execute(query, args)
            curs = cursor

        if do_commit: sql.commit()
    finally:
        sql.close()

    return curs

base_date = datetime(1900, 1, 1).date()

def time_to_dt(days_since_1900):
    return base_date + timedelta(days=days_since_1900)

def dt_to_time(date):
    return (date - base_date).days

def generate_token():
    chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
    return ''.join([random.choice(chars) for _ in range(30)])

class DCData:
    def __init__(self):
        ...

def add_user(name: str, password, pw2, user_email, is_discord, discord_data: DCData):
    """

    """
    if password != pw2:
        raise OutputMessageError("Passwords do not match")

    c1 = pooled_query("INSERT INTO profile (username, description, streak) VALUES (%s, %s, %s)",
                 (name, "", 0,), True)
    profile_id = c1.lastrowid

    if is_discord:
        registration_id = 0
    else:
        c2 = pooled_query("INSERT INTO classical_registration (email, password) VALUES (%s, %s)",
            (user_email, sha256(password.encode('utf-8')).hexdigest(),), True)
        registration_id = c2.lastrowid


    token = generate_token()
    res, ntoken = encrypt_token(token)

    pooled_query("INSERT INTO user (isDiscord, profile_id, registration_id, token, hashed_token, username, joined, isAccountValid) VALUES "
        "(%s,%s,%s,%s,%s,%s,%s,%s)", (is_discord, profile_id, registration_id, ntoken, hash_token(token),
                                      name, datetime.now(), 1),
                 do_commit=True)


def get_user(id):
    with pooled_query("SELECT * FROM user WHERE id = %s", (id,)) as c:
        row = c.fetchone()

    res, real_token = decrypt_token(row[4])

    if not res: return None

    new_row = list(row)
    new_row[4] = real_token
    return new_row

def login_user_via_auth(email, password):
    password = sha256(password.encode('utf-8')).hexdigest()

    c1 = pooled_query("SELECT * FROM classical_registration WHERE email = %s AND password = %s",
        (email, password,))
    registration_data = c1.fetchone()
    if registration_data is None:
        raise OutputMessageError("Password or email is wrong!")
    
    registration_id = registration_data[0]
    c2 = pooled_query("SELECT * FROM user WHERE registration_id = %s",
        (registration_id,))

    user = c2.fetchone()
    if user is None:
        raise OutputMessageError("User not found!")

    res, real_token = decrypt_token(user[4])
    print(res, real_token)
    if not res: return None

    new_row = list(user)
    new_row[4] = real_token
    return new_row


def get_user_by_token(token, verbose = False):
    if token is None:
        return

    c = pooled_query("SELECT * FROM user WHERE hashed_token = %s", (hash_token(token),))
    row = c.fetchone()
    if not row:
        return False

    if verbose:
        return row
    return row[0], row[5], row[2]



def get_profile(profile_id):
    c = pooled_query("SELECT * FROM profile WHERE id = %s", (profile_id,))
    return c.fetchone()

def change_display_name(token, new_name):
    usr = get_user_by_token(token)
    if not usr:
        return False

    if not usr:
        raise OutputMessageError("Invalid token")

    pooled_query("UPDATE profile SET username = %s WHERE id = %s", (new_name, usr[2]), True)

    return True

def change_bio(token, new_bio):
    usr = get_user_by_token(token)
    if not usr:
        raise OutputMessageError("Invalid token")

    pooled_query("UPDATE profile SET description = %s WHERE id = %s", (new_bio, usr[2]), True)

    return True

def create_course(creator_id, name, description, tags, content):
    tags = ";".join(tags)

    content = json.dumps(content)

    pooled_query("INSERT INTO course (creator, name, description, tags, content, creation_date) VALUES (%s,%s,%s,%s,%s, %s)",
                 (creator_id, name, description, tags, content, datetime.now(),), True)
    return True

def get_popular_tags(limit=100):
    # Damn this one took long to write
    c = pooled_query("""
WITH SplitTags AS (
    SELECT
        TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(tags, ';', numbers.n), ';', -1)) AS tag
    FROM
        course
    JOIN (
        SELECT 1 AS n
        UNION ALL SELECT 2
        UNION ALL SELECT 3
        UNION ALL SELECT 4
        UNION ALL SELECT 5
        UNION ALL SELECT 6
        UNION ALL SELECT 7
        UNION ALL SELECT 8
        UNION ALL SELECT 9
        UNION ALL SELECT 10
    ) numbers
    ON CHAR_LENGTH(tags) - CHAR_LENGTH(REPLACE(tags, ';', '')) + 1 >= numbers.n
)
SELECT
    tag,
    COUNT(*) AS count
FROM
    SplitTags
WHERE
    tag <> ''
GROUP BY
    tag
ORDER BY
    count DESC, tag ASC
LIMIT %s;""", (limit,))

    return c.fetchall()

def get_all_courses():
    c = pooled_query("SELECT * FROM course")
    return c.fetchall()

def get_course_by(course_id):
    c = pooled_query("SELECT * FROM course WHERE id = %s", (course_id,))
    return c.fetchone()

def get_course_progress(token, course_id):
    usr = get_user_by_token(token, True)
    c = pooled_query("SELECT * FROM course_progress WHERE user_id = %s AND course_id = %s",
                     (usr[0],course_id,))
    return c.fetchone()

def set_course_progress(token, course_id, new_progress):
    usr = get_user_by_token(token, True)
    pooled_query("UPDATE course_progress SET progress = %s WHERE course_id = %s AND user_id = %s",
                     (new_progress, course_id, usr[0], ), True)


def add_course_progress(token, course_id):
    usr = get_user_by_token(token, True)

    existing = pooled_query(
        "SELECT 1 FROM course_progress WHERE user_id = %s AND course_id = %s",
        (usr[0], course_id)
    ).fetchone()

    if not existing:
        pooled_query(
            "INSERT INTO course_progress (user_id, course_id, progress, started, updated) VALUES (%s,%s,%s,%s,%s)",
            (usr[0], course_id, 0, datetime.now(), datetime.now()),
            True
        )

def get_course_stars(course_id):
    c = pooled_query("SELECT COUNT(*) AS total_count FROM course_stars WHERE course_id = %s GROUP BY course_id;",
                 (course_id,))
    r = c.fetchone()
    if r:
        return r[0]
    return 0


def have_we_starred(token, course_id):
    usr = get_user_by_token(token, True)
    c = pooled_query("SELECT * FROM course_stars WHERE user_id = %s AND course_id = %s",
                     (usr[0], course_id))
    if c.fetchone():
        return True
    return False

def add_course_star(token, course_id):
    usr = get_user_by_token(token, True)
    try:
        pooled_query("INSERT INTO course_stars (user_id, course_id, date) VALUES (%s, %s, %s)",
                         (usr[0], course_id, datetime.now()), True)

        return True
    except Exception:
        return False

def remove_course_star(token, course_id):
    usr = get_user_by_token(token)
    try:
        pooled_query("DELETE FROM course_stars WHERE user_id = %s AND course_id = %s",
                     (usr[0], course_id), True)

        return True
    except Exception:
        return False

def get_top_users(limit = 3):
    c = pooled_query("""SELECT u.username AS username, COUNT(cs.user_id) AS total_stars FROM user u 
    JOIN course c ON u.id = c.creator JOIN course_stars cs ON c.id = cs.course_id GROUP BY u.id 
    ORDER BY total_stars DESC LIMIT %s""", (limit,))
    return c.fetchall()