#!/usr/bin/env python3
"""
Setup script for shared SQL database using SQLite
"""

import os
import sqlite3
from werkzeug.security import generate_password_hash
from datetime import datetime

def setup_sql_database():
    """Create the shared SQL database and tables"""
    
    # Create shared data directory
    shared_dir = "shared_sql_data"
    if not os.path.exists(shared_dir):
        os.makedirs(shared_dir)
    
    db_path = os.path.join(shared_dir, "ecg_shared.db")
    
    # Connect to SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER DEFAULT 1
        )
    ''')
    
    # Create scans table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            patient_name TEXT NOT NULL,
            patient_age INTEGER,
            patient_gender TEXT,
            file_name TEXT,
            file_url TEXT,
            prediction TEXT,
            confidence REAL,
            analysis_details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # Create indexes for better performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at)")
    
    # Insert default admin user if no users exist
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        admin_id = "admin-12345-67890-abcde"
        hashed_password = generate_password_hash('admin123')
        cursor.execute('''
            INSERT INTO users (id, email, name, password_hash, role) 
            VALUES (?, ?, ?, ?, ?)
        ''', (admin_id, 'admin@ecg.app', 'Administrator', hashed_password, 'admin'))
        print("✅ Default admin user created: admin@ecg.app / admin123")
    
    conn.commit()
    conn.close()
    
    print(f"✅ SQL database created at: {db_path}")
    print("✅ Database setup complete!")

if __name__ == "__main__":
    setup_sql_database()
