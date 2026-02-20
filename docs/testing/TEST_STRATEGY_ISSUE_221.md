# Test Strategy: Template-Based Entity Duplication (Issue #221)

## Overview

Comprehensive unit tests for the entity duplication service that enables template-based quick duplication of entities. Tests follow TDD (Test-Driven Development) principles, written in the RED phase before implementation.

## Test Files Created

1. `/src/lib/services/entityDuplicationService.test.ts` - Main test suite (42 tests)
2. `/src/lib/services/entityDuplicationService.ts` - Service interface definition

## Test Coverage Summary

### 1. Basic Duplication (5 tests)
Tests fundamental duplication behavior:
- Duplicate entity with new name
- Generate default name pattern: `"{originalName} (Copy)"`
- Create new timestamps (createdAt, updatedAt)
- Persist duplicated entity to database
- Error handling for non-existent source entities

### 2. Field Duplication (6 tests)
Ensures all field types are properly copied:
- Deep copy all field values (strings, numbers, booleans, arrays)
- Preserve custom fields from entity type definitions
- Handle empty fields object
- Preserve rich text and markdown content
- Handle null and undefined field values
- Support complex field structures

### 3. Entity-Ref Field Handling (6 tests)
Tests handling of entity reference fields:
- Clear single entity-ref fields by default (set to null)
- Preserve entity-ref fields when option specified
- Clear entity-refs fields (multiple references) by default (set to empty array)
- Preserve entity-refs fields when option specified
- Correctly identify and handle mixed field types
- Use entity type definition to determine which fields are entity-refs

**Design Decision**: Entity-ref fields should be cleared by default because:
- Duplicated entities typically represent new, independent instances
- Preserving references could create unintended relationships
- Users can opt-in to preserve references when needed (e.g., creating multiple NPCs in same location)

### 4. Relationship Handling (6 tests)
Tests duplication of entity relationships (links):
- Clear all relationships by default
- Preserve relationships when option specified
- Generate new link IDs for preserved relationships
- Update sourceId to new entity ID in preserved links
- Create new timestamps for preserved links
- Avoid creating bidirectional reverse links (prevents duplicates)

**Design Decision**: Relationships should NOT automatically create reverse links because:
- This would modify other entities without user action
- User should explicitly establish relationships after duplication
- Avoids unexpected side effects and data integrity issues

