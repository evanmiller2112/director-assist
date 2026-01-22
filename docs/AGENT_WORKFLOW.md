# Agent Workflow Documentation

This document describes the multi-agent development workflow for managing Director Assist development. This workflow uses specialized AI agents to handle different aspects of the development lifecycle, from issue selection to code review to deployment.

## Overview

The agent workflow is a pipeline system where specialized agents handle specific responsibilities. Each agent performs its task and hands off to the next agent in the chain. This structured approach follows **Test-Driven Development (TDD)** principles, ensuring code quality, maintaining documentation, and keeping the development process organized.

**Key Benefits:**
- Tests define "done" before coding starts (TDD approach)
- Tests can't be forgotten since they come first
- Forces clear requirements and prevents over-engineering
- Better code design through the RED-GREEN-REFACTOR cycle
- Consistent code review process
- Documentation stays in sync with code
- Atomic commits (code + tests + docs together)
- Clear handoffs between development stages
- Specialized expertise at each step

## Pipeline Stages

The workflow consists of 10 distinct stages following TDD principles:

```
1. Issue Selection    → Pick and validate issue
2. Planning           → Design approach (optional)
3. Unit Testing       → Write tests for expected behavior (RED - tests fail)
4. Implementation     → Write code to make tests pass (GREEN)
5. QA Validation      → Validate against requirements (verify GREEN)
6. Code Review        → Review code and domain accuracy (optional)
7. Documentation      → Update docs
8. Git Operations     → Commit and push changes
9. User Verification  → Manual testing
10. Issue Closure     → Mark issue complete
```

## Test-Driven Development (TDD) Approach

This workflow follows the **RED-GREEN-REFACTOR** cycle:

### RED Phase (Step 3: Unit Testing)
The **unit-test-expert** writes tests that define the expected behavior before any code exists. These tests FAIL because the functionality hasn't been implemented yet. This is intentional and desirable - failing tests define what "done" looks like.

**Benefits:**
- Tests clarify requirements before coding
- Forces thinking about API design and interfaces
- Prevents writing untestable code
- Provides immediate feedback when implementation is complete

### GREEN Phase (Step 4: Implementation)
The **senior-web-architect** writes the minimum code necessary to make the failing tests pass. The goal is to get from RED (failing tests) to GREEN (passing tests) as quickly as possible.

**Benefits:**
- Implementation is focused and purposeful
- No over-engineering or unnecessary features
- Test coverage is guaranteed (tests already exist)
- Clear definition of "done" (all tests pass)

### REFACTOR Phase (Steps 5-7: QA, Review, Documentation)
Once tests are passing, the code can be improved and cleaned up while maintaining the GREEN state. QA validation, code review, and documentation updates occur while tests continue to pass.

**Benefits:**
- Safe to improve code structure (tests catch regressions)
- Quality checks happen with working code
- Documentation reflects tested, working features
- Confidence that changes don't break functionality

## The Agents

### 1. github-project-manager

**Role:** Issue lifecycle management

**Responsibilities:**
- Browse open issues in the GitHub repository
- Evaluate issue readiness (clear description, acceptance criteria)
- Select the next issue to work on
- Assign complexity rating (simple/moderate/complex)
- Hand off context to the next agent
- Close completed issues with resolution summary

**When to Use:**
- At the start of a new work session (pick issue)
- After user verification is complete (close issue)

**Example Commands:**
```
"Select the next issue to work on"
"Show me open issues and help pick one"
"Close issue #42 as completed"
```

**Output:**
- Issue number and title
- Complexity assessment
- Recommended workflow path
- Context summary for the implementation agent

---

### 2. Plan (Built-in Agent)

**Role:** Architecture and implementation planning

**Responsibilities:**
- Analyze requirements and constraints
- Design high-level approach
- Identify files that need changes
- Create step-by-step implementation plan
- Flag potential risks or complexities
- Hand off plan to implementation agent

**When to Use:**
- Complex features requiring multiple file changes
- Architectural decisions needed
- Cross-cutting concerns (database migrations, new entity types)
- When the implementation approach is not immediately obvious

**When to Skip:**
- Simple bug fixes with obvious solutions
- Typo corrections or documentation-only changes
- Small UI tweaks or style adjustments

**Example Commands:**
```
"Create a plan for implementing issue #15"
"Plan the architecture for custom field types"
```

**Output:**
- Implementation strategy
- List of files to modify
- Step-by-step tasks
- Risk assessment
- Estimated complexity

---

### 3. unit-test-expert (TDD: RED Phase)

**Role:** Unit test creation and test-driven development

