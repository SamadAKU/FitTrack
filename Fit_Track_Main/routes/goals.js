const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const auth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

const VALID_GOAL_TYPES = ['weight', 'fitness'];
const VALID_STATUSES = ['active', 'completed', 'abandoned'];

// GET /goals — fetch all goals, optional ?type= or ?status= filters
router.get('/', auth, (req, res) => {
  let goals = db.get('goals').filter({ user_id: req.session.userId }).orderBy('created_at', 'desc').value();

  if (req.query.type) {
    if (!VALID_GOAL_TYPES.includes(req.query.type)) {
      return res.status(400).json({ error: `type must be one of: ${VALID_GOAL_TYPES.join(', ')}` });
    }
    goals = goals.filter(g => g.type === req.query.type);
  }

  if (req.query.status) {
    if (!VALID_STATUSES.includes(req.query.status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    goals = goals.filter(g => g.status === req.query.status);
  }

  // For weight goals, attach the most recent weight log so the client
  // can compute progress without a second request
  const latestWeight = db.get('weight_logs')
    .filter({ user_id: req.session.userId })
    .orderBy('logged_at', 'desc')
    .first()
    .value();
  
  const enriched = goals.map(g => {
    if (g.type !== 'weight') return g;
    return { ...g, current_weight_kg: latestWeight?.weight_kg ?? null };
  });
  
  res.json(enriched);
});

// POST /goals — create a new goal
//
// Weight goal body:
//   { type: 'weight', title, target_weight_kg, target_date, notes }
//
// Fitness goal body:
//   { type: 'fitness', title, description, target_date, notes }
router.post('/', auth, (req, res) => {
  const { type, title, target_date, notes } = req.body;

  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    return res.status(400).json({ error: 'title required' });
  }

  if (!type || !VALID_GOAL_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VALID_GOAL_TYPES.join(', ')}` });
  }

  if (target_date && isNaN(Date.parse(target_date))) {
    return res.status(400).json({ error: 'target_date must be a valid date (YYYY-MM-DD)' });
  }

  const base = {
    id: uuidv4(),
    user_id: req.session.userId,
    type,
    title: cleanTitle,
    status: 'active',
    target_date: target_date || null,
    notes: String(notes || '').trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let entry;

  if (type === 'weight') {
    const { target_weight_kg } = req.body;
    const targetNum = Number(target_weight_kg);

    if (target_weight_kg == null) {
      return res.status(400).json({ error: 'target_weight_kg required for weight goals' });
    }
    if (!Number.isFinite(targetNum) || targetNum <= 0) {
      return res.status(400).json({ error: 'target_weight_kg must be a positive number' });
    }

    entry = { ...base, target_weight_kg: targetNum, description: null };

  } else {
    // fitness
    const { description } = req.body;
    entry = {
      ...base,
      description: String(description || '').trim() || null,
      target_weight_kg: null
    };
  }

  db.get('goals').push(entry).write();
    if (entry.type === 'weight') {
    const latestWeight = db.get('weight_logs')
        .filter({ user_id: req.session.userId })
        .orderBy('logged_at', 'desc')
        .first()
        .value();
      entry.current_weight_kg = latestWeight ? latestWeight.weight_kg : null;
    }
  
  return res.status(201).json(entry);
});

// PATCH /goals/:id — update status, title, target_date, notes, target_weight_kg, description
router.patch('/:id', auth, (req, res) => {
  const goal = db.get('goals')
    .find({ id: req.params.id, user_id: req.session.userId })
    .value();

  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const { title, status, target_date, notes, target_weight_kg, description } = req.body;
  const updates = { updated_at: new Date().toISOString() };

  if (title !== undefined) {
    const cleanTitle = String(title).trim();
    if (!cleanTitle) return res.status(400).json({ error: 'title cannot be empty' });
    updates.title = cleanTitle;
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    updates.status = status;
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
  }

  if (target_date !== undefined) {
    if (target_date !== null && isNaN(Date.parse(target_date))) {
      return res.status(400).json({ error: 'target_date must be a valid date (YYYY-MM-DD)' });
    }
    updates.target_date = target_date;
  }

  if (notes !== undefined) {
    updates.notes = String(notes).trim();
  }

  if (target_weight_kg !== undefined && goal.type === 'weight') {
    const targetNum = Number(target_weight_kg);
    if (!Number.isFinite(targetNum) || targetNum <= 0) {
      return res.status(400).json({ error: 'target_weight_kg must be a positive number' });
    }
    updates.target_weight_kg = targetNum;
  }

  if (description !== undefined && goal.type === 'fitness') {
    updates.description = String(description).trim() || null;
  }

  db.get('goals').find({ id: req.params.id, user_id: req.session.userId }).assign(updates).write();
  const updated = db.get('goals').find({ id: req.params.id }).value();
  return res.json(updated);
});

// DELETE /goals/:id
router.delete('/:id', auth, (req, res) => {
  const goal = db.get('goals')
    .find({ id: req.params.id, user_id: req.session.userId })
    .value();

  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  db.get('goals').remove({ id: req.params.id, user_id: req.session.userId }).write();
  return res.json({ success: true });
});

module.exports = router;
