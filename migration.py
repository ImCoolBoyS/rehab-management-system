#!/usr/bin/env python3
"""
精神障碍社区康复服务信息系统 ── PostgreSQL 数据库迁移与数据导入脚本
"""

import os
import sys
import json
import time
import uuid
import subprocess
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, String, Integer, Boolean, DateTime, Text, JSON, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# Define Base
Base = declarative_base()

# UUIDv7 Generator in Python (Compatible with all Python versions)
def generate_uuidv7() -> str:
    """Generates a standard UUIDv7 string."""
    # timestamp in ms
    timestamp_ms = int(time.time() * 1000)
    # 48-bit timestamp
    timestamp_bytes = timestamp_ms.to_bytes(6, byteorder='big')
    # 10 random bytes
    rand_bytes = os.urandom(10)
    
    # Construct bytes according to UUIDv7 spec (RFC 9562)
    # set version to 7 (bits 48-51)
    # set variant to 1 (bits 64-65)
    var_rand_bytes = bytearray(rand_bytes)
    var_rand_bytes[0] = (var_rand_bytes[0] & 0x0F) | 0x70  # Version 7
    var_rand_bytes[2] = (var_rand_bytes[2] & 0x3F) | 0x80  # Variant 1 (RFC 9562)
    
    uuid_bytes = timestamp_bytes + bytes(var_rand_bytes)
    return str(uuid.UUID(bytes=uuid_bytes))

# Define ORM Database schemas based on requirements
class Site(Base):
    __tablename__ = 'sites'
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    town = Column(String(100), nullable=False, unique=True)
    site_type = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