**Responsibilities:**
- Write tests BEFORE implementation (RED phase)
- Define expected behavior through failing tests
- Ensure test coverage for edge cases and requirements
- Create test fixtures and mocks as needed
- Document expected behavior in test descriptions
- Hand off failing tests to senior-web-architect

**Critical: Svelte 5 + IndexedDB Testing:**
When writing tests for code that passes data to IndexedDB (via Dexie), include tests that verify `$state` proxy objects are converted to plain objects before database operations. Svelte 5's `$state` creates Proxy objects that cannot be cloned by IndexedDB's structured clone algorithm, causing `DataCloneError: Proxy object could not be cloned` errors.

Test pattern:
```typescript
it('should handle Svelte 5 $state proxy objects', async () => {
  // Ensure data passed to repository is plain objects, not proxies
  const input = { items: [{ name: 'test' }] }; // Simulates $state proxy
  await repository.create(input);
  // Should not throw DataCloneError
});
```

**TDD Approach:**
In the TDD workflow, this agent writes tests FIRST, before any code exists. The tests should fail (RED state) because the functionality hasn't been implemented yet. This is the correct and expected behavior.

**When to Use:**
- Every feature and bug fix (TDD requires tests first)
- After planning completes and requirements are clear
- Before any implementation begins

**When to Skip:**
- Simple documentation-only changes
- Minor UI styling tweaks with no logic changes
- Configuration file updates with no behavioral changes

**Example Commands:**
```
"Write tests for the expected faction member count behavior"
"Create failing tests that define how heroic resources should work"
"Write tests for the bug fix requirements in issue #18"
```

**Output:**
- New test files with failing tests (RED state)
- Test fixtures and mocks
- Test execution results showing failures
- Clear definition of expected behavior
- Notes on what needs to be implemented

---

### 4. senior-web-architect (TDD: GREEN Phase)

**Role:** Code implementation to satisfy tests

**Responsibilities:**
- Implement features to make failing tests pass (GREEN phase)
- Write type-safe TypeScript code
- Follow project code style guidelines
- Ensure proper error handling
- Run tests during development to track progress
- Hand off working code with passing tests

**Critical: Svelte 5 + IndexedDB Implementation:**
When passing data from Svelte components to IndexedDB (via Dexie repositories), ALWAYS convert `$state` proxy objects to plain objects first. Svelte 5's `$state` creates Proxy objects that cannot be cloned by IndexedDB.

**Pattern to follow:**
```typescript
// In Svelte component before calling repository:
const plainData = myStateArray.map(item => ({ ...item }));
await repository.create({ items: plainData });

// Or for single objects:
const plainObject = { ...myStateObject };
await repository.update(id, plainObject);
```

**Never do this:**
```typescript
// BAD - passes $state proxy directly to IndexedDB
await repository.create({ items: myStateArray }); // DataCloneError!
```

**TDD Approach:**
In the TDD workflow, this agent writes the minimum code necessary to make the failing tests pass. The goal is to transition from RED (failing tests) to GREEN (passing tests) efficiently and purposefully.

**When to Use:**
- Every workflow (this is the core implementation agent)
- After unit-test-expert has created failing tests

**Example Commands:**
```
"Implement the code to make the faction tests pass"
"Write the implementation for the heroic resources feature (tests already exist)"
"Fix the bug to satisfy the test requirements"
```

**Output:**
- Working code implementation
- New or modified files
- Passing test results (GREEN state)
- Summary of changes made
- Notes for QA and review

---

### 5. qa-expert (TDD: REFACTOR Phase)

**Role:** Quality assurance and requirements validation

**Responsibilities:**
- Validate implementation meets acceptance criteria (verify GREEN state)
- Check edge cases and error handling beyond unit tests
- Verify no regressions in existing functionality
- Test boundary conditions and invalid inputs
- Ensure user experience is intuitive
- Confirm tests remain passing during validation
- Hand off to code reviewer or documentation specialist

**Critical: Svelte 5 + IndexedDB Validation:**
When validating features that save data to IndexedDB, specifically test the data flow from Svelte components to the database. Watch for `DataCloneError: Proxy object could not be cloned` errors which indicate `$state` proxy objects are being passed directly to IndexedDB instead of being converted to plain objects first.

**QA Checklist Item:**
- [ ] Test creating/updating data from UI forms - verify no DataCloneError in console
- [ ] Verify arrays from `$state` are converted with `.map(item => ({ ...item }))`
- [ ] Verify objects from `$state` are spread with `{ ...object }` before database calls

