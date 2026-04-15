const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const auth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

router.get('/plans', auth, (req, res) => {
  const plans = db.get('workout_plans').filter({ user_id: req.session.userId }).orderBy('created_at', 'desc').value();
  const result = plans.map(plan => ({
    ...plan,
    exercises: db.get('exercises').filter({ plan_id: plan.id }).orderBy('order_index').value()
  }));
  res.json(result);
});

router.post('/plans', auth, (req, res) => {
  const { name, description, exercises } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const planId = uuidv4();
  const plan = { id: planId, user_id: req.session.userId, name, description: description || '', created_at: new Date().toISOString() };
  db.get('workout_plans').push(plan).write();
  const exs = (exercises || []).map((ex, i) => ({
    id: uuidv4(), plan_id: planId, name: ex.name,
    sets: ex.sets || 3, reps: ex.reps || 10, rest_seconds: ex.rest_seconds || 60,
    weight_kg: ex.weight_kg || null, notes: ex.notes || '', order_index: i
  }));
  exs.forEach(ex => db.get('exercises').push(ex).write());
  res.json({ ...plan, exercises: exs });
});

router.delete('/plans/:id', auth, (req, res) => {
  db.get('workout_plans').remove({ id: req.params.id, user_id: req.session.userId }).write();
  db.get('exercises').remove({ plan_id: req.params.id }).write();
  res.json({ success: true });
});

router.get('/sessions', auth, (req, res) => {
  const sessions = db.get('workout_sessions').filter({ user_id: req.session.userId }).orderBy('completed_at', 'desc').take(20).value();
  const result = sessions.map(s => ({
    ...s,
    sets: db.get('session_sets').filter({ session_id: s.id }).orderBy('set_number').value()
  }));
  res.json(result);
});

router.post('/sessions', auth, (req, res) => {
  const { plan_id, plan_name, duration_seconds, notes, sets } = req.body;
  const sessionId = uuidv4();
  db.get('workout_sessions').push({
    id: sessionId, user_id: req.session.userId,
    plan_id: plan_id || null, plan_name: plan_name || 'Custom Quest',
    duration_seconds: duration_seconds || 0, notes: notes || '',
    completed_at: new Date().toISOString()
  }).write();
  (sets || []).forEach(s => {
    db.get('session_sets').push({
      id: uuidv4(), session_id: sessionId,
      exercise_name: s.exercise_name, set_number: s.set_number,
      reps_completed: s.reps_completed, weight_kg: s.weight_kg, feel_rating: s.feel_rating
    }).write();
  });
  res.json({ success: true, sessionId });
});

module.exports = router;