class User(Base):
    __tablename__ = 'users'
    id = Column(String(36), primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    real_name = Column(String(100), nullable=False)
    gender = Column(String(10), nullable=False)
    role = Column(String(50), nullable=False)
    site_id = Column(String(36), ForeignKey('sites.id', ondelete='CASCADE'), nullable=False)
    phone = Column(String(50), nullable=False)
    password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

class Student(Base):
    __tablename__ = 'students'
    id = Column(String(36), primary_key=True)
    name = Column(String(100), nullable=False)
    id_card = Column(String(18), unique=True, nullable=False)
    gender = Column(String(10), nullable=False)
    ethnicity = Column(String(50), nullable=False)
    birth_date = Column(String(20), nullable=False)
    age = Column(Integer, nullable=False)
    phone = Column(String(50), nullable=False)
    home_phone = Column(String(50), nullable=True)
    address = Column(String(255), nullable=False)
    marital_status = Column(String(50), nullable=False)
    living_situation = Column(String(255), nullable=False)
    has_disability_cert = Column(Boolean, default=False)
    disability_type = Column(String(100), nullable=True)
    disability_level = Column(String(50), nullable=True)
    has_dibao = Column(Boolean, default=False)
    contact_person = Column(String(100), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    co_residents = Column(JSON, nullable=True)
    co_resident_relation = Column(String(50), nullable=False)
    living_environment = Column(String(50), nullable=False)
    economic_status = Column(String(50), nullable=False)
    income_source = Column(JSON, nullable=True)
    money_management = Column(String(100), nullable=False)
    past_behavior = Column(JSON, nullable=True)
    current_risk = Column(String(255), nullable=False)
    medication_compliance = Column(String(50), nullable=False)
    medication_method = Column(String(100), nullable=True)
    medication_detail = Column(Text, nullable=True)
    town = Column(String(100), nullable=False)
    village = Column(String(100), nullable=False)
    site_id = Column(String(36), ForeignKey('sites.id', ondelete='CASCADE'), nullable=False)
    status = Column(String(50), default='active')
    risk_level = Column(String(50), default='low')
    service_type = Column(String(50), default='type80')
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

class Assessment(Base):
    __tablename__ = 'assessments'
    id = Column(String(36), primary_key=True)
    student_id = Column(String(36), ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    student_name = Column(String(100), nullable=False)
    site_id = Column(String(36), ForeignKey('sites.id', ondelete='CASCADE'), nullable=False)
    assessment_type = Column(String(50), nullable=False)
    assess_date = Column(String(20), nullable=False)
    assessor = Column(String(100), nullable=False)
    round_number = Column(Integer, nullable=True)
    overall_impression = Column(Text, nullable=False)
    scores = Column(JSON, nullable=False)
    pdf_attachment = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

class Training(Base):
    __tablename__ = 'trainings'
    id = Column(String(36), primary_key=True)
    student_id = Column(String(36), ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    student_name = Column(String(100), nullable=False)
    site_id = Column(String(36), ForeignKey('sites.id', ondelete='CASCADE'), nullable=False)
    title = Column(String(255), nullable=False)
    training_type = Column(String(100), nullable=False)
    training_method = Column(String(50), nullable=False)
    training_level = Column(String(50), nullable=True)
    location = Column(String(100), nullable=False)
    start_time = Column(String(50), nullable=False)
    end_time = Column(String(50), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=False)
    recorder_name = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

class Visit(Base):
    __tablename__ = 'visits'
    id = Column(String(36), primary_key=True)
    student_id = Column(String(36), ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    student_name = Column(String(100), nullable=False)
    site_id = Column(String(36), ForeignKey('sites.id', ondelete='CASCADE'), nullable=False)
    visit_date = Column(String(20), nullable=False)
    visit_method = Column(String(50), nullable=False)
    visitor_name = Column(String(100), nullable=False)
    reason = Column(String(255), nullable=False)
    mental_status = Column(String(50), nullable=False)
    medication_status = Column(String(50), nullable=False)
    social_function = Column(String(50), nullable=False)
    risk_level = Column(String(50), nullable=False)
    family_communication = Column(Text, nullable=False)
    emotional_state = Column(String(100), nullable=False)
    medication_checked = Column(Boolean, default=False)
    medication_notes = Column(Text, nullable=False)
    next_visit_date = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)

class Announcement(Base):
    __tablename__ = 'announcements'
    id = Column(String(36), primary_key=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    target_site_ids = Column(JSON, nullable=True)
    created_by = Column(String(100), nullable=False)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)


# Export TypeScript data using Node.js
def export_data_from_typescript():
    pass

def run_migration():
    # 1. Database Connection Configuration
    db_url = os.environ.get(
        "DATABASE_URL", 
        "postgresql://postgres:password@localhost:5432/rehab_db"
    )
    print(f"Connecting to target PostgreSQL: {db_url}")
    
    try:
        engine = create_engine(db_url)
        # Create all tables if they don't exist
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        session = Session()
    except Exception as e:
        print(f"Database connection error: {e}")
        print("Please ensure your PostgreSQL server is active and the DATABASE_URL is set in your environment.")
        sys.exit(1)

    # 2. Extract Data from TypeScript
    print("Reading data from frontend/src/data.ts...")
    try:
        raw_data = json.load(open('seed_data.json', encoding='utf-8'))
    except Exception as e:
        print(f"Error executing tsx compiler to export data.ts: {e}")
        sys.exit(1)

    now = datetime.utcnow()

    # 3. Clear Existing Data in Order (Dependent Tables First to Prevent FK Violations)
    print("Clearing existing data from tables...")
    try:
        session.query(Visit).delete()
        session.query(Training).delete()
        session.query(Assessment).delete()
        session.query(Student).delete()
        session.query(User).delete()
        session.query(Site).delete()
        session.query(Announcement).delete()
        session.commit()
    except Exception as e:
        session.rollback()
        print(f"Error during table truncation: {e}")
        sys.exit(1)

    # Dictionary mapping old site_id to newly generated UUIDv7 site_id
    site_uuid_map = {}
    town_site_id_map = {}

    # 4. Insert Sites
    print("Inserting Sites...")
    for s in raw_data['sites']:
        new_id = generate_uuidv7()
        site_uuid_map[s['id']] = new_id
        town_site_id_map[s['town']] = new_id
        
        db_site = Site(
            id=new_id,
            name=s['name'],
            town=s['town'],
            site_type=s['siteType'],
            is_active=s['isActive'],
            created_at=now,
            deleted_at=None
        )
        session.add(db_site)
    session.commit()

    # 5. Insert Users
    print("Inserting Users...")
    for u in raw_data['users']:
        new_id = generate_uuidv7()
        # map site_id
        mapped_site_id = site_uuid_map.get(u['siteId'])
        if not mapped_site_id:
            # Look up by town name if site ID mapping is not found directly
            continue
            
        db_user = User(
            id=new_id,
            username=u['username'],
            real_name=u['realName'],
            gender=u['gender'],
            role=u['role'],
            site_id=mapped_site_id,
            phone=u['phone'],
            password=u.get('password', 'admin123'),
            is_active=u['isActive'],
            created_at=now,
            deleted_at=None
        )
        session.add(db_user)
    session.commit()

    # Dictionary mapping old student_id to newly generated UUIDv7 student_id
    student_uuid_map = {}

    # 6. Insert Students
    print("Inserting Students...")
    for s in raw_data['students']:
        new_id = generate_uuidv7()
        student_uuid_map[s['id']] = new_id
        
        # map site_id based on siteId, or fall back to mapping by town
        mapped_site_id = site_uuid_map.get(s['siteId']) or town_site_id_map.get(s['town'])
        if not mapped_site_id:
            print(f"Warning: Could not map site for student {s['name']} (town: {s['town']})")
            continue

        db_student = Student(
            id=new_id,
            name=s['name'],
            id_card=s['idCard'],
            gender=s['gender'],
            ethnicity=s['ethnicity'],
            birth_date=s['birthDate'],
            age=s['age'],
            phone=s['phone'],
            home_phone=s.get('homePhone'),
            address=s['address'],
            marital_status=s['maritalStatus'],
            living_situation=s['livingSituation'],
            has_disability_cert=s['hasDisabilityCert'],
            disability_type=s.get('disabilityType'),
            disability_level=s.get('disabilityLevel'),
            has_dibao=s['hasDibao'],
            contact_person=s['contactPerson'],
            contact_phone=s['contactPhone'],
            co_residents=s.get('coResidents', []),
            co_resident_relation=s['coResidentRelation'],
            living_environment=s['livingEnvironment'],
            economic_status=s['economicStatus'],
            income_source=s.get('incomeSource', []),
            money_management=s['moneyManagement'],
            past_behavior=s.get('pastBehavior', []),
            current_risk=s['currentRisk'],
            medication_compliance=s['medicationCompliance'],
            medication_method=s.get('medicationMethod'),
            medication_detail=s.get('medicationDetail'),
            town=s['town'],
            village=s['village'],
            site_id=mapped_site_id,
            status=s.get('status', 'active'),
            risk_level=s.get('riskLevel', 'low'),
            service_type=s.get('serviceType', 'type80'),
            created_at=now,
            deleted_at=None
        )
        session.add(db_student)
    session.commit()

    # 7. Insert Assessments
    print("Inserting Assessments...")
    for a in raw_data['assessments']:
        new_id = generate_uuidv7()
        mapped_student_id = student_uuid_map.get(a['studentId'])
        mapped_site_id = site_uuid_map.get(a['siteId'])
        
        if not mapped_student_id or not mapped_site_id:
            continue
            
        db_assessment = Assessment(
            id=new_id,
            student_id=mapped_student_id,
            student_name=a['studentName'],
            site_id=mapped_site_id,
            assessment_type=a['assessmentType'],
            assess_date=a['assessDate'],
            assessor=a['assessor'],
            round_number=a.get('roundNumber'),
            overall_impression=a['overallImpression'],
            scores=a['scores'],
            pdf_attachment=a.get('pdfAttachment'),
            created_at=now,
            deleted_at=None
        )
        session.add(db_assessment)
    session.commit()

    # 8. Insert Trainings
    print("Inserting Trainings...")
    for t in raw_data['trainings']:
        new_id = generate_uuidv7()
        mapped_student_id = student_uuid_map.get(t['studentId'])
        mapped_site_id = site_uuid_map.get(t['siteId'])
        
        if not mapped_student_id or not mapped_site_id:
            continue
            
        db_training = Training(
            id=new_id,
            student_id=mapped_student_id,
            student_name=t['studentName'],
            site_id=mapped_site_id,
            title=t['title'],
            training_type=t['trainingType'],
            training_method=t['trainingMethod'],
            training_level=t.get('trainingLevel'),
            location=t['location'],
            start_time=t['startTime'],
            end_time=t['endTime'],
            duration_minutes=t['durationMinutes'],
            content=t['content'],
            summary=t['summary'],
            recorder_name=t['recorderName'],
            details=t.get('details'),
            created_at=now,
            deleted_at=None
        )
        session.add(db_training)
    session.commit()

    # 9. Insert Visits
    print("Inserting Visits...")
    for v in raw_data['visits']:
        new_id = generate_uuidv7()
        mapped_student_id = student_uuid_map.get(v['studentId'])
        mapped_site_id = site_uuid_map.get(v['siteId'])
        
        if not mapped_student_id or not mapped_site_id:
            continue
            
        db_visit = Visit(
            id=new_id,
            student_id=mapped_student_id,
            student_name=v['studentName'],
            site_id=mapped_site_id,
            visit_date=v['visitDate'],
            visit_method=v['visitMethod'],
            visitor_name=v['visitorName'],
            reason=v['reason'],
            mental_status=v['mentalStatus'],
            medication_status=v['medicationStatus'],
            social_function=v['socialFunction'],
            risk_level=v['riskLevel'],
            family_communication=v['familyCommunication'],
            emotional_state=v['emotionalState'],
            medication_checked=v['medicationChecked'],
            medication_notes=v['medicationNotes'],
            next_visit_date=v.get('nextVisitDate'),
            created_at=now,
            deleted_at=None
        )
        session.add(db_visit)
    session.commit()

    # 10. Insert Announcements
    print("Inserting Announcements...")
    for ann in raw_data['announcements']:
        new_id = generate_uuidv7()
        # map targetSiteIds if any
        mapped_site_ids = None
        if ann.get('targetSiteIds'):
            mapped_site_ids = [site_uuid_map[old_id] for old_id in ann['targetSiteIds'] if old_id in site_uuid_map]
            
        db_ann = Announcement(
            id=new_id,
            title=ann['title'],
            content=ann['content'],
            target_site_ids=mapped_site_ids,
            created_by=ann['createdBy'],
            start_date=ann.get('startDate'),
            end_date=ann.get('endDate'),
            created_at=now,
            deleted_at=None
        )
        session.add(db_ann)
    session.commit()

    print("\n=============================================")
    print("[OK] Database migration and data seeding completed successfully!")
    print(f"Total sites inserted: {len(raw_data['sites'])}")
    print(f"Total users inserted: {len(raw_data['users'])}")
    print(f"Total students inserted: {len(raw_data['students'])}")
    print(f"Total assessments inserted: {len(raw_data['assessments'])}")
    print(f"Total training records inserted: {len(raw_data['trainings'])}")
    print(f"Total home visits inserted: {len(raw_data['visits'])}")
    print(f"Total announcements inserted: {len(raw_data['announcements'])}")
    print("=============================================\n")


if __name__ == "__main__":
    run_migration()

