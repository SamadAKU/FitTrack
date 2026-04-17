const TodoView = {
  name: 'TodoView',
  props: ['user'],
  template: `
  <div>

    <!-- Header + Add button -->
    <div class="ft-card mb-6" style="background:linear-gradient(135deg,var(--color-bg-surface),var(--color-bg-card));border-color:rgba(0,229,160,0.2);position:relative;overflow:hidden;">
      <svg style="position:absolute;right:0;top:0;opacity:.06;" width="220" height="120" viewBox="0 0 220 120">
        <circle cx="180" cy="20" r="80" fill="var(--color-accent-green)"/>
        <circle cx="60"  cy="100" r="60" fill="var(--color-accent-blue)"/>
      </svg>
      <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-family:system-ui,sans-serif;font-size:22px;font-weight:800;color:var(--color-text-heading);margin-bottom:4px;">
            To-Do List
          </div>
          <div style="color:var(--color-text-body);font-size:14px;">
            {{ remaining }} task{{ remaining !== 1 ? 's' : '' }} remaining
          </div>
        </div>
        <button class="btn-primary" @click="showForm=!showForm">
          <i :class="showForm ? 'fas fa-times' : 'fas fa-plus'"></i>
          {{ showForm ? 'Cancel' : 'New Task' }}
        </button>
      </div>
    </div>

    <!-- Add Task Form -->
    <div v-if="showForm" class="ft-card mb-6">
      <div class="card-title">New Task</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="field" style="grid-column:1/-1;">
          <label class="label">Task Title *</label>
          <input class="input" v-model="form.title" placeholder="What needs to be done?" @keyup.enter="addTodo"/>
        </div>
        <div class="field">
          <label class="label">Priority</label>
          <select class="input" v-model="form.priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="field">
          <label class="label">Category</label>
          <input class="input" v-model="form.category" placeholder="e.g. Fitness, Health..." list="cat-list"/>
          <datalist id="cat-list">
            <option v-for="c in categories" :key="c" :value="c"/>
          </datalist>
        </div>
        <div class="field">
          <label class="label">Due Date</label>
          <input class="input" type="date" v-model="form.due_date"/>
        </div>
        <div class="field">
          <label class="label">Repeats</label>
          <select class="input" v-model="form.recurrence">
            <option value="none">No repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
      <div style="margin-top:16px;">
        <button class="btn-primary" @click="addTodo" :disabled="saving">
          <span v-if="!saving"><i class="fas fa-plus"></i> Add Task</span>
          <span v-else><i class="fas fa-spinner fa-spin"></i></span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="ft-card mb-6" style="padding:14px 20px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <button v-for="f in filters" :key="f.value"
          :class="['btn-secondary', activeFilter===f.value ? 'active' : '']"
          style="padding:6px 14px;font-size:13px;"
          @click="activeFilter=f.value">
          {{ f.label }}
        </button>
        <select class="input" v-model="activeCat" style="padding:6px 12px;font-size:13px;height:auto;max-width:200px;margin-left:auto;">
          <option value="">All Categories</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ft-card" style="text-align:center;padding:60px;">
      <i class="fas fa-spinner fa-spin" style="font-size:28px;color:var(--color-text-subheading);"></i>
    </div>

    <!-- Empty State -->
    <div v-else-if="filtered.length === 0" class="ft-card">
      <div class="empty-state">
        <i class="fas fa-check-circle"></i>
        <p>{{ activeFilter === 'completed' ? 'No completed tasks yet.' : 'All caught up! Add a new task above.' }}</p>
      </div>
    </div>

    <!-- Todo Table -->
    <div v-else class="ft-card">
      <div class="section-title">Tasks</div>
      <div style="overflow-x:auto;">
        <table class="ft-table">
          <thead>
            <tr>
              <th style="width:32px;"></th>
              <th>Task</th>
              <th>Priority</th>
              <th>Category</th>
              <th>Due</th>
              <th>Repeats</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="todo in filtered" :key="todo.id" :style="todo.completed ? 'opacity:.55;' : ''">

              <!-- Checkbox -->
              <td>
                <button @click="toggleDone(todo)"
                  style="width:20px;height:20px;border-radius:5px;border:2px solid var(--color-border-strong);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;"
                  :style="todo.completed ? 'background:var(--color-accent-green);border-color:var(--color-accent-green);' : ''"
                  :title="todo.completed ? 'Mark incomplete' : 'Mark complete'">
                  <i v-if="todo.completed" class="fas fa-check" style="font-size:10px;color:#080D1A;"></i>
                </button>
              </td>

              <!-- Title -->
              <td>
                <span :style="todo.completed ? 'text-decoration:line-through;color:var(--color-text-subheading);' : 'font-weight:600;color:var(--color-text-heading);'">
                  {{ todo.title }}
                </span>
              </td>

              <!-- Priority -->
              <td>
                <span class="tag-pill"
                  :class="todo.priority==='high' ? 'red' : todo.priority==='medium' ? 'yellow' : 'green'">
                  {{ todo.priority }}
                </span>
              </td>

              <!-- Category -->
              <td style="color:var(--color-text-subheading);">{{ todo.category || '—' }}</td>

              <!-- Due date -->
              <td>
                <span v-if="todo.due_date"
                  :style="isOverdue(todo) ? 'color:var(--color-accent-red);font-weight:600;' : 'color:var(--color-text-subheading);'">
                  {{ formatDate(todo.due_date) }}
                  <span v-if="isOverdue(todo)" style="font-size:11px;"> ⚠</span>
                </span>
                <span v-else style="color:var(--color-text-subheading);">—</span>
              </td>

              <!-- Recurrence -->
              <td>
                <span v-if="todo.recurrence !== 'none'" class="tag-pill green" style="font-size:11px;">
                  <i class="fas fa-redo" style="font-size:9px;margin-right:3px;"></i>{{ todo.recurrence }}
                </span>
                <span v-else style="color:var(--color-text-subheading);">—</span>
              </td>

              <!-- Delete -->
              <td>
                <button class="btn-danger" @click="deleteTodo(todo.id)" title="Delete task">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
  `,
  setup() {
    const todos      = ref([]);
    const categories = ref([]);
    const loading    = ref(true);
    const saving     = ref(false);
    const showForm   = ref(false);
    const activeFilter = ref('active');
    const activeCat    = ref('');

    const form = ref({ title: '', priority: 'medium', category: '', due_date: '', recurrence: 'none' });

    const filters = [
      { label: 'Active',    value: 'active'    },
      { label: 'Completed', value: 'completed' },
      { label: 'All',       value: 'all'       },
    ];

    const filtered = computed(() => {
      let list = todos.value;
      if (activeFilter.value === 'active')    list = list.filter(t => !t.completed);
      if (activeFilter.value === 'completed') list = list.filter(t =>  t.completed);
      if (activeCat.value) list = list.filter(t => t.category === activeCat.value);
      const pw = { high: 0, medium: 1, low: 2 };
      return [...list].sort((a, b) => {
        const aOver = isOverdue(a) ? 0 : 1;
        const bOver = isOverdue(b) ? 0 : 1;
        if (aOver !== bOver) return aOver - bOver;
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return  1;
        return (pw[a.priority] ?? 1) - (pw[b.priority] ?? 1);
      });
    });

    const remaining = computed(() => todos.value.filter(t => !t.completed).length);

    function isOverdue(todo) {
      if (!todo.due_date || todo.completed) return false;
      return todo.due_date < new Date().toISOString().split('T')[0];
    }

    function formatDate(str) {
      if (!str) return '';
      return new Date(str + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
    }

    async function load() {
      loading.value = true;
      try {
        const [t, c] = await Promise.all([API.getTodos(), API.getCategories()]);
        todos.value      = t;
        categories.value = c;
      } catch(e) {
        showToast('Failed to load tasks', 'error');
      } finally {
        loading.value = false;
      }
    }

    async function addTodo() {
      if (!form.value.title.trim()) return showToast('Please enter a task title', 'error');
      saving.value = true;
      try {
        const created = await API.createTodo({
          title:      form.value.title.trim(),
          priority:   form.value.priority,
          category:   form.value.category.trim() || null,
          due_date:   form.value.due_date || null,
          recurrence: form.value.recurrence
        });
        todos.value.unshift(created);
        if (created.category && !categories.value.includes(created.category))
          categories.value.push(created.category);
        form.value = { title: '', priority: 'medium', category: '', due_date: '', recurrence: 'none' };
        showForm.value = false;
        showToast('Task added!');
      } catch(e) {
        showToast(e.error || 'Failed to add task', 'error');
      } finally {
        saving.value = false;
      }
    }

    async function toggleDone(todo) {
      try {
        const updated = await API.updateTodo(todo.id, { completed: !todo.completed });
        const idx = todos.value.findIndex(t => t.id === todo.id);
        if (idx !== -1) todos.value[idx] = updated;
        if (!todo.completed && todo.recurrence !== 'none') await load();
        showToast(updated.completed ? 'Task complete! 🎉' : 'Marked incomplete');
      } catch(e) {
        showToast('Failed to update task', 'error');
      }
    }

    async function deleteTodo(id) {
      try {
        await API.deleteTodo(id);
        todos.value = todos.value.filter(t => t.id !== id);
        showToast('Task deleted');
      } catch(e) {
        showToast('Failed to delete task', 'error');
      }
    }

    onMounted(load);

    return {
      todos, categories, loading, saving, showForm, form,
      filters, activeFilter, activeCat, filtered, remaining,
      isOverdue, formatDate, addTodo, toggleDone, deleteTodo
    };
  }
};
