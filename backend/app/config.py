import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:2025/pashurakshak_db")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretjwtkeypashurakshak123!")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "static/uploads")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
