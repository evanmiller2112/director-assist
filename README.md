# Director Assist

An AI-powered campaign management tool for Directors running Draw Steel TTRPG campaigns. Keep track of NPCs, locations, factions, plot threads, and more—all in one place, with intelligent search and relationship mapping.

## What It Does

Director Assist helps you organize your campaign world:

- **Track Everything**: Characters, NPCs, locations, factions, items, encounters, sessions, deities, timeline events, world rules, and player profiles
- **Connect the Dots**: Create relationships between entities (knows, allied with, member of, located at)
- **Find Anything Fast**: Search across all your campaign data instantly
- **Never Lose Your Notes**: All data stored locally in your browser with backup/restore
- **Work Your Way**: Light and dark themes, customizable entity types
- **AI Assistant Ready**: Framework in place for AI-powered campaign suggestions (coming soon)

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/director-assist.git
cd director-assist
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

The app builds to a static site in the `build` directory. Deploy it to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

## Using Director Assist

### Creating a Campaign

When you first open Director Assist, create a campaign with:
- **Name**: Your campaign title
- **System**: Draw Steel, D&D 5e, or System Agnostic
- **Setting**: Brief description of your world
- **Description**: Campaign overview

### Managing Entities

Click any entity type in the sidebar or dashboard to view the list. From there you can create new entities or view existing ones. Each entity has a detail page where you can edit or delete it.

**Entity Types:**

- **Characters**: Player characters with background, goals, and secrets
- **NPCs**: Non-player characters with personality, appearance, and motivations
- **Locations**: Cities, dungeons, or regions with atmosphere and features
- **Factions**: Guilds, governments, or secret societies with goals and resources
- **Items**: Weapons, artifacts, or treasures with properties and lore
- **Encounters**: Combat, social, or exploration challenges with setup and rewards
- **Sessions**: Track what happened and plan future sessions
- **Deities**: Gods and divine beings with domains and worshippers
- **Timeline Events**: Historical events with dates and consequences
- **World Rules**: How magic, society, or nature works in your world
- **Player Profiles**: Track player preferences and boundaries

### Creating Relationships

Link entities together to build connections in your campaign world:
- NPCs can be located at specific locations
- Characters can be members of factions
- Items can be owned by characters
- Events can involve multiple NPCs

To create relationships, use the "Links" section on an entity's detail page or edit page.

### Searching

Use the search bar in the header to find entities by:
- Name
- Description
- Tags
- Custom fields

### Backup Your Campaign

Go to Settings to:
- Export your entire campaign as JSON
- Import a previously exported campaign
- Switch themes (light/dark/system)

## Built-In Entity Types

### Character (Player Character)
Track your players' characters with:
- Player name
- Character concept
- Background and personality
- Goals and motivations
- Secrets (DM-only)
- Status (active/inactive/deceased)

### NPC (Non-Player Character)
Organize NPCs with:
- Role/occupation
- Personality and appearance
- Voice and mannerisms
- Motivation
- Secrets
- Importance (major/minor/background)

### Location
Map your world with:
- Location type (city, dungeon, wilderness, etc.)
- Atmosphere
- Notable features
- History
- Parent location (for nested locations)

### Faction
Track organizations with:
- Type (guild, religion, government, criminal, military, secret)
- Goals and values
- Resources and power
- Secrets
- Status (active/disbanded/secret)

### Item
Manage magic items and treasures:
- Item type (weapon, armor, artifact, consumable, tool, treasure)
- Properties and mechanics
- History and lore
- Current owner
- Location
- Rarity

### Encounter
Plan challenges with:
- Type (combat, social, exploration, puzzle, trap, event)
- Setup and hook
- Challenge description
- Possible resolutions
- Rewards
- Difficulty level
- Status (planned/ready/used/scrapped)

### Session
Document your sessions:
- Session number
- Date played
- Summary
- Preparation notes
- Plot threads
- Notable player actions
- Next session hooks

### Deity
Create pantheons with:
- Domains/portfolios
- Alignment/nature
- Symbols
- Worship practices
- Divine relationships

### Timeline Event
Chronicle history with:
- In-world date
- Era/age
- Significance
- Consequences
- Knowledge level (common/scholarly/secret/lost)
- Sort order for chronological display

### World Rule
Define how your world works:
- Category (magic, cosmology, society, nature, history)
- Rule/law description
- Implications
- Exceptions

### Player Profile
Remember player preferences:
- Real name
- Play preferences
- Lines and veils (boundaries)
- Availability
- Contact info

## Tech Stack

### Frontend
- **SvelteKit 2**: Modern web framework with file-based routing
- **Svelte 5**: Reactive UI with runes API
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide Svelte**: Beautiful icon set

### Data & State
- **Dexie.js**: IndexedDB wrapper for local storage
- **Svelte Runes**: Built-in reactive state management
- **nanoid**: Unique ID generation

### AI Integration (Scaffolded)
- **Anthropic SDK**: Claude AI integration (ready for implementation)

### Build & Deploy
- **Vite**: Fast build tool
- **Static Adapter**: Builds to static HTML/CSS/JS
- **ESLint**: Code quality
- **TypeScript ESLint**: Type-aware linting

## Data Storage

All campaign data is stored locally in your browser's IndexedDB. This means:
- No server required
- No internet connection needed after initial load
- Your data stays private
- No account or login needed

**Important**: Always export regular backups. Browser data can be cleared accidentally.

## Browser Support

Works in any modern browser with IndexedDB support:
- Chrome/Edge 80+
- Firefox 75+
- Safari 14+

## License

MIT License - see LICENSE file for details

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for technical details.

## Roadmap

- [ ] AI assistant for generating NPCs, locations, and plot hooks
- [ ] Relationship graph visualization
- [ ] Session prep checklists
- [ ] Dice roller integration
- [ ] Print-friendly entity sheets
- [ ] Mobile app (PWA)
- [ ] Multi-campaign support
- [ ] Cloud sync (optional)

## Support

Found a bug or have a feature request? Open an issue on GitHub.
