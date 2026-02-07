/* ============================================
   ADHD Living — Quests View
   Today tasks, habits, weekly goals
   ============================================ */

const Quests = {
    currentTab: 'today',

    init() {
        this.bindTabs();
        this.bindAdd();
        this.bindLists();
        this.refresh();
    },

    refresh() {
        this.renderToday();
        this.renderHabits();
        this.renderWeekly();
    },

    /* --- Sub-tabs --- */
    bindTabs() {
        document.getElementById('quest-tabs').addEventListener('click', e => {
            const tab = e.target.closest('.sub-tab');
            if (!tab) return;
            this.currentTab = tab.dataset.qtab;
            document.querySelectorAll('.sub-tab').forEach(t =>
                t.classList.toggle('active', t.dataset.qtab === this.currentTab));
            document.querySelectorAll('.quest-panel').forEach(p =>
                p.classList.toggle('active', p.id === `panel-${this.currentTab}`));
        });
    },

    /* --- Add quest/habit/weekly --- */
    bindAdd() {
        // Open modal
        document.getElementById('add-quest-btn').addEventListener('click', () => {
            const modes = { today: 'task', habits: 'habit', weekly: 'weekly-main' };
            const titles = { today: 'New Quest', habits: 'New Habit', weekly: 'New Goal' };
            const mode = modes[this.currentTab] || 'task';
            document.getElementById('add-mode').value = mode;
            document.getElementById('add-modal-title').textContent = titles[this.currentTab] || 'New Quest';
            document.getElementById('add-type-field').style.display = mode === 'task' ? '' : 'none';
            document.getElementById('add-name').value = '';
            document.getElementById('add-modal').classList.remove('hidden');
            setTimeout(() => document.getElementById('add-name').focus(), 100);
        });

        // Type selector
        document.getElementById('type-selector').addEventListener('click', e => {
            const btn = e.target.closest('.type-opt');
            if (!btn) return;
            document.querySelectorAll('.type-opt').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('add-tier').value = btn.dataset.type;
        });

        // Submit form
        document.getElementById('add-form').addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('add-name').value.trim();
            if (!name) return;
            const mode = document.getElementById('add-mode').value;
            const tier = document.getElementById('add-tier').value;

            if (mode === 'task') {
                const tasks = Store.load('tasks');
                const xpMap = { boss: 20, survival: 10, side: 5 };
                const goldMap = { boss: 10, survival: 5, side: 3 };
                tasks.push({
                    id: Store.uid(), name, tier,
                    xp: xpMap[tier] || 10, gold: goldMap[tier] || 5,
                    done: false, doneDate: null, createdDate: Store.today()
                });
                Store.save('tasks', tasks);
            } else if (mode === 'habit') {
                const habits = Store.load('habits');
                habits.push({
                    id: Store.uid(), name, icon: '🔄',
                    streak: 0, playedToday: false, lastPlayed: null
                });
                Store.save('habits', habits);
            } else {
                const wp = Store.load('weeklyPlan');
                const item = { id: Store.uid(), name, done: false };
                if (mode === 'weekly-main') (wp.main = wp.main || []).push(item);
                else (wp.side = wp.side || []).push(item);
                Store.save('weeklyPlan', wp);
            }

            document.getElementById('add-modal').classList.add('hidden');
            this.refresh();
            Now.updateNextQuest();
            Now.updateStats();
            App.toast(`Added: ${name}`, 'success');
        });

        // Close modal
        document.getElementById('add-modal').addEventListener('click', e => {
            if (e.target.id === 'add-modal') e.target.classList.add('hidden');
        });
    },

    /* --- Delegated click handlers for all quest lists --- */
    bindLists() {
        // Today's tasks
        document.getElementById('quest-list-today').addEventListener('click', e => {
            const check = e.target.closest('.quest-item-check');
            if (check) { this.toggleTask(check.dataset.id); return; }
            const del = e.target.closest('.quest-item-delete');
            if (del) this.deleteTask(del.dataset.id);
        });

        // Habits
        document.getElementById('habit-list').addEventListener('click', e => {
            const check = e.target.closest('.quest-item-check');
            if (check) { this.toggleHabit(check.dataset.id); return; }
            const del = e.target.closest('.quest-item-delete');
            if (del) this.deleteHabit(del.dataset.id);
        });

        // Weekly
        ['weekly-main-list', 'weekly-side-list'].forEach(id => {
            document.getElementById(id).addEventListener('click', e => {
                const check = e.target.closest('.quest-item-check');
                if (check) { this.toggleWeekly(check.dataset.id); return; }
                const del = e.target.closest('.quest-item-delete');
                if (del) this.deleteWeekly(del.dataset.id);
            });
        });
    },

    /* --- Today Tasks --- */
    renderToday() {
        const tasks = Store.load('tasks');
        const list = document.getElementById('quest-list-today');
        const empty = document.getElementById('empty-today');
        list.innerHTML = '';

        const pri = { boss: 0, survival: 1, side: 2 };
        const sorted = [...tasks].sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            return (pri[a.tier] || 1) - (pri[b.tier] || 1);
        });

        empty.style.display = sorted.length ? 'none' : '';
        const icons = { boss: '👹', survival: '🛡', side: '📦' };

        sorted.forEach(t => {
            const el = document.createElement('div');
            el.className = `quest-item${t.done ? ' completed' : ''}`;
            el.dataset.tier = t.tier;
            el.innerHTML = `
                <button class="quest-item-check" data-id="${t.id}">${t.done ? '✓' : ''}</button>
                <span class="quest-item-name">${t.name}</span>
                <span class="quest-item-tier">${icons[t.tier] || '🛡'}</span>
                <button class="quest-item-delete" data-id="${t.id}">✕</button>`;
            list.appendChild(el);
        });
    },

    toggleTask(id) {
        const tasks = Store.load('tasks');
        const t = tasks.find(x => x.id === id);
        if (!t) return;

        if (!t.done) {
            t.done = true;
            t.doneDate = Store.today();
            Store.save('tasks', tasks);
            App.grantXP(t.xp || 10);
            App.grantGold(t.gold || 5);
            App.logAdventure(`Completed: ${t.name}`);
            App.toast(`+${t.xp || 10} XP  +${t.gold || 5} 🪙`, 'success');
        } else {
            t.done = false;
            t.doneDate = null;
            Store.save('tasks', tasks);
        }
        this.renderToday();
        Now.updateNextQuest();
        Now.updateStats();
        App.checkAchievements();
    },

    deleteTask(id) {
        let tasks = Store.load('tasks');
        tasks = tasks.filter(t => t.id !== id);
        Store.save('tasks', tasks);
        this.renderToday();
        Now.updateNextQuest();
        Now.updateStats();
    },

    /* --- Habits --- */
    renderHabits() {
        const habits = Store.load('habits');
        const list = document.getElementById('habit-list');
        const empty = document.getElementById('empty-habits');
        list.innerHTML = '';

        const today = Store.today();
        // Reset played status for new day
        habits.forEach(h => {
            if (h.lastPlayed !== today) h.playedToday = false;
        });
        Store.save('habits', habits);

        empty.style.display = habits.length ? 'none' : '';

        habits.forEach(h => {
            const el = document.createElement('div');
            el.className = `quest-item${h.playedToday ? ' completed' : ''}`;
            el.innerHTML = `
                <button class="quest-item-check" data-id="${h.id}">${h.playedToday ? '✓' : ''}</button>
                <span class="quest-item-name">${h.name}</span>
                <span class="habit-item-streak">${h.streak || 0}🔥</span>
                <button class="quest-item-delete" data-id="${h.id}">✕</button>`;
            list.appendChild(el);
        });
    },

    toggleHabit(id) {
        const habits = Store.load('habits');
        const h = habits.find(x => x.id === id);
        if (!h) return;
        const today = Store.today();

        if (!h.playedToday) {
            h.playedToday = true;
            h.lastPlayed = today;
            h.streak = (h.streak || 0) + 1;
            App.grantXP(8);
            App.grantGold(3);
            App.toast('+8 XP  🔥 Habit done!', 'success');

            let combo = Store.load('habitCombo') || 0;
            Store.save('habitCombo', combo + 1);
        } else {
            h.playedToday = false;
            h.streak = Math.max(0, (h.streak || 1) - 1);
        }
        Store.save('habits', habits);
        this.renderHabits();
        App.checkAchievements();
    },

    deleteHabit(id) {
        let habits = Store.load('habits');
        habits = habits.filter(h => h.id !== id);
        Store.save('habits', habits);
        this.renderHabits();
    },

    /* --- Weekly --- */
    renderWeekly() {
        const wp = Store.load('weeklyPlan');
        const mainList = document.getElementById('weekly-main-list');
        const sideList = document.getElementById('weekly-side-list');
        const empty = document.getElementById('empty-weekly');
        const label = document.getElementById('week-label');

        // Week range
        const now = new Date();
        const day = now.getDay();
        const mon = new Date(now);
        mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        label.textContent = `${mon.toLocaleDateString()} — ${sun.toLocaleDateString()}`;

        mainList.innerHTML = '';
        sideList.innerHTML = '';

        const hasItems = (wp.main?.length || 0) + (wp.side?.length || 0);
        empty.style.display = hasItems ? 'none' : '';

        const render = (item, container) => {
            const el = document.createElement('div');
            el.className = `quest-item${item.done ? ' completed' : ''}`;
            el.innerHTML = `
                <button class="quest-item-check" data-id="${item.id}">${item.done ? '✓' : ''}</button>
                <span class="quest-item-name">${item.name}</span>
                <button class="quest-item-delete" data-id="${item.id}">✕</button>`;
            container.appendChild(el);
        };

        (wp.main || []).forEach(i => render(i, mainList));
        (wp.side || []).forEach(i => render(i, sideList));
    },

    toggleWeekly(id) {
        const wp = Store.load('weeklyPlan');
        const item = (wp.main || []).find(i => i.id === id) || (wp.side || []).find(i => i.id === id);
        if (!item) return;

        item.done = !item.done;
        if (item.done) {
            App.grantXP(15);
            App.grantGold(8);
            App.toast('+15 XP  Weekly goal done!', 'success');
        }
        Store.save('weeklyPlan', wp);
        this.renderWeekly();
    },

    deleteWeekly(id) {
        const wp = Store.load('weeklyPlan');
        wp.main = (wp.main || []).filter(i => i.id !== id);
        wp.side = (wp.side || []).filter(i => i.id !== id);
        Store.save('weeklyPlan', wp);
        this.renderWeekly();
    }
};
