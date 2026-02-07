/* ============================================
   ADHD Living — Main App Controller
   Navigation, settings, global features
   ============================================ */

const App = {
    currentPage: 'dashboard',

    init() {
        // Initialize all modules
        Particles.init();
        Dashboard.init();
        Tasks.init();
        Backlog.init();
        Weekly.init();
        Habits.init();
        Transition.init();
        Supervisor.init();
        Records.init();
        Shop.init();
        AI.init();

        this.loadSettings();
        this.bindNavigation();
        this.bindSettings();
        this.bindGlobalKeys();

        // Check time-based greeting
        this.greetAdventurer();

        console.log('⚔ ADHD Living initialized');
    },

    // --- Navigation ---
    navigate(page) {
        this.currentPage = page;

        // Update pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(`page-${page}`);
        if (target) target.classList.add('active');

        // Update sidebar links
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        const link = document.querySelector(`.sidebar-link[data-page="${page}"]`);
        if (link) link.classList.add('active');

        // Close sidebar on mobile
        document.getElementById('sidebar').classList.remove('open');

        // Refresh relevant module
        switch (page) {
            case 'dashboard': Dashboard.render(); break;
            case 'tasks': Tasks.render(); break;
            case 'backlog': Backlog.render(); break;
            case 'weekly': Weekly.render(); break;
            case 'habits': Habits.render(); break;
            case 'transition': Transition.render(); break;
            case 'records': Records.renderHistory(); break;
            case 'shop': Shop.render(); break;
        }
    },

    bindNavigation() {
        // Sidebar links
        document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.dataset.page);
            });
        });

        // Brand click
        document.querySelector('.brand').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigate('dashboard');
        });

        // Sidebar toggle (mobile)
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile
        document.getElementById('main-content').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('open');
            });
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            const settings = Store.load('settings');
            settings.theme = next;
            Store.save('settings', settings);
            document.getElementById('theme-toggle').textContent = next === 'dark' ? '☀' : '☽';
        });

        // Language toggle (placeholder for i18n)
        document.getElementById('lang-toggle').addEventListener('click', () => {
            this.toast('Language switching coming soon! 中文支持即将到来！', 'info');
        });
    },

    // --- Settings ---
    bindSettings() {
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('export-data').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e);
        });

        document.getElementById('reset-all').addEventListener('click', () => {
            if (confirm('⚠ This will delete ALL data. Are you sure?')) {
                Store.resetAll();
                location.reload();
            }
        });
    },

    openSettings() {
        const settings = Store.load('settings');
        document.getElementById('setting-name').value = settings.name;
        document.getElementById('setting-class').value = settings.charClass;
        document.getElementById('setting-api-key').value = settings.apiKey;
        document.getElementById('setting-api-url').value = settings.apiUrl;
        document.getElementById('setting-model').value = settings.model;
        document.getElementById('setting-sound').checked = settings.sound;
        document.getElementById('settings-modal').classList.add('open');
    },

    saveSettings() {
        const settings = Store.load('settings');
        settings.name = document.getElementById('setting-name').value.trim() || 'Wanderer';
        settings.charClass = document.getElementById('setting-class').value;
        settings.apiKey = document.getElementById('setting-api-key').value.trim();
        settings.apiUrl = document.getElementById('setting-api-url').value.trim() || 'https://api.openai.com/v1/chat/completions';
        settings.model = document.getElementById('setting-model').value.trim() || 'gpt-4o-mini';
        settings.sound = document.getElementById('setting-sound').checked;
        Store.save('settings', settings);

        // Update sidebar profile
        document.getElementById('profile-name').textContent = settings.name;
        document.getElementById('profile-class').textContent = Shop.getClassName(settings.charClass);
        document.getElementById('avatar').textContent = Shop.getClassEmoji(settings.charClass);

        document.getElementById('settings-modal').classList.remove('open');
        this.toast('Settings saved!', 'success');

        // Refresh dashboard & shop
        Dashboard.render();
        Shop.render();
    },

    loadSettings() {
        const settings = Store.load('settings');

        // Apply theme
        document.documentElement.setAttribute('data-theme', settings.theme);
        document.getElementById('theme-toggle').textContent = settings.theme === 'dark' ? '☀' : '☽';

        // Apply profile
        document.getElementById('profile-name').textContent = settings.name;
        document.getElementById('profile-class').textContent = Shop.getClassName(settings.charClass);
        document.getElementById('avatar').textContent = Shop.getClassEmoji(settings.charClass);
    },

    exportData() {
        const data = Store.exportAll();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adhd-living-backup-${Store.today()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast('Data exported!', 'success');
    },

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (Store.importAll(event.target.result)) {
                this.toast('Data imported! Reloading...', 'success');
                setTimeout(() => location.reload(), 1000);
            } else {
                this.toast('Import failed! Invalid file.', 'error');
            }
        };
        reader.readAsText(file);
    },

    // --- Keyboard shortcuts ---
    bindGlobalKeys() {
        document.addEventListener('keydown', (e) => {
            // ESC to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
                document.getElementById('sidebar').classList.remove('open');
            }

            // Number keys for quick navigation (when not in input)
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
                const pages = ['dashboard', 'tasks', 'backlog', 'weekly', 'habits', 'transition', 'supervisor', 'records', 'shop', 'ai'];
                const num = parseInt(e.key);
                if (num >= 1 && num <= pages.length) {
                    this.navigate(pages[num - 1]);
                }
            }
        });
    },

    // --- Achievement System ---
    checkAchievements() {
        const character = Store.load('character');
        const unlocked = character.achievements || [];
        const tasks = Store.load('tasks');
        const habits = Store.load('habits');
        const dashboard = Store.load('dashboard');
        const backlog = Store.load('backlog');
        const weekly = Store.load('weeklyPlan');
        const today = Store.today();
        const combo = Store.load('habitCombo') || 0;

        const completedTasks = tasks.filter(t => t.completed);
        const bossDone = completedTasks.filter(t => t.tier === 'boss').length;
        const todayHabits = habits.filter(h => h.playedDates && h.playedDates.includes(today)).length;

        const checks = {
            'a1': completedTasks.length >= 1,
            'a2': dashboard.dayStreak >= 3,
            'a3': todayHabits >= 5,
            'a4': bossDone >= 5,
            'a5': (() => {
                const survivalTasks = tasks.filter(t => t.tier === 'survival');
                return survivalTasks.length > 0 && survivalTasks.every(t => t.completed);
            })(),
            'a6': backlog.filter(b => b.pulledCount > 0).length >= 3,
            'a7': character.level >= 5,
            'a8': character.gold >= 500,
            'a9': combo >= 5,
            'a10': weekly.main.length > 0 && weekly.main.every(q => q.completed),
            'a11': dashboard.dayStreak >= 7,
            'a12': character.level >= 10
        };

        let newUnlock = false;
        for (const [id, passed] of Object.entries(checks)) {
            if (passed && !unlocked.includes(id)) {
                unlocked.push(id);
                newUnlock = true;
                const defs = Store.load('achievementDefs');
                const def = defs.find(d => d.id === id);
                if (def) {
                    this.toast(`🏆 Achievement Unlocked: ${def.icon} ${def.name}!`, 'gold');

                    // Adventure log
                    const log = Store.load('adventureLog');
                    log.push({
                        time: Store.timeOfDay(),
                        text: `🏆 Achievement unlocked: "${def.name}" — ${def.desc}`
                    });
                    Store.save('adventureLog', log);
                }
            }
        }

        if (newUnlock) {
            character.achievements = unlocked;
            Store.save('character', character);
            Shop.render(); // Refresh achievements display
        }
    },

    // --- Toast Notifications ---
    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = { success: '✓', error: '✕', info: 'ℹ', gold: '⭐' };
        toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(30px)';
            toast.style.transition = '0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // --- Greeting ---
    greetAdventurer() {
        const timeOfDay = Store.timeOfDay();
        const settings = Store.load('settings');
        const greetings = {
            'Deep Night': `Burning midnight oil, ${settings.name}? Don't forget to rest.`,
            'Dawn': `A new dawn rises, ${settings.name}. Ready for adventure?`,
            'Morning': `Good morning, ${settings.name}! The quest board awaits.`,
            'Midday': `Midday check-in, ${settings.name}. How's the adventure going?`,
            'Afternoon': `Afternoon, ${settings.name}. Keep pushing — or rest if you need to.`,
            'Dusk': `The sun sets, ${settings.name}. Time to review the day?`,
            'Evening': `Evening, ${settings.name}. Wind down when you're ready.`,
            'Night': `Night falls, ${settings.name}. Consider wrapping up soon.`
        };

        setTimeout(() => {
            this.toast(greetings[timeOfDay] || `Welcome, ${settings.name}!`, 'info');
        }, 500);
    }
};

// --- Start the app ---
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
