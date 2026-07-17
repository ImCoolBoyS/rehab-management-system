# -*- coding: utf-8 -*-
"""
精神康复中心管理系统 - FastAPI 后端服务器
数据库: PostgreSQL 16
"""
import os, json, re, uuid, shutil
from typing import Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2 import pool as pg_pool
from psycopg2.extras import RealDictCursor
import bcrypt
import jwt
from fastapi import FastAPI, HTTPException, Request, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/rehab_db")
PORT = int(os.getenv("PORT", "8000"))
PRODUCTION = os.getenv("NODE_ENV") == "production"

# Upload configuration
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads", "pdfs")
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Security: JWT Secret (use env var in production)
JWT_SECRET = os.getenv("JWT_SECRET", "rehab-secret-key-change-in-production!!")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 8

# Security: Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="精神康复中心管理系统 API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080"],
    allow_credentials=True, allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# ─── Auth Middleware ──────────────────────────────
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Public paths that don't need auth
    public_paths = ["/api/v1/login", "/api/v1/register", "/docs", "/openapi.json", "/assets", "/favicon"]
    path = request.url.path
    
    # Allow public paths and frontend static files
    is_public = any(path.startswith(p) for p in public_paths)
    is_api = path.startswith("/api/")
    
    if is_api and not is_public:
        try:
            user = await get_current_user(request)
            request.state.user = user
        except HTTPException:
            return JSONResponse(status_code=401, content={"detail": "请先登录"})
    
    response = await call_next(request)
    
    if request.method in ('POST', 'PUT', 'DELETE') and path.startswith('/api/v1/'):
        try:
            conn = get_db()
            user = getattr(request.state, 'user', {})
            am = {'POST': 'CREATE', 'PUT': 'UPDATE', 'DELETE': 'DELETE'}
            parts = path.split('/')
            et = parts[3] if len(parts) > 3 else 'unknown'
            write_audit_log(conn, user.get('id',''), user.get('username',''),
                          am.get(request.method, request.method),
                          et, None, {'path': path, 'status': response.status_code},
                          request.client.host if request.client else '')
            put_db(conn)
        except Exception:
            pass
    
    return response



# --- RLS Helper ------------------------------------
def apply_rls(request, table_alias=""):
    user = getattr(request.state, "user", None)
    if not user:
        return ("1=0", [])
    role = user.get("role", "")
    prefix = table_alias + "." if table_alias else ""
    if role == "admin":
        return ("1=1", [])
    site_id = user.get("site_id", "")
    return (prefix + "site_id = %s", [site_id])

# --- Audit Log Helper --------------------------------
def write_audit_log(conn, user_id, username, action, entity_type, entity_id=None, details=None, ip=""):
    import json
    try:
        j = json.dumps(details, ensure_ascii=False) if details else None
        c = conn.cursor()
        c.execute("INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details, ip_address) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            (user_id, username, action, entity_type, entity_id, j, ip))
        conn.commit()
        c.close()
    except Exception as e:
        print("Audit error:", str(e)[:80])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    tb = traceback.format_exc()
    print("SERVER ERROR:", str(exc))
    print(tb)
    PRODUCTION = os.getenv("NODE_ENV") == "production"
    if PRODUCTION:
        return JSONResponse(status_code=500, content={"detail": "服务器内部错误，请稍后重试"})
    return JSONResponse(status_code=500, content={"detail": str(exc)[:200]})

db_pool = None
def get_db(): return db_pool.getconn()
def put_db(conn): db_pool.putconn(conn)

@app.on_event("startup")
def startup():
    global db_pool
    db_pool = pg_pool.ThreadedConnectionPool(1, 20, DB_URL)
    conn = get_db(); cur = conn.cursor(cursor_factory=RealDictCursor); cur.execute("SELECT 1"); cur.close()
    put_db(conn); print("PostgreSQL 连接成功")

@app.on_event("shutdown")
def shutdown():
    if db_pool: db_pool.closeall()

# ─── Security Helpers ─────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_jwt(user_id: str, username: str, role: str, site_id: str = "") -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "site_id": site_id,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "未提供认证令牌")
    try:
        token = auth.split(" ")[1]
        return decode_jwt(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "令牌已过期，请重新登录")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "无效的认证令牌")

