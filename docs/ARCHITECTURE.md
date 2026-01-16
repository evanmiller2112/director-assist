# Architecture Documentation

This document describes the technical architecture of Director Assist.

## Overview

Director Assist is a client-side web application built with SvelteKit 2 and Svelte 5. All data is stored locally in the browser using IndexedDB, making it work offline and keep user data private.

**Key Characteristics:**
- Static site (no backend server required)
- Client-side only (all logic runs in the browser)
- Local-first data storage (IndexedDB via Dexie)
- Reactive UI (Svelte 5 runes)
- Type-safe (TypeScript throughout)

## Technology Stack

### Core Framework
- **SvelteKit 2**: Full-stack web framework with file-based routing
- **Svelte 5**: Component framework using the new runes API (`$state`, `$derived`, `$effect`)
- **TypeScript**: Type safety across the entire codebase
- **Vite**: Fast build tool and dev server
- **Static Adapter**: Builds to deployable static HTML/CSS/JS

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Svelte**: Icon library
- **CSS Custom Properties**: Theme variables for dark/light mode

### Data Layer
- **Dexie.js**: IndexedDB wrapper with a clean API
- **IndexedDB**: Browser's persistent storage database
- **nanoid**: Unique ID generation for entities

### AI Integration
- **Anthropic SDK**: Claude AI client for content generation
- **Field Generation Service**: Per-field AI content generation with context awareness

## Directory Structure

```
src/
├── lib/
│   ├── components/          # Reusable Svelte components
│   │   ├── entity/          # Entity-specific components
│   │   │   └── FieldGenerateButton.svelte
│   │   └── layout/          # Layout components
│   │       ├── Header.svelte
│   │       ├── HeaderSearch.svelte
│   │       └── Sidebar.svelte
│   ├── config/              # Configuration and definitions
│   │   ├── commands.ts      # Command palette definitions
│   │   └── entityTypes.ts   # Entity type definitions
│   ├── utils/               # Utility functions
│   │   └── commandUtils.ts  # Command parsing and filtering
│   ├── db/                  # Database layer
│   │   ├── index.ts         # Dexie database setup
│   │   └── repositories/    # Data access layer
│   │       ├── entityRepository.ts
│   │       ├── campaignRepository.ts
│   │       └── chatRepository.ts
│   ├── services/            # Business logic services
│   │   ├── fieldGenerationService.ts  # AI field generation
│   │   └── modelService.ts            # AI model selection
│   ├── stores/              # Application state
│   │   ├── campaign.svelte.ts
│   │   ├── entities.svelte.ts
│   │   └── ui.svelte.ts
│   └── types/               # TypeScript definitions
│       ├── entities.ts      # Entity type system
│       ├── campaign.ts      # Campaign types
│       ├── ai.ts            # AI integration types
│       └── index.ts         # Type exports
├── routes/                  # SvelteKit routes (pages)
│   ├── +layout.svelte       # Root layout
│   ├── +page.svelte         # Dashboard (/)
│   ├── entities/            # Entity routes
│   │   └── [type]/          # Dynamic entity type routes
│   │       ├── +page.svelte     # List entities (/entities/npc)
│   │       ├── new/
│   │       │   └── +page.svelte # Create entity (/entities/npc/new)
│   │       └── [id]/
│   │           ├── +page.svelte # View entity (/entities/npc/abc123)
│   │           └── edit/
│   │               └── +page.svelte # Edit entity (/entities/npc/abc123/edit)
│   └── settings/
│       └── +page.svelte     # Settings page
├── app.css                  # Global styles & Tailwind
├── app.html                 # HTML template
└── app.d.ts                 # TypeScript ambient declarations
```

## Data Model

### Core Entities

#### Campaign
The top-level container for all campaign data.

```typescript
interface Campaign {
  id: EntityId;
  name: string;
  description: string;
  system: string;              // "Draw Steel", "D&D 5e", etc.
  setting: string;             // Campaign setting name
  createdAt: Date;
  updatedAt: Date;
  customEntityTypes: EntityTypeDefinition[];
  settings: CampaignSettings;
}

interface CampaignSettings {
  customRelationships: string[];
  enabledEntityTypes: string[];
  theme?: 'light' | 'dark' | 'system';
}
```

**Relationships:**
- One campaign per database
- Contains all entities and chat history

#### BaseEntity
All entity types extend this base structure.

```typescript
interface BaseEntity {
  id: EntityId;                // Unique ID (nanoid)
  type: EntityType;            // Entity type identifier
  name: string;
  description: string;         // Rich text (markdown)
  tags: string[];
  imageUrl?: string;
  fields: Record<string, FieldValue>;  // Dynamic fields
  links: EntityLink[];         // Relationships to other entities
  notes: string;               // Private DM notes
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}
```

