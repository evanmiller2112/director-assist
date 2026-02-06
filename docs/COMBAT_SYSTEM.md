# Combat System Documentation

Developer documentation for the Draw Steel combat tracking system.

## Overview

The combat system provides comprehensive combat tracking for Draw Steel RPG campaigns, implementing the game's unique mechanics including 2d10 initiative, threat levels, hero points, victory points, and condition tracking.

**Implementation:** Track A (Issues #1 and #17)
- A1: Combat Foundation (types, database, store)
- A2: Combat UI (components for initiative, Stamina, conditions, turn management)

## Architecture

The combat system follows Director Assist's standard three-layer architecture:

```
┌─────────────────────────────────────────────────────────┐
│                     UI Layer                             │
│  Combat Components (Initiative, Stamina, Conditions, Turns)   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   State Layer                            │
│         combatStore (Svelte 5 Runes)                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│         combatRepository (Dexie/IndexedDB)               │
└─────────────────────────────────────────────────────────┘
```

### Key Files

**Type System:**
- `/src/lib/types/combat.ts` - Complete TypeScript type definitions

**Data Layer:**
- `/src/lib/db/index.ts` - Database schema (combatSessions table, version 5)
- `/src/lib/db/repositories/combatRepository.ts` - CRUD and game mechanics

**State Layer:**
- `/src/lib/stores/combat.svelte.ts` - Reactive Svelte 5 store

**UI Components:**
- `/src/lib/components/combat/InitiativeTracker.svelte` - Turn order display
- `/src/lib/components/combat/CombatantCard.svelte` - Individual combatant card
- `/src/lib/components/combat/TurnControls.svelte` - Turn navigation
- `/src/lib/components/combat/StaminaTracker.svelte` - Stamina management
- `/src/lib/components/combat/ConditionManager.svelte` - Condition management
- `/src/lib/components/combat/ConditionBadge.svelte` - Condition display
- `/src/lib/components/combat/index.ts` - Barrel exports

## Type System

### Core Types

The combat type system is defined in `/src/lib/types/combat.ts`.

#### CombatSession

The main combat session object containing all combat state:

```typescript
interface CombatSession {
  id: string;
  name: string;
  description?: string;
  status: CombatStatus;           // 'preparing' | 'active' | 'paused' | 'completed'
  currentRound: number;
  currentTurn: number;             // Index into combatants array
  combatants: Combatant[];
  victoryPoints: number;           // Draw Steel objective tracking
  heroPoints: number;              // Shared party resource
  log: CombatLogEntry[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Combatant Types

Combatants come in two types: heroes and creatures.

**Base Combatant (shared properties):**
```typescript
interface BaseCombatant {
  id: string;
  type: CombatantType;             // 'hero' | 'creature'
  name: string;
  entityId?: string;               // Links to entity in entities table (optional for ad-hoc combatants)
  initiative: number;
  initiativeRoll: [number, number]; // Draw Steel uses 2d10
  stamina: number;
  maxStamina?: number;             // Optional - allows tracking current Stamina without a cap
  startingHp?: number;             // Issue #241: Tracks initial HP for healing cap when maxStamina undefined
  tempStamina: number;
  ac?: number;
  conditions: CombatCondition[];
  tokenIndicator?: string;         // Issue #300: Optional indicator for identifying combatants (e.g., "A", "Boss")
}
```

**Hero Combatant:**
```typescript
interface HeroCombatant extends BaseCombatant {
  type: 'hero';
  heroicResource?: HeroicResource; // Optional for quick-add heroes
}

interface HeroicResource {
  current: number;
  max: number;
  name: string;                     // Display name for the resource
}
```

**Creature Combatant:**
```typescript
interface CreatureCombatant extends BaseCombatant {
  type: 'creature';
  threat: number;                   // 1=minion/standard, 2=elite, 3=boss/solo
  isAdHoc?: boolean;                // True for quick-added creatures without entity links
}
```

**Type Guards:**
```typescript
function isHeroCombatant(combatant: Combatant): combatant is HeroCombatant
function isCreatureCombatant(combatant: Combatant): combatant is CreatureCombatant
```

#### Combat Conditions

Conditions with flexible duration tracking:

```typescript
interface CombatCondition {
  name: string;
  description?: string;
  source: string;                   // What applied this condition
  duration: number;                 // Special values: -1=permanent, 0=until combat end
}
```

**Duration semantics:**
- Positive number: Decrements at end of each round, removed when reaches 0
- `0`: Lasts until end of combat (never decremented)
- `-1`: Permanent condition (never decremented or removed)

#### Combat Log

All combat events are logged for replay and history:

```typescript
interface CombatLogEntry {
  id: string;
  round: number;
  turn: number;
  timestamp: Date;
  message: string;
  type: CombatLogType;              // 'system' | 'action' | 'damage' | 'healing' | 'condition' | 'initiative' | 'note'
  combatantId?: string;
  metadata?: Record<string, unknown>;
}
```

#### Power Rolls

Draw Steel's 2d10 power roll system:

```typescript
interface PowerRollResult {
  roll1: number;
  roll2: number;
  total: number;
  tier: number;                     // 1-4 based on total
  critical?: boolean;               // true if both dice show 10 (tier 4)
}
```

**Tier thresholds:**
- Tier 1: 3-11
- Tier 2: 12-16
- Tier 3: 17-19
- Tier 4 (Critical): 20 (double 10s)

### Input Types

All repository operations use dedicated input types for type safety:

```typescript
// Create combat
interface CreateCombatInput {
  name: string;
  description?: string;
}

// Add combatants
interface AddHeroCombatantInput {
  name: string;
  entityId: string;
  stamina?: number;                 // Current Stamina (defaults to maxStamina if not provided)
  maxStamina?: number;              // Optional - allows tracking Stamina without a cap
  ac?: number;
  heroicResource?: HeroicResource;  // Optional for simplified entry
}

interface AddCreatureCombatantInput {
  name: string;
  entityId?: string;                // Optional - allows ad-hoc creatures
  stamina?: number;                 // Current Stamina (defaults to maxStamina if not provided)
  maxStamina?: number;              // Optional - allows tracking Stamina without a cap
  ac?: number;
  threat?: number;                  // Defaults to 1 if not provided
}

// Quick-add combatant (Issue #233)
interface AddQuickCombatantInput {
  name: string;                     // Auto-numbered if duplicates exist
  type: 'hero' | 'creature';
  stamina: number;                  // Only Stamina is required
  ac?: number;
  threat?: number;                  // For creatures, defaults to 1
}

// Update combatant
interface UpdateCombatantInput {
  name?: string;
  initiative?: number;
  initiativeRoll?: [number, number];
  stamina?: number;
  maxStamina?: number;
  tempStamina?: number;
  ac?: number;
  conditions?: CombatCondition[];
}

// Add condition
interface AddConditionInput {
  name: string;
  description?: string;
  source: string;
  duration: number;
}

// Log entry
interface AddLogEntryInput {
  message: string;
  type: CombatLogType;
  combatantId?: string;
  metadata?: Record<string, unknown>;
}

// Power roll logging
interface LogPowerRollInput {
  combatantName: string;
  roll1: number;
  roll2: number;
  total: number;
  tier: number;
  critical?: boolean;
  action: string;
  combatantId?: string;
}
```

## Database Schema

Combat sessions are stored in the `combatSessions` table (added in database version 5).

**Schema definition** (`/src/lib/db/index.ts`):

```typescript
combatSessions: '++id, status, createdAt, updatedAt'
```

**Indexes:**
- `id` (primary key, auto-incrementing)
- `status` (for filtering active/paused combats)
- `createdAt`, `updatedAt` (for sorting)

**Storage format:**

The entire `CombatSession` object is stored as-is, with Dexie handling serialization:
- Dates are preserved as Date objects
- Arrays (combatants, log) are stored directly
- Nested objects (conditions, metadata) are preserved

## Combat Repository

The `combatRepository` provides all data operations for combat sessions.

**Location:** `/src/lib/db/repositories/combatRepository.ts`

### CRUD Operations

```typescript
// Get all combats (reactive live query)
getAll(): Observable<CombatSession[]>

// Get single combat
getById(id: string): Promise<CombatSession | undefined>

// Get active combats (status: active or paused)
getActiveCombats(): Promise<CombatSession[]>

// Create combat
create(input: CreateCombatInput): Promise<CombatSession>

// Update combat metadata
update(id: string, input: UpdateCombatInput): Promise<CombatSession>

// Delete combat
delete(id: string): Promise<void>
```

### Combat Lifecycle

```typescript
// Start combat (preparing → active, initializes round 1)
startCombat(id: string): Promise<CombatSession>

// Pause combat (active → paused)
pauseCombat(id: string): Promise<CombatSession>

// Resume combat (paused → active)
resumeCombat(id: string): Promise<CombatSession>

// End combat (any → completed, clears conditions)
endCombat(id: string): Promise<CombatSession>
```

**Lifecycle transitions:**
```
preparing → startCombat() → active
active → pauseCombat() → paused
paused → resumeCombat() → active
any → endCombat() → completed
```

### Combatant Management

```typescript
// Add hero
addHeroCombatant(combatId: string, input: AddHeroCombatantInput): Promise<CombatSession>

// Add creature
addCreatureCombatant(combatId: string, input: AddCreatureCombatantInput): Promise<CombatSession>

// Quick-add combatant (Issue #233)
// Simplified entry with only name and Stamina required
// Auto-numbers duplicates: "Goblin", "Goblin 1", "Goblin 2"
addQuickCombatant(combatId: string, input: AddQuickCombatantInput): Promise<CombatSession>

// Update combatant
updateCombatant(combatId: string, combatantId: string, input: UpdateCombatantInput): Promise<CombatSession>

// Remove combatant
removeCombatant(combatId: string, combatantId: string): Promise<CombatSession>
```

### Initiative System

Draw Steel uses 2d10 for initiative.

```typescript
// Roll initiative for one combatant
rollInitiative(combatId: string, combatantId: string, modifier?: number): Promise<CombatSession>

// Roll initiative for all combatants
rollInitiativeForAll(combatId: string): Promise<CombatSession>
```

**Implementation details:**
- Rolls 2d10 (values 1-10 each)
- Stores individual dice in `initiativeRoll` field
- Calculates total with optional modifier
- Stores total in `initiative` field
- Logs initiative roll to combat log

**Internal helper:**
```typescript
function roll2d10(): [number, number] {
  const roll1 = Math.floor(Math.random() * 10) + 1;
  const roll2 = Math.floor(Math.random() * 10) + 1;
  return [roll1, roll2];
}
```

### Turn Management

```typescript
// Advance to next turn
nextTurn(combatId: string): Promise<CombatSession>

// Go back to previous turn
previousTurn(combatId: string): Promise<CombatSession>
```

**Turn advancement logic:**
- Increments `currentTurn` index
- When reaching end of combatants, wraps to 0 and increments `currentRound`
- Decrements condition durations when advancing to new round
- Logs round transitions to combat log

**Condition duration handling:**
- Positive duration: Decremented by 1 each round, removed when reaches 0
- Duration 0: "Until end of combat" - never decremented
- Duration -1: Permanent - never decremented

### Stamina Management

```typescript
// Apply damage (handles temp Stamina absorption)
applyDamage(combatId: string, combatantId: string, damage: number, source?: string): Promise<CombatSession>

// Apply healing (cannot exceed maxStamina)
applyHealing(combatId: string, combatantId: string, healing: number, source?: string): Promise<CombatSession>

// Add temporary Stamina (replaces existing temp Stamina if higher)
addTemporaryStamina(combatId: string, combatantId: string, tempStamina: number): Promise<CombatSession>
```

**Damage application rules:**
1. Temporary Stamina absorbs damage first
2. Remaining damage applies to regular Stamina
3. Stamina cannot go below 0
4. Logs damage to combat log

**Healing rules (Issue #241):**
1. Adds healing to current Stamina
2. Cannot exceed maxStamina (if maxStamina is defined)
3. For quick-add combatants without maxStamina, capped at startingHp
4. Negative healing values treated as zero (no effect)
5. Does not affect temporary Stamina
6. Logs healing to combat log

**Temporary Stamina rules:**
1. Replaces existing temp Stamina if new value is higher
2. Does not stack with existing temp Stamina
3. Absorbs damage before regular Stamina

**Internal helper:**
```typescript
function applyDamageToCombatant(combatant: Combatant, damage: number): Combatant {
  // Absorb with temp Stamina first, then apply to Stamina
}
```

### Inline Max HP Editing

**Issue #301:** Max HP can now be edited directly during combat without removing and re-adding combatants.

```typescript
// Update combatant with new maxStamina
updateCombatant(combatId: string, combatantId: string, input: UpdateCombatantInput): Promise<CombatSession>
```

**Editing behavior:**
- Edit button with pencil icon appears in HpTracker component
- Click to toggle inline editing mode
- Enter new maxHP value and press Enter to save
- Press Escape to cancel editing
- Current HP automatically clamped if new maxHP is lower than current HP
- All changes logged to combat log with metadata
- Useful for level-ups, temporary effects, or corrections during combat

**Keyboard shortcuts:**
- Enter: Save changes
- Escape: Cancel editing

### Condition Management

```typescript
// Add condition to combatant
addCondition(combatId: string, combatantId: string, condition: AddConditionInput): Promise<CombatSession>

// Remove condition from combatant
removeCondition(combatId: string, combatantId: string, conditionName: string): Promise<CombatSession>
```

**Duration tracking:**
- Conditions are automatically decremented at end of round (via `nextTurn()`)
- Expired conditions are automatically removed
- Special durations (-1, 0) are never decremented

**Internal helper:**
```typescript
function decrementConditionDurations(combatant: Combatant): Combatant {
  // Decrement positive durations
  // Remove expired conditions
  // Preserve permanent and combat-duration conditions
}
```

### Hero Points

Hero points are a shared party resource in Draw Steel.

```typescript
// Add hero points
addHeroPoints(combatId: string, points: number): Promise<CombatSession>

// Spend one hero point
spendHeroPoint(combatId: string): Promise<CombatSession>
```

**Rules:**
- Cannot spend below 0
- Logs point changes to combat log

### Victory Points

Victory points track combat objectives in Draw Steel.

```typescript
// Add victory points
addVictoryPoints(combatId: string, points: number, reason?: string): Promise<CombatSession>

// Remove victory points
removeVictoryPoints(combatId: string, points: number, reason?: string): Promise<CombatSession>
```

**Usage:**
- Track progress toward combat objectives
- Can go negative
- Logs point changes with optional reason

### Combat Log

```typescript
// Add generic log entry
addLogEntry(combatId: string, input: AddLogEntryInput): Promise<CombatSession>

// Log a power roll
logPowerRoll(combatId: string, input: LogPowerRollInput): Promise<CombatSession>
```

**Log types:**
- `system` - Combat system messages (round start, combat end)
- `action` - Combatant actions
- `damage` - Damage dealt
- `healing` - Healing applied
- `condition` - Conditions added/removed
- `initiative` - Initiative rolls
- `note` - Manual notes

**Automatic logging:**

The repository automatically logs many events:
- Initiative rolls
- Damage and healing
- Condition changes
- Round transitions
- Hero point and victory point changes
- Combat lifecycle transitions

**Internal helper:**
```typescript
function createLogEntry(
  combat: CombatSession,
  message: string,
  type: CombatLogEntry['type'],
  combatantId?: string,
  metadata?: Record<string, unknown>
): CombatLogEntry {
  // Creates log entry with current round/turn/timestamp
}
```

## Combat Store

The `combatStore` provides reactive state management using Svelte 5 runes.

**Location:** `/src/lib/stores/combat.svelte.ts`

### Reactive State

```typescript
// Core state
combats: CombatSession[]         // All combat sessions (live query)
activeCombat: CombatSession | null  // Currently selected combat
isLoading: boolean               // Loading state
error: string | null             // Error message
```

### Derived Values

```typescript
// Derived state (computed reactively)
activeCombats: CombatSession[]   // Combats with status active or paused
currentCombatant: Combatant | null  // Current turn's combatant
sortedCombatants: Combatant[]    // Initiative order (highest first)
heroes: Combatant[]              // Hero combatants in active combat
creatures: Combatant[]           // Creature combatants in active combat
```

**Implementation using Svelte 5 runes:**

```typescript
const activeCombats = $derived.by(() => {
  return combats.filter(c => c.status === 'active' || c.status === 'paused');
});

const currentCombatant = $derived.by((): Combatant | null => {
  if (!activeCombat || activeCombat.combatants.length === 0) {
    return null;
  }
  return activeCombat.combatants[activeCombat.currentTurn] || null;
});
```

### Live Query Subscription

The store subscribes to the repository's live query for automatic updates:

```typescript
const subscription = combatRepository.getAll().subscribe({
  next: (data) => {
    combats = data;
    isLoading = false;
  },
  error: (err) => {
    console.error('Combat store subscription error:', err);
    error = err.message;
    isLoading = false;
  }
});
```

**Benefits:**
- Automatic UI updates when database changes
- No manual refresh needed
- Reactive to all CRUD operations

### Store Methods

All repository methods are wrapped with error handling and state management:

```typescript
// CRUD
createCombat(input: CreateCombatInput): Promise<CombatSession>
selectCombat(id: string): Promise<void>
updateCombat(id: string, input: UpdateCombatInput): Promise<CombatSession>
deleteCombat(id: string): Promise<void>

// Lifecycle
startCombat(id: string): Promise<CombatSession>
pauseCombat(id: string): Promise<CombatSession>
resumeCombat(id: string): Promise<CombatSession>
endCombat(id: string): Promise<CombatSession>

// Combatants
addHero(combatId: string, input: AddHeroCombatantInput): Promise<CombatSession>
addCreature(combatId: string, input: AddCreatureCombatantInput): Promise<CombatSession>
addQuickCombatant(combatId: string, input: AddQuickCombatantInput): Promise<CombatSession>
updateCombatant(combatId: string, combatantId: string, input: UpdateCombatantInput): Promise<CombatSession>
removeCombatant(combatId: string, combatantId: string): Promise<CombatSession>
rollInitiative(combatId: string, combatantId: string, modifier?: number): Promise<CombatSession>
rollInitiativeForAll(combatId: string): Promise<CombatSession>

// Turns
nextTurn(combatId: string): Promise<CombatSession>
previousTurn(combatId: string): Promise<CombatSession>

// Stamina
applyDamage(combatId: string, combatantId: string, damage: number, source?: string): Promise<CombatSession>
applyHealing(combatId: string, combatantId: string, healing: number, source?: string): Promise<CombatSession>
addTemporaryStamina(combatId: string, combatantId: string, tempStamina: number): Promise<CombatSession>

// Conditions
addCondition(combatId: string, combatantId: string, condition: AddConditionInput): Promise<CombatSession>
removeCondition(combatId: string, combatantId: string, conditionName: string): Promise<CombatSession>

// Hero Points
addHeroPoints(combatId: string, points: number): Promise<CombatSession>
spendHeroPoint(combatId: string): Promise<CombatSession>

// Victory Points
addVictoryPoints(combatId: string, points: number, reason?: string): Promise<CombatSession>
removeVictoryPoints(combatId: string, points: number, reason?: string): Promise<CombatSession>

// Log
addLogEntry(combatId: string, input: AddLogEntryInput): Promise<CombatSession>
logPowerRoll(combatId: string, input: LogPowerRollInput): Promise<CombatSession>

// Helpers
getCombatantById(combatantId: string): Combatant | undefined
isHeroTurn(): boolean
clearError(): void
```

### Active Combat Management

The store automatically syncs `activeCombat` when operations modify it:

```typescript
function updateActiveCombatIfMatch(updated: CombatSession) {
  if (activeCombat && activeCombat.id === updated.id) {
    activeCombat = updated;
  }
}

function clearActiveCombatIfMatch(combatId: string) {
  if (activeCombat && activeCombat.id === combatId) {
    activeCombat = null;
  }
}
```

**Usage in methods:**
```typescript
async function updateCombatant(...): Promise<CombatSession> {
  const updated = await combatRepository.updateCombatant(...);
  updateActiveCombatIfMatch(updated);  // Sync active combat
  return updated;
}
```

### Usage Example

```typescript
import { combatStore } from '$lib/stores/combat.svelte';

// Select a combat session
await combatStore.selectCombat('combat-123');

// Access reactive state
const combat = combatStore.activeCombat;
const current = combatStore.currentCombatant;

// Perform operations
await combatStore.addHero('combat-123', {
  name: 'Aragorn',
  entityId: 'entity-456',
  maxHp: 45,
  ac: 16,
  heroicResource: { current: 0, max: 5, name: 'Victories' }
});

await combatStore.startCombat('combat-123');
await combatStore.rollInitiativeForAll('combat-123');
await combatStore.nextTurn('combat-123');
```

## UI Components

### Component Architecture

All combat components are in `/src/lib/components/combat/` with barrel exports via `index.ts`.

**Component design principles:**
- Accept combat data as props (not store-coupled)
- Emit events for user actions
- Fully typed with TypeScript
- Comprehensive test coverage
- Accessible and keyboard-friendly

### InitiativeTracker

Displays combatants in initiative order with current turn highlighting.

**Location:** `InitiativeTracker.svelte`

**Props:**
```typescript
interface Props {
  combatants: Combatant[];
  currentTurn: number;
}
```

**Features:**
- Sorts combatants by initiative (highest first)
- Highlights current combatant
- Shows initiative values and dice rolls
- Displays combatant type (hero/creature)
- Shows Stamina and conditions at a glance

**Usage:**
```svelte
<InitiativeTracker
  combatants={combat.combatants}
  currentTurn={combat.currentTurn}
/>
```

### CombatantCard

Individual combatant card with all stats and controls.

**Location:** `CombatantCard.svelte`

**Props:**
```typescript
interface Props {
  combatant: Combatant;
  isCurrentTurn: boolean;
}
```

**Events:**
```typescript
dispatch('update', updatedCombatant);
dispatch('remove', combatantId);
dispatch('rollInitiative', combatantId);
dispatch('applyDamage', { combatantId, damage });
dispatch('applyHealing', { combatantId, healing });
```

**Features:**
- Display all combatant stats (Stamina, AC, initiative)
- Inline Stamina adjustment
- Inline maxHP editing with keyboard shortcuts (Issue #301)
- Condition badges
- Initiative re-roll button
- Heroic resource tracking (for heroes)
- Threat level display (for creatures)
- Token indicator badge in purple (Issue #300)
- Remove combatant button

**Usage:**
```svelte
<CombatantCard
  combatant={hero}
  isCurrentTurn={true}
  on:update={handleUpdate}
  on:remove={handleRemove}
/>
```

### TurnControls

Turn navigation and round tracking.

**Location:** `TurnControls.svelte`

**Props:**
```typescript
interface Props {
  currentRound: number;
  currentTurn: number;
  combatantCount: number;
  currentCombatantName?: string;
}
```

**Events:**
```typescript
dispatch('next');
dispatch('previous');
```

**Features:**
- Next/previous turn buttons
- Current round display
- Current combatant name
- Turn number (X of Y)
- Keyboard shortcuts (n=next, p=previous)

**Usage:**
```svelte
<TurnControls
  currentRound={combat.currentRound}
  currentTurn={combat.currentTurn}
  combatantCount={combat.combatants.length}
  currentCombatantName={currentCombatant?.name}
  on:next={handleNext}
  on:previous={handlePrevious}
/>
```

### StaminaTracker

Stamina management with damage/healing input and temporary Stamina.

**Location:** `StaminaTracker.svelte`

**Props:**
```typescript
interface Props {
  combatant: Combatant;
  compact?: boolean;
}
```

**Events:**
```typescript
dispatch('damage', { amount: number, source?: string });
dispatch('heal', { amount: number, source?: string });
dispatch('tempHp', { amount: number });
```

**Features:**
- Stamina bar with percentage
- Current/max Stamina display
- Temporary Stamina display
- Quick damage/healing buttons
- Custom amount input
- Optional source tracking
- Compact mode for inline display

**Usage:**
```svelte
<StaminaTracker
  combatant={hero}
  on:damage={handleDamage}
  on:heal={handleHealing}
  on:tempStamina={handleTempStamina}
/>
```

### ConditionManager

Condition management interface.

**Location:** `ConditionManager.svelte`

**Props:**
```typescript
interface Props {
  conditions: CombatCondition[];
  combatantName: string;
}
```

**Events:**
```typescript
dispatch('add', condition);
dispatch('remove', conditionName);
```

**Features:**
- List all active conditions
- Add new condition form
- Condition name input
- Duration selector (rounds, combat, permanent)
- Source tracking
- Optional description
- Remove condition button
- Duration display and countdown

**Usage:**
```svelte
<ConditionManager
  conditions={combatant.conditions}
  combatantName={combatant.name}
  on:add={handleAddCondition}
  on:remove={handleRemoveCondition}
/>
```

### ConditionBadge

Visual display for a single condition.

**Location:** `ConditionBadge.svelte`

**Props:**
```typescript
interface Props {
  condition: CombatCondition;
  removable?: boolean;
}
```

**Events:**
```typescript
dispatch('remove');
```

**Features:**
- Condition name
- Duration display
- Color-coded by duration type
- Tooltip with full details
- Optional remove button

**Duration display:**
- Positive number: "X rounds"
- 0: "Combat"
- -1: "Permanent"

**Usage:**
```svelte
<ConditionBadge
  condition={blindedCondition}
  removable={true}
  on:remove={handleRemove}
/>
```

### Component Exports

All components are exported via barrel file:

**Location:** `index.ts`

```typescript
export { default as InitiativeTracker } from './InitiativeTracker.svelte';
export { default as CombatantCard } from './CombatantCard.svelte';
export { default as TurnControls } from './TurnControls.svelte';
export { default as StaminaTracker } from './StaminaTracker.svelte';
export { default as ConditionManager } from './ConditionManager.svelte';
export { default as ConditionBadge } from './ConditionBadge.svelte';
```

**Import usage:**
```typescript
import {
  InitiativeTracker,
  CombatantCard,
  TurnControls,
  StaminaTracker,
  ConditionManager
} from '$lib/components/combat';
```

## Testing

All combat system code has comprehensive test coverage.

### Repository Tests

**Location:** `/src/lib/db/repositories/combatRepository.test.ts`

**Coverage:**
- CRUD operations
- Combat lifecycle transitions
- Combatant management
- Initiative rolling (2d10 mechanics)
- Turn advancement and round tracking
- Stamina management (damage, healing, temp Stamina)
- Condition tracking and duration
- Hero points and victory points
- Combat logging

### Store Tests

**Location:** `/src/lib/stores/combat.svelte.test.ts`

**Coverage:**
- Reactive state updates
- Derived value calculations
- Live query subscription
- Active combat synchronization
- Error handling
- All wrapped repository methods

### Component Tests

Each component has a dedicated test file:

- `InitiativeTracker.test.ts` - Initiative display and sorting
- `CombatantCard.test.ts` - Combatant display and events
- `TurnControls.test.ts` - Turn navigation
- `StaminaTracker.test.ts` - Stamina management UI
- `ConditionManager.test.ts` - Condition CRUD
- `ConditionBadge.test.ts` - Condition display (if exists)

**Test patterns:**
- Component rendering
- Prop handling
- Event emission
- User interactions
- Edge cases
- Accessibility

### Running Tests

```bash
# Run all tests
npm test

# Run combat-specific tests
npm test combat

# Run with coverage
npm test -- --coverage
```

## Quick-Add Combatants

Issue #233 introduced simplified combatant entry for faster combat setup.

### Quick-Add Mode

Allows adding combatants with minimal information:
- **Required:** Name and current Stamina only
- **Optional:** AC, threat level (for creatures), and token indicator
- **Auto-numbering:** Duplicate names get numbered automatically

**Issue #240:** Threat level selector now available in quick-add form for creatures (Standard, Elite, Boss)

**Issue #300:** Token indicators can be added to identify specific combatants (e.g., "A", "Boss", "Red")

**Usage:**
```typescript
// Add a quick creature
await combatStore.addQuickCombatant(combatId, {
  name: 'Goblin',
  type: 'creature',
  stamina: 12,
  ac: 14,
  threat: 1
});

// Add another - automatically becomes "Goblin 1"
await combatStore.addQuickCombatant(combatId, {
  name: 'Goblin',
  type: 'creature',
  stamina: 12
});
```

**Auto-numbering:**
- First combatant: "Goblin"
- Second combatant: "Goblin 1"
- Third combatant: "Goblin 2"
- Pattern recognition handles existing numbers correctly

**Ad-hoc flag:**
- Quick-added creatures have `isAdHoc: true`
- Indicates no linked entity in the database
- Useful for temporary combatants or mooks

### Optional Max Stamina

Both quick-add and standard entry now support optional maxStamina.

**Behavior when maxStamina is undefined:**
- Current Stamina can be tracked without a maximum cap
- Healing has no upper limit
- Stamina bar and bloodied indicators hidden in UI
- Useful for tracking abstract "health" or temporary combatants

**Behavior when maxStamina is defined:**
- Standard healing cap at maxStamina
- Stamina bar shows percentage
- Bloodied indicator appears at 50% Stamina
- Full combat tracking with limits

**Usage:**
```typescript
// Hero with maxStamina
await combatStore.addHero(combatId, {
  name: 'Aragorn',
  entityId: 'hero-1',
  stamina: 45,
  maxStamina: 45,
  heroicResource: { current: 0, max: 5, name: 'Victories' }
});

// Hero without maxStamina (simplified tracking)
await combatStore.addHero(combatId, {
  name: 'Gandalf',
  entityId: 'hero-2',
  stamina: 50
});
```

### Simplified Hero Entry

Heroes can now be added with minimal information:
- **Required:** Name, entityId, and current Stamina
- **Optional:** maxStamina, heroicResource, AC
- Allows quick setup for casual games or temporary heroes

### Token Indicators

**Issue #300:** Token indicators help identify specific combatants in combat.

**Features:**
- Optional string field on all combatants
- Purple badge displays in CombatantCard
- Useful for distinguishing multiple creatures of the same type
- Common patterns: "A", "B", "C" or "Boss", "Minion 1", "Red", "Blue"
- Persists through all combat operations
- Available in quick-add, entity-based, and inline editing

**Usage:**
```typescript
// Add combatant with token indicator
await combatStore.addQuickCombatant(combatId, {
  name: 'Goblin',
  type: 'creature',
  stamina: 12,
  tokenIndicator: 'A'
});

// Update existing combatant
await combatStore.updateCombatant(combatId, combatantId, {
  tokenIndicator: 'Boss'
});
```

## Draw Steel Mechanics

The combat system implements Draw Steel's unique mechanics accurately.

### Initiative: 2d10

Draw Steel uses 2d10 (not d20) for initiative.

**Implementation:**
- `roll2d10()` generates two values 1-10
- Stored in `initiativeRoll: [number, number]`
- Total calculated with optional modifier
- Stored in `initiative` field for sorting

**Why this matters:**
- Different probability distribution than d20
- Average roll is 11 (vs 10.5 for d20)
- No natural 20/1 mechanics

### Threat Levels

Creatures have threat levels 1-3:

- **1**: Minion or Standard
- **2**: Elite
- **3**: Boss or Solo

**Usage:**
- Stored in `CreatureCombatant.threat`
- Affects encounter balance
- May affect XP and rewards

### Hero Points

Shared party resource that players can spend for advantages.

**Implementation:**
- Stored at combat session level (`CombatSession.heroPoints`)
- `addHeroPoints()` to gain points
- `spendHeroPoint()` to use one point
- Cannot go below 0

**Common uses:**
- Reroll dice
- Add extra damage
- Grant advantage

### Victory Points

Track progress toward combat objectives.

**Implementation:**
- Stored at combat session level (`CombatSession.victoryPoints`)
- Can increase or decrease
- Can go negative
- Optional reason tracking

**Common uses:**
- Objective-based encounters
- Partial success tracking
- Negotiation progress

### Heroic Resources

Hero-specific resources like Victories, Focus, Fury, etc.

**Implementation:**
- Stored in `HeroCombatant.heroicResource`
- Has current, max, and name
- Tracked separately per hero
- Must be managed by UI

**Examples:**
- Victories (most heroes)
- Focus (casters)
- Fury (barbarian-types)
- Resolve (defenders)

### Power Rolls

Draw Steel uses 2d10 for most rolls with tiered results.

**Implementation:**
- `PowerRollResult` type with tier calculation
- `logPowerRoll()` to record in combat log
- Tier thresholds: 3-11 (T1), 12-16 (T2), 17-19 (T3), 20 (T4)
- Critical on double 10s

**Usage:**
- Attack rolls
- Ability checks
- Saving throws

### Conditions

Flexible condition system with multiple duration types.

**Duration types:**
- **Positive number**: Decrements each round, removed at 0
- **0**: Lasts until end of combat
- **-1**: Permanent (never expires)

**Automatic management:**
- Decremented automatically during `nextTurn()`
- Expired conditions auto-removed
- All condition changes logged

## Common Patterns

### Creating a Combat Session

```typescript
import { combatStore } from '$lib/stores/combat.svelte';

// Create combat
const combat = await combatStore.createCombat({
  name: 'Boss Fight',
  description: 'Final battle with the dragon'
});

// Add heroes
await combatStore.addHero(combat.id, {
  name: 'Aragorn',
  entityId: 'hero-1',
  maxStamina: 45,
  ac: 16,
  heroicResource: { current: 0, max: 5, name: 'Victories' }
});

// Add creatures
await combatStore.addCreature(combat.id, {
  name: 'Dragon',
  entityId: 'creature-1',
  maxStamina: 200,
  ac: 18,
  threat: 3  // Boss
});

// Roll initiative and start
await combatStore.rollInitiativeForAll(combat.id);
await combatStore.startCombat(combat.id);
```

### Running Combat

```typescript
// Select combat
await combatStore.selectCombat(combat.id);

// Access reactive state
const currentCombatant = combatStore.currentCombatant;

// Apply damage
if (currentCombatant) {
  await combatStore.applyDamage(
    combat.id,
    targetId,
    15,
    `${currentCombatant.name}'s attack`
  );
}

// Add condition
await combatStore.addCondition(combat.id, targetId, {
  name: 'Blinded',
  duration: 2,  // 2 rounds
  source: 'Flash Spell'
});

// Advance turn
await combatStore.nextTurn(combat.id);
```

### Using Components

```svelte
<script lang="ts">
  import { combatStore } from '$lib/stores/combat.svelte';
  import {
    InitiativeTracker,
    TurnControls,
    CombatantCard
  } from '$lib/components/combat';

  const combat = $derived(combatStore.activeCombat);
  const currentCombatant = $derived(combatStore.currentCombatant);

  async function handleNext() {
    if (combat) {
      await combatStore.nextTurn(combat.id);
    }
  }

  async function handleDamage(event: CustomEvent) {
    if (combat) {
      await combatStore.applyDamage(
        combat.id,
        event.detail.combatantId,
        event.detail.amount,
        event.detail.source
      );
    }
  }
</script>

{#if combat}
  <TurnControls
    currentRound={combat.currentRound}
    currentTurn={combat.currentTurn}
    combatantCount={combat.combatants.length}
    currentCombatantName={currentCombatant?.name}
    on:next={handleNext}
  />

  <InitiativeTracker
    combatants={combat.combatants}
    currentTurn={combat.currentTurn}
  />

  {#each combat.combatants as combatant (combatant.id)}
    <CombatantCard
      {combatant}
      isCurrentTurn={combatant.id === currentCombatant?.id}
      on:damage={handleDamage}
    />
  {/each}
{/if}
```

### Accessing Combat Data

```typescript
// Get all combats
const allCombats = combatStore.combats;

// Get active combats
const active = combatStore.activeCombats;

// Get sorted by initiative
const sorted = combatStore.sortedCombatants;

// Get only heroes
const heroes = combatStore.heroes;

// Get only creatures
const creatures = combatStore.creatures;

// Check if hero's turn
const heroTurn = combatStore.isHeroTurn();

// Get specific combatant
const combatant = combatStore.getCombatantById('combatant-123');
```

## Extension Points

### Adding Custom Mechanics

To add new combat mechanics:

1. **Update types** in `combat.ts`
2. **Add repository method** in `combatRepository.ts`
3. **Wrap in store** in `combat.svelte.ts`
4. **Create UI component** in `/components/combat/`
5. **Add tests** for all layers

**Example: Adding Action Points**

```typescript
// 1. Update types
interface CombatSession {
  // ... existing fields
  actionPoints: number;  // Add new field
}

// 2. Add repository method
async addActionPoints(combatId: string, points: number): Promise<CombatSession> {
  const combat = await this.getById(combatId);
  if (!combat) throw new Error('Combat not found');

  const updated = {
    ...combat,
    actionPoints: combat.actionPoints + points,
    updatedAt: new Date()
  };

  const entry = createLogEntry(
    combat,
    `Added ${points} action points`,
    'system'
  );
  updated.log = [...updated.log, entry];

  await db.combatSessions.put(updated);
  return updated;
}

// 3. Wrap in store
async function addActionPoints(combatId: string, points: number) {
  const updated = await combatRepository.addActionPoints(combatId, points);
  updateActiveCombatIfMatch(updated);
  return updated;
}

// 4. Create UI component
// ActionPointTracker.svelte

// 5. Add tests
// actionPoints.test.ts
```

### Database Migration

When adding new fields to `CombatSession`:

```typescript
// db/index.ts
const db = new Dexie('DirectorAssistDB');

db.version(6).stores({
  // ... existing tables
  combatSessions: '++id, status, createdAt, updatedAt'  // No schema change needed
}).upgrade(tx => {
  // Initialize new fields on existing combats
  return tx.table('combatSessions').toCollection().modify(combat => {
    if (!combat.actionPoints) {
      combat.actionPoints = 0;
    }
  });
});
```

## Troubleshooting

### Common Issues

**Combat not updating in UI:**
- Verify live query subscription is active
- Check that store methods call `updateActiveCombatIfMatch()`
- Ensure component is using reactive `$derived` values

**Initiative not rolling:**
- Verify `roll2d10()` is generating values 1-10
- Check that `initiativeRoll` is being stored
- Ensure modifier is being applied correctly

**Conditions not expiring:**
- Verify `nextTurn()` is calling `decrementConditionDurations()`
- Check that duration is positive (not 0 or -1)
- Ensure round is actually advancing

**Temp Stamina not absorbing damage:**
- Verify `applyDamageToCombatant()` checks temp Stamina first
- Check that temp Stamina is being stored correctly
- Ensure damage application order is correct

### Debugging

**Enable verbose logging:**

```typescript
// In combatRepository.ts
async nextTurn(id: string): Promise<CombatSession> {
  console.log('Advancing turn for combat:', id);
  const combat = await this.getById(id);
  console.log('Current state:', { round: combat.currentRound, turn: combat.currentTurn });
  // ... rest of method
}
```

**Inspect database directly:**

```typescript
// In browser console
const db = await Dexie.getDatabaseNames();
const directorAssist = new Dexie('DirectorAssistDB');
await directorAssist.open();
const combats = await directorAssist.table('combatSessions').toArray();
console.log(combats);
```

**Check store state:**

```typescript
// In browser console
import { combatStore } from '$lib/stores/combat.svelte';
console.log(combatStore.activeCombat);
console.log(combatStore.combats);
```

## Future Enhancements

Potential future additions to the combat system:

- **Combat templates** - Save common encounter setups
- **Automated enemy actions** - AI-suggested creature tactics
- **Map integration** - Visual combat grid
- **Effect tracking** - Ongoing effects and triggers
- **Custom conditions** - User-defined status effects
- **Damage types** - Resistance/vulnerability tracking
- **Death saves** - Automatic death save tracking
- **Concentration** - Spell concentration mechanics
- **Combat analytics** - Post-combat statistics
- **Export combat log** - Export to various formats
- **Undo/redo** - Combat action history
- **Multiplayer sync** - Real-time combat for remote play

## Related Documentation

- [Type Definitions](/src/lib/types/combat.ts) - Complete TypeScript types
- [Repository Implementation](/src/lib/db/repositories/combatRepository.ts) - Data layer
- [Store Implementation](/src/lib/stores/combat.svelte.ts) - State management
- [Component Index](/src/lib/components/combat/index.ts) - UI components
- [Architecture Documentation](./ARCHITECTURE.md) - Overall system architecture
- [User Guide](./USER_GUIDE.md) - End-user documentation

## Contributing

When contributing to the combat system:

1. Follow the established three-layer architecture
2. Add comprehensive tests for all new features
3. Update this documentation for any API changes
4. Use TypeScript strictly (no `any` types)
5. Follow Svelte 5 runes patterns (`$state`, `$derived`, `$effect`)
6. Maintain Draw Steel mechanics accuracy
7. Keep components decoupled from the store
8. Add JSDoc comments for public APIs
9. Log significant actions to combat log
10. Follow the [Agent Workflow](./AGENT_WORKFLOW.md)

---

**Implementation Status:** Combat foundation (A1) and Combat UI (A2) are complete. Future tracks (B and C) will add advanced features like map integration and automated actions.
