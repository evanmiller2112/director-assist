# Issue #284 Test Strategy: Scene Encounter Reference and Initiative Tracking

## Overview

This document describes the comprehensive test suite written for Issue #284, which adds three new fields to the Scene entity type for combat tracking:
- `encounterRef` - entity-ref field linking to an Encounter entity
- `currentRound` - number field for tracking combat rounds
- `initiativeOrder` - textarea for tracking turn order

## Test File Location

`/Users/evanmiller/git/director-assist/src/lib/config/entityTypes.scene-encounter-fields.test.ts`

## Testing Approach

### TDD Red Phase

All 57 tests were written BEFORE implementation following Test-Driven Development principles. The test suite is designed to:

1. **Verify field existence** - Ensure all three new fields are present
2. **Validate field types** - Confirm correct field types (entity-ref, number, textarea)
3. **Check field properties** - Verify required, placeholder, helpText, order, etc.
4. **Ensure integration** - Test field ordering and interaction with existing Scene fields
5. **Maintain backward compatibility** - Verify no breaking changes to existing Scene structure

### Test Results (RED Phase)

**Current Status:** 44 failing tests, 13 passing tests

- **Failing tests (44):** All field-specific tests for the three new fields - this is expected and correct
- **Passing tests (13):** Validation tests confirming existing Scene structure is intact

## Test Coverage Breakdown

### 1. Scene Type Validation (2 tests)
```typescript
✓ should have scene entity type defined
✓ should have sceneType field with combat option
```

**Purpose:** Validate that Scene entity exists and has the 'combat' option in sceneType field

**Coverage:**
- Scene entity type existence
- sceneType field has 'combat' as an option

---

### 2. encounterRef Field Tests (10 tests)
```typescript
× should have encounterRef field in Scene entity
× should have correct label
× should be an entity-ref field type
× should reference encounter entity type
× should not be required
× should have order property defined
× should have helpText explaining combat scene relevance
✓ should accept null/undefined as valid value
```

**Purpose:** Comprehensive validation of the encounterRef field

**Coverage:**
- Field existence and naming (`encounterRef`)
- Label: "Encounter"
- Type: `entity-ref`
- Entity type reference: `['encounter']`
- Required: `false` (optional)
- Order property: defined and numeric
- Help text: mentions 'combat'
- Accepts null/undefined values

---

### 3. currentRound Field Tests (10 tests)
```typescript
× should have currentRound field in Scene entity
× should have correct label
× should be a number field type
× should not be required
× should have order property defined
× should have placeholder suggesting starting value
× should have helpText explaining combat tracking
× should accept positive integer values
× should accept zero as valid value
✓ should have default value of null or undefined
```

**Purpose:** Validate the currentRound field for combat round tracking

**Coverage:**
- Field existence and naming (`currentRound`)
- Label: "Current Round"
- Type: `number`
- Required: `false` (optional)
- Order property: defined and numeric
- Placeholder: non-empty string
- Help text: contains 'combat'
- Accepts positive integers and zero
- Default value is null/undefined

---

### 4. initiativeOrder Field Tests (10 tests)
```typescript
× should have initiativeOrder field in Scene entity
× should have correct label
× should be a textarea field type
× should not be required
× should have order property defined
× should have placeholder with example format
× should have helpText explaining turn order tracking
× should accept multiline text content
× should accept empty string as valid value
```

**Purpose:** Validate the initiativeOrder field for turn order tracking

**Coverage:**
- Field existence and naming (`initiativeOrder`)
- Label: "Initiative Order"
- Type: `textarea`
- Required: `false` (optional)
- Order property: defined and numeric
- Placeholder: non-empty with example format
- Help text: matches /turn|initiative|order/
- Supports multiline text
- Accepts empty strings

---

### 5. Field Ordering and Integration (6 tests)
```typescript
× should place new fields after sceneType field
× should have encounterRef before currentRound
× should have currentRound before initiativeOrder
✓ should maintain unique order values across all fields
✓ should not duplicate existing field keys
× should increase total field count by 3
```

**Purpose:** Ensure proper field ordering and integration with existing Scene fields

