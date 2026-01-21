# Drag and Drop Test Documentation (Issue #205)

## Overview
This document describes the failing tests for the drag and drop bug in Sidebar.svelte (RED phase of TDD).

## Bug Description
**Issue #205**: Entity list drag and drop reorder is non-functional

**Root Cause**: The `svelte-dnd-action` library requires all items passed to the `dndzone` directive to have a unique `id` property. However, `EntityTypeDefinition` objects only have a `type` property and no `id` property.

## Test Files
1. `/home/evan/git/director-assist/src/lib/components/layout/Sidebar.dragdrop.test.ts` - Focused drag-and-drop tests
2. `/home/evan/git/director-assist/src/lib/components/layout/Sidebar.integration.test.ts` - Integration tests (some existing tests may be affected)

## Key Failing Test

### Test: "should fail: EntityTypeDefinition does not have id property (demonstrates bug)"

**Location**: `Sidebar.dragdrop.test.ts`

**Purpose**: Demonstrates that `EntityTypeDefinition` lacks the `id` property required by `svelte-dnd-action`

**Expected Behavior After Fix**: This test should PASS after the implementation adds the `id` property

**Current Behavior**: FAILS because `EntityTypeDefinition` objects don't have an `id` property

```typescript
const entityType: EntityTypeDefinition = {
  type: 'character',
  label: 'Character',
  labelPlural: 'Player Characters',
  icon: 'user',
  color: 'blue',
  isBuiltIn: true,
  fieldDefinitions: [],
  defaultRelationships: []
};

// This currently FAILS - entityType has no id property
expect(entityType).toHaveProperty('id');
```

## Requirements Documented in Tests

### 1. Data Structure Requirements
- **Test**: "should transform EntityTypeDefinition items to include id property for dndzone"
- **Requirement**: Items passed to `dndzone` must have an `id` property
- **Implementation**: Transform `EntityTypeDefinition[]` to include `id` before passing to `dndzone`

### 2. ID Value Convention
- **Test**: "should use EntityType.type as the unique id for each item"
- **Requirement**: Use `type` field as the `id` value (ensures uniqueness)
- **Implementation**: `{ ...entityType, id: entityType.type }`

### 3. Property Preservation
- **Test**: "should preserve all EntityTypeDefinition properties while adding id"
- **Requirement**: Adding `id` must not lose any existing properties
- **Implementation**: Use spread operator to maintain all original properties

### 4. Event Handler Integration
- **Test**: "should update orderedTypes when consider event fires during drag"
- **Requirement**: `handleDndConsider` must work with items that have `id`
- **Implementation**: Handler receives items from svelte-dnd-action with `id` property

### 5. Persistence
- **Test**: "should persist new order to localStorage when drag finishes"
- **Requirement**: `handleDndFinalize` must extract `type` from items and save order
- **Implementation**: `orderedTypes.map((t) => t.type)` still works after adding `id`

## Expected Fix

The fix should modify `Sidebar.svelte` to:

1. **Transform items before passing to dndzone**:
   ```svelte
   $: orderedTypesWithId = orderedTypes.map(t => ({ ...t, id: t.type }));
   ```

2. **Update dndzone usage**:
   ```svelte
   use:dndzone={{ items: orderedTypesWithId, flipDurationMs, type: 'entityTypes' }}
   ```

3. **Update handleDndConsider**:
   ```typescript
   function handleDndConsider(e: CustomEvent<DndEvent<EntityTypeDefinition & { id: string }>>) {
     const itemsWithId = e.detail.items;
     orderedTypes = itemsWithId.map(({ id, ...rest }) => rest as EntityTypeDefinition);
   }
   ```

4. **Update handleDndFinalize**:
   ```typescript
   function handleDndFinalize(e: CustomEvent<DndEvent<EntityTypeDefinition & { id: string }>>) {
     const itemsWithId = e.detail.items;
     orderedTypes = itemsWithId.map(({ id, ...rest }) => rest as EntityTypeDefinition);
     const newOrder = orderedTypes.map((t) => t.type);
     setSidebarEntityTypeOrder(newOrder);
   }
   ```

5. **Update each block to use matching key**:
   ```svelte
   {#each orderedTypesWithId as entityType (entityType.id)}
   ```

## Running the Tests

To run the drag-and-drop specific tests:
```bash
npm test -- src/lib/components/layout/Sidebar.dragdrop.test.ts
```

To run all sidebar tests:
```bash
npm test -- src/lib/components/layout/Sidebar
```

## Test Status (RED Phase)

Current Status: **RED** (1 test failing as expected)

| Test Category | Status | Count |
|--------------|--------|-------|
| Data Structure Requirements | ✓ PASS | 3 |
| Event Handler Tests | ✓ PASS | 2 |
| Integration Tests | ✓ PASS | 3 |
| Bug Demonstration | ✗ FAIL | 1 |
| Edit Mode UI | ✓ PASS | 3 |

**Total**: 12 passed, 1 failed (expected)

## Next Steps (GREEN Phase)

After fixing the implementation in `Sidebar.svelte`:

1. Run tests to verify they all PASS
2. Test manually in the browser that drag-and-drop works
3. Verify order is persisted to localStorage
4. Ensure no regression in existing functionality

## References

- Issue: #205
- File: `/home/evan/git/director-assist/src/lib/components/layout/Sidebar.svelte`
- Library: [svelte-dnd-action](https://github.com/isaacHagoel/svelte-dnd-action)
- Documentation: Items must have unique `id` property (string or number)
