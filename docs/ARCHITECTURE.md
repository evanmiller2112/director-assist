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

### Rich Text Editing
- **marked**: Markdown parsing library for converting markdown to HTML
- **DOMPurify**: HTML sanitization library for XSS protection
- **MarkdownEditor**: Rich text editor component with toolbar and live preview
- **MarkdownViewer**: Markdown rendering component for display-only views

### Visualization
- **vis-network**: Interactive network graph visualization library
- **vis-data**: Data structures for vis.js (DataSet, DataView)

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
│   │   │   ├── BulkActionsBar.svelte
│   │   │   ├── RelationshipMatrix.svelte     # Matrix grid visualization
│   │   │   ├── MatrixControls.svelte         # Matrix filtering/sorting controls
│   │   │   ├── MatrixCell.svelte             # Individual matrix cell
│   │   │   ├── NetworkDiagram.svelte        # vis.js network visualization
│   │   │   ├── NetworkFilterPanel.svelte    # Network filter controls
│   │   │   ├── NetworkNodeDetails.svelte    # Node detail panel
│   │   │   └── NetworkEdgeDetails.svelte    # Edge detail panel
│   │   ├── navigation/      # Navigation components
│   │   │   └── RelationshipBreadcrumbs.svelte
│   │   ├── markdown/        # Markdown editing and rendering
│   │   │   ├── MarkdownEditor.svelte
│   │   │   └── MarkdownViewer.svelte
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
│   │   ├── commandUtils.ts       # Command parsing and filtering
│   │   ├── matrixUtils.ts        # Matrix data processing and sorting
│   │   ├── breadcrumbUtils.ts    # Breadcrumb path parsing and serialization
│   │   ├── networkGraph.ts       # Network graph visualization utilities
│   │   └── markdownUtils.ts      # HTML sanitization for markdown rendering
│   ├── db/                  # Database layer
│   │   ├── index.ts         # Dexie database setup
│   │   └── repositories/    # Data access layer
│   │       ├── entityRepository.ts
│   │       ├── campaignRepository.ts
│   │       └── chatRepository.ts
│   ├── services/            # Business logic services
│   │   ├── contextBuilder.ts              # Entity context building for AI
│   │   ├── fieldGenerationService.ts      # AI field generation
│   │   ├── modelService.ts                # AI model selection
│   │   └── relationshipContextBuilder.ts  # Relationship context building for AI
│   ├── stores/              # Application state
│   │   ├── campaign.svelte.ts
│   │   ├── entities.svelte.ts
│   │   └── ui.svelte.ts
│   └── types/               # TypeScript definitions
│       ├── entities.ts      # Entity type system
│       ├── campaign.ts      # Campaign types
│       ├── ai.ts            # AI integration types
│       ├── relationships.ts # Relationship filtering and sorting types
│       ├── matrix.ts        # Matrix view types
│       ├── network.ts       # Network visualization types
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
│   ├── relationships/       # Relationship routes
│   │   ├── matrix/
│   │   │   └── +page.svelte # Relationship matrix view (/relationships/matrix)
│   │   └── network/
│   │       └── +page.svelte     # Network diagram (/relationships/network)
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

The relationship map data structure is consumed by the network diagram visualization at `/relationships/network`. The graph-ready format allows seamless integration with vis.js for interactive network rendering.

### Network Diagram Visualization (Issue #74)

The network diagram provides an interactive visual representation of the entire campaign relationship network using vis.js.

**Location:** `/src/routes/relationships/network/+page.svelte`

**Purpose:** Visualize all entities as nodes and relationships as edges in an interactive force-directed graph, enabling Directors to see patterns, identify key figures, and explore connections.

**Route:** `/relationships/network`

**Architecture:**

```
+page.svelte (Container & State Management)
├── NetworkFilterPanel.svelte (Left sidebar - filters)
├── NetworkDiagram.svelte (Center - vis.js visualization)
└── NetworkNodeDetails.svelte / NetworkEdgeDetails.svelte (Right sidebar - details)
```

**Key Features:**

1. **Interactive Graph Rendering**
   - Uses vis.js Network for force-directed layout
   - Pan, zoom, and drag interactions
   - Click to select nodes or edges
   - Automatic physics simulation for natural positioning
   - Stabilization on initial render

2. **Visual Entity Type Styling**
   - Each entity type has unique color and shape:
     - Characters/NPCs/Player Profiles: Circles (blue/purple/cyan)
     - Locations: Squares (green)
     - Factions: Hexagons (orange)
     - Items: Diamonds (yellow)
     - Encounters/Sessions: Stars (red/pink)
     - Deities: Triangles (purple)
     - Timeline Events: Boxes (teal)
     - World Rules/Campaigns: Ellipses (gray)
   - Color schemes adapt for dark mode

3. **Relationship Edge Styling**
   - Directional arrows for unidirectional relationships
   - No arrows for bidirectional relationships
   - Line thickness based on strength:
     - Strong: 3px width
     - Moderate: 2px width
     - Weak: 1px width
   - Color-coded by strength (green/yellow/red)

4. **Filtering System**
   - Filter by entity types (multi-select)
   - Filter by relationship types (multi-select)
   - Filters combine (AND logic)
   - Automatic graph update on filter change
   - Orphaned nodes removed when relationship filtering applied

5. **Detail Panels**
   - Node details: entity name, type, link count, navigate button
   - Edge details: source/target names, relationship type, bidirectional status, strength, navigate buttons
   - Selection state managed reactively
   - Cleared when filtered out

6. **Dark Mode Support**
   - Detects system color scheme preference
   - Listens for theme changes
   - Automatically updates node/edge colors
   - Background and text colors adapt

**Component Breakdown:**

**NetworkDiagram.svelte:**
- Wraps vis.js Network instance
- Converts RelationshipMap to vis.js DataSet format
- Configures network options (physics, interaction, layout)
- Handles node and edge click events
- Manages network lifecycle (init, update, destroy)
- Responsive to container size changes

**NetworkFilterPanel.svelte:**
- Multi-select for entity types
- Multi-select for relationship types (dynamically populated)
- Emits filter change events
- Shows filter count badges

**NetworkNodeDetails.svelte:**
- Displays selected node information
- Shows entity type badge
- Link count indicator
- Navigate to entity button
- Close button

**NetworkEdgeDetails.svelte:**
- Displays selected edge information
- Shows source and target entities
- Relationship type and direction
- Bidirectional indicator
- Strength badge (if set)
- Navigate to source/target buttons
- Close button

**Data Flow:**

1. Page loads → fetch `getRelationshipMap()` from entity repository
2. Initial map stored in `relationshipMap` state
3. Filters applied → `filteredMap` computed
4. NetworkDiagram receives `filteredMap` and renders vis.js graph
5. User clicks node/edge → selection state updated → detail panel shows
6. User changes filter → `applyFilters()` runs → `filteredMap` updates → graph re-renders

