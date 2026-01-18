# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Network diagram visualization at `/relationships/network` (Issue #74)
  - Interactive graph showing all entities as nodes and relationships as edges using vis.js
  - Visual styling: unique colors and shapes for each entity type (circles, squares, hexagons, diamonds, stars, triangles, boxes, ellipses)
  - Relationship styling: edge thickness and style based on relationship strength (strong/moderate/weak), directional arrows
  - Interactive controls: pan, zoom, drag nodes to reposition, click to select nodes or edges
  - Filter panel: filter by entity type and relationship type to focus on specific parts of the network
  - Detail panels: click nodes to see entity details and navigate to entity page, click edges to see relationship metadata
  - Dark mode support: automatically adapts to system theme with appropriate colors
  - Stats footer: shows count of filtered/total entities and relationships
  - Dependencies: vis-network and vis-data for graph rendering
- Relationship Matrix View at `/relationships/matrix` (Issue #73)
  - 2D grid visualization showing relationships between entity types
  - Select different entity types for rows and columns (e.g., NPCs vs Locations)
  - Cells display relationship count with color-coding (gradient from gray to blue)
  - Click cells to view existing relationships or create new ones
  - Filter by relationship type to show only specific relationship kinds
  - Toggle visibility of entities with no relationships
  - Sort rows and columns by name or connection count (ascending or descending)
  - Integrates with EditRelationshipModal for in-place editing
  - Built with RelationshipMatrix, MatrixControls, and MatrixCell components
  - Utility functions in matrixUtils.ts for data processing and sorting
- Dedicated relationships management page at `/entities/[type]/[id]/relationships` (Issue #76)
  - Filter panel: filter by relationship type, target entity type, strength, or search by name
  - Sortable table with columns for target, type, relationship, strength, and actions
  - Bulk operations: select multiple relationships for bulk delete, strength update, or tag addition
  - Pagination with configurable items per page
  - Quick add button to create new relationships
  - Edit button for individual relationships (integrates with EditRelationshipModal from #75)
  - "Manage Relationships" link from entity detail page
  - Empty state handling for no relationships or no filter matches
- Initial project structure with SvelteKit and static adapter
- Client-side storage with Dexie (IndexedDB)
- Tailwind CSS styling
- TypeScript support
- ESLint configuration for code quality
- Edit functionality for entities (dedicated edit page at `/entities/[type]/[id]/edit`)
- Global entity search with HeaderSearch component
  - Debounced search input (150ms delay)
  - Results grouped by entity type
  - Maximum 5 results per type displayed
  - Keyboard navigation (Arrow Up/Down, Enter, Escape)
  - Global keyboard shortcut (Cmd+K on Mac, Ctrl+K on Windows/Linux)
  - Click outside to close
  - Comprehensive test suite with 51 tests
- Command Palette for quick actions (Issue #39)
  - Type "/" in search bar to enter command mode
  - Available commands: `/new`, `/search`, `/go`, `/relate`, `/summarize`, `/settings`
  - Context-aware command filtering (entity-specific commands only show when viewing an entity)
  - Command arguments support (e.g., `/new npc`, `/search dragons`)
  - Keyboard navigation and execution (Arrow keys, Enter, Escape)
  - Seamless integration with existing HeaderSearch component
- Per-field AI generation buttons on entity forms (Issue #47)
  - Individual generate buttons next to each text, textarea, and richtext field
  - Context-aware generation using other filled fields
  - DM-only fields excluded from AI context for privacy
  - Visual loading states with spinner during generation
  - User-friendly error handling for API failures
- Auto-select latest Claude Haiku model as default (Issue #36)
  - Automatically selects the newest Haiku model from Anthropic API
  - Parses dates from model IDs to determine latest version
  - User selections always take precedence over auto-selection
  - Falls back to hardcoded default if API unavailable
  - Eliminates need for app updates when new Haiku models release
- Complete implementation of missing form field types (Issue #10)
  - Boolean fields with checkbox input and Yes/No display
  - URL fields with validation and "Open Link" button
  - Multi-select fields with checkbox options
  - Image fields with file upload, base64 storage, and preview with remove button
  - Entity-ref fields with searchable dropdown for single entity references
  - Entity-refs fields with chips display and search for multiple entity references
  - All field types fully integrated across create, edit, and detail views
  - Added 'image' type to FieldDefinitionEditor for custom entity types
- Pagination for entity list pages (Issue #20)
  - URL-based pagination with page and perPage query parameters
  - Configurable items per page (20, 50, or 100)
  - Previous/Next navigation buttons
  - Item count display ("Showing X-Y of Z items")
  - Integrates with search filtering
  - Pagination controls appear only when needed
- Relationship graph data export (Issue #70)
  - New `getRelationshipMap()` method in entity repository
  - Returns graph-ready data structure with nodes (entities) and edges (links)
  - Compatible with D3.js, vis.js, and Cytoscape.js visualization libraries
  - Supports filtering by entity types
  - Automatic edge deduplication for bidirectional relationships
  - Accurate link count calculation for each entity node
  - Exports interfaces: RelationshipMapNode, RelationshipMapEdge, RelationshipMap, RelationshipMapOptions
  - Comprehensive JSDoc documentation with usage examples
- In-place relationship editing (Issue #75)
  - New EditRelationshipModal component for editing relationships without delete/recreate
  - Edit button added to relationship cards (forward links only)
  - Modify relationship type, strength, notes, tags, and tension
  - Toggle bidirectional status on existing relationships
  - Creating reverse link when toggling bidirectional ON
  - Removing reverse link when toggling bidirectional OFF
  - Preserves timestamps and metadata during edits
  - Success notification after saving changes

### Fixed
- Resolved Svelte 5 state_unsafe_mutation error in entity pages (Issue #98)
  - Fixed reactive state access in template {@const} blocks on entity detail page
  - Updated entity reference rendering to use store getter methods instead of direct array access
  - Added helper functions to prevent unsafe state mutations during template rendering
  - Affects entity detail, edit, and new pages

### Planning
- End-to-end tests (Playwright)
- Accessibility improvements

## [0.1.0] - 2026-01-15

### Added
- Initial public release
- Director management interface
- Entity management (cast, crew, etc.)
- Settings page with data management
- Dark mode support with Tailwind CSS
