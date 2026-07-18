import psycopg2, os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/rehab_db')

SCHEMA_SQL = '''
CREATE TABLE IF NOT EXISTS sites (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    town VARCHAR NOT NULL UNIQUE,
    site_type VARCHAR NOT NULL,
    is_active BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY,
    username VARCHAR NOT NULL UNIQUE,
    real_name VARCHAR NOT NULL,
    gender VARCHAR,
    role VARCHAR NOT NULL,
    site_id VARCHAR REFERENCES sites(id) ON DELETE CASCADE,
    phone VARCHAR,
    password VARCHAR,
    is_active BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    wechat_openid VARCHAR
);

CREATE TABLE IF NOT EXISTS students (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    id_card VARCHAR NOT NULL UNIQUE,
    gender VARCHAR NOT NULL,
    ethnicity VARCHAR NOT NULL,
    birth_date VARCHAR NOT NULL,
    age INTEGER NOT NULL,
    phone VARCHAR NOT NULL,
    home_phone VARCHAR,
    address VARCHAR NOT NULL,
    marital_status VARCHAR NOT NULL,
    living_situation VARCHAR NOT NULL,
    has_disability_cert BOOLEAN,
    disability_type VARCHAR,
    disability_level VARCHAR,
    has_dibao BOOLEAN,
    contact_person VARCHAR NOT NULL,
    contact_phone VARCHAR NOT NULL,
    co_residents JSON,
    co_resident_relation VARCHAR NOT NULL,
    living_environment VARCHAR NOT NULL,
    economic_status VARCHAR NOT NULL,
    income_source JSON,
    money_management VARCHAR NOT NULL,
    past_behavior JSON,
    current_risk VARCHAR NOT NULL,
    medication_compliance VARCHAR NOT NULL,
    medication_method VARCHAR,
    medication_detail VARCHAR,
    town VARCHAR NOT NULL,
    village VARCHAR,
    site_id VARCHAR REFERENCES sites(id) ON DELETE CASCADE,
    status VARCHAR,
    risk_level VARCHAR,
    service_type VARCHAR,
    photo VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessments (
    id VARCHAR PRIMARY KEY,
    student_id VARCHAR REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR NOT NULL,
    site_id VARCHAR REFERENCES sites(id) ON DELETE CASCADE,
    assessment_type VARCHAR NOT NULL,
    assess_date VARCHAR NOT NULL,
    assessor VARCHAR,
    round_number INTEGER,
    overall_impression TEXT NOT NULL,
    scores JSON NOT NULL,
    pdf_attachment JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trainings (
    id VARCHAR PRIMARY KEY,
    student_id VARCHAR REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR NOT NULL,
    site_id VARCHAR REFERENCES sites(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    training_type VARCHAR NOT NULL,
    training_method VARCHAR NOT NULL,
    training_level VARCHAR,
    location VARCHAR NOT NULL,
    start_time VARCHAR NOT NULL,
    end_time VARCHAR NOT NULL,
    duration_minutes INTEGER NOT NULL,
    content TEXT NOT NULL,
    summary TEXT NOT NULL,
    recorder_name VARCHAR NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
    id VARCHAR PRIMARY KEY,
    student_id VARCHAR REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR NOT NULL,
    site_id VARCHAR REFERENCES sites(id) ON DELETE CASCADE,
    visit_date VARCHAR NOT NULL,
    visit_method VARCHAR NOT NULL,
    visitor_name VARCHAR NOT NULL,
    reason VARCHAR NOT NULL,
    mental_status VARCHAR NOT NULL,
    medication_status VARCHAR NOT NULL,
    social_function VARCHAR NOT NULL,
    risk_level VARCHAR NOT NULL,
    family_communication TEXT NOT NULL,
    emotional_state VARCHAR NOT NULL,
    medication_checked BOOLEAN,
    medication_notes TEXT NOT NULL,
    next_visit_date VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR PRIMARY KEY,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    target_site_ids JSON,
    created_by VARCHAR NOT NULL,
    start_date VARCHAR,
    end_date VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE SEQUENCE IF NOT EXISTS audit_log_id_seq;
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY DEFAULT NEXTVAL('audit_log_id_seq'),
    user_id VARCHAR,
    username VARCHAR,
    action VARCHAR NOT NULL,
    entity_type VARCHAR NOT NULL,
    entity_id VARCHAR,
    details JSONB,
    ip_address VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);
'''

def init_schema():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    for stmt in SCHEMA_SQL.split(';'):
        s = stmt.strip()
        if s:
            cur.execute(s)
    print('Schema initialized successfully')
    cur.close()
    conn.close()

if __name__ == '__main__':
    init_schema()
