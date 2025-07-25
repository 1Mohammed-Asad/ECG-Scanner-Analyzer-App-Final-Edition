#!/usr/bin/env python3
"""
Setup script for shared PostgreSQL database without Docker
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def setup_database():
    """Create the shared database and tables"""
    
    # Database connection parameters
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'user': 'postgres',
        'password': 'password',  # Change this to your PostgreSQL password
        'database': 'postgres'  # Connect to default database first
    }
    
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(**db_config)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        
        cursor = conn.cursor()
        
        # Create database if it doesn't exist
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'ecg_shared_db'")
        if not cursor.fetchone():
            cursor.execute("CREATE DATABASE ecg_shared_db")
            print("✅ Database 'ecg_shared_db' created successfully")
        else:
            print("ℹ️  Database 'ecg_shared_db' already exists")
        
        # Connect to the new database
        db_config['database'] = 'ecg_shared_db'
        conn.close()
        
        conn = psycopg2.connect(**db_config)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Create uuid extension
        cursor.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email VARCHAR(120) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        """)
        
        # Create scans table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                patient_name VARCHAR(100) NOT NULL,
                patient_age INTEGER,
                patient_gender VARCHAR(10),
                file_name VARCHAR(255),
                file_url VARCHAR(500),
                prediction VARCHAR(100),
                confidence FLOAT,
                analysis_details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at)")
        
        # Insert default admin user if no users exist
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            from werkzeug.security import generate_password_hash
            hashed_password = generate_password_hash('admin123')
            cursor.execute("""
                INSERT INTO users (email, name, password_hash, role) 
                VALUES (%s, %s, %s, %s)
            """, ('admin@ecg.app', 'Administrator', hashed_password, 'admin'))
            print("✅ Default admin user created: admin@ecg.app / admin123")
        
        conn.close()
        print("✅ Database setup complete!")
        
    except psycopg2.OperationalError as e:
        print(f"❌ Error connecting to PostgreSQL: {e}")
        print("Please ensure PostgreSQL is running and accessible")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    setup_database()