**Key Concepts:**
- **Dynamic Fields**: Each entity type defines its own fields via `EntityTypeDefinition`
- **Flexible**: Same base structure for all 11 built-in types plus custom types
- **Linked**: Entities reference each other through `EntityLink` objects

#### EntityLink
Represents a relationship between two entities.

```typescript
interface EntityLink {
  id: EntityId;
  targetId: EntityId;
  targetType: EntityType;
  relationship: string;        // "knows", "located_at", "member_of", etc.
  bidirectional: boolean;
  notes?: string;
}
```

**Examples:**
- NPC → "located_at" → Location
- Character → "member_of" → Faction
- Item → "owned_by" → Character

### Dynamic Field System

Entities use a dynamic field system that allows different entity types to have different fields.

#### Field Types

```typescript
type FieldType =
  | 'text'           // Single-line text input
  | 'textarea'       // Multi-line text input
  | 'richtext'       // Markdown editor
  | 'number'         // Numeric input
  | 'boolean'        // Checkbox (Yes/No)
  | 'select'         // Dropdown (single choice)
  | 'multi-select'   // Multiple checkboxes
  | 'tags'           // Comma-separated tag input
  | 'entity-ref'     // Single entity reference with searchable dropdown
  | 'entity-refs'    // Multiple entity references with chips
  | 'date'           // Freeform date/timeline input
  | 'url'            // URL input with validation and link preview
  | 'image';         // Image upload with base64 storage and preview
```

#### Field Definition

```typescript
interface FieldDefinition {
  key: string;                 // Unique key for the field
  label: string;               // Display label
  type: FieldType;
  required: boolean;
  defaultValue?: FieldValue;
  options?: string[];          // For select fields
  entityTypes?: EntityType[];  // For entity-ref fields
  placeholder?: string;
  helpText?: string;
  section?: string;            // UI grouping (e.g., "hidden")
  order: number;               // Display order
}
```

#### Entity Type Definition

```typescript
interface EntityTypeDefinition {
  type: EntityType;
  label: string;               // Singular label
  labelPlural: string;         // Plural label
  icon: string;                // Lucide icon name
  color: string;               // Theme color key
  isBuiltIn: boolean;
  fieldDefinitions: FieldDefinition[];
  defaultRelationships: string[];
}
```

**How It Works:**
1. Entity types are defined in `src/lib/config/entityTypes.ts`
2. Each type specifies what fields it has
3. When creating an entity, the UI renders the appropriate field components
4. Field values are stored in the `fields` object on the entity

**Example:** NPC entity type has fields like `role`, `personality`, `appearance`, `voice`, `motivation`, `secrets`, `status`, and `importance`.

#### Field Type Implementation Details

**Text-based Fields:**
- `text`, `textarea`, `richtext` - Support AI generation via FieldGenerateButton
- Values stored as strings
- Support placeholder text and help text

**Boolean Fields:**
- Rendered as checkbox input
- Displays Yes/No on detail view
- Values stored as boolean

**Selection Fields:**
- `select` - Dropdown with single selection
- `multi-select` - Multiple checkboxes, values stored as string array
- `tags` - Comma-separated input, values stored as string array
- All support custom options defined in FieldDefinition

**Date Fields:**
- Freeform text input (not a date picker)
- Supports fictional dates like "Year 1042, Third Age"
- Values stored as strings

**URL Fields:**
- Text input with URL validation
- Displays "Open Link" button when valid URL entered
- Opens in new tab with security attributes

**Image Fields:**
- File upload with image preview
- Converts to base64 for storage in IndexedDB
- Shows preview with remove button
- Warns if file size > 1MB
- Values stored as base64 data URL strings

**Entity Reference Fields:**
- `entity-ref` - Single entity reference with searchable dropdown
  - Shows selected entity name with clear button
  - Dropdown with search filter
  - Values stored as entity ID (string)
- `entity-refs` - Multiple entity references with chips
  - Shows selected entities as removable chips
  - Search input to add more entities
  - Values stored as array of entity IDs (string[])
- Both support `entityTypes` filter to limit selectable entities

**Field Rendering Locations:**
- `/src/routes/entities/[type]/new/+page.svelte` - Create form
- `/src/routes/entities/[type]/[id]/edit/+page.svelte` - Edit form
- `/src/routes/entities/[type]/[id]/+page.svelte` - Detail view

## Data Flow

### Architecture Pattern

Director Assist uses a unidirectional data flow:

```
User Action → Store → Repository → Database
                ↓                      ↓
            Component ← Reactive Query ←┘
```

### Components

#### 1. UI Components
- Handle user interactions
- Read from stores
- Call store methods to trigger changes
- Automatically re-render on store updates

