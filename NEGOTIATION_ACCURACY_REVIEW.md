# Draw Steel Negotiations Feature - Accuracy Review Report

**Date**: 2026-02-07
**Reviewer**: Marcus (Senior Web Developer + Draw Steel Expert)
**Status**: NEEDS FIXES - Critical mechanical errors found

---

## Executive Summary

The Negotiations feature implementation contains **multiple critical mechanical inaccuracies** that prevent proper Draw Steel gameplay. **12 out of 86 tests are failing** due to fundamental mismatches between the implementation and Draw Steel's negotiation system.

### Quick Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| **Core Mechanics** | BROKEN | Outcome types completely wrong |
| **Preview Calculations** | BROKEN | Players see incorrect interest/patience changes |
| **Motivation List** | INCOMPLETE | Missing 'wealth' motivation |
| **UI Descriptions** | MISALIGNED | NPC-centric rather than party-centric |
| **Architecture** | SOLID | Database structure and lifecycle management correct |
| **Test Coverage** | EXCELLENT | Tests properly define the mechanics |

**Recommendation**: Hold from release until critical issues are fixed.

---

## Critical Issues (Blocking Release)

### 1. Wrong Outcome Type Names - CRITICAL

**Severity**: 🔴 CRITICAL - Cascades to 12+ test failures

**Problem**: The implementation uses fundamentally wrong outcome category names that don't match Draw Steel negotiation philosophy.

**Current (WRONG)**: hostile, rejection, lesser_offer, compromise, success_partial, success_full
**Expected (CORRECT)**: failure, minor_favor, major_favor, alliance

**Why It Matters**:
- Draw Steel negotiations are about **building relationships**, not managing NPC emotions
- 'hostile' and 'rejection' are NPC states, not party outcomes
- 'success_partial' and 'success_full' don't convey whether you gained allies
- The outcome should answer: "What did we achieve?" not "How does the NPC feel?"

**Draw Steel Context**:
- Failure (0-1): Negotiation collapsed, may gain enemies
- Minor Favor (2): Gained small concession/minor ally
- Major Favor (3-4): Gained significant support/major ally
- Alliance (5): Gained strategic partner/major asset

**Files to Fix**:
- `/Users/evanmiller/git/director-assist/src/lib/types/negotiation.ts` (lines 152-158)
- `/Users/evanmiller/git/director-assist/src/lib/db/repositories/negotiationRepository.ts` (lines 103-110)

**GitHub Issue**: #402

---

### 2. Wrong Preview Calculations - CRITICAL

**Severity**: 🔴 CRITICAL - Prevents accurate table play

**Problem**: ArgumentControls shows mathematically incorrect interest/patience predictions.

**Examples of Wrong Values**:

| Argument Type | Tier | Current (WRONG) | Expected (CORRECT) |
|---|---|---|---|
| Motivation | 1 | +1 int, +0 pat | +0 int, -1 pat |
| Motivation | 2 | +2 int, +0 pat | +1 int, -1 pat |
| Motivation | 3 | +2 int, +1 pat | +1 int, +0 pat |
| No-Motivation | 1 | +0 int, -1 pat | -1 int, -1 pat |
| No-Motivation | 2 | +1 int, -1 pat | +0 int, -1 pat |

**Why It Matters**:
- Players make strategic decisions based on these previews
- Wrong predictions → wrong argument choices → broken gameplay
- Actual mechanics are correct in negotiationRepository, but UI shows wrong values
- Complete disconnect between what players expect and what happens

