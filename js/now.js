/* ============================================
   ADHD Living — Now View
   Home screen: greeting, energy, next quest
   ============================================ */

const Now = {
    init() {
        this.bindEnergy();
        this.bindComplete();
        this.bindStuck();
        this.refresh();
    },

    refresh() {
        this.updateGreeting();
        this.updateEnergy();
        this.updateNextQuest();
        this.updateStats();
    },

    /* --- Greeting --- */
    updateGreeting() {
        const s = Store.load('settings');
        const h = new Date().getHours();
        let g;
        if (h < 6) g = 'Night owl mode';
        else if (h < 12) g = 'Good morning';
        else if (h < 17) g = 'Good afternoon';
        else g = 'Good evening';
        document.getElementById('greeting-text').textContent = g;
        document.getElementById('greeting-name').textContent = s.name || 'Wanderer';
    },

    /* --- Energy --- */
    updateEnergy() {
        const dash = Store.load('dashboard');
        document.querySelectorAll('.energy-opt').forEach(b =>
            b.classList.toggle('active', b.dataset.energy === dash.dayStatus));
    },

    bindEnergy() {
        document.getElementById('energy-options').addEventListener('click', e => {
            const btn = e.target.closest('.energy-opt');
            if (!btn) return;
            const dash = Store.load('dashboard');
            dash.dayStatus = btn.dataset.energy;
            Store.save('dashboard', dash);
            this.updateEnergy();
        });
    },

    /* --- Next Quest --- */
    getNextQuest() {
        const tasks = Store.load('tasks');
        const pri = { boss: 0, survival: 1, side: 2 };
        const active = tasks.filter(t => !t.done);
        active.sort((a, b) => (pri[a.tier] || 1) - (pri[b.tier] || 1));
        return active[0] || null;
    },

    updateNextQuest() {
        const q = this.getNextQuest();
        const nameEl = document.getElementById('next-quest-name');
        const tierEl = document.getElementById('next-quest-tier');
        const hintEl = document.getElementById('next-quest-hint');
        const btn = document.getElementById('complete-next-quest');

        if (q) {
            const icons = { boss: '👹', survival: '🛡', side: '📦' };
            nameEl.textContent = q.name;
            tierEl.textContent = icons[q.tier] || '🛡';
            hintEl.textContent = `+${q.xp || 10} XP  +${q.gold || 5} gold`;
            btn.style.display = '';
        } else {
            nameEl.textContent = 'All done! 🎉';
            tierEl.textContent = '✨';
            hintEl.textContent = 'Add quests in the Quests tab';
            btn.style.display = 'none';
        }
    },

    bindComplete() {
        document.getElementById('complete-next-quest').addEventListener('click', () => {
            const q = this.getNextQuest();
            if (!q) return;
            const tasks = Store.load('tasks');
            const t = tasks.find(x => x.id === q.id);
            if (!t) return;

            t.done = true;
            t.doneDate = Store.today();
            Store.save('tasks', tasks);

            const xp = t.xp || 10;
            const gold = t.gold || 5;
            App.grantXP(xp);
            App.grantGold(gold);
            App.logAdventure(`Completed quest: ${t.name}`);
            App.toast(`+${xp} XP  +${gold} 🪙`, 'success');
            App.checkAchievements();

            this.updateNextQuest();
            this.updateStats();
        });
    },

    /* --- Stats --- */
    updateStats() {
        const tasks = Store.load('tasks');
        const dash = Store.load('dashboard');
        const char = Store.load('character');
        const today = Store.today();
        const done = tasks.filter(t => t.done && t.doneDate === today).length;

        document.getElementById('stat-done').textContent = done;
        document.getElementById('stat-streak').textContent = dash.dayStreak || 0;
        document.getElementById('stat-level').textContent = char.level || 1;
        document.getElementById('stat-gold').textContent = char.gold || 0;
    },

    /* --- Stuck / Transition --- */
    bindStuck() {
        document.getElementById('btn-draw-card').addEventListener('click', () => this.drawCard());
        document.getElementById('drawn-card-done').addEventListener('click', () => {
            document.getElementById('drawn-card').classList.add('hidden');
            App.grantXP(5);
            App.grantGold(2);
            App.toast('+5 XP for doing the thing!', 'success');
        });
        document.getElementById('drawn-card-redraw').addEventListener('click', () => this.drawCard());
        document.getElementById('drawn-card-dismiss').addEventListener('click', () => {
            document.getElementById('drawn-card').classList.add('hidden');
        });
        document.getElementById('btn-supervisor').addEventListener('click', () => Overlays.startSupervisor());
    },

    drawCard() {
        const cards = Store.load('transitionCards');
        if (!cards.length) {
            App.toast('No transition cards! Add some in Settings.', 'error');
            return;
        }
        const card = cards[Math.floor(Math.random() * cards.length)];
        document.getElementById('drawn-card-icon').textContent = card.icon || '🎯';
        document.getElementById('drawn-card-text').textContent = card.name;
        document.getElementById('drawn-card').classList.remove('hidden');
    }
};
