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
      // Ensure user is loaded before fetching personalized data
      if (!props.user || !props.user.id) return;

      try {
        // Fetching data from backend API
        const [foods, workouts, waters, users] = await Promise.all([
          API.get('/nutrition/all').catch(() => []), 
          API.get('/workouts/sessions').catch(() => []), 
          API.get('/nutrition/water/all').catch(() => []), 
          API.get('/auth/users').catch(() => []) 
        ]);

        // 1. Calculate Personal Achievements
        const myFoods = foods.filter(f => f.user_id === props.user.id);
        const mySessions = workouts.filter(w => w.user_id === props.user.id);
        const myWaters = waters.filter(w => w.user_id === props.user.id);

        // Calories
        const totalCals = myFoods.reduce((sum, f) => sum + (f.calories || 0), 0);
        
        // Workout Hours
        const totalHours = mySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / 3600;
        
        // Water (converted to Liters)
        const totalWaterL = myWaters.reduce((sum, w) => sum + (w.amount_ml || 0), 0) / 1000;
        
        // Plan Explorer (Count of unique plan_ids)
        const uniquePlansCount = new Set(mySessions.map(s => s.plan_id)).size;
        
        // Streak Hero (Simplified: count of unique logged days)
        const uniqueFoodDays = new Set(myFoods.map(f => f.logged_at)).size;

        // Badge definitions and unlocking logic
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

        // 2. Calculate Leaderboards (Average per Day)
        const computeUserAvg = (data, field, userId) => {
          const entry = data.filter(d => d.user_id === userId);
          if (entry.length === 0) return 0;
          
          const total = entry.reduce((s, e) => s + (e[field] || 0), 0);
          const days = new Set(entry.map(e => e.logged_at || e.completed_at?.split('T')[0])).size;
          return total / (days || 1);
        };

        if (users && users.length > 0) {
          leaderboards.value.calories = users.map(u => ({
            name: u.display_name || u.username,
            avg: computeUserAvg(foods, 'calories', u.id)
          })).sort((a, b) => b.avg - a.avg).slice(0, 5);

          leaderboards.value.workouts = users.map(u => ({
            name: u.display_name || u.username,
            avg: computeUserAvg(workouts, 'duration_seconds', u.id)
          })).sort((a, b) => b.avg - a.avg).slice(0, 5);

          leaderboards.value.water = users.map(u => ({
            name: u.display_name || u.username,
            avg: computeUserAvg(waters, 'amount_ml', u.id)
          })).sort((a, b) => b.avg - a.avg).slice(0, 5);
        }

      } catch (err) {
        console.error("Failed to load achievements data:", err);
      }
    };

    // Watch for the user prop to be populated, then fetch data
    watch(() => props.user, (newVal) => {
      if (newVal) {
        fetchData();
      }
    }, { immediate: true });

    return { personalBadges, leaderboards };
  }
};