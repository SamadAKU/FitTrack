const AchievementsView = {
  template: `
    <div class="achievements-view">
      <div class="section-title">
        <i class="fas fa-trophy" style="color: #f59e0b;"></i> Fitness Badges
      </div>
      <div class="stat-grid mb-6">
        <div v-for="badge in personalBadges" :key="badge.id" 
             class="ft-card badge-card" 
             :class="{ 'unlocked': badge.unlocked }">
          <div class="badge-icon"><i :class="badge.icon"></i></div>
          <div class="badge-info">
            <h3 class="badge-name">{{ badge.name }}</h3>
            <p class="badge-desc">{{ badge.desc }}</p>
            <div class="badge-progress" v-if="!badge.unlocked">
              Progress: {{ badge.current }} / {{ badge.target }}
            </div>
            <div class="tag-pill green" v-else style="margin-top: 8px;">
              <i class="fas fa-check"></i> Unlocked
            </div>
          </div>
        </div>
      </div>

      <div class="section-title">
        <i class="fas fa-crown" style="color: #ffd166;"></i> Community Leaderboard (Daily Avg)
      </div>
      <div class="grid-3">
        <div class="ft-card">
          <div class="card-title">🔥 Daily Avg Calories</div>
          <table class="ft-table">
            <thead><tr><th>Rank</th><th>Name</th><th class="has-text-right">Value</th></tr></thead>
            <tbody>
              <tr v-for="(user, index) in leaderboards.calories" :key="user.id">
                <td>#{{ index + 1 }}</td>
                <td>{{ user.name }}</td>
                <td class="has-text-right">{{ Math.round(user.avg) }} kcal</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="ft-card">
          <div class="card-title">⏳ Daily Avg Exercise</div>
          <table class="ft-table">
            <thead><tr><th>Rank</th><th>Name</th><th class="has-text-right">Value</th></tr></thead>
            <tbody>
              <tr v-for="(user, index) in leaderboards.workouts" :key="user.id">
                <td>#{{ index + 1 }}</td>
                <td>{{ user.name }}</td>
                <td class="has-text-right">{{ Math.round(user.avg / 60) }} min</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="ft-card">
          <div class="card-title">💧 Daily Avg Water</div>
          <table class="ft-table">
            <thead><tr><th>Rank</th><th>Name</th><th class="has-text-right">Value</th></tr></thead>
            <tbody>
              <tr v-for="(user, index) in leaderboards.water" :key="user.id">
                <td>#{{ index + 1 }}</td>
                <td>{{ user.name }}</td>
                <td class="has-text-right">{{ Math.round(user.avg) }} ml</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  props: ['user'],
  setup(props) {
    const { ref, watch } = Vue;
    const personalBadges = ref([]);
    const leaderboards = ref({ calories: [], workouts: [], water: [] });

    const fetchData = async () => {
      if (!props.user || !props.user.id) return;

      try {
        const response = await fetch('/api/achievements/data');
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const allData = await response.json();
        
        const foods = allData.food_logs || [];
        const workouts = allData.workout_sessions || [];
        const waters = allData.water_logs || [];
        const users = allData.users || [];

        const myFoods = foods.filter(f => f.user_id === props.user.id);
        const mySessions = workouts.filter(w => w.user_id === props.user.id);
        const myWaters = waters.filter(w => w.user_id === props.user.id);

        const totalCals = myFoods.reduce((sum, f) => sum + (Number(f.calories) || 0), 0);
        const totalHours = mySessions.reduce((sum, s) => sum + (Number(s.duration_seconds) || 0), 0) / 3600;
        const totalWaterL = myWaters.reduce((sum, w) => sum + (Number(w.amount_ml) || 0), 0) / 1000;
        const uniquePlansCount = new Set(mySessions.map(s => s.plan_id)).size;
        const uniqueFoodDays = new Set(myFoods.map(f => f.logged_at)).size;

        personalBadges.value = [
          { id: 1, name: 'Calorie King', desc: 'Burn 10k kcal total', icon: 'fas fa-fire', 
            unlocked: totalCals >= 10000, current: totalCals, target: 10000 },
          { id: 2, name: 'Gym Rat', desc: '50 hours of total workout', icon: 'fas fa-dumbbell', 
            unlocked: totalHours >= 50, current: totalHours.toFixed(1), target: 50 },
          { id: 3, name: 'Hydrated', desc: 'Log 20L of water total', icon: 'fas fa-tint', 
            unlocked: totalWaterL >= 20, current: totalWaterL.toFixed(1), target: 20 },
          { id: 4, name: 'Streak Hero', desc: '7 days consistent logging', icon: 'fas fa-calendar-check', 
            unlocked: uniqueFoodDays >= 7, current: uniqueFoodDays, target: 7 },
          { id: 5, name: 'Plan Explorer', desc: 'Try 3 different plans', icon: 'fas fa-map-signs', 
            unlocked: uniquePlansCount >= 3, current: uniquePlansCount, target: 3 }
        ];

        const computeUserAvg = (dataArray, field, userId) => {
          const entry = dataArray.filter(d => d.user_id === userId);
          if (entry.length === 0) return 0;
          
          const total = entry.reduce((s, e) => s + (Number(e[field]) || 0), 0);
          const days = new Set(entry.map(e => e.logged_at || (e.completed_at && e.completed_at.split('T')[0]))).size;
          return total / (days || 1);
        };

        if (users.length > 0) {
          leaderboards.value.calories = users.map(u => ({
            name: u.display_name || u.username,
            avg: computeUserAvg(foods, 'calories', u.id)
          })).filter(u => u.avg > 0).sort((a, b) => b.avg - a.avg).slice(0, 5);

          leaderboards.value.workouts = users.map(u => ({
            name: u.display_name || u.username,
            avg: computeUserAvg(workouts, 'duration_seconds', u.id)
          })).filter(u => u.avg > 0).sort((a, b) => b.avg - a.avg).slice(0, 5);

          leaderboards.value.water = users.map(u => ({
            name: u.display_name || u.username,
            avg: computeUserAvg(waters, 'amount_ml', u.id)
          })).filter(u => u.avg > 0).sort((a, b) => b.avg - a.avg).slice(0, 5);
        }

      } catch (err) {
        console.error("Failed to load achievements data:", err);
      }
    };

    watch(() => props.user, (newVal) => {
      if (newVal) fetchData();
    }, { immediate: true });

    return { personalBadges, leaderboards };
  }
};