#### 2. Stores (State Management)
- Hold reactive application state using Svelte 5 runes
- Provide methods for state mutations
- Call repository methods to persist changes
- Example: `campaignStore`, `entitiesStore`, `uiStore`

**Svelte 5 Runes Used:**
- `$state`: Reactive state variables
- `$derived`: Computed values that update automatically
- `$effect`: Side effects that run when dependencies change

#### 3. Repositories (Data Access Layer)
- Abstract database operations
- Provide clean API for CRUD operations
- Handle IndexedDB queries
- Return Observables for reactive queries

#### 4. Dexie Database
- Wraps IndexedDB
- Provides type-safe queries
- Manages schema versions
- Handles transactions

### Example Data Flow: Creating an Entity

```
1. User fills out creation form and submits
   ↓
2. Component calls entitiesStore.create()
   ↓
3. Store validates data and calls entityRepository.create()
   ↓
4. Repository adds entity to IndexedDB via Dexie
   ↓
5. Dexie triggers change notification
   ↓
6. Live query updates
   ↓
7. Store state updates automatically
   ↓
8. Components re-render with new entity
   ↓
9. User is redirected to entity detail page
```

### Example Data Flow: Updating an Entity

```
1. User navigates to edit page and modifies fields
   ↓
2. Component calls entitiesStore.update()
   ↓
3. Store validates changes and calls entityRepository.update()
   ↓
4. Repository updates entity in IndexedDB via Dexie
   ↓
5. Dexie triggers change notification
   ↓
6. Live query updates
   ↓
7. Store state updates automatically
   ↓
8. All components showing this entity re-render
   ↓
9. User is redirected to entity detail page
```

## Database Schema

### Tables

#### `entities`
Stores all campaign entities (characters, NPCs, locations, etc.).

**Indexes:**
- `id` (primary key)
- `type` (for filtering by entity type)
- `name` (for name-based queries)
- `tags` (multi-entry index for tag searches)
- `createdAt` (for sorting)
- `updatedAt` (for recent items)

#### `campaign`
Stores the single campaign object.

**Indexes:**
- `id` (primary key)

#### `chatMessages`
Stores AI chat conversation history.

**Indexes:**
- `id` (primary key)
- `timestamp` (for chronological order)

#### `suggestions`
Stores AI-generated suggestions.

**Indexes:**
- `id` (primary key)
- `type` (for filtering by suggestion type)
- `dismissed` (for filtering active suggestions)
- `createdAt` (for sorting)

### Database Versioning

The database version is defined in `src/lib/db/index.ts`:

```typescript
this.version(1).stores({
  entities: 'id, type, name, *tags, createdAt, updatedAt',
  campaign: 'id',
  chatMessages: 'id, timestamp',
  suggestions: 'id, type, dismissed, createdAt'
});
```

**To add a new version:**
1. Increment the version number
2. Define the new schema
3. Add an `.upgrade()` function for migrations

## Reactive Queries

### Live Queries with Dexie

Repositories use `liveQuery()` to create reactive database queries:

```typescript
// Repository method
getAll(): Observable<BaseEntity[]> {
  return liveQuery(() => db.entities.toArray());
}

// In a component
const entities = entityRepository.getAll();
// Automatically updates when database changes
```

**Benefits:**
- Automatic reactivity without manual subscriptions
- Components always show current data
- Works across tabs (same-origin)

### Store Integration

Stores use `$effect` to subscribe to live queries:

```typescript
$effect(() => {
  const subscription = entityRepository.getAll().subscribe(
    (result) => {
      entities = result;
    }
  );

  return () => subscription.unsubscribe();
});
```

## Routing

### File-Based Routing

SvelteKit uses file-based routing. Each file in `src/routes/` becomes a route.

**Examples:**
- `src/routes/+page.svelte` → `/`
- `src/routes/settings/+page.svelte` → `/settings`
- `src/routes/entities/[type]/+page.svelte` → `/entities/npc` (dynamic)
- `src/routes/entities/[type]/new/+page.svelte` → `/entities/npc/new`
- `src/routes/entities/[type]/[id]/+page.svelte` → `/entities/npc/abc123`
- `src/routes/entities/[type]/[id]/edit/+page.svelte` → `/entities/npc/abc123/edit`

### Dynamic Routes

Routes with `[param]` are dynamic:
- `[type]` matches any entity type
- `[id]` matches any entity ID

Access parameters in components:

```svelte
<script lang="ts">
  import { page } from '$app/stores';

  const type = $page.params.type;  // "npc", "location", etc.
  const id = $page.params.id;      // entity ID
</script>
```

### Layout

