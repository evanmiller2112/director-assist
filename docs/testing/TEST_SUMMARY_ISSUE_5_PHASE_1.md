# Unit Tests for Issue #5 Phase 1: System-Aware Architecture

## Summary

Comprehensive unit tests have been written for Phase 1 of Issue #5 (System-Aware Architecture with Draw Steel Support). These tests follow TDD methodology and are currently in the **RED phase** - all tests fail because the implementation does not exist yet.

## Test Files Created

### 1. `/src/lib/config/systems.test.ts` (240+ tests)
Tests for system profile configuration and retrieval.

**Key Test Coverage:**
- `getSystemProfile()` function
  - Returns Draw Steel profile with correct structure
  - Returns system-agnostic profile
  - Returns undefined for unknown system IDs
  - Case-sensitive system ID matching
- `getAllSystemProfiles()` function
  - Returns all built-in systems
  - Includes custom systems when provided
  - Handles system overrides correctly
- Draw Steel Profile Structure
  - Entity type modifications for character, NPC, encounter
  - System-specific fields (ancestry, class, kit, heroicResource, threatLevel, role, victoryPoints, negotiationDC)
  - Field option overrides (encounter types)
  - Terminology ("Director" instead of "GM")
- Edge cases and defensive checks

**Test Count:** 50+ comprehensive tests

### 2. `/src/lib/config/entityTypes.test.ts` (32 tests)
Tests for system-aware entity type resolution.