**State Management:**

All state managed with Svelte 5 runes (`$state`, `$derived`):

```typescript
let relationshipMap = $state<RelationshipMap>({ nodes: [], edges: [] });
let filteredMap = $state<RelationshipMap>({ nodes: [], edges: [] });
let filters = $state<NetworkFilterOptions>({});
let selectedNode = $state<SelectedNode | null>(null);
let selectedEdge = $state<SelectedEdge | null>(null);
let isDark = $state(false);
let isLoading = $state(true);

const availableRelationships = $derived(
  Array.from(new Set(relationshipMap.edges.map(e => e.relationship)))
);
```

**Type Definitions:**

```typescript
// /src/lib/types/network.ts
interface NetworkFilterOptions {
  entityTypes?: EntityType[];
  relationshipTypes?: string[];
  minStrength?: 'weak' | 'moderate' | 'strong';
}

interface SelectedNode {
  id: string;
  name: string;
  type: EntityType;
  linkCount: number;
}

interface SelectedEdge {
  id: number;
  source: string;
  target: string;
  sourceName: string;
  targetName: string;
  relationship: string;
  bidirectional: boolean;
  strength?: 'strong' | 'moderate' | 'weak';
}
```

**vis.js Integration:**

The NetworkDiagram component converts the RelationshipMap to vis.js format:

```typescript
// Nodes
const nodes = new DataSet(
  filteredMap.nodes.map(node => ({
    id: node.id,
    label: node.name,
    shape: getShapeForEntityType(node.type),
    color: getColorForEntityType(node.type, isDark),
    size: Math.max(15, 10 + node.linkCount * 2), // Size based on connections
    font: { color: isDark ? '#fff' : '#000' }
  }))
);

// Edges
const edges = new DataSet(
  filteredMap.edges.map(edge => ({
    id: edge.id,
    from: edge.source,
    to: edge.target,
    label: edge.relationship,
    arrows: edge.bidirectional ? 'none' : 'to',
    width: getWidthForStrength(edge.strength),
    color: getColorForStrength(edge.strength)
  }))
);
```

**Network Configuration:**

```typescript
const options = {
  physics: {
    enabled: true,
    stabilization: { iterations: 100 },
    barnesHut: { gravitationalConstant: -2000, springLength: 95 }
  },
  interaction: {
    dragNodes: true,
    dragView: true,
    zoomView: true,
    hover: true
  },
  layout: {
    improvedLayout: true,
    randomSeed: undefined // Different layout each time
  }
};
```

**Performance Considerations:**

- vis.js handles thousands of nodes/edges efficiently
- Physics stabilization on initial load (~100 iterations)
- Filtering reuses vis.js DataSet for efficient updates
- Dark mode colors computed once and cached
- Selection state prevents unnecessary re-renders

**User Experience Benefits:**

- Instant visual overview of entire campaign network
- Identify central/important entities by connection count
- Discover indirect connections and patterns
- Filter to specific subgraphs (e.g., character social networks)
- Navigate directly to entities from the visualization
- Responsive layout adapts to screen size

**Dependencies:**

- `vis-network`: ^10.0.2 - Network visualization library
- `vis-data`: ^8.0.3 - DataSet/DataView for vis.js

**Network Graph Utilities:**

The `/src/lib/utils/networkGraph.ts` module provides utility functions for converting relationship data to vis.js format:

```typescript
// Get node shape for entity type
getNodeShape(entityType: EntityType): string
// Returns: 'circle', 'square', 'hexagon', 'diamond', 'star', 'triangle', 'box', 'ellipse'

// Get color for entity type (theme-aware)
getEntityColor(entityType: EntityType, isDark: boolean): string
// Returns: Hex color code based on entity type and dark mode setting

// Convert RelationshipMap to vis.js DataSet
toVisNetworkData(map: RelationshipMap, options: NetworkDisplayOptions): { nodes: DataSet, edges: DataSet }
// Returns: vis.js compatible data structure

// Get edge width based on strength
getEdgeWidth(strength?: 'strong' | 'moderate' | 'weak'): number
// Returns: 3 (strong), 2 (moderate), 1 (weak), 2 (default)

// Get edge dash pattern based on strength
getEdgeDashes(strength?: 'strong' | 'moderate' | 'weak'): boolean | number[]
// Returns: false (solid), [5,5] (medium dashes), [2,4] (short dashes)
```

**Shape Mapping:**
- Characters/NPCs/Player Profiles → Circle
- Locations → Square
- Factions → Hexagon
- Items → Diamond
- Encounters/Sessions → Star
- Deities → Triangle
- Timeline Events → Box
- World Rules/Campaigns → Ellipse

**Color Palette:**
- Separate color sets for light and dark modes
- Each entity type has a unique, recognizable color
- Fallback to gray for unknown entity types
- Colors chosen for accessibility and visual distinction

**Future Enhancements:**

- Save/load custom layouts
- Export graph as image (PNG/SVG)
- Clustering for large networks
- Search/highlight specific nodes
- Shortest path visualization
- Community detection algorithms
- Time-based filtering (show relationships as of a date)
- Mini-map for navigation in large graphs

#### Relationship Matrix View

**Location:** `/src/routes/relationships/matrix/+page.svelte`

**Purpose:** Provide a 2D grid visualization of relationships between entity types, enabling Directors to see patterns, identify connection gaps, and manage relationships across different entity type combinations at a glance.

**Route:** `/relationships/matrix`

**Overview:**

The Matrix View displays entities as rows and columns in a grid where cells represent relationships between specific entity pairs. Cell color intensity indicates relationship density, making it easy to spot well-connected entities and relationship patterns.

**Key Features:**

1. **Flexible Entity Type Selection**
   - Choose any entity type for rows (characters, NPCs, locations, factions, etc.)
   - Choose any entity type for columns (can be same or different type)
   - Support for all 11 built-in entity types
   - Dynamic updates when entity types change

2. **Visual Cell Indicators**
   - Gray cells: No relationships
   - Blue gradient: Relationship count (darker = more relationships)
   - Hover shows exact relationship count
   - Click to view/edit relationships or create new ones

3. **Advanced Filtering**
   - Filter by specific relationship type (knows, allied_with, located_at, etc.)
   - Toggle "Hide rows with no relationships"
   - Toggle "Hide columns with no relationships"
   - Filters focus the matrix on connected entities

4. **Flexible Sorting**
   - Sort rows by name (alphabetical) or connection count
   - Sort columns by name (alphabetical) or connection count
   - Ascending or descending direction for each axis
   - Quickly identify hub entities with most connections

5. **Interactive Cells**
   - Click empty cell → Create new relationship dialog
   - Click populated cell → View all relationships between those entities
   - Edit button for individual relationships (in-place editing)
   - Integrates with EditRelationshipModal component

**Component Architecture:**

