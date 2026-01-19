# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Draw Steel-specific fields for Encounter and Session entities (Issue #3)
  - 10 new Encounter fields in Draw Steel system profile: challengeLevel, threats (entity-refs), environment, victoryConditions, defeatConditions, readAloudText, tacticalNotes, treasureRewards, negotiationPosition (select), negotiationMotivations
  - 13 new Session fields in Draw Steel system profile: sessionDuration, inWorldDate, partyPresent (entity-refs), xpAwarded, gloryAwarded, treasureAwarded, keyDecisions, characterDevelopment, campaignMilestones (tags), powerRollOutcomes, negotiationOutcomes, initiativeOrder, encountersRun (entity-refs)
  - Renamed "enemies" terminology to "threats" for accurate Draw Steel nomenclature
  - Added gloryAwarded field for Draw Steel's Glory progression system
  - Fields automatically appear when campaign uses Draw Steel system profile
  - Maintains backwards compatibility with existing System Agnostic campaigns
- Campaign as first-class entity type (Issue #46)
  - Campaigns now stored as entities with `type: 'campaign'` in the entities table
  - Multiple campaigns supported with active campaign tracking
  - Campaign list page at `/entities/campaign` with active campaign badge
  - "Set as Active" button for switching between campaigns
  - Campaign switcher in header for quick access
  - Delete protection: cannot delete last remaining campaign (disabled button with tooltip)
  - Campaign deletion guard in entity repository
  - Automatic migration from old singleton campaign table to entities table
  - Campaign store manages campaigns via entityRepository (no separate repository)
  - Active campaign ID tracked via appConfigRepository
  - `reset()` method added to campaign store for testing
  - Fixed campaign store error handling
  - 69 tests covering campaign functionality

### Fixed

### Changed
- Removed legacy `campaignRepository.ts` (campaigns managed via entityRepository)
- Campaign store now uses entityRepository for all CRUD operations
- Database schema updated to include appConfig table for active campaign tracking

## [0.3.0] - 2026-01-19

### Added
- UI for previewing relationship context before AI generation (Issue #62)
  - New RelationshipContextSelector component - expandable section showing relationship context for AI generation
  - RelationshipContextItem component - displays individual relationships with cache status and controls
  - Select/deselect individual relationships to include in AI context
  - Token count estimates for context size awareness
  - Cache status display with color coding (valid/stale/missing)
  - Cache age display with relative time formatting ("Cached 2 hours ago")
  - Manual regeneration buttons for relationship summaries
  - timeFormat utility for human-readable relative time formatting
- Relationship summary cache status and manual regeneration UI (Issue #134)
  - Visual cache status indicators on relationship context items
  - "Regenerate" button to manually refresh stale relationship summaries
  - Cache validation checks based on entity update timestamps
  - Real-time cache status updates in the UI
- Multi-AI provider support (Issue #26)
  - New AI abstraction layer in `src/lib/ai/` supporting multiple providers
  - Supported providers: Anthropic (Claude), OpenAI (GPT), Google (Gemini), Mistral, Ollama (local)
  - Unified `generate()` and `generateStream()` API across all providers
  - Provider registry with 26+ models from 5 providers
  - Settings storage: API keys in localStorage, provider preferences in IndexedDB
  - Model tiers: fast, balanced, powerful for easy selection
  - Consistent error handling across providers
  - Provider-specific configurations (baseUrl for Ollama, API keys for cloud providers)
  - Dependencies: ai, @ai-sdk/anthropic, @ai-sdk/openai, @ai-sdk/google, @ai-sdk/mistral, ollama-ai-provider
- Markdown editor for rich text fields (Issue #13)
  - New MarkdownEditor component with formatting toolbar (bold, italic, heading, code, link, list)
  - Three editing modes: edit-only, preview-only, and split view
  - Keyboard shortcuts: Ctrl+B for bold, Ctrl+I for italic
  - Real-time markdown preview with HTML sanitization
  - New MarkdownViewer component for rendering markdown as sanitized HTML
  - Integrated into all entity forms (new and edit pages) for richtext fields
  - Markdown rendering on entity view pages for richtext content
  - Dependencies: marked for markdown parsing, DOMPurify for HTML sanitization
- Relationship-based entity filtering system (Issue #78)
  - RelationshipFilter component on entity list pages
  - Filter by "related to" a specific entity (bidirectional)
  - Filter by relationship type (ally_of, enemy_of, member_of, etc.)
  - Filter by "has any relationships" checkbox
  - Clear all filters button
  - URL persistence for relationship filters (relatedTo, relType, hasRels query params)
  - Dynamic relationship type dropdown populated from campaign data
  - Entities grouped by type in "related to" dropdown
  - Advanced search syntax in HeaderSearch: `related:entity-name`, `related:"entity name"`, `relationship:type`
  - Combines with text search for precise filtering
  - Store methods: `setRelationshipFilter()`, `clearRelationshipFilter()`, `filterByRelatedTo()`, `filterByRelationshipType()`, `filterByHasRelationships()`
  - Derived `availableRelationshipTypes` from entity links
  - Bidirectional relationship resolution (forward and reverse links)
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
- Auto-generate buttons for Summary and Description fields on entity edit page (Issue #123)
  - Generate buttons appear next to Summary and Description field labels
  - Click to generate AI content based on other filled fields
  - Confirmation dialog when replacing existing content
  - Loading state during generation with disabled buttons
  - New service functions: generateSummaryContent() for brief 1-2 sentence summaries
  - New service function: generateDescriptionContent() for detailed multi-paragraph descriptions
  - New ConfirmDialog component at src/lib/components/ui/ConfirmDialog.svelte for user confirmations
  - Buttons respect AI features toggle (hidden when API key not configured)
  - Error handling with user-friendly notifications
- Relationship context settings for AI generation (Issue #61)
  - New "Relationship Context" section in Settings page
  - Enable/disable relationship context in generation (default: enabled)
  - Configure maximum related entities to include (1-50, default: 20)
  - Set maximum characters per entity (1000-10000, default: 4000)
  - Adjust context budget allocation slider (0-100%, default: 50% balanced)
  - Option to auto-generate relationship summaries (default: off)
  - Settings stored in localStorage for persistence
  - New relationshipContextSettingsService with get/set/reset functions
  - Defaults: enabled=true, maxRelatedEntities=20, maxCharacters=4000, contextBudgetAllocation=50, autoGenerateSummaries=false
- Relationship summary caching system (Issue #58)
  - New IndexedDB table `relationshipSummaryCache` for storing AI-generated summaries
  - Automatic cache invalidation when source or target entities are updated
  - Cache key format: `${sourceId}|||${targetId}|||${relationship}`
  - New type definitions in `src/lib/types/cache.ts` for cache entries and statistics
  - RelationshipSummaryCacheRepository for cache data access (CRUD operations)
  - RelationshipSummaryCacheService for high-level cache management
  - `getOrGenerate()` method automatically checks cache before generating
  - `forceRegenerate` parameter bypasses cache when needed
  - Cache invalidation methods: `invalidate()`, `invalidateByEntity()`, `clearAll()`
  - `getCacheStatus()` checks if cached summary is valid or stale
  - `getStats()` provides cache usage statistics and monitoring
  - Database version 3 schema includes cache table with composite key index
- "Include relationship context" checkbox on entity edit forms (Issue #59)
  - Optional checkbox appears when entity has relationships and AI is enabled
  - Shows relationship count and estimated token cost when enabled
  - Includes information about related entities in AI generation context
  - Default state controlled by "Include Related Entities" setting
  - Privacy protected: hidden fields from related entities are excluded
  - Provides richer, more contextually aware AI-generated content

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
