#!/usr/bin/env bash
#
# Enrich Issues #434 and #435
#
# This script updates the parent issues with detailed specifications,
# creates milestones, creates child issues, and links everything together.
#
# Prerequisites:
#   - gh CLI installed and authenticated (gh auth login)
#   - OR GH_TOKEN environment variable set
#
# Usage:
#   chmod +x scripts/enrich-issues-434-435.sh
#   ./scripts/enrich-issues-434-435.sh
#
set -euo pipefail

REPO="evanmiller2112/director-assist"

echo "=== Enriching Issues #434 and #435 for $REPO ==="
echo ""

# Verify gh auth
if ! gh auth status &>/dev/null; then
  echo "ERROR: Not authenticated with GitHub CLI."
  echo "Run 'gh auth login' or set GH_TOKEN first."
  exit 1
fi

###############################################################################
# STEP 1: Create Milestones
###############################################################################
echo "--- Creating Milestones ---"

# Milestone for #434: Player Export Field Selection
MILESTONE_434=$(gh api repos/$REPO/milestones \
  --method POST \
  -f title="Player Export Field Selection" \
  -f description="Configurable per-field export controls for player exports. Allows directors to choose which fields are included in player exports at both the category (entity type) level and individual entity level. Supports built-in and custom fields." \
  -f state="open" \
  --jq '.number' 2>/dev/null || echo "")

if [ -z "$MILESTONE_434" ]; then
  # Milestone may already exist, try to find it
  MILESTONE_434=$(gh api "repos/$REPO/milestones?state=open&per_page=100" \
    --jq '.[] | select(.title == "Player Export Field Selection") | .number')
fi
echo "Milestone for #434: $MILESTONE_434"

# Milestone for #435: Read-Only Player Version
MILESTONE_435=$(gh api repos/$REPO/milestones \
  --method POST \
  -f title="Read-Only Player Version" \
  -f description="A dedicated read-only player-facing web page that auto-loads exported player data. No AI features, no editing, no DM-only UI elements. Players load a URL and see their campaign data immediately." \
  -f state="open" \
  --jq '.number' 2>/dev/null || echo "")

if [ -z "$MILESTONE_435" ]; then
  MILESTONE_435=$(gh api "repos/$REPO/milestones?state=open&per_page=100" \
    --jq '.[] | select(.title == "Read-Only Player Version") | .number')
fi
echo "Milestone for #435: $MILESTONE_435"

###############################################################################
# STEP 2: Update Parent Issue #434
###############################################################################
echo ""
echo "--- Updating Parent Issue #434 ---"

gh issue edit 434 --repo "$REPO" \
  --title "Player Export Field Selection" \
  --add-label "epic,epic:player-mode,enhancement,type: feature,complexity: high,priority: high" \
  --milestone "Player Export Field Selection" \
  --body "$(cat <<'ISSUE434BODY'
## Summary

Add configurable per-field export controls for the player export system. Directors should be able to choose which fields are included when exporting data for players, at both the **entity type (category) level** and the **individual entity level**. This allows directors to share a curated view of their campaign — for example, sharing only the description of NPCs so players get a sense of who's who without seeing DM secrets.

## Motivation

The current player export system uses a fixed set of rules:
- Entities with `playerVisible === false` are excluded entirely
- Fields with `section: 'hidden'` are always removed
- `notes` field is always removed
- `preparation` field is removed from sessions
- Links with `playerVisible === false` are filtered

This is too coarse-grained. A director may want to export an NPC's name and description but hide their personality, motivation, or other fields that aren't marked as `section: 'hidden'`. The current system provides no way to control which "visible" fields appear in the export on a per-field basis.

## Requirements

### 1. Per-Category (Entity Type) Default Field Export Settings
- In **Settings**, add a section to configure which fields are exported by default for each entity type
- This must work for **all entity types** (built-in and custom)
- Each field in an entity type definition should have an "include in player export" toggle
- Default: current behavior (include all non-hidden fields)
- Fields with `section: 'hidden'` remain always excluded regardless of this setting
- `notes` field remains always excluded regardless of this setting

### 2. Custom Field Support
- Custom fields defined via entity type customization must also appear in the per-category settings
- When new custom fields are added, they should default to "included" (matching current behavior)
- When custom fields are removed, their export settings should be cleaned up