```
+page.svelte (Container)
├── MatrixControls.svelte (Filter and sort panel)
│   ├── Entity type selectors (rows/columns)
│   ├── Relationship type filter dropdown
│   ├── Hide empty toggles
│   └── Sort controls (name/count, asc/desc)
└── RelationshipMatrix.svelte (Grid visualization)
    └── MatrixCell.svelte (Individual cells)
        ├── Color-coded background
        ├── Relationship count badge
        └── Click handlers (view/create)
```

**State Management:**

Matrix view uses Svelte 5 runes for reactive state:

```typescript
// Filter options
let filterOptions = $state<MatrixFilterOptions>({
  rowEntityType: 'character',
  columnEntityType: 'character',
  relationshipType?: string,
  hideEmptyRows: false,
  hideEmptyColumns: false
});

// Sort options
let sortOptions = $state<MatrixSortOptions>({
  rowSort: 'alphabetical',
  columnSort: 'alphabetical',
  rowDirection: 'asc',
  columnDirection: 'asc'
});

// Derived matrix data
const matrixData = $derived.by(() => {
  const map = buildMatrixData(relationshipMap, filterOptions);
  return sortMatrixData(map, sortOptions);
});
```

**Data Processing Pipeline:**

1. **Load Relationship Map**: Fetch complete graph from `entityRepository.getRelationshipMap()`
2. **Filter Entities**: Apply entity type filters to get relevant rows/columns
3. **Build Cell Map**: Create cells for each row/column intersection
4. **Filter Relationships**: If relationship type filter active, show only matching relationships
5. **Hide Empty**: Remove rows/columns with zero relationships if toggled
6. **Sort**: Apply sorting to rows and columns independently
7. **Render**: Display matrix grid with color-coded cells

**Type Definitions:**

```typescript
// /src/lib/types/matrix.ts
interface MatrixFilterOptions {
  rowEntityType: EntityType;
  columnEntityType: EntityType;
  relationshipType?: string;
  hideEmptyRows?: boolean;
  hideEmptyColumns?: boolean;
}

interface MatrixSortOptions {
  rowSort: 'alphabetical' | 'connectionCount';
  columnSort: 'alphabetical' | 'connectionCount';
  rowDirection: 'asc' | 'desc';
  columnDirection: 'asc' | 'desc';
}

interface MatrixCellData {
  rowEntityId: string;
  columnEntityId: string;
  relationships: RelationshipMapEdge[];
  count: number;
}

interface MatrixData {
  rowEntities: RelationshipMapNode[];
  columnEntities: RelationshipMapNode[];
  cells: Map<string, MatrixCellData>;
  relationshipTypes: string[];
}
```

**Utility Functions:**

`/src/lib/utils/matrixUtils.ts` provides data processing functions:

- `buildMatrixData()`: Constructs matrix data structure from relationship map and filters
- `sortMatrixData()`: Sorts rows and columns based on sort options
- Cell key generation: `{rowEntityId}-{columnEntityId}`

**Color Coding Algorithm:**

```typescript
// Cell background color intensity based on relationship count
const maxCount = Math.max(...allCellCounts);
const intensity = Math.min((count / maxCount) * 100, 100);
const bgColor = `hsl(217, 91%, ${90 - intensity * 0.4}%)`;
// Result: Gray (no relationships) → Light blue → Dark blue (many relationships)
```

**Practical Use Cases:**

- **Faction Networks**: Set rows and columns to "faction" to see alliance patterns
- **NPC Locations**: Rows = NPCs, Columns = Locations to track where everyone is
- **Item Ownership**: Rows = Characters, Columns = Items to see who owns what
- **Character Connections**: Identify PCs with most NPC relationships
- **Gap Analysis**: Spot isolated entities with no connections
- **Hub Identification**: Sort by connection count to find central entities

**Performance Characteristics:**

- Single fetch of complete relationship map on page load
- Client-side filtering and sorting for instant updates
- Efficient cell lookup using Map with string keys
- Renders only visible cells (no virtualization needed for typical campaign sizes)
- Handles hundreds of entities without performance degradation

**Integration Points:**

- Uses `entityRepository.getRelationshipMap()` for data source
- Integrates with `RelateCommand` for creating relationships
- Integrates with `EditRelationshipModal` for editing relationships
- Shares relationship data with entity detail pages (changes sync automatically)
- Can be extended to export matrix data or save filter presets

**Accessibility:**

- Semantic table structure with proper headers
- ARIA labels for filter controls
- Keyboard navigation for cells (tab/enter)
- Color-blind friendly (uses both color and count badge)
- Screen reader support for cell relationship counts

**Future Enhancements:**

- Save filter/sort presets for common views
- Export matrix to CSV or image
- Highlight specific relationship paths
- Animated transitions when changing filters
- Side panel showing cell details without modal
- Heatmap overlay modes (by strength, tension, tags)

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
- **Edit Action**: Edit button for forward links (hidden for reverse links) opens EditRelationshipModal
- **Delete Action**: Remove button for forward links (hidden for reverse links)
- **Reverse Link Indicator**: Left border highlight for incoming relationships

**Visual States:**

- **Forward Links**: Show edit and delete buttons on hover, standard border
- **Reverse Links**: Blue left border, no edit/delete buttons, left arrow indicator
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

#### EditRelationshipModal Component

The EditRelationshipModal component provides a modal dialog for editing existing relationships in-place, eliminating the need to delete and recreate links.

**Location:** `/src/lib/components/entity/EditRelationshipModal.svelte`

**Purpose:** Allow users to modify all aspects of an existing relationship while preserving metadata like creation timestamps.

**Props:**

```typescript
interface EditRelationshipModalProps {
  sourceEntity: BaseEntity;           // The entity that owns the link
  targetEntity: BaseEntity;           // The entity being linked to
  link: EntityLink;                   // The link being edited
  open: boolean;                      // Controls modal visibility
  onClose: () => void;                // Callback when modal closes
  onSave: (changes: {
    relationship: string;
    notes?: string;
    strength?: 'strong' | 'moderate' | 'weak';
    metadata?: { tags?: string[]; tension?: number };
    bidirectional?: boolean;
  }) => Promise<void>;  // Save callback with specific change structure
}
```

**Features:**

- **Relationship Type Selector**: Text input for specifying the relationship type
- **Strength Selector**: Dropdown to choose between strong, moderate, or weak relationship strength
- **Notes Field**: Textarea for relationship context and details
- **Tags Input**: Tag input with press-Enter-to-add functionality for categorizing relationships
- **Tension Input**: Number input for setting tension level (0-100)
- **Bidirectional Toggle**: Checkbox to create/remove reverse link on target entity
- **Asymmetric Support**: When toggling bidirectional, automatically selects appropriate reverse relationship type
- **Validation**: Ensures required fields are filled before saving
- **Loading States**: Disables form and shows loading indicator during save operation
- **Success Feedback**: Shows success notification after saving changes

