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
- **Loading Components**: Reusable loading states for async operations

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
│   │   │   ├── FieldGenerateButton.svelte
│   │   │   ├── RelationshipCard.svelte
│   │   │   ├── RelateCommand.svelte
│   │   │   └── EntitySummary.svelte
│   │   ├── relationships/   # Relationship management components
│   │   │   ├── RelationshipsFilter.svelte
│   │   │   ├── RelationshipsTable.svelte
│   │   │   ├── RelationshipRow.svelte
│   │   │   └── BulkActionsBar.svelte
│   │   ├── ui/              # UI components
│   │   │   ├── LoadingSpinner.svelte
│   │   │   ├── LoadingSkeleton.svelte
│   │   │   ├── LoadingButton.svelte
│   │   │   └── Pagination.svelte
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
│       ├── relationships.ts # Relationship filtering and sorting types
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
│   │           ├── edit/
│   │           │   └── +page.svelte # Edit entity (/entities/npc/abc123/edit)
│   │           └── relationships/
│   │               └── +page.svelte # Manage relationships (/entities/npc/abc123/relationships)
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
  sourceId?: EntityId;         // Explicit source reference (optional for backward compat)
  targetId: EntityId;
  targetType: EntityType;
  relationship: string;        // "knows", "located_at", "member_of", etc.
  bidirectional: boolean;
  reverseRelationship?: string; // For asymmetric bidirectional links
  notes?: string;
  strength?: 'strong' | 'moderate' | 'weak'; // Relationship strength
  createdAt?: Date;            // When link was created
  updatedAt?: Date;            // When link was last updated
  metadata?: {
    tags?: string[];
    tension?: number;
    [key: string]: unknown;    // Allow additional custom fields
  };
}
```

**Relationship Types:**

Links can be unidirectional or bidirectional. Bidirectional links can be symmetric or asymmetric.

**Symmetric Bidirectional:**
- Both entities see the same relationship name
- Example: NPC ↔ "knows" ↔ NPC

**Asymmetric Bidirectional:**
- Each entity sees a different relationship name that reflects their perspective
- Uses `reverseRelationship` field to specify the inverse relationship
- Example: NPC → "patron_of" → NPC (shown on first entity)
          NPC → "client_of" → NPC (shown on second entity via reverseRelationship)
- Visual indicator: Blue ↔ symbol in entity detail view

**Examples:**
- NPC → "located_at" → Location (unidirectional)
- Character ↔ "member_of" ↔ Faction (symmetric bidirectional)
- Item → "owned_by" → Character (unidirectional)
- NPC → "patron_of" ↔ "client_of" ← NPC (asymmetric bidirectional)
- NPC → "employer_of" ↔ "employee_of" ← NPC (asymmetric bidirectional)

#### Relationship Map for Graph Visualization

The entity repository provides a `getRelationshipMap()` method that exports the entire relationship network as a graph data structure compatible with popular JavaScript graph visualization libraries.

**Purpose:** Generate graph-ready data for visualizing entity relationships in network diagrams, force-directed layouts, or other graph-based UIs.

**Method Signature:**

```typescript
async getRelationshipMap(options?: RelationshipMapOptions): Promise<RelationshipMap>
```

**Return Structure:**

```typescript
interface RelationshipMap {
  nodes: RelationshipMapNode[];  // All entities as graph nodes
  edges: RelationshipMapEdge[];  // All relationships as graph edges
}

interface RelationshipMapNode {
  id: string;           // Entity ID
  type: EntityType;     // Entity type
  name: string;         // Display name
  linkCount: number;    // Total relationship count
}