def sanitize_html(value: str) -> str:
    """Strip dangerous HTML/script tags from user input"""
    if not value or not isinstance(value, str):
        return value
    return re.sub(r'<[^>]*>', '', value).strip()

def sanitize_dict(data: dict, fields: list) -> dict:
    """Sanitize specified fields in a dict to prevent XSS"""
    result = dict(data)
    for field in fields:
        if field in result and isinstance(result[field], str):
            result[field] = sanitize_html(result[field])
    return result

# ─── Pydantic 模型 ─────────────────────────────────
class LoginReq(BaseModel):
    username: str; password: str

class SiteCreate(BaseModel):
    name: str; town: str; siteType: str = "乡镇站点"; isActive: bool = True

class UserCreate(BaseModel):
    username: str; realName: str; gender: str; role: str; siteId: str; phone: str; password: str = "128080"

class UserUpdate(BaseModel):
    username: Optional[str] = None; realName: Optional[str] = None
    gender: Optional[str] = None; role: Optional[str] = None
    siteId: Optional[str] = None; phone: Optional[str] = None
    password: Optional[str] = None; isActive: Optional[bool] = None
    wechatOpenid: Optional[str] = None

class StudentCreate(BaseModel):
    name: str; idCard: str; gender: str; ethnicity: str; birthDate: str; age: int
    phone: str; homePhone: str = ""; address: str; maritalStatus: str; livingSituation: str
    hasDisabilityCert: bool = False; disabilityType: Optional[str] = None; disabilityLevel: Optional[str] = None
    hasDibao: bool = False; contactPerson: str; contactPhone: str
    coResidents: list = []; coResidentRelation: str = "良好"
    livingEnvironment: str = "一般"; economicStatus: str = "一般"
    incomeSource: list = []; moneyManagement: str = ""; pastBehavior: list = []
    currentRisk: str = "无"; medicationCompliance: str = "规律"
    medicationMethod: Optional[str] = None; medicationDetail: Optional[str] = None
    town: str; village: str; siteId: str
    status: str = "active"; riskLevel: str = "low"; serviceType: str = "type80"

class StudentUpdate(BaseModel):
    name: Optional[str] = None; idCard: Optional[str] = None
    gender: Optional[str] = None; ethnicity: Optional[str] = None
    birthDate: Optional[str] = None; age: Optional[int] = None
    phone: Optional[str] = None; homePhone: Optional[str] = None
    address: Optional[str] = None; maritalStatus: Optional[str] = None
    livingSituation: Optional[str] = None; hasDisabilityCert: Optional[bool] = None
    disabilityType: Optional[str] = None; disabilityLevel: Optional[str] = None
    hasDibao: Optional[bool] = None; contactPerson: Optional[str] = None
    contactPhone: Optional[str] = None; coResidents: Optional[list] = None
    coResidentRelation: Optional[str] = None; livingEnvironment: Optional[str] = None
    economicStatus: Optional[str] = None; incomeSource: Optional[list] = None
    moneyManagement: Optional[str] = None; pastBehavior: Optional[list] = None
    currentRisk: Optional[str] = None; medicationCompliance: Optional[str] = None
    medicationMethod: Optional[str] = None; medicationDetail: Optional[str] = None
    town: Optional[str] = None; village: Optional[str] = None; siteId: Optional[str] = None
    status: Optional[str] = None; riskLevel: Optional[str] = None; serviceType: Optional[str] = None

class AssessmentCreate(BaseModel):
    studentId: str; studentName: str; siteId: str; assessmentType: str
    assessDate: str; assessor: str; roundNumber: Optional[int] = None
    overallImpression: str; scores: dict; pdfAttachment: Optional[dict] = None

class TrainingCreate(BaseModel):
    studentId: str; studentName: str; siteId: str; title: str; trainingType: str
    trainingMethod: str; trainingLevel: Optional[str] = None; location: str
    startTime: str; endTime: str; durationMinutes: int; content: str; summary: str
    recorderName: str; details: Optional[dict] = None

class VisitCreate(BaseModel):
    studentId: str; studentName: str; siteId: str; visitDate: str; visitMethod: str
    visitorName: str; reason: str; mentalStatus: str; medicationStatus: str
    socialFunction: str; riskLevel: str; familyCommunication: str
    emotionalState: str; medicationChecked: bool = False
    medicationNotes: str = ""; nextVisitDate: Optional[str] = None

