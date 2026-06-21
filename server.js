const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'admin-data.json');
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/data', async (req, res) => {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    const payload = JSON.parse(content);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load admin data.' });
  }
});

app.get('/api/trips', async (req, res) => {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    const payload = JSON.parse(content);
    res.json(Array.isArray(payload.trips) ? payload.trips : []);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load trips.' });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const payload = req.body;
    await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Unable to save admin data.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