interface RelationshipMapEdge {
  id: number;              // Numeric edge ID
  source: string;          // Source entity ID
  target: string;          // Target entity ID
  relationship: string;    // Relationship type
  bidirectional: boolean;  // Mutual relationship flag
  strength?: 'strong' | 'moderate' | 'weak';
  metadata?: Record<string, unknown>;
}
```

**Key Features:**

1. **Graph Library Compatibility**
   - D3.js: Use nodes and edges directly with force simulations
   - vis.js: Compatible with Network API format
   - Cytoscape.js: Easily transformed to Cytoscape format

2. **Edge Deduplication**
   - Bidirectional links appear only once in the edges array
   - Source/target determined by lexicographic ordering of entity IDs
   - Unidirectional links maintain their specified direction
   - Multiple different relationships between same entities preserved

3. **Link Count Calculation**
   - Counts all relationships (incoming + outgoing) for each entity
   - Bidirectional links: +1 for each participating entity (not doubled)
   - Unidirectional outgoing: +1 for source entity
   - Unidirectional incoming: +1 for target entity
   - Self-referencing links: +1 (not doubled)

4. **Type Filtering**
   - Filter to specific entity types via `options.entityTypes`
   - Only entities of specified types included as nodes
   - Only links between included entities appear as edges
   - Useful for focused visualizations (e.g., character-only network)

**Example Usage:**

```typescript
// Get complete relationship graph
const fullGraph = await entityRepository.getRelationshipMap();
console.log(`${fullGraph.nodes.length} entities, ${fullGraph.edges.length} relationships`);

// Get only character and faction relationships
const socialGraph = await entityRepository.getRelationshipMap({
  entityTypes: ['character', 'faction']
});

// Use with D3.js force simulation
const simulation = d3.forceSimulation(fullGraph.nodes)
  .force('link', d3.forceLink(fullGraph.edges).id(d => d.id))
  .force('charge', d3.forceManyBody())
  .force('center', d3.forceCenter(width / 2, height / 2));
```

**Edge Deduplication Details:**

For bidirectional relationships, edges are deduplicated to prevent showing the same relationship twice:

```typescript
// Example: NPC A ↔ NPC B (bidirectional "knows" relationship)
// Storage: Entity A has link to B, Entity B has link to A
// Graph output: ONE edge from A to B (or B to A, whichever is lexicographically first)

// Deduplication key format:
// Bidirectional: "{smaller_id}-{larger_id}-{relationship}"
// Unidirectional: "{source}-{target}-{relationship}-uni"
```

This ensures graph visualizations show each bidirectional relationship as a single undirected edge rather than two overlapping directed edges.

#### Dedicated Relationships Management Page

**Location:** `/src/routes/entities/[type]/[id]/relationships/+page.svelte`

**Purpose:** Provide a comprehensive interface for managing all relationships for an entity with advanced filtering, sorting, bulk operations, and pagination.

**Route:** `/entities/[type]/[id]/relationships`

**Key Features:**

1. **Advanced Filtering**
   - Filter by relationship type (dynamically populated from entity's relationships)
   - Filter by target entity type (dynamically populated from linked entities)
   - Filter by relationship strength (strong, moderate, weak, or all)
   - Search across entity names, relationship types, notes, and tags
   - Filters combine for precise results

2. **Sortable Table**
   - Sort by target entity name (alphabetical)
   - Sort by relationship type (alphabetical)
   - Sort by strength (strong > moderate > weak > none)
   - Sort by creation date (newest/oldest)
   - Ascending or descending order
   - Sort state preserved in URL

3. **Bulk Operations**
   - Select individual relationships via checkboxes
   - Select all visible relationships on current page
   - Delete multiple relationships at once
   - Update strength for all selected relationships
   - Add tags to multiple relationships simultaneously
   - Sticky bulk actions bar appears when items selected
   - Selection cleared after bulk operation

4. **Pagination**
   - URL-based pagination (page and perPage query parameters)
   - Configurable items per page: 20, 50, or 100
   - Previous/Next navigation
   - Item count display ("Showing X-Y of Z items")
   - Filters reset pagination to page 1
   - Pagination controls hidden when not needed

5. **Quick Add Relationship**
   - Floating action button for creating new relationships
   - Opens RelateCommand modal
   - No need to navigate back to entity detail page

6. **Empty States**
   - "No relationships yet" state with add relationship button
   - "No matches" state when filters return no results
   - Clear messaging guides user action

**Component Architecture:**

```
+page.svelte (Container)
├── RelationshipsFilter.svelte (Filter panel)
├── RelationshipsTable.svelte (Table wrapper)
│   └── RelationshipRow.svelte (Individual rows)
├── Pagination.svelte (Page navigation)
├── BulkActionsBar.svelte (Sticky bottom bar)
└── RelateCommand.svelte (Add relationship modal)
```

**State Management:**

All filtering, sorting, and pagination state is managed via Svelte 5 runes (`$state`, `$derived`):

```typescript
// Filter state
let filterOptions = $state<RelationshipFilterOptions>({});
let sortOptions = $state<RelationshipSortOptions>({
  field: 'targetName',
  direction: 'asc'
});
let selectedIds = $state<Set<string>>(new Set());

