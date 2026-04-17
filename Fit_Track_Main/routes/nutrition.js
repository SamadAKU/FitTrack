const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const auth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

router.get('/food', auth, (req, res) => {
	
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const logs = db.get('food_logs').filter({ user_id: req.session.userId, logged_at: date }).sortBy('created_at').value();
  res.json(logs);
  
  
});

router.post('/food', auth, (req, res) => {
	/*
  const { food_name, calories, protein_g, carbs_g, fat_g, serving_size, meal_type, logged_at } = req.body;
  if (!food_name || calories == null) return res.status(400).json({ error: 'food_name and calories required' });
  const entry = {
    id: uuidv4(), user_id: req.session.userId,
    food_name, calories: +calories,
    protein_g: +(protein_g || 0), carbs_g: +(carbs_g || 0), fat_g: +(fat_g || 0),
    serving_size: serving_size || '', meal_type: meal_type || 'snack',
    logged_at: logged_at || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  };
  db.get('food_logs').push(entry).write();
  res.json(entry);
  
  */
  /////////////////////////
  //fixes risky NaN or inf values 
  const { food_name, calories, protein_g, carbs_g, fat_g, serving_size, meal_type, logged_at } = req.body;

  const cleanFoodName = String(food_name || '').trim();
  const caloriesNum = Number(calories);
  const proteinNum = Number(protein_g || 0);
  const carbsNum = Number(carbs_g || 0);
  const fatNum = Number(fat_g || 0);

  if (!cleanFoodName) {
    return res.status(400).json({ error: 'food_name required' });
  }

  if (!Number.isFinite(caloriesNum) || caloriesNum < 0) {
    return res.status(400).json({ error: 'calories must be a non-negative number' });
  }

  if (![proteinNum, carbsNum, fatNum].every(n => Number.isFinite(n) && n >= 0)) {
    return res.status(400).json({ error: 'macros must be non-negative numbers' });
  }

  const entry = {
    id: uuidv4(),
    user_id: req.session.userId,
    food_name: cleanFoodName,
    calories: caloriesNum,
    protein_g: proteinNum,
    carbs_g: carbsNum,
    fat_g: fatNum,
    serving_size: serving_size || '',
    meal_type: meal_type || 'snack',
    logged_at: logged_at || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  };

  db.get('food_logs').push(entry).write();
  return res.status(201).json(entry);
});

/*
router.delete('/food/:id', auth, (req, res) => {
  db.get('food_logs').remove({ id: req.params.id, user_id: req.session.userId }).write();
  res.json({ success: true });
});
*/
router.delete('/food/:id', auth, (req, res) => {
  const item = db.get('food_logs')
    .find({ id: req.params.id, user_id: req.session.userId })
    .value();

  if (!item) {
    return res.status(404).json({ error: 'Food log not found' });
  }

  db.get('food_logs')
    .remove({ id: req.params.id, user_id: req.session.userId })
    .write();

  return res.json({ success: true });
});

router.get('/water', auth, (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const logs = db.get('water_logs').filter({ user_id: req.session.userId, logged_at: date }).value();
  const total = logs.reduce((s, l) => s + l.amount_ml, 0);
  res.json({ logs, total });
});

router.post('/water', auth, (req, res) => {
	/*
  const { amount_ml, logged_at } = req.body;
  if (!amount_ml) return res.status(400).json({ error: 'amount_ml required' });
  const entry = {
    id: uuidv4(), user_id: req.session.userId,
    amount_ml: +amount_ml,
    logged_at: logged_at || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  };
  db.get('water_logs').push(entry).write();
  res.json(entry);
  */
  const { amount_ml, logged_at } = req.body;
  const amountNum = Number(amount_ml);

  if (amount_ml == null) {
    return res.status(400).json({ error: 'amount_ml required' });
  }

  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: 'amount_ml must be a positive number' });
  }

  const entry = {
    id: uuidv4(),
    user_id: req.session.userId,
    amount_ml: amountNum,
    logged_at: logged_at || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  };

  db.get('water_logs').push(entry).write();
  return res.status(201).json(entry);
  
  
});

router.delete('/water/:id', auth, (req, res) => {
	/*
  db.get('water_logs').remove({ id: req.params.id, user_id: req.session.userId }).write();
  res.json({ success: true });
  */
  //possible same vulnerability
   const item = db.get('water_logs')
    .find({ id: req.params.id, user_id: req.session.userId })
    .value();

  if (!item) {
    return res.status(404).json({ error: 'Water log not found' });
  }

  db.get('water_logs')
    .remove({ id: req.params.id, user_id: req.session.userId })
    .write();

  return res.json({ success: true });
  
});

module.exports = router;
