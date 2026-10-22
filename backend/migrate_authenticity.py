import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import engine
from sqlalchemy import text

statements = [
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_web_image BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS authenticity_status VARCHAR(255) DEFAULT 'AUTHENTIC FIELD PHOTO VERIFIED';"
]

with engine.connect() as conn:
    for stmt in statements:
        conn.execute(text(stmt))
    conn.commit()
    print("Database migration for authenticity columns completed successfully!")
