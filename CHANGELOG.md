# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.8.1] - 2026-02-12

### Breaking Changes

**Respite Activities Refactored as Independent Entities (Issue #493)**
- `RespiteSession.activities` array replaced with `activityIds` (string references to entity system)
- Activities are now `respite_activity` entities in the entity system with their own lifecycle
- Old `RespiteActivity` interface deprecated; activities use `BaseEntity` with typed fields
- Old store methods `recordActivity`, `updateActivity`, `completeActivity` replaced with entity-based `createActivity`, `updateActivityStatus`, `updateActivityProgress`, `deleteActivity`
- `RecordActivityInput` deprecated in favor of `CreateRespiteActivityInput`

### Added

**Respite Activity Entity Type (Issue #493)**
- New `respite_activity` built-in entity type with fields: activityType (select), heroId (entity-ref), activityStatus (select), progress (richtext), outcome (richtext)
- `respiteActivityService.ts` - Service layer orchestrating entity CRUD and respite session linking
- Activities are individual entities per hero per activity, enabling reusable templates and independent tracking
- Store exposes `activityEntities`, `pendingActivities`, `inProgressActivities`, `completedActivities` derived values

### Fixed

**AI Setup Banner Dismiss Reactivity (Issue #490)**
- Banner now dismisses immediately without requiring page refresh
- Added reactive `$state` signal pattern (same as backup banner fix from Issue #423)
- 20 new tests verifying dismiss behavior

**Dexie Uncaught Exceptions in Tests (Issue #496)**
- Added defensive database mocks in `loadingStates.test.ts` and `ChatPanel.test.ts`
- Eliminated 27 uncaught Dexie `toArray` exceptions in test suite

**Pre-existing Fixes**
- Fixed `selectedEntity` null check errors in `RelateCommand.svelte` (svelte-check)
- Fixed timezone-dependent test in `timeFormat.test.ts`
- Fixed missing `setActive` mock in ChatPanel conversation switching test

### Changed

**Test Suite Health**
- 258 test files with 12,340 tests passing, 0 failures
- svelte-check: 0 errors
- Production build: clean

## [1.8.0] - 2026-02-12

### Added

**Configurable Player Export Field Visibility (Epic #434)**

*Data Model (#436)*
- `PlayerExportFieldConfig` type with per-category field visibility mappings
- `PlayerExportFieldOverrides` type for per-entity override storage in entity metadata
- `PLAYER_EXPORT_FIELD_OVERRIDES_KEY` constant for metadata key consistency
- Added `playerExportFieldConfig` to `CampaignMetadata` interface

*Core Cascade Logic (#436)*
- `isFieldPlayerVisible()` three-level cascade resolution: per-entity override → per-category default → hardcoded rules
- `applyHardcodedRules()` preserving backward compatibility (notes=hidden, hidden section=hidden, preparation on sessions=hidden)
- 49 tests covering cascade priority, edge cases, and backward compatibility

*Settings UI (#437)*
- `PlayerExportFieldSettings` component with collapsible accordion per entity type
- Per-field checkbox toggles for category-level visibility defaults
- Reset-to-defaults button per entity type
- `playerExportFieldConfigService` with CRUD operations: get/set/remove field visibility, reset entity type config
- 36 tests for config service operations

*Per-Entity Field Toggles (#438)*
- `FieldVisibilityToggle` Svelte 5 component with Eye/EyeOff icons
- Three-state cycling: inherit → include → exclude → inherit
- `entityFieldVisibilityService` helpers: getFieldOverrideState, cycleFieldOverrideState, setFieldOverride, getResolvedFieldVisibility
- 30 tests for override state management

*Export Service Integration (#439)*
- Updated `filterFieldsForPlayer()` with config-aware path using `isFieldPlayerVisible()` cascade
- Updated `filterEntityForPlayer()` and `filterEntitiesForPlayer()` to accept and pass config
- Updated `buildPlayerExport()` and `getPlayerExportPreview()` to extract config from campaign metadata
- 27 new tests added to existing playerExportFilterService test suite (124 total)

*Custom Fields Integration (#440)*
- Verified custom entity types work with visibility cascade out of the box
- Verified additionalFields on built-in types respect visibility configuration
- 22 integration tests confirming end-to-end custom field compatibility

## [1.7.0] - 2026-02-12

### Added

**Respite Activity Tracker - Core Implementation (Issue #408)**
- RespiteSession, RespiteHero, RespiteActivity, KitSwap type definitions following Draw Steel respite mechanics
- respiteRepository with full CRUD, lifecycle management (preparing -> active -> completed), hero management, activity tracking, VP conversion, and kit swap recording
- respiteStore with Svelte 5 runes, live query subscription, and comprehensive derived values
- Database Version 11 with respiteSessions table
- Svelte 5 proxy handling (JSON.parse/JSON.stringify before IndexedDB operations)
- 89 tests covering repository operations, store reactivity, and derived values

**Respite Activity Tracker - UI Components (Issue #409)**
- RespiteSetup: Create/edit respite form with entity-based hero selection (searchable character list) or manual text input, plus recovery tracking
- HeroRecoveryPanel: Recovery tracking per hero with red/yellow/green color coding
- RespiteActivityCard: Activity display with type badge (6 types) and status indicator
- ActivityControls: Add activity form with template quick-select
- KitSwapTracker: Kit swap recording form and history display
- VictoryPointsConverter: VP to XP conversion UI with progress bar
- RespiteRulesReference: Collapsible Draw Steel respite rules panel
- RespiteProgress: Overview dashboard with hero, activity, VP, and kit swap stats
- Routes: /respite (list with grid), /respite/new (create), /respite/[id] (3-column active layout)
- Sidebar navigation with Coffee icon and active respite count badge

**Respite Activity Tracker - Integration (Issue #410)**
- Campaign and character linking (campaignId, characterIds, linkedSessionIds fields)
- getByCampaignId() and getByCharacterId() repository queries
- Narrative event creation from completed respite sessions (createFromRespite)
- RespiteAnalytics component with VP totals, activity distribution, and completion stats
- Store analytics: totalVPConverted, totalActivitiesCompleted, activityTypeDistribution

**Respite Activity Tracker - Quality of Life (Issue #412)**
- 15 predefined activity templates across 5 types (project, crafting, socializing, training, investigation)
- Template quick-select buttons in ActivityControls for rapid activity creation
- getTemplatesByType() and getTemplateTypes() helper functions
- 7 tests covering template configuration and filtering

**Respite Activity Tracker - Documentation (Issue #411)**
- Updated DRAW_STEEL_GAP_ANALYSIS.md marking respite system as implemented
- Comprehensive CHANGELOG entries covering all 5 implementation issues

### Changed

**Test Suite Health**
- 253 test files with 12,225 tests passing
- 65 skipped tests (unchanged)
- 2 pre-existing errors (unchanged, in RelateCommand.svelte)

## [1.6.0] - 2026-02-11

### Added

**Relationship Templates (Issue #146)**
- 16 built-in relationship templates across 4 categories: Social, Professional, Family, Faction
- Category grouping organizes templates by relationship context
- Template fields: type (relationship type), defaultStrength (weak/moderate/strong), isBidirectional, suggestedNotes
- localStorage-based CRUD operations for custom templates with SSR-safe implementation
- RelationshipTemplate type definitions with CreateRelationshipTemplateInput and UpdateRelationshipTemplateInput
- relationshipTemplateService provides getAll, getById, getByCategory, create, update, delete operations
- Built-in templates include: Friend, Enemy, Mentor, Rival (Social), Employer, Employee, Colleague, Business Partner (Professional), Parent, Child, Sibling, Spouse (Family), Leader, Member, Ally, Competitor (Faction)
- 85 comprehensive tests covering template configuration and service operations

**Relationship Timeline View (Issue #145)**
- New relationshipTimelineService for building timeline visualizations from entity relationships
- RelationshipTimelineEvent type captures when and how entities became connected
- buildTimelineEvents() extracts temporal data from entity links and related entities
- filterTimelineEvents() supports filtering by entity, relationship type, strength, date range, and text search
- getAvailableFilterOptions() provides dynamic filter values based on existing data
- Bidirectional relationship deduplication prevents duplicate timeline entries
- Timeline events include: entities involved, relationship type, strength, date, description, tags
- 32 tests covering timeline event building, filtering, and deduplication

**AI: Optimize Relationship Context (Issue #418)**
- Fixed critical composite key overwriting bug where multiple relationships to same entity only showed last relationship
- buildGroupedRelationshipContext() groups relationships by target entity for clearer AI context
- formatGroupedEntityEntry() creates structured summaries with all relationship types listed
- formatGroupedRelationshipContextForPrompt() generates optimized prompt text with grouped relationships
- Privacy-safe summaries now strip duplicate entity names from relationship descriptions
- More efficient context usage: one entity entry lists all relationship types instead of separate entries per type
- Enhanced relationshipContextBuilder with grouping logic and duplicate name cleanup
- 87 comprehensive tests covering grouped context building and privacy-safe formatting

**UI: Allow Multiple Relationships to Same Entity (Issue #417)**
- Removed entity-level link filter allowing multiple relationship types to same target entity
- Link count badges display number of existing relationships per entity in RelateCommand
- Duplicate relationship type validation prevents adding same relationship type twice
- Existing relationships display section shows current links when selecting entity
- Enhanced RelateCommand.svelte with relationship display and validation feedback
- Users can now create "ally_of" and "mentor_of" relationships to same entity
- 85 tests covering multi-relationship UI, validation, and badge display

### Changed

**Test Suite Health**
- 250 test files with 12,129 tests passing
- 65 skipped tests (down from previous milestones)
- 14 pre-existing errors (unchanged)

## [1.5.1] - 2026-02-11

### Added

**Mobile Support - Responsive Shell Layout (Issue #467, Epic #466)**
- Responsive CSS grid layout: single column on mobile, two-column with sidebar at lg (1024px+)
- Sidebar renders as a slide-in overlay drawer on mobile with backdrop
- Sidebar auto-closes on page navigation in mobile mode
- `100vh` replaced with `100dvh` for proper mobile browser address bar handling
- Panel min-width (320px) now only applies on desktop
- New `mobileSidebarOpen` UI store state with toggle/close methods
- Hamburger menu button wired to mobile sidebar drawer

**Narrative Automation (Issues #425, #426)**
- Scene completion now auto-creates narrative trail events
- Negotiation completion now auto-creates narrative trail events

### Changed

**Negotiation Refinements (Issues #403, #404, #405, #406)**
- Fixed outcomePreview in ArgumentControls with inline derived expression
- Updated all motivation types to canonical Draw Steel 13 motivations
- Party-achievement-focused outcome descriptions in NegotiationOutcomeDisplay
- Draw Steel outcome terminology in NegotiationProgress response previews

### Fixed

**Backup & Reactivity (Issue #423)**
- Fixed backup reminder banner dismiss with reactive state signal

**Test Suite Health (Issues #451, #452, #453, #463, #464)**
- Fixed 293 test failures: outdated expectations, missing mock exports, mock hoisting violations
- Removed 331 dead/orphaned skipped tests across the test suite

**Lint Fixes**
- Removed unnecessary regex escape characters failing CI

### Added

**Narrative Trail System (Epic #397, Issues #398-401)**
- New Narrative Event entity type for tracking game moments in chronological sequence
- Automatic narrative event creation when combat encounters and montage challenges complete
- Timeline view UI components (NarrativeTimeline and TimelineEvent) for visualizing story flow
- Session summary service generates human-readable narrative text from event chains
- NarrativeEvent entity with fields: eventType (scene/combat/montage/negotiation/other), sourceId, outcome, session
- Auto-creation triggers: combat sessions on endCombat(), montage sessions on completeMontage()
- Temporal relationship system using leads_to/follows relationships to chain events
- Topological sort algorithm orders events by relationships, falls back to creation time
- Timeline filtering by session for focused session review
- Click-through from timeline events to source combat/montage/scene entities
- Event linking UI for manual story flow adjustment
- Narrative summary generation with contextual transitions and outcome formatting

**Character Identity Fields Aligned with Forge Steel Hero Format (Issue #247)**
- Added 5 new character identity fields to Player Character entity type for better Draw Steel support
- New fields: ancestry (text), culture (text), career (text), heroClass (text), subclass (text)
- Fields appear on character creation, edit, and detail pages
- Draw Steel system profile overrides ancestry and heroClass with select dropdowns containing Draw Steel-specific options
- Forge Steel import now maps hero data to ancestry and heroClass fields
- Backward compatible: existing characters without these fields work normally
- Preserves concept field for backward compatibility while enabling more detailed character information
- Example usage: ancestry="Human", culture="Nomadic", career="Soldier", heroClass="Fury", subclass="Reaver"

## [1.4.5] - 2026-02-10

### Added

**Enhanced Combat Generation (Issues #154, #159)**
- Draw Steel Victory Points mechanic integrated into combat generation
- Tactical grid positioning guidance with terrain mechanics
- New combat typeFields: encounterDifficulty (select), terrainComplexity (select)
- Enhanced combat prompts reference Victory Point objectives and terrain tactics

**Negotiation Generation (Issue #159)**
- New negotiation generation type with Draw Steel mechanics
- Interest/Patience tracking system built into generation prompts
- NPC Motivations and Pitfalls automatically generated
- New negotiation typeFields: startingPosition (select), negotiationStakes (select)
- Generation outputs include motivation appeals and pitfall warnings

**Montage Generation (Issue #159)**
- New montage generation type for multi-round challenges
- Montage difficulty and theme selection
- New montage typeFields: montageDifficulty (select), montageTheme (select)
- Structured montage challenges with clear success/failure conditions

**System-Aware Generation (Issue #156)**
- System-specific generation overrides registry for game system customization
- Draw Steel override merges Victory Points, terrain tactics, and mechanical guidance into base generation configs
- systemGenerationOverrides.ts provides extensible framework for other game systems
- Chat service automatically applies system overrides based on campaign settings
- Enhanced prompts with system-specific terminology and mechanics

**Session Prep Enhancement (Issue #157)**
- Session prep generation references negotiation scenes and montage opportunities
- Victory Point objectives included in combat encounter suggestions
- More comprehensive preparation guidance for modern Draw Steel features

**NPC Ancestry Selection (Issue #158)**
- New ancestry typeField for NPC generation with Draw Steel options
- Seven Draw Steel ancestries: Human, Dwarf, Elf, Hakaan, Memonek, Orc, Time Raider
- Ancestry selection influences NPC characteristics and abilities in generation

**Item Power Level Guidance (Issue #160)**
- Draw Steel override provides Renown-based power level guidance
- Clear distinction between mechanical benefits and narrative flavor
- Power level options: Mundane, Minor (Renown 1), Moderate (Renown 2), Major (Renown 3+)
- Helps AI generate appropriately balanced magic items

**Plot Hook Heroic Tone (Issue #161)**
- Enhanced plot hook generation emphasizes heroic fantasy themes
- Prompts encourage hope, courage, and adventure over grimdark elements
- Aligned with Draw Steel's heroic tone and narrative focus

**@Mentions Feature - Core Mention Detection (Issue #199)**
- Pure utility service for detecting and parsing @mentions in text
- detectMentionTrigger() identifies when @ character triggers autocomplete
- extractMentionTokens() parses mention patterns from text
- matchEntitiesToMentions() matches entity names to mention tokens
- resolvePartialMention() handles partial name matching for autocomplete
- Supports multi-word entity names, Unicode characters, and name particles
- Email filtering prevents false positives (user@example.com not treated as mention)

**@Mentions Feature - ChatMentionPopover Component (Issue #200)**
- Autocomplete dropdown for entity selection during message composition
- Real-time entity filtering based on typed characters
- Keyboard navigation with Arrow keys, Enter to select, Escape to dismiss
- ARIA roles and labels for screen reader accessibility
- Result limit of 10 items for performance
- Visual entity type indicators with color-coded badges

**@Mentions Feature - ChatPanel Integration (Issue #201)**
- @mention detection integrated into chat textarea
- Entity selection and insertion workflow
- contextEntities extraction on message send
- Mentioned entities automatically included in AI generation context
- Seamless integration with existing chat message flow

**@Mentions Feature - Mention Rendering (Issue #202)**
- Visual highlighting of @mentions in chat message display
- Clickable @mention links navigate to referenced entities
- Dark mode support with appropriate contrast
- Entity reference validation (grayed out for deleted entities)

**Entity Regeneration (Issue #308)**
- AI-powered entity regeneration with relationship context awareness
- Field preservation options: keep specific fields unchanged during regeneration
- Diff preview shows proposed changes before applying
- Regenerate entire entity or selected fields only
- Relationship context automatically included for contextually appropriate regeneration
- Safety features prevent accidental data loss

## [1.3.5] - TBD

### Added

**Negotiation Tracker for Draw Steel (Issue #396)**
- New negotiation system implementing Draw Steel mechanics
- Interest and Patience tracking on 0-5 scale with visual progress bars
- NPC motivation management with 14 motivation types (benevolence, discovery, freedom, greed, higher authority, justice, legacy, peace, power, protection, reputation, revelry, vengeance, wealth)
- Pitfall tracking for topics that trigger negative reactions
- Argument recording with three tiers (1, 2, 3) and automatic Interest/Patience calculation
- Three argument types: motivation appeal, no motivation, and pitfall trigger
- Tier-based outcomes: failure (Interest 0-1), minor favor (Interest 2), major favor (Interest 3-4), alliance (Interest 5)
- Negotiation status workflow: preparing → active → completed
- Rules reference panel with Draw Steel negotiation mechanics
- ArgumentCard component displays argument history with tier badges
- NegotiationProgress component shows current Interest/Patience with color-coded bars
- MotivationPitfallPanel for managing known/hidden motivations and pitfalls
- Sidebar integration with active negotiation count badge
- Backup/restore support for negotiation sessions
- NegotiationRepository with full CRUD operations
- Routes: `/negotiation` (list), `/negotiation/new` (create), `/negotiation/[id]` (run)

## [1.3.1] - 2025-02-07

### Fixed

**Scene Runner Fixes (Issue #292)**
- Fixed Scene Runner using wrong field name (`status` → `sceneStatus`)
- Fixed Scene Runner using wrong status value (`active` → `in_progress`)
- Fixed scenes not appearing due to campaign filter
- Added Scene link to sidebar navigation

## [1.3.0] - 2025-02-07

### Added

**Scene Runner Mode (Issue #292)**
- New `/scene` list page with status filtering (all, planned, active, completed)
- Scene runner page (`/scene/[id]`) for running scenes live during sessions
- Read-aloud setting display in styled box for atmospheric scene descriptions
- Location and NPC quick reference panels for context at a glance
- Live "What Happened" notes textarea with auto-save (debounced)
- Scene lifecycle management: planned → active → completed transitions
- Completion modal for finalizing scenes with notes

**Enhanced Scene Entity (Issues #283, #284, #285, #286, #287)**
- Scene type field for categorization: combat, negotiation, exploration, montage, social, investigation
- Scene order field for session timeline organization
- Encounter reference field linking scenes to encounters
- Current round tracking for combat/structured scenes
- Expanded mood options with Draw Steel emotional states: triumphant, desperate, exhilarating
- Draw Steel tone integration for AI-assisted scene generation

**New Draw Steel Entity Templates (Issues #219, #220, #222, #223)**
- Encounter entity template with 7 predefined fields for combat planning
- Treasure/Loot entity template with 6 fields for reward management
- Example values added to all 7 Draw Steel templates for better guidance
- Enhanced Spell/Ritual template with detailed helpText fields

**Entity Duplication (Issue #221)**
- Entity duplication service for quick entity creation from existing templates
- Preserves entity-ref field relationships with smart detection
- Clears time-sensitive fields while keeping structural data

**Field Enhancements (Issues #167, #218)**
- Three new field types: dice, resource, duration
- Field guidance tooltips added across entity types
- HelpText content quality improvements

**Documentation**
- Richtext formatting guidelines (#288)

## [1.2.1] - 2025-02-07

### Added

**Suggestions-Only AI Mode (Issue #362)**
- New AI mode option providing content suggestions without pre-filling fields
- Three AI modes available: Off, Suggestions, and Full Auto
- AI generates bulleted lists of ideas based on entity context and relationships
- Per-field "Suggest" buttons for targeted idea generation
- Bulk "Suggest Content" button generates suggestions for all empty fields at once
- Accept/Dismiss workflow for reviewing and acting on suggestions
- Suggestions appear in a dedicated panel without overwriting existing content
- Contextually aware suggestions leverage entity type, existing fields, and related entities
- Users maintain full control over which suggestions to accept or dismiss

## [1.2.0] - TBD

### Added

**Threat Level Selector for Quick-Add Creatures (Issue #240)**
- Quick-add creature form now includes threat level dropdown
- Options: Standard, Elite, Boss (defaults to Standard)
- Only appears for creatures, not heroes
- Simplifies combat setup with proper threat assignment

**Token Indicator Field for Combatants (Issue #300)**
- Added optional `tokenIndicator` string field to all combatants
- Purple badge displays indicator in CombatantCard
- Available in both quick-add and entity-based combatant creation
- Useful for identifying specific creatures (e.g., "A", "Boss", "Red")
- Persists through all combat operations

**Inline Max HP Editing During Combat (Issue #301)**
- Edit maxHP directly in HpTracker during active combat
- Edit button with pencil icon toggles inline editing
- Keyboard shortcuts: Enter to save, Escape to cancel
- Current HP automatically clamped if maxHP reduced below it
- All changes logged to combat log with metadata
- Eliminates need to remove and re-add combatants when HP changes

**Group Support for Combat Tracker (Issue #263)**
- Group identical combatants to share initiative but track HP individually
- New CombatantGroup type manages groups of creatures
- Members act sequentially using fractional turnOrder values
- Repository methods: createGroup, addToGroup, removeFromGroup, splitFromGroup, dissolveGroup
- Groups auto-dissolve when only 1 member remains
- Simplifies tracking multiple identical creatures in combat

**Creature Template Library (Issue #305)**
- Save and reuse monster stat blocks with new CreatureTemplate type
- New creatureTemplates table in database (v8) for persistent storage
- Full CRUD operations via creatureRepository
- Search by name or tags, filter by threat level, role, or tags
- Import/export entire library as JSON for sharing
- Save ad-hoc combat creatures to library for future use
- Includes abilities, threat levels, and Draw Steel creature roles

### Fixed

**Uncapped Healing for Quick-Add Combatants (Issue #241)**
- Healing now properly capped at starting HP for quick-add combatants
- Added `startingHp` field to track effective maximum when maxHP undefined
- Negative healing values now have no effect (treat as zero)
- Prevents infinite HP growth on creatures added with quick-add form

## [1.1.5] - 2026-02-06

### Added

**ESLint 9 Flat Configuration (Issue #355)**
- Migrated from legacy ESLint configuration to ESLint 9 flat config format
- Modern, streamlined linting setup for improved developer experience
- Maintained all existing TypeScript and Svelte linting rules

**Suggestions Store Stub for TDD (Issue #43)**
- Added placeholder suggestions store structure to support test-driven development workflow
- Foundation for future AI suggestion features
- Enables testing of components that depend on suggestions functionality

### Fixed

**TypeScript Error Resolution (Issues #332, #346-354, PR #332)**
- Resolved 442 TypeScript errors across 53 files that were breaking CI/CD pipeline
- Fixed mock function typing in test files for better type safety
- Resolved Svelte 5 reactivity type narrowing issues in components
- Added proper null checks and type guards throughout the codebase
- Renamed `ImportValidationResult` to `ForgeSteelImportValidationResult` for clarity and consistency
- Improved type safety for entity references and relationship handling
- Fixed type mismatches in computed field evaluation
- Enhanced error handling with proper type annotations
- Comprehensive TypeScript strict mode compliance

**Sub-issues resolved:**
- Issues #333-341: Original TypeScript error fixes
- Issues #346-354: Additional TypeScript error fixes

## [1.1.3] - 2026-02-06

### Added

**Table Map Seating Chart Feature (Issue #318, PR #323)**
- New Table Map feature for visualizing in-person session seating arrangements
- Configure table with 4-10 seats in oval or rectangular shape
- Assign characters to seats with player names displayed from character's playerName field
- Director/DM position indicator with crown icon
- Integrated configuration toolbar directly on table visualization
- Automatic backup/restore with campaign data

**Full Player Character Context in AI Generation (Issue #319, PR #321)**
- AI generation now includes complete player character information when generating content for related entities
- New `playerCharacterContextService` automatically detects relationships to player characters
- When generating fields, summaries, or descriptions for entities linked to PCs, the AI receives the full character context including all custom fields
- Privacy protected: hidden section fields (secrets) are excluded from context
- Works bidirectionally: detects both outgoing and incoming relationships to characters
- Provides richer, more personalized AI-generated content that references specific character details
- Example: generating an NPC who is "mentor to Kira" now includes Kira's full backstory, personality, goals, and custom fields in the generation prompt
- Backward compatible: generation still works for entities without player character relationships

### Fixed

**Svelte 5 Reactivity Warnings in Components (Issue #327, PR #342)**
- Fixed `state_referenced_locally` and `non_reactive_update` warnings in 4 components
- Updated prop synchronization pattern to prevent reactive loops
- Components fixed: MarkdownEditor, CustomEntityTypeForm, EditRelationshipModal, ComputedFieldEditor
- Initialize state with defaults instead of capturing prop values in `$state()` initializers
- Use `$effect()` with `untrack()` to sync props to state without creating reactive loops
- Added comprehensive reactivity test suites for all fixed components (60 total tests)

**Accessibility Warnings (Issue #329)**
- Resolved TypeScript and remaining accessibility warnings across the application
- Fixed 43 accessibility warnings across 19 components
- Updated FieldTemplateFormModal to use proper HTML closing tag for textarea element
- Improved ARIA labels, roles, and keyboard navigation throughout

**CSS Unused Selector Warnings (Issue #328)**
- Suppressed false positive CSS unused selector warnings in MarkdownViewer component
- Added svelte-ignore comments for legitimate dynamic class usage

**AI Field Generation Length Constraints (Issue #313, PR #324)**
- Fixed AI field generation to respect field type length constraints
- Text fields now properly limited to configured maximum lengths
- Prevents validation errors from overly long AI-generated content

**Dark Mode Text Colors in Settings (Issue #322)**
- Added dark mode text colors to CampaignLinkingSettings component
- Improved readability in dark theme

### Documentation

**Special Thanks (Issue #320)**
- Added special thanks to scottTomaszewski and SteelCompendium in documentation
- Acknowledged community contributions to the project

## [1.1.2] - TBD

### Added

**Inline Field Creation on Entity Forms (Issue #311)**
- New "Add Field" button on entity edit and new pages for quick custom field creation
- AddFieldInline component with modal interface for defining fields without navigating to Settings
- Configure field label, type, options (for select types), section, and required status
- Automatically generates field key from label (sanitized, lowercase with underscores)
- Duplicate key detection prevents field conflicts
- Works for both built-in entity types (via setEntityTypeOverride) and custom entity types (via updateCustomEntityType)
- New fields appear at the end of forms with high order number (1000)
- Streamlines workflow: add fields while working on entities without context switching
- Modal includes helpful preview of generated field key

**Inline Field Reordering on Entity Edit Pages (Issue #309)**
- New "Reorder Fields" section on entity edit pages for adjusting field display order without navigating to Settings
- FieldReorderInline component with up/down buttons for moving fields
- Auto-save functionality updates field order immediately
- "Reset Order" button appears when custom field order exists to restore default ordering
- Works for both built-in entity types (via EntityTypeOverride) and custom entity types
- Field order changes apply to all entities of that type (type-level, not per-entity)
- Streamlines workflow: adjust field presentation while working on entities

### Fixed

**Combat and Montage Sessions Backup/Restore (Issue #310)**
- Combat sessions now included in backup exports
- Montage sessions now included in backup exports
- Import function restores combat and montage sessions from backups
- Backward compatible with old backups (backups without sessions still import successfully)
- CampaignBackup type extended with optional combatSessions and montageSessions fields

## [1.1.1] - 2026-01-23

### Added

**Scene Entity Type**
- New "Scene" entity type for tracking moments in the game like "party entering town" or "entering the tavern"
- Scene status tracking: planned, in_progress, completed
- Scene fields:
  - Location: link to location entity where scene takes place
  - NPCs Present: links to NPC entities involved in the scene
  - Scene Setting Text: rich text field for read-aloud descriptions (AI-generatable)
  - What Happened: rich text field for recording events during the scene
  - Pre-Summary: AI summary of scene setup and preparation
  - Post-Summary: AI summary of what occurred during the scene
  - Mood: select from tense, relaxed, mysterious, celebratory, somber, chaotic, peaceful, or ominous
  - Session: link to session entity for organizing scenes by game session
- Scene generation service supports AI-powered content creation for scene fields
- Scene styling integrated with consistent color scheme and card design

**Draw Steel Terminology: HP to Stamina (Issue #280)**
- Updated all user-facing "HP" text to "Stamina" to match Draw Steel terminology
- Affects HpTracker.svelte (renamed to StaminaTracker.svelte), CombatantCard.svelte, AddCombatantModal.svelte
- Documentation updated: README.md, USER_GUIDE.md, COMBAT_SYSTEM.md now use "Stamina" terminology
- Internal field names and types updated: `hp` → `stamina`, `maxHp` → `maxStamina`, `tempHp` → `tempStamina`

**Removed Encounters Entity Type (Issue #281)**
- Removed redundant "Encounters" entity type (11 built-in types, down from 12)
- Combat tracker system supersedes the need for a separate Encounters entity
- Removed from sidebar navigation, entity type configuration, and type definitions
- Generation type in chat renamed from 'encounter' to 'combat' for clarity
- Documentation updated to reflect 11 built-in entity types

### Fixed

**Settings Page Infinite Effect Loop (Issue #302)**
- Fixed critical bug where Settings page triggered Svelte 5 `effect_update_depth_exceeded` error
- Moved initialization logic from `$effect` to `onMount` to prevent dependency tracking loop
- Added guard to system profile sync effect to prevent unnecessary state updates
- This fix also resolved:
  - Navigation stops working after exporting data (Issue #258)
  - Campaign linking checkbox incorrectly disabled (Issue #279)

**Montage Tracker IndexedDB Proxy Issues (Issues #295, #297, #298)**
- Fixed DataCloneError when saving montage data to IndexedDB
- Convert Svelte 5 `$state` proxies to plain objects before database operations
- Use deep clone (JSON.parse/stringify) for IndexedDB data to strip reactive wrappers

**Entity-refs Field Display Bug**
- Fixed `entity-refs` fields (like "NPCs Present") displaying raw entity IDs instead of resolved entity names on view pages
- Control flow in entity view page now correctly checks for entity-refs type before generic array handling

**In-Memory State Refresh for Static Hosting (Issue #252)**
- Replaced all `window.location.reload()` calls with in-memory state refresh
- Created `stateRefreshService.ts` with functions for refreshing application state without full page reload
- Added `reset()` methods to stores that needed clean state capability
- Enables proper functionality when served from static file servers without SPA routing support
- Improves user experience by eliminating jarring full-page reloads during campaign switching
- 45 comprehensive tests ensure reliable state management

## [1.1.0] - 2026-01-21

### Added

**Import from Forge Steel Button on Character List (Issue #249)**
- "Import from Forge Steel" button added to character list page for easier access
- Button appears next to "Add Character" and opens the existing Forge Steel import modal
- Provides convenient character import without navigating to Settings

**Forge Steel Character Import (Issue #238)**
- Import character data from Forge Steel character builder into Director Assist
- ForgeSteelImportModal component accessible from Settings page
- Accepts .json or .ds-hero files exported from Forge Steel
- File validation with detailed error messages and warnings
- Preview imported character before saving
- Automatic field mapping: name, concept (ancestry + class), background (notes), status (defeated state)
- Duplicate name detection to prevent conflicts with existing characters
- Creates character entity with "forge-steel-import" tag for easy filtering
- Real-time validation feedback during file selection
- Accessibility features: ARIA labels, keyboard navigation, backdrop click to close

**Pending Relationship Context in AI Generation (Issue #232)**
- Pending relationships now included when generating content for new entities
- When creating a new entity with relationships, related entities' information is automatically included in AI context
- Enables contextually appropriate content generation that reflects relationships before first save
- New utility function `buildPendingRelationshipsContext()` builds privacy-safe summaries from pending relationships
- Works for both full-entity generation and per-field generation during entity creation
- Related entity summaries use existing privacy protection (hidden/secret fields excluded)

### Changed

**Simplified Combat Tracker (Issue #233)**
- Combat tracker now features quick-add combatants functionality
- Maximum HP is now optional for combatants
- Streamlined interface for faster combat setup and management

**Markdown Editor UX Improvement (Issue #236)**
- Markdown editor now defaults to full-width edit mode instead of split view
- Added Preview/Edit toggle button to toolbar for switching between editing and preview modes
- Provides more editing space while maintaining easy access to markdown preview
- Split view mode still available programmatically for components that need it

### Fixed

**Entity Parser Default Values (Issue #245)**
- Fixed entity parser to properly apply default values for entity fields
- Ensures newly created entities have correct initial field values

## [1.0.0] - 2026-01-21

### Added

**Debug Console for AI Request/Response Inspection (Issue #118)**
- Advanced debug console for inspecting all AI request and response data
- Settings toggle in Advanced section to enable/disable debug console
- Collapsible panel at bottom of chat interface showing up to 50 recent entries
- Request inspection shows user message, system prompt, model, context entities, conversation history, and truncation status
- Response inspection shows full content, token usage (prompt/completion/total), and duration in milliseconds
- Error tracking captures API errors with status codes and detailed messages
- Color-coded entries (blue for requests, green for responses, red for errors)
- Expandable entry details for deep inspection of each AI interaction
- Context analysis shows which entities were included, character counts, and whether context was truncated
- Clear button to remove all entries and free memory
- FIFO queue automatically removes oldest entries when limit reached
- Memory-only storage (entries cleared on page refresh)
- New debug types in `/src/lib/types/debug.ts`
- debugSettingsService for settings persistence in localStorage
- Debug store with Svelte 5 runes for reactive state management
- DebugConsole.svelte component with collapsible UI
- Integration in ChatPanel.svelte and chatService.ts
- Documentation in USER_GUIDE.md covering setup, features, use cases, and troubleshooting

**Forced Campaign Linking Option (Issue #48)**
- New "Enforce Campaign Linking" setting automatically links all new entities to campaigns
- When enabled, creates 'belongs_to_campaign' relationship on entity creation
- Bulk linking modal offers to link existing unlinked entities when first enabled
- Shows entity count and allows campaign selection for bulk operations
- Handles multiple scenarios: single campaign (auto-link), multiple campaigns (select default), no campaigns (disabled)
- Default campaign selector appears when multiple campaigns exist
- Info banner on entity creation forms indicates when auto-linking is active
- CampaignLinkingSettings component provides settings UI with toggle and dropdown
- BulkCampaignLinkingModal component handles bulk linking workflow
- New campaign store methods: setEnforceCampaignLinking(), setDefaultCampaignId()
- New entity repository method: getEntitiesWithoutCampaignLink() for identifying unlinked entities
- Settings stored in campaign metadata: enforceCampaignLinking, defaultCampaignId

**Custom Entity Clone and Template System (Issue #210)**
- Clone utility for duplicating existing entity types as starting points for new custom types
- Field template library for saving and sharing reusable field definition collections
- Export/import service for sharing entity types and field templates as JSON files
- "Clone Existing Type" option in new entity type creation flow
- Field Templates management page at `/settings/field-templates` for creating and managing templates
- "Add from Template" button in field definition editor to apply template fields
- Export button on Custom Entity Types list with optional metadata (author, license, source URL)
- Import flow with validation, conflict detection, and preview before importing
- `cloneEntityType()` function creates deep copies with type reset and "(Copy)" label suffix
- Field template CRUD operations in campaign store: `addFieldTemplate()`, `updateFieldTemplate()`, `deleteFieldTemplate()`, `getFieldTemplate()`
- `fieldTemplates` getter in campaign store for retrieving all templates
- `exportEntityType()` and `exportFieldTemplate()` functions for standardized JSON export
- `validateImport()` function for import validation with version checking and conflict detection
- Export format version 1.0.0 with metadata support
- Import preview system shows name, field count, and potential conflicts
- Deep cloning ensures immutability (modifications to clones don't affect originals)

**Generate Button Context Tooltip (Issue #117)**
- New context summary tooltip on Generate button in chat interface
- Shows what information will be included in AI generation context
- Displays selected generation type, entity count, and context configuration
- Includes relationship context status and estimated token usage
- Helps users understand what data the AI will use before generating
- Improves transparency and control over AI generation

**Sticky/Floating Action Buttons for Entity Forms (Issue #44)**
- Floating action buttons on entity create and edit forms
- Save and Cancel buttons remain visible while scrolling long forms
- Improves UX for forms with many fields or long content
- Positioned at bottom-right corner with fixed positioning
- Responsive design maintains usability on mobile and desktop

### Fixed

**AI Setup Banner Display Logic (Issue #214)**
- Fixed catch-22 where banner never showed for new users
- Banner now correctly appears when AI is enabled but no API key is configured
- Improved logic for detecting first-time setup scenarios
- Users can now properly discover AI features on initial use

**Combat Tracker UI Access (Issue #228)**
- Combat tracker now accessible via sidebar navigation
- Added route integration for `/combat` pages
- Combat system fully integrated with main UI navigation
- Fixed issue where combat features were implemented but unreachable

**Build Failure: EntityContext Property Error (Issue #231)**
- Fixed TypeScript error: "Property 'content' does not exist on type 'EntityContext'"
- Corrected property access in entity context handling
- Build now completes successfully without type errors
- Improved type safety in entity context operations

### Security

**API Key Handling Validation (Issue #27)**
- Comprehensive security audit of API key storage and handling
- Verified API keys stored only in browser localStorage (never transmitted to servers)
- Confirmed API keys never included in backups or exports
- Validated secure communication with AI providers (HTTPS only)
- Documented security best practices in user guide
- No API keys logged or exposed in debug outputs

**Backup API Key Exclusion Verification (Issue #31)**
- Verified backup system excludes API keys from all export formats
- Confirmed localStorage data (including API keys) never included in campaign backups
- Validated JSON, HTML, and Markdown exports contain only campaign data
- Users can safely share backups without exposing sensitive credentials
- Added security notes to backup documentation

**Model Selection Backup Validation (Issue #35)**
- Verified selected AI model included in campaign backups
- Model preferences preserved in backup metadata
- Restore operations correctly apply saved model selections
- Users maintain consistent AI experience across backup/restore cycles
- Model configuration properly persisted in campaign settings

## [0.9.0] - 2026-01-21

### Added

**Player Mode Export System (Issues #52, #53, PR #207)**
- PlayerExportModal component in settings for exporting filtered campaign data
- Multiple export formats: HTML (with embedded styling), JSON (structured data), Markdown (human-readable)
- playerExportFilterService for filtering what content to export (entity types, fields, DM-only content)
- playerExportService orchestrates export process across multiple services
- Format-specific exporters: HtmlExporter, JsonExporter, MarkdownExporter
- DM-only field filtering to protect sensitive campaign information
- Custom field selection for fine-grained control over exported data

**Chat Interface UX Improvements (Issue #203, PR #211)**
- ChatFloatingButton component for minimized chat state with unread message badge
- Collapsible conversation sidebar sections for better space management
- Minimize/maximize toggle for chat panel
- Improved chat panel layout with better use of vertical space
- Conversation sidebar now collapsible to show more chat messages
- Enhanced mobile responsiveness for chat interface

**Custom Entity Creation UX Improvements (Issue #168, Phase 1, PR #212)**
- DrawSteelTipsPanel component provides contextual guidance when creating custom entity types
- Field types grouped into categories: Text & Content, Numeric, Selection, Links & References, Specialized
- "Draw Steel Recommended" badges highlight field types commonly used in Draw Steel campaigns
- Field type descriptions and example use cases for each type
- Relationship types grouped into semantic categories: Character Relationships, Physical Location, Authority & Control, Causality & Events
- Category descriptions help users understand when to use each relationship type
- Collapsible tips sections for field types and examples with real-world use cases
- Improved discoverability for complex features like computed fields and entity references

**Template Selection Flow for Custom Entities (Issue #209, PR #213)**
- EntityTemplateSelector component provides template gallery before custom entity creation
- Five Draw Steel templates available: Monster/Threat, Ability/Power, Condition, Negotiation Outcome, Spell/Ritual
- "Start from Scratch" option for creating blank custom entity types
- Template indicator banner shows which template was used during creation
- "Change Template" button allows switching templates mid-creation
- Confirmation dialog warns when changing templates with unsaved form changes
- Dirty form tracking protects against accidental data loss
- Pre-configured fields based on Draw Steel game mechanics for faster setup

### Fixed

**Entity List Reordering (Issue #205, PR #208)**
- Replaced unreliable drag-drop with up/down button controls for entity reorder in sidebar
- Added id property to entity types for stable reordering
- More reliable and accessible reordering mechanism
- Fixed issues with entity type positions not persisting correctly

## [0.8.0] - 2026-01-20

### Added

**Combat System (Issues #1, #17, PR #194)**
- Complete combat and encounter management system with Draw Steel mechanics
- CombatantCard component for displaying combatant stats, HP, conditions, and actions
- HpTracker component with temporary HP, damage, and healing management
- ConditionManager for tracking Draw Steel conditions (bleeding, dazed, grabbed, prone, slowed, taunted, weakened)
- InitiativeTracker for managing turn order with automatic sorting
- TurnControls for advancing turns, ending rounds, and managing combat flow
- Combat repository with full CRUD operations for combat sessions
- Combat store for reactive state management with Svelte 5 runes
- CombatSession data model with combatants, round tracking, and encounter metadata
- Comprehensive test suite: 1535 repository tests, 934 store tests, 3505 component tests
- Database schema version 6 with combatSessions table
- Documentation: comprehensive COMBAT_SYSTEM.md guide

**Custom Entity Templates (PR #191)**
- Draw Steel entity type templates with pre-configured fields
- EntityTypeTemplateGallery component for browsing and applying templates
- 7 template types: Character, NPC, Location, Item, Faction, Encounter, Session
- Templates include computed fields with Draw Steel formulas (AC calculation, Speed with Stability bonus, etc.)
- ComputedFieldEditor enhancements with example library and validation
- Documentation: computed-fields-draw-steel.md with Draw Steel examples
- Security documentation and mitigation for eval() usage in computed fields
- 699 tests for computed field examples, 878 tests for templates

**AI Integration Setup Prompt (Issue #195, PR #197)**
- Blue-themed AiSetupBanner component appears when AI enabled but no API key configured
- "Get Started" button navigates to settings page for API key configuration
- "Not Now" button permanently dismisses banner
- Banner never shows if AI is explicitly disabled
- aiSetupReminderService manages banner dismissal state in localStorage
- 61 component tests and 68 service tests for comprehensive coverage

**Chat Window Enhancements (Issues #193, PRs #196, #198)**
- Resizable chat window with horizontal and vertical resize support
- Size constraints: width 320-800px, height 200px-90vh
- ResizeObserver for detecting user-driven size changes
- localStorage persistence for width and height preferences
- Graceful handling of invalid saved values with fallback to defaults
- Fixed ConversationSidebar height constraint (max-h-48) to prevent dominating panel space
- Chat messages area now properly expands to use available space
- 42 comprehensive resize tests covering persistence, responsive design, and edge cases

**NPC Generation Enhancements (Issue #155, PR #192)**
- Type-specific fields system for generation types
- Threat Level selector: Any, Minion, Standard, Elite, Boss, Solo
- Combat Role selector: Any, Ambusher, Artillery, Brute, Controller, Defender, Harrier, Hexer, Leader, Mount, Support
- Descriptive tooltips for each threat level and combat role option
- Selected values automatically modify AI prompts for focused NPC generation
- Foundation for adding type-specific fields to other generation types

**GitHub Release Automation (Issue #182, PR #190)**
- GitHub Action workflow for automatically attaching built artifacts to releases
- Builds SvelteKit app on release creation
- Uploads build artifacts as release assets
- Streamlines deployment process for users downloading releases

### Documentation
- Updated ARCHITECTURE.md with combat system components and database schema v6
- Added comprehensive COMBAT_SYSTEM.md documentation
- Added computed-fields-draw-steel.md with Draw Steel-specific examples
- Added security documentation for computed field evaluation

## [0.7.0] - 2026-01-20

### Added
- NPC generation with threat levels and combat roles (Issue #155)
  - Added type-specific fields to generation type system
  - When NPC generation type is selected in chat, two new dropdowns appear
  - Threat Level selector: Any, Minion, Standard, Elite, Boss, Solo
  - Combat Role selector: Any, Ambusher, Artillery, Brute, Controller, Defender, Harrier, Hexer, Leader, Mount, Support
  - Selected values modify AI prompts to generate NPCs matching specified characteristics
  - Each option includes descriptive tooltip explaining its purpose
  - Foundation for adding type-specific fields to other generation types
- Entity parser service for AI chat responses (Issue #40, Phase A1)
  - New `entityParserService.ts` extracts structured entity data from AI-generated text
  - Detects entity types (NPC, Location, Faction, Item, etc.) with confidence scoring
  - Extracts entity names, descriptions, and type-specific fields
  - Splits multi-entity responses into individual sections
  - Generates summaries and extracts tags from text
  - Foundation for future AI chat entity creation features
- Entity parser validation and enhanced type detection (Issue #40, Phase A2)
  - Integrated field-level validation into parsing pipeline with `validateParsedEntity()` function
  - Added `validationErrors` property to `ParsedEntity` interface for tracking validation issues
  - Enhanced type detection with explicit `[TYPE]` marker support (e.g., `[NPC]`, `[Location]`)
  - Added "Entity Type: X" header pattern detection for improved accuracy
  - Field density analysis boosts confidence when multiple type-specific fields are detected
  - Improved `preferredType` fallback logic: overrides only when detection confidence is low (< 0.4)
  - 22 new tests added for validation and enhanced detection (124 total tests)
- Chat UI integration for entity detection and saving (Issue #40, Phase A3)
  - Automatic entity detection in AI assistant responses with confidence indicators
  - SaveEntityButton component for one-click entity saving to database
  - EntityDetectionIndicator displays detected entities with confidence percentages
  - ChatMessage component parses assistant responses and renders entity detection UI
  - Support for multiple entities per message with individual save controls
  - Loading states during save and validation error handling
  - 72 tests covering chat UI entity detection and saving
- AI Entity Generation from Chat with save flow options (Issue #40, Phase A4)
  - Complete AI entity generation feature with instant save and review options
  - ReviewEditButton component provides "Review & Edit" option alongside instant save
  - Navigate from chat to entity creation form with prefilled data from AI response
  - PrefillBanner component shows form was prefilled from chat with link to original message
  - entityPrefillUtils service for URL serialization/deserialization of prefill data
  - Entity creation forms auto-populate name, description, tags, and type-specific fields
  - Dismissible prefill indicator with navigation back to source chat message
  - Two workflows: instant save in chat OR review/edit in form before saving
  - 153 total tests covering complete entity generation pipeline
  - Full integration: AI parsing → detection → save options → form prefill
- AI Suggestions System - Data Model & Repository (Issue #43, Phase B1)
  - New AISuggestion interface with 5 suggestion types: relationship, plot_thread, inconsistency, enhancement, recommendation
  - SuggestionRepository with full CRUD operations for suggestion management
  - Status management: pending, accepted, dismissed with dedicated methods
  - Query operations: filter by type, status, affected entities, and relevance score
  - Bulk operations: add and delete multiple suggestions efficiently
  - Expiration handling: automatic detection and cleanup of stale suggestions
  - Statistics: track suggestion counts by status and type
  - Database schema version 5 with new indexes on type, status, createdAt, expiresAt, and affectedEntityIds
  - 116 comprehensive unit tests covering all repository operations
  - Foundation for future AI-driven campaign analysis and recommendations
- AI Suggestions System - Analysis Engine Service (Issue #43, Phase B2)
  - SuggestionAnalysisService with 4 specialized analyzers for campaign analysis
  - InconsistencyAnalyzer detects location conflicts, status conflicts, name duplicates, and asymmetric relationships
  - EnhancementAnalyzer detects sparse entities, missing summaries, and orphan entities
  - RelationshipAnalyzer detects text mentions, common locations, and AI-powered relationship suggestions
  - PlotThreadAnalyzer uses AI to detect plot threads and group them by theme
  - Configuration options: max suggestions per type, minimum relevance score, AI analysis toggle, rate limiting, expiration days
  - Main methods: runFullAnalysis(), analyzeEntity(), getConfig()
  - Default settings: 10 max suggestions per type, 30 minimum relevance score, AI enabled, 1000ms rate limit, 7 day expiration
  - 143 comprehensive unit tests covering all analyzers and service functionality
  - Ready for UI integration in Phase B3
- AI Suggestions System - Settings & Actions (Issue #43, Phase B4)
  - SuggestionSettingsService manages AI suggestion preferences via localStorage
  - Settings: enableAutoAnalysis, analysisFrequencyHours (default: 24), minRelevanceScore (default: 30), enabledSuggestionTypes, maxSuggestionsPerType (default: 10)
  - Functions: getSettings(), updateSettings(), resetToDefaults()
  - SuggestionActionService executes AI suggestion actions with undo support
  - Four action types: create-relationship, edit-entity, create-entity, flag-for-review
  - Action history tracking with localStorage persistence
  - Functions: executeAction(), getActionHistory(), undoLastAction(), clearActionHistory()
  - SuggestionDetailsModal component for viewing and acting on suggestions
  - Modal features: full suggestion details, type badge, relevance score, affected entities list
  - Action buttons: Execute, Dismiss, Snooze, Close
  - Accessibility: ARIA modal attributes, keyboard support (Escape to close)
  - Foundation for user-facing suggestion management UI in Phase B5

## [0.6.1] - 2026-01-19

### Fixed
- Fixed `state_unsafe_mutation` error on dashboard when sorting entities (Issue #172, PR #173)
  - Creating shallow copy of entities array before sorting to prevent Svelte 5 state mutation

### Documentation
- Added reminder to run `npm install` after pulling updates (Issue #171, PR #174)
- Documented `svelte-dnd-action` dependency in v0.5.0 release notes

## [0.6.0] - 2026-01-19

### Added
- Generation Type Selector in Chat interface (Issue #41, PR #153)
  - Dropdown selector in chat interface for choosing specific content generation types
  - 8 generation types: NPC, Location, Plot Hook, Encounter, Item, Faction, Session Prep, and General
  - Each type includes custom prompt templates and suggested output structures
  - Icon-based selector with descriptive tooltips for each generation type
  - System prompts automatically adapt to selected generation type for focused responses
  - Selection persists within conversation but can be changed anytime
  - Visual indicator shows currently active generation type
  - Accessible on both desktop and mobile interfaces
  - Configuration in `src/lib/config/generationTypes.ts` with prompt templates and structured output suggestions
- Conversation Management System UI Components (Issue #42, PR #163)
  - ConversationListItem component for displaying individual conversations
  - ConversationSidebar component with conversation list and management
  - "New Conversation" button to create conversations
  - Click to switch between conversations (messages reload automatically)
  - Visual highlight for active conversation (blue background and border)
  - Inline rename: double-click conversation name to edit, Enter to save, Escape to cancel
  - Delete conversations with confirmation dialog (trash icon on hover)
  - Metadata display: conversation name, message count badge, relative last activity time
  - Empty state when no conversations exist
  - Auto-create default conversation on first use
  - Integrated into ChatPanel with conversationStore
  - 71 tests covering all conversation UI functionality
  - Full accessibility support (ARIA labels, keyboard navigation)
  - Dark mode styling consistent with app theme
- Markdown editor for rich text fields (Issue #13)
  - New MarkdownEditor component with formatting toolbar (bold, italic, heading, code, link, list)
  - Three editing modes: edit-only, preview-only, and split view
  - Keyboard shortcuts: Ctrl+B for bold, Ctrl+I for italic
  - Real-time markdown preview with HTML sanitization
  - New MarkdownViewer component for rendering markdown as sanitized HTML
  - Integrated into all entity forms (new and edit pages) for richtext fields
  - Markdown rendering on entity view pages for richtext content
  - Dependencies: marked for markdown parsing, DOMPurify for HTML sanitization

## [0.5.0] - 2026-01-19

### Added

**New Dependencies**: `svelte-dnd-action` - Run `npm install` after upgrading to this version.
- Custom entity types with full field customization (Issue #25, PR #169)
  - Create custom entity types with 14 field types: text, number, date, boolean, select, multiselect, currency, percentage, rating, richtext, file, image, entity-ref, entity-refs
  - Computed fields with dynamic formula evaluation and automatic type inference
  - Built-in entity type customization: hide fields, reorder fields, add new fields
  - Comprehensive validation system for entity types and field definitions
  - Dynamic form components (FieldInput, FieldRenderer) for rendering entity-specific forms
  - Drag-and-drop sidebar reordering for custom entity types
  - New routes: `/settings/custom-entities`, `/settings/custom-entities/new`, `/settings/custom-entities/[type]/edit`
  - Built-in entity override management at `/settings/built-in-entities` and `/settings/built-in-entities/[type]/edit`
  - Components: ComputedFieldEditor, DeleteEntityTypeModal, BuiltInTypeOverrideForm
  - Utilities: `fieldTypes.ts` for field metadata and evaluation, `entityTypeValidation.ts` for validation rules
  - Documentation: `docs/api/FIELD_TYPES.md`, `docs/api/ENTITY_TYPE_VALIDATION.md`, `docs/USER_GUIDE.md`
- Smart backup reminder system (Issue #152, PR #162)
  - Non-intrusive amber banner prompts users to export campaign data at appropriate times
  - Three trigger types: first-time (5 entities), milestones (10, 25, 50, 100, 150, 200+), time-based (7+ days)
  - Progressive milestone sequence with increments of 50 after reaching 100 entities
  - 24-hour dismissal window prevents repeated prompts during single sessions
  - Minimum 5 entities required before any reminder appears
  - "Days since last backup" indicator on Settings page with color coding (green/yellow/red)
  - BackupReminderBanner component with contextual messages and action buttons
  - backupReminderService tracks export dates, dismissals, and milestone progress in localStorage
  - Integrated with Settings page export button to automatically update last export timestamp
  - Integrated with root layout to display banner when trigger conditions are met
  - Full accessibility support with ARIA attributes for screen readers
  - Documentation: `docs/features/backup-system.md`
- Relationship creation during entity creation (Issue #124, PR #151)
  - Add relationships while creating entities, before the first save
  - Relationships saved atomically with entity in single transaction
  - Collapsible "Relationships" section on entity create forms
  - PendingRelationshipList component displays pending relationships on create form
  - CreateRelateCommand component provides relationship picker for unsaved entities
  - New `PendingRelationship` type for storing relationship data before entity exists
  - Repository method `createWithLinks()` for atomic entity and relationships creation
  - Store method `createWithRelationships()` wrapper for transaction management
  - Full feature parity with edit page: bidirectional, strength, notes, tags, tension
  - Works for all entity types with proper error handling
- Deployment guide with SPA routing configuration (Issue #132, PR #147)
  - Comprehensive `docs/DEPLOYMENT.md` covering self-hosting and static deployment
  - Server configurations: Apache (.htaccess), Nginx (server block), Caddy (Caddyfile)
  - Rust web server examples: Axum, Rocket, Actix Web, Warp with full working code and Cargo.toml
  - Static hosting services: GitHub Pages (with Actions workflow), Netlify (_redirects and netlify.toml), Vercel, Cloudflare Pages
  - IndexedDB data storage notes (browser-local, no backend needed)
  - HTTPS requirements for browser APIs
  - Browser compatibility notes and troubleshooting section

## [0.3.0] - 2026-01-19

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
