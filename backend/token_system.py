from apscheduler.schedulers.background import BackgroundScheduler
import sqlite3
from cryptography.fernet import Fernet
from typing import Tuple, Optional
import hashlib

# I hate singletons, will do for now!
class DBHandler:
    instance: Optional["DBHandler"] = None

    def __init__(self, db):
        self.__db = db
        if not DBHandler.instance:
            DBHandler.instance = self

    @property
    def db(self):
        return self.__db

    def get_cursor(self):
        return self.__db.cursor()


scheduler = BackgroundScheduler()

def rotate_key():
    print(get_latest_version())


scheduler.add_job(rotate_key, 'interval', days=7)
DBHandler(sqlite3.connect("keys.db", check_same_thread=False))


def initialize():
    cursor = DBHandler.instance.get_cursor()
    cursor.execute("""CREATE TABLE IF NOT EXISTS encryption_keys (
            version TEXT PRIMARY KEY,
            key TEXT NOT NULL
        )""")
    DBHandler.instance.db.commit()

    cursor.execute("SELECT * FROM encryption_keys")
    res = cursor.fetchone()

    if res is None or len(res) == 0:
        cursor.execute("INSERT INTO encryption_keys (version, key) VALUES (?, ?)", (1, Fernet.generate_key()))
        DBHandler.instance.db.commit()

    cursor.close()


def get_latest_version() -> int:
    cursor = DBHandler.instance.get_cursor()
    cursor.execute("SELECT version FROM encryption_keys ORDER BY version DESC LIMIT 1")
    result = cursor.fetchone()
    cursor.close()
    return int(result[0]) if result else 1


def decrypt_token(token: str) -> Tuple[bool, str]:
    args = token.split("_")  # Expects a v<number>_ format, checked upon parent call
    version = args[0][1]
    token_self = "_".join(args[1:])

    cursor = DBHandler.instance.get_cursor()
    cursor.execute("SELECT key FROM encryption_keys WHERE version = ?", (version,))
    row = cursor.fetchone()
    cursor.close()

    if not row:
        return False, "Encryption key not found"

    key = row[0]
    token_decrypted = Fernet(key).decrypt(token_self.encode())

    return True, token_decrypted.decode()


def encrypt_token(token: str) -> Tuple[bool, str]:
    version = get_latest_version()

    cursor = DBHandler.instance.get_cursor()
    cursor.execute("SELECT key FROM encryption_keys WHERE version = ?", (version,))
    row = cursor.fetchone()
    cursor.close()

    if not row:
        return False, "No latest key found"

    key = row[0]
    encrypted_token = Fernet(key).encrypt(token.encode())

    return True, f"v{version}_{encrypted_token.decode()}"


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()
