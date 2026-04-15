const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

router.post('/register', (req, res) => {
  const { username, email, password, display_name } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (db.get('users').find({ email }).value()) return res.status(409).json({ error: 'Email already in use' });
  if (db.get('users').find({ username }).value()) return res.status(409).json({ error: 'Username taken' });
  const hash = bcrypt.hashSync(password, 10);
  const user = {
    id: uuidv4(), username, email, password: hash,
    display_name: display_name || username,
    height_cm: null, goal_calories: 2000, goal_protein: 150,
    goal_carbs: 250, goal_fat: 65, goal_water_ml: 2500,
    created_at: new Date().toISOString()
  };
  db.get('users').push(user).write();
  req.session.userId = user.id;
  const { password: _, ...safe } = user;
  res.json({ success: true, user: safe });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.get('users').find({ email }).value();
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });
  req.session.userId = user.id;
  const { password: _, ...safe } = user;
  res.json({ success: true, user: safe });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const user = db.get('users').find({ id: req.session.userId }).value();
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

router.put('/profile', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { display_name, height_cm, goal_calories, goal_protein, goal_carbs, goal_fat, goal_water_ml } = req.body;
  db.get('users').find({ id: req.session.userId }).assign({ display_name, height_cm, goal_calories, goal_protein, goal_carbs, goal_fat, goal_water_ml }).write();
  res.json({ success: true });
});

module.exports = router;