**Coverage:**
- New fields appear after sceneType (order > 2)
- Logical ordering: encounterRef → currentRound → initiativeOrder
- No duplicate order values
- No duplicate field keys
- Total field count increases by 3 (from 10 to 13)

---

### 6. Field Relevance to Combat Scenes (4 tests)
```typescript
× should have encounterRef relevant only for combat scenes
× should have currentRound relevant only for combat scenes
× should have initiativeOrder relevant only for combat scenes
× should allow all fields to be null when sceneType is not combat
```

**Purpose:** Validate that fields are clearly marked for combat scene usage

**Coverage:**
- encounterRef help text contains 'combat'
- currentRound help text contains 'combat'
- initiativeOrder help text contains 'turn' or 'initiative'
- All fields are optional (can be null for non-combat scenes)

---

### 7. Field Type Validation (6 tests)
```typescript
× should validate encounterRef accepts entity ID strings
× should validate currentRound accepts numeric values
× should validate initiativeOrder accepts string values
✓ should not have options array for encounterRef
✓ should not have options array for currentRound
✓ should not have options array for initiativeOrder
```

**Purpose:** Ensure correct data types and field properties

**Coverage:**
- encounterRef is entity-ref type (stores entity IDs)
- currentRound is number type (stores numeric values)
- initiativeOrder is textarea type (stores string values)
- None of the fields have options arrays (not select fields)

---

### 8. Backward Compatibility (4 tests)
```typescript
✓ should not break existing Scene entity structure
✓ should maintain existing Scene relationships
✓ should maintain Scene entity type metadata
✓ should not modify order of existing fields
```

**Purpose:** Ensure no breaking changes to existing Scene functionality

**Coverage:**
- Essential existing fields still present (sceneStatus, sceneType, location)
- defaultRelationships maintained
- Entity type metadata unchanged (type, label, labelPlural, isBuiltIn)
- Existing field order preserved

---

### 9. Entity Reference Integrity (3 tests)
```typescript
× should only reference encounter entity type in encounterRef
× should not allow multiple entity types for encounterRef
× should handle missing encounter entity gracefully
```

**Purpose:** Validate entity reference behavior and constraints

**Coverage:**
- encounterRef only references 'encounter' type
- entityTypes array has exactly one element
- Optional field doesn't require a value (handles missing gracefully)

---

### 10. Use Case Scenarios (5 tests)
```typescript
× should support combat scene with all tracking fields populated
× should support non-combat scene with empty tracking fields
× should support tracking round progression during combat
× should support updating initiative order during combat
× should support linking scene to specific encounter entity
```

**Purpose:** Validate real-world usage scenarios

**Coverage:**
- Combat scene: all tracking fields available
- Non-combat scene: all tracking fields optional
- Round tracking: number field can be incremented
- Initiative updates: textarea allows editing
- Encounter linking: entity-ref creates relationship

---

## Test Organization

### Test Structure
```
describe('Scene Entity - Encounter Reference and Initiative Tracking Fields')
  ├─ Scene Type Validation (2 tests)
  ├─ encounterRef Field (10 tests)
  ├─ currentRound Field (10 tests)
  ├─ initiativeOrder Field (10 tests)
  ├─ Field Ordering and Integration (6 tests)
  ├─ Field Relevance to Combat Scenes (4 tests)
  ├─ Field Type Validation (6 tests)
  ├─ Backward Compatibility (4 tests)
  ├─ Entity Reference Integrity (3 tests)
  └─ Use Case Scenarios (5 tests)
```

### Test Patterns

**Field Definition Pattern:**
```typescript
it('should have [fieldName] field in Scene entity', () => {
  sceneType = getSceneType();
  field = sceneType?.fieldDefinitions.find((f) => f.key === '[fieldName]');
  expect(field).toBeDefined();
});
```

**Field Property Pattern:**
```typescript
it('should have correct label', () => {
  sceneType = getSceneType();
  field = sceneType?.fieldDefinitions.find((f) => f.key === '[fieldName]');
  expect(field?.label).toBe('[Expected Label]');
});
```

