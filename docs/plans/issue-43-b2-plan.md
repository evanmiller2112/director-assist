# Implementation Plan: Issue #43 Phase B2 - Suggestion Analysis Engine Service

## Overview

This plan covers Phase B2 of the AI Suggestions System (Issue #43), which implements the analysis engine that generates proactive AI suggestions for campaign data. Building on Phase B1 (AISuggestion types and suggestionRepository), this phase creates algorithms for detecting relationship opportunities, inconsistencies, enhancement needs, and plot threads.

## Architecture Overview

The Analysis Engine uses a **hybrid approach**:
1. **Local Heuristics**: Fast, non-API algorithms for detecting patterns
2. **AI-Powered Analysis**: API calls only for complex semantic analysis
3. **Batching & Rate Limiting**: Throttle API calls to prevent overuse

```
┌─────────────────────────────────────────────────────────────────┐
│                    SuggestionAnalysisService                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Heuristic      │  │  AI-Powered     │  │  Coordinator    │  │
│  │  Analyzers      │  │  Analyzers      │  │  & Scheduler    │  │
│  │                 │  │                 │  │                 │  │
│  │ - Inconsistency │  │ - Plot Thread   │  │ - Rate Limiter  │  │
│  │ - Enhancement   │  │ - Relationship  │  │ - Batch Manager │  │
│  │ - Orphan Entity │  │   (from text)   │  │ - Deduplication │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   suggestionRepository                       ││
│  │           (Created in Phase B1 - stores suggestions)         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/lib/services/
├── suggestionAnalysisService.ts          # Main orchestrator
├── suggestionAnalysisService.test.ts     # Unit tests
├── analyzers/                            # Analysis modules
│   ├── index.ts                          # Barrel export
│   ├── types.ts                          # Shared types
│   ├── inconsistencyAnalyzer.ts          # Detect data conflicts
│   ├── inconsistencyAnalyzer.test.ts
│   ├── enhancementAnalyzer.ts            # Detect sparse entities
│   ├── enhancementAnalyzer.test.ts
│   ├── relationshipAnalyzer.ts           # Suggest relationships
│   ├── relationshipAnalyzer.test.ts
│   ├── plotThreadAnalyzer.ts             # Detect recurring themes
│   └── plotThreadAnalyzer.test.ts
└── index.ts                              # Update exports
```

---

## Analyzer Specifications

### 1. Inconsistency Analyzer (Heuristic-based)

Detects:
- **Location Conflicts**: Entity has multiple incompatible location references
- **Status Conflicts**: Relationships to deceased entities from active contexts
- **Name Duplicates**: Similar names that might be the same entity
- **Relationship Asymmetry**: Bidirectional relationship missing reverse link

### 2. Enhancement Analyzer (Heuristic-based)

Detects:
- **Sparse Entities**: Minimal description/fields filled
- **No Summary**: Important entities without AI summaries
- **Orphan Entities**: No relationships to other entities
- **Missing Core Fields**: Required-like fields that are empty

### 3. Relationship Analyzer (Hybrid)

Two modes:
- **Local Analysis**: Find entities mentioned in text but not linked
- **AI Analysis**: Semantic relationship inference from text content

### 4. Plot Thread Analyzer (AI-Powered)

- Groups entities by shared tags/keywords
- Uses AI to identify narrative threads in groups of 3+ related entities

---

## Relevance Scoring Algorithm (0-100)

```typescript
interface ScoreFactors {
  confidence: number;    // 0-1, multiplied by 40
  impact: number;        // 0-1, multiplied by 30
  actionability: number; // 0-1, multiplied by 20
  freshness: number;     // 0-1, multiplied by 10
}
```

---

## Implementation Order

1. Create types file (`analyzers/types.ts`)
2. Implement inconsistencyAnalyzer (no API dependency)
3. Implement enhancementAnalyzer (no API)
4. Implement relationshipAnalyzer (local mode first, then AI)
5. Implement plotThreadAnalyzer (AI-powered)
6. Create main orchestrator (`suggestionAnalysisService.ts`)
7. Update service exports
8. Write comprehensive tests

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/services/analyzers/types.ts` | Create |
| `src/lib/services/analyzers/index.ts` | Create |
| `src/lib/services/analyzers/inconsistencyAnalyzer.ts` | Create |
| `src/lib/services/analyzers/enhancementAnalyzer.ts` | Create |
| `src/lib/services/analyzers/relationshipAnalyzer.ts` | Create |
| `src/lib/services/analyzers/plotThreadAnalyzer.ts` | Create |
| `src/lib/services/suggestionAnalysisService.ts` | Create |
| `src/lib/services/index.ts` | Modify |
| Test files for each analyzer | Create |

---

## Edge Cases

1. Empty campaign (no entities)
2. No API key (degrade to local-only)
3. Large campaigns (1000+ entities)
4. Duplicate suggestion prevention
5. Stale suggestion cleanup
6. Deleted entity handling