**TDD Approach:**
In the TDD workflow, QA validation occurs after implementation is complete and tests are passing (GREEN state). This agent verifies that the code not only passes tests but also meets all acceptance criteria and handles edge cases appropriately.

**When to Use:**
- After implementation completes and tests pass (GREEN state)
- Before code review or documentation
- When acceptance criteria are complex
- For features with multiple edge cases

**When to Skip:**
- Trivial changes with obvious correctness
- Documentation-only updates
- Simple refactoring with no behavior changes

**Example Commands:**
```
"Validate the faction implementation against requirements (tests are passing)"
"Check edge cases for the search functionality and verify tests cover them"
"Verify the custom field feature meets acceptance criteria in GREEN state"
```

**Output:**
- Validation results
- Edge cases tested
- Confirmation that tests remain passing
- Issues found (if any)
- Acceptance criteria checklist
- Notes for the code reviewer

---

### 6. draw-steel-web-reviewer

**Role:** Code review and domain accuracy validation

**Responsibilities:**
- Review code quality and adherence to standards
- Verify Draw Steel game system accuracy
- Check for type safety and error handling
- Validate UI/UX consistency
- Request changes if issues found
- Approve and hand off to documentation agent

**When to Use:**
- Features involving Draw Steel game mechanics
- New entity types or game-related functionality
- Changes to core game logic or rules
- Any feature that impacts Draw Steel domain knowledge

**When to Skip:**
- Simple bug fixes (typos, styling)
- Generic infrastructure work (build config, linting)
- Documentation-only changes
- Non-Draw-Steel features (settings, export/import)

**Example Commands:**
```
"Review the changes for Draw Steel accuracy"
"Check if the implementation follows our code standards"
```

**Output:**
- Code review feedback
- Domain accuracy validation
- Approval or change requests
- Notes for documentation

---

### 7. docs-specialist

**Role:** Documentation maintenance

**Responsibilities:**
- Update relevant documentation files
- Add or revise inline code comments
- Update README if features change
- Maintain accuracy between code and docs
- Ensure examples are current
- Hand off to git manager with all changes ready

**When to Use:**
- Every workflow (documentation should always be updated)

**Example Commands:**
```
"Update documentation for the new faction features"
"Add docs for the custom field type system"
"Review and update all affected documentation"
```

**Output:**
- Updated documentation files
- Revised code comments
- Updated examples
- List of files changed

---

### 8. git-manager

**Role:** Version control operations

**Responsibilities:**
- Create atomic commits (code + docs together)
- Write clear commit messages
- Push changes to remote
- Create tags for releases
- Manage versioning
- Hand off to user for verification

**When to Use:**
- After docs-specialist completes (every workflow)

**Example Commands:**
```
"Commit all changes with an appropriate message"
"Create a commit and push to the feature branch"
"Commit and push these changes to main"
```

**Output:**
- Commit hash
- Commit message
- Push confirmation
- Branch information

---

## Workflow Variants

Choose the appropriate workflow based on the issue complexity and domain involvement. All variants follow TDD principles where tests are written before implementation.

### Variant 1: Simple Bug Fix (TDD)

**Use When:**
- Clear, isolated bug
- Single file change
- Obvious solution
- No game mechanics involved

**Steps:** 1 → 3 → 4 → 5 → 7 → 8 → 9 → 10

**Skip:** Planning (step 2), Code Review (step 6)

**TDD Flow:** Write test that reproduces bug (RED) → Fix bug (GREEN) → Validate fix

**Example Issues:**
- Input validation error
- Search functionality bug
- Broken form submission
- Logic error in calculation

**Workflow:**
```
1. github-project-manager selects issue
   ↓
3. unit-test-expert writes test that reproduces the bug (RED)
   ↓
4. senior-web-architect fixes bug to make test pass (GREEN)
   ↓
5. qa-expert validates the fix works
   ↓
7. docs-specialist updates relevant docs
   ↓
8. git-manager commits and pushes
   ↓
9. User tests the fix
   ↓
10. github-project-manager closes issue
```

---

### Variant 2: Standard Feature (Non-Draw-Steel TDD)

**Use When:**
- New feature or enhancement
- Doesn't involve Draw Steel game mechanics
- Infrastructure or tooling work
- Generic functionality

**Steps:** 1 → 2 → 3 → 4 → 5 → 7 → 8 → 9 → 10

**Skip:** Code Review (step 6)

**TDD Flow:** Plan → Write tests (RED) → Implement feature (GREEN) → Validate & document

**Example Issues:**
- Add export to CSV feature
- Implement dark mode toggle
- Add keyboard shortcuts
- Build configuration changes

