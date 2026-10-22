import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:350400@localhost:5432/pashurakshak_db")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretjwtkeypashurakshak123!")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "static/uploads")

# AI & Search API Keys
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "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")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY", "88974e0285b4d902ed0b09d2f895c3cd3d803176")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)
