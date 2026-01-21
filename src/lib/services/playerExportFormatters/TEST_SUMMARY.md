# Player Export Formatters - Test Summary (TDD RED Phase)

## Overview

This document summarizes the comprehensive test suite created for the player export formatters. These tests follow Test-Driven Development (TDD) principles and are currently in the **RED phase** - all tests are written and failing as expected, awaiting implementation.

## Test Statistics

- **Total Test Files**: 4
- **Total Tests**: 186 (185 failing, 1 passing)
  - jsonFormatter.test.ts: 44 tests
  - htmlFormatter.test.ts: 72 tests
  - markdownFormatter.test.ts: 55 tests
  - index.test.ts: 15 tests

## Test Files Created

### 1. `/src/lib/services/playerExportFormatters/jsonFormatter.test.ts`

Tests the JSON formatter with 44 comprehensive test cases covering:

#### Valid JSON Output (3 tests)
- Produces valid, parseable JSON
- Handles empty entities array
- Proper formatting with indentation

#### Campaign Metadata (4 tests)
- Version field inclusion
- ExportedAt as ISO string
- Campaign name and description

#### Entity Structure (12 tests)
- All entities with correct structure
- Preservation of id, type, name, description
- Summary handling (present/missing)
- Tags array (with values/empty)

#### Entity Fields (4 tests)
- Fields object preservation
- Numeric field values
- Array field values
- Empty fields object

#### Entity Links (4 tests)
- Links array preservation
- Link structure (id, targetId, relationship, etc.)
- Links without optional fields
- Empty links array

#### Timestamp Handling (5 tests)
- Include/exclude createdAt based on includeTimestamps
- Include/exclude updatedAt based on includeTimestamps
- ISO 8601 format serialization

#### Image URL Handling (3 tests)
- Include/exclude imageUrl based on includeImages
- Handling missing imageUrl

#### Special Character Handling (5 tests)
- Special characters in names, descriptions, fields
- JSON content in field values
- Unicode characters

#### Edge Cases (4 tests)
- Empty campaign name/description
- All optional fields present/missing

### 2. `/src/lib/services/playerExportFormatters/htmlFormatter.test.ts`

Tests the HTML formatter with 72 comprehensive test cases covering:

#### HTML Document Structure (7 tests)
- Valid HTML5 with DOCTYPE
- html, head, body elements
- Meta charset and viewport tags
- Title element with campaign name

#### CSS Styling (4 tests)
- Embedded style tag
- Body styling
- Typography
- Entity sections

#### Campaign Metadata (3 tests)
- Campaign name as h1
- Campaign description
- Export metadata

#### Entity Display (8 tests)
- All entities displayed
- Entity names as headings
- Descriptions and summaries
- Tags and fields
- Empty entities array handling

#### Grouping by Type (3 tests)
- Grouped by type when enabled
- Ungrouped when disabled
- Organization under type sections

#### HTML Escaping (6 tests)
- Escape <, >, &, " characters
- Prevent script injection
- Prevent HTML injection

#### Links and Relationships (6 tests)
- Links section display
- Relationship types and targets
- Bidirectional indicators
- Relationship strength
- Entities with no links

#### Image Handling (4 tests)
- Include img tags when enabled
- Exclude when disabled
- Alt text inclusion
- Entities without imageUrl

#### Timestamp Display (3 tests)
- Display when enabled
- Hide when disabled
- Human-readable formatting

#### Print-Friendly Features (2 tests)
- Print-specific CSS
- Page break controls

#### Accessibility (2 tests)
- Lang attribute
- Semantic HTML elements

#### Edge Cases (4 tests)
- Very long descriptions
- Many fields
- Many links
- Mixed entity types

#### Whitespace and Formatting (2 tests)
- Readable HTML with indentation
- Paragraph breaks in descriptions

### 3. `/src/lib/services/playerExportFormatters/markdownFormatter.test.ts`

Tests the Markdown formatter with 55 comprehensive test cases covering:

#### Document Structure (3 tests)
- Campaign name as h1
- Campaign description
- Proper heading hierarchy

#### Table of Contents (4 tests)
- TOC section inclusion
- Links to entity sections
- Working anchor links
- Organization by entity type

#### Entity Grouping (4 tests)
- Group by type with h2 headings
- List entities under type sections
- No type headings when disabled
- Maintain order when ungrouped

#### Entity Display (6 tests)
- Entity names as h3 headings
- Entity type indicators
- Descriptions and summaries
- Entity IDs
- Empty entities array

#### Entity Fields (4 tests)
- Fields section display
- Field names and values
- Format as list or table
- Array field values
- Empty fields object

#### Entity Tags (3 tests)
- Tag display
- Distinct formatting
- Empty tags array

#### Relationships Section (6 tests)
- Relationships section for entities with links
- Relationship type and target
- Bidirectional indicators
- Relationship strength
- Entities without relationships

#### Markdown Escaping (6 tests)
- Escape *, _, [, ], # characters
- Handle existing markdown
- Code blocks preservation

#### Image Handling (4 tests)
- Markdown image syntax when enabled
- Exclude when disabled
- Descriptive alt text
- Entities without imageUrl

