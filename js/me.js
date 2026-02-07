/* ============================================
   ADHD Living — Me View
   Profile, vault, shop, achievements, history, settings
   ============================================ */

const Me = {
    init() {
        this.bindMenu();
        this.bindBacks();
        this.bindVault();
        this.bindShop();
        this.bindSettings();
        this.refresh();
    },

    refresh() { this.renderProfile(); },

    /* --- Profile Card --- */
    renderProfile() {
        const c = Store.load('character');
        const s = Store.load('settings');
        const d = Store.load('dashboard');

        const avatars = { ranger: '🏹', mage: '🧙', warrior: '⚔', rogue: '🗡', healer: '💚', bard: '🎵' };
        document.getElementById('me-avatar').textContent = avatars[s.charClass] || '🧙';
        document.getElementById('me-name').textContent = s.name || 'Wanderer';
        document.getElementById('me-class').textContent =
            (s.charClass || 'ranger').charAt(0).toUpperCase() + (s.charClass || 'ranger').slice(1);
        document.getElementById('me-gold').textContent = c.gold || 0;
        document.getElementById('me-level').textContent = c.level || 1;
        document.getElementById('me-streak').textContent = d.dayStreak || 0;

        const pct = c.xpToNext ? (c.xp / c.xpToNext * 100) : 0;
        document.getElementById('me-xp-fill').style.width = pct + '%';
        document.getElementById('me-xp-label').textContent = `${c.xp || 0} / ${c.xpToNext || 100} XP`;
    },

    /* --- Menu → Open Panel --- */
    bindMenu() {
        document.querySelectorAll('.me-menu-item').forEach(btn => {
            btn.addEventListener('click', () => this.openPanel(btn.dataset.panel));
        });
    },

    openPanel(name) {
        const panel = document.getElementById(`${name}-panel`);
        if (!panel) return;
        panel.classList.remove('hidden');
        if (name === 'vault') this.renderVault();
        else if (name === 'shop') this.renderShop();
        else if (name === 'achievements') this.renderAchievements();
        else if (name === 'history') this.renderHistory();
        else if (name === 'settings') this.loadSettings();
        else if (name === 'ai') Overlays.openAI();
    },

    bindBacks() {
        ['vault-back', 'shop-back', 'achievements-back', 'history-back', 'settings-back', 'ai-back'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => btn.closest('.panel').classList.add('hidden'));
        });
    },

    /* ========== VAULT ========== */
    vaultFilter: 'all',

    bindVault() {
        // Filters
        document.querySelector('.vault-filters')?.addEventListener('click', e => {
            const chip = e.target.closest('.filter-chip');
            if (!chip) return;
            document.querySelectorAll('.vault-filters .filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            this.vaultFilter = chip.dataset.filter;
            this.renderVault();
        });

        // Add button → modal
        document.getElementById('add-vault-btn')?.addEventListener('click', () => {
            document.getElementById('vault-modal').classList.remove('hidden');
            setTimeout(() => document.getElementById('vault-name').focus(), 100);
        });

        // Vault form
        document.getElementById('vault-form')?.addEventListener('submit', e => {
            e.preventDefault();
            const name = document.getElementById('vault-name').value.trim();
            if (!name) return;
            const backlog = Store.load('backlog');
            backlog.push({
                id: Store.uid(), name,
                category: document.getElementById('vault-category').value,
                notes: document.getElementById('vault-notes').value,
                date: Store.today()
            });
            Store.save('backlog', backlog);
            document.getElementById('vault-modal').classList.add('hidden');
            document.getElementById('vault-form').reset();
            this.renderVault();
            App.toast('Stored in vault!', 'success');
        });

        // Close vault modal
        document.getElementById('vault-modal')?.addEventListener('click', e => {
            if (e.target.id === 'vault-modal') e.target.classList.add('hidden');
        });

        // Vault list actions (delegated)
        document.getElementById('vault-list')?.addEventListener('click', e => {
            const promote = e.target.closest('[data-promote]');
            if (promote) {
                const backlog = Store.load('backlog');
                const item = backlog.find(b => b.id === promote.dataset.promote);
                if (item) {
                    const tasks = Store.load('tasks');
                    tasks.push({
                        id: Store.uid(), name: item.name, tier: 'side',
                        xp: 10, gold: 5, done: false, doneDate: null, createdDate: Store.today()
                    });
                    Store.save('tasks', tasks);
                    App.toast('Promoted to quest!', 'success');
                }
                return;
            }
            const del = e.target.closest('[data-delete]');
            if (del) {
                let bl = Store.load('backlog');
                bl = bl.filter(b => b.id !== del.dataset.delete);
                Store.save('backlog', bl);
                this.renderVault();
            }
        });
    },

    renderVault() {
        const backlog = Store.load('backlog');
        const list = document.getElementById('vault-list');
        list.innerHTML = '';
        const filter = this.vaultFilter;
        const filtered = filter === 'all' ? backlog : backlog.filter(b => b.category === filter);
        const icons = { action: '🔧', project: '📁', wishlist: '⭐', media: '🎬' };

        if (!filtered.length) {
            list.innerHTML = '<p class="empty-msg">Vault is empty. Tap + to store something.</p>';
            return;
        }

        filtered.forEach(item => {
            const el = document.createElement('div');
            el.className = 'vault-item';
            el.innerHTML = `
                <span class="vault-item-icon">${icons[item.category] || '📦'}</span>
                <div class="vault-item-info">
                    <div class="name">${item.name}</div>
                    ${item.notes ? `<div class="notes">${item.notes}</div>` : ''}
                </div>
                <div class="vault-item-actions">
                    <button data-promote="${item.id}" title="Promote to quest">⚔</button>
                    <button data-delete="${item.id}" title="Delete">✕</button>
                </div>`;
            list.appendChild(el);
        });
    },

    /* ========== SHOP ========== */
    bindShop() {
        document.getElementById('shop-list')?.addEventListener('click', e => {
            const buy = e.target.closest('.shop-buy-btn');
            if (!buy || buy.disabled) return;
            const items = Store.load('shopItems');
            const char = Store.load('character');
            const item = items.find(i => i.id === buy.dataset.id);
            if (!item || item.bought || char.gold < item.price) return;

            item.bought = true;
            char.gold -= item.price;
            char.inventory.push({ id: item.id, name: item.name, icon: item.icon });
            Store.save('shopItems', items);
            Store.save('character', char);
            App.toast(`Bought ${item.name}!`, 'gold');
            App.logAdventure(`Purchased ${item.name} from the shop`);
            this.renderShop();
            this.renderProfile();
        });
    },

    renderShop() {
        const items = Store.load('shopItems');
        const char = Store.load('character');
        const list = document.getElementById('shop-list');
        document.getElementById('shop-gold').textContent = `🪙 ${char.gold}`;
        list.innerHTML = '';

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'shop-item';
            el.innerHTML = `
                <span class="shop-item-icon">${item.icon}</span>
                <div class="shop-item-info">
                    <div class="name">${item.name}</div>
                    <div class="desc">${item.desc}</div>
                </div>
                <span class="shop-item-price">${item.price}🪙</span>
                <button class="shop-buy-btn" data-id="${item.id}"
                    ${item.bought || char.gold < item.price ? 'disabled' : ''}>
                    ${item.bought ? 'Owned' : 'Buy'}
                </button>`;
            list.appendChild(el);
        });
    },

    /* ========== ACHIEVEMENTS ========== */
    renderAchievements() {
        const defs = Store.load('achievementDefs');
        const char = Store.load('character');
        const unlocked = char.achievements || [];
        const grid = document.getElementById('achievements-list');
        grid.innerHTML = '';

        defs.forEach(a => {
            const ok = unlocked.includes(a.id);
            const el = document.createElement('div');
            el.className = `achievement ${ok ? 'unlocked' : 'locked'}`;
            el.title = a.desc;
            el.innerHTML = `
                <span class="achievement-icon">${a.icon}</span>
                <span class="achievement-name">${a.name}</span>`;
            grid.appendChild(el);
        });
    },

    /* ========== HISTORY ========== */
    renderHistory() {
        const log = Store.load('adventureLog');
        const list = document.getElementById('history-list');
        list.innerHTML = '';

        if (!log.length) {
            list.innerHTML = '<p class="empty-msg">No history yet.</p>';
            return;
        }

        log.forEach(entry => {
            const el = document.createElement('div');
            el.className = 'history-entry';
            el.innerHTML = `<div class="date">${entry.time}</div><div class="content">${entry.text}</div>`;
            list.appendChild(el);
        });
    },

    /* ========== SETTINGS ========== */
    loadSettings() {
        const s = Store.load('settings');
        document.getElementById('setting-name').value = s.name || '';
        document.getElementById('setting-class').value = s.charClass || 'ranger';
        document.getElementById('setting-api-key').value = s.apiKey || '';
        document.getElementById('setting-api-url').value = s.apiUrl || '';
        document.getElementById('setting-model').value = s.model || '';

        const theme = document.documentElement.getAttribute('data-theme') || 'light';
        document.querySelectorAll('.theme-opt').forEach(t =>
            t.classList.toggle('active', t.dataset.theme === theme));

        this.renderTransitionCards();
    },

    renderTransitionCards() {
        const cards = Store.load('transitionCards');
        const container = document.getElementById('transition-cards-edit');
        container.innerHTML = '';
        cards.forEach(c => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `${c.icon || '🎯'} ${c.name} <span class="remove-tag" data-id="${c.id}">✕</span>`;
            container.appendChild(tag);
        });
    },

    bindSettings() {
        // Theme toggle
        document.getElementById('theme-toggle')?.addEventListener('click', e => {
            const opt = e.target.closest('.theme-opt');
            if (!opt) return;
            document.querySelectorAll('.theme-opt').forEach(t => t.classList.remove('active'));
            opt.classList.add('active');
            document.documentElement.setAttribute('data-theme', opt.dataset.theme);
        });

        // Add transition card
        document.getElementById('add-card-btn')?.addEventListener('click', () => {
            const input = document.getElementById('new-card-name');
            const name = input.value.trim();
            if (!name) return;
            const cards = Store.load('transitionCards');
            cards.push({ id: Store.uid(), name, icon: '🎯' });
            Store.save('transitionCards', cards);
            input.value = '';
            this.renderTransitionCards();
        });

        // Remove transition card
        document.getElementById('transition-cards-edit')?.addEventListener('click', e => {
            const rm = e.target.closest('.remove-tag');
            if (!rm) return;
            let cards = Store.load('transitionCards');
            cards = cards.filter(c => c.id !== rm.dataset.id);
            Store.save('transitionCards', cards);
            this.renderTransitionCards();
        });

        // Save settings
        document.getElementById('save-settings')?.addEventListener('click', () => {
            const s = Store.load('settings');
            s.name = document.getElementById('setting-name').value.trim() || 'Wanderer';
            s.charClass = document.getElementById('setting-class').value;
            s.apiKey = document.getElementById('setting-api-key').value.trim();
            s.apiUrl = document.getElementById('setting-api-url').value.trim();
            s.model = document.getElementById('setting-model').value.trim();
            s.theme = document.documentElement.getAttribute('data-theme');
            Store.save('settings', s);
            App.toast('Settings saved!', 'success');
            Now.refresh();
            this.renderProfile();
        });

        // Export
        document.getElementById('export-data')?.addEventListener('click', () => {
            const json = Store.exportAll();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `adhd-living-backup-${Store.today()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            App.toast('Data exported!', 'success');
        });

        // Import
        document.getElementById('import-data')?.addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file')?.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = evt => {
                if (Store.importAll(evt.target.result)) {
                    App.toast('Imported! Refreshing...', 'success');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    App.toast('Import failed.', 'error');
                }
            };
            reader.readAsText(file);
        });

        // Reset
        document.getElementById('reset-all')?.addEventListener('click', () => {
            if (confirm('Reset ALL data? This cannot be undone.')) {
                Store.resetAll();
                App.toast('Reset. Refreshing...', 'success');
                setTimeout(() => location.reload(), 1000);
            }
        });

        // Settings gear on Now view
        document.getElementById('open-settings')?.addEventListener('click', () => {
            this.openPanel('settings');
        });
    }
};
