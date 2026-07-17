import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Import initial data for seeding
import { 
  INITIAL_SITES, 
  INITIAL_USERS, 
  INITIAL_STUDENTS, 
  INITIAL_ASSESSMENTS, 
  INITIAL_TRAININGS, 
  INITIAL_VISITS, 
  INITIAL_ANNOUNCEMENTS 
} from './src/data';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(express.json());

// Simple UUID generator (UUIDv4 style)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Database initial state & helper operations
interface DBState {
  sites: any[];
  users: any[];
  students: any[];
  assessments: any[];
  trainings: any[];
  visits: any[];
  announcements: any[];
}

function loadDB(): DBState {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading DB_FILE, seeding fresh data:', e);
    }
  }

  // Seed initial data
  const state: DBState = {
    sites: INITIAL_SITES,
    users: INITIAL_USERS,
    students: INITIAL_STUDENTS,
    assessments: INITIAL_ASSESSMENTS,
    trainings: INITIAL_TRAININGS,
    visits: INITIAL_VISITS,
    announcements: INITIAL_ANNOUNCEMENTS,
  };
  saveDB(state);
  return state;
}

function saveDB(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving to DB_FILE:', e);
  }
}

// Initialize database
let db = loadDB();

// ---------------- API ENDPOINTS (v1) ----------------

// 1. SITES API
app.get('/api/v1/sites', (req, res) => {
  res.json(db.sites);
});

app.post('/api/v1/sites', (req, res) => {
  const newSite = {
    id: 'site-' + generateUUID().substring(0, 8),
    created_at: new Date().toISOString(),
    ...req.body
  };
  db.sites.push(newSite);
  saveDB(db);
  res.status(201).json(newSite);
});

// 2. USERS API
app.get('/api/v1/users', (req, res) => {
  res.json(db.users);
});

app.post('/api/v1/users', (req, res) => {
  const newUser = {
    id: 'user-' + generateUUID().substring(0, 8),
    created_at: new Date().toISOString(),
    isActive: true,
    ...req.body
  };
  db.users.push(newUser);
  saveDB(db);
  res.status(201).json(newUser);
});

app.put('/api/v1/users/:id', (req, res) => {
  const { id } = req.params;
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  db.users[index] = { ...db.users[index], ...req.body };
  saveDB(db);
  res.json(db.users[index]);
});

app.delete('/api/v1/users/:id', (req, res) => {
  const { id } = req.params;
  db.users = db.users.filter(u => u.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// 3. STUDENTS API
app.get('/api/v1/students', (req, res) => {
  res.json(db.students);
});

app.post('/api/v1/students', (req, res) => {
  const newStudent = {
    id: 'stu-' + generateUUID().substring(0, 8),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  db.students.unshift(newStudent);
  saveDB(db);
  res.status(201).json(newStudent);
});

app.put('/api/v1/students/:id', (req, res) => {
  const { id } = req.params;
  const index = db.students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }
  db.students[index] = { ...db.students[index], ...req.body };
  saveDB(db);
  res.json(db.students[index]);
});

app.delete('/api/v1/students/:id', (req, res) => {
  const { id } = req.params;
  db.students = db.students.filter(s => s.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// 4. ASSESSMENTS API
app.get('/api/v1/assessments', (req, res) => {
  res.json(db.assessments);
});

app.post('/api/v1/assessments', (req, res) => {
  const newAssessment = {
    id: 'assess-' + generateUUID().substring(0, 8),
    created_at: new Date().toISOString(),
    ...req.body
  };
  db.assessments.unshift(newAssessment);
  saveDB(db);
  res.status(201).json(newAssessment);
});

app.delete('/api/v1/assessments/:id', (req, res) => {
  const { id } = req.params;
  db.assessments = db.assessments.filter(a => a.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// 5. TRAININGS API
app.get('/api/v1/trainings', (req, res) => {
  res.json(db.trainings);
});

app.post('/api/v1/trainings', (req, res) => {
  const newTraining = {
    id: 'train-' + generateUUID().substring(0, 8),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  db.trainings.unshift(newTraining);
  saveDB(db);
  res.status(201).json(newTraining);
});

app.delete('/api/v1/trainings/:id', (req, res) => {
  const { id } = req.params;
  db.trainings = db.trainings.filter(t => t.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// 6. VISITS API
app.get('/api/v1/visits', (req, res) => {
  res.json(db.visits);
});

app.post('/api/v1/visits', (req, res) => {
  const newVisit = {
    id: 'visit-' + generateUUID().substring(0, 8),
    created_at: new Date().toISOString(),
    ...req.body
  };
  db.visits.unshift(newVisit);
  saveDB(db);
  res.status(201).json(newVisit);
});

app.delete('/api/v1/visits/:id', (req, res) => {
  const { id } = req.params;
  db.visits = db.visits.filter(v => v.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// 7. ANNOUNCEMENTS API
app.get('/api/v1/announcements', (req, res) => {
  res.json(db.announcements);
});

app.post('/api/v1/announcements', (req, res) => {
  const newAnnouncement = {
    id: 'ann-' + generateUUID().substring(0, 8),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  db.announcements.unshift(newAnnouncement);
  saveDB(db);
  res.status(201).json(newAnnouncement);
});

app.put('/api/v1/announcements/:id', (req, res) => {
  const { id } = req.params;
  const index = db.announcements.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Announcement not found' });
  }
  db.announcements[index] = { ...db.announcements[index], ...req.body };
  saveDB(db);
  res.json(db.announcements[index]);
});

app.delete('/api/v1/announcements/:id', (req, res) => {
  const { id } = req.params;
  db.announcements = db.announcements.filter(a => a.id !== id);
  saveDB(db);
  res.json({ success: true });
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
