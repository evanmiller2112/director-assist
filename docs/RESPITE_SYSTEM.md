# Respite Activity Tracker - Architecture Overview

## Overview

The Respite Activity Tracker implements Draw Steel's respite mechanics, allowing Directors to manage hero downtime periods of 24+ hours in safe locations. During respites, heroes regain recoveries, convert victory points to XP, swap kits, and undertake downtime activities.

## Architecture

### Data Layer

```
Types (src/lib/types/respite.ts)
  └── RespiteSession, RespiteHero, KitSwap
  └── Input types: CreateRespiteInput, UpdateRespiteInput, CreateRespiteActivityInput
  └── RespiteSession.activityIds references respite_activity entities

Entity Type (src/lib/config/entityTypes.ts)
  └── respite_activity: built-in entity type
  └── Fields: activityType (select), heroId (entity-ref), activityStatus (select),
              progress (richtext), outcome (richtext)

Repository (src/lib/db/repositories/respiteRepository.ts)
  └── CRUD: create, getById, getAll, update, delete
  └── Lifecycle: startRespite, completeRespite
  └── Heroes: addHero, updateHero, removeHero
  └── Activity Links: addActivityId, removeActivityId
  └── VP: convertVictoryPoints
  └── Kit Swaps: recordKitSwap
  └── Queries: getByCampaignId, getByCharacterId

Service (src/lib/services/respiteActivityService.ts)
  └── createRespiteActivity: creates entity + links to respite
  └── deleteRespiteActivity: removes entity + unlinks from respite
  └── getActivitiesForRespite: loads entities by IDs
  └── updateActivityStatus, updateActivityProgress
  └── completeRespiteWithNarrative: completes respite + creates narrative event

Store (src/lib/stores/respite.svelte.ts)
  └── Svelte 5 runes ($state, $derived)
  └── Live query subscription via Dexie Observable
  └── activityEntities state loaded from entity system
  └── Derived: activeRespites, heroCount, vpRemaining, pendingActivities, etc.
  └── Analytics: totalVPConverted, totalActivitiesCompleted

Database (src/lib/db/index.ts)
  └── Version 11: respiteSessions table
  └── Indexes: id, status, createdAt, updatedAt
  └── Activities stored in entities table (type: respite_activity)
```

### UI Layer

```
Components (src/lib/components/respite/)
  ├── RespiteSetup.svelte          - Create/edit form with entity-based hero selection
  ├── HeroRecoveryPanel.svelte     - Recovery tracking per hero
  ├── RespiteActivityCard.svelte   - Activity display card (accepts BaseEntity)
  ├── ActivityControls.svelte      - Activity creation with templates
  ├── KitSwapTracker.svelte        - Kit swap recording
  ├── VictoryPointsConverter.svelte - VP conversion UI
  ├── RespiteRulesReference.svelte - Collapsible rules panel
  ├── RespiteProgress.svelte       - Overview dashboard (accepts activityEntities)
  ├── RespiteAnalytics.svelte      - Cross-session analytics
  └── index.ts                     - Barrel exports

Routes (src/routes/respite/)
  ├── +page.svelte                 - List view (grid)
  ├── new/+page.svelte             - Create form
  └── [id]/+page.svelte            - Detail view (3-column active)
```

### Integration Layer

```
Narrative Events (src/lib/services/narrativeEventService.ts)
  └── createFromRespite() - Auto-creates narrative event on completion

Sidebar (src/lib/components/layout/Sidebar.svelte)
  └── /respite nav link with Coffee icon
  └── Active respite count badge

Activity Templates (src/lib/config/respiteTemplates.ts)
  └── 15 predefined templates across 5 activity types
  └── Quick-select in ActivityControls
```

## Activity Entity Model

Activities are independent entities in the entity system (type: `respite_activity`). This enables:

- **Reusable templates**: Activity definitions can be templated and instantiated
- **Per-hero tracking**: Each hero's activity is a separate entity with its own state
- **Independent lifecycle**: Activities have their own status (pending → in_progress → completed)
- **Entity system integration**: Activities can have relationships, descriptions, and all standard entity features
- **Cross-respite visibility**: Activities are visible in the entity list and searchable

### Activity Fields

| Field | Type | Description |
|-------|------|-------------|
| activityType | select | project, crafting, socializing, training, investigation, other |
| heroId | entity-ref | Reference to the character entity performing the activity |
| activityStatus | select | pending, in_progress, completed (default: pending) |
| progress | richtext | Ongoing progress notes |
| outcome | richtext | Result when the activity is completed |

### Linking

- `RespiteSession.activityIds` stores references to activity entity IDs
- `respiteActivityService` manages creating entities and linking them to respites
- When a respite is selected, the store loads activity entities from the entity system

## Lifecycle

```
preparing → active → completed
```

1. **Preparing**: Director sets up the respite (name, heroes, VP available)
2. **Active**: Heroes rest, activities are tracked as entities, VP converted, kits swapped
3. **Completed**: Summary displayed, narrative event auto-created

## Key Patterns

- **Entity-based activities**: Activities are `respite_activity` entities, not embedded arrays
- **Service layer orchestration**: `respiteActivityService` bridges entity system and respite repository
- **JSON serialization before IndexedDB**: All `db.put()` calls use `JSON.parse(JSON.stringify())` to handle Svelte 5 reactive proxies
- **Repository + Service + Store separation**: Repository handles respite persistence, service handles activity entity orchestration, store handles reactive UI state
- **Live queries**: Store subscribes to Dexie `liveQuery` for automatic UI updates
- **Error isolation**: Narrative event creation is wrapped in try/catch to prevent blocking respite completion
- **Duplicate prevention**: Heroes are checked by case-insensitive name before adding