#### Timestamp Display (3 tests)
- Include when enabled
- Exclude when disabled
- Readable format

#### Export Metadata (3 tests)
- Export version
- Export date
- Clear metadata section

#### Formatting and Readability (4 tests)
- Line spacing between sections
- Consistent list formatting
- No excessive blank lines
- Horizontal rules

#### Edge Cases (5 tests)
- Very long entity names
- Names with special markdown characters
- Multiline descriptions
- Many tags
- Mixed content with special characters

### 4. `/src/lib/services/playerExportFormatters/index.test.ts`

Tests the unified formatter with 15 comprehensive test cases covering:

#### Format Routing (3 tests)
- Call JSON formatter for 'json' format
- Call HTML formatter for 'html' format
- Call Markdown formatter for 'markdown' format

#### Parameter Passing (5 tests)
- Pass playerExport correctly
- Pass options correctly
- Handle all option variations

#### Return Value (3 tests)
- Return result from each formatter

#### Error Handling (3 tests)
- Throw error for unknown format
- Descriptive error messages
- Don't catch formatter errors

#### Integration (1 test)
- Real formatters produce valid output

## Test Fixtures

Comprehensive test fixtures in `testFixtures.ts`:

- `createBasePlayerExport()` - Base campaign structure
- `createCharacterEntity()` - Character with all fields
- `createNpcEntity()` - NPC with minimal fields
- `createLocationEntity()` - Location entity
- `createFactionEntity()` - Faction entity
- `createEntityWithSpecialChars()` - Tests escaping
- `createMinimalEntity()` - Entity without optional fields
- `createCompletePlayerExport()` - Full export with multiple entities
- `createEmptyPlayerExport()` - Empty campaign
- `createDefaultOptions()` - Default export options
- `createMinimalOptions()` - All optional features disabled

## Expected Function Signatures

```typescript
// jsonFormatter.ts
export function formatAsJson(
  playerExport: PlayerExport,
  options: PlayerExportOptions
): string;

// htmlFormatter.ts
export function formatAsHtml(
  playerExport: PlayerExport,
  options: PlayerExportOptions
): string;

// markdownFormatter.ts
export function formatAsMarkdown(
  playerExport: PlayerExport,
  options: PlayerExportOptions
): string;

// index.ts
export function formatPlayerExport(
  playerExport: PlayerExport,
  options: PlayerExportOptions
): string;
```

## Current Status: RED Phase

All tests are currently **FAILING** as expected in TDD RED phase:
- Implementation files exist but throw `Error('Not implemented')`
- Tests verify comprehensive requirements
- Tests are well-organized with descriptive names
- Edge cases and error conditions thoroughly covered

## Next Steps: GREEN Phase

The next phase (GREEN) will involve implementing the formatters to make all tests pass:

1. **JSON Formatter**: Implement JSON serialization with options support
2. **HTML Formatter**: Implement HTML document generation with styling
3. **Markdown Formatter**: Implement Markdown generation with proper escaping
4. **Index (Unified)**: Implement format routing logic

## Test Coverage Areas

### Functional Requirements
- ✓ Format-specific output (JSON, HTML, Markdown)
- ✓ Campaign metadata display
- ✓ Entity display with all fields
- ✓ Relationship/link display
- ✓ Optional fields handling
- ✓ Grouping by entity type

### Options Support
- ✓ includeTimestamps (show/hide timestamps)
- ✓ includeImages (show/hide images)
- ✓ groupByType (group entities or flat list)

### Data Integrity
- ✓ All entity types (character, npc, location, faction, etc.)
- ✓ All field types (string, number, boolean, array)
- ✓ Complex data structures (nested objects, arrays)
- ✓ Date serialization

### Security & Safety
- ✓ HTML escaping (prevent XSS)
- ✓ Markdown escaping (prevent syntax breaks)
- ✓ JSON escaping (special characters)

### Edge Cases
- ✓ Empty data (no entities, no fields)
- ✓ Missing optional fields
- ✓ Very long content
- ✓ Many fields/links/tags
- ✓ Special characters and Unicode

### Quality Attributes
- ✓ Valid output format
- ✓ Human-readable formatting
- ✓ Accessibility (HTML)
- ✓ Print-friendly (HTML)
- ✓ Consistent styling

## Running the Tests

```bash
# Run all formatter tests
npm test -- --run playerExportFormatters

# Run individual formatter tests
npm test -- --run jsonFormatter.test.ts
npm test -- --run htmlFormatter.test.ts
npm test -- --run markdownFormatter.test.ts
npm test -- --run index.test.ts
```

## Test Quality Metrics

- **Comprehensive**: 186 tests cover all requirements
- **Descriptive**: Clear test names explain what's being tested
- **Organized**: Logical grouping with describe blocks
- **Realistic**: Uses realistic test data
- **Independent**: Tests don't depend on each other
- **Fast**: All tests complete in ~175ms
- **Maintainable**: Shared fixtures reduce duplication

---

**Status**: Ready for GREEN phase implementation
**Created**: 2025-01-21
**TDD Phase**: RED (Tests written, implementation pending)
