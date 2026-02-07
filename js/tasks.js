/* ============================================
   Tasks Module (Quest Board)
   Daily tasks with boss/survival/side tiers
   ============================================ */

const Tasks = {
    data: [],

    init() {
        this.data = Store.load('tasks');
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        // Add task button
        document.getElementById('add-task-btn').addEventListener('click', () => {
            document.getElementById('task-modal').classList.add('open');
        });

        // Task form submit
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Modal close
        document.querySelectorAll('#task-modal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('task-modal').classList.remove('open');
            });
        });
    },

    addTask() {
        const name = document.getElementById('task-name').value.trim();
        if (!name) return;

        const task = {
            id: Store.uid(),
            name,
            tier: document.getElementById('task-tier').value,
            energy: parseInt(document.getElementById('task-energy').value),
            xp: parseInt(document.getElementById('task-xp').value),
            gold: parseInt(document.getElementById('task-gold').value),
            notes: document.getElementById('task-notes').value.trim(),
            completed: false,
            completedDate: null,
            createdDate: Store.today()
        };

        // Also add as transition card if checked
        if (document.getElementById('task-transition').checked) {
            const cards = Store.load('transitionCards');
            cards.push({ id: Store.uid(), name: task.name, icon: '📋' });
            Store.save('transitionCards', cards);
        }

        this.data.push(task);
        this.save();
        this.render();

        // Reset form & close modal
        document.getElementById('task-form').reset();
        document.getElementById('task-modal').classList.remove('open');
        App.toast(`Quest added: ${name}`, 'success');
    },

    toggleTask(id) {
        const task = this.data.find(t => t.id === id);
        if (!task) return;

        if (!task.completed) {
            task.completed = true;
            task.completedDate = Store.today();

            // Award XP and gold
            const character = Store.load('character');
            character.xp += task.xp;
            character.gold += task.gold;

            // Check level up
            while (character.xp >= character.xpToNext) {
                character.xp -= character.xpToNext;
                character.level++;
                character.xpToNext = Math.floor(character.xpToNext * 1.3);
                App.toast(`⬆ LEVEL UP! You are now Level ${character.level}!`, 'gold');

                // Add adventure log
                const log = Store.load('adventureLog');
                log.push({
                    time: Store.timeOfDay(),
                    text: `The wanderer has reached Level ${character.level}!`
                });
                Store.save('adventureLog', log);
            }

            Store.save('character', character);

            // Adventure log
            const log = Store.load('adventureLog');
            log.push({
                time: Store.timeOfDay(),
                text: `Completed quest: "${task.name}" (+${task.xp}XP, +${task.gold}G)`
            });
            Store.save('adventureLog', log);

            App.toast(`Quest complete! +${task.xp}XP +${task.gold}G`, 'gold');

            // Check achievements
            App.checkAchievements();
        } else {
            task.completed = false;
            task.completedDate = null;
        }

        this.save();
        this.render();
        Dashboard.character = Store.load('character');
        Dashboard.render();
    },

    deleteTask(id) {
        this.data = this.data.filter(t => t.id !== id);
        this.save();
        this.render();
    },

    render() {
        const lists = {
            boss: document.getElementById('task-list-boss'),
            survival: document.getElementById('task-list-survival'),
            side: document.getElementById('task-list-side')
        };

        const dayStatus = Store.load('dashboard').dayStatus;

        for (const [tier, el] of Object.entries(lists)) {
            if (!el) continue;
            let tasks = this.data.filter(t => t.tier === tier);

            // Sort: incomplete first, then completed
            tasks.sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0));

            // In red (low power) mode, dim boss tasks
            el.innerHTML = tasks.map(t => {
                const dimmed = dayStatus === 'red' && tier === 'boss' && !t.completed;
                return `
                    <div class="task-item ${t.completed ? 'completed' : ''} ${dimmed ? 'dimmed' : ''}" data-tier="${t.tier}" data-id="${t.id}">
                        <button class="task-check" data-id="${t.id}">${t.completed ? '✓' : ''}</button>
                        <span class="task-name">${t.name}</span>
                        <span class="task-rewards">
                            <span title="XP">⭐${t.xp}</span>
                            <span title="Gold">🪙${t.gold}</span>
                        </span>
                        <button class="task-delete" data-id="${t.id}" title="Delete">🗑</button>
                    </div>
                `;
            }).join('') || '<p class="empty-state">No quests yet</p>';
        }

        // Bind check/delete
        document.querySelectorAll('.task-check').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTask(btn.dataset.id);
            });
        });

        document.querySelectorAll('.task-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(btn.dataset.id);
            });
        });
    },

    save() {
        Store.save('tasks', this.data);
    }
};