### 5. Metadata and Core Properties (9 tests)
Verifies preservation of entity metadata:
- Preserve description field
- Deep copy tags array
- Preserve imageUrl
- Preserve notes field
- Preserve playerVisible setting
- Deep copy metadata object
- Preserve entity type
- Handle empty description and notes
- Immutability (modifications to copy don't affect original)

### 6. Template-Based Use Cases (3 tests)
Real-world scenarios demonstrating practical usage:
- Create multiple NPCs from a template (guards, merchants)
- Create multiple monsters from a template (minions, standard enemies)
- Create location variants from a template (villages, dungeons)

**Use Case**: A DM creates a "Town Guard" template NPC with standardized fields (occupation, armor class, hit points, weapon). They can quickly duplicate this template to create "Guard Marcus", "Guard Elena", "Guard Thorin", etc., with identical field structures but unique IDs and names.

### 7. Options and Configuration (2 tests)
Tests the options API:
- Accept all duplication options together (newName, preserveEntityRefs, preserveRelationships)
- Handle options with default values correctly

### 8. Edge Cases and Error Handling (10 tests)
Robustness testing:
- Handle entities with no fields
- Handle entities with no tags
- Handle entities with no relationships
- Handle very long entity names (500+ characters)
- Handle special characters in names (`O'Malley's Tavern & Inn`)
- Handle Unicode characters in fields (雷神トール, Привет, 你好, ⚔️)
- Handle undefined metadata
- Empty arrays and objects
- Boundary conditions

### 9. Integration with Entity Type Definitions (1 test)
Tests integration with the entity type system:
- Identify entity-ref fields based on entity type definition
- Use field type metadata to determine clearing behavior
- Support custom entity types (e.g., `ds-monster-threat`)

## Service Interface Design

### Function Signature
```typescript
async function duplicateEntity(
  sourceEntityId: string,
  options?: DuplicateEntityOptions
): Promise<BaseEntity>
```

### Options Interface
```typescript
interface DuplicateEntityOptions {
  newName?: string;              // Custom name (default: "{originalName} (Copy)")
  preserveEntityRefs?: boolean;  // Keep entity reference fields (default: false)
  preserveRelationships?: boolean; // Keep relationships (default: false)
}
```

## Key Design Decisions

### 1. Entity-Ref Fields Default Behavior: CLEAR
**Rationale**: Duplicated entities are typically new, independent instances. Preserving entity references could create unintended relationships and confusion. Users can opt-in via `preserveEntityRefs: true` when needed.

**Examples**:
- ✅ Good: Duplicate guard template → clear home location (each guard gets assigned their own post)
- ✅ Good: Duplicate NPC → clear mentor reference (new NPC is independent)
- ✅ Good: Duplicate character → preserve faction membership (both characters in same faction)

### 2. Relationships Default Behavior: CLEAR
**Rationale**: Relationships represent explicit connections between entities. Copying relationships could create unexpected graph structures. Users should explicitly re-establish relationships after duplication.

**Examples**:
- ✅ Good: Duplicate character → clear faction membership (user re-adds to faction if needed)
- ✅ Good: Duplicate NPC → clear location (user places NPC in new location)

### 3. Bidirectional Links: NO AUTO-REVERSE
**Rationale**: Creating reverse links would modify other entities without explicit user action. This violates the principle of least surprise and could cause data integrity issues.

**Examples**:
- ❌ Bad: Duplicate character with bidirectional faction link → automatically add duplicate to faction's members list
- ✅ Good: Duplicate character → preserve bidirectional flag on link, but don't modify faction entity

### 4. Deep Cloning
All nested structures (arrays, objects, field values) are deep cloned to prevent reference sharing between original and duplicate.

**Techniques**:
- Use `JSON.parse(JSON.stringify())` for deep cloning
- Generate new IDs for entity and preserved links (using `nanoid()`)
- Create new Date objects for timestamps

### 5. Entity Type Definition Integration
The service should look up the entity type definition to determine which fields are entity-ref or entity-refs types, enabling intelligent field handling.

**Implementation Note**: The service should use `getEntityTypeDefinition(entityType)` from `$lib/config/entityTypes` to inspect field definitions.

## Test Execution Results (RED Phase)

All 42 tests are currently **FAILING** as expected:
```
❯ src/lib/services/entityDuplicationService.test.ts (42 tests | 42 failed)
       × should duplicate an entity with a new name
       × should generate a default name if none provided
       ... (40 more tests)
```

Error message: `"Not implemented yet - RED phase"`

## Next Steps for Implementation (GREEN Phase)

1. **Implement core duplication logic**:
   - Fetch source entity from database
   - Generate new ID and timestamps
   - Deep clone entity structure

2. **Implement field handling**:
   - Look up entity type definition
   - Identify entity-ref and entity-refs fields
   - Apply clearing/preservation logic based on options

3. **Implement relationship handling**:
   - Clear or preserve links based on options
   - Generate new link IDs
   - Update sourceId references
   - Create new timestamps

4. **Implement persistence**:
   - Use `entityRepository.create()` to persist
   - Handle Svelte 5 $state proxy stripping (already handled in repository)

5. **Error handling**:
   - Validate source entity exists
   - Handle database errors gracefully

## UI Integration Considerations

### Duplicate Button Placement
The duplicate button should appear on entity detail pages (`/entities/[type]/[id]`):

**Suggested Location**: In the header toolbar, next to Edit and Delete buttons:
```
[← Back] [Edit] [Duplicate] [Delete] [+ Add Relationship]
```

**Button Design**:
- Icon: `Copy` from lucide-svelte
- Text: "Duplicate"
- Behavior: Opens modal for duplication options

### Duplication Modal
A modal should appear when clicking the Duplicate button:

**Modal Contents**:
- **Name field**: Pre-filled with `"{originalName} (Copy)"`, editable
- **Checkbox**: "Keep entity references" (default: unchecked)
- **Checkbox**: "Keep relationships" (default: unchecked)
- **Buttons**: [Cancel] [Duplicate]

**After Duplication**:
- Navigate to edit page of new entity: `/entities/{type}/{newId}/edit`
- Show success notification: "Entity duplicated successfully"
- Allow user to immediately customize the duplicate

## Testing Philosophy

These tests embody several key testing principles:

1. **Test Behavior, Not Implementation**: Tests verify what the service does, not how it does it.

2. **Comprehensive Coverage**: Tests cover happy paths, edge cases, error conditions, and real-world use cases.

3. **Clear Test Names**: Test names read like specifications (e.g., "should clear entity-ref fields by default").

4. **Arrange-Act-Assert Pattern**: Each test clearly separates setup, execution, and verification.

5. **Isolation**: Each test is independent and can run in any order.

6. **RED Phase Verification**: All tests fail initially, proving they test real functionality.

## Estimated Complexity

**Implementation Complexity**: Moderate

**Estimated Time**: 2-3 hours
- Core logic: 1 hour
- Entity-ref detection: 30 minutes
- Relationship handling: 30 minutes
- Testing and refinement: 1 hour

**Dependencies**:
- Entity type definition lookup (`getEntityTypeDefinition`)
- Entity repository (`entityRepository.create`)
- ID generation (`nanoid`)
- Database access (`db.entities`)

## Success Criteria

Implementation is complete when:
- ✅ All 42 tests pass (GREEN phase)
- ✅ TypeScript type checking passes
- ✅ No console errors or warnings
- ✅ Service integrates with existing entity system
- ✅ Performance is acceptable (duplication completes in <100ms)
