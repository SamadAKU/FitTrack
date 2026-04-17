const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const auth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_RECURRENCES = ['none', 'daily', 'weekly', 'monthly'];

// GET /todos — fetch all todos, optional ?category= or ?completed= filters
router.get('/', auth, (req, res) => {
  let todos = db.get('todos').filter({ user_id: req.session.userId }).orderBy('created_at', 'desc').value();

  if (req.query.category) {
    todos = todos.filter(t => t.category === req.query.category);
  }
  if (req.query.completed !== undefined) {
    const done = req.query.completed === 'true';
    todos = todos.filter(t => t.completed === done);
  }

  res.json(todos);
});

// POST /todos — create a new todo
router.post('/', auth, (req, res) => {
  const { title, due_date, priority, category, recurrence } = req.body;

  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    return res.status(400).json({ error: 'title required' });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  if (recurrence && !VALID_RECURRENCES.includes(recurrence)) {
    return res.status(400).json({ error: `recurrence must be one of: ${VALID_RECURRENCES.join(', ')}` });
  }

  if (due_date && isNaN(Date.parse(due_date))) {
    return res.status(400).json({ error: 'due_date must be a valid date (YYYY-MM-DD)' });
  }

  const entry = {
    id: uuidv4(),
    user_id: req.session.userId,
    title: cleanTitle,
    completed: false,
    priority: priority || 'medium',
    category: String(category || '').trim() || null,
    due_date: due_date || null,
    recurrence: recurrence || 'none',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.get('todos').push(entry).write();
  return res.status(201).json(entry);
});

// PATCH /todos/:id — update fields (title, completed, priority, due_date, category, recurrence)
router.patch('/:id', auth, (req, res) => {
  const todo = db.get('todos')
    .find({ id: req.params.id, user_id: req.session.userId })
    .value();

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const { title, completed, priority, category, due_date, recurrence } = req.body;
  const updates = { updated_at: new Date().toISOString() };

  if (title !== undefined) {
    const cleanTitle = String(title).trim();
    if (!cleanTitle) return res.status(400).json({ error: 'title cannot be empty' });
    updates.title = cleanTitle;
  }

  if (completed !== undefined) {
    updates.completed = Boolean(completed);

    // When completing a recurring todo, create the next occurrence automatically
    if (updates.completed && todo.recurrence && todo.recurrence !== 'none' && todo.due_date) {
      const next = new Date(todo.due_date);
      if (todo.recurrence === 'daily')   next.setDate(next.getDate() + 1);
      if (todo.recurrence === 'weekly')  next.setDate(next.getDate() + 7);
      if (todo.recurrence === 'monthly') next.setMonth(next.getMonth() + 1);

      const nextEntry = {
        ...todo,
        id: uuidv4(),
        completed: false,
        due_date: next.toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.get('todos').push(nextEntry).write();
    }
  }

  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }
    updates.priority = priority;
  }

  if (category !== undefined) {
    updates.category = String(category).trim() || null;
  }

  if (due_date !== undefined) {
    if (due_date !== null && isNaN(Date.parse(due_date))) {
      return res.status(400).json({ error: 'due_date must be a valid date (YYYY-MM-DD)' });
    }
    updates.due_date = due_date;
  }

  if (recurrence !== undefined) {
    if (!VALID_RECURRENCES.includes(recurrence)) {
      return res.status(400).json({ error: `recurrence must be one of: ${VALID_RECURRENCES.join(', ')}` });
    }
    updates.recurrence = recurrence;
  }

  db.get('todos').find({ id: req.params.id, user_id: req.session.userId }).assign(updates).write();
  const updated = db.get('todos').find({ id: req.params.id }).value();
  return res.json(updated);
});

// DELETE /todos/:id
router.delete('/:id', auth, (req, res) => {
  const todo = db.get('todos')
    .find({ id: req.params.id, user_id: req.session.userId })
    .value();

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  db.get('todos').remove({ id: req.params.id, user_id: req.session.userId }).write();
  return res.json({ success: true });
});

// GET /todos/categories — list all distinct categories for this user
router.get('/categories', auth, (req, res) => {
  const todos = db.get('todos').filter({ user_id: req.session.userId }).value();
  const categories = [...new Set(todos.map(t => t.category).filter(Boolean))].sort();
  res.json(categories);
});

module.exports = router;
