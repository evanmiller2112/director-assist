# Entity Field Guidance Tooltips - Test Documentation

## GitHub Issue
**Issue #218**: Field guidance tooltips to entity templates

## Test File
`/Users/evanmiller/git/director-assist/src/tests/entity-field-tooltips.test.ts`

## Testing Strategy (RED Phase - TDD)

These tests were written **BEFORE** implementation to define the expected behavior of field guidance tooltips across entity types. The tests currently FAIL (34 failures, 29 passing) which is the intended RED phase of Test-Driven Development.

### Test Objectives

1. **Verify helpText presence** on key fields that benefit from user guidance
2. **Validate helpText quality** - meaningful content, appropriate length, relevant keywords
3. **Ensure coverage** across at least 6 entity types (NPC, Location, Scene, Character, Player Profile, Timeline Event, Faction)
4. **Maintain backward compatibility** - existing fields and helpText are preserved
5. **Type safety** - helpText conforms to FieldDefinition interface

## Test Coverage Breakdown

### 1. NPC Entity - Field Tooltips (7 tests)
Fields requiring helpText:
- `greetings` - What the NPC says when first meeting players
- `personality` - Traits, behaviors, quirks
- `motivation` - Goals and desires driving the NPC
- `secrets` - Hidden information for DM only

**Status**: ❌ 6 failures (greetings already has helpText)

### 2. Location Entity - Field Tooltips (7 tests)
Fields requiring helpText:
- `atmosphere` - Already has: "What does it feel like to be here?"
- `features` - Notable landmarks and distinguishing characteristics
- `history` - Past events and origins
- `secrets` - Hidden aspects for DM only

**Status**: ❌ 6 failures (atmosphere already has helpText)

### 3. Scene Entity - Field Tooltips (8 tests)
Fields requiring helpText:
- `sceneSettingText` - ✅ Already has: "Vivid description of the scene. Can be AI-generated from location and NPCs."
- `whatHappened` - ✅ Already has: "Record what actually happened during the scene."
- `preSummary` - ✅ Already has: "Brief summary of the scene setup (1-2 sentences). Can be AI-generated."
- `postSummary` - Already has helpText, but failing quality test

**Status**: ✅ 7 passing, ❌ 1 failure (postSummary needs review)

### 4. Player Character Entity - Field Tooltips (6 tests)
Fields requiring helpText:
- `concept` - Brief character concept/idea
- `goals` - Character goals and motivations
- `secrets` - Hidden backstory elements

**Status**: ❌ 6 failures

### 5. Player Profile Entity - Field Tooltips (4 tests)
Fields requiring helpText:
- `preferences` - ✅ Already has: "What kind of gameplay do they enjoy?"
- `boundaries` - ✅ Already has: "Topics to avoid or handle carefully"

**Status**: ✅ 4 passing

### 6. Timeline Event Entity - Field Tooltips (4 tests)
Fields requiring helpText:
- `sortOrder` - ✅ Already has: "Used to order events chronologically"
- `significance` - Why this event matters/its impact

**Status**: ✅ 2 passing, ❌ 2 failures

### 7. Faction Entity - Field Tooltips (6 tests)
Fields requiring helpText:
- `goals` - Faction objectives and aims
- `values` - Core beliefs and principles
- `secrets` - Hidden faction information

**Status**: ❌ 6 failures

### 8. HelpText Quality Standards (3 tests)
Validates:
- Minimum 20 fields across all entities have helpText
- Length constraints (10-200 characters)
- Starts with capital letter
- Distinct from field labels
- Uses helpful language patterns (50% threshold)

**Status**: ✅ 2 passing, ❌ 1 failure (need 20+ fields with helpText)

### 9. Coverage Across Entity Types (2 tests)
Validates:
- At least 6 entity types have field tooltips
- Secrets fields across entity types have consistent helpText

**Status**: ❌ 2 failures

### 10. Type Safety & Backward Compatibility (5 tests)
Validates:
- FieldDefinition interface compatibility
- getEntityTypeDefinition still works
- Existing field properties unchanged
- Existing helpText preserved
- Existing placeholders maintained

**Status**: ✅ 5 passing

## Test Results Summary

**Total Tests**: 63
**Passing**: 29 (46%)
**Failing**: 34 (54%)

### Fields with Existing HelpText (Passing)
1. NPC - `greetings`
2. Location - `atmosphere`
3. Scene - `sceneSettingText`
4. Scene - `whatHappened`
5. Scene - `preSummary`
6. Scene - `postSummary` (partial - needs quality improvement)
7. Player Profile - `preferences`
8. Player Profile - `boundaries`
9. Timeline Event - `sortOrder`

### Fields Needing HelpText (Failing)
1. **NPC**: personality, motivation, secrets
2. **Location**: features, history, secrets
3. **Character**: concept, goals, secrets
4. **Timeline Event**: significance
5. **Faction**: goals, values, secrets
6. **Additional fields** to reach 20+ total across all entities

## Implementation Requirements

To make these tests pass, the implementation should:

### Priority 1: Core Fields (Required)
Add helpText to these high-value fields:
- NPC: `personality`, `motivation`, `secrets`
- Location: `features`, `history`, `secrets`
- Scene: Review/improve `postSummary` helpText
- Character: `concept`, `goals`, `secrets`
- Timeline Event: `significance`
- Faction: `goals`, `values`, `secrets`

### Priority 2: Coverage (Required)
- Ensure at least 6 entity types have field tooltips
- Ensure at least 20 total fields across all entities have helpText

### Priority 3: Quality Standards
All helpText must:
- Be 10-200 characters in length
- Start with a capital letter or question word
- Be distinct from the field label
- Provide meaningful guidance (not just repeat the label)
- Use helpful language patterns (questions, guidance verbs)

### HelpText Content Guidelines

**Good helpText examples:**
- ❌ "Personality" (too vague, repeats label)
- ✅ "Key traits, behaviors, and quirks that define how this NPC acts"
- ✅ "What drives this NPC? What do they want to achieve?"
- ✅ "Hidden information only the DM knows - can be revealed during play"

**Language patterns to use:**
- Questions: "What...", "How...", "Why..."
- Purpose: "Used to...", "Describes...", "Records..."
- Guidance: "Brief description of...", "Key aspects of...", "Notable..."
- Hints: "Can be AI-generated", "1-2 sentences", "For DM eyes only"

## Next Steps

1. **Implementation Phase (GREEN)**: Add helpText properties to field definitions in `/src/lib/config/entityTypes.ts`
2. **UI Integration**: Ensure tooltips are displayed in entity forms (likely already handled by existing FieldDefinition.helpText support)
3. **QA Validation**: Verify tooltips appear in UI and provide helpful guidance
4. **Documentation**: Update user-facing docs about tooltip availability

## Files to Modify

### Primary
- `/src/lib/config/entityTypes.ts` - Add helpText to field definitions

### Verification
- Run tests: `npm run test:run -- src/tests/entity-field-tooltips.test.ts`
- Should see all 63 tests passing after implementation

## Related Issues
- Issue #45: NPC Greetings Field (already implemented with helpText)
- Issue #218: Field guidance tooltips (this feature)

---

**Test Created**: 2026-02-07
**Test Phase**: RED (TDD - Tests written first, currently failing)
**Test Framework**: Vitest
**Test Pattern**: Unit tests following AAA (Arrange-Act-Assert) pattern