### 3. Per-Entity Field Override Checkboxes
- In the **entity edit view** (director mode), add a checkbox next to each field
- Checkbox indicates whether that field will be included in the player export for *this specific entity*
- Visual states:
  - **Checked** (included) — field will be exported
  - **Unchecked** (excluded) — field will not be exported
  - **Default** (follows category setting) — indicated by a neutral/inherited state
- The checkbox should allow 3 states: inherit from category default, force include, force exclude
- Only visible in director mode (not in the player version from issue #435)

### 4. Integration with Existing Export System
- `playerExportFilterService.ts` must respect the new per-field settings
- Per-entity overrides take precedence over per-category defaults
- Per-category defaults take precedence over the current hardcoded rules (except `notes` and `section: 'hidden'` which remain always excluded)
- The `PlayerExportOptions` type may need to be extended
- Export preview should reflect the new filtering

## Technical Context

### Current Architecture
- **Filter service**: `src/lib/services/playerExportFilterService.ts` — `filterFieldsForPlayer()` uses a hardcoded exclude set
- **Export service**: `src/lib/services/playerExportService.ts` — orchestrates the export pipeline
- **Types**: `src/lib/types/playerExport.ts` — `PlayerExportOptions`, `PlayerEntity`, `PlayerExport`
- **Entity types**: `src/lib/config/entityTypes.ts` — `EntityTypeDefinition`, `FieldDefinition`
- **Settings page**: `src/routes/settings/+page.svelte` — existing settings UI
- **Entity edit**: `src/routes/entities/[id]/edit/+page.svelte`
- **Database**: Dexie.js with `appConfig` table for settings, `entities` table for entity data

### Storage Approach
- Per-category defaults should be stored in `appConfig` (or campaign metadata)
- Per-entity overrides should be stored in the entity's `metadata` field (e.g., `metadata.playerExportFields: Record<string, boolean>`)

### Field Definition Reference
Fields are defined with `FieldDefinition` which includes: `key`, `label`, `type`, `section`, `aiGenerate`, `order`, etc. The `section: 'hidden'` value already marks DM-only fields.

## Success Criteria
- [ ] Settings page has a section to configure per-category field export defaults
- [ ] All entity types (built-in + custom) are configurable
- [ ] Custom fields appear in the settings and are configurable
- [ ] Entity edit view shows per-field export checkboxes (tri-state: inherit/include/exclude)
- [ ] `playerExportFilterService` respects both category defaults and per-entity overrides
- [ ] Export preview accurately reflects new filtering
- [ ] Existing tests continue to pass (backward compatible defaults)
- [ ] New tests cover the new filtering logic

## Child Issues
This epic is broken down into the following child issues:
<!-- CHILD_ISSUES_434 -->
ISSUE434BODY
)"

echo "Parent issue #434 updated."

###############################################################################
# STEP 3: Update Parent Issue #435
###############################################################################
echo ""
echo "--- Updating Parent Issue #435 ---"

gh issue edit 435 --repo "$REPO" \
  --title "Read-Only, AI-Free, Preloaded Player Version" \
  --add-label "epic,epic:player-mode,enhancement,type: feature,complexity: high,priority: high" \
  --milestone "Read-Only Player Version" \
  --body "$(cat <<'ISSUE435BODY'
## Summary

Create a dedicated read-only player-facing web page that automatically loads exported player data from a static JSON file. Players navigate to the URL and immediately see their campaign data — no import step, no AI features, no editing, no DM-only UI elements visible.

## Motivation

Currently, sharing campaign data with players requires:
1. Director exports player data (JSON/HTML/Markdown)
2. Director sends the file to players
3. Players either open the file manually or import it into their own instance

This friction makes it hard to keep players updated. A dedicated player page that auto-loads from a known file location would make sharing seamless: the director exports, places the file, and players always have the latest data at a URL.

## Requirements

### 1. Player-Friendly Page
- Players load a web URL (e.g., `/player`) and immediately see all player-visible campaign data
- No manual import/export step for players
- Clean, read-only browsing experience

### 2. Read-Only Entity Data
- All entity data is displayed but **cannot be edited**
- No edit buttons, no forms, no mutation actions
- Entity detail views show content without director controls

### 3. AI Features Hidden
- All AI-related buttons, indicators, and UI elements are **not visibly present**
- No "Generate" buttons, no AI suggestion indicators, no AI settings
- No chat interface, no AI field generation triggers
- This includes: AI suggestion badges, relationship context indicators, field generation buttons, the entire chat panel

