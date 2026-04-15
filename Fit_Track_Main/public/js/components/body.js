const BodyView = {
  props: ['user'],
  template: `
  <div>
    <div class="grid-2 mb-6">
      <div class="ft-card">
        <div class="card-title">Log Weight</div>
        <div class="field"><label class="label">Weight (kg)</label>
          <input class="input" type="number" step="0.1" v-model.number="form.weight_kg"
            placeholder="e.g. 75.5" min="20" max="500"/>
        </div>
        <div class="field"><label class="label">Date</label>
          <input class="input" type="date" v-model="form.logged_at" :max="today"/>
        </div>
        <div class="field"><label class="label">Notes (optional)</label>
          <input class="input" v-model="form.notes" placeholder="e.g. After morning workout"/>
        </div>
        <div style="font-size:12px;color:var(--color-text-subheading);margin-bottom:10px;font-style:italic;">
          If you already logged weight today, it will be updated instead of duplicated.
        </div>
        <div v-if="weightError" style="color:var(--color-accent-red);font-size:12px;margin-bottom:8px;">⚠ {{ weightError }}</div>
        <button class="btn-primary" @click="addWeight" :disabled="!form.weight_kg">
          <i class="fas fa-plus"></i> Log Weight
        </button>
        <div v-if="weightLogs.length" style="margin-top:20px;padding-top:16px;border-top:1px solid var(--color-border-subtle);">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <div style="font-size:11px;color:var(--color-text-subheading);text-transform:uppercase;letter-spacing:.08em;">Current</div>
              <div style="font-family:system-ui,sans-serif;font-size:28px;font-weight:800;color:var(--color-accent-green);">{{ latestWeight }}kg</div>
            </div>
            <div>
              <div style="font-size:11px;color:var(--color-text-subheading);text-transform:uppercase;letter-spacing:.08em;">30d Change</div>
              <div :style="{fontFamily:'system-ui,sans-serif',fontSize:'28px',fontWeight:800,color:weekChange>=0?'var(--color-accent-red)':'var(--color-accent-green)'}">
                {{ weekChange>=0?'+':'' }}{{ weekChange }}kg
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="ft-card">
        <div class="card-title">Weight Trend</div>
        <div id="weight-chart"></div>
        <div v-if="!weightLogs.length" class="empty-state" style="padding:20px;"><i class="fas fa-weight"></i><p>Log your weight to see the trend.</p></div>
      </div>
    </div>
    <div class="ft-card">
      <div class="section-title">Weight History</div>
      <div v-if="weightLogs.length" style="overflow-x:auto;">
        <table class="ft-table">
          <thead><tr><th>Date</th><th>Weight</th><th>Change</th><th>Notes</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(log,i) in [...weightLogs].reverse()" :key="log.id">
              <td>{{ formatDate(log.logged_at) }}</td>
              <td><b style="color:var(--color-text-heading)">{{ log.weight_kg }}kg</b></td>
              <td>
                <span v-if="i<weightLogs.length-1" :style="{color:delta(log,i)>0?'var(--color-accent-red)':delta(log,i)<0?'var(--color-accent-green)':'var(--color-text-subheading)'}">
                  {{ delta(log,i)>0?'+':'' }}{{ delta(log,i) }}kg
                </span>
                <span v-else style="color:var(--color-text-subheading)">—</span>
              </td>
              <td style="color:var(--color-text-subheading)">{{ log.notes||'—' }}</td>
              <td><button class="btn-danger" @click="deleteWeight(log.id)"><i class="fas fa-trash"></i></button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state"><i class="fas fa-weight"></i><p>No weight entries yet.</p></div>
    </div>
  </div>
  `,
  setup(props) {
    const { ref, computed, onMounted } = Vue;

    const today = new Date().toISOString().split('T')[0];
    const weightLogs  = ref([]);
    const weightError = ref('');
    const form = ref({ weight_kg: null, logged_at: today, notes: '' });

    const latestWeight = computed(() => {
      if (!weightLogs.value.length) return '—';
      return weightLogs.value[weightLogs.value.length - 1].weight_kg;
    });

    const weekChange = computed(() => {
      if (weightLogs.value.length < 2) return 0;
      const first = weightLogs.value[0].weight_kg;
      const last  = weightLogs.value[weightLogs.value.length - 1].weight_kg;
      return Math.round((last - first) * 10) / 10;
    });

    function validateWeight(w) {
      if (!w || w < 20) return 'Weight must be at least 20kg.';
      if (w > 500)      return 'Weight seems too high (max 500kg).';

      // Detect sudden massive change (>30kg from last entry) as a likely typo
      if (weightLogs.value.length) {
        const last = weightLogs.value[weightLogs.value.length - 1].weight_kg;
        if (Math.abs(w - last) > 30) return `That's a big change from your last entry (${last}kg) — did you mean ${w}kg?`;
      }

      return '';
    }

    async function load() {
      weightLogs.value = await API.getWeight();
      await Vue.nextTick();
      drawChart();
    }

    async function addWeight() {
      weightError.value = validateWeight(form.value.weight_kg);
      if (weightError.value) return;
      await API.addWeight(form.value);
      form.value = { weight_kg: null, logged_at: today, notes: '' };
      await load();
      showToast('Weight logged!');
    }

    async function deleteWeight(id) {
      await API.deleteWeight(id);
      await load();
      showToast('Entry removed');
    }

    // delta: change from previous entry (table is reversed, so index i+1 in reversed = previous chronologically)
    function delta(log, i) {
      const rev = [...weightLogs.value].reverse();
      if (i >= rev.length - 1) return 0;
      return Math.round((log.weight_kg - rev[i + 1].weight_kg) * 10) / 10;
    }

    function drawChart() {
      const el = document.getElementById('weight-chart');
      if (!el || !weightLogs.value.length) return;

      el.innerHTML = '';

      const data   = weightLogs.value;
      const margin = { top: 10, right: 20, bottom: 40, left: 50 };
      const w      = Math.max(el.clientWidth || 400, 300);
      const h      = 200;
      const width  = w - margin.left - margin.right;
      const height = h - margin.top - margin.bottom;

      const svg = d3.select('#weight-chart')
        .append('svg')
        .attr('width', w)
        .attr('height', h)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const parseDate = d3.timeParse('%Y-%m-%d');
      const xData = data.map(d => ({ date: parseDate(d.logged_at), weight: d.weight_kg }));

      // Scales
      const x = d3.scaleTime()
        .domain(d3.extent(xData, d => d.date))
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([d3.min(xData, d => d.weight) - 1, d3.max(xData, d => d.weight) + 1])
        .range([height, 0]);

      // Gradient fill
      const defs = svg.append('defs');
      const grad = defs.append('linearGradient')
        .attr('id', 'wg')
        .attr('x1', '0').attr('x2', '0')
        .attr('y1', '0').attr('y2', '1');
      grad.append('stop').attr('offset', '0%').attr('stop-color', 'var(--color-accent-green)').attr('stop-opacity', 0.3);
      grad.append('stop').attr('offset', '100%').attr('stop-color', 'var(--color-accent-green)').attr('stop-opacity', 0);

      // Area
      const area = d3.area()
        .x(d => x(d.date))
        .y0(height)
        .y1(d => y(d.weight))
        .curve(d3.curveCatmullRom);
      svg.append('path').datum(xData).attr('fill', 'url(#wg)').attr('d', area);

      // Line with draw animation
      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.weight))
        .curve(d3.curveCatmullRom);

      const path = svg.append('path')
        .datum(xData)
        .attr('fill', 'none')
        .attr('stroke', 'var(--color-accent-green)')
        .attr('stroke-width', 2.5)
        .attr('d', line);

      const totalLength = path.node().getTotalLength();
      path
        .attr('stroke-dasharray', totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);

      // Dots
      svg.selectAll('.dot')
        .data(xData)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.weight))
        .attr('r', 4)
        .attr('fill', 'var(--color-accent-green)')
        .attr('stroke', 'var(--color-bg-card)')
        .attr('stroke-width', 2);

      // Axes
      svg.append('g')
        .attr('class', 'd3-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%b %d')));

      svg.append('g')
        .attr('class', 'd3-axis')
        .call(d3.axisLeft(y).ticks(4).tickFormat(d => d + 'kg'));
    }

    onMounted(load);

    return { today, weightLogs, form, latestWeight, weekChange, delta, weightError, addWeight, deleteWeight, formatDate };
  }
};