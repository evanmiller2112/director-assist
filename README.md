# Director Assist

An AI-powered campaign management tool for Directors running Draw Steel TTRPG campaigns. Keep track of NPCs, locations, factions, plot threads, and more—all in one place, with intelligent search and relationship mapping.

## Features

- **Track Everything**: Characters, NPCs, locations, factions, items, encounters, sessions, deities, timeline events, world rules, and player profiles
- **Connect the Dots**: Create relationships between entities (knows, allied with, member of, located at)
- **Find Anything Fast**: Search across all your campaign data instantly
- **Never Lose Your Notes**: All data stored locally in your browser with backup/restore
- **Work Your Way**: Light and dark themes, customizable entity types
- **AI-Powered Field Generation**: Generate content for individual fields using Claude AI, with context from other fields

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### Installation

```bash
git clone https://github.com/yourusername/director-assist.git
cd director-assist
npm install
npm run dev
```

Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The app builds to a static site in the `build` directory. Deploy to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

## How to Use

### First Steps

1. Create a campaign with a name, system (Draw Steel, D&D 5e, or System Agnostic), and setting description
2. Add your Anthropic API key in Settings to enable AI features (optional)
3. Start adding entities using the sidebar or dashboard
4. Link entities together to build relationships
5. Use the search bar to find anything quickly
6. Export regular backups from Settings

### AI-Powered Content Generation

Director Assist can generate content for individual fields using Claude AI:

1. Fill in some basic information about your entity (name, description, tags)
2. Click the sparkle button next to any text field
3. AI generates context-aware content based on what you've already filled in
4. DM-only fields (like secrets) are kept private and not shared with AI

**Generatable Field Types:**
- Single-line text fields
- Multi-line textarea fields
- Rich text (markdown) fields

**Requires:** Anthropic API key (add in Settings)

### Entity Types

Director Assist includes 11 built-in entity types:

- **Characters** - Player characters with background, goals, and secrets
- **NPCs** - Non-player characters with personality and motivations
- **Locations** - Cities, dungeons, regions with atmosphere and features
- **Factions** - Organizations with goals and resources
- **Items** - Weapons, artifacts, treasures with properties and lore
- **Encounters** - Combat, social, or exploration challenges
- **Sessions** - Session notes and preparation
- **Deities** - Gods with domains and worshippers
- **Timeline Events** - Historical events with dates and consequences
- **World Rules** - How magic, society, or nature works in your world
- **Player Profiles** - Player preferences and boundaries

Each entity type has custom fields relevant to its purpose. See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for technical details on the entity system.

## Tech Stack

Built with modern web technologies for a fast, offline-first experience:

- **SvelteKit 2 + Svelte 5** - Reactive UI with file-based routing
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Dexie.js** - IndexedDB wrapper for local storage
- **Anthropic SDK** - Claude AI integration (scaffolded)

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed technical documentation.

## Data Storage

All campaign data is stored locally in your browser's IndexedDB:
- No server required
- Works offline after initial load
- Your data stays private
- No account or login needed

**Important**: Export regular backups from Settings. Browser data can be cleared accidentally.

## Browser Support

Requires a modern browser with IndexedDB support:
- Chrome/Edge 80+
- Firefox 75+
- Safari 14+

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Code style guidelines
- Testing guidelines
- Pull request process

## Roadmap

- Full-entity AI generation (create entire NPCs, locations, etc. at once)
- AI chat assistant for campaign planning and plot suggestions
- Relationship graph visualization
- Session prep checklists
- Dice roller integration
- Print-friendly entity sheets
- Mobile app (PWA)
- Multi-campaign support
- Cloud sync (optional)

## License

MIT License - see LICENSE file for details.

## Support

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/yourusername/director-assist/issues).
