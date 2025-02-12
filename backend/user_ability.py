from enum import Enum


class UserAbilities(Enum):
    # Reading abilities
    READ_COURSE_PARTIAL = 0,
    READ_COURSE_FULL = 1,

    # Writing mainly for course creation
    WRITE_COURSE = 2,
    UPLOAD_CDN = 3,
    REMOVAL = 4

    # Ability to exist above all
    MODERATE = 9

configuration = {
    "basic": [UserAbilities.READ_COURSE_PARTIAL],
    "pro": [UserAbilities.READ_COURSE_FULL, UserAbilities.WRITE_COURSE, UserAbilities.REMOVAL],
    "enterprise": [UserAbilities.READ_COURSE_FULL, UserAbilities.WRITE_COURSE, UserAbilities.REMOVAL,
                   UserAbilities.UPLOAD_CDN],
    "admin": [UserAbilities.READ_COURSE_FULL, UserAbilities.WRITE_COURSE, UserAbilities.REMOVAL,
                   UserAbilities.UPLOAD_CDN, UserAbilities.MODERATE]
}

def can_do(role_name, *args):
    for arg in args:
        if arg in configuration[role_name]:
            return True

    return False
