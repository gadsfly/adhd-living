/* ============================================
   Backlog Module (The Vault)
   Long-term storage for "someday" items
   ============================================ */

const Backlog = {
    data: [],
    filter: 'all',

    init() {
        this.data = Store.load('backlog');
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('add-backlog-btn').addEventListener('click', () => {
            document.getElementById('backlog-modal').classList.add('open');
        });

        document.getElementById('backlog-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addItem();
        });

        document.querySelectorAll('#backlog-modal .modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('backlog-modal').classList.remove('open');
            });
        });

        // Filters
        document.querySelectorAll('.backlog-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.backlog-filters .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filter = btn.dataset.filter;
                this.render();
            });
        });
    },

    addItem() {
        const name = document.getElementById('backlog-name').value.trim();
        if (!name) return;

        this.data.push({
            id: Store.uid(),
            name,
            category: document.getElementById('backlog-category').value,
            notes: document.getElementById('backlog-notes').value.trim(),
            createdDate: Store.today(),
            pulledCount: 0
        });

        this.save();
        this.render();
        document.getElementById('backlog-form').reset();
        document.getElementById('backlog-modal').classList.remove('open');
        App.toast(`Stored in vault: ${name}`, 'success');
    },

    pullToTasks(id) {
        const item = this.data.find(i => i.id === id);
        if (!item) return;

        // Create a side quest from the vault item
        const tasks = Store.load('tasks');
        tasks.push({
            id: Store.uid(),
            name: item.name,
            tier: 'side',
            energy: 1,
            xp: 15,
            gold: 10,
            notes: `From vault: ${item.notes || ''}`,
            completed: false,
            completedDate: null,
            createdDate: Store.today()
        });
        Store.save('tasks', tasks);

        item.pulledCount++;
        this.save();
        Tasks.data = tasks;
        Tasks.render();
        App.toast(`Pulled "${item.name}" to Quest Board!`, 'info');
        App.checkAchievements();
    },

    deleteItem(id) {
        this.data = this.data.filter(i => i.id !== id);
        this.save();
        this.render();
    },

    getCategoryIcon(cat) {
        const icons = { action: '🔧', project: '📁', wishlist: '⭐', media: '🎬' };
        return icons[cat] || '📦';
    },

    render() {
        const list = document.getElementById('backlog-list');
        if (!list) return;

        let items = this.data;
        if (this.filter !== 'all') {
            items = items.filter(i => i.category === this.filter);
        }

        list.innerHTML = items.map(item => `
            <div class="backlog-item" data-id="${item.id}">
                <span class="backlog-category-icon">${this.getCategoryIcon(item.category)}</span>
                <div class="backlog-info">
                    <div class="name">${item.name}</div>
                    ${item.notes ? `<div class="notes">${item.notes}</div>` : ''}
                </div>
                <div class="backlog-actions">
                    <button class="pull-btn" data-id="${item.id}" title="Pull to Quest Board">⚔ Pull</button>
                    <button class="delete-backlog-btn" data-id="${item.id}" title="Delete">🗑</button>
                </div>
            </div>
        `).join('') || '<p class="empty-state">The vault is empty. Store things for later!</p>';

        list.querySelectorAll('.pull-btn').forEach(btn => {
            btn.addEventListener('click', () => this.pullToTasks(btn.dataset.id));
        });

        list.querySelectorAll('.delete-backlog-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteItem(btn.dataset.id));
        });
    },

    // Get random item for AI weekly suggestion
    getRandomItem() {
        if (this.data.length === 0) return null;
        return this.data[Math.floor(Math.random() * this.data.length)];
    },

    save() {
        Store.save('backlog', this.data);
    }
};
