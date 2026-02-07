/* ============================================
   Dashboard Module
   Status bars, buffs/debuffs, quick actions
   ============================================ */

const Dashboard = {
    data: null,
    character: null,

    init() {
        this.data = Store.load('dashboard');
        this.character = Store.load('character');
        this.checkDayStreak();
        this.bindEvents();
        this.render();
    },

    checkDayStreak() {
        const today = Store.today();
        const lastActive = this.data.lastActiveDate;
        if (!lastActive) {
            this.data.dayStreak = 1;
        } else if (lastActive === today) {
            // Same day, do nothing
        } else {
            const last = new Date(lastActive);
            const now = new Date(today);
            const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
            if (diff === 1) {
                this.data.dayStreak++;
            } else if (diff > 1) {
                this.data.dayStreak = 1;
            }
        }
        this.data.lastActiveDate = today;
        this.save();
    },

    bindEvents() {
        // Day status buttons
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.data.dayStatus = btn.dataset.status;
                this.save();
                App.toast(`Day status: ${btn.textContent.trim()}`, 'info');
            });
        });

        // Stat sliders
        document.querySelectorAll('.stat-slider').forEach(slider => {
            slider.addEventListener('input', () => {
                const stat = slider.dataset.stat;
                const val = parseInt(slider.value);
                slider.style.setProperty('--val', val + '%');
                slider.nextElementSibling.textContent = val;
                this.data.stats[stat] = val;
                this.updateBars();
                this.save();
            });
        });

        // Buff select
        document.getElementById('buff-select').addEventListener('change', (e) => {
            if (!e.target.value) return;
            const opt = e.target.options[e.target.selectedIndex];
            const buffType = opt.dataset.type || 'buff';
            const existing = this.data.buffs.find(b => b.id === e.target.value);
            if (!existing) {
                this.data.buffs.push({
                    id: e.target.value,
                    name: opt.textContent.trim(),
                    type: buffType
                });
                this.save();
                this.renderBuffs();
            }
            e.target.value = '';
        });

        // Quick actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'draw-transition') App.navigate('transition');
                else if (action === 'supervisor-mode') App.navigate('supervisor');
                else if (action === 'ai-check-in') App.navigate('ai');
                else if (action === 'quick-log') App.navigate('records');
            });
        });
    },

    updateBars() {
        const s = this.data.stats;
        const hp = Math.round((s.stamina + s.diet + s.sleep) / 3);
        const mp = Math.round((s.spirit + s.focus + s.mood) / 3);

        this.data.hp = hp;
        this.data.mp = mp;

        // Update HP/MP display
        const hpFill = document.getElementById('hp-fill');
        const mpFill = document.getElementById('mp-fill');
        const hpLabel = document.getElementById('hp-label');
        const mpLabel = document.getElementById('mp-label');

        if (hpFill) hpFill.style.width = hp + '%';
        if (mpFill) mpFill.style.width = mp + '%';
        if (hpLabel) hpLabel.textContent = `${hp}/100`;
        if (mpLabel) mpLabel.textContent = `${mp}/100`;

        // Mini bars in topbar
        const miniHp = document.getElementById('mini-hp-fill');
        const miniMp = document.getElementById('mini-mp-fill');
        if (miniHp) miniHp.style.width = hp + '%';
        if (miniMp) miniMp.style.width = mp + '%';

        // XP bar
        const xpPct = Math.min(100, (this.character.xp / this.character.xpToNext) * 100);
        const miniXp = document.getElementById('mini-xp-fill');
        if (miniXp) miniXp.style.width = xpPct + '%';

        // Store HP/MP on character too for other modules
        this.character.hp = hp;
        this.character.mp = mp;
        Store.save('character', this.character);
    },

    renderBuffs() {
        const grid = document.getElementById('buff-grid');
        if (!grid) return;
        grid.innerHTML = this.data.buffs.map(b => `
            <span class="buff-tag ${b.type}" data-id="${b.id}">
                ${b.name}
                <span class="remove-buff" data-id="${b.id}">✕</span>
            </span>
        `).join('');

        grid.querySelectorAll('.remove-buff').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.data.buffs = this.data.buffs.filter(b => b.id !== id);
                this.save();
                this.renderBuffs();
            });
        });
    },

    render() {
        // Set day status
        document.querySelectorAll('.status-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.status === this.data.dayStatus);
        });

        // Set slider values
        for (const [stat, val] of Object.entries(this.data.stats)) {
            const slider = document.querySelector(`.stat-slider[data-stat="${stat}"]`);
            if (slider) {
                slider.value = val;
                slider.style.setProperty('--val', val + '%');
                const valSpan = slider.nextElementSibling;
                if (valSpan) valSpan.textContent = val;
            }
        }

        this.updateBars();
        this.renderBuffs();
        this.renderSummary();

        // Gold & level
        document.getElementById('gold-count').textContent = this.character.gold;
        document.getElementById('level-badge').textContent = `Lv.${this.character.level}`;
    },

    renderSummary() {
        const today = Store.today();
        const tasks = Store.load('tasks');
        const habits = Store.load('habits');

        const tasksDone = tasks.filter(t => t.completed && t.completedDate === today).length;
        const habitsDone = habits.filter(h => h.playedDates && h.playedDates.includes(today)).length;

        document.getElementById('tasks-done-today').textContent = tasksDone;
        document.getElementById('habits-done-today').textContent = habitsDone;
        document.getElementById('xp-earned-today').textContent = this.character.xp;
        document.getElementById('streak-count').textContent = this.data.dayStreak;
    },

    save() {
        Store.save('dashboard', this.data);
    }
};