`+layout.svelte` wraps all pages:
- Contains Header and Sidebar
- Provides global state
- Handles theme application

## State Management

### Stores

Director Assist uses Svelte 5 runes for state management instead of traditional Svelte stores.

#### Campaign Store (`campaign.svelte.ts`)

Manages the current campaign:
- `campaign`: Current campaign object
- `isLoading`: Loading state
- `error`: Error message
- `load()`: Load campaign from database
- `update()`: Update campaign
- `updateSettings()`: Update campaign settings

#### Entities Store (`entities.svelte.ts`)

Manages all entities:
- `entities`: Array of all entities
- `entitiesByType`: Entities grouped by type
- `load()`: Load entities from database
- `create()`: Create new entity
- `update()`: Update existing entity
- `delete()`: Delete entity
- `linkEntities()`: Create relationship between entities

#### UI Store (`ui.svelte.ts`)

Manages UI state:
- `sidebarOpen`: Whether sidebar is open
- `theme`: Current theme (light/dark/system)
- `searchQuery`: Current search query
- `toggleSidebar()`: Toggle sidebar
- `setTheme()`: Change theme

## Search & Filtering

### Global Search

The HeaderSearch component provides instant access to all campaign entities:

**Features:**
- Debounced input (150ms) to optimize performance
- Results grouped by entity type
- Maximum 5 results per type
- Keyboard navigation (Arrow Up/Down, Enter, Escape)
- Global keyboard shortcut (Cmd+K or Ctrl+K)
- Click outside to close dropdown
- ARIA attributes for accessibility

**Implementation:**
- Search query updates the entities store via `setSearchQuery()`
- Store filters entities reactively based on query
- Results displayed in dropdown with type headers and icons
- Selected result highlighted for keyboard navigation

### Search Implementation

Search is implemented in the entity repository:

```typescript
search(query: string): Observable<BaseEntity[]> {
  const lowerQuery = query.toLowerCase();
  return liveQuery(() =>
    db.entities
      .filter(entity =>
        entity.name.toLowerCase().includes(lowerQuery) ||
        entity.description.toLowerCase().includes(lowerQuery) ||
        entity.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .toArray()
  );
}
```

**Search covers:**
- Entity name
- Description
- Tags
- Custom field values (future enhancement)

### Filtering by Type

Type filtering uses IndexedDB indexes for performance:

```typescript
getByType(type: EntityType): Observable<BaseEntity[]> {
  return liveQuery(() =>
    db.entities.where('type').equals(type).toArray()
  );
}
```

## Command System

The command palette provides quick access to common actions through a keyboard-driven interface integrated into the HeaderSearch component.

### Overview

Users trigger command mode by typing "/" as the first character in the search bar. Commands are context-aware, filtering based on the current page context (e.g., entity-specific commands only appear when viewing an entity).

**Key Files:**
- `/src/lib/config/commands.ts` - Command definitions and execution logic
- `/src/lib/utils/commandUtils.ts` - Command parsing and filtering utilities
- `/src/lib/components/layout/HeaderSearch.svelte` - UI integration

### Command Definition

Commands are defined using the `CommandDefinition` interface:

```typescript
interface CommandDefinition {
  id: string;                    // Unique identifier (e.g., "new", "relate")
  name: string;                  // Display name
  description: string;           // User-facing description
  icon: string;                  // Lucide icon name
  requiresEntity: boolean;       // Whether command needs entity context
  execute: (context, argument) => void | Promise<void>;
}
```

**Command Context:**

```typescript
interface CommandContext {
  currentEntityId: string | null;
  currentEntityType: EntityType | null;
  goto: (url: string) => Promise<void>;
}
```

Commands receive context about the current page and can navigate using the provided `goto` function.

### Available Commands

#### `/new [type]`
Creates a new entity of the specified type.

- **Requires Entity:** No
- **Arguments:** Optional entity type (defaults to "character")
- **Example:** `/new npc`, `/new location`
- **Navigation:** `/entities/{type}/new`

#### `/search [query]`
Searches across all entities.

- **Requires Entity:** No
- **Arguments:** Search query string
- **Example:** `/search dragons`, `/search tavern`
- **Navigation:** `/search?q={query}`

#### `/go [destination]`
Navigates to specific pages.

- **Requires Entity:** No
- **Arguments:** Page destination (campaign, settings, chat)
- **Example:** `/go settings`, `/go campaign`
- **Navigation:** Varies by destination

#### `/relate`
Creates a relationship between the current entity and another entity.

- **Requires Entity:** Yes (only appears when viewing an entity)
- **Arguments:** None
- **Navigation:** `/entities/{type}/{id}?action=relate`

#### `/summarize`
Generates an AI summary of the current entity.

