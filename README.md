# ADHD Living ⚔

**An RPG-themed life management web app designed specifically for people with ADHD.**

Turn your chaotic daily life into a manageable quest — with habit cards, supervisor mode, an AI companion, and a full RPG progression system.

## Features

### 🏠 Dashboard (Command Center)
- **HP/MP bars**: Physical (stamina, diet, sleep) and Mental (spirit, focus, mood) tracking
- **Day Status**: Green (energized) / Yellow (moderate) / Red (low power)
- **Buffs & Debuffs**: Track active effects like caffeinated, tired, brain fog, hyperfocus, etc.
- **Quick Actions**: One-click access to transition cards, supervisor mode, AI companion

### ⚔ Quest Board (Daily Tasks)
- Three-tier task system: **Boss** (critical), **Survival** (essential), **Side** (optional)
- In low-power (red) mode, boss quests are dimmed — focus on survival only
- XP and Gold rewards for completing quests

### 📦 The Vault (Backlog / Someday)
- Store everything for "later" — actions, projects, wishlist, media
- Pull items to the quest board when ready
- Categories and filtering

### 📜 Weekly Campaign
- Main quests and side quests for the week
- Weekly review section
- Auto-archives previous weeks

### 🃏 Habit Card Deck
- Card-based habit tracking with tiers (main, survival, light)
- **Combo system**: Chain habits for XP multipliers
- Streak tracking per habit

### 🎲 Transition Cards
- Draw a random card when stuck or paralyzed
- Pre-loaded with gentle micro-tasks
- Add your own (take out trash, drink water, stretch, etc.)

### 🛡 Supervisor Mode
- Emergency override for action paralysis
- Timed command sequences adapted to time of day (morning, general, paralysis, night)
- Direct, short commands: "Stop thinking. Stand up. Walk to kitchen. Drink water. Now."

### 🔥 Campfire Log (Records)
- Daily recap, sleep, diet, medications, journal
- Photo uploads
- Water tracking, sleep quality rating
- Full history view

### 🏪 Adventurer's Guild (Shop & RPG)
- Character progression: Level, XP, Gold
- Equipment system (weapon, armor, accessory)
- Shop with purchasable items
- Inventory and achievement system
- Adventure log tracking all actions

### 🤖 AI Companion
- Chat interface with quick prompts
- Status checks, task suggestions, daily reviews, comfort mode
- **Voice input** support (Web Speech API)
- **Image upload** support
- Works offline with built-in responses
- Connect your own OpenAI-compatible API for full AI power

## Tech Stack

- Pure HTML/CSS/JavaScript — no frameworks, no build step
- localStorage for all data persistence
- Mobile responsive design
- Dark/Light theme
- Keyboard shortcuts (1-0 for navigation, ESC for modals)

## Setup

1. Clone the repo
2. Open `index.html` in a browser, or serve with any static file server
3. For GitHub Pages: push to `main` branch and enable Pages

```bash
# Local development
cd adhd-living
# Just open index.html, or:
python -m http.server 8000
```

## AI Setup (Optional)

1. Go to Settings (⚙)
2. Enter your OpenAI API key (or any OpenAI-compatible endpoint)
3. Choose your model (default: gpt-4o-mini)
4. The AI companion will use your API for smarter responses

Your API key is stored locally and never sent anywhere except the API endpoint you configure.

## Data

All data is stored in your browser's localStorage. Use Settings to:
- **Export** all data as JSON backup
- **Import** data from a backup
- **Reset** all data

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| 1-0 | Navigate to pages (Dashboard, Tasks, etc.) |
| ESC | Close modals / sidebar |

## Design Philosophy

This app is built around how ADHD brains actually work:
- **Now vs Not-Now**: Tasks are either today or in the vault. No complex scheduling.
- **Energy-aware**: The system adapts to your current energy level.
- **Gamification that matters**: RPG progression provides visible progress without fake rewards.
- **Emergency systems**: Supervisor mode and transition cards for when executive function fails.
- **Low friction**: Everything can be done in 1-2 clicks. AI can handle the rest.

## License

Private repository — not yet public.

---

*Built with 💜 for the ADHD community.*