### 4. Static Data Loading
- The player page loads from a statically-placed JSON file at a known location
- **File location**: `/static/player_data.json` in the SvelteKit `static/` directory (served at the web root as `/player_data.json`)
- The file uses the existing `PlayerExport` JSON format (from `playerExportService.ts`)
- The director exports their campaign using the existing player export (JSON format) and places/renames the file to `static/player_data.json`
- On page load, the player page fetches `/player_data.json` and displays the data
- If the file is missing or malformed, show a friendly "No campaign data available" message

### 5. Hidden Empty Fields
- Fields that are not present in the imported data should be **hidden** (not shown as empty)
- This prevents clutter from fields the director excluded from the export
- Integrates naturally with issue #434 (field selection): only exported fields are shown

## Technical Context

### Current Architecture
- **Player export format**: `src/lib/types/playerExport.ts` — `PlayerExport` interface with `version`, `exportedAt`, `campaignName`, `campaignDescription`, `entities[]`
- **Entity display**: `src/routes/entities/[id]/+page.svelte` — current entity detail view (needs read-only variant)
- **Entity list**: `src/routes/entities/+page.svelte` — entity listing page
- **AI components**: Various components in `src/lib/components/` that show AI features
- **Routing**: SvelteKit file-based routing in `src/routes/`
- **Static files**: `static/` directory served at web root

### Proposed Architecture
- New route: `/player` — player landing page (entity list)
- New route: `/player/[id]` — player entity detail view
- New layout: `/player/+layout.svelte` — player-specific layout (no AI, no nav items for DM features)
- Shared components with `readonly` and `hideAI` props where possible
- New store or context: `playerDataStore` — holds the loaded `PlayerExport` data
- The player pages do NOT use Dexie.js — they read from the static JSON file only

### Data Flow
```
Director exports → player_data.json → /static/player_data.json
Player visits /player → fetch('/player_data.json') → render entities
```

## Success Criteria
- [ ] `/player` route exists and loads player data from `/player_data.json`
- [ ] Entity list displays all entities from the export, grouped by type
- [ ] Entity detail view shows entity data in read-only format
- [ ] No AI buttons, indicators, or features are visible anywhere in `/player/*`
- [ ] No edit capabilities exist in the player view
- [ ] Empty/missing fields are hidden (not shown as blank)
- [ ] Friendly error state when `player_data.json` is missing or invalid
- [ ] Campaign name and description displayed prominently
- [ ] Navigation between entity list and entity details works
- [ ] Links between entities are navigable within the player view
- [ ] Player page works independently of Dexie.js database

## Relationship to #434
Issue #434 (Player Export Field Selection) controls **which fields** appear in the export. This issue (#435) controls **how that export is displayed**. Together they provide a complete pipeline: Director selects fields → exports → places file → players see curated content.

## Child Issues
This epic is broken down into the following child issues:
<!-- CHILD_ISSUES_435 -->
ISSUE435BODY
)"

echo "Parent issue #435 updated."

###############################################################################
# STEP 4: Create Child Issues for #434
###############################################################################
echo ""
echo "--- Creating Child Issues for #434 ---"

CHILD_434_URLS=""

# Child 1: Data model for field export settings
CHILD_434_1=$(gh issue create --repo "$REPO" \
  --title "Data model and storage for per-category field export settings" \
  --label "enhancement,type: feature,complexity: medium,epic:player-mode,settings" \
  --milestone "Player Export Field Selection" \
  --body "$(cat <<'EOF'
## Parent Issue
Part of #434 — Player Export Field Selection

## Summary
Design and implement the data model for storing per-category (entity type) field export default settings and per-entity field export overrides.

## Requirements
- Define a `PlayerFieldExportDefaults` type: `Record<EntityType, Record<string /* fieldKey */, boolean>>`
- Store per-category defaults in `appConfig` (key: `playerFieldExportDefaults`)
- Store per-entity overrides in `entity.metadata.playerExportFields: Record<string, boolean>`
- Create a service (`playerFieldExportSettingsService.ts`) with functions:
  - `getFieldExportDefaults(): Record<EntityType, Record<string, boolean>>`
  - `setFieldExportDefaults(entityType: EntityType, fieldKey: string, included: boolean): void`
  - `getEntityFieldOverrides(entity: BaseEntity): Record<string, boolean>`
  - `setEntityFieldOverride(entityId: EntityId, fieldKey: string, value: boolean | null): void` (null = inherit)
  - `resolveFieldVisibility(entityType: EntityType, fieldKey: string, entityOverrides?: Record<string, boolean>): boolean`

## Technical Notes
- `appConfig` table already supports arbitrary key-value storage
- `entity.metadata` is `Record<string, unknown>` — use `metadata.playerExportFields`
- Default for fields not in the settings: `true` (included), matching current behavior
- Fields with `section: 'hidden'` and the `notes` field are always excluded regardless of settings
- Must handle custom entity types and dynamically-added custom fields

## Acceptance Criteria
- [ ] TypeScript types defined for field export settings
- [ ] Service functions implemented with proper Dexie.js operations
- [ ] Unit tests cover: default behavior, setting/getting defaults, per-entity overrides, null (inherit) overrides
- [ ] Proxy-safe serialization (no Svelte 5 `$state` proxies stored in IndexedDB)
EOF
)")
echo "Created child: $CHILD_434_1"
CHILD_434_URLS="$CHILD_434_URLS\n- $CHILD_434_1"