// Derived from URL params
const currentPage = $derived.by(() => {
  const pageParam = $page.url.searchParams.get('page');
  return parseInt(pageParam || '1', 10);
});

const perPage = $derived.by(() => {
  const perPageParam = $page.url.searchParams.get('perPage');
  return parseInt(perPageParam || '20', 10);
});

// Data pipeline: all → filtered → sorted → paginated
const filteredRelationships = $derived.by(() => { /* filtering logic */ });
const sortedRelationships = $derived.by(() => { /* sorting logic */ });
const paginatedRelationships = $derived.by(() => { /* pagination logic */ });
```

**Type Definitions:**

```typescript
// /src/lib/types/relationships.ts
interface RelationshipFilterOptions {
  relationshipType?: string;
  targetEntityType?: string;
  strength?: 'strong' | 'moderate' | 'weak' | 'all';
  searchQuery?: string;
}

interface RelationshipSortOptions {
  field: 'targetName' | 'relationship' | 'strength' | 'createdAt';
  direction: 'asc' | 'desc';
}

interface BulkActionType {
  type: 'delete' | 'updateStrength' | 'addTag';
  payload?: unknown;
}
```

**Data Flow:**

1. Page loads → fetch all relationships via `entitiesStore.getLinkedWithRelationships()`
2. User changes filter → `filterOptions` updates → filtered list recalculates
3. User changes sort → `sortOptions` updates → sorted list recalculates
4. User changes page → URL updates → `goto()` → derived `currentPage` recalculates
5. User selects items → `selectedIds` updates → bulk actions bar appears
6. User performs bulk action → store methods called → data updates → selection cleared

**Navigation Integration:**

- Back link to entity detail page
- Quick add button opens RelateCommand modal
- Pagination uses `goto()` to update URL
- Filter changes reset pagination to page 1

**Accessibility:**

- ARIA labels on bulk actions bar (`role="toolbar"`)
- Keyboard navigation for table rows
- Accessible form controls (labels, select dropdowns)
- Clear focus states throughout

**Performance Considerations:**

- Filters apply client-side (all relationships loaded once)
- Sorting uses JavaScript sort (efficient for <1000 items)
- Pagination reduces DOM nodes for large relationship sets
- Derived state uses memoization to prevent unnecessary recalculation

**Future Enhancements (Phase 2):**

- Edit button integration from entity detail page
- "Manage Relationships" link on entity detail page
- Inline relationship editing
- Advanced search with field-specific filters
- Export filtered relationships to CSV
- Relationship visualization toggle

**Performance Characteristics:**

- Single database query to fetch all entities
- O(n) iteration through entities and links
- O(1) edge deduplication via Map
- Efficient for graphs with thousands of entities and relationships

**Integration Points:**

Currently used for future graph visualization features. Can be integrated with:
- Network diagram component for campaign relationship visualization
- Entity detail page to show local relationship network
- Dashboard analytics to display relationship statistics
- Export feature to share graph data with external tools

#### RelationshipCard Component

The RelationshipCard component provides a rich visual display for entity relationships on the entity detail page.

**Location:** `/src/lib/components/entity/RelationshipCard.svelte`

**Purpose:** Display complete relationship metadata in an easy-to-read card format with visual indicators for relationship direction, strength, and other attributes.

**Props:**

```typescript
interface RelationshipCardProps {
  linkedEntity: BaseEntity;        // The entity being linked to
  link: EntityLink;                // Complete link object with all metadata
  isReverse: boolean;              // Whether this is an incoming relationship
  typeDefinition?: EntityTypeDefinition;
  onRemove?: (linkId: string) => void;  // Callback for removing the link
}
```

**Features:**

- **Entity Display**: Shows linked entity name (as clickable link) and type badge
- **Relationship Direction**: Visual indicators for unidirectional (→), bidirectional (↔), and asymmetric relationships
- **Strength Badge**: Color-coded badges for relationship strength (strong/moderate/weak)
- **Notes Section**: Displays relationship notes with preserved formatting
- **Tags**: Shows relationship tags as colored badges
- **Tension Indicator**: Visual progress bar showing tension level (0-100) with color coding
- **Timestamps**: Displays creation and update dates in readable format
- **Delete Action**: Remove button for forward links (hidden for reverse links)
- **Reverse Link Indicator**: Left border highlight for incoming relationships

**Visual States:**

- **Forward Links**: Show delete button on hover, standard border
- **Reverse Links**: Blue left border, no delete button, left arrow indicator
- **Asymmetric Bidirectional**: Blue ↔ symbol with both relationship names shown

**Integration:**

Used on entity detail pages (`/src/routes/entities/[type]/[id]/+page.svelte`) to display all relationships for an entity. The card receives its data from the `getLinkedWithRelationships()` store method, which returns the complete EntityLink object along with the linked entity and direction indicator.

**Example Usage:**

```svelte
<script>
  const linkedEntitiesWithRelationships = $derived(
    entity ? entitiesStore.getLinkedWithRelationships(entity.id) : []
  );
