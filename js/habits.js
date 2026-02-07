/* ============================================
   Habits Module (Card Deck)
   Streak-based habit tracking with combos
   ============================================ */

const Habits = {
    data: [],
    combo: 0,

    init() {
        this.data = Store.load('habits');
        this.combo = Store.load('habitCombo') || 0;
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('add-habit-btn').addEventListener('click', () => {
            document.getElementById('habit-modal').classList.add('open');
        });

        document.getElementById('habit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addHabit();
        });

        document.querySelectorAll('#habit-modal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('habit-modal').classList.remove('open');
            });
        });
    },

    addHabit() {
        const name = document.getElementById('habit-name').value.trim();
        if (!name) return;

        this.data.push({
            id: Store.uid(),
            name,
            tier: document.getElementById('habit-tier').value,
            xp: parseInt(document.getElementById('habit-xp').value),
            icon: document.getElementById('habit-icon').value || '✨',
            streak: 0,
            playedDates: [],
            totalPlays: 0
        });

        this.save();
        this.render();
        document.getElementById('habit-form').reset();
        document.getElementById('habit-icon').value = '✨';
        document.getElementById('habit-modal').classList.remove('open');
        App.toast(`Habit card created: ${name}`, 'success');
    },

    playCard(id) {
        const habit = this.data.find(h => h.id === id);
        if (!habit) return;

        const today = Store.today();
        if (habit.playedDates.includes(today)) {
            // Undo
            habit.playedDates = habit.playedDates.filter(d => d !== today);
            habit.totalPlays = Math.max(0, habit.totalPlays - 1);
            this.combo = Math.max(0, this.combo - 1);
        } else {
            habit.playedDates.push(today);
            habit.totalPlays++;

            // Update streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            if (habit.playedDates.includes(yesterdayStr)) {
                habit.streak++;
            } else {
                habit.streak = 1;
            }

            // Combo system
            this.combo++;
            const comboMultiplier = Math.min(3, 1 + (this.combo - 1) * 0.2);
            const xpEarned = Math.round(habit.xp * comboMultiplier);

            // Award XP
            const character = Store.load('character');
            character.xp += xpEarned;
            character.gold += Math.round(xpEarned / 3);

            while (character.xp >= character.xpToNext) {
                character.xp -= character.xpToNext;
                character.level++;
                character.xpToNext = Math.floor(character.xpToNext * 1.3);
                App.toast(`⬆ LEVEL UP! Level ${character.level}!`, 'gold');
            }
            Store.save('character', character);

            // Adventure log
            const log = Store.load('adventureLog');
            log.push({
                time: Store.timeOfDay(),
                text: `Played habit card: "${habit.name}" (+${xpEarned}XP, ${this.combo}x combo)`
            });
            Store.save('adventureLog', log);

            App.toast(`${habit.icon} ${habit.name}! +${xpEarned}XP (${this.combo}x combo)`, 'gold');
            Dashboard.character = Store.load('character');
            Dashboard.render();
            App.checkAchievements();
        }

        this.save();
        this.render();
    },

    deleteHabit(id) {
        this.data = this.data.filter(h => h.id !== id);
        this.save();
        this.render();
    },

    render() {
        const today = Store.today();
        const tiers = { main: 'habit-cards-main', survival: 'habit-cards-survival', light: 'habit-cards-light' };

        for (const [tier, containerId] of Object.entries(tiers)) {
            const container = document.getElementById(containerId);
            if (!container) continue;

            const habits = this.data.filter(h => h.tier === tier);
            container.innerHTML = habits.map(h => {
                const played = h.playedDates.includes(today);
                return `
                    <div class="habit-card ${played ? 'played' : ''}" data-id="${h.id}">
                        <button class="habit-card-delete" data-id="${h.id}">✕</button>
                        <span class="habit-card-icon">${h.icon}</span>
                        <span class="habit-card-name">${h.name}</span>
                        <span class="habit-card-streak">${h.streak > 0 ? `🔥 ${h.streak}d` : ''}</span>
                    </div>
                `;
            }).join('') || '<p class="empty-state" style="padding: 0.5rem; font-size: 0.8rem">No cards in this tier</p>';
        }

        // Combo display
        const comboCount = document.getElementById('combo-count');
        const comboBonus = document.getElementById('combo-bonus');
        if (comboCount) comboCount.textContent = this.combo;
        if (comboBonus) {
            if (this.combo >= 5) comboBonus.textContent = '🔥 ON FIRE! x2.0 XP';
            else if (this.combo >= 3) comboBonus.textContent = '⚡ x1.4 XP';
            else if (this.combo >= 1) comboBonus.textContent = `x${(1 + (this.combo - 1) * 0.2).toFixed(1)} XP`;
            else comboBonus.textContent = 'Play cards to build combo!';
        }

        // Bind card clicks
        document.querySelectorAll('.habit-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('habit-card-delete')) return;
                this.playCard(card.dataset.id);
            });
        });

        document.querySelectorAll('.habit-card-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteHabit(btn.dataset.id);
            });
        });
    },

    save() {
        Store.save('habits', this.data);
        Store.save('habitCombo', this.combo);
    }
};
