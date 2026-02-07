/* ============================================
   ADHD Living — Data Store (localStorage)
   Central state management
   ============================================ */

const Store = {
    // Default data structure
    defaults: {
        settings: {
            name: 'Wanderer',
            charClass: 'ranger',
            apiKey: '',
            apiUrl: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-4o-mini',
            sound: false,
            theme: 'light',
            lang: 'en'
        },
        character: {
            level: 1,
            xp: 0,
            xpToNext: 100,
            gold: 50,
            hp: 60,
            mp: 53,
            inventory: [],
            equipped: {
                weapon: { name: 'Starter Blade', icon: '🗡' },
                armor: { name: 'Worn Cloak', icon: '👘' },
                accessory: { name: 'Lucky Charm', icon: '📿' }
            },
            achievements: []
        },
        dashboard: {
            dayStatus: 'green',
            stats: {
                stamina: 70,
                diet: 50,
                sleep: 60,
                spirit: 65,
                focus: 40,
                mood: 55
            },
            buffs: [],
            dayStreak: 0,
            lastActiveDate: null
        },
        tasks: [],
        backlog: [],
        weeklyPlan: {
            weekStart: null,
            main: [],
            side: [],
            review: ''
        },
        habits: [],
        habitCombo: 0,
        transitionCards: [
            { id: 't1', name: 'Take out trash', icon: '🗑' },
            { id: 't2', name: 'Soak feet in warm water', icon: '🦶' },
            { id: 't3', name: 'Gaze into distance for 1 min', icon: '👀' },
            { id: 't4', name: 'Stand up and stretch', icon: '🧘' },
            { id: 't5', name: 'Close eyes, rest 10 min', icon: '😌' },
            { id: 't6', name: 'Go pour a glass of water', icon: '💧' },
            { id: 't7', name: 'Step outside for fresh air', icon: '🌿' },
            { id: 't8', name: 'Tidy one small area', icon: '✨' },
            { id: 't9', name: 'Play one song you like', icon: '🎵' },
            { id: 't10', name: 'Text a friend', icon: '💬' }
        ],
        medications: [],
        logs: [],
        adventureLog: [
            { time: 'Dawn', text: 'A new day begins. The wanderer awakens...' }
        ],
        shopItems: [
            { id: 's1', name: 'Iron Sword', icon: '⚔', desc: '+2 Task Focus', price: 100, type: 'weapon', bought: false },
            { id: 's2', name: 'Leather Armor', icon: '🛡', desc: '+1 HP Regen', price: 80, type: 'armor', bought: false },
            { id: 's3', name: 'Focus Amulet', icon: '🔮', desc: '+3 Focus MP', price: 120, type: 'accessory', bought: false },
            { id: 's4', name: 'Traveler\'s Map', icon: '🗺', desc: 'Unlock vault hint', price: 60, type: 'misc', bought: false },
            { id: 's5', name: 'Healing Potion', icon: '🧪', desc: 'Restore 20 HP', price: 30, type: 'consumable', bought: false },
            { id: 's6', name: 'Mana Crystal', icon: '💎', desc: 'Restore 20 MP', price: 30, type: 'consumable', bought: false },
            { id: 's7', name: 'Phoenix Feather', icon: '🪶', desc: 'Revive from burnout', price: 200, type: 'misc', bought: false },
            { id: 's8', name: 'Enchanted Cloak', icon: '🧥', desc: '+5 All Stats', price: 300, type: 'armor', bought: false }
        ],
        achievementDefs: [
            { id: 'a1', name: 'First Steps', icon: '👣', desc: 'Complete your first quest', condition: 'tasks_1' },
            { id: 'a2', name: 'Streak Starter', icon: '🔥', desc: '3-day streak', condition: 'streak_3' },
            { id: 'a3', name: 'Habit Builder', icon: '🃏', desc: 'Play 5 habit cards in a day', condition: 'habits_5' },
            { id: 'a4', name: 'Boss Slayer', icon: '👹', desc: 'Complete 5 boss quests', condition: 'boss_5' },
            { id: 'a5', name: 'Survivor', icon: '🛡', desc: 'Complete all survival quests in a day', condition: 'survival_all' },
            { id: 'a6', name: 'Vault Diver', icon: '📦', desc: 'Pull 3 items from the vault', condition: 'vault_3' },
            { id: 'a7', name: 'Level 5', icon: '⭐', desc: 'Reach Level 5', condition: 'level_5' },
            { id: 'a8', name: 'Rich Adventurer', icon: '🪙', desc: 'Accumulate 500 gold', condition: 'gold_500' },
            { id: 'a9', name: 'Combo Master', icon: '💥', desc: 'Get a 5x habit combo', condition: 'combo_5' },
            { id: 'a10', name: 'Weekly Champion', icon: '📜', desc: 'Complete all weekly main quests', condition: 'weekly_all' },
            { id: 'a11', name: 'Consistency', icon: '📅', desc: '7-day streak', condition: 'streak_7' },
            { id: 'a12', name: 'Legend', icon: '🏆', desc: 'Reach Level 10', condition: 'level_10' }
        ]
    },

    // Load from localStorage
    load(key) {
        try {
            const data = localStorage.getItem(`adhd_${key}`);
            if (data) return JSON.parse(data);
            return JSON.parse(JSON.stringify(this.defaults[key]));
        } catch (e) {
            console.error(`Error loading ${key}:`, e);
            return JSON.parse(JSON.stringify(this.defaults[key]));
        }
    },

    // Save to localStorage
    save(key, data) {
        try {
            localStorage.setItem(`adhd_${key}`, JSON.stringify(data));
        } catch (e) {
            console.error(`Error saving ${key}:`, e);
        }
    },

    // Get everything
    loadAll() {
        const data = {};
        for (const key of Object.keys(this.defaults)) {
            data[key] = this.load(key);
        }
        return data;
    },

    // Export all data as JSON
    exportAll() {
        return JSON.stringify(this.loadAll(), null, 2);
    },

    // Import all data from JSON string
    importAll(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            for (const key of Object.keys(data)) {
                this.save(key, data[key]);
            }
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    },

    // Reset everything
    resetAll() {
        for (const key of Object.keys(this.defaults)) {
            localStorage.removeItem(`adhd_${key}`);
        }
    },

    // Generate unique ID
    uid() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    // Get today's date string
    today() {
        return new Date().toISOString().split('T')[0];
    },

    // Get current time of day
    timeOfDay() {
        const h = new Date().getHours();
        if (h < 6) return 'Deep Night';
        if (h < 9) return 'Dawn';
        if (h < 12) return 'Morning';
        if (h < 14) return 'Midday';
        if (h < 17) return 'Afternoon';
        if (h < 20) return 'Dusk';
        if (h < 23) return 'Evening';
        return 'Night';
    }
};
