# Respite Activity Tracker - Architecture Overview

## Overview

The Respite Activity Tracker implements Draw Steel's respite mechanics, allowing Directors to manage hero downtime periods of 24+ hours in safe locations. During respites, heroes regain recoveries, convert victory points to XP, swap kits, and undertake downtime activities.

## Architecture

### Data Layer

```
Types (src/lib/types/respite.ts)
  └── RespiteSession, RespiteHero, RespiteActivity, KitSwap
  └── Input types: CreateRespiteInput, UpdateRespiteInput, RecordActivityInput

Repository (src/lib/db/repositories/respiteRepository.ts)
  └── CRUD: create, getById, getAll, update, delete
  └── Lifecycle: startRespite, completeRespite
  └── Heroes: addHero, updateHero, removeHero
  └── Activities: recordActivity, updateActivity, completeActivity
  └── VP: convertVictoryPoints
  └── Kit Swaps: recordKitSwap
  └── Queries: getByCampaignId, getByCharacterId

Store (src/lib/stores/respite.svelte.ts)
  └── Svelte 5 runes ($state, $derived)
  └── Live query subscription via Dexie Observable
  └── Derived: activeRespites, heroCount, vpRemaining, etc.
  └── Analytics: totalVPConverted, activityTypeDistribution

Database (src/lib/db/index.ts)
  └── Version 11: respiteSessions table
  └── Indexes: id, status, createdAt, updatedAt
```

### UI Layer

```
Components (src/lib/components/respite/)
  ├── RespiteSetup.svelte          - Create/edit form
  ├── HeroRecoveryPanel.svelte     - Recovery tracking per hero
  ├── RespiteActivityCard.svelte   - Activity display card
  ├── ActivityControls.svelte      - Activity creation with templates
  ├── KitSwapTracker.svelte        - Kit swap recording
  ├── VictoryPointsConverter.svelte - VP conversion UI
  ├── RespiteRulesReference.svelte - Collapsible rules panel
  ├── RespiteProgress.svelte       - Overview dashboard
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

## Lifecycle

```
preparing → active → completed
```

1. **Preparing**: Director sets up the respite (name, heroes, VP available)
2. **Active**: Heroes rest, activities are tracked, VP converted, kits swapped
3. **Completed**: Summary displayed, narrative event auto-created

## Key Patterns

- **JSON serialization before IndexedDB**: All `db.put()` calls use `JSON.parse(JSON.stringify())` to handle Svelte 5 reactive proxies
- **Repository + Store separation**: Repository handles data persistence, store handles reactive UI state
- **Live queries**: Store subscribes to Dexie `liveQuery` for automatic UI updates
- **Error isolation**: Narrative event creation is wrapped in try/catch to prevent blocking respite completion
- **Duplicate prevention**: Heroes are checked by case-insensitive name before adding
