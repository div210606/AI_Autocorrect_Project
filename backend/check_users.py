from database import SessionLocal
from models import User

db = SessionLocal()

users = db.query(User).all()

print("Number of users:", len(users))

for u in users:
    print(u.id, u.username, u.email)