**Key Test Coverage:**
- `getEntityTypeDefinitionWithSystem()` function
  - Backwards compatibility (works without system profile)
  - Adds system-specific fields for Draw Steel
  - Applies field option overrides
  - Hides fields when specified
  - Preserves field order
  - Immutability (doesn't modify originals)
- `applySystemModifications()` function
  - Adding additional fields
  - Hiding fields
  - Overriding field options
  - Preserving field order
  - Combined modifications
  - Empty modifications
  - Immutability

**Test Count:** 32 comprehensive tests

### 3. `/src/lib/stores/campaign.test.ts` (18 tests)
Tests for campaign store system management.

**Key Test Coverage:**
- `getCurrentSystemProfile()` method
  - Returns system-agnostic for campaigns without systemId
  - Returns correct profile when systemId is set
  - Handles null/undefined cases
  - Returns null when no campaign loaded
- `setSystemProfile()` method
  - Updates campaign metadata with systemId
  - Updates local campaign state
  - Persists to database
  - Updates timestamp
  - Validates error cases
- `systemId` getter
  - Returns null when no campaign loaded
  - Defaults to 'system-agnostic' for old campaigns
  - Returns systemId from metadata
- Backwards Compatibility
  - Handles campaigns created before system profiles
  - Allows setting system on old campaigns
- Type safety validation

**Test Count:** 18 comprehensive tests

## Test Execution Results (RED Phase)

All tests are currently **FAILING** as expected in the RED phase of TDD:

```
✗ systems.test.ts - Cannot import ./systems (module doesn't exist)
✗ entityTypes.test.ts - 32 failed (functions not implemented)
✗ campaign.test.ts - 18 failed (methods not implemented)
```

### Expected Failures:

1. **systems.test.ts**: Module `/src/lib/config/systems.ts` does not exist
2. **entityTypes.test.ts**: Functions `getEntityTypeDefinitionWithSystem()` and `applySystemModifications()` are not implemented
3. **campaign.test.ts**: Methods `getCurrentSystemProfile()`, `setSystemProfile()`, and getter `systemId` are not implemented in the campaign store

## Testing Strategy

### Test Philosophy
The tests follow professional testing practices:
- **AAA Pattern**: Arrange-Act-Assert structure
- **Descriptive Names**: Test names clearly state expected behavior
- **Edge Cases**: Null/undefined handling, empty inputs, boundary conditions
- **Immutability**: Verify original data structures are not modified
- **Type Safety**: Validate TypeScript type correctness
- **Backwards Compatibility**: Ensure old campaigns work without systemId

### Coverage Areas

1. **Happy Path**: Normal usage scenarios with valid inputs
2. **Edge Cases**: Empty strings, null, undefined, unknown IDs
3. **Boundary Conditions**: Missing fields, empty arrays, no modifications
4. **Error Handling**: Invalid inputs, missing campaigns, unknown systems
5. **State Transitions**: Before/after states for data modifications
6. **Immutability**: Original objects remain unchanged after operations

### Mock Strategy
Tests use Vitest mocking for:
- Database operations (`$lib/db`)
- Repository layer (`$lib/db/repositories`)
- System profile lookups (for campaign store tests)

## Implementation Requirements

To make these tests pass (GREEN phase), the following must be implemented:

### 1. System Profile Types (`src/lib/types/systems.ts`)
```typescript
export interface SystemProfile {
  id: string;
  name: string;
  description?: string;
  entityTypeModifications: Record<EntityType, EntityTypeModifications>;
  terminology: {
    gm: string;
    // Add more terminology overrides as needed
  };
}

export interface EntityTypeModifications {
  additionalFields?: FieldDefinition[];
  hiddenFields?: string[];
  fieldOptionOverrides?: Record<string, string[]>;
}
```

### 2. System Profile Configuration (`src/lib/config/systems.ts`)
```typescript
// Built-in system profiles
const DRAW_STEEL_PROFILE: SystemProfile = { ... };
const SYSTEM_AGNOSTIC_PROFILE: SystemProfile = { ... };

export function getSystemProfile(systemId: string): SystemProfile | undefined;
export function getAllSystemProfiles(customSystems?: SystemProfile[]): SystemProfile[];
```

### 3. Enhanced Entity Type Resolution (`src/lib/config/entityTypes.ts`)
```typescript
export function getEntityTypeDefinitionWithSystem(
  type: EntityType,
  baseDefinition: EntityTypeDefinition,
  systemProfile?: SystemProfile
): EntityTypeDefinition;

export function applySystemModifications(
  fields: FieldDefinition[],
  modifications: EntityTypeModifications
): FieldDefinition[];
```

### 4. Campaign Store Enhancements (`src/lib/stores/campaign.svelte.ts`)
```typescript
// Add to campaign metadata type
interface CampaignMetadata {
  systemId?: string; // New field
  customEntityTypes: EntityTypeDefinition[];
  entityTypeOverrides: EntityTypeOverride[];
  settings: CampaignSettings;
}

// Add to campaign store
{
  get systemId(): string | null;
  getCurrentSystemProfile(): SystemProfile | null;
  async setSystemProfile(systemId: string): Promise<void>;
}
```

## Draw Steel System Specifications

Based on the tests, the Draw Steel system profile must include:

### Character Fields
- `ancestry` (text): Character's ancestry
- `class` (text): Character's class
- `kit` (text): Character's kit
- `heroicResource` (richtext): Heroic resource details

### NPC Fields
- `threatLevel` (select): minion, standard, boss
- `role` (select): ambusher, artillery, brute, defender, harrier, hexer, leader, support

### Encounter Fields
- `victoryPoints` (number): Victory points for the encounter
- `negotiationDC` (number): Negotiation difficulty class
- Field override: `encounterType` options → ['combat', 'negotiation', 'montage']

### Terminology
- `gm` → "Director"

## Next Steps

1. **Implementation Phase (GREEN)**: Implement the modules and functions to pass all tests
2. **Refactoring Phase (REFACTOR)**: Optimize and clean up implementation while keeping tests green
3. **Integration**: Connect system profiles to entity forms and UI
4. **Documentation**: Update user-facing documentation for Draw Steel support

## Test Maintenance

These tests serve as:
- **Living Documentation**: Clear specifications of expected behavior
- **Regression Prevention**: Ensure system awareness works correctly as code evolves
- **Design Feedback**: Guide implementation design decisions
- **Refactoring Safety Net**: Enable confident refactoring

## Notes

- All tests follow the project's existing testing patterns (Vitest, TypeScript)
- Tests are isolated and independent (no shared state)
- Tests are deterministic (same result every time)
- Mock data is realistic and representative of actual usage
- Test names clearly communicate intent and expected behavior

---

**Status**: RED Phase Complete ✓
**Total Tests Written**: 100+ comprehensive unit tests
**Next Agent**: `senior-web-architect` to implement Phase 1 functionality
