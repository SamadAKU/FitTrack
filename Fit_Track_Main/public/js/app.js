const { createApp, ref, computed, onMounted } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',              redirect: '/dashboard'                          },
    { path: '/dashboard',     name: 'dashboard',  component: DashboardView  },
    { path: '/nutrition',     name: 'nutrition',  component: NutritionView  },
    { path: '/workouts',      name: 'workouts',   component: WorkoutView    },
    { path: '/body',          name: 'body',       component: BodyView       },
    { path: '/analytics',     name: 'analytics',  component: AnalyticsView  },
    { path: '/profile',       name: 'profile',    component: ProfileView    },
    { path: '/todos',         name: 'todos',      component: TodoView       },
    { path: '/goals',         name: 'goals',      component: GoalsView      },
    { path: '/:catchAll(.*)', redirect: '/dashboard'                         },
  ]
});

const app = createApp({
  template: `
  <div>
    <!-- Auth Screen -->
    <div v-if="!currentUser" class="auth-screen">
      <div class="auth-bg-anim"></div>
      <div class="auth-card">
        <div class="auth-logo">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="12" fill="var(--color-accent-green)"/>
            <path d="M10 22h4l3-8 4 16 3-10 3 4h7" stroke="#080D1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="auth-logo-text">FitTrack<span>Pro</span></span>
        </div>
        <div class="auth-tabs">
          <button :class="['auth-tab', authMode==='login'?'active':'']" @click="authMode='login'">Sign In</button>
          <button :class="['auth-tab', authMode==='register'?'active':'']" @click="authMode='register'">Register</button>
        </div>
        <div v-if="authError" class="auth-error">{{ authError }}</div>
        <div v-if="authMode==='login'" class="auth-form">
          <form @submit.prevent="login" novalidate>
            <div class="field"><label class="label">Email</label>
              <input class="input" type="email" v-model="loginForm.email"
                placeholder="you@example.com" required autocomplete="email"/>
            </div>
            <div class="field"><label class="label">Password</label>
              <input class="input" type="password" v-model="loginForm.password"
                placeholder="Enter your password" required autocomplete="current-password"/>
            </div>
            <button class="btn-primary full-width" type="submit" :disabled="authLoading">
              <span v-if="!authLoading"><i class="fas fa-sign-in-alt"></i> Sign In</span>
              <span v-else><i class="fas fa-spinner fa-spin"></i></span>
            </button>
            <p class="auth-hint">Demo: demo@fittrack.com / demo123</p>
          </form>
        </div>
        <div v-if="authMode==='register'" class="auth-form">
          <form @submit.prevent="register" novalidate>
            <div class="field"><label class="label">Username</label>
              <input class="input" type="text" v-model="registerForm.username"
                placeholder="e.g. jsmith" required minlength="3" autocomplete="username"/>
            </div>
            <div class="field"><label class="label">Email</label>
              <input class="input" type="email" v-model="registerForm.email"
                placeholder="you@example.com" required autocomplete="email"/>
            </div>
            <div class="field"><label class="label">Display Name</label>
              <input class="input" type="text" v-model="registerForm.display_name"
                placeholder="Your name (optional)" autocomplete="name"/>
            </div>
            <div class="field"><label class="label">Password</label>
              <input class="input" type="password" v-model="registerForm.password"
                placeholder="Enter a password (min 6 chars)" required minlength="6" autocomplete="new-password"/>
            </div>
            <button class="btn-primary full-width" type="submit" :disabled="authLoading">
              <span v-if="!authLoading"><i class="fas fa-user-plus"></i> Create Account</span>
              <span v-else><i class="fas fa-spinner fa-spin"></i></span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Main App -->
    <div v-else class="app-layout">
      <aside :class="['sidebar', sidebarOpen?'open':'']" role="navigation">
        <div class="sidebar-logo">
          <svg width="32" height="32" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="12" fill="var(--color-accent-green)"/>
            <path d="M10 22h4l3-8 4 16 3-10 3 4h7" stroke="#080D1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>FitTrack<b>Pro</b></span>
        </div>
        <nav class="sidebar-nav">
          <router-link v-for="item in navItems" :key="item.name"
            :to="{name:item.name}"
            :class="['nav-item', $route.name===item.name?'active':'']"
            @click="sidebarOpen=false">
            <i :class="item.icon"></i><span>{{ item.label }}</span>
          </router-link>
        </nav>
        <div class="sidebar-user">
          <div class="user-avatar">{{ userInitials }}</div>
          <div class="user-info">
            <div class="user-name">{{ currentUser.display_name || currentUser.username }}</div>
            <div class="user-role">Athlete</div>
          </div>
          <button class="logout-btn" @click="confirmLogout" title="Logout"><i class="fas fa-sign-out-alt"></i></button>
        </div>
      </aside>
      <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen=false"></div>
      <main class="main-content" role="main">
        <header class="topbar">
          <button class="menu-toggle" @click="sidebarOpen=!sidebarOpen"><i class="fas fa-bars"></i></button>
          <div class="topbar-title">{{ currentNavLabel }}</div>
          <div class="topbar-date">{{ todayFormatted }}</div>
          <!-- Theme toggle (light/dark) -->
          <button :class="['theme-toggle', isDark ? 'is-moon' : 'is-sun']" @click="toggleTheme" :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
            <i :class="isDark ? 'fas fa-moon' : 'fas fa-sun'"></i>
          </button>
        </header>
        <div class="view-section">
          <router-view :user="currentUser" @navigate="navigateTo" @updated="fetchUser"/>
        </div>
      </main>
    </div>

    <!-- Logout Confirm Modal -->
    <div v-if="showLogoutConfirm" style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);" @click.self="showLogoutConfirm=false">
      <div style="background:var(--color-bg-card);border:1px solid var(--color-border-strong);border-radius:18px;padding:36px 32px;max-width:360px;width:92vw;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.45);animation:slideUp .25s ease;">
        <div style="font-size:42px;margin-bottom:14px;">👋</div>
        <div style="font-size:19px;font-weight:800;color:var(--color-text-heading);margin-bottom:8px;">Log out?</div>
        <div style="color:var(--color-text-body);font-size:14px;margin-bottom:26px;line-height:1.5;">Are you sure you want to sign out of FitTrack Pro?</div>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button class="btn-secondary" style="flex:1;" @click="showLogoutConfirm=false">Cancel</button>
          <button class="btn-danger" style="flex:1;padding:10px 20px;font-size:14px;" @click="logout"><i class="fas fa-sign-out-alt"></i> Log Out</button>
        </div>
      </div>
    </div>
  </div>
  `,
  setup() {
    const currentUser = ref(null);
    const sidebarOpen = ref(false);
    const authMode    = ref('login');
    const authError   = ref('');
    const authLoading = ref(false);
    const showLogoutConfirm = ref(false);

    const loginForm    = ref({ email: '', password: '' });
    const registerForm = ref({ username: '', email: '', password: '', display_name: '' });

    // Theme — persisted in localStorage
    const isDark = ref(localStorage.getItem('ft-theme') !== 'light');

    function applyTheme() {
      document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
    }

    function toggleTheme() {
      isDark.value = !isDark.value;
      localStorage.setItem('ft-theme', isDark.value ? 'dark' : 'light');
      applyTheme();
    }

    applyTheme();

    const navItems = [
      { name: 'dashboard', label: 'Dashboard',    icon: 'fas fa-home'       },
      { name: 'nutrition', label: 'Nutrition',     icon: 'fas fa-apple-alt'  },
      { name: 'workouts',  label: 'Workouts',      icon: 'fas fa-dumbbell'   },
      { name: 'body',      label: 'Body Tracking', icon: 'fas fa-weight'     },
      { name: 'analytics', label: 'Analytics',     icon: 'fas fa-chart-line' },
      { name: 'profile',   label: 'Profile',       icon: 'fas fa-user-cog'   },
      { name: 'todos',     label: 'To-Do',         icon: 'fas fa-check-square' },
      { name: 'goals',     label: 'Goals',         icon: 'fas fa-bullseye'     },
    ];

    const userInitials = computed(() => {
      const name = currentUser.value?.display_name || currentUser.value?.username || '';
      return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    });

    const currentNavLabel = computed(() => {
      return navItems.find(n => n.name === router.currentRoute.value.name)?.label || 'FitTrack Pro';
    });

    const todayFormatted = computed(() => {
      return new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    });

    async function fetchUser() {
      try {
        currentUser.value = await API.getMe();
      } catch {
        currentUser.value = null;
      }
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    async function login() {
      authError.value = '';

      if (!loginForm.value.email.trim())                       { authError.value = 'Email is required.';                    return; }
      if (!EMAIL_RE.test(loginForm.value.email.trim()))        { authError.value = 'Please enter a valid email address.';   return; }
      if (!loginForm.value.password)                           { authError.value = 'Password is required.';                 return; }

      authLoading.value = true;
      try {
        const res = await API.login(loginForm.value);
        currentUser.value = res.user;
        loginForm.value = { email: '', password: '' };
        router.push({ name: 'dashboard' });
      } catch (e) {
        authError.value = e.error || 'Invalid credentials.';
      } finally {
        authLoading.value = false;
      }
    }

    async function register() {
      authError.value = '';
      const f = registerForm.value;

      if (!f.username.trim() || f.username.trim().length < 3)  { authError.value = 'Username must be at least 3 characters.';                          return; }
      if (!/^[a-zA-Z0-9_]+$/.test(f.username.trim()))          { authError.value = 'Username can only contain letters, numbers, and underscores.';      return; }
      if (!f.email.trim() || !EMAIL_RE.test(f.email.trim()))   { authError.value = 'Please enter a valid email address.';                               return; }
      if (!f.password || f.password.length < 6)                { authError.value = 'Password must be at least 6 characters.';                           return; }

      authLoading.value = true;
      try {
        const res = await API.register(registerForm.value);
        currentUser.value = res.user;
        registerForm.value = { username: '', email: '', password: '', display_name: '' };
        router.push({ name: 'dashboard' });
      } catch (e) {
        authError.value = e.error || 'Registration failed.';
      } finally {
        authLoading.value = false;
      }
    }

    function confirmLogout() {
      showLogoutConfirm.value = true;
    }

    async function logout() {
      await API.logout();
      currentUser.value = null;
      showLogoutConfirm.value = false;
    }

    function navigateTo(name) {
      router.push({ name });
      sidebarOpen.value = false;
    }

    onMounted(fetchUser);

    return {
      currentUser, sidebarOpen, authMode, authError, authLoading,
      loginForm, registerForm, showLogoutConfirm,
      navItems, userInitials, currentNavLabel, todayFormatted,
      isDark, toggleTheme, fetchUser, login, register,
      logout, confirmLogout, navigateTo
    };
  }
});

app.component('dashboard-view', DashboardView);
app.component('nutrition-view', NutritionView);
app.component('workout-view',   WorkoutView);
app.component('body-view',      BodyView);
app.component('analytics-view', AnalyticsView);
app.component('profile-view',   ProfileView);
app.component('todo-view',      TodoView);
app.component('goals-view',     GoalsView);
app.use(router);
app.mount('#app');