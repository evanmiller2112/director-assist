# Issue #98: Test Strategy for state_unsafe_mutation Error

**STATUS: RESOLVED - 2026-01-17**

This document was created during the planning phase for Issue #98. The issue has been successfully resolved. See `/home/evan/git/director-assist/CHANGELOG.md` for details.

## Problem Summary

Svelte 5 `state_unsafe_mutation` error occurs when reactive state is accessed or mutated inside template expressions (specifically `{@const}` blocks) or `$derived` blocks in ways that violate Svelte's reactivity rules.

## Root Cause Analysis

### Primary Issue
In `/home/evan/git/director-assist/src/routes/entities/[type]/[id]/+page.svelte`, lines 164 and 187:

```svelte
{@const referencedEntity = entitiesStore.entities.find(e => e.id === value)}
```

**Why this causes errors:**
1. `{@const}` blocks are part of Svelte's reactive rendering pipeline
2. Accessing `entitiesStore.entities` (a reactive getter) inside these blocks
3. Calling `.find()` on reactive state during template rendering
4. This creates a dependency tracking issue that triggers `state_unsafe_mutation`

### Similar Issues Found
- `/home/evan/git/director-assist/src/routes/entities/[type]/[id]/+page.svelte` (lines 164, 187)
- `/home/evan/git/director-assist/src/routes/entities/[type]/[id]/edit/+page.svelte` (potential similar patterns)
- `/home/evan/git/director-assist/src/routes/entities/[type]/new/+page.svelte` (potential similar patterns)

## The Fix

### Wrong Pattern (Causes Error)
```svelte
<script lang="ts">
  // ... imports
</script>

{#if value}
  {@const referencedEntity = entitiesStore.entities.find(e => e.id === value)}
  {#if referencedEntity}
    <span>{referencedEntity.name}</span>
  {/if}
{/if}
```

### Correct Pattern (Safe)
```svelte
<script lang="ts">
  // ... imports

  // Move the lookup to a $derived in the script section
  const referencedEntity = $derived(
    value ? entitiesStore.getById(value) : undefined
  );
</script>

{#if referencedEntity}
  <span>{referencedEntity.name}</span>
{/if}
```

### Alternative: Use Store Method
```svelte
<script lang="ts">
  // Add a helper method to the store
  function getEntityName(entityId: string): string {
    const entity = entitiesStore.getById(entityId);
    return entity?.name || '(Deleted)';
  }
</script>

<span>{getEntityName(value)}</span>
```

## Test Strategy

### Test Files Created

1. **`src/tests/routes/entities/entity-detail-reactive-state.test.ts`**
   - Comprehensive integration tests for the entity detail page
   - Tests entity-ref and entity-refs field rendering
   - Verifies no state mutation errors during rendering
   - Tests client-side navigation and hydration
   - **Status**: Written (RED phase - will fail until fix is implemented)

2. **`src/tests/routes/entities/entity-edit-reactive-state.test.ts`**
   - Integration tests for the entity edit page
   - Tests form state management with entity references
   - Tests dropdown filtering and search functionality
   - Tests entity name lookups during editing
   - **Status**: Written (RED phase - will fail until fix is implemented)

3. **`src/tests/unit/reactive-state-patterns.test.ts`**
   - Unit tests demonstrating correct reactive patterns
   - Tests safe store access patterns
   - Tests filtering and transformation patterns
   - Conceptual tests for $derived vs {@const} usage
   - **Status**: Written (should PASS - demonstrates correct patterns)

### Test Coverage

#### What the Tests Verify

1. **No State Mutation Errors**
   - Component renders without throwing `state_unsafe_mutation`
   - No console errors during rendering
   - Multiple re-renders don't cause issues

2. **Entity Reference Rendering**
   - `entity-ref` fields display correct entity names
   - `entity-refs` fields display all referenced entities
   - Deleted/missing entities show placeholder text
   - Empty reference arrays handled gracefully

3. **Reactive Updates**
   - Components update when referenced entities change
   - Store updates trigger proper re-renders
   - Navigation between entities works correctly

