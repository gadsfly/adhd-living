/* ============================================
   Transition Cards Module
   Random draw system for when stuck
   ============================================ */

const Transition = {
    data: [],

    init() {
        this.data = Store.load('transitionCards');
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('draw-transition-btn').addEventListener('click', () => {
            this.drawCard();
        });

        document.getElementById('card-back').addEventListener('click', () => {
            this.drawCard();
        });

        document.getElementById('redraw-card').addEventListener('click', () => {
            this.drawCard();
        });

        document.getElementById('complete-drawn-card').addEventListener('click', () => {
            this.completeDrawn();
        });

        document.getElementById('add-transition-btn').addEventListener('click', () => {
            document.getElementById('transition-modal').classList.add('open');
        });

        document.getElementById('transition-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCard();
        });

        document.querySelectorAll('#transition-modal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('transition-modal').classList.remove('open');
            });
        });
    },

    drawCard() {
        if (this.data.length === 0) {
            App.toast('No transition cards! Add some first.', 'error');
            return;
        }

        const card = this.data[Math.floor(Math.random() * this.data.length)];

        // Hide back, show front
        document.getElementById('card-back').classList.add('hidden');
        const front = document.getElementById('card-front');
        front.classList.remove('hidden');
        front.dataset.id = card.id;

        document.getElementById('card-front-icon').textContent = card.icon;
        document.getElementById('card-front-text').textContent = card.name;

        // Animate
        front.style.animation = 'none';
        front.offsetHeight; // reflow
        front.style.animation = 'fadeIn 0.5s ease';
    },

    completeDrawn() {
        const front = document.getElementById('card-front');
        const text = document.getElementById('card-front-text').textContent;

        // Small XP reward for doing transition activity
        const character = Store.load('character');
        character.xp += 3;
        character.gold += 2;
        Store.save('character', character);

        const log = Store.load('adventureLog');
        log.push({
            time: Store.timeOfDay(),
            text: `Completed transition: "${text}" (+3XP)`
        });
        Store.save('adventureLog', log);

        App.toast(`Transition done: ${text} +3XP`, 'success');

        // Reset to card back
        front.classList.add('hidden');
        document.getElementById('card-back').classList.remove('hidden');

        Dashboard.character = Store.load('character');
        Dashboard.render();
    },

    addCard() {
        const name = document.getElementById('transition-name').value.trim();
        if (!name) return;

        this.data.push({
            id: Store.uid(),
            name,
            icon: document.getElementById('transition-icon').value || '🎯'
        });

        this.save();
        this.render();
        document.getElementById('transition-form').reset();
        document.getElementById('transition-icon').value = '🎯';
        document.getElementById('transition-modal').classList.remove('open');
        App.toast(`Transition card added: ${name}`, 'success');
    },

    removeCard(id) {
        this.data = this.data.filter(c => c.id !== id);
        this.save();
        this.render();
    },

    render() {
        const list = document.getElementById('transition-cards-list');
        if (!list) return;

        list.innerHTML = this.data.map(c => `
            <span class="transition-pool-item" data-id="${c.id}">
                ${c.icon} ${c.name}
                <span class="remove-transition" data-id="${c.id}">✕</span>
            </span>
        `).join('') || '<span class="empty-state" style="font-size: 0.8rem">No cards in pool</span>';

        list.querySelectorAll('.remove-transition').forEach(btn => {
            btn.addEventListener('click', () => {
                this.removeCard(btn.dataset.id);
            });
        });
    },

    save() {
        Store.save('transitionCards', this.data);
    }
};
