/* ============================================
   Supervisor Mode Module
   Emergency override — direct commands
   ============================================ */

const Supervisor = {
    active: false,
    commands: [],
    currentIndex: 0,

    // Pre-built command sequences
    sequences: {
        general: [
            { text: 'Stop thinking.', sub: 'Right now.' },
            { text: 'Stand up.', sub: 'Move your body.' },
            { text: 'Walk to the kitchen.', sub: 'One step at a time.' },
            { text: 'Drink a glass of water.', sub: 'Full glass. Drink it all.' },
            { text: 'Splash cold water on your face.', sub: 'Wake up.' },
            { text: 'Come back.', sub: 'Sit down.' },
            { text: 'Pick ONE thing from your quest board.', sub: 'The easiest one.' },
            { text: 'Set a 10-minute timer.', sub: 'Just 10 minutes. Start.' },
            { text: 'Do it now.', sub: 'Reply when done.' }
        ],
        morning: [
            { text: 'Open your eyes.', sub: 'You\'re awake now.' },
            { text: 'Don\'t touch your phone.', sub: 'Not yet.' },
            { text: 'Sit up.', sub: 'Swing your legs over the bed.' },
            { text: 'Stand.', sub: 'Both feet on the floor.' },
            { text: 'Go to bathroom.', sub: 'Wash your face.' },
            { text: 'Brush teeth.', sub: '2 minutes.' },
            { text: 'Drink water.', sub: 'A full glass.' },
            { text: 'Get dressed.', sub: 'Anything. Just not pajamas.' },
            { text: 'You\'re ready.', sub: 'Check your quest board.' }
        ],
        paralysis: [
            { text: 'STOP.', sub: 'Close everything.' },
            { text: 'Put the phone down.', sub: 'Screen off. Away from you.' },
            { text: 'Close your eyes.', sub: '5 deep breaths.' },
            { text: 'Breathe in... 4 counts.', sub: '1... 2... 3... 4...' },
            { text: 'Hold... 4 counts.', sub: '1... 2... 3... 4...' },
            { text: 'Out... 6 counts.', sub: '1... 2... 3... 4... 5... 6...' },
            { text: 'Again. 3 more times.', sub: 'Just breathe.' },
            { text: 'Open your eyes.', sub: 'Look around the room.' },
            { text: 'Name 5 things you can see.', sub: 'Say them out loud.' },
            { text: 'Good.', sub: 'Now pick the smallest possible action.' },
            { text: 'Do it.', sub: 'Nothing else matters right now.' }
        ],
        night: [
            { text: 'Stop what you\'re doing.', sub: 'It can wait until tomorrow.' },
            { text: 'Save your work.', sub: 'Close all tabs.' },
            { text: 'Turn off bright lights.', sub: 'Dim everything.' },
            { text: 'Go brush your teeth.', sub: 'Now.' },
            { text: 'Wash your face.', sub: 'Warm water.' },
            { text: 'Change into sleep clothes.', sub: 'Comfortable ones.' },
            { text: 'Get into bed.', sub: 'Phone on charger, away from bed.' },
            { text: 'Close your eyes.', sub: 'Tomorrow is a new day. Rest.' }
        ]
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('activate-supervisor').addEventListener('click', () => {
            this.activate();
        });

        document.getElementById('deactivate-supervisor').addEventListener('click', () => {
            this.deactivate();
        });

        document.getElementById('command-done').addEventListener('click', () => {
            this.nextCommand();
        });

        document.getElementById('command-skip').addEventListener('click', () => {
            this.skipCommand();
        });
    },

    activate(sequenceType) {
        // Auto-detect based on time
        if (!sequenceType) {
            const h = new Date().getHours();
            if (h < 10) sequenceType = 'morning';
            else if (h > 22) sequenceType = 'night';
            else sequenceType = 'general';
        }

        this.commands = [...this.sequences[sequenceType]];
        this.currentIndex = 0;
        this.active = true;

        document.getElementById('supervisor-status').classList.add('hidden');
        document.getElementById('supervisor-active').classList.remove('hidden');

        this.showCommand();

        const log = Store.load('adventureLog');
        log.push({
            time: Store.timeOfDay(),
            text: `⚠ Supervisor Mode activated (${sequenceType})`
        });
        Store.save('adventureLog', log);

        App.toast('🛡 Supervisor Mode ACTIVATED', 'error');
    },

    deactivate() {
        this.active = false;
        document.getElementById('supervisor-active').classList.add('hidden');
        document.getElementById('supervisor-status').classList.remove('hidden');

        // Small XP for using supervisor mode
        const character = Store.load('character');
        character.xp += 5;
        Store.save('character', character);

        App.toast('Supervisor Mode deactivated. +5XP for trying.', 'info');
        Dashboard.character = Store.load('character');
        Dashboard.render();
    },

    showCommand() {
        if (this.currentIndex >= this.commands.length) {
            this.complete();
            return;
        }

        const cmd = this.commands[this.currentIndex];
        document.getElementById('command-text').textContent = cmd.text;
        document.getElementById('command-sub').textContent = cmd.sub;

        // Update queue
        const queue = document.getElementById('command-queue');
        queue.innerHTML = this.commands.map((c, i) => {
            let cls = '';
            if (i < this.currentIndex) cls = 'done';
            else if (i === this.currentIndex) cls = 'current';
            return `<div class="command-queue-item ${cls}">${i + 1}. ${c.text}</div>`;
        }).join('');
    },

    nextCommand() {
        this.currentIndex++;
        this.showCommand();
    },

    skipCommand() {
        this.currentIndex++;
        this.showCommand();
    },

    complete() {
        const character = Store.load('character');
        character.xp += 20;
        character.gold += 10;

        while (character.xp >= character.xpToNext) {
            character.xp -= character.xpToNext;
            character.level++;
            character.xpToNext = Math.floor(character.xpToNext * 1.3);
            App.toast(`⬆ LEVEL UP! Level ${character.level}!`, 'gold');
        }
        Store.save('character', character);

        const log = Store.load('adventureLog');
        log.push({
            time: Store.timeOfDay(),
            text: `Completed Supervisor sequence! (+20XP, +10G)`
        });
        Store.save('adventureLog', log);

        App.toast('🛡 Sequence complete! You did it. +20XP +10G', 'gold');

        this.deactivate();
        Dashboard.character = Store.load('character');
        Dashboard.render();
    }
};
