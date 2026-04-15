const NutritionView = {
  props: ['user'],
  template: `
  <div>
    <!-- Food name datalist for autofill -->
    <datalist id="food-suggestions">
      <option v-for="f in foodSuggestions" :key="f.name" :value="f.name">{{ f.cal }} kcal</option>
    </datalist>

    <div class="date-nav">
      <button @click="changeDate(-1)"><i class="fas fa-chevron-left"></i></button>
      <div class="current-date">{{ formatDate(selectedDate) }}</div>
      <button @click="changeDate(1)" :disabled="selectedDate===today"><i class="fas fa-chevron-right"></i></button>
      <input type="date" class="input" style="max-width:160px;padding:6px 10px;" v-model="selectedDate" :max="today" @change="loadAll"/>
    </div>

    <div class="grid-2 mb-6">
      <!-- Macro Summary + SVG pie -->
      <div class="ft-card">
        <div class="card-title">Today's Nutrition</div>
        <div class="progress-wrap">
          <div class="progress-header"><span class="progress-label"><i class="fas fa-fire" style="color:var(--color-accent-orange)"></i> Calories</span><span class="progress-values">{{ Math.round(totals.calories) }} / {{ user.goal_calories }}</span></div>
          <div class="progress-bar-bg"><div :class="['progress-bar-fill', 'calories', totals.calories >= user.goal_calories ? 'goal-hit' : '']" :style="{width:pct(totals.calories,user.goal_calories)+'%'}" :key="calKey"></div></div>
        </div>
        <div class="progress-wrap">
          <div class="progress-header"><span class="progress-label">Protein</span><span class="progress-values">{{ Math.round(totals.protein) }}g / {{ user.goal_protein }}g</span></div>
          <div class="progress-bar-bg"><div :class="['progress-bar-fill','protein', totals.protein >= user.goal_protein ? 'goal-hit' : '']" :style="{width:pct(totals.protein,user.goal_protein)+'%'}" :key="'p'+calKey"></div></div>
        </div>
        <div class="progress-wrap">
          <div class="progress-header"><span class="progress-label">Carbs</span><span class="progress-values">{{ Math.round(totals.carbs) }}g / {{ user.goal_carbs }}g</span></div>
          <div class="progress-bar-bg"><div :class="['progress-bar-fill','carbs', totals.carbs >= user.goal_carbs ? 'goal-hit' : '']" :style="{width:pct(totals.carbs,user.goal_carbs)+'%'}" :key="'c'+calKey"></div></div>
        </div>
        <div class="progress-wrap">
          <div class="progress-header"><span class="progress-label">Fat</span><span class="progress-values">{{ Math.round(totals.fat) }}g / {{ user.goal_fat }}g</span></div>
          <div class="progress-bar-bg"><div :class="['progress-bar-fill','fat', totals.fat >= user.goal_fat ? 'goal-hit' : '']" :style="{width:pct(totals.fat,user.goal_fat)+'%'}" :key="'f'+calKey"></div></div>
        </div>

        <!-- Macro SVG pie using arc paths (no CSS transform conflicts) -->
        <div style="margin-top:16px;">
          <svg width="180" height="210" viewBox="0 0 180 210" style="display:block;margin:0 auto;" aria-label="Macro pie chart" role="img">
            <circle cx="90" cy="90" r="60" fill="none" stroke="var(--color-bg-input)" stroke-width="22"/>
            <path v-for="(seg,i) in macroArcs" :key="i"
              :d="seg.d" fill="none" :stroke="seg.color" stroke-width="22" stroke-linecap="butt"
              style="transition:all .5s ease;"/>
            <text x="90" y="87" text-anchor="middle" dominant-baseline="central" font-family="system-ui,sans-serif" font-size="20" font-weight="800" fill="var(--color-text-heading)">{{ Math.round(totals.calories) }}</text>
            <text x="90" y="103" text-anchor="middle" dominant-baseline="central" font-size="11" fill="var(--color-text-subheading)">kcal</text>
            <circle cx="24"  cy="175" r="5" fill="var(--color-accent-blue)"/>
            <text   x="33"  y="175" dominant-baseline="central" font-family="system-ui,sans-serif" font-size="11" fill="var(--color-text-body)">Protein</text>
            <circle cx="86"  cy="175" r="5" fill="var(--color-accent-yellow)"/>
            <text   x="95"  y="175" dominant-baseline="central" font-family="system-ui,sans-serif" font-size="11" fill="var(--color-text-body)">Carbs</text>
            <circle cx="142" cy="175" r="5" fill="var(--color-accent-red)"/>
            <text   x="151" y="175" dominant-baseline="central" font-family="system-ui,sans-serif" font-size="11" fill="var(--color-text-body)">Fat</text>
          </svg>
        </div>
      </div>

      <!-- Log Food + Water -->
      <div class="ft-card">
        <div class="card-title">Log Food</div>
        <form @submit.prevent="addFood">
          <div class="field"><label class="label">Food Name</label>
            <input class="input" type="text" v-model="form.food_name" list="food-suggestions"
              placeholder="e.g. Chicken Breast" required @change="autofillMacros"/>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="field"><label class="label">Calories (max 5000)</label>
              <input class="input" type="number" step="1" v-model.number="form.calories" placeholder="kcal" required min="1" max="5000"/>
            </div>
            <div class="field"><label class="label">Protein g (max 500)</label>
              <input class="input" type="number" step="0.1" v-model.number="form.protein_g" placeholder="0" min="0" max="500"/>
            </div>
            <div class="field"><label class="label">Carbs g (max 500)</label>
              <input class="input" type="number" step="0.1" v-model.number="form.carbs_g" placeholder="0" min="0" max="500"/>
            </div>
            <div class="field"><label class="label">Fat g (max 300)</label>
              <input class="input" type="number" step="0.1" v-model.number="form.fat_g" placeholder="0" min="0" max="300"/>
            </div>
          </div>
          <div class="field"><label class="label">Meal</label>
            <div class="select is-fullwidth">
              <select v-model="form.meal_type">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
          </div>
          <div v-if="foodError" style="color:var(--color-accent-red);font-size:12px;margin-bottom:8px;">⚠ {{ foodError }}</div>
          <button class="btn-primary" style="width:100%" type="submit" :disabled="!form.food_name||!form.calories">
            <i class="fas fa-plus"></i> Add Entry
          </button>
        </form>

        <!-- Water Tracker -->
        <div class="water-section">
          <div class="card-title">Water Intake</div>
          <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px;">
            <span style="font-family:system-ui,sans-serif;font-size:28px;font-weight:800;color:#38BDF8;">{{ (waterTotal/1000).toFixed(2) }}L</span>
            <span style="color:var(--color-text-subheading);font-size:13px;">/ {{ (user.goal_water_ml/1000).toFixed(1) }}L goal</span>
            <span v-if="waterTotal >= user.goal_water_ml" style="font-size:18px;" title="Goal reached!">🎉</span>
          </div>
          <div class="progress-bar-bg mb-4">
            <div :class="['progress-bar-fill','water', waterTotal >= user.goal_water_ml ? 'goal-hit' : '']"
              :style="{width:pct(waterTotal,user.goal_water_ml)+'%'}" :key="'w'+waterKey"></div>
          </div>
          <div class="water-quick-btns">
            <button v-for="ml in [150,250,350,500]" :key="ml" class="water-qty-btn" type="button" @click="addWaterAmount(ml)">+{{ ml }}ml</button>
          </div>
          <div class="water-manual">
            <input class="input" type="number" v-model.number="manualWater" placeholder="Custom ml" min="1" max="2000" @keyup.enter="addWaterManual"/>
            <button class="btn-primary" type="button" @click="addWaterManual" :disabled="!manualWater||manualWater<1||manualWater>2000">Add</button>
          </div>
          <div v-if="waterLogs.length" style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;">
            <button v-for="log in waterLogs" :key="log.id" type="button"
              style="background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.25);color:#38BDF8;padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;transition:.2s ease;"
              @click="removeWater(log.id)" title="Click to remove">
              {{ log.amount_ml }}ml ✕
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Food Log Table -->
    <div class="ft-card">
      <div class="section-header">
        <div class="section-title">Food Entries</div>
        <div style="font-size:13px;color:var(--color-text-subheading);">{{ foodLogs.length }} items</div>
      </div>
      <div v-if="foodLogs.length" style="overflow-x:auto;">
        <table class="ft-table">
          <thead><tr><th>Food</th><th>Meal</th><th>Calories</th><th>Protein</th><th>Carbs</th><th>Fat</th><th></th></tr></thead>
          <tbody>
            <tr v-for="log in foodLogs" :key="log.id">
              <td><span class="food-name">{{ log.food_name }}</span></td>
              <td><span :class="'meal-badge '+log.meal_type">{{ log.meal_type }}</span></td>
              <td>{{ Math.round(log.calories) }} kcal</td>
              <td>{{ Math.round(log.protein_g) }}g</td>
              <td>{{ Math.round(log.carbs_g) }}g</td>
              <td>{{ Math.round(log.fat_g) }}g</td>
              <td><button class="btn-danger" type="button" @click="deleteFood(log.id)"><i class="fas fa-trash"></i></button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><i class="fas fa-utensils"></i><p>No food logged for this day.</p></div>
    </div>
  </div>
  `,
  setup(props) {
    const { ref, computed, onMounted } = Vue;

    const today = new Date().toISOString().split('T')[0];
    const selectedDate = ref(today);

    const foodLogs   = ref([]);
    const waterLogs  = ref([]);
    const waterTotal = ref(0);
    const manualWater = ref(null);
    const foodError  = ref('');
    const calKey     = ref(0); // bump to retrigger goal-hit animation
    const waterKey   = ref(0);
    const form = ref({
      food_name: '',
      calories: null,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      meal_type: 'breakfast'
    });

    // Common foods database for datalist autofill suggestions
    const COMMON_FOODS = [
      { name: 'Chicken Breast (100g)',        cal: 165, p: 31, c: 0,  f: 3.6 },
      { name: 'Brown Rice (1 cup cooked)',    cal: 216, p: 5,  c: 45, f: 1.8 },
      { name: 'Oatmeal (1 cup)',              cal: 307, p: 11, c: 55, f: 5.3 },
      { name: 'Eggs (2 large)',               cal: 143, p: 13, c: 1,  f: 10  },
      { name: 'Salmon (100g)',                cal: 208, p: 20, c: 0,  f: 13  },
      { name: 'Greek Yogurt (170g)',          cal: 100, p: 17, c: 6,  f: 0.7 },
      { name: 'Banana (1 medium)',            cal: 105, p: 1,  c: 27, f: 0.4 },
      { name: 'Protein Shake',               cal: 150, p: 25, c: 8,  f: 3   },
      { name: 'Avocado (1 medium)',           cal: 234, p: 3,  c: 12, f: 21  },
      { name: 'Broccoli (1 cup)',             cal: 55,  p: 4,  c: 11, f: 0.6 },
      { name: 'Sweet Potato (medium)',        cal: 103, p: 2,  c: 24, f: 0.1 },
      { name: 'Almonds (28g)',                cal: 164, p: 6,  c: 6,  f: 14  },
      { name: 'Tuna (can 140g)',              cal: 132, p: 29, c: 0,  f: 1   },
      { name: 'Milk (1 cup)',                 cal: 149, p: 8,  c: 12, f: 8   },
      { name: 'Cottage Cheese (1 cup)',       cal: 206, p: 28, c: 8,  f: 5   },
      { name: 'White Rice (1 cup cooked)',    cal: 206, p: 4,  c: 45, f: 0.4 },
      { name: 'Whole Wheat Bread (slice)',    cal: 81,  p: 4,  c: 15, f: 1.1 },
      { name: 'Orange (medium)',              cal: 62,  p: 1,  c: 15, f: 0.2 },
      { name: 'Apple (medium)',               cal: 95,  p: 0,  c: 25, f: 0.3 },
      { name: 'Peanut Butter (2 tbsp)',       cal: 191, p: 7,  c: 7,  f: 16  },
    ];

    // Combine common foods with user's previously logged foods (deduplicated by name)
    const foodSuggestions = computed(() => {
      const seen = new Set();
      const result = [];

      // User's own past foods first
      foodLogs.value.forEach(l => {
        if (!seen.has(l.food_name)) {
          seen.add(l.food_name);
          result.push({ name: l.food_name, cal: Math.round(l.calories) });
        }
      });

      // Then common foods
      COMMON_FOODS.forEach(f => {
        if (!seen.has(f.name)) {
          seen.add(f.name);
          result.push({ name: f.name, cal: f.cal });
        }
      });

      return result;
    });

    // When user picks from datalist, auto-fill macros if it's a known food
    function autofillMacros() {
      const commonMatch = COMMON_FOODS.find(f => f.name === form.value.food_name);
      if (commonMatch) {
        form.value.calories  = commonMatch.cal;
        form.value.protein_g = commonMatch.p;
        form.value.carbs_g   = commonMatch.c;
        form.value.fat_g     = commonMatch.f;
        return;
      }

      const pastMatch = foodLogs.value.find(l => l.food_name === form.value.food_name);
      if (pastMatch) {
        form.value.calories  = pastMatch.calories;
        form.value.protein_g = pastMatch.protein_g;
        form.value.carbs_g   = pastMatch.carbs_g;
        form.value.fat_g     = pastMatch.fat_g;
      }
    }

    // Returns an error string or '' if valid
    function validateFood(f) {
      if (!f.food_name || !f.food_name.trim()) return 'Food name is required.';
      if (!f.calories || f.calories < 1)        return 'Calories must be at least 1.';
      if (f.calories > 5000)                    return 'Calories seem too high (max 5000 per entry).';
      if (f.protein_g < 0 || f.protein_g > 500) return 'Protein must be 0–500g.';
      if (f.carbs_g   < 0 || f.carbs_g   > 500) return 'Carbs must be 0–500g.';
      if (f.fat_g     < 0 || f.fat_g     > 300) return 'Fat must be 0–300g.';

      const totalMacroCals = (f.protein_g || 0) * 4 + (f.carbs_g || 0) * 4 + (f.fat_g || 0) * 9;
      if (totalMacroCals > f.calories * 2) return 'Macro calories are much higher than total calories — please check your numbers.';

      return '';
    }

    const totals = computed(() => ({
      calories: foodLogs.value.reduce((s, l) => s + l.calories,  0),
      protein:  foodLogs.value.reduce((s, l) => s + l.protein_g, 0),
      carbs:    foodLogs.value.reduce((s, l) => s + l.carbs_g,   0),
      fat:      foodLogs.value.reduce((s, l) => s + l.fat_g,     0),
    }));

    const macroArcs = computed(() => {
      const proteinCals = totals.value.protein * 4;
      const carbsCals   = totals.value.carbs   * 4;
      const fatCals     = totals.value.fat     * 9;
      const total       = proteinCals + carbsCals + fatCals;

      if (!total) return [];

      const cx = 90, cy = 90, r = 60;
      const colors = ['var(--color-accent-blue)', 'var(--color-accent-yellow)', 'var(--color-accent-red)'];
      const vals   = [proteinCals, carbsCals, fatCals];

      const result = [];
      let startAngle = -Math.PI / 2;

      vals.forEach((val, i) => {
        const sweep = (val / total) * 2 * Math.PI;
        const clamp = Math.min(sweep, 2 * Math.PI - 0.001);
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(startAngle + clamp);
        const y2 = cy + r * Math.sin(startAngle + clamp);
        const largeArc = clamp > Math.PI ? 1 : 0;
        result.push({ d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`, color: colors[i] });
        startAngle += sweep;
      });

      return result;
    });

    async function loadAll() {
      const [logs, water] = await Promise.all([
        API.getFoodLogs(selectedDate.value),
        API.getWater(selectedDate.value)
      ]);
      foodLogs.value  = logs;
      waterTotal.value = water.total;
      waterLogs.value  = water.logs;
    }

    async function addFood() {
      foodError.value = validateFood(form.value);
      if (foodError.value) return;

      const prevCals = totals.value.calories;
      await API.addFood({ ...form.value, logged_at: selectedDate.value });
      form.value = { food_name: '', calories: null, protein_g: 0, carbs_g: 0, fat_g: 0, meal_type: 'breakfast' };
      await loadAll();

      if (prevCals < props.user.goal_calories && totals.value.calories >= props.user.goal_calories) {
        calKey.value++;
        showToast('🎉 Calorie goal reached!');
      } else {
        showToast('Food logged!');
      }
    }

    async function deleteFood(id) {
      await API.deleteFood(id);
      foodLogs.value = foodLogs.value.filter(l => l.id !== id);
      showToast('Entry removed');
    }

    async function addWaterAmount(ml) {
      const prevW = waterTotal.value;
      await API.addWater({ amount_ml: ml, logged_at: selectedDate.value });
      const w = await API.getWater(selectedDate.value);
      waterTotal.value = w.total;
      waterLogs.value  = w.logs;

      if (prevW < props.user.goal_water_ml && w.total >= props.user.goal_water_ml) {
        waterKey.value++;
        showToast('💧 Water goal reached!');
      }
    }

    async function addWaterManual() {
      if (!manualWater.value || manualWater.value < 1 || manualWater.value > 2000) return;
      await addWaterAmount(manualWater.value);
      manualWater.value = null;
    }

    async function removeWater(id) {
      await API.deleteWater(id);
      const w = await API.getWater(selectedDate.value);
      waterTotal.value = w.total;
      waterLogs.value  = w.logs;
    }

    function changeDate(dir) {
      const d = new Date(selectedDate.value + 'T00:00:00');
      d.setDate(d.getDate() + dir);
      const s = d.toISOString().split('T')[0];
      if (s <= today) {
        selectedDate.value = s;
        loadAll();
      }
    }

    onMounted(loadAll);

    return {
      today, selectedDate, foodLogs, waterLogs, waterTotal,
      manualWater, foodError, calKey, waterKey, form,
      totals, macroArcs, foodSuggestions,
      autofillMacros, loadAll, addFood, deleteFood,
      addWaterAmount, addWaterManual, removeWater, changeDate,
      pct, formatDate
    };
  }
};