class AnnouncementCreate(BaseModel):
    title: str; content: str; targetSiteIds: Optional[list] = None
    createdBy: str; startDate: Optional[str] = None; endDate: Optional[str] = None

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None; content: Optional[str] = None
    targetSiteIds: Optional[list] = None
# ─── SQL 列别名（snake_case -> camelCase）────────
S_COLS = '''id, name, id_card as "idCard", gender, ethnicity, birth_date as "birthDate", age,
    phone, home_phone as "homePhone", address, marital_status as "maritalStatus",
    living_situation as "livingSituation", has_disability_cert as "hasDisabilityCert",
    disability_type as "disabilityType", disability_level as "disabilityLevel",
    has_dibao as "hasDibao", contact_person as "contactPerson", contact_phone as "contactPhone",
    co_residents as "coResidents", co_resident_relation as "coResidentRelation",
    living_environment as "livingEnvironment", economic_status as "economicStatus",
    income_source as "incomeSource", money_management as "moneyManagement",
    past_behavior as "pastBehavior", current_risk as "currentRisk",
    medication_compliance as "medicationCompliance", medication_method as "medicationMethod",
    medication_detail as "medicationDetail", town, village, site_id as "siteId",
    status, risk_level as "riskLevel", service_type as "serviceType", created_at as "createdAt"'''

A_COLS = '''id, student_id as "studentId", student_name as "studentName", site_id as "siteId",
    assessment_type as "assessmentType", assess_date as "assessDate", assessor,
    round_number as "roundNumber", overall_impression as "overallImpression",
    scores, pdf_attachment as "pdfAttachment", created_at as "createdAt"'''

T_COLS = '''id, student_id as "studentId", student_name as "studentName", site_id as "siteId",
    title, training_type as "trainingType", training_method as "trainingMethod",
    training_level as "trainingLevel", location, start_time as "startTime",
    end_time as "endTime", duration_minutes as "durationMinutes", content, summary,
    recorder_name as "recorderName", details, created_at as "createdAt"'''

V_COLS = '''id, student_id as "studentId", student_name as "studentName", site_id as "siteId",
    visit_date as "visitDate", visit_method as "visitMethod", visitor_name as "visitorName",
    reason, mental_status as "mentalStatus", medication_status as "medicationStatus",
    social_function as "socialFunction", risk_level as "riskLevel",
    family_communication as "familyCommunication", emotional_state as "emotionalState",
    medication_checked as "medicationChecked", medication_notes as "medicationNotes",
    next_visit_date as "nextVisitDate", created_at as "createdAt"'''

ANN_COLS = '''id, title, content, target_site_ids as "targetSiteIds",
    created_by as "createdBy", start_date as "startDate", end_date as "endDate",
    created_at as "createdAt"'''
# ─── SITES ─────────────────────────────────────────
@app.get("/api/v1/sites")
def list_sites(request: Request):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT id, name, town, site_type AS "siteType", is_active AS "isActive" FROM sites WHERE deleted_at IS NULL ORDER BY town')
        rows = [dict(r) for r in cur.fetchall()]; cur.close(); return rows
    finally: put_db(conn)

@app.post("/api/v1/sites", status_code=201)
def create_site(body: SiteCreate):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('INSERT INTO sites (id, name, town, site_type, is_active) VALUES (gen_random_uuid()::text, %s, %s, %s, %s) RETURNING *',
            (body.name, body.town, body.siteType, body.isActive))
        row = dict(cur.fetchone()); conn.commit(); cur.close(); return row
    finally: put_db(conn)

# ─── USERS ─────────────────────────────────────────
@app.get("/api/v1/users")
def list_users(request: Request):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT id, username, real_name AS "realName", gender, role, site_id AS "siteId", phone, is_active AS "isActive", wechat_openid AS "wechatOpenid" FROM users WHERE deleted_at IS NULL')
        rows = [dict(r) for r in cur.fetchall()]; cur.close(); return rows
    finally: put_db(conn)