**Table Impact**:
- "I thought that Tier 1 motivation would gain interest..." (but it doesn't)
- "The preview said 0 patience cost..." (but it costs -1)
- Players can't properly evaluate trade-offs in their arguments

**File to Fix**:
- `/Users/evanmiller/git/director-assist/src/lib/components/negotiation/ArgumentControls.svelte` (lines 64-76)

**GitHub Issue**: #403

---

## Major Issues (Should Fix Before Release)

### 3. Incomplete Motivation List - MAJOR

**Severity**: 🟡 MAJOR - Feature incompleteness

**Problem**: ArgumentControls lists only 12 motivations but should include 13.

**Missing**: 'wealth' (referenced in tests and Draw Steel canon)

**Current List** (ArgumentControls.svelte line 40-53):
- benevolence, discovery, freedom, greed, higher_authority, justice, legacy, peace, power, protection, revelry, vengeance

**Complete 13 Motivations**:
1. benevolence - helping others
2. discovery - learning and exploration
3. freedom - independence and autonomy
4. greed - accumulating resources (different from wealth)
5. higher_authority - respecting authority
6. justice - fairness and order
7. legacy - leaving a mark
8. peace - harmony
9. power - dominance
10. protection - safeguarding
11. revelry - celebration
12. vengeance - revenge
13. **wealth** - accumulating money/valuables (MISSING)

**Impact**:
- Players can't explicitly appeal to an NPC's wealth motivation
- Test uses 'wealth' but it's not selectable in UI
- Feature feels incomplete to Draw Steel players

**File to Fix**:
- `/Users/evanmiller/git/director-assist/src/lib/components/negotiation/ArgumentControls.svelte`

**GitHub Issue**: #404

---

### 4. Wrong Outcome Descriptions - MAJOR

**Severity**: 🟡 MAJOR - Mechanical misalignment

**Problem**: NegotiationOutcomeDisplay describes outcomes from NPC perspective, not party perspective.

**Current Examples** (NegotiationOutcomeDisplay.svelte):
- "Hostile Refusal" - NPC is hostile
- "Rejection" - NPC declines
- "Lesser Offer" - NPC offers less
- "Compromise" - mutual agreement framing
- "Agreement with Conditions" - NPC perspective
- "Everything Plus Bonus" - vague and NPC-focused

**Should Be** (party-centric):
- "Negotiation Failed" - We failed to convince them
- "Minor Favor" - We gained a small ally
- "Major Favor" - We gained a major ally
- "Alliance Formed" - We gained a strategic partner

**Why It Matters**:
- New Directors won't understand negotiations are about **relationship building**
- Descriptions focus on NPC compliance, not party achievement
- Doesn't reinforce that interest → alliance progression
- Misaligns with Draw Steel's actual negotiation philosophy

**Files to Fix**:
- `/Users/evanmiller/git/director-assist/src/lib/components/negotiation/NegotiationOutcomeDisplay.svelte` (lines 11-77)

**GitHub Issue**: #405

---

## Moderate Issues (Quality of Life)

### 5. NPC Response Previews Need Alignment - MODERATE

**Severity**: 🟢 MODERATE - Consistency/clarity issue

**Problem**: NegotiationProgress response previews use old terminology and NPC-centric language.

**Current** (NegotiationProgress.svelte lines 44-51):
- interest 0: "Hostile - negotiation failed"
- interest 1: "Resistant - likely to reject"
- interest 2: "Reluctant - lesser offer"
- interest 3: "Open to compromise"
- interest 4: "Willing to agree - partial success"
- interest 5: "Eager to help - best possible deal..."

**Should Be**:
- interest 0-1: "Negotiation will fail"
- interest 2: "You can gain a minor favor"
- interest 3-4: "You can gain a major favor"
- interest 5: "Alliance will form"

**File to Fix**:
- `/Users/evanmiller/git/director-assist/src/lib/components/negotiation/NegotiationProgress.svelte` (lines 44-51)

**GitHub Issue**: #406

---

## What's Actually Correct

This review isn't all bad news! Several aspects are well-implemented:

### ✓ Strong Architecture
- Interest/Patience 0-5 scale is appropriate for Draw Steel
- Tier 1/2/3 progression correctly reflects argument quality
- Auto-completion mechanics (interest 0/5, patience 0) match intent
- Argument type structure (motivation, no_motivation, pitfall) is accurate

### ✓ Correct Mechanics
- Interest/patience calculations in negotiationRepository are **correct**
- Motivation/pitfall tracking is solid
- Lifecycle management (preparing → active → completed → reopen) works well
- Argument recording and history tracking is well-designed

### ✓ Excellent Test Coverage
- The test suite is comprehensive and well-written
- Tests properly encode the Draw Steel mechanics
- Test file comments clearly document expected behavior
- 74 out of 86 tests pass, showing solid fundamentals

### ✓ Good Database Design
- Dexie.js usage is clean
- Session tracking with motivations/pitfalls is sound
- Argument history preservation is correct
- Timestamps and state management are proper

---

## Test Failure Analysis

**Total Failures**: 12 out of 86 tests (13.9%)

### Outcome Type Failures (6 tests)
```
✗ should return "failure" for interest 0
✗ should return "failure" for interest 1
✗ should return "minor_favor" for interest 2
✗ should return "major_favor" for interest 3
✗ should return "major_favor" for interest 4
✗ should return "alliance" for interest 5
```
**Root Cause**: Wrong outcome type names in implementation

### Integration Failures (6 tests)
```
✗ should calculate outcome based on current interest level
✗ should auto-complete when interest reaches 0
✗ should auto-complete when interest reaches 5
✗ should complete full successful negotiation flow
✗ should handle failed negotiation with pitfalls
✗ should handle patience depletion before reaching outcome
```
**Root Cause**: Cascading effect of outcome type mismatch

---

## Draw Steel Alignment Assessment

### Negotiation Philosophy
**What Draw Steel Says**: Negotiations are about building relationships and alliances with NPCs. The outcome determines what the party gained.

**What Current Implementation Does**: Frames negotiations as compliance management - "hostile NPC refuses" vs "NPC rejects." This is mechanically inverted.

**Impact**: A Director using this tool will think about negotiations wrong. They'll focus on NPC emotions instead of party gains.

### Mechanical Accuracy
**Tier Progression**: ✓ Correct
- Tier 1: Basic, risky
- Tier 2: Better, more reliable
- Tier 3: Best, most reward

**Interest/Patience Tracking**: ✓ Correct
- Interest builds relationship
- Patience is the clock
- Both 0-5 is Draw Steel standard

**Outcome Categories**: ✗ Wrong Names, Right Concept
- Right to have 4 outcome tiers
- Wrong to name them after NPC states

### Table Usability
**Current State**: ❌ Poor
- Outcome terminology confuses instead of clarifies
- Preview values are completely wrong
- Negotiation results don't match expectations
- Directors can't properly manage negotiations

**After Fixes**: ✓ Excellent
- Clear, Draw Steel-aligned terminology
- Accurate predictions help strategic play
- Outcomes properly reflect party achievement

---

## Implementation Order (Fix Priority)

### Phase 1: CRITICAL (Must do)
1. **Fix Outcome Types** (#402)
   - Update negotiation.ts type definition
   - Update getOutcomeForInterest() mapping
   - Minimal ripple, high impact

2. **Fix Preview Calculations** (#403)
   - Update ArgumentControls outcomePreview
   - Straightforward math fix
   - Unblocks player strategic decisions

### Phase 2: MAJOR (Should do)
3. **Update Outcome Display** (#405)
   - Update NegotiationOutcomeDisplay descriptions
   - Update config and styling if needed
   - Depends on #402 for outcome types

4. **Complete Motivation List** (#404)
   - Add 'wealth' to ArgumentControls
   - Quick fix, completes feature

### Phase 3: MINOR (Nice to have)
5. **Align Response Previews** (#406)
   - Update NegotiationProgress descriptions
   - Quality-of-life alignment
   - Depends on #402

---

## File Locations & Change Summary

| File | Line(s) | Change Type | Severity |
|------|---------|------------|----------|
| negotiation.ts | 152-158 | Type definition | CRITICAL |
| negotiationRepository.ts | 103-110 | Logic update | CRITICAL |
| ArgumentControls.svelte | 40-76 | Calculations + list | CRITICAL + MAJOR |
| NegotiationOutcomeDisplay.svelte | 11-77 | Descriptions | MAJOR |
| NegotiationProgress.svelte | 44-51 | Text update | MODERATE |

---

## Conclusion

The Negotiations feature has solid architecture and correct core mechanics, but **critical mechanical errors in outcome types and preview calculations** prevent it from being table-ready.

### Status by Category
- **Release Readiness**: ❌ NOT READY
- **Code Quality**: ✓ GOOD
- **Mechanical Accuracy**: ❌ BROKEN
- **Test Coverage**: ✓ EXCELLENT
- **Table Usability**: ❌ POOR

### Fix Effort
- **Estimated Time**: 2-4 hours
- **Complexity**: Low-Medium (straightforward fixes)
- **Risk**: Low (well-tested, isolated changes)
- **Impact**: High (enables feature to work correctly)

### Recommendation
Hold from release until #402 and #403 are completed. The remaining issues (#404-406) should also be addressed before launch for completeness, but #402 and #403 are blocking.

---

## GitHub Issues Created

1. **#402** - CRITICAL: Fix Draw Steel Negotiation Outcome Types
2. **#403** - CRITICAL: ArgumentControls Wrong Interest/Patience Preview
3. **#404** - MAJOR: Complete 13 Motivations - Missing 'wealth'
4. **#405** - MAJOR: Update Outcome Display Descriptions
5. **#406** - MODERATE: Align NPC Response Previews

All issues are labeled with `draw-steel` and appropriate priority levels.

---

**Review Completed By**: Marcus (Senior Web Developer + Draw Steel Expert)
**Expertise Applied**: 15+ years web development + extensive Draw Steel campaign experience