- **Requires Entity:** Yes (only appears when viewing an entity)
- **Arguments:** None
- **Requires:** Anthropic API key configured
- **Navigation:** `/entities/{type}/{id}?action=summarize`

#### `/settings`
Opens the settings page.

- **Requires Entity:** No
- **Arguments:** None
- **Navigation:** `/settings`

### Command Parsing

Commands support arguments separated by spaces:

```typescript
parseCommandWithArgument("/new npc")
// Returns: { command: "new", argument: "npc" }

parseCommandWithArgument("/search ancient ruins")
// Returns: { command: "search", argument: "ancient ruins" }

parseCommandWithArgument("/relate")
// Returns: { command: "relate", argument: "" }
```

**Implementation:**

```typescript
export function parseCommandWithArgument(input: string): ParsedCommand {
  const trimmed = input.trim();
  const withoutSlash = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  const spaceIndex = withoutSlash.indexOf(' ');

  if (spaceIndex === -1) {
    return { command: withoutSlash.toLowerCase(), argument: '' };
  }

  return {
    command: withoutSlash.slice(0, spaceIndex).toLowerCase(),
    argument: withoutSlash.slice(spaceIndex + 1).trim()
  };
}
```

### Command Filtering

Commands are filtered based on two criteria:

1. **Context Filtering:** Commands with `requiresEntity: true` are hidden when not viewing an entity
2. **Query Matching:** Commands are filtered by user input matching command id, name, or description

```typescript
export function filterCommands(
  query: string,
  commands: CommandDefinition[],
  context: CommandFilterContext
): CommandDefinition[] {
  const hasEntity = context.currentEntityId !== null;

  // Filter by entity requirement
  let filtered = commands.filter(cmd => {
    if (cmd.requiresEntity && !hasEntity) return false;
    return true;
  });

  // Filter by query
  if (query.trim()) {
    filtered = filtered.filter(cmd => {
      const searchable = [cmd.id, cmd.name, cmd.description]
        .join(' ')
        .toLowerCase();
      return searchable.includes(query.toLowerCase());
    });
  }

  return filtered;
}
```

### UI Integration

The HeaderSearch component handles command mode seamlessly:

**Mode Detection:**

```typescript
const isCommandMode = $derived(searchInput.startsWith('/'));
```

**Context Collection:**

```typescript
const currentEntityId = $derived($page.params.id ?? null);
const currentEntity = $derived(
  currentEntityId ? entitiesStore.getById(currentEntityId) : null
);
```

**Command Filtering:**

```typescript
const filteredCommands = $derived.by(() => {
  if (!isCommandMode) return [];

  const { command } = parseCommandWithArgument(searchInput);
  const context = {
    currentEntityId,
    currentEntityType: currentEntity?.type ?? null
  };

  return filterCommands(command, COMMANDS, context);
});
```

**Execution:**

```typescript
function executeCommand(command: CommandDefinition) {
  const { argument } = parseCommandWithArgument(searchInput);
  const context = {
    currentEntityId,
    currentEntityType: currentEntity?.type ?? null,
    goto
  };

  command.execute(context, argument);
  closeDropdown();
}
```

### Keyboard Navigation

Commands support full keyboard navigation:

- **Arrow Down/Up:** Navigate through filtered commands
- **Enter:** Execute selected command
- **Escape:** Close command palette and clear input
- **Tab:** Close command palette
- **Mouse hover:** Update selection

The selected command is tracked with an index that updates reactively:

```typescript
let selectedIndex = $state(0);

function handleKeydown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowDown':
      selectedIndex = Math.min(selectedIndex + 1, flatResults.length - 1);
      break;
    case 'ArrowUp':
      selectedIndex = Math.max(selectedIndex - 1, 0);
      break;
    case 'Enter':
      executeCommand(flatResults[selectedIndex]);
      break;
  }
}
```

### Adding New Commands

To add a new command:

1. **Define the command** in `/src/lib/config/commands.ts`:

```typescript
{
  id: 'mycommand',
  name: 'My Command',
  description: 'What this command does',
  icon: 'icon-name',              // Lucide icon
  requiresEntity: false,          // or true if needs entity context
  execute: async (context, argument) => {
    // Command logic here
    await context.goto('/some/path');
  }
}
```

2. **Add to COMMANDS array** in the same file
3. **Command is automatically available** in the UI (no additional wiring needed)

### Best Practices

**Command Design:**

- Keep command ids short and memorable
- Use clear, action-oriented names
- Provide helpful descriptions
- Choose intuitive icons from Lucide
- Set `requiresEntity` correctly to avoid confusion

**Execution Logic:**

- Use `context.goto()` for navigation
- Handle errors gracefully
- Close command palette after execution
- Support optional arguments when useful

