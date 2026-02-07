/* ============================================
   AI Companion Module
   Chat interface with OpenAI-compatible API
   Voice input, image upload, quick prompts
   ============================================ */

const AI = {
    messages: [],
    isRecording: false,
    mediaRecorder: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Send message
        document.getElementById('chat-send').addEventListener('click', () => this.sendMessage());
        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        document.getElementById('chat-input').addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
        });

        // Voice input
        document.getElementById('voice-input-btn').addEventListener('click', () => this.toggleVoice());

        // Image upload
        document.getElementById('image-upload-btn').addEventListener('click', () => {
            document.getElementById('ai-image-input').click();
        });

        document.getElementById('ai-image-input').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageUpload(e.target.files[0]);
            }
        });

        // Quick prompts
        document.querySelectorAll('.quick-prompt').forEach(btn => {
            btn.addEventListener('click', () => this.handleQuickPrompt(btn.dataset.prompt));
        });
    },

    async sendMessage(override) {
        const input = document.getElementById('chat-input');
        const text = override || input.value.trim();
        if (!text) return;

        // Add user message to chat
        this.addChatBubble(text, 'user');
        input.value = '';
        input.style.height = 'auto';

        // Build context
        const context = this.buildContext();

        // Add to conversation
        this.messages.push({ role: 'user', content: text });

        // Try to call API
        const settings = Store.load('settings');
        if (settings.apiKey) {
            await this.callAPI(settings, context);
        } else {
            // Offline mode - use built-in responses
            this.offlineResponse(text);
        }
    },

    buildContext() {
        const dashboard = Store.load('dashboard');
        const character = Store.load('character');
        const tasks = Store.load('tasks');
        const habits = Store.load('habits');
        const backlog = Store.load('backlog');
        const today = Store.today();
        const settings = Store.load('settings');

        const incompleteTasks = tasks.filter(t => !t.completed);
        const todayHabits = habits.filter(h => h.playedDates && h.playedDates.includes(today));

        return `You are an AI companion in an ADHD life management RPG app called "ADHD Living".
The user is a person with ADHD who is using this app to manage their daily life through gamification.
You speak as a supportive party member / companion in their adventure.
Be warm but concise. Use RPG metaphors naturally. Don't be patronizing.
When the user describes their day or status, you can suggest updates to their dashboard, tasks, or logs.
If they seem stuck or overwhelmed, gently suggest supervisor mode or transition cards.
If they need comfort, be empathetic and validate their feelings.

Current state:
- Character: ${settings.name} the ${settings.charClass}, Level ${character.level}
- HP (Physical): ${dashboard.stats ? Math.round((dashboard.stats.stamina + dashboard.stats.diet + dashboard.stats.sleep) / 3) : '?'}/100
- MP (Mental): ${dashboard.stats ? Math.round((dashboard.stats.spirit + dashboard.stats.focus + dashboard.stats.mood) / 3) : '?'}/100
- Day Status: ${dashboard.dayStatus} (green=energized, yellow=moderate, red=low)
- Active buffs/debuffs: ${dashboard.buffs.map(b => b.name).join(', ') || 'none'}
- Gold: ${character.gold}, XP: ${character.xp}/${character.xpToNext}
- Incomplete tasks: ${incompleteTasks.map(t => `[${t.tier}] ${t.name}`).join(', ') || 'none'}
- Habits played today: ${todayHabits.length}
- Day streak: ${dashboard.dayStreak}
- Time of day: ${Store.timeOfDay()}
- Vault items: ${backlog.length} stored items

Respond in a helpful, concise way. Use short paragraphs. If the user tells you about their day, meals, sleep etc., summarize what you understood and suggest which log fields to fill.`;
    },

    async callAPI(settings, systemPrompt) {
        try {
            this.addChatBubble('...', 'ai', 'typing-indicator');

            const apiMessages = [
                { role: 'system', content: systemPrompt },
                ...this.messages.slice(-10) // Keep last 10 messages for context
            ];

            const response = await fetch(settings.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.apiKey}`
                },
                body: JSON.stringify({
                    model: settings.model,
                    messages: apiMessages,
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            // Remove typing indicator
            this.removeTypingIndicator();

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const reply = data.choices[0].message.content;

            this.messages.push({ role: 'assistant', content: reply });
            this.addChatBubble(reply, 'ai');

        } catch (error) {
            this.removeTypingIndicator();
            console.error('AI API error:', error);
            this.addChatBubble(`⚠ Connection issue. Using offline mode. (${error.message})`, 'ai');
            this.offlineResponse(this.messages[this.messages.length - 1]?.content || '');
        }
    },

    offlineResponse(userText) {
        const lower = userText.toLowerCase();
        let response = '';

        if (lower.includes('status') || lower.includes('how am i')) {
            const dashboard = Store.load('dashboard');
            const s = dashboard.stats || {};
            const hp = Math.round(((s.stamina || 0) + (s.diet || 0) + (s.sleep || 0)) / 3);
            const mp = Math.round(((s.spirit || 0) + (s.focus || 0) + (s.mood || 0)) / 3);
            response = `📊 **Status Check**\n\n❤ HP: ${hp}/100 (Stamina ${s.stamina}, Diet ${s.diet}, Sleep ${s.sleep})\n💎 MP: ${mp}/100 (Spirit ${s.spirit}, Focus ${s.focus}, Mood ${s.mood})\n\nDay status: ${dashboard.dayStatus}\nActive effects: ${dashboard.buffs.map(b => b.name).join(', ') || 'None'}\n\n${hp < 40 ? '⚠ Your HP is low. Consider eating, resting, or doing a light activity.' : hp > 70 ? '✨ Looking good! You have energy to tackle some quests.' : 'You\'re at moderate levels. Pace yourself.'}`;
        } else if (lower.includes('what should i do') || lower.includes('suggest') || lower.includes('now what')) {
            const tasks = Store.load('tasks');
            const dashboard = Store.load('dashboard');
            const incomplete = tasks.filter(t => !t.completed);

            if (dashboard.dayStatus === 'red') {
                const survival = incomplete.filter(t => t.tier === 'survival');
                response = `🔴 You're in low-power mode. Focus only on survival quests.\n\n${survival.length > 0 ? 'Try this: **' + survival[0].name + '**' : 'No survival quests lined up. Maybe draw a transition card? 🎲'}\n\nRemember: existing is enough on low days. Be gentle.`;
            } else if (incomplete.length > 0) {
                const sorted = incomplete.sort((a, b) => {
                    const tierOrder = { boss: 0, survival: 1, side: 2 };
                    return (tierOrder[a.tier] || 2) - (tierOrder[b.tier] || 2);
                });
                response = `🎯 Here's what I'd suggest:\n\n**Top pick:** ${sorted[0].name} (${sorted[0].tier})\n\n${sorted.length > 1 ? `Also pending: ${sorted.slice(1, 3).map(t => t.name).join(', ')}` : ''}\n\nPick whichever feels most doable right now. Not the "should" — the "can".`;
            } else {
                response = `✨ No active quests! You could:\n- Add new quests from your vault 📦\n- Play some habit cards 🃏\n- Do a brain-dump in the journal 📖\n- Or just rest. That's valid too.`;
            }
        } else if (lower.includes('review') || lower.includes('recap')) {
            const tasks = Store.load('tasks');
            const habits = Store.load('habits');
            const today = Store.today();
            const done = tasks.filter(t => t.completed && t.completedDate === today);
            const played = habits.filter(h => h.playedDates && h.playedDates.includes(today));
            const character = Store.load('character');

            response = `📝 **Daily Review**\n\n⚔ Quests completed: ${done.length}\n${done.map(t => `  ✓ ${t.name}`).join('\n') || '  (none yet)'}\n\n🃏 Habits played: ${played.length}\n${played.map(h => `  ✓ ${h.name}`).join('\n') || '  (none yet)'}\n\n⭐ XP: ${character.xp}/${character.xpToNext}\n🪙 Gold: ${character.gold}\n📅 Streak: ${Store.load('dashboard').dayStreak} days\n\n${done.length > 0 ? 'You did things today. That counts. Well done, adventurer.' : 'Haven\'t started yet? That\'s okay. The day isn\'t over.'}`;
        } else if (lower.includes('comfort') || lower.includes('sad') || lower.includes('tired') || lower.includes('overwhelm') || lower.includes('can\'t')) {
            const comforts = [
                'Hey. I see you. What you\'re feeling right now is real, and it\'s valid. You don\'t have to be productive every moment. Sometimes just existing is the quest.\n\nIf you need to rest, rest. If you need to cry, cry. I\'ll be here when you\'re ready.',
                'The fact that you opened this app means something. Even on the worst days, part of you is still trying. That part deserves credit.\n\nYou don\'t have to do everything today. Or anything. You just have to get through it. And you will.',
                'Having ADHD is like fighting with a weapon that changes shape randomly. Sometimes it\'s a sword, sometimes it\'s a wet noodle. Neither is your fault.\n\nRest is not failure. It\'s maintenance. Even legendary heroes have to visit the inn.',
                'I know everything feels heavy right now. That\'s the debuff talking, not reality. This will pass.\n\nTry one tiny thing: drink water, move slightly, or just close your eyes for a moment. You don\'t need to solve everything.'
            ];
            response = comforts[Math.floor(Math.random() * comforts.length)];
        } else if (lower.includes('vault') || lower.includes('pick') || lower.includes('backlog')) {
            const backlog = Store.load('backlog');
            if (backlog.length > 0) {
                const item = backlog[Math.floor(Math.random() * backlog.length)];
                response = `📦 *rummages through the vault*\n\nHow about: **${item.name}**?\n${item.notes ? `Notes: ${item.notes}` : ''}\n\nWant me to pull it to your quest board?`;
            } else {
                response = 'Your vault is empty! Maybe add some "someday" items first.';
            }
        } else {
            response = `Got it! I've heard you. Here's what I can do:\n\n📊 "Check my status" — see your HP/MP\n🎯 "What should I do?" — task suggestion\n📝 "Daily review" — recap the day\n💆 "I need comfort" — emotional support\n📦 "Pick from vault" — random vault item\n\nOr just tell me what's going on and I'll try to help sort things out!\n\n*(Tip: Add an API key in Settings to get smarter AI responses!)*`;
        }

        this.messages.push({ role: 'assistant', content: response });
        this.addChatBubble(response, 'ai');
    },

    handleQuickPrompt(type) {
        const prompts = {
            status: 'Check my status — how am I doing?',
            suggest: 'What should I do right now?',
            review: 'Generate my daily review / recap',
            comfort: 'I\'m not doing well. I need some comfort.',
            vault: 'Pick something from my vault for me'
        };
        const text = prompts[type] || 'Help me out';
        document.getElementById('chat-input').value = text;
        this.sendMessage(text);
    },

    addChatBubble(content, sender, id) {
        const container = document.getElementById('chat-messages');
        const msg = document.createElement('div');
        msg.className = `chat-msg ${sender}`;
        if (id) msg.id = id;

        const avatar = sender === 'ai' ? '🤖' : '⚔';
        // Simple markdown-ish rendering
        const html = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        msg.innerHTML = `
            <div class="chat-avatar">${avatar}</div>
            <div class="chat-bubble"><p>${html}</p></div>
        `;

        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    },

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    },

    toggleVoice() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            App.toast('Voice input not supported in this browser', 'error');
            return;
        }

        const btn = document.getElementById('voice-input-btn');

        if (this.isRecording) {
            this.recognition.stop();
            btn.classList.remove('recording');
            this.isRecording = false;
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chat-input').value = transcript;
            btn.classList.remove('recording');
            this.isRecording = false;
        };

        this.recognition.onerror = () => {
            btn.classList.remove('recording');
            this.isRecording = false;
        };

        this.recognition.onend = () => {
            btn.classList.remove('recording');
            this.isRecording = false;
        };

        this.recognition.start();
        btn.classList.add('recording');
        this.isRecording = true;
        App.toast('🎤 Listening...', 'info');
    },

    handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgHtml = `<img src="${e.target.result}" style="max-width: 200px; border-radius: 8px; margin-bottom: 0.5rem; display: block;">`;
            this.addChatBubble(imgHtml + 'Uploaded an image', 'user');
            this.addChatBubble('I can see you uploaded an image! To analyze images, make sure you have an API key set up with a vision-capable model (like gpt-4o). For now, feel free to describe what\'s in it and I\'ll help!', 'ai');
        };
        reader.readAsDataURL(file);
    }
};