**Workflow:**
```
1. github-project-manager selects issue
   ↓
2. Plan creates implementation plan
   ↓
3. unit-test-expert writes tests for expected behavior (RED)
   ↓
4. senior-web-architect implements feature to pass tests (GREEN)
   ↓
5. qa-expert validates implementation
   ↓
7. docs-specialist documents the feature
   ↓
8. git-manager commits and pushes
   ↓
9. User tests the feature
   ↓
10. github-project-manager closes issue
```

---

### Variant 3: Draw Steel Feature (Full TDD Pipeline)

**Use When:**
- Feature involves Draw Steel game mechanics
- New entity types for Draw Steel
- Changes to combat, skills, or rules
- Content that requires domain accuracy

**Steps:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 (Full pipeline)

**TDD Flow:** Plan → Write tests (RED) → Implement (GREEN) → Validate → Domain review → Document

**Example Issues:**
- Add Draw Steel character class tracking
- Implement heroic resources system
- Add Draw Steel monster stat blocks
- Create Draw Steel encounter builder

**Workflow:**
```
1. github-project-manager selects issue
   ↓
2. Plan designs the feature architecture
   ↓
3. unit-test-expert writes tests for Draw Steel behavior (RED)
   ↓
4. senior-web-architect implements the feature (GREEN)
   ↓
5. qa-expert validates implementation
   ↓
6. draw-steel-web-reviewer validates accuracy
   ↓
7. docs-specialist documents the feature
   ↓
8. git-manager commits and pushes
   ↓
9. User tests the feature
   ↓
10. github-project-manager closes issue
```

---

## Decision Tree

Use this flowchart to determine which workflow variant to use:

```
Start: Issue selected
    ↓
Is it a simple bug fix with an obvious solution?
├─ Yes → Use Variant 1 (Simple Bug Fix)
└─ No → Continue
    ↓
Does it involve Draw Steel game mechanics or domain knowledge?
├─ Yes → Use Variant 3 (Full Pipeline)
└─ No → Use Variant 2 (Non-Draw-Steel Feature)
```

## Best Practices

### Context Handoffs (TDD Flow)

Each agent should provide clear context when handing off. The TDD workflow emphasizes test-first development:

**From github-project-manager to Plan:**
- Issue number and title
- Full issue description
- Complexity assessment
- Any relevant background

**From Plan to unit-test-expert:**
- Implementation plan
- Expected behavior to test
- Requirements and acceptance criteria
- API design and interfaces to test

**From unit-test-expert to senior-web-architect:**
- Failing test files (RED state)
- Test execution results showing failures
- Expected behavior defined in tests
- What needs to be implemented to pass tests

**From senior-web-architect to qa-expert:**
- List of changed files
- Summary of implementation
- Passing test results (GREEN state)
- Notes on implementation approach

**From qa-expert to draw-steel-web-reviewer (or docs-specialist):**
- Validation results
- Edge cases tested
- Confirmation tests still pass
- Any issues found
- Acceptance criteria checklist

**From draw-steel-web-reviewer to docs-specialist:**
- Review approval
- Any documentation requirements
- Domain-specific notes

**From docs-specialist to git-manager:**
- All files ready to commit (code + tests + docs)
- Summary of changes
- Suggested commit message type

**From git-manager to user:**
- What was implemented
- How to test it
- What to verify
- Confirmation that tests are passing

### Atomic Commits (Including Tests)

The git-manager should ALWAYS commit code, tests, and documentation together as a single atomic unit:

**Good:**
```
feat(entities): add faction member count tracking

- Add unit tests for member count behavior
- Add memberCount field to faction entity type
- Update FactionForm component to include member count
- Add validation for positive integers
- Update ARCHITECTURE.md with new field
- Add usage example to README
- All tests passing
```

**Bad (separate commits):**
```
Commit 1: test: add faction member count tests
Commit 2: feat(entities): add faction member count
Commit 3: docs: update docs for faction member count
```

**Why Atomic Commits Matter:**
- Code, tests, and docs stay perfectly synchronized
- Single revert point if needed
- Clear history showing complete feature implementation
- Tests document what the code does
- No intermediate broken states

### Communication Style

**Be Explicit About Handoffs:**
```
"I've completed the implementation. Here's what I did:
[summary]

Handing off to draw-steel-web-reviewer for domain accuracy review."
```

**Summarize Your Work:**
```
"Review complete. The code follows our standards and Draw Steel mechanics are accurate.
Changes approved.

Ready for documentation update."
```

### User Verification

The user verification step (step 7) is critical. Never skip it:

**User Responsibilities:**
- Test the changes locally
- Verify the feature works as expected
- Check for any regressions
- Confirm the issue is resolved

