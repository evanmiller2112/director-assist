# Narrative Event Entity Type Tests - Test Strategy

## Overview

This test suite validates the `narrative_event` entity type for Issue #398. Following TDD best practices, these tests were written in the RED phase and will FAIL until the implementation is complete.

## Testing Strategy

### 1. Entity Type Existence
- Verifies `narrative_event` exists in `BUILT_IN_ENTITY_TYPES`
- Confirms it's retrievable via `getEntityTypeDefinition()`

### 2. Metadata Validation
Tests that the entity type has correct metadata:
- Type identifier: `'narrative_event'`
- Label: `'Narrative Event'`
- Label Plural: `'Narrative Events'`
- Icon: `'milestone'`
- Color: `'amber'`
- Built-in flag: `true`
- Default relationships array defined

### 3. Field Definitions Coverage

#### eventType Field
- **Type**: `select`
- **Label**: `'Event Type'`
- **Options**: `['scene', 'combat', 'montage', 'negotiation', 'other']`
- **Required**: `true`
- **Order**: `1`

**Test Coverage**:
- Field exists
- Correct label and type
- Exactly 5 options with correct values
- Required flag set
- Proper order value

#### sourceId Field
- **Type**: `text`
- **Label**: `'Source ID'`
- **Required**: `false`
- **Order**: `2`
- **Help Text**: `'ID of the linked combat, montage, or scene'`

**Test Coverage**:
- Field exists
- Correct label and type
- Not required (optional)
- Help text present and correct
- Proper order value

#### outcome Field
- **Type**: `text`
- **Label**: `'Outcome'`
- **Required**: `false`
- **Order**: `3`

**Test Coverage**:
- Field exists
- Correct label and type
- Not required (optional)
- Proper order value

#### session Field
- **Type**: `entity-ref`
- **Label**: `'Session'`
- **Entity Types**: `['session']`
- **Required**: `false`
- **Order**: `4`

**Test Coverage**:
- Field exists
- Correct label and type
- References correct entity type
- Not required (optional)
- Proper order value

### 4. Field Ordering Tests
- All fields have `order` property defined
- Order values are unique (no duplicates)
- Order values are consecutive (1, 2, 3, 4)
- Fields appear in correct sequence

### 5. Default Relationships
Tests the three required default relationships:
- `'leads_to'` - for sequential narrative events
- `'follows'` - for reverse sequential relationships
- `'part_of'` - for session association

**Test Coverage**:
- Exactly 3 relationships
- Each relationship is present
- Relationships are in correct order

### 6. Integration Tests

#### Built-in Types Count
- Verifies total built-in types count is 13 (12 original + narrative_event)
- Ensures unique type identifier (no duplicates)
- No duplicate field keys within the entity type

#### Default Type Order
- `narrative_event` is included in `getDefaultEntityTypeOrder()`
- Appears exactly once in the default order
- Total default order count is 13

### 7. Type Validation
- All fields use valid field types from the FieldType union
- Required field configuration is correct (only eventType is required)
- Type identifier is valid for TypeScript EntityType union

## Expected Test Results (RED Phase)

All 49 tests should FAIL with the following patterns:

1. **Existence tests**: `undefined` returned (entity type doesn't exist yet)
2. **Metadata tests**: Properties are `undefined`
3. **Field tests**: Fields not found in definitions
4. **Order tests**: Empty array causes failures
5. **Relationship tests**: Array is `undefined` or empty
6. **Integration tests**: Count mismatches (12 vs expected 13)

## Test Philosophy

Following the test strategy for entity types established in the codebase:

1. **Comprehensive Coverage**: Test all aspects of the entity type definition
2. **Granular Assertions**: Each test verifies one specific aspect
3. **Clear Intent**: Test names describe expected behavior
4. **Behavioral Testing**: Focus on the interface, not implementation
5. **Deterministic**: Tests are isolated and repeatable

## Next Steps (GREEN Phase)

After these tests pass, the implementation should:

1. Add `narrative_event` to `BUILT_IN_ENTITY_TYPES` array in `entityTypes.ts`
2. Add `'narrative_event'` to `EntityType` union in `entities.ts`
3. Update `getDefaultEntityTypeOrder()` to include `'narrative_event'`

The tests will guide the implementation to ensure all requirements are met.

## Test Coverage

- **Total Tests**: 54
- **Failing Tests (expected)**: 49
- **Passing Tests**: 5 (type-agnostic utility tests)

Coverage includes:
- ✅ Type existence and retrieval
- ✅ Metadata completeness
- ✅ All 4 field definitions with full property validation
- ✅ Field ordering and uniqueness
- ✅ Default relationships (3 total)
- ✅ Integration with existing entity type system
- ✅ Default order inclusion
- ✅ Type validation
