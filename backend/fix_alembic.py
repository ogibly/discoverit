#!/usr/bin/env python3

from app.database import SessionLocal
from sqlalchemy import text

def fix_alembic_version():
    db = SessionLocal()
    try:
        # Update the alembic version to the latest merge revision
        db.execute(text("UPDATE alembic_version SET version_num = 'cb1c03a45ec0'"))
        db.commit()
        print("Successfully updated alembic version to cb1c03a45ec0")
    except Exception as e:
        print(f"Error updating alembic version: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_alembic_version()
