/* ============================================
   ADHD Living — Main App Controller
   Navigation, toast, init
   ============================================ */

const App = {
    currentView: 'now',

    init() {
        this.initTheme();
        this.initDayStreak();
        this.initNav();

        Now.init();
        Quests.init();
        Log.init();
        Me.init();
        Overlays.init();

        console.log('⚔ ADHD Living initialized');
    },

    /* --- Navigation --- */
    initNav() {
        document.getElementById('bottom-nav').addEventListener('click', e => {
            const tab = e.target.closest('.nav-tab');
            if (!tab) return;
            this.switchView(tab.dataset.view);
        });
    },

    switchView(id) {
        this.currentView = id;
        document.querySelectorAll('.nav-tab').forEach(t =>
            t.classList.toggle('active', t.dataset.view === id));
        document.querySelectorAll('.view').forEach(v =>
            v.classList.toggle('active', v.id === `view-${id}`));
        if (id === 'now') Now.refresh();
        else if (id === 'quests') Quests.refresh();
        else if (id === 'log') Log.refresh();
        else if (id === 'me') Me.refresh();
    },

    /* --- Theme --- */
    initTheme() {
        const s = Store.load('settings');
        document.documentElement.setAttribute('data-theme', s.theme || 'light');
    },

    /* --- Day Streak --- */
    initDayStreak() {
        const dash = Store.load('dashboard');
        const today = Store.today();
        if (dash.lastActiveDate !== today) {
            const y = new Date();
            y.setDate(y.getDate() - 1);
            const yStr = y.toISOString().split('T')[0];
            if (dash.lastActiveDate === yStr) {
                dash.dayStreak = (dash.dayStreak || 0) + 1;
            } else if (dash.lastActiveDate) {
                dash.dayStreak = 0;
            }
            dash.lastActiveDate = today;
            Store.save('dashboard', dash);
        }
    },

    /* --- XP & Gold --- */
    grantXP(amount) {
        const c = Store.load('character');
        c.xp += amount;
        while (c.xp >= c.xpToNext) {
            c.xp -= c.xpToNext;
            c.level++;
            c.xpToNext = Math.floor(c.xpToNext * 1.5);
            this.toast(`⭐ Level up! Now Lv.${c.level}!`, 'gold');
            this.logAdventure(`Leveled up to Lv.${c.level}!`);
        }
        Store.save('character', c);
    },

    grantGold(amount) {
        const c = Store.load('character');
        c.gold += amount;
        Store.save('character', c);
    },

    /* --- Adventure Log --- */
    logAdventure(text) {
        const log = Store.load('adventureLog');
        log.unshift({ time: Store.timeOfDay(), text });
        if (log.length > 100) log.length = 100;
        Store.save('adventureLog', log);
    },

    /* --- Achievements --- */
    checkAchievements() {
        const c = Store.load('character');
        const d = Store.load('dashboard');
        const tasks = Store.load('tasks');
        const defs = Store.load('achievementDefs');
        const unlocked = c.achievements || [];
        const today = Store.today();
        const doneToday = tasks.filter(t => t.done && t.doneDate === today).length;
        const bossAll = tasks.filter(t => t.done && t.tier === 'boss').length;

        defs.forEach(a => {
            if (unlocked.includes(a.id)) return;
            let met = false;
            if (a.condition === 'tasks_1') met = doneToday >= 1;
            else if (a.condition === 'streak_3') met = d.dayStreak >= 3;
            else if (a.condition === 'streak_7') met = d.dayStreak >= 7;
            else if (a.condition === 'boss_5') met = bossAll >= 5;
            else if (a.condition === 'level_5') met = c.level >= 5;
            else if (a.condition === 'level_10') met = c.level >= 10;
            else if (a.condition === 'gold_500') met = c.gold >= 500;
            else if (a.condition === 'combo_5') met = (Store.load('habitCombo') || 0) >= 5;
            if (met) {
                unlocked.push(a.id);
                this.toast(`🏆 ${a.name}!`, 'gold');
                this.logAdventure(`Achievement unlocked: ${a.name}`);
            }
        });
        c.achievements = unlocked;
        Store.save('character', c);
    },

    /* --- Toast --- */
    toast(msg, type = 'success', dur = 2500) {
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.textContent = msg;
        document.getElementById('toast-container').appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 300);
        }, dur);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