**Editable Fields:**

- Relationship type (text input)
- Strength (strong/moderate/weak dropdown)
- Notes (textarea)
- Tags (press-Enter-to-add input)
- Tension (0-100 number input)
- Bidirectional status (checkbox)

**Bidirectional Toggle Behavior:**

When toggling bidirectional status, the component automatically handles reverse link creation/removal:

- **Toggling ON**: Creates a reverse link on the target entity with the appropriate inverse relationship type
- **Toggling OFF**: Removes the reverse link from the target entity
- **Asymmetric Relationships**: Automatically determines the correct reverse relationship (e.g., "patron_of" → "client_of")
- **Symmetric Relationships**: Uses the same relationship type for both directions

**Integration:**

Used on entity detail pages via the RelationshipCard's edit button. The modal receives the current link data and entity references, allowing users to modify the relationship without losing metadata.

**Repository Support:**

The modal calls the entity repository's `updateLink()` method, which handles:
- Updating the link on the source entity
- Managing bidirectional link updates
- Setting the `updatedAt` timestamp
- Notifying the reactive store of changes

**Example Usage:**

```svelte
<script>
  let editingLink = $state<EntityLink | null>(null);
  let showEditModal = $state(false);

  function handleEditLink(link: EntityLink, linkedEntity: BaseEntity) {
    editingLink = link;
    showEditModal = true;
  }

  async function handleSaveLink(updates: Partial<EntityLink>) {
    if (!editingLink || !entity) return;

    await entitiesStore.updateLink(entity.id, editingLink.id, updates);
    showEditModal = false;
    editingLink = null;
  }
</script>

{#if editingLink && targetEntityForEdit}
  <EditRelationshipModal
    sourceEntity={entity}
    targetEntity={targetEntityForEdit}
    link={editingLink}
    open={showEditModal}
    onClose={() => { showEditModal = false; editingLink = null; }}
    onSave={handleSaveLink}
  />
{/if}
```

**User Experience Benefits:**

- Eliminates tedious delete/recreate workflow
- Preserves relationship metadata and timestamps
- Clear visual feedback for all relationship properties
- Intuitive bidirectional toggle with automatic reverse link management
- Immediate validation prevents invalid configurations
- Success notifications confirm changes were saved

#### Relationship Navigation Breadcrumbs

**Location:** `/src/lib/components/navigation/RelationshipBreadcrumbs.svelte`
**Utility Functions:** `/src/lib/utils/breadcrumbUtils.ts`

**Purpose:** Track and display the navigation path when users explore entity relationships, allowing them to see where they've been and navigate back through the chain.