@app.post("/api/v1/users", status_code=201)
def create_user(body: UserCreate):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('INSERT INTO users (id, username, real_name, gender, role, site_id, phone, password, is_active) VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, %s, true) RETURNING *',
            (body.username, body.realName, body.gender, body.role, body.siteId, body.phone, body.password))
        row = dict(cur.fetchone()); conn.commit(); cur.close(); return row
    finally: put_db(conn)

@app.put("/api/v1/users/{uid}")
def update_user(uid: str, body: UserUpdate):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        m = {"realName": "real_name", "siteId": "site_id", "isActive": "is_active", "wechatOpenid": "wechat_openid"}
        sets, vals = [], []
        for k, v in body.model_dump(exclude_none=True).items():
            sets.append(f"{m.get(k, k)} = %s"); vals.append(v)
        if not sets: raise HTTPException(400, "No fields to update")
        vals.append(uid)
        cur.execute(f"UPDATE users SET {', '.join(sets)} WHERE id = %s RETURNING id", vals)
        if not cur.fetchone(): raise HTTPException(404, "User not found")
        conn.commit(); cur.close(); return {"success": True}
    finally: put_db(conn)

@app.delete("/api/v1/users/{uid}")
def delete_user(uid: str):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('UPDATE users SET deleted_at = NOW() WHERE id = %s', (uid,))
        conn.commit(); cur.close(); return {"success": True}
    finally: put_db(conn)

# ─── STUDENTS ──────────────────────────────────────
@app.get("/api/v1/students")
def list_students(request: Request):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        where, params = apply_rls(request, 'students')
        cur.execute('SELECT ' + S_COLS + ' FROM students WHERE deleted_at IS NULL AND ' + where + ' ORDER BY created_at DESC', params)
        rows = [dict(r) for r in cur.fetchall()]; cur.close(); return rows
    finally: put_db(conn)

@app.post("/api/v1/students", status_code=201)
def create_student(body: StudentCreate):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'INSERT INTO students (id, name, id_card, gender, ethnicity, birth_date, age, phone, home_phone, address, marital_status, living_situation, has_disability_cert, disability_type, disability_level, has_dibao, contact_person, contact_phone, co_residents, co_resident_relation, living_environment, economic_status, income_source, money_management, past_behavior, current_risk, medication_compliance, medication_method, medication_detail, town, village, site_id, status, risk_level, service_type) VALUES (gen_random_uuid()::text, %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id',
            (body.name, body.idCard, body.gender, body.ethnicity, body.birthDate, body.age,
             body.phone, body.homePhone, body.address, body.maritalStatus, body.livingSituation,
             body.hasDisabilityCert, body.disabilityType, body.disabilityLevel, body.hasDibao,
             body.contactPerson, body.contactPhone,
             json.dumps(body.coResidents, ensure_ascii=False) if body.coResidents else None,
             body.coResidentRelation, body.livingEnvironment, body.economicStatus,
             json.dumps(body.incomeSource, ensure_ascii=False) if body.incomeSource else None,
             body.moneyManagement,
             json.dumps(body.pastBehavior, ensure_ascii=False) if body.pastBehavior else None,
             body.currentRisk, body.medicationCompliance, body.medicationMethod,
             body.medicationDetail, body.town, body.village, body.siteId,
             body.status, body.riskLevel, body.serviceType))
        sid = cur.fetchone()['id']; conn.commit()
        cur.execute('SELECT ' + S_COLS + ' FROM students WHERE id = %s', (sid,))
        row = dict(cur.fetchone()); cur.close(); return row
    finally: put_db(conn)

STU_MAP = {"name":"name","idCard":"id_card","gender":"gender","ethnicity":"ethnicity",
    "birthDate":"birth_date","age":"age","phone":"phone","homePhone":"home_phone",
    "address":"address","maritalStatus":"marital_status","livingSituation":"living_situation",
    "hasDisabilityCert":"has_disability_cert","disabilityType":"disability_type",
    "disabilityLevel":"disability_level","hasDibao":"has_dibao",
    "contactPerson":"contact_person","contactPhone":"contact_phone",
    "coResidents":"co_residents","coResidentRelation":"co_resident_relation",
    "livingEnvironment":"living_environment","economicStatus":"economic_status",
    "incomeSource":"income_source","moneyManagement":"money_management",
    "pastBehavior":"past_behavior","currentRisk":"current_risk",
    "medicationCompliance":"medication_compliance","medicationMethod":"medication_method",
    "medicationDetail":"medication_detail","town":"town","village":"village",
    "siteId":"site_id","status":"status","riskLevel":"risk_level","serviceType":"service_type"}

