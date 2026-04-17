const API = {
  async _req(method, url, data) {
    const opts = { method, credentials: 'include', headers: {} };
    if (data) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(data); }
    const res = await fetch(url, opts);
    if (!res.ok) throw await res.json().catch(() => ({ error: 'Server error' }));
    return res.json();
  },
  get:    (url)       => API._req('GET',    url),
  post:   (url, data) => API._req('POST',   url, data),
  put:    (url, data) => API._req('PUT',    url, data),
  delete: (url)       => API._req('DELETE', url),

  // Auth
  login:         d  => API.post('/api/auth/login', d),
  register:      d  => API.post('/api/auth/register', d),
  logout:        () => API.post('/api/auth/logout', {}),
  getMe:         () => API.get('/api/auth/me'),
  updateProfile: d  => API.put('/api/auth/profile', d),

  // Nutrition
  getFoodLogs: date => API.get(`/api/nutrition/food?date=${date}`),
  addFood:     d    => API.post('/api/nutrition/food', d),
  deleteFood:  id   => API.delete(`/api/nutrition/food/${id}`),
  getWater:    date => API.get(`/api/nutrition/water?date=${date}`),
  addWater:    d    => API.post('/api/nutrition/water', d),
  deleteWater: id   => API.delete(`/api/nutrition/water/${id}`),

  // Workouts
  getPlans:    ()  => API.get('/api/workouts/plans'),
  createPlan:  d   => API.post('/api/workouts/plans', d),
  deletePlan:  id  => API.delete(`/api/workouts/plans/${id}`),
  getSessions: ()  => API.get('/api/workouts/sessions'),
  saveSession: d   => API.post('/api/workouts/sessions', d),

  // Body
  getWeight:    ()  => API.get('/api/body/weight'),
  addWeight:    d   => API.post('/api/body/weight', d),
  deleteWeight: id  => API.delete(`/api/body/weight/${id}`),

  // Analytics
  getDashboard:       () => API.get('/api/analytics/dashboard'),
  getNutritionWeek:   () => API.get('/api/analytics/nutrition-week'),
  getWeightTrend:     () => API.get('/api/analytics/weight-trend'),
  getWorkoutFrequency:() => API.get('/api/analytics/workout-frequency'),

  // Todos
  getTodos:       (params = '') => API.get(`/api/todos${params}`),
  createTodo:     d             => API.post('/api/todos', d),
  updateTodo:     (id, d)       => API._req('PATCH', `/api/todos/${id}`, d),
  deleteTodo:     id            => API.delete(`/api/todos/${id}`),
  getCategories:  ()            => API.get('/api/todos/categories'),

  // Goals
  getGoals:       (params = '') => API.get(`/api/goals${params}`),
  createGoal:     d             => API.post('/api/goals', d),
  updateGoal:     (id, d)       => API._req('PATCH', `/api/goals/${id}`, d),
  deleteGoal:     id            => API.delete(`/api/goals/${id}`),
};

// jQuery-powered toast herald announcement
function showToast(msg, type = 'success') {
  const toast = $(`<div class="toast">${msg}</div>`);
  if (type === 'error') toast.css('border-left-color', 'var(--ember)');
  $('body').append(toast);
  setTimeout(() => toast.fadeOut(300, function(){ $(this).remove(); }), 3000);
}

// Utility helpers
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

function pct(val, goal) {
  return Math.min(100, Math.round(((val || 0) / (goal || 1)) * 100));
}
