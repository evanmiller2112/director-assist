# Implementation Plan: Issue #43 Phase B1 - Suggestion Data Model & Repository

## Overview

This plan covers Phase B1 of the AI Suggestions System (Issue #43), which establishes the data foundation for proactive AI analysis of campaigns.

## Current State Analysis

### Existing AISuggestion Interface

The current interface in `src/lib/types/ai.ts` (lines 55-64):

```typescript
export interface AISuggestion {
  id: EntityId;
  type: 'relationship' | 'plot_thread' | 'inconsistency' | 'enhancement';
  title: string;
  description: string;
  entityIds: EntityId[];
  suggestedAction?: string;
  dismissed: boolean;
  createdAt: Date;
}
```

### Required Changes (per Issue #43 spec)

1. Add `recommendation` type
2. Add `relevanceScore` (0-100)
3. Rename `entityIds` to `affectedEntityIds`
4. Change `suggestedAction` from string to structured object
5. Replace `dismissed: boolean` with `status: 'pending' | 'accepted' | 'dismissed'`
6. Add `expiresAt` for staleness handling

### Database Schema

Current `suggestions` table indexes: `'id, type, dismissed, createdAt'`

Needs updating to support new `status` field and `expiresAt`.

---

## Implementation Details

### 1. Update AISuggestion Interface

**File:** `src/lib/types/ai.ts`

```typescript
// Suggestion types that the AI can generate
export type AISuggestionType =
  | 'relationship'      // Suggests new relationships between entities
  | 'plot_thread'       // Identifies potential plot threads
  | 'inconsistency'     // Flags inconsistencies in campaign data
  | 'enhancement'       // Suggests improvements to existing entities
  | 'recommendation';   // General recommendations

// Status of a suggestion
export type AISuggestionStatus = 'pending' | 'accepted' | 'dismissed';

// Action types that can be suggested
export type SuggestionActionType =
  | 'create-relationship'
  | 'edit-entity'
  | 'create-entity'
  | 'flag-for-review';

// Structured suggested action
export interface SuggestedAction {
  actionType: SuggestionActionType;
  actionData: Record<string, unknown>;
}

// AI-generated suggestion (updated interface)
export interface AISuggestion {
  id: EntityId;
  type: AISuggestionType;
  title: string;
  description: string;
  relevanceScore: number; // 0-100, higher = more relevant
  affectedEntityIds: EntityId[];
  suggestedAction?: SuggestedAction;
  status: AISuggestionStatus;
  createdAt: Date;
  expiresAt?: Date; // When this suggestion becomes stale
}

// Query filters for suggestions
export interface SuggestionQueryFilters {
  types?: AISuggestionType[];
  statuses?: AISuggestionStatus[];
  affectedEntityIds?: EntityId[];
  minRelevanceScore?: number;
  includeExpired?: boolean;
}

// Statistics about suggestions
export interface SuggestionStats {
  total: number;
  byStatus: Record<AISuggestionStatus, number>;
  byType: Record<AISuggestionType, number>;
  expiredCount: number;
}
```

### 2. Update Database Schema

**File:** `src/lib/db/index.ts`

Add version 5 with updated indexes:

```typescript
// Version 5: Update suggestions table for new AISuggestion interface
this.version(5).stores({
  entities: 'id, type, name, *tags, createdAt, updatedAt',
  campaign: 'id',
  conversations: 'id, name, updatedAt',
  chatMessages: 'id, conversationId, timestamp',
  suggestions: 'id, type, status, createdAt, expiresAt, *affectedEntityIds',
  appConfig: 'key',
  relationshipSummaryCache: 'id, sourceId, targetId, relationship, generatedAt'
});
```

### 3. Create Suggestion Repository

**File:** `src/lib/db/repositories/suggestionRepository.ts` (new file)

#### Core CRUD Operations
- `add(suggestion)` - Create a new suggestion
- `getById(id)` - Get a single suggestion by ID
- `getAll()` - Get all suggestions as live query
- `update(id, changes)` - Update a suggestion
- `delete(id)` - Delete a suggestion
- `clearAll()` - Clear all suggestions

#### Status Operations
- `dismiss(id)` - Dismiss a suggestion
- `accept(id)` - Accept a suggestion
- `getByStatus(status)` - Get suggestions by status
- `getPendingCount()` - Get pending suggestions count

#### Query Operations
- `getByType(type)` - Get suggestions by type
- `getByAffectedEntity(entityId)` - Get suggestions affecting an entity
- `getByAffectedEntities(entityIds)` - Get suggestions affecting any of the entities
- `query(filters)` - Query with multiple filters

#### Expiration Handling
- `getExpired()` - Get expired suggestions
- `deleteExpired()` - Delete all expired suggestions
- `isExpired(suggestion)` - Check if a suggestion is expired
- `getActive()` - Get non-expired pending suggestions

#### Utility Operations
- `bulkAdd(suggestions)` - Bulk add suggestions
- `getStats()` - Get statistics

### 4. Update Repository Index

**File:** `src/lib/db/repositories/index.ts`

```typescript
export { suggestionRepository } from './suggestionRepository';
```

---

## Implementation Order

1. **Update types** (`types/ai.ts`)
2. **Update database schema** (`db/index.ts`)
3. **Create repository** (`db/repositories/suggestionRepository.ts`)
4. **Update repository index** (`db/repositories/index.ts`)
5. **Write tests** (`db/repositories/suggestionRepository.test.ts`)

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/types/ai.ts` | Modify - Update AISuggestion interface |
| `src/lib/db/index.ts` | Modify - Add schema version 5 |
| `src/lib/db/repositories/suggestionRepository.ts` | Create - New repository |
| `src/lib/db/repositories/index.ts` | Modify - Export new repository |
| `src/lib/db/repositories/suggestionRepository.test.ts` | Create - Unit tests |

---

## Edge Cases and Considerations

1. **Expiration Handling**: Suggestions without `expiresAt` never expire
2. **Relevance Score**: Clamp values to 0-100 range on add
3. **Backward Compatibility**: Migrate old `dismissed: boolean` to new `status` field
4. **Empty Arrays**: `affectedEntityIds` can be empty for campaign-wide suggestions
