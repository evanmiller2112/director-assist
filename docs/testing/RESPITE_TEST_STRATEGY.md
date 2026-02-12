# Respite System Test Strategy

## Overview

Test strategy covering all 5 respite implementation issues (#408-#412).

## Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `src/lib/db/repositories/respiteRepository.test.ts` | 57 | Repository CRUD, lifecycle, heroes, activities, VP, kit swaps |
| `src/lib/stores/respite.svelte.test.ts` | 32 | Store reactivity, derived values, operations, error handling |
| `src/lib/config/respiteTemplates.test.ts` | 7 | Template config, filtering, type coverage |

**Total: 96 tests**

## Repository Tests (57 tests)

### Helper Functions
- `isValidTransition`: Valid/invalid lifecycle transitions
- `calculateRemainingVP`: VP math including edge cases

### CRUD Operations
- Create with defaults, heroes, description
- GetById (found and not found)
- Update name, description, VP; timestamp updates; not-found errors
- Delete

### Lifecycle
- startRespite: preparing→active, already active error, completed error
- completeRespite: active→completed with completedAt, not active error

### Hero Management
- addHero: basic add, duplicate prevention (case-insensitive), heroId link
- updateHero: recoveries, notes, conditions, not-found error
- removeHero: basic remove, not-found error

### Activity Management
- recordActivity: defaults, hero assignment, multiple activities
- updateActivity: status, name/notes, not-found error
- completeActivity: with outcome, without outcome

### VP Conversion
- Convert VP, incremental conversion, over-conversion prevention
- Zero/negative amount prevention, exact remaining conversion

### Kit Swap Recording
- Record with reason, without reason, non-existent hero, multiple swaps

## Store Tests (32 tests)

### State and Reactivity
- Empty initial state
- Empty derived values

### CRUD
- createRespite: repository call, error handling
- selectRespite: set active, handle missing
- updateRespite: repository call, active sync
- deleteRespite: repository call, clear active

### Lifecycle
- startRespite: call, active sync, error
- completeRespite: call

### Hero/Activity/VP/Kit Swap Operations
- Delegation to repository with correct arguments
- Error propagation

### Derived Values
- heroCount, fullyRestedHeroes, vpRemaining, vpConversionPercent
- Activities by status (pending, in_progress, completed)
- kitSwapHistory

## Template Tests (7 tests)

- Templates for all activity types
- Non-empty name/description
- At least 3 templates per type
- getTemplatesByType filtering
- getTemplateTypes uniqueness

## Test Approach

- **Repository tests**: Use real Dexie + fake-indexeddb for integration-level DB testing
- **Store tests**: Mock repository, test store logic in isolation
- **Template tests**: Pure unit tests on config data
- **UI components**: No component tests in v1.7.0 (follow negotiation pattern for future addition)
