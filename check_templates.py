#!/usr/bin/env python3

import sys
sys.path.append('/app')

from app.database import SessionLocal
from app.models import ScanTemplate

def check_templates():
    db = SessionLocal()
    try:
        # Check all templates
        templates = db.query(ScanTemplate).all()
        print(f'Total templates: {len(templates)}')
        for template in templates:
            print(f'ID: {template.id}, Name: "{template.name}", Description: "{template.description}"')
        
        # Check for specific problematic names
        print('\nChecking for specific names:')
        default_config = db.query(ScanTemplate).filter(ScanTemplate.name == 'Use default configuration').all()
        print(f'Templates with "Use default configuration": {len(default_config)}')
        
        empty_names = db.query(ScanTemplate).filter(ScanTemplate.name.is_(None) | (ScanTemplate.name == '')).all()
        print(f'Templates with empty names: {len(empty_names)}')
        
        # Check for any templates that might render as "Use default configuration"
        all_templates = db.query(ScanTemplate).all()
        for template in all_templates:
            if template.name and 'default' in template.name.lower() and 'configuration' in template.name.lower():
                print(f'Found potential match: ID: {template.id}, Name: "{template.name}"')
        
        # Check for empty descriptions
        print('\nChecking template details:')
        for template in all_templates:
            name_len = len(template.name or "")
            desc_len = len(template.description or "")
            print(f'ID: {template.id}, Name: "{template.name}" ({name_len} chars), Description: "{template.description}" ({desc_len} chars)')
            
            # Check what the frontend would render
            if template.name and template.description:
                frontend_render = f"{template.name} - {template.description}"
                print(f'  Frontend would render: "{frontend_render}"')
            elif template.name:
                print(f'  Frontend would render: "{template.name}"')
            else:
                print(f'  Frontend would render: Empty or undefined')
    finally:
        db.close()

if __name__ == "__main__":
    check_templates()