# Child 2: Settings UI for per-category defaults
CHILD_434_2=$(gh issue create --repo "$REPO" \
  --title "Settings UI for per-category field export defaults" \
  --label "enhancement,type: feature,complexity: medium,epic:player-mode,settings,ui" \
  --milestone "Player Export Field Selection" \
  --body "$(cat <<'EOF'
## Parent Issue
Part of #434 — Player Export Field Selection

## Summary
Add a new section to the Settings page where directors can configure which fields are included in player exports for each entity type.

## Requirements
- New collapsible section in Settings: **"Player Export Field Defaults"**
- Lists all entity types (built-in + custom), each expandable to show its fields
- Each field shows: field label, field type, and a toggle (on/off) for export inclusion
- Fields with `section: 'hidden'` shown as "Always excluded" (non-toggleable, greyed out)
- `notes` field shown as "Always excluded" (non-toggleable)
- "Reset to defaults" button per entity type (resets all fields to included)
- Changes auto-save via the settings service from the data model child issue

## UI Design
```
Player Export Field Defaults
├── Character ▼
│   ├── [✓] Player Name
│   ├── [✓] Concept
│   ├── [✓] Ancestry
│   ├── [ ] Personality      ← director unchecked this
│   ├── [ ] Goals
│   ├── [—] Secrets          ← always excluded (section: 'hidden')
│   └── [—] Notes            ← always excluded
├── NPC ▶ (collapsed)
├── Location ▶
└── (custom types) ▶
```

## Technical Notes
- Use `getAllEntityTypes()` from `entityTypes.ts` to get all type definitions
- Wire up to the service from "Data model and storage" child issue
- Custom entity types should appear dynamically
- Component: `src/lib/components/settings/PlayerExportFieldDefaults.svelte`
- Consider using the existing `SystemSelector` pattern for collapsible sections

## Acceptance Criteria
- [ ] Settings section displays all entity types with their fields
- [ ] Toggles correctly save/load per-category defaults
- [ ] `section: 'hidden'` fields shown as always excluded
- [ ] Custom entity types appear in the list
- [ ] Reset to defaults works
- [ ] Responsive layout
EOF
)")
echo "Created child: $CHILD_434_2"
CHILD_434_URLS="$CHILD_434_URLS\n- $CHILD_434_2"

