#!/usr/bin/env python3

from app.database import SessionLocal
from sqlalchemy import text

def check_tables():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"))
        tables = [row[0] for row in result.fetchall()]
        print("Existing tables:")
        for table in tables:
            print(f"  - {table}")
    except Exception as e:
        print(f"Error checking tables: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_tables()