@app.put("/api/v1/students/{sid}")
def update_student(sid: str, body: StudentUpdate):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        data = body.model_dump(exclude_none=True)
        sets, vals = [], []
        for k, v in data.items():
            if k in STU_MAP:
                if k in ("coResidents","incomeSource","pastBehavior") and isinstance(v, list):
                    v = json.dumps(v, ensure_ascii=False) if v else None
                sets.append(f"{STU_MAP[k]} = %s"); vals.append(v)
        if not sets: raise HTTPException(400, "No fields to update")
        vals.append(sid)
        cur.execute(f"UPDATE students SET {', '.join(sets)} WHERE id = %s AND deleted_at IS NULL RETURNING id", vals)
        if not cur.fetchone(): raise HTTPException(404, "Student not found")
        conn.commit()
        cur.execute('SELECT ' + S_COLS + ' FROM students WHERE id = %s', (sid,))
        row = dict(cur.fetchone()); cur.close(); return row
    finally: put_db(conn)

@app.delete("/api/v1/students/{sid}")
def delete_student(sid: str):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Check for related records (cascade protection)
        for table, label in [("assessments", "评估记录"), ("trainings", "康复训练"), ("visits", "入户探访")]:
            cur.execute(f'SELECT COUNT(*) AS cnt FROM {table} WHERE student_id = %s AND deleted_at IS NULL', (sid,))
            row = cur.fetchone()
            count = row["cnt"] if row else 0
            if count > 0:
                raise HTTPException(400, f"该学员存在 {count} 条{label}，请先删除后再操作")
        cur.execute('UPDATE students SET deleted_at = NOW() WHERE id = %s', (sid,))
        conn.commit(); cur.close(); return {"success": True}
    finally: put_db(conn)

# ─── ASSESSMENTS ───────────────────────────────────
@app.get("/api/v1/assessments")
def list_assessments(request: Request):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        where, params = apply_rls(request, 'assessments')
        cur.execute('SELECT ' + A_COLS + ' FROM assessments WHERE deleted_at IS NULL AND ' + where + ' ORDER BY created_at DESC', params)
        rows = [dict(r) for r in cur.fetchall()]; cur.close(); return rows
    finally: put_db(conn)

@app.post("/api/v1/assessments", status_code=201)
def create_assessment(body: AssessmentCreate):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'INSERT INTO assessments (id, student_id, student_name, site_id, assessment_type, assess_date, assessor, round_number, overall_impression, scores, pdf_attachment) VALUES (gen_random_uuid()::text, %s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id',
            (body.studentId, body.studentName, body.siteId, body.assessmentType,
             body.assessDate, body.assessor, body.roundNumber, body.overallImpression,
             json.dumps(body.scores, ensure_ascii=False),
             json.dumps(body.pdfAttachment, ensure_ascii=False) if body.pdfAttachment else None))
        aid = cur.fetchone()['id']; conn.commit()
        cur.execute('SELECT ' + A_COLS + ' FROM assessments WHERE id = %s', (aid,))
        row = dict(cur.fetchone()); cur.close(); return row
    finally: put_db(conn)

@app.delete("/api/v1/assessments/{aid}")
def delete_assessment(aid: str):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('UPDATE assessments SET deleted_at = NOW() WHERE id = %s', (aid,))
        conn.commit(); cur.close(); return {"success": True}
    finally: put_db(conn)

# ─── TRAININGS ─────────────────────────────────────
@app.get("/api/v1/trainings")
def list_trainings(request: Request):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        where, params = apply_rls(request, 'trainings')
        cur.execute('SELECT ' + T_COLS + ' FROM trainings WHERE deleted_at IS NULL AND ' + where + ' ORDER BY created_at DESC', params)
        rows = [dict(r) for r in cur.fetchall()]; cur.close(); return rows
    finally: put_db(conn)

