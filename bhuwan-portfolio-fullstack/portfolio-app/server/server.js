require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme123';
const DB_PATH = path.join(__dirname, 'data', 'db.json');

let mailer = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  console.log(`Email notifications enabled — will send to ${process.env.EMAIL_TO || process.env.EMAIL_USER}`);
} else {
  console.log('Email notifications disabled — set EMAIL_USER and EMAIL_PASS in .env to enable (see README).');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- helpers ----------
function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ---------- auth ----------
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_TOKEN) {
    return res.json({ token: ADMIN_TOKEN });
  }
  res.status(401).json({ error: 'Incorrect password' });
});

// ---------- profile ----------
app.get('/api/profile', (req, res) => {
  res.json(readDB().profile);
});
app.put('/api/profile', requireAdmin, (req, res) => {
  const db = readDB();
  db.profile = { ...db.profile, ...req.body };
  writeDB(db);
  res.json(db.profile);
});

// ---------- experience ----------
app.get('/api/experience', (req, res) => {
  res.json(readDB().experience);
});
app.post('/api/experience', requireAdmin, (req, res) => {
  const db = readDB();
  const item = { id: 'exp' + Date.now(), tags: [], ...req.body };
  db.experience.unshift(item);
  writeDB(db);
  res.status(201).json(item);
});
app.put('/api/experience/:id', requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.experience.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.experience[idx] = { ...db.experience[idx], ...req.body };
  writeDB(db);
  res.json(db.experience[idx]);
});
app.delete('/api/experience/:id', requireAdmin, (req, res) => {
  const db = readDB();
  db.experience = db.experience.filter((e) => e.id !== req.params.id);
  writeDB(db);
  res.status(204).end();
});

// ---------- projects ----------
app.get('/api/projects', (req, res) => {
  res.json(readDB().projects);
});
app.post('/api/projects', requireAdmin, (req, res) => {
  const db = readDB();
  const item = { id: 'proj' + Date.now(), tags: [], url: '#', ...req.body };
  db.projects.unshift(item);
  writeDB(db);
  res.status(201).json(item);
});
app.put('/api/projects/:id', requireAdmin, (req, res) => {
  const db = readDB();
  const idx = db.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.projects[idx] = { ...db.projects[idx], ...req.body };
  writeDB(db);
  res.json(db.projects[idx]);
});
app.delete('/api/projects/:id', requireAdmin, (req, res) => {
  const db = readDB();
  db.projects = db.projects.filter((p) => p.id !== req.params.id);
  writeDB(db);
  res.status(204).end();
});

// ---------- contact ----------
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are all required.' });
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  const db = readDB();
  const entry = {
    id: 'msg' + Date.now(),
    name: String(name).slice(0, 200),
    email: String(email).slice(0, 200),
    message: String(message).slice(0, 4000),
    receivedAt: new Date().toISOString(),
  };
  db.messages.unshift(entry);
  writeDB(db);

  if (mailer) {
    mailer
      .sendMail({
        from: `"Portfolio Contact Form" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER,
        replyTo: entry.email,
        subject: `New portfolio message from ${entry.name}`,
        text: `From: ${entry.name} <${entry.email}>\n\n${entry.message}`,
      })
      .catch((err) => console.error('Email send failed:', err.message));
  }

  res.status(201).json({ success: true });
});
app.get('/api/messages', requireAdmin, (req, res) => {
  res.json(readDB().messages);
});
app.delete('/api/messages/:id', requireAdmin, (req, res) => {
  const db = readDB();
  db.messages = db.messages.filter((m) => m.id !== req.params.id);
  writeDB(db);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
  console.log(`Admin panel at http://localhost:${PORT}/admin.html`);
  console.log(`Admin token: ${ADMIN_TOKEN} (set ADMIN_TOKEN env var to change it)`);
});
