// database.js — lowdb JSON file database (zero native deps, works on all platforms)
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// Schema defaults
db.defaults({
  users: [],
  food_logs: [],
  water_logs: [],
  weight_logs: [],
  workout_plans: [],
  exercises: [],
  workout_sessions: [],
  session_sets: []
}).write();

// Seed demo user if not present
if (!db.get('users').find({ email: 'demo@fittrack.com' }).value()) {
  const hash = bcrypt.hashSync('demo123', 10);
  const uid = uuidv4();
  db.get('users').push({
    id: uid, username: 'demo', email: 'demo@fittrack.com',
    password: hash, display_name: 'The Champion',
    height_cm: 175, goal_calories: 2200, goal_protein: 160,
    goal_carbs: 220, goal_fat: 70, goal_water_ml: 2500,
    created_at: new Date().toISOString()
  }).write();

  // Seed food logs — last 7 days
  const foods = [
    ['Roast Boar', 350, 42, 0, 18, 'breakfast'],
    ['Hearty Stew', 420, 28, 45, 12, 'lunch'],
    ['Crusty Bread', 280, 8, 52, 4, 'lunch'],
    ['Smoked Salmon', 260, 38, 0, 12, 'dinner'],
    ['Roasted Turnips', 80, 3, 16, 1, 'dinner'],
    ['Honeyed Mead (protein)', 180, 30, 10, 3, 'snack'],
    ['Wild Berries', 90, 1, 22, 0, 'snack'],
    ['Grilled Venison', 290, 45, 0, 11, 'dinner'],
    ['Oat Porridge', 310, 11, 55, 6, 'breakfast'],
    ['Poached Eggs', 210, 18, 1, 15, 'breakfast'],
  ];

  for (let d = 6; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 4) + 3;
    for (let i = 0; i < count; i++) {
      const f = foods[Math.floor(Math.random() * foods.length)];
      db.get('food_logs').push({
        id: uuidv4(), user_id: uid, food_name: f[0],
        calories: f[1], protein_g: f[2], carbs_g: f[3], fat_g: f[4],
        serving_size: '1 serving', meal_type: f[5],
        logged_at: dateStr, created_at: new Date().toISOString()
      }).write();
    }
    // Water
    db.get('water_logs').push({
      id: uuidv4(), user_id: uid,
      amount_ml: 1800 + Math.floor(Math.random() * 900),
      logged_at: dateStr, created_at: new Date().toISOString()
    }).write();
    // Weight
    const w = 78 + (Math.random() * 2 - 1);
    db.get('weight_logs').push({
      id: uuidv4(), user_id: uid,
      weight_kg: Math.round(w * 10) / 10,
      notes: '', logged_at: dateStr, created_at: new Date().toISOString()
    }).write();
  }

  // Seed workout plan
  const planId = uuidv4();
  db.get('workout_plans').push({
    id: planId, user_id: uid,
    name: 'Knight\'s Training',
    description: 'Strength of a thousand soldiers',
    created_at: new Date().toISOString()
  }).write();

  const exList = [
    ['Sword Press (Bench)', 4, 8, 90, 80],
    ['Shield Raise (OHP)', 3, 10, 75, 50],
    ['Castle Row', 3, 12, 60, 60],
    ['Dragon Squat', 4, 10, 90, 100],
    ['Siege Pull-up', 3, 8, 60, 0],
  ];
  exList.forEach((e, i) => {
    db.get('exercises').push({
      id: uuidv4(), plan_id: planId, name: e[0],
      sets: e[1], reps: e[2], rest_seconds: e[3], weight_kg: e[4],
      notes: '', order_index: i
    }).write();
  });

  // Seed sessions
  for (let d = 6; d >= 1; d -= 2) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    db.get('workout_sessions').push({
      id: uuidv4(), user_id: uid, plan_id: planId,
      plan_name: "Knight's Training",
      duration_seconds: 2700 + Math.floor(Math.random() * 1200),
      notes: '', completed_at: date.toISOString()
    }).write();
  }
}

module.exports = db;
