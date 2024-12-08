from datetime import datetime, timedelta
from hashlib import sha256

from mysql import connector
import json, string, random
import sys

filename = "../db_secrets.json" if len(sys.argv) == 1 else "db_secrets.json"

with open(filename, "r") as f:
    db_secrets = json.load(f)

sql = connector.connect(port=3306,
                        database=db_secrets['name'],
                        user=db_secrets['un'])

cursor = sql.cursor(buffered=True)

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


def add_user(name: str, password, pw2, user_email, is_discord, discord_data: DCData, role='learner'):
    if password != pw2:
        raise ValueError("Passwords do not match")

    cursor.execute("INSERT INTO profile (username, description, streak) VALUES (%s, %s, %s)",
                   params=(name, "", 0))

    profile_id = cursor.lastrowid

    cursor.execute("SELECT id FROM user_role WHERE name = %s", (role,))
    role_id = cursor.fetchone()[0]

    cursor.execute("INSERT INTO classical_registration (email, password) VALUES (%s, %s)",
                   params=(user_email, sha256(password.encode('utf-8')).hexdigest()))
    registration_id = cursor.lastrowid

    token = generate_token()
    cursor.execute(
        "INSERT INTO user (isDiscord, profile_id, registration_id, token, username, joined, isAccountValid, role_id) VALUES "
        "(%s,%s,%s,%s,%s,%s,%s,%s)", params=(is_discord, profile_id, registration_id, token,
                                          name.lower(), datetime.now(), True, role_id))

    sql.commit()


def get_user(id):
    cursor.execute("SELECT * FROM user WHERE id = %s", (id))
    row = cursor.fetchone()

    return row


def change_password(id, password):
    user = get_user(id)


def login_user_via_auth(email, password):
    password = sha256(password.encode('utf-8')).hexdigest()

    cursor.execute("SELECT * FROM classical_registration WHERE email = %s AND password = %s",
                   (email, password))
    registration_data = cursor.fetchone()
    if registration_data is None:
        raise ValueError("Password or email is wrong!")
    registration_id = registration_data[0]
    cursor.execute("SELECT * FROM user WHERE registration_id = %s", (registration_id,))
    user = cursor.fetchone()
    if user is None:
        raise ValueError("User not found!")

    return user


def get_user_by_token(token):
    cursor.execute("SELECT * FROM user WHERE token = %s", (token,))
    row = cursor.fetchone()
    return row[0], row[5], row[2]


def get_profile(profile_id):
    cursor.execute("select * from profile where id=%s", (profile_id,))
    return cursor.fetchone()


def change_display_name(token, new_name):
    usr = get_user_by_token(token)

    cursor.execute("update profile set username = %s where id = %s", (new_name, usr[2],))
    sql.commit()

def change_bio(token, new_bio):
    usr = get_user_by_token(token)

    cursor.execute("update profile set description = %s where id = %s", (new_bio, usr[2],))
    sql.commit()

# cursor.close()
