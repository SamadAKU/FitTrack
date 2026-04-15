
const WorkoutView = {
  props: ['user'],
  template: `
  <div>
    <div v-if="workoutMode" class="workout-mode-overlay">
      <div class="workout-mode-card">
        <div class="workout-progress-bar"><div class="workout-progress-fill" :style="{width:overallProgress+'%'}"></div></div>
        <div style="font-size:12px;color:var(--color-text-subheading);margin-bottom:16px;text-align:right;">{{ currentSetGlobal }} / {{ totalSets }} sets</div>
        <div class="timer-phase">{{ isResting ? '💤 REST' : '🔥 ACTIVE SET' }}</div>
        <div class="workout-exercise-name">{{ currentExercise.name }}</div>
        <div class="workout-set-info">Set {{ currentSetNum }} of {{ currentExercise.sets }} · {{ currentExercise.reps }} reps @ {{ currentExercise.weight_kg||'—' }}kg</div>
        <div :class="['timer-display', isResting?'rest':'']">{{ timerDisplay }}</div>
        <div v-if="isResting && !feelSubmitted">
          <div style="font-size:13px;color:var(--color-text-body);margin-bottom:8px;">How did that set feel?</div>
          <div class="feel-rating">
            <button v-for="r in 5" :key="r" :class="['feel-btn',selectedFeel===r?'selected':'']" @click="selectedFeel=r">{{ feelEmojis[r-1] }}</button>
          </div>
          <button class="btn-primary" style="margin-top:8px;" @click="submitFeel">Confirm</button>
        </div>
        <div v-if="!workoutDone" style="display:flex;gap:12px;justify-content:center;margin-top:24px;flex-wrap:wrap;">
          <button class="btn-secondary" @click="skipTimer"><i class="fas fa-forward"></i> Skip</button>
          <button v-if="!isResting" class="btn-primary" @click="completeSet"><i class="fas fa-check"></i> Done</button>
          <button class="btn-danger" @click="endWorkout"><i class="fas fa-stop"></i> End</button>
        </div>
        <div v-if="workoutDone" style="text-align:center;margin-top:24px;padding-top:20px;border-top:1px solid var(--color-border-subtle);">
          <div style="font-size:48px;margin-bottom:12px;">🎉</div>
          <div style="font-family:system-ui,sans-serif;font-size:22px;font-weight:800;color:var(--color-accent-green);margin-bottom:4px;">Workout Complete!</div>
          <div style="color:var(--color-text-subheading);font-size:14px;margin-bottom:20px;">{{ activePlan ? activePlan.name : '' }}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
            <div style="background:var(--color-bg-input);border-radius:10px;padding:14px;text-align:center;">
              <div style="font-size:24px;font-weight:800;color:var(--color-text-heading);">{{ recordedSets.length }}</div>
              <div style="font-size:11px;color:var(--color-text-subheading);text-transform:uppercase;letter-spacing:.08em;margin-top:3px;">Sets Done</div>
            </div>
            <div style="background:var(--color-bg-input);border-radius:10px;padding:14px;text-align:center;">
              <div style="font-size:24px;font-weight:800;color:var(--color-text-heading);">{{ formatDuration(elapsedSeconds) }}</div>
              <div style="font-size:11px;color:var(--color-text-subheading);text-transform:uppercase;letter-spacing:.08em;margin-top:3px;">Duration</div>
            </div>
          </div>
          <button class="btn-primary" style="width:100%;justify-content:center;font-size:16px;padding:14px 20px;" @click="closeWorkout"><i class="fas fa-check-circle"></i> DONE</button>
        </div>
      </div>
    </div>

    <div class="grid-2 mb-6">
      <div>
        <div class="section-header">
          <div class="section-title">My Workout Plans</div>
          <button class="btn-primary" style="font-size:13px;padding:8px 14px;" @click="showCreatePlan=!showCreatePlan"><i class="fas fa-plus"></i> New Plan</button>
        </div>
        <div v-if="showCreatePlan" class="ft-card mb-4">
          <div class="card-title">Create Plan</div>
          <div class="field"><label class="label">Plan Name</label><input class="input" v-model="newPlan.name" placeholder="e.g. Push Day A"/></div>
          <div class="field"><label class="label">Description</label><input class="input" v-model="newPlan.description" placeholder="Optional"/></div>
          <div style="margin:12px 0;">
            <div class="card-title">Exercises</div>
            <div v-for="(ex,i) in newPlan.exercises" :key="i" style="background:var(--color-bg-input);border-radius:8px;padding:12px;margin-bottom:8px;">
              <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr auto;gap:8px;align-items:end;">
                <div class="field" style="margin:0"><label class="label" style="font-size:10px;">Exercise</label><input class="input" style="padding:6px 8px;" v-model="ex.name" placeholder="Bench Press"/></div>
                <div class="field" style="margin:0"><label class="label" style="font-size:10px;">Sets</label><input class="input" style="padding:6px 8px;" type="number" v-model.number="ex.sets"/></div>
                <div class="field" style="margin:0"><label class="label" style="font-size:10px;">Reps</label><input class="input" style="padding:6px 8px;" type="number" v-model.number="ex.reps"/></div>
                <div class="field" style="margin:0"><label class="label" style="font-size:10px;">Rest(s)</label><input class="input" style="padding:6px 8px;" type="number" v-model.number="ex.rest_seconds"/></div>
                <div class="field" style="margin:0"><label class="label" style="font-size:10px;">Kg</label><input class="input" style="padding:6px 8px;" type="number" v-model.number="ex.weight_kg"/></div>
                <button @click="newPlan.exercises.splice(i,1)" class="btn-danger" style="align-self:flex-end;"><i class="fas fa-times"></i></button>
              </div>
            </div>
            <button class="btn-secondary" style="width:100%;margin-top:4px;font-size:12px;" @click="addExRow"><i class="fas fa-plus"></i> Add Exercise</button>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn-primary" @click="createPlan" :disabled="!newPlan.name">Save Plan</button>
            <button class="btn-secondary" @click="showCreatePlan=false">Cancel</button>
          </div>
        </div>
        <div v-if="plans.length" style="display:flex;flex-direction:column;gap:12px;">
          <div v-for="plan in plans" :key="plan.id" class="plan-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div><div class="plan-name">{{ plan.name }}</div><div class="plan-desc">{{ plan.description||'No description' }}</div></div>
              <div style="display:flex;gap:8px;">
                <button class="btn-primary" style="font-size:12px;padding:7px 12px;" @click="startWorkout(plan)"><i class="fas fa-play"></i> Start</button>
                <button class="btn-danger" @click="deletePlan(plan.id)"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <div class="exercise-list" style="margin-top:12px;">
              <div v-for="ex in plan.exercises" :key="ex.id" class="exercise-item">
                <span class="ex-name">{{ ex.name }}</span>
                <span class="ex-detail">{{ ex.sets }}×{{ ex.reps }} @ {{ ex.weight_kg||'—' }}kg · {{ ex.rest_seconds }}s</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state"><i class="fas fa-dumbbell"></i><p>No plans yet. Create one!</p></div>
      </div>
      <div>
        <div class="section-title">Recent Sessions</div>
        <div v-if="sessions.length">
          <div v-for="s in sessions" :key="s.id">
            <div class="session-item" style="cursor:pointer;" @click="toggleSession(s.id)">
              <div class="session-icon"><i class="fas fa-dumbbell"></i></div>
              <div style="flex:1">
                <div class="session-name">{{ s.plan_name }}</div>
                <div class="session-meta">{{ fmtDT(s.completed_at) }}
                  <span v-if="s.sets && s.sets.length" style="margin-left:8px;color:var(--color-text-subheading);">· {{ s.sets.length }} sets</span>
                </div>
              </div>
              <div class="session-duration">{{ formatDuration(s.duration_seconds) }}</div>
              <i :class="expandedSession===s.id ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
                 style="color:var(--color-text-subheading);margin-left:10px;font-size:12px;"></i>
            </div>
            <div v-if="expandedSession===s.id && s.sets && s.sets.length"
              style="background:var(--color-bg-input);border:1px solid var(--color-border-subtle);border-top:none;border-radius:0 0 8px 8px;padding:12px 16px;margin-bottom:8px;">
              <table style="width:100%;font-size:13px;border-collapse:collapse;">
                <thead>
                  <tr style="color:var(--color-text-subheading);font-size:11px;text-transform:uppercase;letter-spacing:.06em;">
                    <th style="text-align:left;padding-bottom:8px;">Exercise</th>
                    <th style="text-align:center;padding-bottom:8px;">Set</th>
                    <th style="text-align:center;padding-bottom:8px;">Reps</th>
                    <th style="text-align:center;padding-bottom:8px;">Weight</th>
                    <th style="text-align:center;padding-bottom:8px;">Feel</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="set in s.sets" :key="set.id" style="border-top:1px solid var(--color-border-subtle);">
                    <td style="padding:6px 0;color:var(--color-text-heading);font-weight:500;">{{ set.exercise_name }}</td>
                    <td style="text-align:center;color:var(--color-text-body);">{{ set.set_number }}</td>
                    <td style="text-align:center;color:var(--color-text-body);">{{ set.reps_completed ?? '—' }}</td>
                    <td style="text-align:center;color:var(--color-text-body);">{{ set.weight_kg ? set.weight_kg+'kg' : 'BW' }}</td>
                    <td style="text-align:center;font-size:18px;">{{ feelEmojis[set.feel_rating - 1] || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else-if="expandedSession===s.id"
              style="background:var(--color-bg-input);border:1px solid var(--color-border-subtle);border-top:none;border-radius:0 0 8px 8px;padding:10px 16px;margin-bottom:8px;color:var(--color-text-subheading);font-size:13px;font-style:italic;">
              No set data recorded for this session.
            </div>
            <div v-else style="margin-bottom:8px;"></div>
          </div>
        </div>
        <div v-else class="empty-state"><i class="fas fa-history"></i><p>No sessions recorded yet.</p></div>
      </div>
    </div>
  </div>
  `,
  setup(props) {
    const { ref, computed, onMounted, onUnmounted } = Vue;

    // State
    const plans = ref([]);
    const sessions = ref([]);
    const showCreatePlan = ref(false);
    const newPlan = ref({
      name: '',
      description: '',
      exercises: [{ name: '', sets: 3, reps: 10, rest_seconds: 60, weight_kg: null }]
    });

    // Workout mode state
    const workoutMode = ref(false);
    const activePlan = ref(null);
    const currentExIdx = ref(0);
    const currentSetNum = ref(1);
    const isResting = ref(false);
    const timerVal = ref(45);
    const elapsedSeconds = ref(0);
    const workoutDone = ref(false);
    const selectedFeel = ref(null);
    const feelSubmitted = ref(false);
    const recordedSets = ref([]);
    const expandedSession = ref(null);

    const feelEmojis = ['😫', '😓', '😐', '😊', '💪'];
    let timer = null, elapsedTimer = null;

    // Computed
    const currentExercise = computed(() => activePlan.value?.exercises[currentExIdx.value] || {});
    const totalSets = computed(() => activePlan.value?.exercises.reduce((s, e) => s + e.sets, 0) || 0);
    const currentSetGlobal = computed(() => {
      let count = 0;
      for (let i = 0; i < currentExIdx.value; i++) count += activePlan.value?.exercises[i]?.sets || 0;
      return count + currentSetNum.value;
    });
    const overallProgress = computed(() => totalSets.value ? Math.round((currentSetGlobal.value / totalSets.value) * 100) : 0);
    const timerDisplay = computed(() => formatDuration(timerVal.value));

    // Shared save helper
    async function persistSession() {
      const saved = await API.saveSession({
        plan_id: activePlan.value.id,
        plan_name: activePlan.value.name,
        duration_seconds: elapsedSeconds.value,
        sets: recordedSets.value
      });
      sessions.value.unshift({
        id: saved.sessionId,
        plan_id: activePlan.value.id,
        plan_name: activePlan.value.name,
        duration_seconds: elapsedSeconds.value,
        completed_at: new Date().toISOString(),
        sets: recordedSets.value.map((s, i) => ({
          id: 'local-' + i,
          session_id: saved.sessionId,
          exercise_name: s.exercise_name,
          set_number: s.set_number,
          reps_completed: s.reps_completed,
          weight_kg: s.weight_kg,
          feel_rating: s.feel_rating
        }))
      });
    }

    // Timer
    function startTimer() {
      clearInterval(timer);
      timerVal.value = isResting.value ? (currentExercise.value.rest_seconds || 60) : 45;
      timer = setInterval(() => {
        timerVal.value--;
        if (timerVal.value <= 0) {
          clearInterval(timer);
          if (isResting.value) advanceSet();
        }
      }, 1000);
    }

    function advanceSet() {
      isResting.value = false;
      feelSubmitted.value = false;
      selectedFeel.value = null;
      if (currentSetNum.value < currentExercise.value.sets) {
        currentSetNum.value++;
        startTimer();
      } else if (currentExIdx.value < activePlan.value.exercises.length - 1) {
        currentExIdx.value++;
        currentSetNum.value = 1;
        startTimer();
      } else {
        clearInterval(timer);
        clearInterval(elapsedTimer);
        workoutDone.value = true;
        persistSession()
          .then(() => showToast('Workout saved! 💪'))
          .catch(() => showToast('Error saving session', 'error'));
      }
    }

    // Workout controls
    function startWorkout(plan) {
      activePlan.value = plan;
      currentExIdx.value = 0;
      currentSetNum.value = 1;
      isResting.value = false;
      workoutDone.value = false;
      elapsedSeconds.value = 0;
      recordedSets.value = [];
      timerVal.value = 45;
      workoutMode.value = true;
      startTimer();
      elapsedTimer = setInterval(() => elapsedSeconds.value++, 1000);
    }

    function completeSet() {
      clearInterval(timer);
      recordedSets.value.push({
        exercise_name: currentExercise.value.name,
        set_number: currentSetNum.value,
        reps_completed: currentExercise.value.reps,
        weight_kg: currentExercise.value.weight_kg,
        feel_rating: null
      });
      isResting.value = true;
      feelSubmitted.value = false;
      selectedFeel.value = null;
      startTimer();
    }

    function submitFeel() {
      if (recordedSets.value.length) recordedSets.value[recordedSets.value.length - 1].feel_rating = selectedFeel.value;
      feelSubmitted.value = true;
    }

    function skipTimer() {
      clearInterval(timer);
      isResting.value ? advanceSet() : completeSet();
    }

    async function endWorkout() {
      clearInterval(timer);
      clearInterval(elapsedTimer);
      workoutMode.value = false;
      workoutDone.value = false;
      if (!activePlan.value) return;
      try {
        await persistSession();
        showToast('Workout saved! 💪');
      } catch {
        showToast('Error saving session', 'error');
      }
    }

    function closeWorkout() {
      workoutMode.value = false;
      workoutDone.value = false;
    }

    // Plan management
    function addExRow() {
      newPlan.value.exercises.push({ name: '', sets: 3, reps: 10, rest_seconds: 60, weight_kg: null });
    }

    async function createPlan() {
      try {
        const p = await API.createPlan(newPlan.value);
        plans.value.unshift(p);
        showCreatePlan.value = false;
        newPlan.value = { name: '', description: '', exercises: [{ name: '', sets: 3, reps: 10, rest_seconds: 60, weight_kg: null }] };
        showToast('Plan created!');
      } catch {
        showToast('Error', 'error');
      }
    }

    async function deletePlan(id) {
      await API.deletePlan(id);
      plans.value = plans.value.filter(p => p.id !== id);
      showToast('Plan deleted');
    }

    function toggleSession(id) {
      expandedSession.value = expandedSession.value === id ? null : id;
    }

    function fmtDT(dt) {
      return new Date(dt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    onMounted(async () => {
      plans.value = await API.getPlans();
      sessions.value = await API.getSessions();
    });

    onUnmounted(() => {
      clearInterval(timer);
      clearInterval(elapsedTimer);
    });

    return {
      plans, sessions, showCreatePlan, newPlan,
      workoutMode, activePlan, currentExercise, currentSetNum, isResting,
      timerDisplay, timerVal, elapsedSeconds, workoutDone,
      selectedFeel, feelSubmitted, feelEmojis, recordedSets,
      totalSets, currentSetGlobal, overallProgress, expandedSession,
      startWorkout, completeSet, submitFeel, skipTimer,
      endWorkout, closeWorkout, addExRow, createPlan, deletePlan,
      formatDuration, fmtDT, toggleSession
    };
  }
};