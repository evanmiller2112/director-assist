# Director Assist

An AI-powered campaign management tool for Directors running TTRPG campaigns. Keep track of NPCs, locations, factions, plot threads, and more—all in one place, with intelligent search and relationship mapping.

Director Assist features a **system-aware architecture** with first-class support for Draw Steel and other game systems. Select your game system when creating a campaign, and the app automatically customizes entity fields, terminology, and AI context to match.

## Features

- **Track Everything**: Characters, NPCs, locations, factions, items, encounters, sessions, deities, timeline events, world rules, and player profiles
- **Connect the Dots**: Create relationships between entities (knows, allied with, member of, located at)
- **Visualize Connections**: Relationship Matrix View shows a 2D grid of relationships between entity types with filtering, sorting, and color-coded cell density
- **Find Anything Fast**: Global search with Cmd/Ctrl+K shortcut, results grouped by type, keyboard navigation
- **Command Palette**: Quick actions by typing "/" in the search bar—create entities, navigate pages, relate entities, and more
- **Never Lose Your Notes**: All data stored locally in your browser with backup/restore
- **Work Your Way**: Light and dark themes, customizable entity types
- **System-Aware**: First-class support for Draw Steel and System Agnostic modes with game-specific fields and terminology
- **AI-Powered Content Generation**: Generate content using Claude AI with campaign context awareness
- **Responsive Loading States**: Polished loading feedback with skeleton screens, spinners, and loading buttons

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or pnpm

### Installation

```bash
git clone https://github.com/evanmiller2112/director-assist.git
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

1. Create a campaign with a name, game system (Draw Steel or System Agnostic), and setting description
   - **Draw Steel**: Adds system-specific fields (ancestry, class, threat levels, victory points) and uses "Director" terminology
   - **System Agnostic**: Generic fields suitable for any TTRPG system
2. Add an AI provider API key in Settings to enable AI features (optional)
3. Start adding entities using the sidebar or dashboard
4. Link entities together to build relationships
5. Use the search bar to find anything quickly
6. Export regular backups from Settings

### Command Palette

Access quick actions by typing "/" as the first character in the search bar. Commands are context-aware and provide shortcuts for common tasks.

**Available Commands:**

- `/new [type]` - Create a new entity (e.g., `/new npc`, `/new location`)
- `/search [query]` - Search across all entities
- `/go [destination]` - Navigate to pages (campaign, settings, chat)
- `/relate` - Create a relationship to another entity (requires viewing an entity)
- `/summarize` - Generate an AI summary of the current entity (requires viewing an entity)
- `/settings` - Open the settings page

**How to Use:**

1. Click the search bar in the header (or press Cmd/Ctrl+K)
2. Type "/" to enter command mode
3. Start typing a command name to filter options
4. Use arrow keys to navigate, Enter to execute, Escape to cancel
5. Add arguments after the command (e.g., `/new character`)

Commands adapt to your current page. Entity-specific commands like `/relate` and `/summarize` only appear when you're viewing an entity.

### AI-Powered Content Generation

Director Assist can generate content for individual fields using AI from multiple providers. All AI features can be disabled with a single toggle in Settings.

**Supported AI Providers:**
- Anthropic (Claude models)
- OpenAI (GPT models)
- Google (Gemini models)
- Mistral (Mistral models)
- Ollama (local models)

**Setup:**
1. Get an API key from your chosen provider (e.g., [console.anthropic.com](https://console.anthropic.com) for Claude)
2. Add it in Settings (gear icon in header)
3. The AI uses your campaign setting and system to generate appropriate content
4. Use the "Enable AI Features" toggle in Settings to turn all AI features on or off

**Working Without AI:**
AI features are completely optional. Toggle "Enable AI Features" off in Settings to use Director Assist as a pure campaign management tool with no AI elements visible. Your existing AI-generated content remains visible but the generation interface is hidden.

**Generatable Field Types:**
- Single-line text fields
- Multi-line textarea fields
- Rich text fields (markdown editor with formatting toolbar)

When creating or editing any entity, look for the sparkle button next to text fields:

1. Fill in basic information first (name, description, tags)
2. Click the generate button next to any field you want AI to complete
3. The AI considers your campaign context and other filled fields
4. Review and edit the generated content as needed

**What Can Be Generated:**
- Core entity fields (Summary and Description with dedicated Generate buttons)
- Text fields (role, title, occupation, etc.)
- Multi-line fields (personality, appearance, motivation, etc.)
- Rich text fields (background, history, detailed descriptions)

**Relationship Context in Generation:**

When generating fields for existing entities, Director Assist automatically includes information about related entities to create more contextually aware content. This feature:

- **Smart Field Detection**: Automatically identifies fields that benefit from relationship context (personality, motivation, goals, background)
- **Budget Allocation**: High-priority fields get 75% of character budget, medium priority gets 50%, low priority gets 25%
- **Entity Type Awareness**: Works best for NPCs, Characters, Factions, and Locations
- **Privacy Preserved**: Only uses non-hidden relationship data
- **Settings Control**: Adjust in Settings → Relationship Context to control how much context is included

**Privacy Protection:**
- DM-only fields (secrets, hidden agendas) are never sent to the AI
- Your API key is stored only in your browser
- No data is sent to Director Assist servers (there aren't any)

**Requires:** API key for your chosen provider (add in Settings)

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

Each entity type has custom fields relevant to its purpose. When you select a game system for your campaign, entity types automatically gain system-specific fields:

**Draw Steel System Enhancements:**
- **Characters**: Ancestry, Class, Kit, Heroic Resource
- **NPCs**: Threat Level (minion/standard/elite/boss/solo), Combat Role (ambusher, artillery, brute, etc.)
- **Encounters**: Victory Points, Negotiation DC, system-specific encounter types (combat, negotiation, montage, exploration)

**System Agnostic Mode:**
Uses generic fields suitable for any TTRPG system without game-specific terminology or mechanics.

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for technical details on the system-aware entity architecture.

## Tech Stack

Built with modern web technologies for a fast, offline-first experience:

- **SvelteKit 2 + Svelte 5** - Reactive UI with file-based routing
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Dexie.js** - IndexedDB wrapper for local storage
- **Vercel AI SDK** - Multi-provider AI integration (Anthropic, OpenAI, Google, Mistral, Ollama)

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed technical documentation.

## Data Storage

All campaign data is stored locally in your browser's IndexedDB:
- No server required
- Works offline after initial load
- Your data stays private
- No account or login needed

**Important**: Export regular backups from Settings. Browser data can be cleared accidentally.

**Security**: Exported backups never include your API key or sensitive settings. Backups contain only your campaign data (entities, chat history, and campaign reference). Safe to share or store in cloud services.

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

- Full-entity AI generation (create complete entities with all fields at once)
- AI chat assistant for campaign planning and plot suggestions
- AI-suggested relationships between entities
- Session prep checklists
- Dice roller integration
- Print-friendly entity sheets
- Mobile app (PWA)
- Multi-campaign support
- Cloud sync (optional)

## License

MIT License - see LICENSE file for details.

## Support

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/evanmiller2112/director-assist/issues).