@app.post("/api/v1/trainings", status_code=201)
def create_training(body: TrainingCreate):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'INSERT INTO trainings (id, student_id, student_name, site_id, title, training_type, training_method, training_level, location, start_time, end_time, duration_minutes, content, summary, recorder_name, details) VALUES (gen_random_uuid()::text, %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id',
            (body.studentId, body.studentName, body.siteId, body.title, body.trainingType,
             body.trainingMethod, body.trainingLevel, body.location, body.startTime,
             body.endTime, body.durationMinutes, body.content, body.summary, body.recorderName,
             json.dumps(body.details, ensure_ascii=False) if body.details else None))
        tid = cur.fetchone()['id']; conn.commit()
        cur.execute('SELECT ' + T_COLS + ' FROM trainings WHERE id = %s', (tid,))
        row = dict(cur.fetchone()); cur.close(); return row
    finally: put_db(conn)

@app.delete("/api/v1/trainings/{tid}")
def delete_training(tid: str):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('UPDATE trainings SET deleted_at = NOW() WHERE id = %s', (tid,))
        conn.commit(); cur.close(); return {"success": True}
    finally: put_db(conn)

# ─── VISITS ────────────────────────────────────────
@app.get("/api/v1/visits")
def list_visits(request: Request):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        where, params = apply_rls(request, 'visits')
        cur.execute('SELECT ' + V_COLS + ' FROM visits WHERE deleted_at IS NULL AND ' + where + ' ORDER BY created_at DESC', params)
        rows = [dict(r) for r in cur.fetchall()]; cur.close(); return rows
    finally: put_db(conn)

@app.post("/api/v1/visits", status_code=201)
def create_visit(body: VisitCreate):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            'INSERT INTO visits (id, student_id, student_name, site_id, visit_date, visit_method, visitor_name, reason, mental_status, medication_status, social_function, risk_level, family_communication, emotional_state, medication_checked, medication_notes, next_visit_date) VALUES (gen_random_uuid()::text, %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id',
            (body.studentId, body.studentName, body.siteId, body.visitDate, body.visitMethod,
             body.visitorName, body.reason, body.mentalStatus, body.medicationStatus,
             body.socialFunction, body.riskLevel, body.familyCommunication, body.emotionalState,
             body.medicationChecked, body.medicationNotes, body.nextVisitDate))
        vid = cur.fetchone()['id']; conn.commit()
        cur.execute('SELECT ' + V_COLS + ' FROM visits WHERE id = %s', (vid,))
        row = dict(cur.fetchone()); cur.close(); return row
    finally: put_db(conn)

@app.delete("/api/v1/visits/{vid}")
def delete_visit(vid: str):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('UPDATE visits SET deleted_at = NOW() WHERE id = %s', (vid,))
        conn.commit(); cur.close(); return {"success": True}
    finally: put_db(conn)

# ─── ANNOUNCEMENTS ─────────────────────────────────
@app.get("/api/v1/announcements")
def list_announcements(request: Request):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT ' + ANN_COLS + ' FROM announcements WHERE deleted_at IS NULL ORDER BY created_at DESC')
        rows = [dict(r) for r in cur.fetchall()]; cur.close(); return rows
    finally: put_db(conn)

@app.post("/api/v1/announcements", status_code=201)
def create_announcement(body: AnnouncementCreate):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        target = json.dumps(body.targetSiteIds, ensure_ascii=False) if body.targetSiteIds else None
        cur.execute(
            'INSERT INTO announcements (id, title, content, target_site_ids, created_by, start_date, end_date) VALUES (gen_random_uuid()::text, %s,%s,%s,%s,%s,%s) RETURNING id',
            (body.title, body.content, target, body.createdBy, body.startDate, body.endDate))
        aid = cur.fetchone()['id']; conn.commit()
        cur.execute('SELECT ' + ANN_COLS + ' FROM announcements WHERE id = %s', (aid,))
        row = dict(cur.fetchone()); cur.close(); return row
    finally: put_db(conn)

