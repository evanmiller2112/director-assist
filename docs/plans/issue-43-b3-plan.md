# Implementation Plan: Issue #43 Phase B3 - Suggestions Panel UI

## Overview

Phase B3 builds the user interface for displaying and interacting with AI suggestions. It creates a suggestions panel that integrates with the existing layout, featuring reactive state management, filtering/sorting, and action buttons.

## Architecture

```
+layout.svelte
├── dashboard-main
│   ├── Main Content (slot)
│   ├── SuggestionsPanel (when open)
│   └── ChatPanel (when open)

SuggestionsPanel Structure:
┌─────────────────────────────────────┐
│ Header: "AI Suggestions" + Badge(N) │
│ [Filter] [Sort] buttons             │
├─────────────────────────────────────┤
│ SuggestionFilters (collapsible)     │
├─────────────────────────────────────┤
│ SuggestionCard                      │
│ SuggestionCard                      │
│ ...                                 │
├─────────────────────────────────────┤
│ Empty/Loading state                 │
└─────────────────────────────────────┘
```

## File Structure

```
src/lib/
├── components/
│   └── suggestions/
│       ├── index.ts
│       ├── SuggestionsPanel.svelte
│       ├── SuggestionCard.svelte
│       ├── SuggestionFilters.svelte
│       └── *.test.ts
├── stores/
│   ├── suggestions.svelte.ts
│   └── suggestions.test.ts
```

## Implementation Order

1. Create store (`stores/suggestions.svelte.ts`) + tests
2. Update store index
3. Create SuggestionCard component + tests
4. Create SuggestionFilters component + tests
5. Create SuggestionsPanel component + tests
6. Create barrel export
7. Update UI store for panel toggle
8. Update Header with notification badge button
9. Update +layout.svelte to include panel

## Key Components

### SuggestionStore
- Reactive state with Svelte 5 runes
- Filter/sort state management
- `filteredSuggestions` derived
- `pendingCount` for badge
- Actions: accept, dismiss, load

### SuggestionCard
- Type icon and color based on suggestion type
- Relevance score badge
- Priority border (high/medium/low based on score)
- Hover actions (Accept, Dismiss, View Details)

### SuggestionFilters
- Type filter checkboxes with counts
- Status filter checkboxes
- Relevance slider (0-100)
- Reset button

### SuggestionsPanel
- Header with badge and controls
- Sort dropdown
- Filter toggle
- Scrollable card list
- Loading/empty/error states

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/stores/suggestions.svelte.ts` | Create |
| `src/lib/stores/suggestions.test.ts` | Create |
| `src/lib/stores/index.ts` | Modify |
| `src/lib/components/suggestions/index.ts` | Create |
| `src/lib/components/suggestions/SuggestionCard.svelte` | Create |
| `src/lib/components/suggestions/SuggestionFilters.svelte` | Create |
| `src/lib/components/suggestions/SuggestionsPanel.svelte` | Create |
| `src/lib/stores/ui.svelte.ts` | Modify |
| `src/lib/components/layout/Header.svelte` | Modify |
| `src/routes/+layout.svelte` | Modify |