**Before Closing:**
User should explicitly confirm: "The fix works correctly, proceed to close the issue."

## Practical Examples

### Example 1: Simple Bug Fix (TDD)

**Issue:** "Search box doesn't clear when pressing Escape key"

**Workflow:**

```bash
# Step 1: Issue Selection
"Select issue #45 to work on"

# github-project-manager response:
# "Issue #45: Search box doesn't clear on Escape
#  Complexity: Simple
#  Recommendation: Variant 1 (TDD: write test first, then fix)
#
#  Handing off to unit-test-expert to write test."

# Step 3: Write Test First (RED)
"Write a test that verifies Escape key clears the search box"

# unit-test-expert response:
# "Test created: Header.test.ts
#  Test case: 'pressing Escape clears search input'
#  Status: FAILING (RED state - expected behavior)
#  The test simulates Escape keypress and expects empty value.
#
#  Handing off to senior-web-architect to implement."

# Step 4: Implementation (GREEN)
"Implement the escape key handler to make the test pass"

# senior-web-architect response:
# "Implementation complete. Added keydown event listener
#  to Header.svelte search input. Modified 1 file.
#  Tests now PASSING (GREEN state).
#
#  Handing off to qa-expert."

# Step 5: QA Validation
"Validate the escape key fix works correctly"

# qa-expert response:
# "Validation complete. Tested escape key in various scenarios.
#  All acceptance criteria met. Tests remain passing.
#
#  Handing off to docs-specialist."

# Step 7: Documentation
"Update any relevant documentation for this change"

# docs-specialist response:
# "Updated CONTRIBUTING.md keyboard shortcuts section.
#  All changes ready for commit: 1 test file, 1 implementation file, 1 doc file.
#
#  Handing off to git-manager."

# Step 8: Git Operations
"Commit and push these changes"

# git-manager response:
# "Committed: fix(ui): clear search on Escape key press
#  - Add test for Escape key behavior
#  - Implement keydown handler
#  - Update keyboard shortcuts documentation
#  - All tests passing
#  Pushed to main: abc1234
#
#  Ready for user verification."

# Step 9: User Verification
# User tests: "Works correctly, close the issue"

# Step 10: Issue Closure
"Close issue #45 as resolved"

# github-project-manager response:
# "Issue #45 closed with resolution summary."
```

---

### Example 2: Draw Steel Feature (Full TDD)

**Issue:** "Add support for Draw Steel Heroic Resources tracking"

**Workflow:**