@app.put("/api/v1/announcements/{aid}")
def update_announcement(aid: str, body: AnnouncementUpdate):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        data = body.model_dump(exclude_none=True)
        if not data: raise HTTPException(400, "No fields to update")
        sets, vals = [], []
        if "title" in data: sets.append("title = %s"); vals.append(data["title"])
        if "content" in data: sets.append("content = %s"); vals.append(data["content"])
        if "targetSiteIds" in data: sets.append("target_site_ids = %s"); vals.append(json.dumps(data["targetSiteIds"], ensure_ascii=False) if data["targetSiteIds"] else None)
        vals.append(aid)
        cur.execute(f"UPDATE announcements SET {', '.join(sets)} WHERE id = %s AND deleted_at IS NULL RETURNING id", vals)
        if not cur.fetchone(): raise HTTPException(404, "Announcement not found")
        conn.commit()
        cur.execute('SELECT ' + ANN_COLS + ' FROM announcements WHERE id = %s', (aid,))
        row = dict(cur.fetchone()); cur.close(); return row
    finally: put_db(conn)

@app.delete("/api/v1/announcements/{aid}")
def delete_announcement(aid: str):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('UPDATE announcements SET deleted_at = NOW() WHERE id = %s', (aid,))
        conn.commit(); cur.close(); return {"success": True}
    finally: put_db(conn)

# ─── LOGIN ─────────────────────────────────────────

# File Upload / Download
@app.post("/api/v1/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "仅支持 PDF 格式文件")
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_SIZE:
        raise HTTPException(413, f"文件大小超过限制 (最大 {MAX_UPLOAD_SIZE//1024//1024}MB)")
    stem = uuid.uuid4().hex[:12]
    safe_name = f"{stem}_{file.filename.replace(' ', '_')}"
    filepath = os.path.join(UPLOAD_DIR, safe_name)
    with open(filepath, "wb") as f:
        f.write(raw)
    return {"success": True, "filepath": filepath, "filename": file.filename, "size": f"{len(raw) / 1024:.1f} KB"}

@app.get("/api/v1/files/{filepath:path}")
def serve_file(filepath: str):
    full_path = os.path.join(os.path.dirname(__file__), filepath)
    abs_req = os.path.abspath(full_path)
    if not abs_req.startswith(os.path.abspath(os.path.dirname(__file__))):
        raise HTTPException(403, "Access denied")
    if not os.path.isfile(abs_req):
        raise HTTPException(404, "File not found")
    return FileResponse(abs_req, media_type="application/pdf")

@app.post("/api/v1/login")
@limiter.limit("5/minute")  # Rate limit: 5 attempts per minute
def login(request: Request, body: LoginReq):
    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Support both bcrypt hashed and legacy plaintext passwords
        cur.execute(
            'SELECT id, username, real_name AS "realName", gender, role, site_id AS "siteId", phone, is_active AS "isActive", wechat_openid AS "wechatOpenid", password FROM users WHERE username = %s AND deleted_at IS NULL',
            (body.username,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(401, "用户名或密码错误")
        
        user = dict(row)
        stored_pw = user.pop("password", "")
        
        # Verify password (supports both bcrypt and legacy plaintext)
        is_valid = False
        if stored_pw.startswith("$2b$") or stored_pw.startswith("$2a$"):
            is_valid = verify_password(body.password, stored_pw)
        else:
            is_valid = (body.password == stored_pw)
            # Upgrade to bcrypt on successful login
            if is_valid:
                hashed = hash_password(body.password)
                cur.execute("UPDATE users SET password = %s WHERE id = %s", (hashed, user["id"]))
                conn.commit()
        
        if not is_valid:
            raise HTTPException(401, "用户名或密码错误")
        
        if not user.get("isActive"):
            raise HTTPException(403, "该账号已被停用")
        
        # Generate JWT token
        token = create_jwt(user["id"], user["username"], user["role"], user.get("siteId", ""))
        cur.close()
        return {"success": True, "token": token, "user": user}
    finally: put_db(conn)

# ─── 生产模式：静态文件 ────────────────────────────
if PRODUCTION:
    dist = os.path.join(os.path.dirname(__file__), "dist")
    if os.path.isdir(dist):
        app.mount("/assets", StaticFiles(directory=os.path.join(dist, "assets")), name="assets")
        @app.get("/{path:path}")
        def serve_static(path: str):
            fp = os.path.join(dist, path)
            if os.path.isfile(fp): return FileResponse(fp)
            return FileResponse(os.path.join(dist, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=PORT, reload=not PRODUCTION)