</script>

{#each linkedEntitiesWithRelationships as { entity: linkedEntity, link, isReverse }}
  <RelationshipCard
    {linkedEntity}
    {link}
    {isReverse}
    {typeDefinition}
    onRemove={handleRemoveLink}
  />
{/each}
```

### Loading State Components

Director Assist provides three reusable components for displaying loading states during async operations. These components ensure consistent UX and accessibility across the application.

#### LoadingSpinner Component

**Location:** `/src/lib/components/ui/LoadingSpinner.svelte`

**Purpose:** Display a spinning loader icon for async operations like data fetching or processing.

**Props:**

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | number;  // Preset or custom size in pixels
  color?: 'primary' | 'white' | 'gray'; // Color variant
  label?: string;                       // Optional visible label
  center?: boolean;                     // Center in container (default: true)
  fullscreen?: boolean;                 // Cover entire viewport
  class?: string;                       // Additional CSS classes
}
```

**Features:**

- Size variants: sm (16px), md (32px), lg (48px), or custom pixel size
- Color variants: primary (blue), white, gray
- Fullscreen mode with backdrop blur
- ARIA attributes for screen readers
- Dark mode support

**Usage Example:**

```svelte
<!-- Basic spinner -->
<LoadingSpinner />

<!-- Large spinner with label -->
<LoadingSpinner size="lg" label="Loading entities..." />

<!-- Fullscreen loading overlay -->
<LoadingSpinner fullscreen label="Importing backup..." />

<!-- Custom size and color -->
<LoadingSpinner size={64} color="white" />
```

**Accessibility:**

- `role="status"` and `aria-live="polite"` for screen readers
- Screen reader text ("Loading") when no visible label
- Semantic HTML structure

#### LoadingSkeleton Component

**Location:** `/src/lib/components/ui/LoadingSkeleton.svelte`

**Purpose:** Show placeholder content while data loads, maintaining layout stability and providing visual feedback.

**Props:**

```typescript
interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'circular' | 'rectangular'
          | 'entityCard' | 'tableRow' | 'entityDetail'
          | 'settingsPage' | 'campaignCard';
  width?: string | number;              // Tailwind class or pixel value
  height?: string | number;             // Tailwind class or pixel value
  count?: number;                       // Number of skeleton items
  columns?: number;                     // Columns for tableRow variant
  animate?: boolean;                    // Enable animation (default: true)
  animation?: 'pulse' | 'shimmer';      // Animation style
  class?: string;                       // Additional CSS classes
}
```

**Variants:**

- **text**: Single line text placeholder (h-4)
- **card**: Generic card skeleton (min-h-32)
- **circular**: Round placeholder for avatars
- **rectangular**: Basic rectangle shape
- **entityCard**: Entity list card with header and content lines
- **tableRow**: Row with configurable columns
- **entityDetail**: Full entity detail page layout
- **settingsPage**: Settings page with form fields
- **campaignCard**: Campaign card with title and description

**Features:**

- Preset variants for common UI patterns
- Customizable dimensions (Tailwind classes or pixel values)
- Multiple animation styles (pulse, shimmer)
- Composable with count parameter
- Dark mode support
- ARIA attributes for accessibility

**Usage Examples:**

```svelte
<!-- Entity list skeleton -->
<LoadingSkeleton variant="entityCard" count={5} />

<!-- Table row skeleton -->
<LoadingSkeleton variant="tableRow" count={3} columns={4} />

<!-- Custom text skeleton -->
<LoadingSkeleton variant="text" width="w-3/4" height="h-6" />

<!-- Entity detail page skeleton -->
<LoadingSkeleton variant="entityDetail" />

<!-- Circular avatar placeholder -->
<LoadingSkeleton variant="circular" width={48} height={48} />
```

**Accessibility:**

- `role="status"` and `aria-busy="true"` for loading state
- `aria-label="Loading content"` for screen readers
- Semantic structure matching final content

#### LoadingButton Component

**Location:** `/src/lib/components/ui/LoadingButton.svelte`

**Purpose:** Button with integrated loading state for async actions like saving, submitting, or processing.

**Props:**

```typescript
interface LoadingButtonProps {
  loading?: boolean;                    // Show loading state
  disabled?: boolean;                   // Disable button
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset'; // HTML button type
  fullWidth?: boolean;                  // Full width button
  loadingText?: string;                 // Text to show when loading
  onclick?: (e: MouseEvent) => void;    // Click handler
  class?: string;                       // Additional CSS classes
  children?: Snippet | string;          // Button content
  leftIcon?: Snippet | boolean;         // Left icon slot
  rightIcon?: Snippet | boolean;        // Right icon slot
}
```

**Variants:**

- **primary**: Blue background, white text (default)
- **secondary**: Gray background, white text
- **danger**: Red background, white text
- **ghost**: Transparent background, hover effect
- **outline**: Bordered with transparent background

**Size Variants:**

- **sm**: px-3 py-1.5, text-sm
- **md**: px-4 py-2, text-base (default)
- **lg**: px-6 py-3, text-lg

**Features:**

- Automatic spinner display when loading
- Disabled state during loading
- Optional loading text replacement
- Icon slots (left/right)
- Full keyboard and focus support
- ARIA attributes for accessibility
- Dark mode support

**Usage Examples:**

```svelte
<script>
  let saving = $state(false);

  async function handleSave() {
    saving = true;
    try {
      await saveEntity();
    } finally {
      saving = false;
    }
  }
</script>

<!-- Basic loading button -->
<LoadingButton loading={saving} onclick={handleSave}>
  Save
</LoadingButton>

<!-- With loading text -->
<LoadingButton
  loading={saving}
  loadingText="Saving..."
  onclick={handleSave}
>
  Save Changes
</LoadingButton>

<!-- Danger variant with full width -->
<LoadingButton
  loading={deleting}
  variant="danger"
  fullWidth
  onclick={handleDelete}
>
  Delete Entity
</LoadingButton>

<!-- With icon -->
<LoadingButton loading={exporting} onclick={handleExport}>
  {#snippet leftIcon()}
    <Download class="w-4 h-4" />
  {/snippet}
  Export Backup
</LoadingButton>
```

**Accessibility:**

- `aria-busy={loading}` to indicate loading state
- `aria-disabled={disabled || loading}` for disabled state
- Screen reader text for spinner
- Proper focus management
- Keyboard navigation support

#### Integration Points

**Entity List Pages** (`/src/routes/entities/[type]/+page.svelte`)
- Use LoadingSkeleton while fetching entity lists
- Show 5 entityCard skeletons during initial load
- Smooth transition to actual content

**Entity Create/Edit Forms**
- Use LoadingButton for save/create actions
- Prevent double-submission during async operations
- Clear visual feedback for form submission

**Settings Page** (`/src/routes/settings/+page.svelte`)
- Use LoadingButton for export/import operations
- Provide loading text for long-running operations
- Fullscreen LoadingSpinner for backup imports

**Best Practices:**

1. **Choose the Right Component**: Use LoadingSkeleton for content loading, LoadingSpinner for operations, LoadingButton for async actions
2. **Match Layout**: LoadingSkeleton variants should match the content being loaded
3. **Provide Context**: Use labels or loadingText to explain what's happening
4. **Accessibility**: Always include ARIA attributes and screen reader text
5. **Consistent Sizing**: Use matching size props across related components
6. **Dark Mode**: All components support dark mode automatically

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

**Example:** NPC entity type has fields like `role`, `personality`, `appearance`, `voice`, `greetings`, `motivation`, `secrets`, `status`, and `importance`.

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
- Provide graph data structures for visualization

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
- `getLinkedWithRelationships()`: Get all linked entities with complete link metadata

**getLinkedWithRelationships() Method:**

Returns an array of linked entities along with their complete relationship metadata. This method supports the RelationshipCard component by providing all the data needed to display rich relationship information.

**Return Type:**

```typescript
Array<{
  entity: BaseEntity;        // The linked entity
  link: EntityLink;          // Complete link object with all metadata
  isReverse: boolean;        // True for incoming links, false for outgoing
}>
```

**What's Included:**

- Complete EntityLink object with all optional fields (strength, notes, tags, tension, timestamps)
- Linked entity data (for display name, type, etc.)
- Direction indicator (forward vs reverse relationships)
- Support for asymmetric bidirectional relationships

**Usage Example:**

```typescript
const linkedEntitiesWithRelationships = entitiesStore.getLinkedWithRelationships(entityId);
// Returns both forward links (where this entity is the source) and reverse links
// (where this entity is the target in a bidirectional relationship)
```

#### Entity Repository Methods

The entity repository provides data access methods for querying and manipulating entities. In addition to basic CRUD operations, it includes advanced relationship traversal methods.

**getRelationshipChain() Method:**

Traverses entity relationships using breadth-first search to find all entities within a specified number of connections (degrees of separation). Returns the path taken to reach each entity.

**Method Signature:**

```typescript
getRelationshipChain(
  startId: EntityId,
  options?: RelationshipChainOptions
): Promise<ChainNode[]>
```

**Options:**

```typescript
interface RelationshipChainOptions {
  maxDepth?: number;              // Maximum degrees of separation (default: 3)
  relationshipTypes?: string[];   // Filter by specific relationship types
  entityTypes?: EntityType[];     // Filter by specific entity types
  direction?: 'outgoing' | 'incoming' | 'both';  // Link direction (default: 'both')
}
```

**Return Type:**

```typescript
interface ChainNode {
  entity: BaseEntity;     // The entity found in the chain
  depth: number;          // Degrees of separation from start entity
  path: EntityLink[];     // Sequence of links to reach this entity
}
```

**Use Cases:**

- "Who knows someone who knows this NPC?" (social network analysis)
- "What's the shortest path between Faction A and Location B?" (relationship paths)
- "Show me all entities within 2 degrees of connection" (relationship exploration)
- Finding indirect relationships and hidden connections in the campaign

**Example Usage:**

```typescript
// Find all entities within 2 connections of an NPC
const chain = await entityRepository.getRelationshipChain('npc-123', {
  maxDepth: 2
});

// Find factions connected through "allied_with" relationships
const alliedFactions = await entityRepository.getRelationshipChain('faction-456', {
  relationshipTypes: ['allied_with'],
  entityTypes: ['faction'],
  direction: 'both'
});

// Trace the path to a specific entity
const pathToTarget = chain.find(node => node.entity.id === 'target-id');
console.log(`Reached in ${pathToTarget.depth} steps via:`, pathToTarget.path);
```

**How It Works:**

1. Starts at the specified entity (depth 0)
2. Uses BFS to explore relationships level by level
3. Tracks visited entities to avoid cycles
4. Records the path of links to reach each entity
5. Applies filters for relationship types, entity types, and direction
6. Stops when maxDepth is reached

**Performance Notes:**

- Uses BFS for shortest-path guarantees
- Tracks visited nodes to prevent infinite loops
- Efficient for small-to-medium relationship networks
- Consider limiting maxDepth for large datasets

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
- **Features:** Supports bidirectional relationships, asymmetric relationships (different names for each direction), relationship strength, tags, and tension metadata

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
  selectedModel?: string;       // User's selected Claude model preference
}
```

**Security Note:** The export format deliberately excludes sensitive data stored in localStorage, specifically API keys. The selected Claude model preference (e.g., "claude-3-haiku-20240307") is included to preserve user preferences across backup/restore operations. See [Backup Security](#backup-security) for details.

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

### Svelte 5 Reactive Patterns Best Practices

**Avoiding state_unsafe_mutation Errors**

Svelte 5 enforces strict reactivity rules to ensure predictable state updates. Follow these patterns to avoid common pitfalls:

**Wrong Pattern - Accessing reactive state in {@const} blocks:**

```svelte
<!-- WRONG: Triggers state_unsafe_mutation error -->
{#each fieldValues as value}
  {@const referencedEntity = entitiesStore.entities.find(e => e.id === value)}
  {#if referencedEntity}
    <span>{referencedEntity.name}</span>
  {/if}
{/each}
```

**Correct Pattern - Use helper functions or $derived:**

```svelte
<script lang="ts">
  // Option 1: Helper function in script section
  function getEntityById(entityId: string) {
    return entitiesStore.getById(entityId);
  }
</script>

{#each fieldValues as value}
  {@const referencedEntity = getEntityById(value)}
  {#if referencedEntity}
    <span>{referencedEntity.name}</span>
  {/if}
{/each}
```

```svelte
<script lang="ts">
  // Option 2: Use $derived for computed values
  const referencedEntity = $derived(
    entityId ? entitiesStore.getById(entityId) : undefined
  );
</script>

{#if referencedEntity}
  <span>{referencedEntity.name}</span>
{/if}
```

**Key Rules:**

1. **{@const} blocks** - Only use for non-reactive transformations (string formatting, math, etc.)
2. **Store access** - Use getter methods (e.g., `getById()`) instead of direct array access
3. **Computed values** - Move complex computations to `$derived` in the script section
4. **Array operations** - Avoid `.find()`, `.filter()`, `.map()` on reactive state inside templates

**Safe {@const} Usage:**

```svelte
<!-- Safe: Simple transformation, no reactive state access -->
{@const displayName = name.toUpperCase()}
{@const formattedDate = timestamp ? new Date(timestamp).toLocaleDateString() : 'N/A'}
```

## Security Considerations

### Local-First Security

- No backend means no server-side vulnerabilities
- All data stays in browser (privacy by default)
- No authentication needed

### Backup Security

**Validated Security Posture (Issue #31 - v1.0 Security Audit, Updated Issue #34):**

Director Assist backups are secure by architectural design. The export function carefully selects which data to include, ensuring sensitive credentials are never exposed.

**What's Excluded:**
- API keys (stored in localStorage: `dm-assist-api-key`)
- Any other sensitive localStorage configuration

**What's Included:**
- Entity data (all campaign entities)
- Chat history (AI conversation logs)
- Active campaign ID (database reference)
- Selected Claude model preference (Issue #34: stored in localStorage: `dm-assist-selected-model`)
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