```bash
# Step 1: Issue Selection
"Select the next Draw Steel-related issue"

# github-project-manager response:
# "Issue #78: Add Draw Steel Heroic Resources
#  Complexity: Complex
#  Involves: Game mechanics, character tracking
#  Recommendation: Variant 3 (full TDD pipeline)
#
#  Handing off to Plan for architecture design."

# Step 2: Planning
"Create an implementation plan for heroic resources"

# Plan response:
# "Implementation Plan:
#  1. Test: Define expected behavior for heroic resources
#  2. Add heroicResources field to Character entity
#  3. Create HeroicResourceTracker component
#  4. Add resource type definitions
#  5. Update CharacterSheet to display resources
#
#  Test scenarios to cover:
#  - Resource initialization with defaults
#  - Increment/decrement operations
#  - Multiple resource types (Victories, Hope, etc.)
#  - Validation (no negative values)
#
#  Files to create/modify:
#  - src/lib/components/HeroicResourceTracker.test.ts (new)
#  - src/lib/types/entities.test.ts (update)
#  - src/lib/types/entities.ts
#  - src/lib/config/entityTypes.ts
#  - src/lib/components/HeroicResourceTracker.svelte (new)
#  - src/routes/entities/character/[id]/+page.svelte
#
#  Handing off to unit-test-expert for TDD."

# Step 3: Write Tests First (RED)
"Write tests that define heroic resources behavior"

# unit-test-expert response:
# "Test suite created for heroic resources:
#  - Component rendering tests
#  - Increment/decrement logic tests
#  - Resource type validation tests
#  - Edge case tests (negative values, max values)
#  - Multiple resource type tests
#  Status: FAILING (RED state - 15 tests)
#
#  Tests clearly define expected behavior:
#  ✗ Should initialize resources with correct defaults
#  ✗ Should increment Victory count
#  ✗ Should decrement Hope without going negative
#  ✗ Should support multiple resource types
#  [... 11 more failing tests]
#
#  Handing off to senior-web-architect to implement."

# Step 4: Implementation (GREEN)
"Implement the heroic resources feature to pass the tests"

# senior-web-architect response:
# "Implementation complete. Added heroic resource tracking
#  with support for Victories, Hope, and other Draw Steel resources.
#  Created new component with increment/decrement controls.
#
#  Files changed: 4 files (as planned)
#  Tests now PASSING: 15/15 (GREEN state)
#
#  Handing off to qa-expert."

# Step 5: QA Validation (REFACTOR)
"Validate the heroic resources implementation"

# qa-expert response:
# "Validation complete:
#  ✓ All acceptance criteria met
#  ✓ Edge cases handled (negative values, max values)
#  ✓ Multiple resource types work correctly
#  ✓ UI is intuitive and responsive
#  ✓ Tests remain passing during validation
#
#  Handing off to draw-steel-web-reviewer."

# Step 6: Code Review (REFACTOR)
"Review the heroic resources implementation for Draw Steel accuracy"

# draw-steel-web-reviewer response:
# "Review complete:
#  ✓ Resource types match Draw Steel core rules
#  ✓ Terminology is accurate (Victories, Hope)
#  ✓ Default values are correct
#  ✓ UI follows Draw Steel conventions
#  ✓ Tests validate domain accuracy
#
#  Changes approved.
#
#  Handing off to docs-specialist."

# Step 7: Documentation (REFACTOR)
"Document the new heroic resources feature"

# docs-specialist response:
# "Documentation updated:
#  - Added heroic resources to README features list
#  - Updated ARCHITECTURE.md data model
#  - Added code comments explaining resource types
#  - Created example in CONTRIBUTING.md
#
#  All changes ready for commit: 4 implementation files, 2 test files, 4 doc files.
#
#  Handing off to git-manager."

# Step 8: Git Operations
"Commit all changes and push"

# git-manager response:
# "Committed: feat(character): add Draw Steel heroic resources tracking
#
#  - Add comprehensive test suite (15 tests)
#  - Implement heroic resources data model
#  - Create HeroicResourceTracker component
#  - Add support for Victories, Hope, and custom resources
#  - Update documentation and examples
#  - All tests passing (GREEN state)
#
#  Pushed to main: def5678
#
#  Ready for user verification."

# Step 9: User Verification
# User tests: "Tested with multiple resource types, works great. Close the issue."

# Step 10: Issue Closure
"Close issue #78 with summary"

# github-project-manager response:
# "Issue #78 closed. Added support for Draw Steel Heroic Resources
#  including Victories, Hope, and custom resource tracking.
#  Full TDD approach with 15 passing tests."
```

---

## Troubleshooting

### Problem: DataCloneError with Svelte 5 $state and IndexedDB

**Symptoms:**
- `DataCloneError: Proxy object could not be cloned` in browser console
- Data fails to save to IndexedDB
- Error occurs when submitting forms or saving data from UI

**Cause:**
Svelte 5's `$state` runes create Proxy objects for reactivity. IndexedDB uses the structured clone algorithm which cannot clone Proxy objects.

**Solution:**
Convert `$state` proxy objects to plain objects before passing to IndexedDB:

```typescript
// For arrays:
const plainArray = myStateArray.map(item => ({ ...item }));

// For objects:
const plainObject = { ...myStateObject };

// For nested structures:
const plainData = JSON.parse(JSON.stringify(myStateData));
```

**Prevention:**
1. unit-test-expert: Write tests that verify data can be saved to IndexedDB
2. senior-web-architect: Always spread/map `$state` data before database calls
3. qa-expert: Test form submissions and verify no DataCloneError in console

---

### Problem: Agent Doesn't Have Enough Context

**Symptoms:**
- Agent asks for clarification on what to do
- Implementation doesn't match expectations
- Agent makes incorrect assumptions

**Solution:**
Provide explicit context in your command:

```bash
# Instead of:
"Implement the feature"

# Do this:
"Implement issue #45: Add escape key handler to search.
The previous agent completed planning. Here's the plan:
[paste plan summary]"
```

---

### Problem: Code and Docs Out of Sync

**Symptoms:**
- Documentation describes features that don't exist
- Code has features not documented
- Examples in docs don't work

**Solution:**
Always use the full workflow, never skip docs-specialist:

1. Ensure docs-specialist reviews ALL documentation
2. Have docs-specialist verify examples actually work
3. Commit code and docs together (atomic commits)

---

### Problem: Unclear Which Workflow Variant to Use

**Symptoms:**
- Uncertain if code review is needed
- Not sure if planning is necessary
- Workflow feels too heavy or too light

**Solution:**
Use the decision tree:

1. Start with complexity: Simple bug or complex feature?
2. Consider domain: Does it involve Draw Steel mechanics?
3. When in doubt, use the full pipeline (better safe than sorry)
4. Ask github-project-manager for complexity assessment

---

### Problem: Changes Pushed Without User Verification

**Symptoms:**
- Bug discovered after merge
- Feature doesn't work as expected
- Regression introduced

**Solution:**
ALWAYS complete step 9 before step 10:

1. git-manager pushes changes
2. User must test locally
3. User explicitly confirms "ready to close"
4. Only then does github-project-manager close the issue

Never combine steps 8, 9, and 10 into a single command.

---

### Problem: Review or QA Requested Changes

**Symptoms:**
- qa-expert or draw-steel-web-reviewer finds issues
- Code doesn't meet requirements
- Tests are failing
- Domain accuracy problems

**Solution:**
Loop back to the appropriate agent:

1. Agent provides specific feedback
2. Hand back to senior-web-architect (for code issues) or unit-test-expert (for test issues)
3. Make corrections
4. Resume the pipeline from where it was interrupted
5. Continue until approved

Don't skip review, QA, or testing steps or ignore feedback.

---

### Problem: Tests Written After Implementation (Anti-TDD)

**Symptoms:**
- Implementation happens before tests are written
- Tests are written to match existing code rather than define behavior
- Missing test coverage for edge cases
- Code is harder to test (not designed with testing in mind)

**Solution:**
Return to proper TDD workflow:

1. If implementation already exists, write tests anyway (better late than never)
2. For future work, strictly follow TDD: unit-test-expert BEFORE senior-web-architect
3. If code is untestable, refactor it to be testable
4. Remember: Tests define the contract, implementation fulfills it

---

### Problem: Tests Pass But Requirements Not Met

**Symptoms:**
- All unit tests passing (GREEN state)
- QA validation finds missing functionality
- Tests don't cover all acceptance criteria
- Edge cases not tested

**Solution:**
Return to RED state by adding missing tests:

1. unit-test-expert adds tests for missing scenarios (new RED state)
2. senior-web-architect implements to pass new tests (back to GREEN)
3. qa-expert validates again
4. Repeat until all requirements covered

This is the REFACTOR phase working correctly - improving while staying GREEN.

---

## Tips for Effective Workflow Usage

### 1. Start Each Session with github-project-manager

Let the project manager agent help you choose what to work on:
```
"Show me open issues and recommend the next one to tackle"
```

### 2. Trust the Process

Each agent has specific expertise. Don't skip steps or combine agents unless you're using an appropriate variant.

### 3. Be Explicit in Handoffs

When moving between agents, state clearly what you need:
```
"Implementation complete. Handing to draw-steel-web-reviewer.
Please review for Draw Steel accuracy and code quality."
```

### 4. Save Complex Decisions for Planning

If you're uncertain about the approach, always use the Plan step:
```
"This seems complex. Create a plan before implementing."
```

### 5. Document as You Go

Don't wait until the end to think about documentation. Consider docs implications during planning and implementation.

### 6. Test Before Closing

Always verify changes work before closing the issue. It's easier to fix problems immediately than to reopen issues later.

### 7. Keep Commits Atomic

Code and documentation should be committed together. This keeps history clean and ensures docs never fall out of sync.

---

## Quick Reference

### Workflow Variants Cheat Sheet (TDD)

| Variant | Steps | TDD Flow | Use For | Skip |
|---------|-------|----------|---------|------|
| Simple Bug Fix | 1→3→4→5→7→8→9→10 | Test bug (RED) → Fix (GREEN) → Validate | Bug fixes, small logic changes | Plan, Domain Review |
| Standard Feature | 1→2→3→4→5→7→8→9→10 | Plan → Tests (RED) → Code (GREEN) → Validate | Infrastructure, generic features | Domain Review |
| Draw Steel Feature | 1→2→3→4→5→6→7→8→9→10 | Plan → Tests (RED) → Code (GREEN) → Validate → Review | Game mechanics, domain-specific | None (full pipeline) |

### Agent Commands Quick Reference (TDD Order)

