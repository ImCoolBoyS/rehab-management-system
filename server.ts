/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * 精神康复中心管理系统 - 后端服务器
 * 数据库: PostgreSQL 16 (替代原 JSON 文件存储)
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import pg from 'pg';

const app = express();
const PORT = 8080;

app.use(express.json());

// PostgreSQL 连接池
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/rehab_db',
});

// 测试数据库连接
pool.query('SELECT 1').then(() => {
  console.log('PostgreSQL 连接成功');
}).catch(err => {
  console.error('PostgreSQL 连接失败:', err.message);
});

// 工具: 处理软删除查询条件
function notDeleted() {
  return 'deleted_at IS NULL';
}

// ---------------- API ENDPOINTS (v1) ----------------

// 1. SITES API
app.get('/api/v1/sites', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sites WHERE deleted_at IS NULL ORDER BY town');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/sites', async (req, res) => {
  try {
    const { name, town, siteType, isActive } = req.body;
    const result = await pool.query(
      'INSERT INTO sites (name, town, site_type, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, town, siteType || '乡镇站点', isActive !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. USERS API
app.get('/api/v1/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, real_name as "realName", gender, role, site_id as "siteId", phone, is_active as "isActive", wechat_openid as "wechatOpenid", created_at FROM users WHERE deleted_at IS NULL');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/users', async (req, res) => {
  try {
    const { username, realName, gender, role, siteId, phone, password } = req.body;
    const result = await pool.query(
      `INSERT INTO users (username, real_name, gender, role, site_id, phone, password, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
      [username, realName, gender, role, siteId, phone, password || '128080']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = Object.keys(req.body).map((k, i) => {
      const col = k.replace(/([A-Z])/g, '_$1').toLowerCase();
      return `${col} = $${i + 2}`;
    }).join(', ');
    const values = [id, ...Object.values(req.body)];
    const result = await pool.query(
      `UPDATE users SET ${fields} WHERE id = $1 RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/users/:id', async (req, res) => {
  try {
    await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. STUDENTS API
app.get('/api/v1/students', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, id_card as "idCard", gender, ethnicity, birth_date as "birthDate", age,
             phone, home_phone as "homePhone", address, marital_status as "maritalStatus",
             living_situation as "livingSituation", has_disability_cert as "hasDisabilityCert",
             disability_type as "disabilityType", disability_level as "disabilityLevel",
             has_dibao as "hasDibao", contact_person as "contactPerson", contact_phone as "contactPhone",
             co_residents as "coResidents", co_resident_relation as "coResidentRelation",
             living_environment as "livingEnvironment", economic_status as "economicStatus",
             income_source as "incomeSource", money_management as "moneyManagement", past_behavior as "pastBehavior",
             current_risk as "currentRisk", medication_compliance as "medicationCompliance",
             medication_method as "medicationMethod", medication_detail as "medicationDetail",
             town, village, site_id as "siteId", status, risk_level as "riskLevel",
             service_type as "serviceType", created_at as "createdAt"
      FROM students WHERE deleted_at IS NULL ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/students', async (req, res) => {
  try {
    const s = req.body;
    const result = await pool.query(`
      INSERT INTO students (name, id_card, gender, ethnicity, birth_date, age, phone, home_phone, address,
        marital_status, living_situation, has_disability_cert, disability_type, disability_level, has_dibao,
        contact_person, contact_phone, co_residents as "coResidents", co_resident_relation, living_environment, economic_status,
        income_source as "incomeSource", money_management, past_behavior, current_risk, medication_compliance, medication_method,
        medication_detail, town, village, site_id, status, risk_level, service_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34)
      RETURNING *`,
      [s.name, s.idCard, s.gender, s.ethnicity, s.birthDate, s.age, s.phone, s.homePhone, s.address,
       s.maritalStatus, s.livingSituation, s.hasDisabilityCert, s.disabilityType, s.disabilityLevel, s.hasDibao,
       s.contactPerson, s.contactPhone, JSON.stringify(s.coResidents), s.coResidentRelation, s.livingEnvironment,
       s.economicStatus, JSON.stringify(s.incomeSource), s.moneyManagement, JSON.stringify(s.pastBehavior),
       s.currentRisk, s.medicationCompliance, s.medicationMethod, s.medicationDetail,
       s.town, s.village, s.siteId, s.status || 'active', s.riskLevel || 'low', s.serviceType || 'type80']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const s = req.body;
    const result = await pool.query(`
      UPDATE students SET name=$1, id_card=$2, gender=$3, phone=$4, address=$5,
        marital_status=$6, living_situation=$7, has_disability_cert=$8,
        disability_type=$9, disability_level=$10, has_dibao=$11,
        contact_person=$12, contact_phone=$13, co_residents as "coResidents"=$14,
        co_resident_relation=$15, living_environment=$16, economic_status=$17,
        income_source as "incomeSource"=$18, money_management=$19, past_behavior=$20,
        current_risk=$21, medication_compliance=$22, medication_method=$23,
        medication_detail=$24, town=$25, village=$26, status=$27, risk_level=$28
      WHERE id=$29 AND deleted_at IS NULL RETURNING *`,
      [s.name, s.idCard, s.gender, s.phone, s.address, s.maritalStatus, s.livingSituation,
       s.hasDisabilityCert, s.disabilityType, s.disabilityLevel, s.hasDibao,
       s.contactPerson, s.contactPhone, JSON.stringify(s.coResidents),
       s.coResidentRelation, s.livingEnvironment, s.economicStatus,
       JSON.stringify(s.incomeSource), s.moneyManagement, JSON.stringify(s.pastBehavior),
       s.currentRisk, s.medicationCompliance, s.medicationMethod, s.medicationDetail,
       s.town, s.village, s.status, s.riskLevel, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/students/:id', async (req, res) => {
  try {
    await pool.query('UPDATE students SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. ASSESSMENTS API
app.get('/api/v1/assessments', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, student_id as "studentId", student_name as "studentName", site_id as "siteId",
             assessment_type as "assessmentType", assess_date as "assessDate", assessor,
             round_number as "roundNumber", overall_impression as "overallImpression",
             scores, pdf_attachment as "pdfAttachment", created_at
      FROM assessments WHERE deleted_at IS NULL ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/assessments', async (req, res) => {
  try {
    const a = req.body;
    const result = await pool.query(
      `INSERT INTO assessments (student_id, student_name, site_id, assessment_type, assess_date, assessor, round_number, overall_impression, scores)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [a.studentId, a.studentName, a.siteId, a.assessmentType, a.assessDate, a.assessor,
       a.roundNumber, a.overallImpression, JSON.stringify(a.scores)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/assessments/:id', async (req, res) => {
  try {
    await pool.query('UPDATE assessments SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. TRAININGS API
app.get('/api/v1/trainings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, student_id as "studentId", student_name as "studentName", site_id as "siteId",
             title, training_type as "trainingType", training_method as "trainingMethod",
             training_level as "trainingLevel", location, start_time as "startTime",
             end_time as "endTime", duration_minutes as "durationMinutes",
             content, summary, recorder_name as "recorderName", details, created_at as "createdAt"
      FROM trainings WHERE deleted_at IS NULL ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/trainings', async (req, res) => {
  try {
    const t = req.body;
    const result = await pool.query(
      `INSERT INTO trainings (student_id, student_name, site_id, title, training_type, training_method, training_level, location, start_time, end_time, duration_minutes, content, summary, recorder_name, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [t.studentId, t.studentName, t.siteId, t.title, t.trainingType, t.trainingMethod,
       t.trainingLevel, t.location, t.startTime, t.endTime, t.durationMinutes,
       t.content, t.summary, t.recorderName, JSON.stringify(t.details || {})]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/trainings/:id', async (req, res) => {
  try {
    await pool.query('UPDATE trainings SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. VISITS API
app.get('/api/v1/visits', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, student_id as "studentId", student_name as "studentName", site_id as "siteId",
             visit_date as "visitDate", visit_method as "visitMethod", visitor_name as "visitorName",
             reason, mental_status as "mentalStatus", medication_status as "medicationStatus",
             social_function as "socialFunction", risk_level as "riskLevel",
             family_communication as "familyCommunication", emotional_state as "emotionalState",
             medication_checked as "medicationChecked", medication_notes as "medicationNotes",
             next_visit_date as "nextVisitDate", created_at
      FROM visits WHERE deleted_at IS NULL ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/visits', async (req, res) => {
  try {
    const v = req.body;
    const result = await pool.query(
      `INSERT INTO visits (student_id, student_name, site_id, visit_date, visit_method, visitor_name, reason,
        mental_status, medication_status, social_function, risk_level, family_communication,
        emotional_state, medication_checked, medication_notes, next_visit_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [v.studentId, v.studentName, v.siteId, v.visitDate, v.visitMethod, v.visitorName, v.reason,
       v.mentalStatus, v.medicationStatus, v.socialFunction, v.riskLevel, v.familyCommunication,
       v.emotionalState, v.medicationChecked, v.medicationNotes, v.nextVisitDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/visits/:id', async (req, res) => {
  try {
    await pool.query('UPDATE visits SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. ANNOUNCEMENTS API
app.get('/api/v1/announcements', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, content, target_site_ids as "targetSiteIds",
             created_by as "createdBy", start_date as "startDate", end_date as "endDate", created_at
      FROM announcements WHERE deleted_at IS NULL ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/announcements', async (req, res) => {
  try {
    const a = req.body;
    const result = await pool.query(
      `INSERT INTO announcements (title, content, target_site_ids, created_by, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [a.title, a.content, JSON.stringify(a.targetSiteIds || null), a.createdBy, a.startDate, a.endDate]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/v1/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const a = req.body;
    const result = await pool.query(
      `UPDATE announcements SET title=$1, content=$2, target_site_ids=$3 WHERE id=$4 AND deleted_at IS NULL RETURNING *`,
      [a.title, a.content, JSON.stringify(a.targetSiteIds || null), id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Announcement not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/v1/announcements/:id', async (req, res) => {
  try {
    await pool.query('UPDATE announcements SET deleted_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 历史遗留: 清理临时文件
const TMP_FILES = ['seed_data.json', 'tmp_exporter.js', 'db.json'];
TMP_FILES.forEach(f => {
  if (fs.existsSync(f)) fs.unlinkSync(f);
});

// ---------------- VITE MIDDLEWARE & FRONTEND ROUTING ----------------

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();


