import sys
import traceback

def test():
    try:
        from main import UserCreate
        u = UserCreate(name="test", username="test", email="test@email.com", password="password", confirm_password="password")
        print("UserCreate OK.")
    except Exception as e:
        print("UserCreate FAILED:")
        traceback.print_exc()

    try:
        from main import get_password_hash
        get_password_hash("password")
        print("get_password_hash OK.")
    except Exception as e:
        print("get_password_hash FAILED:")
        traceback.print_exc()

test()