```bash
# Issue Selection
"Select issue #XX to work on"
"Show me open issues"
"What's the next priority issue?"

# Planning
"Create a plan for issue #XX"
"Design the architecture for [feature]"

# Unit Testing (STEP 3 - RED Phase)
"Write tests that define expected behavior for [feature]"
"Create failing tests for the bug in issue #XX"
"Write test cases for the planned implementation"

# Implementation (STEP 4 - GREEN Phase)
"Implement the code to make the tests pass"
"Fix the bug to satisfy the test requirements"
"Write implementation for [feature] (tests already exist)"

# QA Validation (REFACTOR Phase)
"Validate the implementation against requirements"
"Check edge cases for [feature]"
"Verify acceptance criteria are met and tests still pass"

# Code Review (REFACTOR Phase)
"Review the changes for Draw Steel accuracy"
"Check code quality and standards"

# Documentation (REFACTOR Phase)
"Update documentation for these changes"
"Document the new [feature]"

# Git Operations
"Commit and push all changes (code + tests + docs)"
"Create atomic commit with tests, implementation, and docs"

# Issue Closure
"Close issue #XX as resolved"
"Mark issue #XX complete with summary"
```

### TDD Quick Tips

**RED (Write Tests First)**
- Tests should fail initially
- Define expected behavior clearly
- Think about API design and interfaces
- Cover edge cases in test scenarios

**GREEN (Make Tests Pass)**
- Write minimum code to pass tests
- Focus on making tests pass first
- Avoid over-engineering
- Run tests frequently

**REFACTOR (Clean Up)**
- Tests stay passing during refactor
- QA validates while GREEN
- Code review while GREEN
- Document working, tested code

---

## Workflow Philosophy

This multi-agent workflow is designed around several key principles:

### Test-Driven Development (TDD)

Tests are written BEFORE implementation, defining expected behavior upfront. This ensures:
- Clear requirements before coding begins
- Code designed for testability
- Immediate feedback when implementation is complete
- No forgotten or missing tests
- Better code design through forced interface thinking

### RED-GREEN-REFACTOR Cycle

The workflow follows the proven TDD cycle:
- **RED**: Write failing tests that define desired behavior
- **GREEN**: Write minimal code to make tests pass
- **REFACTOR**: Improve code quality while maintaining passing tests

### Separation of Concerns

Each agent has a clear, focused responsibility. This prevents any single agent from being overwhelmed and ensures expertise at each stage.

### Quality Gates

Unit tests (step 3), QA validation (step 5), code review (step 6), and user verification (step 9) act as quality gates, catching issues before they reach production.

### Tests, Code, and Documentation as a Unit

Tests define behavior, code implements it, and documentation explains it. All three are treated as first-class citizens and committed together atomically.

### Atomic Changes

By committing tests + code + docs together, we ensure the repository is always in a consistent, well-documented, and tested state.

### Traceability

Each issue flows through a predictable TDD pipeline, making it easy to track progress from RED to GREEN to REFACTOR.

### Flexibility

The workflow variants allow you to skip unnecessary steps for simple work while maintaining TDD rigor for all work.

---

## Related Workflows

### Release Workflow

For creating new releases (version bumps, tagging, GitHub releases), see **[RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md)**.

The release workflow uses these agents:
- **mergemaster** → Merge branches into main
- **docs-specialist** → Update changelog
- **git-manager** → Create version tags
- **github-project-manager** → Publish GitHub releases

---

## Future Enhancements

Potential improvements to consider:

- **Integration Testing:** Add integration test agent for end-to-end scenarios
- **Design Review:** Add a UI/UX review agent for user-facing changes
- **Performance Review:** Add a performance analysis agent for optimization work
- **Security Review:** Add a security-focused review for auth/data handling
- **Release Notes:** Automate release note generation from closed issues
- **Metrics Tracking:** Track cycle time and agent effectiveness
- **Accessibility Review:** Add accessibility testing for WCAG compliance

---

## Getting Help

If you're unsure about the workflow:

1. Refer to the decision tree for variant selection
2. Check the troubleshooting section for common issues
3. Review the practical examples
4. Ask github-project-manager for guidance on complexity
5. When in doubt, use the full pipeline (Variant 3)

---

## Summary

The agent workflow provides a structured, TDD-focused approach to development:

- **10 clear stages** from issue selection to closure
- **8 specialized agents** each with focused expertise
- **3 workflow variants** optimized for different complexities, all following TDD
- **RED-GREEN-REFACTOR cycle** ensuring tests drive implementation
- **Tests written first** defining expected behavior before coding
- **Atomic commits** ensuring tests + code + docs stay in sync
- **Multiple quality gates** through unit tests, QA validation, code review, and user verification

By following this TDD workflow, you ensure:
- **Better design**: Tests force thinking about interfaces and APIs first
- **Complete coverage**: Tests can't be forgotten when written first
- **Clear requirements**: Failing tests define what "done" means
- **Confident refactoring**: Tests catch regressions during improvements
- **Living documentation**: Tests demonstrate how code should be used
- **Consistent quality**: Multiple validation steps while maintaining GREEN state
