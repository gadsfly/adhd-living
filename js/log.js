/* ============================================
   ADHD Living — Log View
   Mood, Sleep, Food, Meds, Journal, Body
   ============================================ */

const Log = {
    init() {
        this.bindGrid();
        this.bindClose();
        this.bindMoodPickers();
        this.bindWater();
        this.bindMealAdd();
        this.bindMeds();
        this.bindSave();
        this.refresh();
    },

    refresh() {
        document.getElementById('log-date').textContent = new Date().toLocaleDateString();
        this.updateChecks();
    },

    /* --- Checkmarks on grid buttons --- */
    updateChecks() {
        const logs = Store.load('logs');
        const today = Store.today();
        ['mood', 'sleep', 'food', 'meds', 'journal', 'body'].forEach(type => {
            const has = logs.some(l => l.type === type && l.date === today);
            const check = document.getElementById(`log-check-${type}`);
            const btn = check?.closest('.log-btn');
            if (check) check.classList.toggle('hidden', !has);
            if (btn) btn.classList.toggle('done', has);
        });
    },

    /* --- Grid click → open form --- */
    bindGrid() {
        document.getElementById('log-grid').addEventListener('click', e => {
            const btn = e.target.closest('.log-btn');
            if (!btn) return;
            this.openForm(btn.dataset.log);
        });
    },

    openForm(type) {
        document.getElementById('log-grid').classList.add('hidden');
        document.querySelectorAll('.log-form').forEach(f => f.classList.add('hidden'));
        const form = document.getElementById(`log-form-${type}`);
        if (form) {
            form.classList.remove('hidden');
            this.loadExisting(type);
        }
    },

    closeForm() {
        document.querySelectorAll('.log-form').forEach(f => f.classList.add('hidden'));
        document.getElementById('log-grid').classList.remove('hidden');
    },

    bindClose() {
        document.querySelectorAll('[data-log-close]').forEach(btn =>
            btn.addEventListener('click', () => this.closeForm()));
    },

    /* --- Load existing today's data into form --- */
    loadExisting(type) {
        const logs = Store.load('logs');
        const entry = logs.find(l => l.type === type && l.date === Store.today());
        if (!entry) return;
        const d = entry.data;

        if (type === 'mood') {
            document.querySelectorAll('#mood-picker .mood-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.mood == d.mood));
            document.getElementById('mood-notes').value = d.notes || '';
        } else if (type === 'sleep') {
            document.getElementById('log-bedtime').value = d.bedtime || '';
            document.getElementById('log-waketime').value = d.waketime || '';
            document.querySelectorAll('#sleep-quality-picker .mood-btn').forEach(b =>
                b.classList.toggle('active', b.dataset.val == d.quality));
            document.getElementById('sleep-notes').value = d.notes || '';
        } else if (type === 'food') {
            // Restore water
            const water = d.water || 0;
            document.querySelectorAll('#water-row .water-btn').forEach(b =>
                b.classList.toggle('active', parseInt(b.dataset.cup) <= water));
        } else if (type === 'journal') {
            document.getElementById('journal-entry').value = d.text || '';
        } else if (type === 'body') {
            document.getElementById('log-weight').value = d.weight || '';
            document.getElementById('log-pain').value = d.pain || '';
            document.getElementById('log-exercise').value = d.exercise || '';
        }
    },

    /* --- Save helper --- */
    saveLog(type, data) {
        const logs = Store.load('logs');
        const today = Store.today();
        const idx = logs.findIndex(l => l.type === type && l.date === today);
        const entry = { type, date: today, data, time: new Date().toLocaleTimeString() };
        if (idx >= 0) logs[idx] = entry;
        else logs.push(entry);
        Store.save('logs', logs);
        this.updateChecks();
        this.closeForm();
        App.toast('Saved!', 'success');
    },

    /* --- Mood / Sleep quality pickers --- */
    bindMoodPickers() {
        const bind = (containerId, attr) => {
            const el = document.getElementById(containerId);
            if (!el) return;
            el.addEventListener('click', e => {
                const btn = e.target.closest('.mood-btn');
                if (!btn) return;
                el.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        };
        bind('mood-picker', 'mood');
        bind('sleep-quality-picker', 'val');
    },

    /* --- Water toggles --- */
    bindWater() {
        document.getElementById('water-row').addEventListener('click', e => {
            const btn = e.target.closest('.water-btn');
            if (!btn) return;
            const cup = parseInt(btn.dataset.cup);
            document.querySelectorAll('#water-row .water-btn').forEach(b =>
                b.classList.toggle('active', parseInt(b.dataset.cup) <= cup));
        });
    },

    /* --- Add meal row --- */
    bindMealAdd() {
        document.getElementById('add-meal-row').addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'meal-row';
            row.innerHTML = `
                <select class="meal-select">
                    <option>🌅 Breakfast</option><option>☀ Lunch</option>
                    <option>🌙 Dinner</option><option>🍿 Snack</option>
                </select>
                <input type="text" class="meal-input" placeholder="What did you eat?">`;
            document.getElementById('meal-entries').appendChild(row);
        });
    },

    /* --- Meds --- */
    bindMeds() {
        this.renderMeds();
        document.getElementById('add-med-btn').addEventListener('click', () => {
            const nameEl = document.getElementById('new-med-name');
            const timeEl = document.getElementById('new-med-time');
            const name = nameEl.value.trim();
            if (!name) return;
            const meds = Store.load('medications');
            meds.push({ id: Store.uid(), name, time: timeEl.value.trim() });
            Store.save('medications', meds);
            nameEl.value = '';
            timeEl.value = '';
            this.renderMeds();
        });
    },

    renderMeds() {
        const meds = Store.load('medications');
        const list = document.getElementById('meds-checklist');
        list.innerHTML = '';

        meds.forEach(m => {
            const el = document.createElement('div');
            el.className = 'med-item';
            el.innerHTML = `
                <label><input type="checkbox" data-id="${m.id}"> ${m.name}${m.time ? ` (${m.time})` : ''}</label>
                <button class="med-item-delete" data-id="${m.id}">✕</button>`;
            list.appendChild(el);
        });

        // Restore today's checked state
        const logs = Store.load('logs');
        const todayMeds = logs.find(l => l.type === 'meds' && l.date === Store.today());
        if (todayMeds) {
            (todayMeds.data.taken || []).forEach(id => {
                const cb = list.querySelector(`input[data-id="${id}"]`);
                if (cb) cb.checked = true;
            });
        }

        // Delete handler (delegated)
        list.onclick = e => {
            const del = e.target.closest('.med-item-delete');
            if (!del) return;
            let meds = Store.load('medications');
            meds = meds.filter(m => m.id !== del.dataset.id);
            Store.save('medications', meds);
            this.renderMeds();
        };
    },

    /* --- Save buttons --- */
    bindSave() {
        document.getElementById('save-mood').addEventListener('click', () => {
            const active = document.querySelector('#mood-picker .mood-btn.active');
            this.saveLog('mood', {
                mood: active ? active.dataset.mood : 3,
                notes: document.getElementById('mood-notes').value
            });
        });

        document.getElementById('save-sleep').addEventListener('click', () => {
            const q = document.querySelector('#sleep-quality-picker .mood-btn.active');
            this.saveLog('sleep', {
                bedtime: document.getElementById('log-bedtime').value,
                waketime: document.getElementById('log-waketime').value,
                quality: q ? q.dataset.val : 3,
                notes: document.getElementById('sleep-notes').value
            });
        });

        document.getElementById('save-food').addEventListener('click', () => {
            const meals = [];
            document.querySelectorAll('.meal-row').forEach(row => {
                const type = row.querySelector('.meal-select').value;
                const food = row.querySelector('.meal-input').value;
                if (food) meals.push({ type, food });
            });
            const water = document.querySelectorAll('#water-row .water-btn.active').length;
            this.saveLog('food', { meals, water });
        });

        document.getElementById('save-meds').addEventListener('click', () => {
            const checked = [];
            document.querySelectorAll('#meds-checklist input[type="checkbox"]').forEach(cb => {
                if (cb.checked) checked.push(cb.dataset.id);
            });
            this.saveLog('meds', { taken: checked });
        });

        document.getElementById('save-journal').addEventListener('click', () => {
            this.saveLog('journal', { text: document.getElementById('journal-entry').value });
        });

        document.getElementById('save-body').addEventListener('click', () => {
            this.saveLog('body', {
                weight: document.getElementById('log-weight').value,
                pain: document.getElementById('log-pain').value,
                exercise: document.getElementById('log-exercise').value
            });
        });
    }
};