**Context Awareness:**

- Check `context.currentEntityId` before entity operations
- Use `context.currentEntityType` for type-specific logic
- Validate arguments before execution

### Future Enhancements

**Planned Improvements:**

1. **Command History:** Recently used commands appear first
2. **Command Aliases:** Alternative names for commands (e.g., `n` for `new`)
3. **Fuzzy Matching:** Better search with typo tolerance
4. **Command Chaining:** Execute multiple commands in sequence
5. **Custom Commands:** User-defined commands via settings
6. **Command Arguments UI:** Visual argument input for complex commands
7. **Command Preview:** Show what will happen before executing

## Backup & Restore

### Export Format

Backups are JSON files containing:

```typescript
interface CampaignBackup {
  version: string;              // Backup format version
  exportedAt: Date;
  entities: BaseEntity[];
  chatHistory: ChatMessage[];
  activeCampaignId: string | undefined;
}
```

**Security Note:** The export format deliberately excludes all sensitive data stored in localStorage, including API keys and model preferences. See [Backup Security](#backup-security) for details.

### Export Process

1. Read all data from IndexedDB
2. Serialize to JSON
3. Create blob and trigger download

### Import Process

1. Read uploaded JSON file
2. Validate structure
3. Clear existing database
4. Import campaign
5. Import entities
6. Import chat history

## Theme System

### CSS Custom Properties

Themes are implemented using CSS custom properties defined in `app.css`:

```css
:root {
  --color-primary: ...;
  --color-background: ...;
  --color-text: ...;
}

.dark {
  --color-primary: ...;
  --color-background: ...;
  --color-text: ...;
}
```

### Theme Switching

1. User selects theme in settings
2. Store updates `theme` state
3. Store adds/removes `.dark` class on `<html>`
4. CSS custom properties update automatically
5. All components inherit new theme

### System Theme

When set to "system":
- Uses `window.matchMedia('(prefers-color-scheme: dark)')`
- Listens for OS theme changes
- Updates automatically

## AI Integration

Director Assist uses Claude AI (via the Anthropic SDK) to generate content for entity fields.

### Implemented Features

#### Per-Field Content Generation

**Purpose:** Generate content for individual text-based fields while maintaining context from other filled fields.

**How It Works:**

1. **User Action**: User clicks the sparkle button next to a generatable field
2. **Context Collection**: Service gathers context from filled fields on the form
3. **Privacy Protection**: DM-only fields (section: 'hidden') are excluded from context
4. **Prompt Building**: Service creates a focused prompt for the specific field
5. **API Call**: Sends request to Claude via Anthropic SDK
6. **Response**: Extracted text is inserted into the target field

**Generatable Field Types:**
- `text` - Single-line text fields
- `textarea` - Multi-line text fields
- `richtext` - Markdown/rich text fields

**Context Sources:**
- Entity name
- Entity description
- Entity tags
- Other filled fields (excluding target field and hidden fields)
- Campaign context (name, setting, system)
- Field hints (placeholder, helpText)

**Example Flow:**

```
User creates NPC, fills in:
  - Name: "Grimwald the Wise"
  - Description: "An elderly wizard"
  - Role: "Quest Giver"

User clicks generate on "Personality" field:
  1. Service collects: name, description, role, campaign context
  2. Builds prompt: "Generate personality for NPC named Grimwald..."
  3. Calls Claude API with context
  4. Returns: "Quirky and forgetful, but fiercely intelligent..."
  5. Inserts generated text into Personality field
```

### Architecture

#### Field Generation Service

**Location:** `/src/lib/services/fieldGenerationService.ts`

**Key Functions:**

```typescript
// Check if a field type supports AI generation
isGeneratableField(fieldType: FieldType): boolean

// Generate content for a specific field
generateField(context: FieldGenerationContext): Promise<FieldGenerationResult>
```

**Context Interface:**

```typescript
interface FieldGenerationContext {
  entityType: EntityType;
  typeDefinition: EntityTypeDefinition;
  targetField: FieldDefinition;
  currentValues: {
    name?: string;
    description?: string;
    tags?: string[];
    notes?: string;
    fields: Record<string, FieldValue>;
  };
  campaignContext?: {
    name: string;
    setting: string;
    system: string;
  };
}
```

**Privacy Protection:**

Hidden fields (with `section: 'hidden'`) are automatically excluded from AI context:
- Protects DM secrets and sensitive information
- Ensures player-facing content doesn't leak private notes
- Implemented in `buildFieldPrompt()` via section check

#### Field Generate Button Component

**Location:** `/src/lib/components/entity/FieldGenerateButton.svelte`

**Props:**
- `disabled`: Disables the button
- `loading`: Shows loading spinner
- `onGenerate`: Callback function when clicked

**Visual States:**
- Normal: Sparkle icon with "Generate" label
- Loading: Spinning loader icon
- Disabled: Greyed out, no interaction

#### Integration Points

**Entity Forms:** New and edit pages for entities include generate buttons next to applicable fields:
- `/src/routes/entities/[type]/new/+page.svelte`
- `/src/routes/entities/[type]/[id]/edit/+page.svelte`

**Configuration:**
- API key stored in localStorage (key: 'dm-assist-api-key')
- Model selection via `modelService.ts`
- Max tokens: 1024 (configurable per field type)

#### Model Service

**Location:** `/src/lib/services/modelService.ts`

**Purpose:** Manages AI model selection with automatic fallback to the latest Claude Haiku model.

**Key Functions:**

```typescript
// Fetch available models from Anthropic API (with 1-hour cache)
fetchModels(apiKey: string): Promise<ModelInfo[]>

// Get the currently selected model ID
getSelectedModel(): string

// Save user's model selection
setSelectedModel(modelId: string): void

// Extract date from model ID for comparison
extractDateFromModelId(id: string): number | null

// Find latest Haiku model from a list
findLatestHaikuModel(models: ModelInfo[]): ModelInfo | null

// Clear cached models
clearModelsCache(): void

// Get fallback models when API unavailable
getFallbackModels(): ModelInfo[]
```

**Model Selection Priority:**

The service uses a three-tier priority system for selecting the default model:

1. **User Selection** (highest priority): If the user explicitly selected a model, always use that choice
2. **Auto-selected Latest Haiku**: Find the newest Haiku model from cached API data by comparing dates in model IDs
3. **Hardcoded Fallback** (lowest priority): Use `claude-haiku-4-5-20250514` if API unavailable

**Auto-Selection Logic:**

When no user selection exists, the service automatically finds the latest Haiku model by:

1. Filtering models to only Haiku variants (case-insensitive: "haiku", "HAIKU", "Haiku")
2. Sorting by multiple criteria (highest priority first):
   - Date extracted from model ID (descending)
   - `created_at` timestamp if no ID date available
   - Reverse alphabetical by ID as final tiebreaker
3. Returning the top result

**Date Extraction:**

Model IDs contain 8-digit dates (YYYYMMDD format). The service uses regex to extract these dates:
- Pattern: `/(?<!\d)(\d{8})(?!\d)/`
- Example: `claude-haiku-4-5-20250514` → `20250514`
- Used to determine which model is newer

**Caching Strategy:**

- Models are cached in localStorage for 1 hour to reduce API calls
- Cache key: `dm-assist-models-cache`
- Cache cleared automatically when API key changes
- Cache format: `{ models: ModelInfo[], timestamp: number }`

**Benefits:**

- Users always get the latest Haiku model without app updates
- Manual selections always respected (never overridden)
- Graceful degradation when API unavailable
- Reduces API calls through intelligent caching

### Error Handling

The service provides user-friendly error messages for common scenarios:

| Error | User Message |
|-------|--------------|
| No API key | "API key not configured. Please add your Anthropic API key in Settings." |
| Invalid API key (401) | "Invalid API key. Please check your API key in Settings." |
| Rate limit (429) | "Rate limit exceeded. Please wait a moment and try again." |
| Network/API error | "Failed to generate field: [error message]" |
| Empty response | "AI returned empty content" |

### Prompt Engineering

**Prompt Structure:**

```
1. Role: "You are a TTRPG campaign assistant"
2. Campaign Context: name, setting, system
3. Existing Context: filled fields from the form
4. Field Target: specific field to generate
5. Field Type & Hints: type, placeholder, helpText
6. Generation Rules: format, length, consistency guidelines
7. Output Format: plain text only (no JSON/markdown)
```

**Field-Specific Guidelines:**

- **Text fields**: 1-2 sentences, concise and descriptive
- **Textarea fields**: 1-2 paragraphs
- **Richtext fields**: 1-3 paragraphs, evocative content

**Consistency Rules:**
- Generated content must align with existing context
- Tone matches campaign system and setting
- Maintains internal logic (e.g., personality matches role)

### Future AI Features

**Planned Enhancements:**

1. **Full-Entity Generation**: Create entire entities at once
2. **Chat Interface**: Conversational AI for campaign planning
3. **Context Builder**: Select specific entities for AI context
4. **Suggestion System**: AI-generated plot hooks and campaign ideas
5. **Consistency Checker**: Identify conflicts in campaign data
6. **Streaming Responses**: Real-time text generation
7. **Custom Prompts**: User-defined prompt templates
8. **Entity Relationships**: AI suggests logical connections between entities

## Performance Considerations

### Indexing Strategy

IndexedDB indexes are carefully chosen:
- Primary keys for direct lookups
- Type index for entity type queries
- Multi-entry index for tag searches
- Timestamp indexes for recent items

### Lazy Loading

- Routes are code-split automatically by Vite
- Components load on-demand
- Large lists use virtual scrolling (future)

### Reactivity Optimization

- Live queries batch updates automatically
- Derived state uses `$derived` for memoization
- Components only re-render when dependencies change

## Security Considerations

### Local-First Security

- No backend means no server-side vulnerabilities
- All data stays in browser (privacy by default)
- No authentication needed

### Backup Security

**Validated Security Posture (Issue #31 - v1.0 Security Audit):**

Director Assist backups are secure by architectural design. The export function only accesses IndexedDB data and never reads from localStorage, ensuring sensitive configuration is never exposed.

**What's Excluded:**
- API keys (stored in localStorage: `dm-assist-api-key`)
- Model preferences (stored in localStorage: `dm-assist-selected-model`)
- Any other localStorage configuration

**What's Included:**
- Entity data (all campaign entities)
- Chat history (AI conversation logs)
- Active campaign ID (database reference)
- Export metadata (version, timestamp)

**Security Validation:**

The backup export implementation has been validated through comprehensive security tests in `/src/routes/settings/backup-export.test.ts`:

- Verified API keys are never present in backup objects or JSON output
- Confirmed backup structure contains only expected fields
- Tested edge cases where user data contains API key-like strings
- Validated behavior across multiple scenarios (empty API keys, multiple campaigns, etc.)

**User Responsibility:**

- Backups are plain JSON files (no encryption applied)
- Users should store backup files securely
- Shared backups do not expose API credentials
- Consider encrypting backups if they contain sensitive campaign information

### XSS Prevention

- Svelte escapes strings by default
- Markdown rendering should sanitize HTML (future)
- URL validation for link fields

## Deployment

### Build Process

```bash
npm run build
```

Output:
- `build/` directory with static files
- All routes pre-rendered as HTML
- JavaScript bundled and minified
- CSS extracted and optimized

### Hosting Options

Works on any static host:
- **Netlify**: Drag-and-drop or git integration
- **Vercel**: Zero-config deployment
- **GitHub Pages**: Free hosting for public repos
- **Cloudflare Pages**: Fast edge deployment
- **Self-hosted**: Just serve the `build/` folder

### Configuration

The static adapter is configured in `svelte.config.js`:

```javascript
adapter: adapter({
  pages: 'build',
  assets: 'build',
  fallback: 'index.html',  // SPA mode
  precompress: false,
  strict: true
})
```

## Browser Compatibility

### Required APIs

- **IndexedDB**: Available in all modern browsers
- **ES2020**: Target compilation level
- **CSS Custom Properties**: For theming
- **localStorage**: For settings persistence

### Tested Browsers

- Chrome/Edge 80+
- Firefox 75+
- Safari 14+
- Mobile browsers with same engine versions

## Future Architecture Improvements

### Planned Enhancements

1. **Relationship Graph**: Visualize entity connections
2. **Full-Text Search**: Better search with field content
3. **Virtual Lists**: Handle thousands of entities
4. **PWA Support**: Install as mobile app
5. **Cloud Sync**: Optional backup to cloud storage
6. **Multi-Campaign**: Switch between campaigns
7. **Undo/Redo**: History stack for changes
8. **Collaborative Editing**: Real-time sync (ambitious)

### Scalability

Current architecture handles:
- 1000s of entities efficiently
- Complex relationship networks
- Large markdown fields
- Multiple browser tabs

For larger scales, consider:
- Web Workers for heavy computation
- Virtual scrolling for long lists
- Pagination for entity lists
- Database compaction

## Development Workflow

### Local Development

1. `npm run dev` starts dev server
2. Hot module replacement for instant updates
3. TypeScript checking in IDE
4. Browser DevTools for debugging

### Type Checking

```bash
npm run check        # One-time check
npm run check:watch  # Continuous checking
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build   # Build for production
npm run preview # Test production build locally
```

## Troubleshooting

### Common Issues

**Database won't open:**
- Clear browser data for the site
- Check IndexedDB quota
- Try incognito mode to test

**Data loss after refresh:**
- Check if IndexedDB is enabled
- Verify data persistence in DevTools
- Check for quota exceeded errors

**Slow performance:**
- Check number of entities
- Look for missing indexes
- Profile with Chrome DevTools

**Theme not applying:**
- Check localStorage for theme setting
- Verify CSS custom properties in DevTools
- Look for conflicting styles

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Development setup
- Code style guidelines
- Pull request process
- Testing guidelines
