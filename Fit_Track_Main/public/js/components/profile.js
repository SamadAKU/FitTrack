const ProfileView = {
  props: ['user'], emits: ['updated'],
  template: `
  <div style="max-width:640px;">
    <div class="ft-card mb-6">
      <div style="display:flex;align-items:center;gap:20px;margin-bottom:24px;">
        <div style="width:64px;height:64px;border-radius:50%;background:var(--color-accent-green-tint);border:2px solid var(--color-accent-green-muted);color:var(--color-accent-green);font-family:system-ui,sans-serif;font-weight:800;font-size:24px;display:flex;align-items:center;justify-content:center;">{{ initials }}</div>
        <div>
          <div style="font-family:system-ui,sans-serif;font-size:20px;font-weight:800;color:var(--color-text-heading);">{{ form.display_name || user.username }}</div>
          <div style="color:var(--color-text-subheading);font-size:13px;">{{ user.email }}</div>
          <span class="tag-pill green" style="margin-top:6px;"><i class="fas fa-check-circle"></i> Member</span>
        </div>
      </div>
      <div class="card-title">Profile Settings</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="field"><label class="label">Display Name</label><input class="input" v-model="form.display_name"/></div>
        <div class="field"><label class="label">Height (cm)</label><input class="input" type="number" v-model.number="form.height_cm"/></div>
      </div>
      <div class="card-title" style="margin-top:16px;">Daily Goals</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div class="field"><label class="label">Calorie Goal (kcal)</label><input class="input" type="number" v-model.number="form.goal_calories"/></div>
        <div class="field"><label class="label">Water Goal (ml)</label><input class="input" type="number" v-model.number="form.goal_water_ml"/></div>
        <div class="field"><label class="label">Protein Goal (g)</label><input class="input" type="number" v-model.number="form.goal_protein"/></div>
        <div class="field"><label class="label">Carbs Goal (g)</label><input class="input" type="number" v-model.number="form.goal_carbs"/></div>
        <div class="field"><label class="label">Fat Goal (g)</label><input class="input" type="number" v-model.number="form.goal_fat"/></div>
      </div>
      <div style="display:flex;gap:12px;margin-top:20px;">
        <button class="btn-primary" @click="save" :disabled="saving"><span v-if="!saving"><i class="fas fa-save"></i> Save Changes</span><span v-else><i class="fas fa-spinner fa-spin"></i></span></button>
        <button class="btn-secondary" @click="reset">Reset</button>
      </div>
    </div>
    <div class="ft-card">
      <div class="card-title">Macro Targets</div>
      <svg width="200" height="200" viewBox="0 0 200 200" style="display:block;margin:0 auto 20px;" aria-label="Macro goal donut" role="img">
        <circle cx="100" cy="100" r="75" fill="none" stroke="var(--color-bg-input)" stroke-width="22"/>
        <circle v-for="(seg,i) in goalArcs" :key="i" cx="100" cy="100" r="75" fill="none" :stroke="seg.color" stroke-width="22"
          :stroke-dasharray="seg.dash" :stroke-dashoffset="seg.offset"
          style="transform-origin:center;transform:rotate(-90deg);transition:all .5s ease;"/>
        <text x="100" y="95"  text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="var(--color-text-heading)">{{ form.goal_calories }}</text>
        <text x="100" y="113" text-anchor="middle" font-size="11" fill="var(--color-text-subheading)">kcal/day</text>
      </svg>
      <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;">
        <div style="text-align:center"><div style="font-family:system-ui,sans-serif;font-size:20px;font-weight:800;color:var(--color-accent-blue);">{{ form.goal_protein }}g</div><div style="font-size:12px;color:var(--color-text-subheading)">Protein</div></div>
        <div style="text-align:center"><div style="font-family:system-ui,sans-serif;font-size:20px;font-weight:800;color:var(--color-accent-yellow);">{{ form.goal_carbs }}g</div><div style="font-size:12px;color:var(--color-text-subheading)">Carbs</div></div>
        <div style="text-align:center"><div style="font-family:system-ui,sans-serif;font-size:20px;font-weight:800;color:var(--color-accent-red);">{{ form.goal_fat }}g</div><div style="font-size:12px;color:var(--color-text-subheading)">Fat</div></div>
      </div>
    </div>
  </div>
  `,
  setup(props, { emit }) {
    const { ref, computed } = Vue;

    const saving = ref(false);
    const form = ref({ ...props.user });

    const initials = computed(() => {
      const name = form.value.display_name || props.user.username || '';
      return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    });

    const goalArcs = computed(() => {
      const protein = (form.value.goal_protein || 0) * 4;
      const carbs   = (form.value.goal_carbs   || 0) * 4;
      const fat     = (form.value.goal_fat     || 0) * 9;
      const total   = protein + carbs + fat;

      if (!total) return [];

      const circ = 2 * Math.PI * 75;
      const segs = [
        { val: protein, color: 'var(--color-accent-blue)'   },
        { val: carbs,   color: 'var(--color-accent-yellow)' },
        { val: fat,     color: 'var(--color-accent-red)'    }
      ];

      let offset = 0;
      return segs.map(s => {
        const len = (s.val / total) * circ;
        const seg = { dash: `${len} ${circ - len}`, offset: -offset, color: s.color };
        offset += len;
        return seg;
      });
    });

    function validateGoals() {
      const f = form.value;
      if (f.goal_calories && (f.goal_calories < 500   || f.goal_calories > 15000)) { showToast('Calorie goal must be 500–15,000 kcal', 'error'); return false; }
      if (f.goal_protein  && (f.goal_protein  < 0     || f.goal_protein  > 500))   { showToast('Protein goal must be 0–500g',           'error'); return false; }
      if (f.goal_carbs    && (f.goal_carbs    < 0     || f.goal_carbs    > 1000))  { showToast('Carbs goal must be 0–1000g',            'error'); return false; }
      if (f.goal_fat      && (f.goal_fat      < 0     || f.goal_fat      > 500))   { showToast('Fat goal must be 0–500g',               'error'); return false; }
      if (f.goal_water_ml && (f.goal_water_ml < 250   || f.goal_water_ml > 10000)) { showToast('Water goal must be 250–10,000ml',       'error'); return false; }
      if (f.height_cm     && (f.height_cm     < 50    || f.height_cm     > 280))   { showToast('Height must be 50–280cm',               'error'); return false; }
      return true;
    }

    async function save() {
      if (!validateGoals()) return;
      saving.value = true;
      try {
        await API.updateProfile(form.value);
        emit('updated');
        showToast('Profile updated!');
      } catch {
        showToast('Error saving', 'error');
      } finally {
        saving.value = false;
      }
    }

    function reset() {
      form.value = { ...props.user };
    }

    return { form, saving, initials, goalArcs, save, reset };
  }
};