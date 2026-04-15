const AnalyticsView = {
  props: ["user"],
  template: `
  <div>
    <div class="section-title mb-6">Analytics & Progress</div>
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;" id="analytics-tabs">
      <button v-for="tab in tabs" :key="tab.id"
        :class="['btn-secondary']"
        :style="activeTab===tab.id?'background:var(--color-accent-green-tint);color:var(--color-accent-green);border-color:rgba(0,229,160,0.3)':''"
        @click="switchTab(tab.id)">
        <i :class="tab.icon"></i> {{ tab.label }}
      </button>
    </div>
    <div v-show="activeTab==='calories'" class="ft-card mb-6">
      <div class="section-header">
        <div class="card-title">Calories — Last 7 Days</div>
        <span class="tag-pill green"><i class="fas fa-bullseye"></i> Goal: {{ user.goal_calories }} kcal</span>
      </div>
      <div id="a-calorie"></div>
    </div>
    <div v-show="activeTab==='macros'" class="ft-card mb-6">
      <div class="card-title" style="margin-bottom:16px;">Macro Breakdown — Last 7 Days</div>
      <div id="a-macro"></div>
      <div style="display:flex;gap:20px;margin-top:12px;flex-wrap:wrap;">
        <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-body)"><span style="width:12px;height:12px;border-radius:2px;background:var(--color-accent-blue);display:inline-block;"></span>Protein</span>
        <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-body)"><span style="width:12px;height:12px;border-radius:2px;background:var(--color-accent-yellow);display:inline-block;"></span>Carbs</span>
        <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-body)"><span style="width:12px;height:12px;border-radius:2px;background:var(--color-accent-red);display:inline-block;"></span>Fat</span>
      </div>
    </div>
    <div v-show="activeTab==='weight'" class="ft-card mb-6">
      <div class="card-title" style="margin-bottom:16px;">Weight Trend</div>
      <div id="a-weight"></div>
    </div>
    <div v-show="activeTab==='workouts'" class="ft-card mb-6">
      <div class="card-title" style="margin-bottom:16px;">Workout Frequency — Last 4 Weeks</div>
      <div id="a-workout"></div>
    </div>
    <div class="stat-grid">
      <div class="stat-card" v-if="summary"><div class="stat-icon"><i class="fas fa-fire"></i></div><div class="stat-value">{{ Math.round(summary.avgCalories) }}</div><div class="stat-label">Avg Daily Calories</div></div>
      <div class="stat-card accent2" v-if="summary"><div class="stat-icon"><i class="fas fa-drumstick-bite"></i></div><div class="stat-value">{{ Math.round(summary.avgProtein) }}g</div><div class="stat-label">Avg Daily Protein</div></div>
      <div class="stat-card accent3" v-if="weightData.length>1"><div class="stat-icon"><i class="fas fa-weight"></i></div><div class="stat-value">{{ (weightData[weightData.length-1].weight_kg - weightData[0].weight_kg).toFixed(1) }}kg</div><div class="stat-label">Weight Change (30d)</div></div>
      <div class="stat-card accent4" v-if="freqData.length"><div class="stat-icon"><i class="fas fa-dumbbell"></i></div><div class="stat-value">{{ freqData.reduce((s,d)=>s+d.sessions,0) }}</div><div class="stat-label">Workouts (4 Weeks)</div></div>
    </div>
  </div>
  `,
  setup(props) {
    const { ref, computed, onMounted } = Vue;

    const activeTab  = ref("calories");
    const weekData   = ref([]);
    const weightData = ref([]);
    const freqData   = ref([]);

    const tabs = [
      { id: "calories", label: "Calories", icon: "fas fa-fire"      },
      { id: "macros",   label: "Macros",   icon: "fas fa-chart-bar" },
      { id: "weight",   label: "Weight",   icon: "fas fa-weight"    },
      { id: "workouts", label: "Workouts", icon: "fas fa-dumbbell"  },
    ];

    const summary = computed(() => {
      const days = weekData.value.filter(d => d.calories > 0);
      if (!days.length) return null;
      return {
        avgCalories: days.reduce((s, d) => s + d.calories, 0) / days.length,
        avgProtein:  days.reduce((s, d) => s + d.protein,  0) / days.length,
      };
    });

    function switchTab(id) {
      activeTab.value = id;
      $("#analytics-tabs button").css("transition", "all 0.15s ease");
      Vue.nextTick(() => draw(id));
    }

    async function loadAll() {
      [weekData.value, weightData.value, freqData.value] = await Promise.all([
        API.getNutritionWeek(),
        API.getWeightTrend(),
        API.getWorkoutFrequency(),
      ]);
      await Vue.nextTick();
      draw("calories");
    }

    // Helper: set up an SVG canvas inside a given element
    function dims(elId) {
      const el = document.getElementById(elId);
      if (!el) return null;

      el.innerHTML = "";

      const margin = { top: 16, right: 20, bottom: 48, left: 56 };
      const w      = Math.max(el.clientWidth || 600, 300);
      const h      = 260;
      const width  = w - margin.left - margin.right;
      const height = h - margin.top - margin.bottom;

      const svg = d3.select("#" + elId)
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      return { svg, width, height };
    }

    // Helper: build a 7-day array merged with weekData
    function fillDays() {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }

      const map = {};
      weekData.value.forEach(r => map[r.date] = r);

      return days.map(d => ({
        date: d,
        ...(map[d] || { calories: 0, protein: 0, carbs: 0, fat: 0 }),
      }));
    }

    function draw(type) {
      if      (type === "calories") drawCalorie();
      else if (type === "macros")   drawMacro();
      else if (type === "weight")   drawWeight();
      else if (type === "workouts") drawWorkout();
    }

    function drawCalorie() {
      const d = dims("a-calorie");
      if (!d) return;
      const { svg, width, height } = d;
      const data = fillDays();

      // Scales
      const x = d3.scaleBand()
        .domain(data.map(r => r.date))
        .range([0, width])
        .padding(0.35);

      const y = d3.scaleLinear()
        .domain([0, Math.max(d3.max(data, r => r.calories) * 1.2, props.user.goal_calories * 1.2)])
        .range([height, 0]);

      // Y axis + grid lines
      svg.append("g")
        .attr("class", "d3-axis")
        .call(d3.axisLeft(y).ticks(4).tickFormat(r => r > 0 ? r : "").tickSize(-width))
        .selectAll("line")
        .attr("stroke", "var(--color-border-subtle)")
        .attr("stroke-dasharray", "4,4");

      // Goal line
      svg.append("line")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", y(props.user.goal_calories)).attr("y2", y(props.user.goal_calories))
        .attr("stroke", "rgba(255,140,66,0.45)")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "6,4");

      svg.append("text")
        .attr("x", width - 4)
        .attr("y", y(props.user.goal_calories) - 5)
        .attr("text-anchor", "end")
        .attr("fill", "var(--color-accent-orange)")
        .attr("font-size", "11px")
        .text("Goal");

      // Bars
      const bars = svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", r => x(r.date))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("rx", 4)
        .attr("fill", "var(--color-accent-orange)");

      bars.transition()
        .duration(800)
        .delay((r, i) => i * 90)
        .ease(d3.easeCubicOut)
        .attr("y", r => y(r.calories))
        .attr("height", r => height - y(r.calories));

      // X axis
      svg.append("g")
        .attr("class", "d3-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(r => new Date(r + "T00:00:00").toLocaleDateString("en", { weekday: "short" })));

      // Tooltip
      const tip = d3.select("body").append("div").attr("class", "d3-tooltip").style("opacity", 0);
      bars
        .on("mouseover", (e, r) => tip.style("opacity", 1).html(`<b>${formatDate(r.date)}</b><br>${Math.round(r.calories)} kcal`))
        .on("mousemove", e => tip.style("left", e.pageX + 10 + "px").style("top", e.pageY - 30 + "px"))
        .on("mouseout", () => tip.style("opacity", 0));
    }

    function drawMacro() {
      const d = dims("a-macro");
      if (!d) return;
      const { svg, width, height } = d;
      const data = fillDays();

      const keys   = ["protein", "carbs", "fat"];
      const colors = {
        protein: "var(--color-accent-blue)",
        carbs:   "var(--color-accent-yellow)",
        fat:     "var(--color-accent-red)",
      };
      const stacked = d3.stack().keys(keys)(data);

      // Scales
      const x = d3.scaleBand()
        .domain(data.map(r => r.date))
        .range([0, width])
        .padding(0.35);

      const y = d3.scaleLinear()
        .domain([0, d3.max(stacked[stacked.length - 1], r => r[1]) * 1.15 || 100])
        .range([height, 0]);

      // Y axis + grid lines
      svg.append("g")
        .attr("class", "d3-axis")
        .call(d3.axisLeft(y).ticks(4).tickSize(-width))
        .selectAll("line")
        .attr("stroke", "var(--color-border-subtle)")
        .attr("stroke-dasharray", "4,4");

      // Stacked bars per macro
      stacked.forEach(layer => {
        svg.selectAll("rect." + layer.key)
          .data(layer)
          .enter()
          .append("rect")
          .attr("x", r => x(r.data.date))
          .attr("y", height)
          .attr("width", x.bandwidth())
          .attr("height", 0)
          .attr("rx", 3)
          .attr("fill", colors[layer.key])
          .transition()
          .duration(700)
          .delay((r, i) => i * 80)
          .attr("y", r => y(r[1]))
          .attr("height", r => y(r[0]) - y(r[1]));
      });

      // X axis
      svg.append("g")
        .attr("class", "d3-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(r => new Date(r + "T00:00:00").toLocaleDateString("en", { weekday: "short" })));
    }

    function drawWeight() {
      const d = dims("a-weight");
      if (!d) return;
      const { svg, width, height } = d;

      // Empty state — show blank axes
      if (!weightData.value.length) {
        const now  = new Date();
        const past = new Date(now - 30 * 24 * 3600 * 1000);

        const x = d3.scaleTime().domain([past, now]).range([0, width]);
        const y = d3.scaleLinear().domain([60, 90]).range([height, 0]);

        svg.append("g")
          .attr("class", "d3-axis")
          .call(d3.axisLeft(y).ticks(4).tickSize(-width).tickFormat(r => r + "kg"))
          .selectAll("line")
          .attr("stroke", "var(--color-border-subtle)")
          .attr("stroke-dasharray", "4,4");

        svg.append("g")
          .attr("class", "d3-axis")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d")));

        return;
      }

      const parseDate = d3.timeParse("%Y-%m-%d");
      const data = weightData.value.map(r => ({ date: parseDate(r.date), weight: r.weight_kg }));

      // Scales
      const x = d3.scaleTime()
        .domain(d3.extent(data, r => r.date))
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([d3.min(data, r => r.weight) - 1, d3.max(data, r => r.weight) + 1])
        .range([height, 0]);

      // Gradient fill
      const defs = svg.append("defs");
      const grad = defs.append("linearGradient")
        .attr("id", "awg")
        .attr("x1", "0").attr("x2", "0")
        .attr("y1", "0").attr("y2", "1");
      grad.append("stop").attr("offset", "0%").attr("stop-color", "var(--color-accent-green)").attr("stop-opacity", 0.25);
      grad.append("stop").attr("offset", "100%").attr("stop-color", "var(--color-accent-green)").attr("stop-opacity", 0);

      // Area
      const area = d3.area()
        .x(r => x(r.date))
        .y0(height)
        .y1(r => y(r.weight))
        .curve(d3.curveCatmullRom);
      svg.append("path").datum(data).attr("fill", "url(#awg)").attr("d", area);

      // Line with draw animation
      const line = d3.line()
        .x(r => x(r.date))
        .y(r => y(r.weight))
        .curve(d3.curveCatmullRom);

      const path = svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "var(--color-accent-green)")
        .attr("stroke-width", 2.5)
        .attr("d", line);

      const totalLength = path.node().getTotalLength();
      path
        .attr("stroke-dasharray", totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(1200)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);

      // Dots
      svg.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", r => x(r.date))
        .attr("cy", r => y(r.weight))
        .attr("r", 4)
        .attr("fill", "var(--color-accent-green)")
        .attr("stroke", "var(--color-bg-card)")
        .attr("stroke-width", 2);

      // Axes
      svg.append("g")
        .attr("class", "d3-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%b %d")));

      svg.append("g")
        .attr("class", "d3-axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(r => r + "kg"));
    }

    function drawWorkout() {
      const d = dims("a-workout");
      if (!d) return;
      const { svg, width, height } = d;
      const data = freqData.value.length ? freqData.value : [{ week: "No data", sessions: 0 }];

      // Scales
      const x = d3.scaleBand()
        .domain(data.map(r => r.week))
        .range([0, width])
        .padding(0.4);

      const y = d3.scaleLinear()
        .domain([0, Math.max(d3.max(data, r => r.sessions) * 1.3, 5)])
        .range([height, 0]);

      // Y axis andn grid lines
      svg.append("g")
        .attr("class", "d3-axis")
        .call(d3.axisLeft(y).ticks(4).tickSize(-width))
        .selectAll("line")
        .attr("stroke", "var(--color-border-subtle)")
        .attr("stroke-dasharray", "4,4");

      // Bars
      const bars = svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", r => x(r.week))
        .attr("y", height)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("rx", 4)
        .attr("fill", "var(--color-accent-yellow)");

      bars.transition()
        .duration(800)
        .delay((r, i) => i * 120)
        .ease(d3.easeCubicOut)
        .attr("y", r => y(r.sessions))
        .attr("height", r => height - y(r.sessions));

      // Value labels above bars
      svg.selectAll(".lbl")
        .data(data)
        .enter()
        .append("text")
        .attr("x", r => x(r.week) + x.bandwidth() / 2)
        .attr("y", r => y(r.sessions) - 6)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--color-text-body)")
        .attr("font-size", "12px")
        .text(r => r.sessions);

      // X axis
      svg.append("g")
        .attr("class", "d3-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(r => "Wk " + (r.split("-W")[1] || r)));
    }

    onMounted(loadAll);

    return { activeTab, weekData, weightData, freqData, tabs, summary, switchTab };
  },
};