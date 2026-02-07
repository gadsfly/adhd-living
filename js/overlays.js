/* ============================================
   ADHD Living — Overlays
   Supervisor mode, AI chat
   ============================================ */

const Overlays = {
    supCommands: [],
    supIndex: 0,

    init() {
        this.bindSupervisor();
        this.bindAI();
    },

    /* ========== SUPERVISOR MODE ========== */
    getCommands() {
        const h = new Date().getHours();
        if (h >= 6 && h < 10) return [
            { main: 'Stand up.', sub: 'Get out of bed right now.' },
            { main: 'Go to the bathroom.', sub: 'Wash your face with cold water.' },
            { main: 'Take your medication.', sub: 'With a full glass of water.' },
            { main: 'Eat something.', sub: 'Anything. A banana counts.' },
            { main: 'Open your quest list.', sub: 'Pick the first thing and do it.' }
        ];
        if (h >= 20) return [
            { main: 'Stop what you\'re doing.', sub: 'Save your work.' },
            { main: 'Take your evening meds.', sub: 'If you have any.' },
            { main: 'Brush your teeth.', sub: 'Yes, right now.' },
            { main: 'Put your phone down.', sub: 'Charge it across the room.' },
            { main: 'Get into bed.', sub: 'You did enough today.' }
        ];
        return [
            { main: 'Stop thinking.', sub: 'Stand up from your chair.' },
            { main: 'Walk to the kitchen.', sub: 'Pour a glass of water.' },
            { main: 'Drink the water.', sub: 'All of it.' },
            { main: 'Take 3 deep breaths.', sub: 'In... hold... out...' },
            { main: 'Now go back.', sub: 'Do ONE small thing from your list.' }
        ];
    },

    startSupervisor() {
        this.supCommands = this.getCommands();
        this.supIndex = 0;
        this.showCommand();
        document.getElementById('supervisor-overlay').classList.remove('hidden');
    },

    showCommand() {
        const cmd = this.supCommands[this.supIndex];
        if (!cmd) { this.endSupervisor(); return; }
        document.getElementById('command-main').textContent = cmd.main;
        document.getElementById('command-sub').textContent = cmd.sub;
    },

    endSupervisor() {
        document.getElementById('supervisor-overlay').classList.add('hidden');
        App.grantXP(15);
        App.grantGold(5);
        App.toast('Supervisor done! +15 XP', 'success');
        App.logAdventure('Completed supervisor mode');
    },

    bindSupervisor() {
        document.getElementById('command-done-btn')?.addEventListener('click', () => {
            this.supIndex++;
            if (this.supIndex >= this.supCommands.length) this.endSupervisor();
            else this.showCommand();
        });
        document.getElementById('command-skip-btn')?.addEventListener('click', () => {
            this.supIndex++;
            if (this.supIndex >= this.supCommands.length) this.endSupervisor();
            else this.showCommand();
        });
        document.getElementById('exit-supervisor')?.addEventListener('click', () => {
            document.getElementById('supervisor-overlay').classList.add('hidden');
        });
    },

    /* ========== AI CHAT ========== */
    openAI() {
        document.getElementById('ai-panel').classList.remove('hidden');
    },

    bindAI() {
        document.getElementById('chat-send')?.addEventListener('click', () => this.sendChat());
        document.getElementById('chat-input')?.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendChat(); }
        });

        // Quick prompts
        document.querySelectorAll('.qp-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleQuickPrompt(btn.dataset.prompt));
        });
    },

    addMsg(text, sender = 'ai') {
        const container = document.getElementById('chat-messages');
        const el = document.createElement('div');
        el.className = `chat-msg ${sender}`;
        el.innerHTML = `<div class="chat-bubble">${text}</div>`;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
    },

    async sendChat() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        this.addMsg(text, 'user');

        const s = Store.load('settings');
        if (!s.apiKey) {
            this.addMsg('I need an API key to chat. Add one in Settings → AI API Key.');
            return;
        }

        this.addMsg('Thinking...');

        try {
            const ctx = this.buildContext();
            const res = await fetch(s.apiUrl || 'https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s.apiKey}` },
                body: JSON.stringify({
                    model: s.model || 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: `You are a warm, supportive AI companion in an ADHD life management RPG app. The user has ADHD. Be brief, practical, encouraging. Status:\n${ctx}` },
                        { role: 'user', content: text }
                    ],
                    max_tokens: 300
                })
            });
            const data = await res.json();
            // Remove "Thinking..."
            document.getElementById('chat-messages').lastChild?.remove();
            this.addMsg(data.choices?.[0]?.message?.content || 'Sorry, I couldn\'t process that.');
        } catch {
            document.getElementById('chat-messages').lastChild?.remove();
            this.addMsg('Connection error. Check your API settings.');
        }
    },

    buildContext() {
        const c = Store.load('character');
        const d = Store.load('dashboard');
        const tasks = Store.load('tasks');
        const today = Store.today();
        const done = tasks.filter(t => t.done && t.doneDate === today).length;
        return `Lv.${c.level}, ${c.xp}/${c.xpToNext} XP, ${c.gold} gold, Energy: ${d.dayStatus}, Streak: ${d.dayStreak}, Tasks: ${done}/${tasks.length}`;
    },

    handleQuickPrompt(type) {
        const c = Store.load('character');
        const d = Store.load('dashboard');
        const tasks = Store.load('tasks');
        const today = Store.today();
        const done = tasks.filter(t => t.done && t.doneDate === today).length;
        const remaining = tasks.filter(t => !t.done);
        let r;

        switch (type) {
            case 'status':
                r = `📊 <b>Status</b><br>Lv.${c.level} · ${c.xp}/${c.xpToNext} XP · ${c.gold} gold<br>Energy: ${d.dayStatus} · Streak: ${d.dayStreak} days<br>Tasks: ${done} done, ${remaining.length} left`;
                break;
            case 'suggest':
                if (!remaining.length) {
                    r = '🎉 All done! Take a break or check the Vault for ideas.';
                } else {
                    r = `🎯 Try this: <b>${remaining[0].name}</b>. Just that one thing.`;
                }
                break;
            case 'review':
                r = `📝 You completed <b>${done}</b> quest${done !== 1 ? 's' : ''} today. ${done >= 3 ? 'Solid work! 💪' : done > 0 ? 'Every step counts.' : 'Starting is the hardest part. You\'re here — that matters.'}`;
                break;
            case 'comfort':
                const msgs = [
                    'Having ADHD is hard. You\'re doing your best, and that\'s enough. 💜',
                    'It\'s okay to have an off day. Tomorrow is a fresh start. 🌅',
                    'You showed up today. That alone is an achievement. 🌟',
                    'Rest is not laziness. Your brain needs it. 🧠',
                    'Small steps are still steps forward. 🚶'
                ];
                r = msgs[Math.floor(Math.random() * msgs.length)];
                break;
        }
        this.addMsg(r);
    }
};
