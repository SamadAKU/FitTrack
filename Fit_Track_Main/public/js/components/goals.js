const GoalsView = {
  name: 'GoalsView',
  props: ['user'],
  template: `
  <div>

    <!-- Header -->
    <div class="ft-card mb-6" style="background:linear-gradient(135deg,var(--color-bg-surface),var(--color-bg-card));border-color:rgba(0,229,160,0.2);position:relative;overflow:hidden;">
      <svg style="position:absolute;right:0;top:0;opacity:.06;" width="220" height="120" viewBox="0 0 220 120">
        <circle cx="180" cy="20" r="80" fill="var(--color-accent-green)"/>
        <circle cx="60"  cy="100" r="60" fill="var(--color-accent-blue)"/>
      </svg>
      <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-family:system-ui,sans-serif;font-size:22px;font-weight:800;color:var(--color-text-heading);margin-bottom:4px;">
            Goals
          </div>
          <div style="color:var(--color-text-body);font-size:14px;">
            {{ activeCount }} active goal{{ activeCount !== 1 ? 's' : '' }}
          </div>
        </div>
        <button class="btn-primary" @click="showForm=!showForm">
          <i :class="showForm ? 'fas fa-times' : 'fas fa-plus'"></i>
          {{ showForm ? 'Cancel' : 'New Goal' }}
        </button>
      </div>
    </div>

    <!-- Add Goal Form -->
    <div v-if="showForm" class="ft-card mb-6">
      <div class="card-title">New Goal</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="field" style="grid-column:1/-1;">
          <label class="label">Goal Title *</label>
          <input class="input" v-model="form.title" placeholder="e.g. Reach 75kg, Run a 5K..."/>
        </div>
        <div class="field">
          <label class="label">Goal Type *</label>
          <select class="input" v-model="form.type">
            <option value="weight">Weight Target</option>
            <option value="fitness">Fitness / Custom</option>
          </select>
        </div>
        <div class="field">
          <label class="label">Target Date</label>
          <input class="input" type="date" v-model="form.target_date"/>
        </div>
        <div v-if="form.type==='weight'" class="field" style="grid-column:1/-1;">
          <label class="label">Target Weight (kg) *</label>
          <input class="input" type="number" step="0.1" min="1" v-model="form.target_weight_kg" placeholder="e.g. 75"/>
        </div>
        <div v-if="form.type==='fitness'" class="field" style="grid-column:1/-1;">
          <label class="label">Description</label>
          <input class="input" v-model="form.description" placeholder="Describe your goal in more detail..."/>
        </div>
        <div class="field" style="grid-column:1/-1;">
          <label class="label">Notes</label>
          <input class="input" v-model="form.notes" placeholder="Any extra notes..."/>
        </div>
      </div>
      <div style="margin-top:16px;">
        <button class="btn-primary" @click="addGoal" :disabled="saving">
          <span v-if="!saving"><i class="fas fa-bullseye"></i> Set Goal</span>
          <span v-else><i class="fas fa-spinner fa-spin"></i></span>
        </button>
      </div>
    </div>

    <!-- Status Filters -->
    <div class="ft-card mb-6" style="padding:14px 20px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button v-for="f in filters" :key="f.value"
          :class="['btn-secondary', activeFilter===f.value ? 'active' : '']"
          style="padding:6px 14px;font-size:13px;"
          @click="activeFilter=f.value">
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ft-card" style="text-align:center;padding:60px;">
      <i class="fas fa-spinner fa-spin" style="font-size:28px;color:var(--color-text-subheading);"></i>
    </div>

    <!-- Empty State -->
    <div v-else-if="filtered.length === 0" class="ft-card">
      <div class="empty-state">
        <i class="fas fa-bullseye"></i>
        <p>{{ activeFilter === 'completed' ? 'No completed goals yet.' : activeFilter === 'abandoned' ? 'No abandoned goals.' : 'No active goals. Set one above!' }}</p>
      </div>
    </div>

    <!-- Goals grid -->
    <div v-else class="grid-2">
      <div v-for="goal in filtered" :key="goal.id" class="ft-card" style="position:relative;overflow:hidden;">

        <!-- Colour accent strip on left edge -->
        <div style="position:absolute;top:0;left:0;width:4px;height:100%;border-radius:12px 0 0 12px;"
          :style="goal.type==='weight' ? 'background:var(--color-accent-green);' : 'background:var(--color-accent-blue);'">
        </div>

        <div style="padding-left:12px;">

          <!-- Top row: icon + title + status badge -->
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;"
                :style="goal.type==='weight' ? 'background:var(--color-accent-green-tint);' : 'background:rgba(0,140,255,.1);'">
                {{ goal.type === 'weight' ? '⚖️' : '🏃' }}
              </div>
              <div>
                <div style="font-weight:700;font-size:15px;color:var(--color-text-heading);line-height:1.3;">{{ goal.title }}</div>
                <div style="font-size:12px;color:var(--color-text-subheading);margin-top:2px;">
                  {{ goal.type === 'weight' ? 'Weight Goal' : 'Fitness Goal' }}
                </div>
              </div>
            </div>
            <span class="tag-pill"
              :class="goal.status==='completed' ? 'green' : goal.status==='abandoned' ? 'gray' : 'yellow'"
              style="flex-shrink:0;text-transform:capitalize;">
              {{ goal.status }}
            </span>
          </div>

          <!-- Weight progress bar -->
          <div v-if="goal.type==='weight' && goal.target_weight_kg && goal.current_weight_kg" style="margin-bottom:14px;">
            <div class="progress-wrap">
              <div class="progress-header">
                <span class="progress-label">Current: <b style="color:var(--color-text-heading);">{{ goal.current_weight_kg }}kg</b></span>
                <span class="progress-values">Target: {{ goal.target_weight_kg }}kg</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill protein" :style="{width: weightProgress(goal) + '%'}"></div>
              </div>
              <div style="font-size:11px;color:var(--color-text-subheading);margin-top:4px;text-align:right;">
                {{ weightProgressLabel(goal) }}
              </div>
            </div>
          </div>

          <!-- Description -->
          <div v-if="goal.description" style="font-size:13px;color:var(--color-text-body);margin-bottom:10px;line-height:1.5;">
            {{ goal.description }}
          </div>

          <!-- Notes -->
          <div v-if="goal.notes" style="font-size:12px;color:var(--color-text-subheading);font-style:italic;margin-bottom:10px;">
            "{{ goal.notes }}"
          </div>

          <!-- Target date + days left -->
          <div v-if="goal.target_date" style="font-size:12px;color:var(--color-text-subheading);margin-bottom:14px;">
            <i class="fas fa-calendar-alt" style="margin-right:4px;"></i>
            Target: {{ formatDate(goal.target_date) }}
            <span v-if="daysLeft(goal) !== null && goal.status==='active'"
              :style="daysLeft(goal) < 0 ? 'color:var(--color-accent-red);font-weight:600;' : ''">
              &middot; {{ daysLeft(goal) < 0 ? Math.abs(daysLeft(goal)) + ' days overdue' : daysLeft(goal) + ' days left' }}
            </span>
          </div>

          <!-- Actions for active goals -->
          <div v-if="goal.status==='active'" style="display:flex;gap:8px;padding-top:4px;border-top:1px solid var(--color-border-subtle);">
            <button class="btn-primary" style="flex:1;padding:7px;font-size:13px;" @click="markGoal(goal.id,'completed')">
              <i class="fas fa-check"></i> Complete
            </button>
            <button class="btn-secondary" style="padding:7px 12px;font-size:13px;" @click="markGoal(goal.id,'abandoned')" title="Abandon goal">
              <i class="fas fa-ban"></i>
            </button>
            <button class="btn-danger" style="padding:7px 12px;" @click="deleteGoal(goal.id)" title="Delete goal">
              <i class="fas fa-trash"></i>
            </button>
          </div>

          <!-- Delete only for non-active -->
          <div v-else style="padding-top:4px;border-top:1px solid var(--color-border-subtle);display:flex;justify-content:flex-end;">
            <button class="btn-danger" @click="deleteGoal(goal.id)">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>

        </div>
      </div>
    </div>

  </div>
  `,
  setup(props) {
    const goals    = ref([]);
    const loading  = ref(true);
    const saving   = ref(false);
    const showForm = ref(false);
    const activeFilter = ref('active');

    const form = ref({ title: '', type: 'weight', target_weight_kg: '', target_date: '', description: '', notes: '' });

    const filters = [
      { label: 'Active',    value: 'active'    },
      { label: 'Completed', value: 'completed' },
      { label: 'Abandoned', value: 'abandoned' },
      { label: 'All',       value: 'all'       },
    ];

    const filtered = computed(() => {
      if (activeFilter.value === 'all') return goals.value;
      return goals.value.filter(g => g.status === activeFilter.value);
    });

    const activeCount = computed(() => goals.value.filter(g => g.status === 'active').length);

    function formatDate(str) {
      if (!str) return '';
      return new Date(str + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function daysLeft(goal) {
      if (!goal.target_date) return null;
      const today = new Date().toISOString().split('T')[0];
      return Math.round((new Date(goal.target_date) - new Date(today)) / 86400000);
    }

    function weightProgress(goal) {
      if (!goal.current_weight_kg || !goal.target_weight_kg) return 0;
      const start = goal.target_weight_kg > goal.current_weight_kg
        ? goal.target_weight_kg * 0.95
        : goal.target_weight_kg * 1.05;
      const total = Math.abs(goal.target_weight_kg - start);
      const done  = Math.abs(goal.current_weight_kg - start);
      if (total === 0) return 100;
      return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
    }

    function weightProgressLabel(goal) {
      const diff = Math.abs(goal.current_weight_kg - goal.target_weight_kg).toFixed(1);
      if (Number(diff) === 0) return 'Goal reached!';
      const dir = goal.current_weight_kg > goal.target_weight_kg ? 'to lose' : 'to gain';
      return `${diff} kg ${dir}`;
    }

    async function load() {
      loading.value = true;
      try {
        goals.value = await API.getGoals();
      } catch(e) {
        showToast('Failed to load goals', 'error');
      } finally {
        loading.value = false;
      }
    }

    async function addGoal() {
      if (!form.value.title.trim()) return showToast('Please enter a goal title', 'error');
      if (form.value.type === 'weight' && !form.value.target_weight_kg)
        return showToast('Please enter a target weight', 'error');
      saving.value = true;
      try {
        const payload = {
          type:        form.value.type,
          title:       form.value.title.trim(),
          target_date: form.value.target_date || null,
          notes:       form.value.notes.trim(),
          ...(form.value.type === 'weight'
            ? { target_weight_kg: parseFloat(form.value.target_weight_kg) }
            : { description: form.value.description.trim() || null })
        };
        const created = await API.createGoal(payload);
        goals.value.unshift(created);
        form.value = { title: '', type: 'weight', target_weight_kg: '', target_date: '', description: '', notes: '' };
        showForm.value = false;
        showToast('Goal set! 🎯');
      } catch(e) {
        showToast(e.error || 'Failed to create goal', 'error');
      } finally {
        saving.value = false;
      }
    }

    async function markGoal(id, status) {
      try {
        const updated = await API.updateGoal(id, { status });
        const idx = goals.value.findIndex(g => g.id === id);
        if (idx !== -1) goals.value[idx] = updated;
        showToast(status === 'completed' ? 'Goal completed! 🏆' : 'Goal abandoned');
      } catch(e) {
        showToast('Failed to update goal', 'error');
      }
    }

    async function deleteGoal(id) {
      try {
        await API.deleteGoal(id);
        goals.value = goals.value.filter(g => g.id !== id);
        showToast('Goal deleted');
      } catch(e) {
        showToast('Failed to delete goal', 'error');
      }
    }

    onMounted(load);

    return {
      goals, loading, saving, showForm, form,
      filters, activeFilter, filtered, activeCount,
      formatDate, daysLeft, weightProgress, weightProgressLabel,
      addGoal, markGoal, deleteGoal
    };
  }
};