**Field Type Pattern:**
```typescript
it('should be a [type] field type', () => {
  sceneType = getSceneType();
  field = sceneType?.fieldDefinitions.find((f) => f.key === '[fieldName]');
  expect(field?.type).toBe('[type]');
});
```

---

## Key Testing Principles Applied

### 1. Behavior Testing
Tests focus on **what** the fields should do, not **how** they're implemented:
- Field existence and properties
- Field types and constraints
- Field relationships and ordering
- Usage scenarios

### 2. Edge Case Coverage
Tests cover boundary conditions:
- Null/undefined values (optional fields)
- Empty strings (textarea)
- Zero values (number field)
- Missing entity references

### 3. Integration Testing
Tests verify interaction with existing code:
- Field ordering relative to existing fields
- No duplicate keys or orders
- Backward compatibility maintained
- Entity type metadata preserved

### 4. Clear Test Names
Test names clearly describe expected behavior:
- ✅ `should have encounterRef field in Scene entity`
- ✅ `should be an entity-ref field type`
- ✅ `should not be required`
- ✅ `should place new fields after sceneType field`

### 5. Single Responsibility
Each test validates one specific aspect:
- One assertion per concept
- Clear failure messages
- Independent test cases

---

## Expected Implementation Changes

Based on the test suite, the implementation should add these fields to the Scene entity in `/src/lib/config/entityTypes.ts`:

```typescript
{
  key: 'encounterRef',
  label: 'Encounter',
  type: 'entity-ref',
  entityTypes: ['encounter'],
  required: false,
  order: [AFTER_SCENE_TYPE],
  helpText: 'Link to encounter for combat scenes'
}
```

```typescript
{
  key: 'currentRound',
  label: 'Current Round',
  type: 'number',
  required: false,
  order: [AFTER_ENCOUNTER_REF],
  placeholder: 'e.g., 1',
  helpText: 'Track current combat round'
}
```

```typescript
{
  key: 'initiativeOrder',
  label: 'Initiative Order',
  type: 'textarea',
  required: false,
  order: [AFTER_CURRENT_ROUND],
  placeholder: 'e.g., Character A (20), Enemy B (18), Character C (15)',
  helpText: 'Track initiative order for turn tracking'
}
```

---

## Next Steps

### GREEN Phase (Implementation)
1. Add the three fields to the Scene entity definition in `/src/lib/config/entityTypes.ts`
2. Set appropriate order values (after sceneType, which has order: 2)
3. Add help text explaining combat scene relevance
4. Run tests to verify all pass

### REFACTOR Phase (Optional)
1. Review field ordering across all Scene fields
2. Consider UI/UX implications for combat vs non-combat scenes
3. Update documentation if needed

---

## Test Quality Metrics

- **Total Tests:** 57
- **Coverage Areas:** 10 distinct categories
- **Field Coverage:** 100% (all new fields fully tested)
- **Backward Compatibility:** Protected (4 tests)
- **Use Case Validation:** Comprehensive (5 scenarios)
- **Edge Cases:** Covered (null, undefined, empty, zero values)

---

## Benefits of This Test Suite

1. **Specification as Code:** Tests document expected behavior
2. **Regression Protection:** Backward compatibility tests prevent breaking changes
3. **Implementation Guidance:** Tests show exactly what needs to be built
4. **Confidence:** Comprehensive coverage ensures quality
5. **Maintainability:** Clear test structure aids future modifications
6. **Documentation:** Tests serve as usage examples

---

## Test Execution

### Run All Tests
```bash
npm test -- entityTypes.scene-encounter-fields.test.ts
```

### Run Specific Test Suite
```bash
npm test -- entityTypes.scene-encounter-fields.test.ts -t "encounterRef Field"
```

### Watch Mode
```bash
npm test -- entityTypes.scene-encounter-fields.test.ts --watch
```

---

## Conclusion

This comprehensive test suite ensures that the Scene entity's new encounter tracking fields are properly implemented with:
- Correct field types and properties
- Proper integration with existing Scene structure
- Clear indication of combat scene relevance
- Full backward compatibility
- Support for all expected use cases

The tests follow TDD best practices and provide a clear specification for the implementation phase.
