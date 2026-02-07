/* ============================================
   Shop & RPG Module
   Equipment, inventory, achievements, adventure
   ============================================ */

const Shop = {
    character: null,
    shopItems: [],

    init() {
        this.character = Store.load('character');
        this.shopItems = Store.load('shopItems');
        this.render();
    },

    buyItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item || item.bought) return;

        this.character = Store.load('character');
        if (this.character.gold < item.price) {
            App.toast('Not enough gold!', 'error');
            return;
        }

        this.character.gold -= item.price;
        item.bought = true;

        // Add to inventory
        this.character.inventory.push({
            id: item.id,
            name: item.name,
            icon: item.icon,
            desc: item.desc,
            type: item.type
        });

        Store.save('character', this.character);
        Store.save('shopItems', this.shopItems);

        // Adventure log
        const log = Store.load('adventureLog');
        log.push({
            time: Store.timeOfDay(),
            text: `Purchased ${item.icon} ${item.name} for ${item.price}G`
        });
        Store.save('adventureLog', log);

        App.toast(`Bought ${item.icon} ${item.name}!`, 'gold');
        this.render();
        Dashboard.character = this.character;
        Dashboard.render();
    },

    equipItem(itemId) {
        const invItem = this.character.inventory.find(i => i.id === itemId);
        if (!invItem) return;

        const slot = invItem.type;
        if (!['weapon', 'armor', 'accessory'].includes(slot)) {
            App.toast('This item cannot be equipped.', 'info');
            return;
        }

        this.character.equipped[slot] = { name: invItem.name, icon: invItem.icon };
        Store.save('character', this.character);

        App.toast(`Equipped ${invItem.icon} ${invItem.name}`, 'success');
        this.render();
    },

    render() {
        this.character = Store.load('character');
        this.shopItems = Store.load('shopItems');

        // Character info
        const settings = Store.load('settings');
        document.getElementById('char-name').textContent = settings.name;
        document.getElementById('char-class').textContent = this.getClassName(settings.charClass);
        document.getElementById('char-level').textContent = this.character.level;
        document.getElementById('character-avatar').textContent = this.getClassEmoji(settings.charClass);

        // XP bar
        const xpPct = Math.min(100, (this.character.xp / this.character.xpToNext) * 100);
        const xpFill = document.getElementById('char-xp-fill');
        const xpLabel = document.getElementById('char-xp-label');
        if (xpFill) xpFill.style.width = xpPct + '%';
        if (xpLabel) xpLabel.textContent = `${this.character.xp} / ${this.character.xpToNext} XP`;

        // Equipped items
        for (const [slot, item] of Object.entries(this.character.equipped)) {
            const el = document.getElementById(`slot-${slot}`);
            if (el) el.textContent = `${item.icon} ${item.name}`;
        }

        // Shop items
        const shopEl = document.getElementById('shop-items');
        if (shopEl) {
            shopEl.innerHTML = this.shopItems.filter(i => !i.bought).map(item => `
                <div class="shop-item" data-id="${item.id}">
                    <span class="shop-item-icon">${item.icon}</span>
                    <div class="shop-item-info">
                        <div class="name">${item.name}</div>
                        <div class="desc">${item.desc}</div>
                    </div>
                    <span class="shop-item-price">🪙 ${item.price}</span>
                    <button class="shop-buy-btn" data-id="${item.id}" ${this.character.gold < item.price ? 'disabled' : ''}>Buy</button>
                </div>
            `).join('') || '<p class="empty-state">Shop is empty! Check back later.</p>';

            shopEl.querySelectorAll('.shop-buy-btn').forEach(btn => {
                btn.addEventListener('click', () => this.buyItem(btn.dataset.id));
            });
        }

        // Inventory
        const invEl = document.getElementById('inventory-grid');
        if (invEl) {
            invEl.innerHTML = this.character.inventory.map(item => `
                <div class="inventory-item" data-id="${item.id}" title="${item.desc}">
                    <span class="item-icon">${item.icon}</span>
                    <span class="item-name">${item.name}</span>
                </div>
            `).join('') || '<p class="empty-state" style="grid-column: 1/-1">Empty backpack</p>';

            invEl.querySelectorAll('.inventory-item').forEach(item => {
                item.addEventListener('click', () => this.equipItem(item.dataset.id));
            });
        }

        // Adventure log
        const logEl = document.getElementById('adventure-log');
        if (logEl) {
            const logs = Store.load('adventureLog');
            logEl.innerHTML = logs.slice(-15).reverse().map(entry => `
                <div class="log-entry">
                    <span class="log-time">${entry.time}</span>
                    <span class="log-text">${entry.text}</span>
                </div>
            `).join('');
        }

        // Achievements
        this.renderAchievements();
    },

    renderAchievements() {
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;

        const defs = Store.load('achievementDefs');
        const unlocked = this.character.achievements || [];

        grid.innerHTML = defs.map(a => {
            const isUnlocked = unlocked.includes(a.id);
            return `
                <div class="achievement ${isUnlocked ? 'unlocked' : 'locked'}" title="${a.desc}">
                    <span class="achievement-icon">${a.icon}</span>
                    <span class="achievement-name">${isUnlocked ? a.name : '???'}</span>
                </div>
            `;
        }).join('');
    },

    getClassName(cls) {
        const names = {
            ranger: '🏹 Ranger',
            mage: '🧙 Mage',
            warrior: '⚔ Warrior',
            rogue: '🗡 Rogue',
            healer: '💚 Healer',
            bard: '🎵 Bard'
        };
        return names[cls] || '🏹 Ranger';
    },

    getClassEmoji(cls) {
        const emojis = {
            ranger: '🏹',
            mage: '🧙',
            warrior: '⚔',
            rogue: '🗡',
            healer: '💚',
            bard: '🎵'
        };
        return emojis[cls] || '🧙';
    }
};
