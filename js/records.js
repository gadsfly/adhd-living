/* ============================================
   Records Module (Campfire Log)
   Sleep, diet, meds, journal, daily log
   ============================================ */

const Records = {
    medications: [],

    init() {
        this.medications = Store.load('medications');
        this.bindEvents();
        this.renderMeds();
        this.renderHistory();
    },

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            });
        });

        // Daily log save
        document.getElementById('save-daily-log').addEventListener('click', () => this.saveDailyLog());

        // Sleep log save
        document.getElementById('save-sleep-log').addEventListener('click', () => this.saveSleepLog());

        // Diet log save
        document.getElementById('save-diet-log').addEventListener('click', () => this.saveDietLog());

        // Add meal
        document.getElementById('add-meal').addEventListener('click', () => this.addMealEntry());

        // Water tracker
        document.querySelectorAll('.water-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cup = parseInt(btn.dataset.cup);
                document.querySelectorAll('.water-btn').forEach((b, i) => {
                    b.classList.toggle('active', i < cup);
                });
            });
        });

        // Sleep quality
        document.querySelectorAll('#sleep-quality .quality-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#sleep-quality .quality-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Meds
        document.getElementById('add-med-btn').addEventListener('click', () => this.addMedication());
        document.getElementById('save-meds-log').addEventListener('click', () => this.saveMedsLog());

        // Journal
        document.getElementById('save-journal').addEventListener('click', () => this.saveJournal());

        // Photo upload
        document.getElementById('log-photo').addEventListener('change', (e) => this.handlePhotos(e));
    },

    saveDailyLog() {
        const recap = document.getElementById('daily-recap').value.trim();
        const weight = document.getElementById('log-weight').value;
        const pain = document.getElementById('log-pain').value.trim();

        const logs = Store.load('logs');
        logs.push({
            type: 'daily',
            date: Store.today(),
            time: Store.timeOfDay(),
            recap,
            weight: weight || null,
            pain: pain || null
        });
        Store.save('logs', logs);

        // Adventure log
        const advLog = Store.load('adventureLog');
        advLog.push({
            time: Store.timeOfDay(),
            text: `Campfire log saved. ${recap ? '"' + recap.slice(0, 50) + '..."' : 'Entry recorded.'}`
        });
        Store.save('adventureLog', advLog);

        // XP for logging
        const character = Store.load('character');
        character.xp += 5;
        Store.save('character', character);

        App.toast('Daily log saved! +5XP', 'success');
        document.getElementById('daily-recap').value = '';
        this.renderHistory();
        Dashboard.character = Store.load('character');
        Dashboard.render();
    },

    saveSleepLog() {
        const bedtime = document.getElementById('log-bedtime').value;
        const waketime = document.getElementById('log-waketime').value;
        const qualityBtn = document.querySelector('#sleep-quality .quality-btn.active');
        const quality = qualityBtn ? parseInt(qualityBtn.dataset.val) : 0;
        const notes = document.getElementById('sleep-notes').value.trim();

        const logs = Store.load('logs');
        logs.push({
            type: 'sleep',
            date: Store.today(),
            bedtime,
            waketime,
            quality,
            notes
        });
        Store.save('logs', logs);

        const character = Store.load('character');
        character.xp += 3;
        Store.save('character', character);

        App.toast('Sleep log saved! +3XP', 'success');
        this.renderHistory();
    },

    saveDietLog() {
        const meals = [];
        document.querySelectorAll('.meal-entry').forEach(entry => {
            const type = entry.querySelector('.meal-type').value;
            const desc = entry.querySelector('.meal-desc').value.trim();
            if (desc) meals.push({ type, desc });
        });

        const waterCups = document.querySelectorAll('.water-btn.active').length;

        const logs = Store.load('logs');
        logs.push({
            type: 'diet',
            date: Store.today(),
            meals,
            water: waterCups
        });
        Store.save('logs', logs);

        const character = Store.load('character');
        character.xp += 3;
        Store.save('character', character);

        App.toast('Diet log saved! +3XP', 'success');
        this.renderHistory();
    },

    addMealEntry() {
        const container = document.getElementById('meal-entries');
        const entry = document.createElement('div');
        entry.className = 'meal-entry';
        entry.innerHTML = `
            <select class="rpg-select meal-type">
                <option value="breakfast">🌅 Breakfast</option>
                <option value="lunch">☀ Lunch</option>
                <option value="dinner">🌙 Dinner</option>
                <option value="snack">🍿 Snack</option>
            </select>
            <input type="text" class="meal-desc" placeholder="What did you eat?">
        `;
        container.appendChild(entry);
    },

    addMedication() {
        const name = document.getElementById('new-med-name').value.trim();
        const time = document.getElementById('new-med-time').value.trim();
        if (!name) return;

        this.medications.push({
            id: Store.uid(),
            name,
            time: time || 'anytime'
        });
        Store.save('medications', this.medications);
        this.renderMeds();
        document.getElementById('new-med-name').value = '';
        document.getElementById('new-med-time').value = '';
    },

    saveMedsLog() {
        const taken = [];
        document.querySelectorAll('#meds-checklist input[type="checkbox"]').forEach(cb => {
            if (cb.checked) taken.push(cb.dataset.med);
        });

        const logs = Store.load('logs');
        logs.push({
            type: 'meds',
            date: Store.today(),
            taken
        });
        Store.save('logs', logs);

        const character = Store.load('character');
        character.xp += 3;
        Store.save('character', character);

        App.toast('Meds log saved! +3XP', 'success');
    },

    saveJournal() {
        const entry = document.getElementById('journal-entry').value.trim();
        if (!entry) return;

        const logs = Store.load('logs');
        logs.push({
            type: 'journal',
            date: Store.today(),
            time: Store.timeOfDay(),
            entry
        });
        Store.save('logs', logs);

        const character = Store.load('character');
        character.xp += 5;
        Store.save('character', character);

        App.toast('Journal saved! +5XP', 'success');
        document.getElementById('journal-entry').value = '';
        this.renderHistory();
    },

    handlePhotos(e) {
        const previewContainer = document.getElementById('uploaded-previews');
        const files = e.target.files;

        for (const file of files) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    },

    renderMeds() {
        const checklist = document.getElementById('meds-checklist');
        if (!checklist) return;

        checklist.innerHTML = this.medications.map(med => `
            <div class="med-item">
                <label>
                    <input type="checkbox" data-med="${med.name}">
                    💊 ${med.name} (${med.time})
                </label>
            </div>
        `).join('') || '<p class="empty-state" style="font-size: 0.82rem">No medications added yet.</p>';
    },

    renderHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        const logs = Store.load('logs');
        const recent = logs.slice(-20).reverse();

        if (recent.length === 0) {
            historyList.innerHTML = '<p class="empty-state">No log entries yet.</p>';
            return;
        }

        historyList.innerHTML = recent.map(log => {
            let content = '';
            switch (log.type) {
                case 'daily':
                    content = `📝 ${log.recap || 'Daily log'}${log.weight ? ` | Weight: ${log.weight}kg` : ''}`;
                    break;
                case 'sleep':
                    content = `😴 Sleep: ${log.bedtime || '?'} → ${log.waketime || '?'} | Quality: ${'⭐'.repeat(log.quality || 0)}`;
                    break;
                case 'diet':
                    content = `🍽 ${(log.meals || []).map(m => m.desc).join(', ')} | 💧${log.water || 0} cups`;
                    break;
                case 'meds':
                    content = `💊 Taken: ${(log.taken || []).join(', ') || 'none'}`;
                    break;
                case 'journal':
                    content = `📖 ${(log.entry || '').slice(0, 100)}${log.entry && log.entry.length > 100 ? '...' : ''}`;
                    break;
                case 'weekly':
                    content = `📜 Weekly review archived`;
                    break;
                default:
                    content = JSON.stringify(log).slice(0, 100);
            }

            return `
                <div class="history-entry">
                    <div class="date">${log.date} ${log.time || ''}</div>
                    <div class="content">${content}</div>
                </div>
            `;
        }).join('');
    }
};