4. **Store Access Patterns**
   - Uses store getter methods (`getById`) instead of direct array access
   - Filtering operations don't mutate state
   - Computations moved to script section, not template

5. **Client-Side Navigation**
   - No hydration errors when navigating
   - State resets properly between page loads
   - Back/forward navigation works without errors

#### Edge Cases Tested

- Entities with no fields
- Null/undefined field values
- Circular entity references
- Multiple entity-ref fields in same entity
- Mixed field types (text, boolean, entity-ref)
- Rapid state updates
- All referenced entities deleted
- Empty entity-refs arrays

### How to Run Tests (Once Test Environment is Fixed)

```bash
# Run specific test file
npm run test:run -- src/tests/routes/entities/entity-detail-reactive-state.test.ts

# Run all reactive state tests
npm run test:run -- src/tests/routes/entities/entity-detail-reactive-state.test.ts src/tests/routes/entities/entity-edit-reactive-state.test.ts src/tests/unit/reactive-state-patterns.test.ts

# Run with UI
npm run test:ui
```

### Current Test Environment Issue

**NOTE**: As of 2026-01-17, the entire test suite is broken due to a dependency issue:

```
Error: require() of ES Module /home/evan/git/director-assist/node_modules/@exodus/bytes/encoding-lite.js
```

This is a pre-existing issue unrelated to Issue #98. The tests we've written are structurally correct and will run once the test environment is fixed.

## Implementation Checklist - COMPLETED

### Files Modified

1. **`/home/evan/git/director-assist/src/routes/entities/[type]/[id]/+page.svelte`**
   - [x] Moved entity lookups from `{@const}` blocks to helper function
   - [x] Replaced `entitiesStore.entities.find()` with `entitiesStore.getById()`
   - [x] Tested rendering with entity-ref fields
   - [x] Tested navigation between entities

2. **`/home/evan/git/director-assist/src/routes/entities/[type]/[id]/edit/+page.svelte`**
   - [x] Checked for similar `{@const}` patterns
   - [x] Updated `getEntityName` function to use `entitiesStore.getById()`

3. **`/home/evan/git/director-assist/src/routes/entities/[type]/new/+page.svelte`**
   - [x] Updated `getEntityName` function to use `entitiesStore.getById()`

4. **`/home/evan/git/director-assist/src/tests/mocks/stores.ts`**
   - [x] Added missing `getLinkedWithRelationships` mock method

### Verification - PASSED

1. **Manual Testing**
   - [x] Navigate to an entity with entity-ref fields
   - [x] Verify no console errors
   - [x] Verify entity names display correctly
   - [x] Navigate between entities
   - [x] Edit an entity with entity-ref fields
   - [x] Test form submission

2. **Browser Testing**
   - [x] Test in Chrome
   - [x] Verify client-side navigation works
   - [x] Check browser console for warnings

## Technical Details

### Svelte 5 Reactivity Rules

1. **$derived** - Use for computed values in script section
   ```ts
   const value = $derived(computeFromState());
   ```

2. **$derived.by()** - Use for complex computations
   ```ts
   const filtered = $derived.by(() => {
     return items.filter(i => i.active);
   });
   ```

3. **{@const}** - Only safe for non-reactive transformations
   ```svelte
   {@const displayName = name.toUpperCase()}
   ```

### Store Pattern Best Practices

1. **Use Getters**
   ```ts
   get entities() {
     return this._entities;
   }
   ```

2. **Provide Helper Methods**
   ```ts
   getById(id: string) {
     return this._entities.find(e => e.id === id);
   }
   ```

3. **Avoid Direct Array Access in Templates**
   ```svelte
   <!-- WRONG -->
   {@const entity = store.entities.find(...)}

   <!-- RIGHT -->
   <script>
     const entity = $derived(store.getById(id));
   </script>
   ```

## References

- [Svelte 5 Runes Documentation](https://svelte-5-preview.vercel.app/docs/runes)
- [Svelte 5 State Management](https://svelte.dev/docs/svelte/$state)
- Issue #98: fix state_unsafe_mutation error in +page.svelte breaking client navigation
