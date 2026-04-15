const express = require('express');
const router = express.Router();
const db = require('../database');

const auth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

router.get('/dashboard', auth, (req, res) => {
  const uid = req.session.userId;
  const today = new Date().toISOString().split('T')[0];
  const user = db.get('users').find({ id: uid }).value();
  const { password: _, ...safeUser } = user;

  const todayFoods = db.get('food_logs').filter({ user_id: uid, logged_at: today }).value();
  const macros = todayFoods.reduce((acc, l) => ({
    calories: acc.calories + l.calories, protein: acc.protein + l.protein_g,
    carbs: acc.carbs + l.carbs_g, fat: acc.fat + l.fat_g
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const waterLogs = db.get('water_logs').filter({ user_id: uid, logged_at: today }).value();
  const water = waterLogs.reduce((s, l) => s + l.amount_ml, 0);

  const lastWeight = db.get('weight_logs').filter({ user_id: uid }).orderBy('logged_at', 'desc').first().value();

  const allSessions = db.get('workout_sessions').filter({ user_id: uid }).value();
  const weekStart = daysAgo(6);
  const weekSessions = allSessions.filter(s => s.completed_at.split('T')[0] >= weekStart).length;

  res.json({ user: safeUser, macros, water, lastWeight, totalSessions: allSessions.length, weekSessions });
});

router.get('/nutrition-week', auth, (req, res) => {
  const uid = req.session.userId;
  const results = [];
  for (let d = 6; d >= 0; d--) {
    const date = daysAgo(d);
    const logs = db.get('food_logs').filter({ user_id: uid, logged_at: date }).value();
    results.push({
      date,
      calories: logs.reduce((s, l) => s + l.calories, 0),
      protein:  logs.reduce((s, l) => s + l.protein_g, 0),
      carbs:    logs.reduce((s, l) => s + l.carbs_g, 0),
      fat:      logs.reduce((s, l) => s + l.fat_g, 0),
    });
  }
  res.json(results);
});

router.get('/weight-trend', auth, (req, res) => {
  const logs = db.get('weight_logs').filter({ user_id: req.session.userId }).orderBy('logged_at').takeRight(30).value();
  res.json(logs.map(l => ({ date: l.logged_at, weight_kg: l.weight_kg })));
});

router.get('/workout-frequency', auth, (req, res) => {
  const uid = req.session.userId;
  const cutoff = daysAgo(28);
  const sessions = db.get('workout_sessions').filter(s => s.user_id === uid && s.completed_at >= cutoff).value();
  const weekMap = {};
  sessions.forEach(s => {
    const d = new Date(s.completed_at);
    const week = `${d.getFullYear()}-W${String(Math.ceil((d.getDate()) / 7)).padStart(2,'0')}`;
    weekMap[week] = (weekMap[week] || 0) + 1;
  });
  const result = Object.entries(weekMap).map(([week, sessions]) => ({ week, sessions })).sort((a, b) => a.week.localeCompare(b.week));
  res.json(result);
});

module.exports = router;
