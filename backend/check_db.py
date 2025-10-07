#!/usr/bin/env python3
"""
Check database schema and scan_templates table
"""
from app.database import get_db
from app.models import ScanTemplate
from sqlalchemy import inspect

def check_database():
    # Get database session
    db = next(get_db())
    
    try:
        # Check if scan_templates table exists and its structure
        inspector = inspect(db.bind)
        if 'scan_templates' in inspector.get_table_names():
            columns = inspector.get_columns('scan_templates')
            print('scan_templates table exists with columns:')
            for col in columns:
                print(f'  - {col["name"]}: {col["type"]}')
        else:
            print('scan_templates table does not exist!')
        
        # Try to query the table
        try:
            templates = db.query(ScanTemplate).limit(1).all()
            print(f'Successfully queried scan_templates table. Found {len(templates)} templates.')
        except Exception as e:
            print(f'Error querying scan_templates table: {e}')
            
    except Exception as e:
        print(f'Database connection error: {e}')
    finally:
        db.close()

if __name__ == "__main__":
    check_database()
