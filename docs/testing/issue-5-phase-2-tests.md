# Issue #5 Phase 2 - Unit Tests Documentation

## Overview

This document describes the comprehensive unit tests written for Issue #5 Phase 2: UI components for system selection and Draw Steel entity fields.

**Status**: RED Phase (TDD)
**Tests Written**: 170 total tests
**Tests Passing**: 0 (as expected - implementation doesn't exist yet)

These tests define the expected behavior BEFORE implementation. They will guide the development of:
1. SystemSelector component
2. Entity form utilities (`getSystemAwareEntityType`)
3. Settings page integration

## Test Files Created

### 1. SystemSelector Component Tests
**File**: `/home/evan/git/director-assist/src/lib/components/settings/SystemSelector.test.ts`
**Total Tests**: 58

#### Test Categories

**Basic Rendering (6 tests)**
- Component renders without crashing
- Renders as select element
- Displays label
- Renders all available system options
- Displays system names
- Has accessible label association

**System Descriptions (6 tests)**
- Shows description when `showDescription=true`
- Hides description when `showDescription=false`
- Hides description by default
- Updates description on selection change
- Handles systems without description
- Formats description text properly

**Selection Behavior (6 tests)**
- Calls `onchange` callback when selection changes
- Passes correct system ID to callback
- Doesn't call `onchange` on initial render
- Updates when value prop changes
- Handles rapid selection changes
- Reflects current selection visually

**Default Values (6 tests)**
- Defaults to "draw-steel" when no value provided
- Uses provided value over default
- Handles null value gracefully
- Handles undefined value gracefully
- Handles empty string value
- Handles unknown system ID

**Disabled State (6 tests)**
- Renders as disabled when `disabled=true`
- Renders as enabled when `disabled=false`
- Enabled by default
- Doesn't call `onchange` when disabled
- Shows visual disabled indication
- Shows disabled cursor

**Accessibility (6 tests)**
- Keyboard navigable
- Proper ARIA attributes
- Announces changes to screen readers
- Proper text contrast
- Visible focus indicator
- Descriptive accessible name

**System Profile Integration (4 tests)**
- Loads from BUILT_IN_SYSTEMS
- Handles custom systems
- Correct display order
- Handles empty systems array

**Styling and Layout (5 tests)**
- Consistent styling with other form elements
- Appropriate width
- Proper spacing
- Description placement
- Consistent text size

**Edge Cases (13 tests)**
- Undefined systems prop
- Empty systems array
- Missing onchange prop
- Very long system name
- Very long description
- Systems prop changes
- Selection persistence when systems change
- Selection reset when system removed
- Settings page context
- Campaign store integration
- Current campaign system on load
- Loading state during system change
- Error state handling

### 2. Entity Form Utils Tests
**File**: `/home/evan/git/director-assist/src/lib/utils/entityFormUtils.test.ts`
**Total Tests**: 60

#### Test Categories

**Basic Functionality (7 tests)**
- Returns base character definition without system
- Returns base NPC definition without system
- Returns base encounter definition without system
- Returns undefined for unknown entity type
- Handles null campaign gracefully
- Handles undefined campaign gracefully
- Handles campaign without systemId

**System Agnostic (3 tests)**
- Returns base definition for character
- Returns base definition for NPC
- Doesn't add extra fields

**Draw Steel Character (8 tests)**
- Adds Draw Steel character fields
- Includes ancestry field with correct options
- Includes class field with correct options
- Includes kit field
- Includes heroicResource field
- Maintains base character fields
- Orders fields appropriately
- Marks fields as not required by default

**Draw Steel NPC (7 tests)**
- Adds Draw Steel NPC fields
- Includes threatLevel field with correct options
- Includes role field with correct options
- Maintains base NPC fields
- Orders fields appropriately
- Marks fields as not required by default
- Handles role field name collision

**Draw Steel Encounter (7 tests)**
- Adds Draw Steel encounter fields
- Includes victoryPoints field
- Includes negotiationDC field
- Overrides encounterType options
- Maintains base encounter fields
- Orders fields appropriately
- Marks fields as not required by default

**Other Entity Types (8 tests)**
- Doesn't modify location for Draw Steel
- Doesn't modify faction for Draw Steel
- Doesn't modify item for Draw Steel
- Doesn't modify session for Draw Steel
- Doesn't modify deity for Draw Steel
- Doesn't modify timeline_event for Draw Steel
- Doesn't modify world_rule for Draw Steel
- Doesn't modify player_profile for Draw Steel

**Custom Entity Types (3 tests)**
- Returns custom entity type definition
- Doesn't apply system modifications to custom types
- Prefers custom type over built-in

**Entity Type Overrides (4 tests)**
- Applies overrides to system-aware definition
- Hides fields specified in override
- Adds additional fields from override
- Applies both system modifications and overrides

**Field Ordering (3 tests)**
- Sorts all fields by order property
- Places system fields after base fields
- Maintains order after applying overrides

**Performance and Caching (4 tests)**
- Returns consistent results for same inputs
- Handles multiple calls efficiently
- Doesn't mutate input campaign
- Returns new object references

**Error Handling (3 tests)**
- Handles malformed campaign metadata
- Handles invalid systemId
- Handles missing field definitions

**Integration (3 tests)**
- Works alongside getEntityTypeDefinition
- Works alongside applySystemModifications
- Works alongside getEntityTypeDefinitionWithSystem

### 3. Settings Page Integration Tests
**File**: `/home/evan/git/director-assist/src/tests/integration/settings-system-selector.test.ts`
**Total Tests**: 52

#### Test Categories

**System Selector Integration (4 tests)**
- Displays in settings page
- Has appropriate section heading
- Correct position on page
- Shows alongside other settings

**Current System Display (4 tests)**
- Shows current campaign system on load
- Shows system-agnostic as default
- Loads from campaignStore.getCurrentSystemProfile()
- Updates when campaign changes

**System Selection Changes (5 tests)**
- Calls campaignStore.setSystemProfile()
- Persists to database
- Updates campaignStore.campaign
- Triggers reactive updates throughout app
- Maintains selection after page reload

**Loading States (5 tests)**
- Shows loading indicator on page load
- Disables selector while loading
- Shows loading state during system change
- Re-enables after system change completes
- Prevents multiple simultaneous changes

**Error Handling (5 tests)**
- Displays error message on failure
- Reverts to previous selection on error
- Handles network/database errors gracefully
- Allows retry after failure
- Handles missing campaign gracefully

**System Description Display (3 tests)**
- Shows description when showDescription=true
- Updates description on selection change
- Hides description when showDescription=false

**Save Behavior (4 tests)**
- Saves immediately without separate save button
- Shows success feedback
- Doesn't lose other settings
- Handles concurrent setting changes

**User Experience (5 tests)**
- Clear labels and help text
- Shows which features are affected
- Warns about entity field changes
- Keyboard navigable
- Accessible to screen readers

**Multi-Campaign Scenarios (3 tests)**
- Shows different systems for different campaigns
- Maintains separate system settings per campaign
- Reloads selector when switching campaigns

**Interaction with Entity Forms (4 tests)**
- Affects character form fields
- Affects NPC form fields
- Affects encounter form fields
- Updates forms in real-time without reload

**Backwards Compatibility (3 tests)**
- Handles campaigns created before feature
- Allows setting system on legacy campaigns
- Preserves existing entity data

**Visual Design (4 tests)**
- Matches settings page design patterns
- Proper spacing and layout
- Works on mobile viewport
- Supports dark mode

**Documentation Integration (3 tests)**
- Links to system profile documentation
- Explains what changing system does
- Mentions terminology changes

## Test Strategy

### RED Phase (Current)
All tests are written to FAIL because the implementation doesn't exist yet. This follows the Test-Driven Development (TDD) approach:

1. **Write failing tests** - Define expected behavior (DONE)
2. **Implement code** - Make tests pass (TODO: senior-web-architect)
3. **Refactor** - Clean up implementation while keeping tests green (TODO)

### Key Testing Principles Applied

1. **Behavior over Implementation**
   - Tests focus on what the component does, not how it does it
   - Tests are resilient to refactoring

2. **Arrange-Act-Assert (AAA) Pattern**
   - Setup test data and conditions
   - Execute the behavior being tested
   - Verify the expected outcome

3. **Coverage Strategy**
   - Happy path: Normal, expected usage
   - Edge cases: Empty inputs, null values, maximum values
   - Error handling: Invalid inputs, exceptional conditions
   - Accessibility: Keyboard navigation, screen readers
   - Integration: Component interactions with stores and other components

4. **Test Independence**
   - Each test is isolated and can run independently
   - No shared mutable state between tests
   - beforeEach hooks reset state for each test

5. **Clear Test Names**
   - Names describe the expected behavior
   - Format: "should [expected behavior] when [condition]"
   - Failing test names immediately indicate what broke

## Running the Tests

### Run All Phase 2 Tests
```bash
npm run test -- --run src/lib/components/settings/SystemSelector.test.ts src/lib/utils/entityFormUtils.test.ts src/tests/integration/settings-system-selector.test.ts
```

### Run Individual Test Files
```bash
# SystemSelector component tests
npm run test -- --run src/lib/components/settings/SystemSelector.test.ts

# Entity form utils tests
npm run test -- --run src/lib/utils/entityFormUtils.test.ts

# Settings integration tests
npm run test -- --run src/tests/integration/settings-system-selector.test.ts
```

### Watch Mode (for development)
```bash
npm run test -- src/lib/components/settings/SystemSelector.test.ts
```

## Expected Test Results

### Current State (RED Phase)
```
✗ SystemSelector.test.ts (58 tests | 58 failed)
✗ entityFormUtils.test.ts (60 tests | 60 failed)
✗ settings-system-selector.test.ts (52 tests | 52 failed)

Total: 170 tests | 170 failed
```

### After Implementation (GREEN Phase)
```
✓ SystemSelector.test.ts (58 tests | 58 passed)
✓ entityFormUtils.test.ts (60 tests | 60 passed)
✓ settings-system-selector.test.ts (52 tests | 52 passed)

Total: 170 tests | 170 passed
```

## Implementation Guidance

### SystemSelector Component
The tests expect a Svelte 5 component with the following props:
- `value: string | null | undefined` - Current selected system ID
- `onchange: (systemId: string) => void` - Callback when selection changes
- `disabled: boolean` - Whether selector is disabled
- `showDescription: boolean` - Whether to show system description
- `systems: SystemProfile[]` - Available systems (optional, defaults to BUILT_IN_SYSTEMS)

### getSystemAwareEntityType Function
The tests expect a utility function with signature:
```typescript
function getSystemAwareEntityType(
  entityType: EntityType,
  campaign: BaseEntity | null | undefined
): EntityTypeDefinition | undefined
```

This function should:
1. Get the base entity type definition
2. Get the system profile from campaign metadata
3. Apply system modifications if system profile exists
4. Apply entity type overrides if they exist
5. Return the merged definition

### Settings Page Integration
The tests expect:
1. SystemSelector component added to settings page
2. Component bound to campaignStore.systemId
3. onchange handler calls campaignStore.setSystemProfile()
4. Proper loading and error handling
5. Immediate persistence (no separate save button)

## Next Steps

1. **Implementation Phase** (senior-web-architect)
   - Create SystemSelector.svelte component
   - Implement getSystemAwareEntityType utility
   - Integrate SystemSelector into settings page
   - Make all tests pass (GREEN phase)

2. **QA Phase** (qa-expert)
   - Verify all tests pass
   - Manual testing of UI
   - Accessibility testing
   - Cross-browser testing

3. **Documentation Phase** (docs-specialist)
   - Update user documentation
   - Add system selector usage guide
   - Document Draw Steel field additions

4. **Commit Phase** (git-manager)
   - Atomic commit: code + tests + docs together
   - Meaningful commit message
   - Reference Issue #5

## Related Files

### Existing System Profile Infrastructure
- `/home/evan/git/director-assist/src/lib/types/systems.ts` - System types
- `/home/evan/git/director-assist/src/lib/config/systems.ts` - Built-in system profiles
- `/home/evan/git/director-assist/src/lib/stores/campaign.svelte.ts` - Campaign store with system methods
- `/home/evan/git/director-assist/src/lib/config/entityTypes.ts` - Entity type definitions and helpers

### Test Patterns to Follow
- `/home/evan/git/director-assist/src/lib/components/ui/LoadingButton.test.ts` - Component testing patterns
- `/home/evan/git/director-assist/src/lib/components/entity/FieldRenderer.test.ts` - Field rendering patterns
- `/home/evan/git/director-assist/src/lib/stores/campaign.test.ts` - Store testing patterns

## Notes

- All tests use Vitest and @testing-library/svelte
- Tests follow Svelte 5 runes patterns ($state, $derived, $effect)
- Tests include comprehensive accessibility checks
- Tests cover both unit and integration scenarios
- Tests are written to be maintainable and readable
- Each test has clear comments explaining expected behavior
