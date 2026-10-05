from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Add missing columns to reports table
    alter_statements = [
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority_score FLOAT DEFAULT 0.0 NOT NULL",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority_reasoning TEXT",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS image_embedding TEXT",
        "ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_count INTEGER DEFAULT 1 NOT NULL",
    ]
    for stmt in alter_statements:
        conn.execute(text(stmt))
        print("Executed:", stmt.split("ADD COLUMN IF NOT EXISTS ")[1].split(" ")[0])
    conn.commit()
    print("All columns added successfully!")

    # Verify
    result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'reports' ORDER BY ordinal_position"))
    cols = [row[0] for row in result]
    print("Updated reports columns:", cols)
