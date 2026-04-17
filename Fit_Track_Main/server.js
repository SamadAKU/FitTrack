// server.js - FitTrack Pro Express Server
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'fittrack-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax', httpOnly: true }
}));

// Routes
const authRoutes = require('./routes/auth');
const nutritionRoutes = require('./routes/nutrition');
const workoutRoutes = require('./routes/workouts');
const bodyRoutes = require('./routes/body');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/body', bodyRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/achievements/data', (req, res) => {
  try {
    const db = require('./database');
    res.json({
      users: db.get('users').value() || [],
      food_logs: db.get('food_logs').value() || [],
      water_logs: db.get('water_logs').value() || [],
      workout_sessions: db.get('workout_sessions').value() || []
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load achievements data" });
  }
});

// Serve main app for all non-API routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FitTrack Pro running at http://localhost:${PORT}`);
});
