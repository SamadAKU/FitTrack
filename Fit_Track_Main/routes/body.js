const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const auth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

router.get('/weight', auth, (req, res) => {
  const logs = db.get('weight_logs').filter({ user_id: req.session.userId }).orderBy('logged_at').takeRight(30).value();
  res.json(logs);
});

router.post('/weight', auth, (req, res) => {
  const { weight_kg, notes, logged_at } = req.body;
  if (!weight_kg) return res.status(400).json({ error: 'weight_kg required' });
  const date = logged_at || new Date().toISOString().split('T')[0];
  // Upsert: if entry exists for same user + same day, update it instead of adding new
  const existing = db.get('weight_logs').find({ user_id: req.session.userId, logged_at: date }).value();
  if (existing) {
    db.get('weight_logs').find({ id: existing.id }).assign({ weight_kg: +weight_kg, notes: notes || '' }).write();
    const updated = db.get('weight_logs').find({ id: existing.id }).value();
    return res.json(updated);
  }
  const entry = {
    id: uuidv4(), user_id: req.session.userId,
    weight_kg: +weight_kg, notes: notes || '',
    logged_at: date, created_at: new Date().toISOString()
  };
  db.get('weight_logs').push(entry).write();
  res.json(entry);
});

router.delete('/weight/:id', auth, (req, res) => {
  db.get('weight_logs').remove({ id: req.params.id, user_id: req.session.userId }).write();
  res.json({ success: true });
});

module.exports = router;
