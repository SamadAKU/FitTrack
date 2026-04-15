const DashboardView = {
  props: ['user'],
  emits: ['navigate'],
  template: `
  <div>
    <div class="ft-card mb-6" style="background:linear-gradient(135deg,var(--color-bg-surface),var(--color-bg-card));border-color:rgba(0,229,160,0.2);position:relative;overflow:hidden;">
      <svg style="position:absolute;right:0;top:0;opacity:.06;" width="220" height="120" viewBox="0 0 220 120">
        <circle cx="180" cy="20" r="80" fill="var(--color-accent-green)"/>
        <circle cx="60"  cy="100" r="60" fill="var(--color-accent-blue)"/>
      </svg>
      <div style="position:relative;z-index:1;">
        <div style="font-family:system-ui,sans-serif;font-size:22px;font-weight:800;margin-bottom:4px;color:var(--color-text-heading);">
          Good {{ greeting }}, {{ user.display_name || user.username }}! 👋
        </div>
        <div style="color:var(--color-text-body);font-size:14px;">Here's your fitness snapshot for today.</div>
      </div>
    </div>

    <div class="stat-grid mb-6">
      <div class="stat-card accent-orange">
        <div class="stat-icon"><i class="fas fa-fire"></i></div>
        <div class="stat-value">{{ data ? Math.round(data.macros.calories) : '—' }} <span class="stat-unit">/ {{ user.goal_calories }}</span></div>
        <div class="stat-label">Calories Today</div>
      </div>
      <div class="stat-card accent2">
        <div class="stat-icon"><i class="fas fa-tint"></i></div>
        <div class="stat-value">{{ data ? (data.water/1000).toFixed(1) : '—' }} <span class="stat-unit">L / {{ (user.goal_water_ml/1000).toFixed(1) }}L</span></div>
        <div class="stat-label">Water Intake</div>
      </div>
      <div class="stat-card accent3">
        <div class="stat-icon"><i class="fas fa-weight"></i></div>
        <div class="stat-value">{{ data && data.lastWeight ? data.lastWeight.weight_kg : '—' }} <span class="stat-unit">kg</span></div>
        <div class="stat-label">Current Weight</div>
      </div>
      <div class="stat-card accent4">
        <div class="stat-icon"><i class="fas fa-dumbbell"></i></div>
        <div class="stat-value">{{ data ? data.weekSessions : '—' }} <span class="stat-unit">this week</span></div>
        <div class="stat-label">Workouts</div>
      </div>
    </div>

    <div class="grid-2 mb-6">
      <div class="ft-card">
        <div class="card-title">Today's Macros</div>
        <template v-if="data">
          <div class="progress-wrap">
            <div class="progress-header"><span class="progress-label"><i class="fas fa-fire" style="color:var(--color-accent-orange)"></i> Calories</span><span class="progress-values">{{ Math.round(data.macros.calories) }} / {{ user.goal_calories }} kcal</span></div>
            <div class="progress-bar-bg"><div class="progress-bar-fill calories" :style="{width:pct(data.macros.calories,user.goal_calories)+'%'}"></div></div>
          </div>
          <div class="progress-wrap">
            <div class="progress-header"><span class="progress-label">Protein</span><span class="progress-values">{{ Math.round(data.macros.protein) }}g / {{ user.goal_protein }}g</span></div>
            <div class="progress-bar-bg"><div class="progress-bar-fill protein" :style="{width:pct(data.macros.protein,user.goal_protein)+'%'}"></div></div>
          </div>
          <div class="progress-wrap">
            <div class="progress-header"><span class="progress-label">Carbs</span><span class="progress-values">{{ Math.round(data.macros.carbs) }}g / {{ user.goal_carbs }}g</span></div>
            <div class="progress-bar-bg"><div class="progress-bar-fill carbs" :style="{width:pct(data.macros.carbs,user.goal_carbs)+'%'}"></div></div>
          </div>
          <div class="progress-wrap">
            <div class="progress-header"><span class="progress-label">Fat</span><span class="progress-values">{{ Math.round(data.macros.fat) }}g / {{ user.goal_fat }}g</span></div>
            <div class="progress-bar-bg"><div class="progress-bar-fill fat" :style="{width:pct(data.macros.fat,user.goal_fat)+'%'}"></div></div>
          </div>
        </template>
        <div v-else class="empty-state" style="padding:20px"><i class="fas fa-spinner fa-spin"></i></div>
      </div>
      <div class="ft-card">
        <div class="card-title">Quick Actions</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px;">
          <button class="btn-primary" @click="$emit('navigate','nutrition')"><i class="fas fa-plus"></i> Log Food</button>
          <button class="btn-accent2" @click="$emit('navigate','workouts')"><i class="fas fa-dumbbell"></i> Start Workout</button>
          <button class="btn-secondary" @click="$emit('navigate','body')"><i class="fas fa-weight"></i> Log Weight</button>
          <button class="btn-secondary" @click="$emit('navigate','analytics')"><i class="fas fa-chart-line"></i> View Analytics</button>
        </div>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--color-border-subtle);">
          <div style="font-size:11px;color:var(--color-text-subheading);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Total Workouts</div>
          <div style="display:flex;align-items:baseline;gap:8px;">
            <span style="font-family:system-ui,sans-serif;font-size:36px;font-weight:800;color:var(--color-text-heading);">{{ data ? data.totalSessions : '—' }}</span>
            <span class="tag-pill green"><i class="fas fa-trophy"></i> All Time</span>
          </div>
        </div>
      </div>
    </div>

    <div class="ft-card">
      <div class="section-header">
        <div class="card-title">Calories — Last 7 Days</div>
        <button class="btn-secondary" style="font-size:12px;padding:6px 12px;" @click="$emit('navigate','analytics')">Full Analytics →</button>
      </div>
      <div id="dash-calorie-chart"></div>
    </div>
  </div>
  `,
  setup(props) {
    const { ref, computed, onMounted } = Vue;

    const data = ref(null);

    const greeting = computed(() => {
      const h = new Date().getHours();
      if (h < 12) return 'Morning';
      if (h < 17) return 'Afternoon';
      return 'Evening';
    });

    async function load() {
      try {
        data.value = await API.getDashboard();
        await Vue.nextTick();
        drawChart();
      } catch (e) {
        console.error(e);
      }
    }

    async function drawChart() {
      const weekData = await API.getNutritionWeek();
      const el = document.getElementById('dash-calorie-chart');
      if (!el) return;

      el.innerHTML = '';

      const margin = { top: 10, right: 20, bottom: 40, left: 50 };
      const w      = Math.max(el.clientWidth || 600, 300);
      const h      = 200;
      const width  = w - margin.left - margin.right;
      const height = h - margin.top - margin.bottom;

      const svg = d3.select('#dash-calorie-chart')
        .append('svg')
        .attr('width', w)
        .attr('height', h)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Build last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
      }

      const map = {};
      weekData.forEach(r => map[r.date] = r.calories);
      const chartData = days.map(d => ({ date: d, calories: map[d] || 0 }));

      // Scales
      const x = d3.scaleBand()
        .domain(chartData.map(d => d.date))
        .range([0, width])
        .padding(0.3);

      const y = d3.scaleLinear()
        .domain([0, Math.max(d3.max(chartData, d => d.calories) * 1.2, props.user.goal_calories * 1.2)])
        .range([height, 0]);

      // Y axis + grid lines
      svg.append('g')
        .attr('class', 'd3-axis')
        .call(d3.axisLeft(y).ticks(4).tickFormat(d => d > 0 ? d : '').tickSize(-width))
        .selectAll('line')
        .attr('stroke', 'var(--color-border-subtle)')
        .attr('stroke-dasharray', '4,4');

      // Goal line
      svg.append('line')
        .attr('x1', 0).attr('x2', width)
        .attr('y1', y(props.user.goal_calories)).attr('y2', y(props.user.goal_calories))
        .attr('stroke', 'rgba(255,140,66,0.45)')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,4');

      // Bars
      const bars = svg.selectAll('.bar')
        .data(chartData)
        .enter()
        .append('rect')
        .attr('x', d => x(d.date))
        .attr('y', height)
        .attr('width', x.bandwidth())
        .attr('height', 0)
        .attr('rx', 4)
        .attr('fill', 'var(--color-accent-orange)');

      bars.transition()
        .duration(700)
        .delay((d, i) => i * 80)
        .ease(d3.easeCubicOut)
        .attr('y', d => y(d.calories))
        .attr('height', d => height - y(d.calories));

      // X axis
      svg.append('g')
        .attr('class', 'd3-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => new Date(d + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })));

      // Tooltip
      const tip = d3.select('body').append('div').attr('class', 'd3-tooltip').style('opacity', 0);
      bars
        .on('mouseover', (e, d) => tip.style('opacity', 1).html(`<b>${formatDate(d.date)}</b><br>${Math.round(d.calories)} kcal`))
        .on('mousemove', e => tip.style('left', (e.pageX + 10) + 'px').style('top', (e.pageY - 30) + 'px'))
        .on('mouseout', () => tip.style('opacity', 0));
    }

    onMounted(load);

    return { data, greeting, pct };
  }
};