**Implementation (Issue #79):**

The breadcrumb system uses URL parameters to persist the navigation trail across page loads and browser history operations.

**URL Format:**

```
/entities/{type}/{id}?navPath=entityId:relationship:name:type,entityId:relationship:name:type,...
```

**Example:**

```
/entities/npc/abc123?navPath=xyz456:patron_of:Lord%20Vance:npc,def789:knows:Elena:npc
```

This shows the user navigated from Lord Vance → Elena → current entity.

**Breadcrumb Utilities:**

```typescript
// Parse URL parameter into breadcrumb segments
parseBreadcrumbPath(pathParam: string | null): BreadcrumbSegment[]

// Serialize segments back to URL parameter
serializeBreadcrumbPath(segments: BreadcrumbSegment[]): string

// Truncate path to maximum length (keeps most recent)
truncatePath(segments: BreadcrumbSegment[], maxLength: number): BreadcrumbSegment[]

// Build navigation URL with updated breadcrumb path
buildNavigationUrl(
  targetType: string,
  targetId: string,
  currentSegments: BreadcrumbSegment[],
  relationship: string,
  currentEntity: { id: string; name: string; type: string }
): string
```

**BreadcrumbSegment Interface:**

```typescript
interface BreadcrumbSegment {
  entityId: string;        // Entity ID for navigation
  relationship: string;    // Relationship type used to reach this entity
  entityName: string;      // Display name
  entityType: string;      // Entity type (for routing)
}
```

**Component Features:**

**Visual Display:**
- Shows clickable entity names in navigation chain
- Chevron separators (→) between segments
- Current entity shown in bold (non-clickable)
- Ellipsis (...) when path exceeds display limit
- Clear button (X) to reset trail

**Navigation:**
- Click any breadcrumb segment to jump back to that entity
- Preserves original navigation path in URL
- Browser back/forward works with breadcrumb state
- Clear button removes navPath parameter entirely

**Display Limits:**
- Component prop `maxVisible` (default: 5) controls displayed segments
- Storage limit of 6 segments enforced by `buildNavigationUrl()`
- Older segments auto-truncated when limit exceeded
- Most recent segments always visible

**Props:**

```typescript
interface Props {
  segments: BreadcrumbSegment[];           // Current breadcrumb path
  currentEntity: {                         // Entity being viewed
    id: string;
    name: string;
    type: string;
  };
  maxVisible?: number;                     // Max segments to display (default: 5)
  onNavigate?: (index: number) => void;    // Callback when clicking segment
  onClear?: () => void;                    // Callback when clearing trail
}
```

**Integration with Entity Detail Pages:**

Entity detail pages (`/src/routes/entities/[type]/[id]/+page.svelte`) integrate breadcrumbs:

1. Read `navPath` query parameter from URL
2. Parse into `BreadcrumbSegment[]` using `parseBreadcrumbPath()`
3. Display `RelationshipBreadcrumbs` component at top of page
4. When user clicks relationship link, call `buildNavigationUrl()` to append current entity
5. Navigate using SvelteKit's `goto()` with new URL

**State Persistence:**

- Breadcrumb state stored entirely in URL query parameters
- No client-side storage needed
- Shareable URLs preserve navigation context
- Browser history automatically maintains breadcrumb state

**URL Encoding:**

Field values are URL-encoded to handle special characters:
- Spaces encoded as `%20`
- Apostrophes, parentheses encoded for safety
- Colons and commas reserved as delimiters
- Custom `encodeField()` function for consistent encoding

**Accessibility:**

- `<nav>` element with `aria-label="Breadcrumb navigation"`
- `<ol>` list with `role="list"`
- Current entity marked with `aria-current="page"`
- Clear button has `aria-label="Clear breadcrumb trail"`
- Keyboard navigable (all buttons focusable)

**Breadcrumb Lifecycle:**

**Created:**
- User clicks relationship link in Relationships section
- `buildNavigationUrl()` appends current entity to path
- Navigation occurs with updated `navPath` parameter

**Persisted:**
- URL parameter survives page refreshes
- Browser back/forward maintains breadcrumb state
- Works across browser sessions (shareable links)

**Cleared:**
- User clicks X button (removes `navPath` parameter)
- User navigates via search (new URL without `navPath`)
- User clicks sidebar entity link (direct navigation)
- User enters URL directly

**Edge Cases Handled:**

- Empty or malformed `navPath` parameter (returns empty array)
- URL decoding failures (skips invalid segments)
- Missing fields in segments (skips incomplete data)
- Path exceeding storage limit (auto-truncates to 6)
- Path exceeding display limit (shows ellipsis)
- Navigation to entity already in path (no cycle detection, path grows)

**Performance Characteristics:**

- O(n) parsing where n = number of segments
- O(n) serialization where n = number of segments
- Lightweight URL operations (no database queries)
- Negligible impact on page load performance
- URL length limits not a concern (max 6 segments × ~200 chars = ~1200 chars)

**User Benefits:**

- Track complex relationship exploration paths
- Understand how entities connect indirectly
- Quick backtracking through relationship network
- Visual context for current entity's relationship to visited entities
- Reduced cognitive load when exploring deep networks

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

#### MarkdownEditor Component

**Location:** `/src/lib/components/markdown/MarkdownEditor.svelte`

**Purpose:** Rich text editor with markdown support, toolbar formatting options, and live preview for editing richtext fields.

**Props:**

```typescript
interface MarkdownEditorProps {
  value: string;                        // Current markdown content (bindable)
  placeholder?: string;                 // Placeholder text for empty editor
  disabled?: boolean;                   // Disable editing
  readonly?: boolean;                   // Read-only mode
  mode?: 'edit' | 'preview' | 'split';  // Editor display mode (default: 'split')
  minHeight?: string;                   // Minimum height (default: '150px')
  maxHeight?: string;                   // Maximum height (default: '400px')
  class?: string;                       // Additional CSS classes
  showToolbar?: boolean;                // Show formatting toolbar (default: true)
  error?: string;                       // Error message to display
  onchange?: (value: string) => void;   // Change callback
}
```

**Features:**

- Formatting toolbar with buttons for bold, italic, heading, code, link, and list
- Three editing modes:
  - **Edit**: Show only markdown editor
  - **Preview**: Show only rendered preview
  - **Split**: Show editor and preview side-by-side
- Keyboard shortcuts: Ctrl+B (bold), Ctrl+I (italic)
- Real-time preview with HTML sanitization
- Automatic textarea resizing within min/max bounds
- Selection-aware formatting (wraps selected text)
- Dark mode support

**Usage Examples:**

```svelte
<script>
  let content = $state('# Welcome\n\nEdit your markdown here...');
</script>

<!-- Basic markdown editor -->
<MarkdownEditor bind:value={content} />

<!-- Edit-only mode with custom height -->
<MarkdownEditor
  bind:value={content}
  mode="edit"
  minHeight="200px"
  maxHeight="600px"
/>

<!-- Read-only preview mode -->
<MarkdownEditor
  value={content}
  mode="preview"
  readonly
  showToolbar={false}
/>

<!-- With change handler -->
<MarkdownEditor
  bind:value={content}
  onchange={(newValue) => console.log('Changed:', newValue)}
/>
```

**Toolbar Buttons:**

- **Bold (B)**: Wraps selection with `**`
- **Italic (I)**: Wraps selection with `*`
- **Heading (H)**: Adds `## ` at line start
- **Code (`<>`)**: Wraps selection with backticks
- **Link (🔗)**: Inserts `[text](url)` template
- **List (≡)**: Adds `- ` at line start

**Accessibility:**

- ARIA labels on toolbar buttons
- Keyboard navigation support
- Screen reader friendly mode indicators
- Proper focus management

#### MarkdownViewer Component

**Location:** `/src/lib/components/markdown/MarkdownViewer.svelte`

**Purpose:** Display markdown content as rendered HTML with sanitization for security.

**Props:**

```typescript
interface MarkdownViewerProps {
  content: string;        // Markdown content to render
  class?: string;         // Additional CSS classes
  sanitize?: boolean;     // Enable HTML sanitization (default: true)
}
```

**Features:**

- Markdown parsing using the `marked` library
- HTML sanitization using DOMPurify to prevent XSS attacks
- GitHub Flavored Markdown (GFM) support
- Converts newlines to `<br>` tags
- External links open in new tabs with `rel="noopener noreferrer"`
- Tailwind Typography (`prose`) styling
- Dark mode support with `prose-invert`

**Usage Examples:**

```svelte
<script>
  const markdown = `
    ## Features

    - **Bold** text
    - *Italic* text
    - [External link](https://example.com)

    \`\`\`javascript
    console.log('Code blocks too!');
    \`\`\`
  `;
</script>

<!-- Basic viewer -->
<MarkdownViewer content={markdown} />

<!-- Without sanitization (trusted content only) -->
<MarkdownViewer content={markdown} sanitize={false} />

<!-- Custom styling -->
<MarkdownViewer content={markdown} class="p-4 bg-white rounded" />
```

**Supported Markdown:**

- Headings (h1-h6)
- Bold and italic text
- Lists (ordered and unordered)
- Code blocks and inline code
- Links (automatically open in new tabs)
- Blockquotes
- Tables
- Horizontal rules
- Images

**Security:**

- HTML sanitization enabled by default
- Removes potentially dangerous tags and attributes
- Allows safe formatting tags only
- External links include `rel="noopener noreferrer"`

**Styling:**

All markdown elements are styled consistently with the application theme:
- Code blocks: Slate background with syntax highlighting
- Blockquotes: Left border with italic text
- Tables: Full-width with cell borders
- Links: Blue with hover underline
- Headings: Bold with appropriate sizing

#### Integration Points

**Entity List Pages** (`/src/routes/entities/[type]/+page.svelte`)
- Use LoadingSkeleton while fetching entity lists
- Show 5 entityCard skeletons during initial load
- Smooth transition to actual content

**Entity Create/Edit Forms** (`/src/routes/entities/[type]/new/+page.svelte`, `/src/routes/entities/[type]/[id]/edit/+page.svelte`)
- Use LoadingButton for save/create actions
- Use MarkdownEditor for all richtext field types
- Prevent double-submission during async operations
- Clear visual feedback for form submission

**Entity Detail Pages** (`/src/routes/entities/[type]/[id]/+page.svelte`)
- Use MarkdownViewer to render richtext field content
- Automatically sanitizes HTML to prevent XSS attacks
- Displays formatted markdown in read-only mode

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

### Relationship-Based Filtering

Director Assist provides comprehensive relationship-based filtering capabilities across entity lists and global search.

#### Entity Store Relationship Filters

**Location:** `/src/lib/stores/entities.svelte.ts`

The entity store maintains relationship filter state using Svelte 5 runes:

```typescript
let relationshipFilter = $state<{
  relatedToEntityId: string | undefined;
  relationshipType: string | undefined;
  hasRelationships: boolean | undefined;
}>({
  relatedToEntityId: undefined,
  relationshipType: undefined,
  hasRelationships: undefined
});
```

**Available Relationship Types:**

Dynamically computed from all entity links in the database:

```typescript
const availableRelationshipTypes = $derived.by(() => {
  const types = new Set<string>();
  for (const entity of entities) {
    for (const link of entity.links) {
      types.add(link.relationship);
    }
  }
  return Array.from(types).sort();
});
```

**Filter Methods:**

- `setRelationshipFilter(filter)` - Set multiple filters at once
- `clearRelationshipFilter()` - Reset all relationship filters
- `filterByRelatedTo(entityId)` - Filter by related entity
- `filterByRelationshipType(type)` - Filter by relationship type
- `filterByHasRelationships(hasRels)` - Filter by relationship existence

**Filtered Entities Derivation:**

The `filteredEntities` derived value applies relationship filters before text search:

```typescript
const filteredEntities = $derived.by(() => {
  let result = entities;

  // 1. Filter by "has relationships"
  if (hasRelationships === true) {
    result = result.filter((e) => e.links.length > 0);
  }

  // 2. Filter by relationship type
  if (relationshipType) {
    result = result.filter((e) =>
      e.links.some((link) => link.relationship.toLowerCase() === typeLower)
    );
  }

  // 3. Filter by related entity (bidirectional)
  if (relatedToEntityId) {
    // Get forward links (entities this one links to)
    const forwardLinkedIds = relatedEntity.links.map((l) => l.targetId);

    // Get reverse links (entities that link to this one)
    const reverseLinkedIds = entities
      .filter((e) => e.links.some((l) => l.targetId === relatedToEntityId))
      .map((e) => e.id);

    // Combine both directions
    const allRelatedIds = new Set([...forwardLinkedIds, ...reverseLinkedIds]);
    result = result.filter((e) => allRelatedIds.has(e.id));
  }

  // 4. Apply text search
  if (searchQuery) {
    result = result.filter(/* name, description, tags search */);
  }

  return result;
});
```

#### RelationshipFilter Component

**Location:** `/src/lib/components/filters/RelationshipFilter.svelte`

**Purpose:** Provides UI controls for filtering entities by relationships on entity list pages.

**Props:**

```typescript
interface RelationshipFilterProps {
  relatedToEntityId: string | undefined;
  relationshipType: string | undefined;
  hasRelationships: boolean | undefined;
  availableEntities: BaseEntity[];
  availableRelationshipTypes: string[];
  onFilterChange: (filters: {
    relatedToEntityId: string | undefined;
    relationshipType: string | undefined;
    hasRelationships: boolean | undefined;
  }) => void;
}
```

**Features:**

- **Related To Dropdown**: Entities grouped by type with searchable names
- **Relationship Type Dropdown**: Dynamically populated from campaign relationships
- **Has Relationships Checkbox**: Toggle to show only entities with links
- **Clear Filters Button**: Reset all filters to default state
- **Controlled Inputs**: Syncs local state with parent via `$effect`
- **Visual Feedback**: Active filters highlighted, clear button shows when filters applied

**State Management:**

```typescript
// Local controlled state
let selectedEntityId = $state('');
let selectedRelType = $state('');
let hasRelsChecked = $state(false);

// Sync with props
$effect(() => {
  selectedEntityId = relatedToEntityId ?? '';
  selectedRelType = relationshipType ?? '';
  hasRelsChecked = hasRelationships ?? false;
});

// Derived active filter indicator
const hasActiveFilters = $derived(
  !!selectedEntityId || !!selectedRelType || hasRelsChecked
);
```

**Integration:**

Used on entity list pages (`/src/routes/entities/[type]/+page.svelte`):

```svelte
<RelationshipFilter
  relatedToEntityId={entitiesStore.relationshipFilter.relatedToEntityId}
  relationshipType={entitiesStore.relationshipFilter.relationshipType}
  hasRelationships={entitiesStore.relationshipFilter.hasRelationships}
  availableEntities={entitiesStore.entities}
  availableRelationshipTypes={entitiesStore.availableRelationshipTypes}
  onFilterChange={handleRelationshipFilterChange}
/>
```

#### URL Persistence

Relationship filters are persisted in URL query parameters for bookmarking and sharing:

**Query Parameters:**
- `relatedTo` - Entity ID to filter relationships by
- `relType` - Relationship type to filter by
- `hasRels` - "true" or "false" for has relationships filter
- `page` - Current pagination page (reset to 1 when filters change)
- `perPage` - Items per page

**URL Sync on Entity List Pages:**

```typescript
// Read from URL
const urlRelatedTo = $derived($page.url.searchParams.get('relatedTo') || undefined);
const urlRelType = $derived($page.url.searchParams.get('relType') || undefined);
const urlHasRels = $derived.by(() => {
  const param = $page.url.searchParams.get('hasRels');
  return param === 'true' ? true : param === 'false' ? false : undefined;
});

// Initialize store from URL
$effect(() => {
  if (urlRelatedTo || urlRelType || urlHasRels !== undefined) {
    entitiesStore.setRelationshipFilter({
      relatedToEntityId: urlRelatedTo,
      relationshipType: urlRelType,
      hasRelationships: urlHasRels
    });
  }
});

// Update URL when filters change
function handleRelationshipFilterChange(filters) {
  entitiesStore.setRelationshipFilter(filters);

  const url = new URL($page.url);
  url.searchParams.set('page', '1'); // Reset pagination

  if (filters.relatedToEntityId) {
    url.searchParams.set('relatedTo', filters.relatedToEntityId);
  } else {
    url.searchParams.delete('relatedTo');
  }

  // ... handle other params

  goto(url.toString());
}
```

**Benefits:**
- Shareable filtered views via URL
- Browser back/forward navigation works with filters
- Filters persist across page refreshes
- Bookmarkable filtered queries

### Global Search

The HeaderSearch component provides instant access to all campaign entities with advanced relationship syntax:

**Features:**
- Debounced input (150ms) to optimize performance
- Results grouped by entity type
- Maximum 5 results per type
- Keyboard navigation (Arrow Up/Down, Enter, Escape)
- Global keyboard shortcut (Cmd+K or Ctrl+K)
- Click outside to close dropdown
- ARIA attributes for accessibility
- Advanced relationship filter syntax

**Relationship Search Syntax:**

The HeaderSearch component supports special syntax for filtering by relationships:

```typescript
// Syntax patterns
related:entity-name       // Filter by entity name
related:"entity name"     // Filter by name with spaces
related:entity-id         // Filter by exact entity ID
relationship:type         // Filter by relationship type
```

**Syntax Parsing:**

```typescript
function parseRelationshipSyntax(input: string): {
  relatedTo: string | undefined;
  relationshipType: string | undefined;
  remainingText: string;
} {
  let relatedTo: string | undefined;
  let relationshipType: string | undefined;
  let text = input;

  // Parse related: syntax (supports quotes for names with spaces)
  const relatedMatches = [...text.matchAll(/related:(?:"([^"]+)"|(\S+))/gi)];
  if (relatedMatches.length > 0) {
    const lastMatch = relatedMatches[relatedMatches.length - 1];
    relatedTo = lastMatch[1] || lastMatch[2];

    // Resolve entity name to ID
    const entity = entities.find(
      (e) => e.name.toLowerCase() === relatedTo?.toLowerCase() || e.id === relatedTo
    );
    if (entity) {
      relatedTo = entity.id;
    }

    // Remove from text
    text = text.replace(match[0], '').trim();
  }

  // Parse relationship: syntax
  const relationshipMatches = [...text.matchAll(/relationship:(?:"([^"]+)"|(\S+))/gi)];
  if (relationshipMatches.length > 0) {
    const lastMatch = relationshipMatches[relationshipMatches.length - 1];
    relationshipType = (lastMatch[1] || lastMatch[2]).toLowerCase();

    // Remove from text
    text = text.replace(match[0], '').trim();
  }

  return { relatedTo, relationshipType, remainingText: text };
}
```

**How It Works:**

1. User types in search bar: `related:"Lord Vance" wizard`
2. Parser extracts: `relatedTo = "lord-vance-id"`, `remainingText = "wizard"`
3. Store filters applied:
   - `filterByRelatedTo("lord-vance-id")`
   - `setSearchQuery("wizard")`
4. Results show entities related to Lord Vance with "wizard" in their content

**Examples:**

```
related:Grimwald                           → Entities related to Grimwald
relationship:enemy_of                      → Entities with enemy relationships
related:"The Silver Circle"                → Entities related to The Silver Circle
related:npc-123 relationship:knows wizard  → NPCs that know npc-123 with "wizard" in content
```

**Implementation:**
- Search query updates the entities store via multiple methods
- Relationship syntax parsed and removed from text search
- Store filters entities reactively based on combined filters
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

Director Assist provides flexible AI integration through a multi-provider abstraction layer that supports Anthropic (Claude), OpenAI (GPT), Google (Gemini), Mistral, and Ollama (local models).

### Multi-Provider Architecture

**Location:** `/src/lib/ai/`

The AI module provides a unified interface for text generation across multiple AI providers. Applications use the same API regardless of which provider is active.

**Key Design Principles:**
- Provider-agnostic client API
- Centralized configuration and settings storage
- Consistent error handling across providers
- Support for both streaming and non-streaming generation

#### Module Structure

```
src/lib/ai/
├── index.ts              # Public API exports
├── client.ts             # Unified generate() and generateStream() functions
├── providers/            # Provider implementations
│   ├── index.ts          # Provider registry
│   ├── types.ts          # Core TypeScript interfaces
│   ├── anthropic.ts      # Anthropic (Claude) provider
│   ├── openai.ts         # OpenAI (GPT) provider
│   ├── google.ts         # Google (Gemini) provider
│   ├── mistral.ts        # Mistral provider
│   └── ollama.ts         # Ollama (local models) provider
└── config/
    ├── index.ts          # Configuration utilities
    └── storage.ts        # Settings persistence (localStorage + IndexedDB)
```

#### Core API

**Client Functions:**

```typescript
// Generate text with the active provider and model
async function generate(
  prompt: string,
  options?: GenerationOptions
): Promise<GenerationResult>

// Generate text with streaming
async function generateStream(
  prompt: string,
  options?: GenerationOptions
): Promise<GenerationResult>
```

**Generation Options:**

```typescript
interface GenerationOptions {
  maxTokens?: number;           // Maximum tokens to generate
  temperature?: number;         // 0-1, controls randomness
  systemPrompt?: string;        // System instructions
  onStream?: StreamCallback;    // Callback for streaming chunks
}
```

**Generation Result:**

```typescript
interface GenerationResult {
  success: boolean;             // Whether generation succeeded
  content?: string;             // Generated text (if successful)
  error?: string;              // Error message (if failed)
  usage?: {                    // Token usage (if available)
    promptTokens: number;
    completionTokens: number;
  };
}
```

#### Provider Registry

**Location:** `/src/lib/ai/providers/index.ts`

The provider registry manages all available AI providers and their models.

**Key Functions:**

```typescript
// Get provider adapter by name
getProvider(provider: AIProvider): ProviderAdapter

// Get available models for a provider
getProviderModels(provider: AIProvider): AIModelInfo[]

// Create a model instance
getProviderModel(
  provider: AIProvider,
  modelId: string,
  config: ProviderConfig
): LanguageModel

// Check if provider is configured
isProviderConfigured(provider: AIProvider): boolean
```

**Supported Providers:**

| Provider | Type | Model Count | Notes |
|----------|------|-------------|-------|
| Anthropic | Cloud API | 6 | Claude models (Opus, Sonnet, Haiku) |
| OpenAI | Cloud API | 9 | GPT models (4.5, 4, 3.5) |
| Google | Cloud API | 5 | Gemini models (Pro, Flash) |
| Mistral | Cloud API | 6 | Mistral models (Large, Small, Nemo) |
| Ollama | Local | 1 | Self-hosted local models |

**Total Models:** 26+ models across 5 providers

#### Configuration and Storage

**Location:** `/src/lib/ai/config/storage.ts`

Settings are stored in two locations based on sensitivity:

**localStorage (API Keys):**
- Keys: `ai-provider-{provider}-apikey`
- Values: Encrypted API keys
- Not included in backup/restore
- Browser-only storage

**IndexedDB (Provider Settings):**
- Stored in `aiSettings` table
- Includes: active provider, active model, provider configurations
- Included in backup/restore (without API keys)
- Synchronized across application

**Key Functions:**

```typescript
// API key management (localStorage)
getApiKey(provider: AIProvider): string | null
setApiKey(provider: AIProvider, key: string): void
deleteApiKey(provider: AIProvider): void

// Provider settings (IndexedDB)
getProviderSettings(): Promise<AIProviderSettings>
setProviderSettings(settings: AIProviderSettings): Promise<void>
getAISettings(): Promise<AIProviderSettings>
```

**Settings Structure:**

```typescript
interface AIProviderSettings {
  activeProvider: AIProvider;              // Currently selected provider
  activeModel: string;                     // Currently selected model ID
  providers: Record<AIProvider, {          // Per-provider configuration
    provider: AIProvider;
    apiKey?: string;                       // API key (not in IndexedDB)
    baseUrl?: string;                      // Base URL (Ollama only)
    enabled: boolean;                      // Whether provider is enabled
  }>;
}
```

#### Model Information

Each model includes metadata for UI display and capability detection:

```typescript
interface AIModelInfo {
  id: string;                    // Model identifier (e.g., 'claude-3-5-sonnet-20241022')
  displayName: string;           // Human-readable name
  provider: AIProvider;          // Provider this model belongs to
  tier: ModelTier;              // 'fast', 'balanced', or 'powerful'
  capabilities: {
    streaming: boolean;          // Supports streaming responses
    maxTokens: number;           // Maximum output tokens
    supportsTools: boolean;      // Supports function/tool calling
  };
}
```

**Model Tiers:**
- **fast**: Quick responses, lower cost (e.g., Claude Haiku, GPT-3.5)
- **balanced**: Good mix of speed and capability (e.g., Claude Sonnet, GPT-4)
- **powerful**: Best quality, slower/more expensive (e.g., Claude Opus, GPT-4.5)

#### Error Handling

The client provides consistent error handling across all providers:

| Error Type | Status Code | User Message |
|------------|-------------|--------------|
| Authentication | 401 | "Invalid API key or authentication failed" |
| Rate Limit | 429 | "Rate limit exceeded - please try again later" |
| Server Error | 500 | "Server error - please try again later" |
| Not Configured | - | "Provider {name} is not configured (API key missing)" |
| Not Enabled | - | "Provider {name} is not enabled" |

**Error Propagation:**

Errors are returned as `GenerationResult` objects with `success: false` rather than throwing exceptions:

```typescript
// Error result
{
  success: false,
  error: "Invalid API key or authentication failed"
}

// Success result
{
  success: true,
  content: "Generated text...",
  usage: { promptTokens: 100, completionTokens: 50 }
}
```

#### Dependencies

The AI module uses the Vercel AI SDK for unified provider access:

```json
{
  "ai": "^4.2.1",
  "@ai-sdk/anthropic": "^1.0.10",
  "@ai-sdk/openai": "^1.0.10",
  "@ai-sdk/google": "^1.0.10",
  "@ai-sdk/mistral": "^1.0.6",
  "ollama-ai-provider": "^1.0.6"
}
```

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
  3. Calls active AI provider (e.g., Claude, GPT, or Gemini)
  4. Returns: "Quirky and forgetful, but fiercely intelligent..."
  5. Inserts generated text into Personality field
```

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
- API keys stored in localStorage (key: `ai-provider-{provider}-apikey`)
- Provider settings stored in IndexedDB (`aiSettings` table)
- Active provider and model selected by user in Settings UI (planned)
- Max tokens: 1024 (configurable per field type)

#### Context Builder Service

**Location:** `/src/lib/services/contextBuilder.ts`

**Purpose:** Builds contextual summaries of entities for AI prompt injection, managing character and entity limits to stay within token budgets.

**Key Functions:**

```typescript
// Build context from entity summaries with filtering and limits
buildContext(options: ContextOptions): Promise<BuiltContext>

// Format a single entity for display
formatContextEntry(entry: EntityContext): string

// Format complete context for AI prompt injection
formatContextForPrompt(context: BuiltContext): string

// Get statistics about context usage
getContextStats(context: BuiltContext): { entityCount, characterCount, estimatedTokens, truncated }
```

**Options Interface:**

```typescript
interface ContextOptions {
  maxEntities?: number;          // Default: 50
  maxCharacters?: number;         // Default: 8000
  includeLinked?: boolean;        // Default: true
  entityIds?: EntityId[];         // Specific entities to include
  entityTypes?: string[];         // Filter by entity types
}
```

**Features:**

- Automatic linked entity discovery when `includeLinked` is true
- Privacy protection: only includes entities with summaries
- Character budget enforcement to prevent exceeding token limits
- Type filtering to include only relevant entity types
- Truncation tracking to inform users when context is limited

**Output Format:**

```
=== Campaign Context ===
[NPC] Grimwald the Wise: An elderly wizard who serves as the party's mentor
[Faction] Shadow Guild: A secretive organization operating in the city's underbelly
[Location] Arcane Library: Ancient repository of magical knowledge
(Additional entities available but not included due to context limits)
```

#### Relationship Context Builder Service

**Location:** `/src/lib/services/relationshipContextBuilder.ts`

**Purpose:** Builds contextual summaries of related entities from the perspective of a source entity for AI generation. Complements the general context builder by focusing on entity relationships.

**Key Functions:**

```typescript
// Build relationship context for a source entity
buildRelationshipContext(
  sourceEntityId: EntityId,
  options: RelationshipContextOptions
): Promise<RelationshipContext>

// Format a single related entity entry
formatRelatedEntityEntry(entry: RelatedEntityContext): string

// Format complete relationship context for AI prompts
formatRelationshipContextForPrompt(context: RelationshipContext): string

// Calculate statistics about relationship context
getRelationshipContextStats(context: RelationshipContext): RelationshipContextStats

// Build privacy-safe summary (excludes hidden/secret fields)
buildPrivacySafeSummary(entity: BaseEntity): string
```

**Options Interface:**

```typescript
interface RelationshipContextOptions {
  maxRelatedEntities?: number;    // Default: 20
  maxCharacters?: number;          // Default: 4000
  direction?: 'outgoing' | 'incoming' | 'both';  // Default: 'both'
  relationshipTypes?: string[];    // Filter by relationship types
  entityTypes?: EntityType[];      // Filter by entity types
  maxDepth?: number;               // Default: 1 (traversal depth)
  includeStrength?: boolean;       // Default: false
  includeNotes?: boolean;          // Default: false
}
```

**Features:**

- **Relationship Traversal**: Supports depth-based traversal to include indirect relationships
- **Bidirectional**: Can include outgoing links (from source), incoming links (to source), or both
- **Privacy Protection**: Automatically excludes hidden fields and secrets via `buildPrivacySafeSummary()`
- **Circular Reference Prevention**: Tracks visited entities to avoid infinite loops
- **Smart Truncation**: Respects both entity count and character limits
- **Relationship Metadata**: Optionally includes relationship strength and notes

**Output Format:**

```
=== Relationships for Grimwald the Wise ===
[Relationship: mentor_of] Aldric (Player Character): Young warrior seeking guidance...
[Relationship: member_of] Wizard's Council (Faction): Governing body of mages... [Strength: strong]
[Relationship: resides_in] Arcane Tower (Location): Tall structure in the city center...
(Context truncated - additional relationships available but not included due to limits)
```

**Privacy Protection:**

The `buildPrivacySafeSummary()` function ensures that AI context never includes sensitive information:
- Excludes fields marked with `section: 'hidden'`
- Excludes the `secrets` field
- Excludes the `notes` field
- Truncates descriptions to 200 characters
- Limits total summary to 500 characters

**Use Cases:**

- Generating content that needs awareness of entity relationships
- Building character backstories that reference existing connections
- Creating plot hooks based on faction memberships
- Generating location descriptions that mention inhabitants

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

1. **Settings UI**: Provider selection and model configuration interface
2. **Full-Entity Generation**: Create entire entities at once
3. **Chat Interface**: Conversational AI for campaign planning
4. **Context Builder**: Select specific entities for AI context
5. **Suggestion System**: AI-generated plot hooks and campaign ideas
6. **Consistency Checker**: Identify conflicts in campaign data
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
