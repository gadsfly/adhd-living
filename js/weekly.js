/* ============================================
   Weekly Plan Module (Campaign)
   Main quests + side quests for the week
   ============================================ */

const Weekly = {
    data: null,

    init() {
        this.data = Store.load('weeklyPlan');
        this.ensureCurrentWeek();
        this.bindEvents();
        this.render();
    },

    ensureCurrentWeek() {
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        const weekStart = monday.toISOString().split('T')[0];

        if (this.data.weekStart !== weekStart) {
            // New week — archive old, start fresh
            if (this.data.weekStart && (this.data.main.length || this.data.side.length)) {
                // Save old week to logs
                const logs = Store.load('logs');
                logs.push({
                    type: 'weekly',
                    date: this.data.weekStart,
                    main: this.data.main,
                    side: this.data.side,
                    review: this.data.review
                });
                Store.save('logs', logs);
            }
            this.data.weekStart = weekStart;
            this.data.main = [];
            this.data.side = [];
            this.data.review = '';
            this.save();
        }

        // Show week range
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const weekRange = document.getElementById('week-range');
        if (weekRange) {
            weekRange.textContent = `${this.formatDate(monday)} — ${this.formatDate(sunday)}`;
        }
    },

    formatDate(d) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    bindEvents() {
        document.getElementById('add-weekly-main').addEventListener('click', () => {
            this.addItem('main');
        });

        document.getElementById('add-weekly-side').addEventListener('click', () => {
            this.addItem('side');
        });

        document.getElementById('save-weekly-review').addEventListener('click', () => {
            this.data.review = document.getElementById('weekly-review').value;
            this.save();
            App.toast('Weekly review saved!', 'success');
        });
    },

    addItem(type) {
        const name = prompt(`New ${type === 'main' ? 'Main' : 'Side'} Quest:`);
        if (!name || !name.trim()) return;

        this.data[type].push({
            id: Store.uid(),
            name: name.trim(),
            completed: false
        });
        this.save();
        this.render();
    },

    toggleItem(type, id) {
        const item = this.data[type].find(i => i.id === id);
        if (item) {
            item.completed = !item.completed;
            if (item.completed) {
                const character = Store.load('character');
                const xpReward = type === 'main' ? 25 : 15;
                const goldReward = type === 'main' ? 15 : 8;
                character.xp += xpReward;
                character.gold += goldReward;

                while (character.xp >= character.xpToNext) {
                    character.xp -= character.xpToNext;
                    character.level++;
                    character.xpToNext = Math.floor(character.xpToNext * 1.3);
                    App.toast(`⬆ LEVEL UP! Level ${character.level}!`, 'gold');
                }
                Store.save('character', character);

                const log = Store.load('adventureLog');
                log.push({
                    time: Store.timeOfDay(),
                    text: `Weekly ${type} quest done: "${item.name}" (+${xpReward}XP)`
                });
                Store.save('adventureLog', log);

                App.toast(`Weekly quest done! +${xpReward}XP +${goldReward}G`, 'gold');
                Dashboard.character = Store.load('character');
                Dashboard.render();
            }
            this.save();
            this.render();
            App.checkAchievements();
        }
    },

    deleteItem(type, id) {
        this.data[type] = this.data[type].filter(i => i.id !== id);
        this.save();
        this.render();
    },

    render() {
        const mainList = document.getElementById('weekly-main-list');
        const sideList = document.getElementById('weekly-side-list');

        const renderList = (items, type, el) => {
            if (!el) return;
            el.innerHTML = items.map(item => `
                <div class="weekly-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
                    <button class="weekly-check" data-type="${type}" data-id="${item.id}">${item.completed ? '✓' : ''}</button>
                    <span class="task-name">${item.name}</span>
                    <button class="task-delete" data-type="${type}" data-id="${item.id}">🗑</button>
                </div>
            `).join('') || '<p class="empty-state" style="padding: 0.5rem">No quests yet</p>';
        };

        renderList(this.data.main, 'main', mainList);
        renderList(this.data.side, 'side', sideList);

        // Review
        const reviewEl = document.getElementById('weekly-review');
        if (reviewEl && this.data.review) {
            reviewEl.value = this.data.review;
        }

        // Bind events
        document.querySelectorAll('.weekly-check').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleItem(btn.dataset.type, btn.dataset.id);
            });
        });

        document.querySelectorAll('.weekly-item .task-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteItem(btn.dataset.type, btn.dataset.id);
            });
        });
    },

    save() {
        Store.save('weeklyPlan', this.data);
    }
};