# Child 3: Per-entity field export checkboxes in edit view
CHILD_434_3=$(gh issue create --repo "$REPO" \
  --title "Per-entity field export checkboxes in entity edit view" \
  --label "enhancement,type: feature,complexity: medium,epic:player-mode,ui" \
  --milestone "Player Export Field Selection" \
  --body "$(cat <<'EOF'
## Parent Issue
Part of #434 — Player Export Field Selection

## Summary
Add a tri-state checkbox next to each field in the entity edit view that controls whether that field is included in the player export for this specific entity.

## Requirements
- In the entity edit view, each field row gets a small export-visibility indicator/checkbox
- **Tri-state behavior**:
  - **Inherit** (default) — follows the per-category setting from Settings. Visual: dash or neutral icon
  - **Force include** — always export this field for this entity. Visual: checked/eye icon
  - **Force exclude** — never export this field for this entity. Visual: unchecked/eye-off icon
- Clicking cycles: inherit → include → exclude → inherit
- Tooltip explains current state (e.g., "Following category default (included)" or "Excluded for this entity")
- Fields with `section: 'hidden'` always show as excluded (non-interactive)
- Saves to `entity.metadata.playerExportFields` via the data model service

## UI Design
- Small icon button to the right of each field label
- Use Lucide icons: `Eye` (include), `EyeOff` (exclude), `Minus` or similar (inherit)
- Subtle styling — should not dominate the edit form
- Only visible in director mode (not in the player view from #435)

## Technical Notes
- Component: new `FieldExportToggle.svelte` component
- Integrate into the field rendering in entity edit forms
- Wire to `setEntityFieldOverride()` from the data model service
- The current edit view is at `src/routes/entities/[id]/edit/+page.svelte`
- Must handle dynamic field lists (custom fields)

## Acceptance Criteria
- [ ] Tri-state checkbox appears next to each field in edit view
- [ ] Cycling through states works correctly
- [ ] State persists to entity metadata
- [ ] Tooltip shows current effective state
- [ ] Hidden-section fields are non-interactive
- [ ] Visual design is unobtrusive
EOF
)")
echo "Created child: $CHILD_434_3"
CHILD_434_URLS="$CHILD_434_URLS\n- $CHILD_434_3"

# Child 4: Update export filter service to respect new settings
CHILD_434_4=$(gh issue create --repo "$REPO" \
  --title "Update playerExportFilterService to respect field export settings" \
  --label "enhancement,type: feature,complexity: medium,epic:player-mode" \
  --milestone "Player Export Field Selection" \
  --body "$(cat <<'EOF'
## Parent Issue
Part of #434 — Player Export Field Selection

## Summary
Update `playerExportFilterService.ts` to use the new per-category and per-entity field export settings when filtering fields for player export.

## Requirements
- `filterFieldsForPlayer()` must now:
  1. Always exclude `notes` and `section: 'hidden'` fields (unchanged)
  2. Check per-entity overrides (`entity.metadata.playerExportFields`) — if a field has an explicit override, use it
  3. If no per-entity override, check per-category defaults from `appConfig`
  4. If no per-category default, include the field (backward-compatible default)
- Update `playerExportService.ts` to load field export defaults and pass them through the pipeline
- Update `buildPlayerExport()` to load settings from `appConfig`
- The export preview (`getPlayerExportPreview()`) must also reflect the new filtering

## Priority Order
```
1. section: 'hidden' / notes → ALWAYS excluded (hardcoded)
2. entity.metadata.playerExportFields[fieldKey] → per-entity override
3. appConfig.playerFieldExportDefaults[entityType][fieldKey] → category default
4. true → backward-compatible default (include)
```

## Technical Notes
- `filterFieldsForPlayer()` currently takes `(fields, hiddenKeys, isSession)` — signature will need to expand
- Consider a new parameter: `exportSettings: { categoryDefaults: Record<string, boolean>, entityOverrides: Record<string, boolean> }`
- Must not break existing tests — default behavior (no settings configured) must match current behavior exactly
- The `filterEntityForPlayer()` function orchestrates field filtering and will need to pass through the new settings

## Acceptance Criteria
- [ ] Export respects per-entity overrides
- [ ] Export respects per-category defaults
- [ ] Priority order is correct (entity override > category default > include)
- [ ] `notes` and `section: 'hidden'` always excluded regardless of settings
- [ ] Export preview accurately reflects new filtering
- [ ] All existing tests pass without modification
- [ ] New tests cover: entity override, category default, mixed scenarios, backward compatibility
EOF
)")
echo "Created child: $CHILD_434_4"
CHILD_434_URLS="$CHILD_434_URLS\n- $CHILD_434_4"

###############################################################################
# STEP 5: Create Child Issues for #435
###############################################################################
echo ""
echo "--- Creating Child Issues for #435 ---"

CHILD_435_URLS=""

# Child 1: Player data store and static JSON loading
CHILD_435_1=$(gh issue create --repo "$REPO" \
  --title "Player data store and static JSON file loading" \
  --label "enhancement,type: feature,complexity: medium,epic:player-mode" \
  --milestone "Read-Only Player Version" \
  --body "$(cat <<'EOF'
## Parent Issue
Part of #435 — Read-Only, AI-Free, Preloaded Player Version

## Summary
Create a Svelte store that loads and holds player export data from a static JSON file (`/player_data.json`), independent of Dexie.js.

## Requirements
- New store: `src/lib/stores/playerData.svelte.ts`
- On initialization, fetches `/player_data.json` via `fetch()`
- Parses the JSON as `PlayerExport` type
- Provides reactive state:
  - `entities: PlayerEntity[]` — all entities from the export
  - `campaignName: string`
  - `campaignDescription: string`
  - `exportedAt: Date`
  - `isLoading: boolean`
  - `error: string | null`
  - `getEntity(id: string): PlayerEntity | null`
  - `getEntitiesByType(type: string): PlayerEntity[]`
  - `getEntityTypes(): string[]` — unique types present in the data
- Validates the JSON structure (version field, entities array)
- Handles errors gracefully:
  - 404: "No campaign data available yet"
  - Invalid JSON: "Campaign data is corrupted"
  - Missing version: "Incompatible data format"

## Technical Notes
- Do NOT import or use Dexie.js in this store
- Use Svelte 5 runes (`$state`, `$derived`)
- The `PlayerExport` type is already defined in `src/lib/types/playerExport.ts`
- Date fields in JSON will be strings — handle deserialization
- Consider caching to avoid re-fetching on navigation within the player section

## Acceptance Criteria
- [ ] Store loads `/player_data.json` on initialization
- [ ] Reactive state updates correctly
- [ ] Error states handled with user-friendly messages
- [ ] No Dexie.js dependency
- [ ] Unit tests cover: successful load, 404, invalid JSON, missing fields
EOF
)")
echo "Created child: $CHILD_435_1"
CHILD_435_URLS="$CHILD_435_URLS\n- $CHILD_435_1"

# Child 2: Player layout and route structure
CHILD_435_2=$(gh issue create --repo "$REPO" \
  --title "Player layout and route structure (/player)" \
  --label "enhancement,type: feature,complexity: medium,epic:player-mode,ui" \
  --milestone "Read-Only Player Version" \
  --body "$(cat <<'EOF'
## Parent Issue
Part of #435 — Read-Only, AI-Free, Preloaded Player Version

## Summary
Create the SvelteKit route structure and layout for the player-facing pages, ensuring no DM features, AI elements, or editing capabilities are present.

## Requirements
- New routes:
  - `/player` — player landing page / entity list
  - `/player/[id]` — player entity detail view
- New layout: `src/routes/player/+layout.svelte`
  - Clean, player-focused navigation (no DM sidebar items)
  - Campaign name displayed in header
  - No links to Settings, Combat, Montage, Negotiation, or other DM features
  - No AI chat panel
  - Simple navigation: entity list, back buttons, entity type filters
- The layout should initialize the `playerDataStore` on mount
- Show loading state while data is being fetched
- Show error state if data fails to load

## Technical Notes
- SvelteKit file-based routing: create `src/routes/player/+layout.svelte`, `+page.svelte`, `[id]/+page.svelte`
- The player layout should NOT use the main app layout (which includes DM navigation, AI panel, etc.)
- Consider using `+layout.ts` with `export const ssr = false` since this is a client-only feature
- Reuse Tailwind CSS utility classes for consistent styling
- Use Lucide icons where appropriate (but not AI-related ones)

## Acceptance Criteria
- [ ] `/player` route renders the player layout
- [ ] `/player/[id]` route renders entity detail in player layout
- [ ] No DM-specific navigation items visible
- [ ] No AI-related UI elements in the layout
- [ ] Campaign name displayed in header
- [ ] Loading and error states work
- [ ] Navigation between list and detail works
EOF
)")
echo "Created child: $CHILD_435_2"
CHILD_435_URLS="$CHILD_435_URLS\n- $CHILD_435_2"

# Child 3: Player entity list page
CHILD_435_3=$(gh issue create --repo "$REPO" \
  --title "Player entity list page" \
  --label "enhancement,type: feature,complexity: medium,epic:player-mode,ui" \
  --milestone "Read-Only Player Version" \
  --body "$(cat <<'EOF'
## Parent Issue
Part of #435 — Read-Only, AI-Free, Preloaded Player Version

## Summary
Implement the player entity list page at `/player` that displays all entities from the loaded player data, grouped by type, with filtering and search.

## Requirements
- Display all entities from `playerDataStore`, grouped by entity type
- Each entity type section shows:
  - Type name as a header (e.g., "Characters", "NPCs", "Locations")
  - Entity cards with: name, description preview (truncated), tags, image thumbnail (if present)
- Entity cards link to `/player/[id]` for detail view
- Filter by entity type (tabs or dropdown)
- Search by name
- Empty state: "No campaign data available" with instructions
- Entity count per type visible

## UI Design
- Card-based grid layout (responsive: 1 column mobile, 2-3 columns desktop)
- Entity type sections collapsible
- Clean typography, no DM-specific visual elements
- No "New Entity" buttons, no bulk actions, no import/export buttons

## Technical Notes
- Read from `playerDataStore.entities` and `playerDataStore.getEntitiesByType()`
- Use `playerDataStore.getEntityTypes()` for type filter options
- Reuse existing card styling patterns where possible
- Component: `src/routes/player/+page.svelte`
- Consider extracting a `PlayerEntityCard.svelte` component

## Acceptance Criteria
- [ ] All entities displayed, grouped by type
- [ ] Type filtering works
- [ ] Name search works
- [ ] Entity cards link to detail view
- [ ] No edit/create/delete buttons present
- [ ] Responsive layout
- [ ] Empty state renders correctly
EOF
)")
echo "Created child: $CHILD_435_3"
CHILD_435_URLS="$CHILD_435_URLS\n- $CHILD_435_3"

# Child 4: Player entity detail page
CHILD_435_4=$(gh issue create --repo "$REPO" \
  --title "Player entity detail page (read-only)" \
  --label "enhancement,type: feature,complexity: medium,epic:player-mode,ui" \
  --milestone "Read-Only Player Version" \
  --body "$(cat <<'EOF'
## Parent Issue
Part of #435 — Read-Only, AI-Free, Preloaded Player Version

## Summary
Implement the player entity detail page at `/player/[id]` that displays a single entity's data in a read-only format, with empty fields hidden.

## Requirements
- Display entity data from `playerDataStore.getEntity(id)`
- Show: name, description (rendered markdown), image, tags
- Show all fields present in the export data, using appropriate display formatting:
  - Text/textarea/richtext: rendered content
  - Number: formatted number
  - Boolean: yes/no or checkmark
  - Select/multi-select: displayed values
  - Tags: tag chips
  - Entity references: clickable links to `/player/[refId]` (if the referenced entity exists in the export)
  - Resource: current/max display (e.g., "15/20")
  - Duration: value + unit display
  - Date: formatted date
  - URL: clickable link
  - Dice: dice notation display
- **Empty/missing fields are hidden** — do not show blank rows for fields not in the export
- Show entity links/relationships as a section at the bottom, with clickable links to related entities in the player view
- Back button to return to entity list
- 404 state if entity ID not found in the export

## Technical Notes
- Component: `src/routes/player/[id]/+page.svelte`
- Consider extracting `PlayerFieldDisplay.svelte` for read-only field rendering
- Reuse field type rendering logic where possible, but strip all edit capabilities
- Markdown rendering: use existing markdown rendering component in read-only mode
- Entity reference links should only point to entities that exist in the player data (check `playerDataStore.getEntity()`)
- Links to entities not in the export should show the entity name without a clickable link

## Acceptance Criteria
- [ ] Entity name, description, image, tags displayed
- [ ] All field types render correctly in read-only mode
- [ ] Empty/missing fields are hidden
- [ ] Entity links are navigable within the player view
- [ ] Back navigation works
- [ ] 404 state for missing entities
- [ ] No edit buttons, AI buttons, or DM controls
- [ ] Markdown content rendered properly
EOF
)")
echo "Created child: $CHILD_435_4"
CHILD_435_URLS="$CHILD_435_URLS\n- $CHILD_435_4"

# Child 5: Hide AI features in player mode
CHILD_435_5=$(gh issue create --repo "$REPO" \
  --title "Ensure all AI features are hidden in player routes" \
  --label "enhancement,type: feature,complexity: low,epic:player-mode,ui" \
  --milestone "Read-Only Player Version" \
  --body "$(cat <<'EOF'
## Parent Issue
Part of #435 — Read-Only, AI-Free, Preloaded Player Version

## Summary
Audit and verify that no AI-related features, buttons, or indicators are visible anywhere in the `/player/*` routes.

## Requirements
- No AI suggestion badges or indicators
- No "Generate with AI" buttons on any fields
- No AI chat panel or chat button
- No relationship context indicators
- No AI settings or configuration references
- No field generation triggers
- No suggestion acceptance/dismissal UI
- No AI-powered entity generation buttons

## Technical Notes
Since the player routes (`/player/*`) use a completely separate layout and components from the main app, AI features should be absent by design (they simply aren't imported). This issue is primarily an **audit and verification** task to ensure nothing slips through.

### AI Components to Verify Are Absent
- Chat panel and toggle button
- AI suggestion badges on entities
- Field-level AI generation buttons (`aiGenerate` indicators)
- Relationship context summary indicators
- Entity generation buttons ("Generate NPC", etc.)
- Any imports from `$lib/ai/` in player components

## Acceptance Criteria
- [ ] Manual audit confirms no AI UI elements in `/player/*`
- [ ] No imports from `$lib/ai/` in player route files
- [ ] No AI-related store subscriptions in player components
- [ ] Test or screenshot evidence of clean player UI
EOF
)")
echo "Created child: $CHILD_435_5"
CHILD_435_URLS="$CHILD_435_URLS\n- $CHILD_435_5"

###############################################################################
# STEP 6: Link Child Issues to Parent Issues
###############################################################################
echo ""
echo "--- Linking child issues to parents ---"

# Extract issue numbers from URLs
get_issue_number() {
  echo "$1" | grep -oP '\d+$'
}

# Link #434 children
for url in $(echo -e "$CHILD_434_URLS" | sed 's/^- //'); do
  num=$(get_issue_number "$url")
  if [ -n "$num" ]; then
    gh issue edit "$num" --repo "$REPO" --body "$(gh issue view "$num" --repo "$REPO" --json body --jq '.body')

---
**Parent:** #434" 2>/dev/null || true
    # Add as sub-issue if supported
    gh api "repos/$REPO/issues/434/sub_issues" --method POST -f sub_issue_id="$(gh api "repos/$REPO/issues/$num" --jq '.id')" 2>/dev/null || true
  fi
done

# Link #435 children
for url in $(echo -e "$CHILD_435_URLS" | sed 's/^- //'); do
  num=$(get_issue_number "$url")
  if [ -n "$num" ]; then
    gh issue edit "$num" --repo "$REPO" --body "$(gh issue view "$num" --repo "$REPO" --json body --jq '.body')

---
**Parent:** #435" 2>/dev/null || true
    gh api "repos/$REPO/issues/435/sub_issues" --method POST -f sub_issue_id="$(gh api "repos/$REPO/issues/$num" --jq '.id')" 2>/dev/null || true
  fi
done

###############################################################################
# STEP 7: Update parent issues with child issue links
###############################################################################
echo ""
echo "--- Updating parent issues with child issue links ---"

# Build child issue lists
CHILD_LIST_434=""
for url in $(echo -e "$CHILD_434_URLS" | sed 's/^- //'); do
  num=$(get_issue_number "$url")
  title=$(gh issue view "$num" --repo "$REPO" --json title --jq '.title' 2>/dev/null || echo "Issue #$num")
  CHILD_LIST_434="$CHILD_LIST_434
- [ ] #$num — $title"
done

CHILD_LIST_435=""
for url in $(echo -e "$CHILD_435_URLS" | sed 's/^- //'); do
  num=$(get_issue_number "$url")
  title=$(gh issue view "$num" --repo "$REPO" --json title --jq '.title' 2>/dev/null || echo "Issue #$num")
  CHILD_LIST_435="$CHILD_LIST_435
- [ ] #$num — $title"
done

# Update #434 body to include child issue links
BODY_434=$(gh issue view 434 --repo "$REPO" --json body --jq '.body')
UPDATED_434=$(echo "$BODY_434" | sed "s|<!-- CHILD_ISSUES_434 -->|$CHILD_LIST_434|")
gh issue edit 434 --repo "$REPO" --body "$UPDATED_434"

# Update #435 body to include child issue links
BODY_435=$(gh issue view 435 --repo "$REPO" --json body --jq '.body')
UPDATED_435=$(echo "$BODY_435" | sed "s|<!-- CHILD_ISSUES_435 -->|$CHILD_LIST_435|")
gh issue edit 435 --repo "$REPO" --body "$UPDATED_435"

###############################################################################
# Done
###############################################################################
echo ""
echo "=== Done! ==="
echo ""
echo "Parent Issues (enriched):"
echo "  #434 — Player Export Field Selection"
echo "  #435 — Read-Only, AI-Free, Preloaded Player Version"
echo ""
echo "Child Issues for #434:"
echo -e "$CHILD_434_URLS"
echo ""
echo "Child Issues for #435:"
echo -e "$CHILD_435_URLS"
echo ""
echo "Milestones created:"
echo "  - Player Export Field Selection (milestone #$MILESTONE_434)"
echo "  - Read-Only Player Version (milestone #$MILESTONE_435)"
