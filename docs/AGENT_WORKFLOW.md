# Agent Workflow Documentation

This document describes the multi-agent development workflow for managing Director Assist development. This workflow uses specialized AI agents to handle different aspects of the development lifecycle, from issue selection to code review to deployment.

## Overview

The agent workflow is a pipeline system where specialized agents handle specific responsibilities. Each agent performs its task and hands off to the next agent in the chain. This structured approach ensures code quality, maintains documentation, and keeps the development process organized.

**Key Benefits:**
- Consistent code review process
- Documentation stays in sync with code
- Atomic commits (code + docs together)
- Clear handoffs between development stages
- Specialized expertise at each step

## Pipeline Stages

The workflow consists of 8 distinct stages:

```
1. Issue Selection    → Pick and validate issue
2. Planning           → Design approach (optional)
3. Implementation     → Write the code
4. Code Review        → Review code and domain accuracy (optional)
5. Documentation      → Update docs
6. Git Operations     → Commit and push changes
7. User Verification  → Manual testing
8. Issue Closure      → Mark issue complete
```

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

### 3. senior-web-architect

**Role:** Code implementation

**Responsibilities:**
- Implement features based on issue requirements or plan
- Write type-safe TypeScript code
- Follow project code style guidelines
- Ensure proper error handling
- Test changes during development
- Hand off completed code for review

**When to Use:**
- Every workflow (this is the core implementation agent)

**Example Commands:**
```
"Implement issue #23: Add faction member count"
"Follow the plan and implement the custom field feature"
"Fix the bug described in issue #18"
```

**Output:**
- Working code implementation
- New or modified files
- Summary of changes made
- Any notes for the reviewer

---

### 4. draw-steel-web-reviewer

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

### 5. docs-specialist

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

### 6. git-manager

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

Choose the appropriate workflow based on the issue complexity and domain involvement:

### Variant 1: Simple Bug Fix

**Use When:**
- Clear, isolated bug
- Single file change
- Obvious solution
- No game mechanics involved

**Steps:** 1 → 3 → 5 → 6 → 7 → 8

**Skip:** Planning (step 2), Code Review (step 4)

**Example Issues:**
- Typo in UI text
- Broken link in documentation
- CSS styling bug
- Input validation error

**Workflow:**
```
1. github-project-manager selects issue
   ↓
3. senior-web-architect fixes the bug
   ↓
5. docs-specialist updates relevant docs
   ↓
6. git-manager commits and pushes
   ↓
7. User tests the fix
   ↓
8. github-project-manager closes issue
```

---

### Variant 2: Non-Draw-Steel Feature

**Use When:**
- New feature or enhancement
- Doesn't involve Draw Steel game mechanics
- Infrastructure or tooling work
- Generic functionality

**Steps:** 1 → 2 → 3 → 5 → 6 → 7 → 8

**Skip:** Code Review (step 4)

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
3. senior-web-architect implements feature
   ↓
5. docs-specialist documents the feature
   ↓
6. git-manager commits and pushes
   ↓
7. User tests the feature
   ↓
8. github-project-manager closes issue
```

---

### Variant 3: Draw Steel Feature (Full Pipeline)

**Use When:**
- Feature involves Draw Steel game mechanics
- New entity types for Draw Steel
- Changes to combat, skills, or rules
- Content that requires domain accuracy

**Steps:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (Full pipeline)

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
3. senior-web-architect implements the feature
   ↓
4. draw-steel-web-reviewer validates accuracy
   ↓
5. docs-specialist documents the feature
   ↓
6. git-manager commits and pushes
   ↓
7. User tests the feature
   ↓
8. github-project-manager closes issue
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

### Context Handoffs

Each agent should provide clear context when handing off:

**From github-project-manager to Plan:**
- Issue number and title
- Full issue description
- Complexity assessment
- Any relevant background

**From Plan to senior-web-architect:**
- Implementation plan
- Files to modify
- Step-by-step tasks
- Design decisions

**From senior-web-architect to draw-steel-web-reviewer:**
- List of changed files
- Summary of implementation
- Any areas needing extra attention
- Test results

**From draw-steel-web-reviewer to docs-specialist:**
- Review approval
- Any documentation requirements
- Domain-specific notes

**From docs-specialist to git-manager:**
- All files ready to commit (code + docs)
- Summary of changes
- Suggested commit message type

**From git-manager to user:**
- What was implemented
- How to test it
- What to verify

### Atomic Commits

The git-manager should ALWAYS commit code and documentation together:

**Good:**
```
feat(entities): add faction member count tracking

- Add memberCount field to faction entity type
- Update FactionForm component to include member count
- Add validation for positive integers
- Update ARCHITECTURE.md with new field
- Add usage example to README
```

**Bad (separate commits):**
```
Commit 1: feat(entities): add faction member count
Commit 2: docs: update docs for faction member count
```

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

### Example 1: Simple Bug Fix

**Issue:** "Search box doesn't clear when pressing Escape key"

**Workflow:**

```bash
# Step 1: Issue Selection
"Select issue #45 to work on"

# github-project-manager response:
# "Issue #45: Search box doesn't clear on Escape
#  Complexity: Simple
#  Recommendation: Variant 1 (skip planning and review)
#
#  Handing off to senior-web-architect for implementation."

# Step 3: Implementation
"Implement the escape key handler for the search box"

# senior-web-architect response:
# "Implementation complete. Added keydown event listener
#  to Header.svelte search input. Modified 1 file.
#
#  Handing off to docs-specialist."

# Step 5: Documentation
"Update any relevant documentation for this change"

# docs-specialist response:
# "Updated CONTRIBUTING.md keyboard shortcuts section.
#  Changes ready for commit.
#
#  Handing off to git-manager."

# Step 6: Git Operations
"Commit and push these changes"

# git-manager response:
# "Committed: fix(ui): clear search on Escape key press
#  Pushed to main: abc1234
#
#  Ready for user verification."

# Step 7: User Verification
# User tests: "Works correctly, close the issue"

# Step 8: Issue Closure
"Close issue #45 as resolved"

# github-project-manager response:
# "Issue #45 closed with resolution summary."
```

---

### Example 2: Draw Steel Feature

**Issue:** "Add support for Draw Steel Heroic Resources tracking"

**Workflow:**

```bash
# Step 1: Issue Selection
"Select the next Draw Steel-related issue"

# github-project-manager response:
# "Issue #78: Add Draw Steel Heroic Resources
#  Complexity: Complex
#  Involves: Game mechanics, character tracking
#  Recommendation: Variant 3 (full pipeline)
#
#  Handing off to Plan for architecture design."

# Step 2: Planning
"Create an implementation plan for heroic resources"

# Plan response:
# "Implementation Plan:
#  1. Add heroicResources field to Character entity
#  2. Create HeroicResourceTracker component
#  3. Add resource type definitions
#  4. Update CharacterSheet to display resources
#
#  Files to modify:
#  - src/lib/types/entities.ts
#  - src/lib/config/entityTypes.ts
#  - src/lib/components/HeroicResourceTracker.svelte (new)
#  - src/routes/entities/character/[id]/+page.svelte
#
#  Handing off to senior-web-architect."

# Step 3: Implementation
"Implement the heroic resources feature according to the plan"

# senior-web-architect response:
# "Implementation complete. Added heroic resource tracking
#  with support for Victories, Hope, and other Draw Steel resources.
#  Created new component with increment/decrement controls.
#
#  Files changed: 4 files (as planned)
#
#  Handing off to draw-steel-web-reviewer for domain review."

# Step 4: Code Review
"Review the heroic resources implementation for Draw Steel accuracy"

# draw-steel-web-reviewer response:
# "Review complete:
#  ✓ Resource types match Draw Steel core rules
#  ✓ Terminology is accurate (Victories, Hope)
#  ✓ Default values are correct
#  ✓ UI follows Draw Steel conventions
#
#  Changes approved.
#
#  Handing off to docs-specialist."

# Step 5: Documentation
"Document the new heroic resources feature"

# docs-specialist response:
# "Documentation updated:
#  - Added heroic resources to README features list
#  - Updated ARCHITECTURE.md data model
#  - Added code comments explaining resource types
#  - Created example in CONTRIBUTING.md
#
#  All changes ready for commit.
#
#  Handing off to git-manager."

# Step 6: Git Operations
"Commit all changes and push"

# git-manager response:
# "Committed: feat(character): add Draw Steel heroic resources tracking
#
#  Pushed to main: def5678
#
#  Ready for user verification."

# Step 7: User Verification
# User tests: "Tested with multiple resource types, works great. Close the issue."

# Step 8: Issue Closure
"Close issue #78 with summary"

# github-project-manager response:
# "Issue #78 closed. Added support for Draw Steel Heroic Resources
#  including Victories, Hope, and custom resource tracking."
```

---

## Troubleshooting

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
ALWAYS complete step 7 before step 8:

1. git-manager pushes changes
2. User must test locally
3. User explicitly confirms "ready to close"
4. Only then does github-project-manager close the issue

Never combine steps 6, 7, and 8 into a single command.

---

### Problem: Review Requested Changes

**Symptoms:**
- draw-steel-web-reviewer finds issues
- Code doesn't meet standards
- Domain accuracy problems

**Solution:**
Loop back to implementation:

1. draw-steel-web-reviewer provides specific feedback
2. Hand back to senior-web-architect with the feedback
3. senior-web-architect makes corrections
4. Return to draw-steel-web-reviewer for re-review
5. Continue until approved

Don't skip review or ignore feedback.

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

### Workflow Variants Cheat Sheet

| Variant | Steps | Use For | Skip |
|---------|-------|---------|------|
| Simple Bug Fix | 1→3→5→6→7→8 | Typos, small fixes, obvious solutions | Plan, Review |
| Non-DS Feature | 1→2→3→5→6→7→8 | Infrastructure, generic features | Review |
| Draw Steel Feature | 1→2→3→4→5→6→7→8 | Game mechanics, domain-specific | None |

### Agent Commands Quick Reference

```bash
# Issue Selection
"Select issue #XX to work on"
"Show me open issues"
"What's the next priority issue?"

# Planning
"Create a plan for issue #XX"
"Design the architecture for [feature]"

# Implementation
"Implement issue #XX"
"Follow the plan and implement [feature]"
"Fix bug described in issue #XX"

# Code Review
"Review the changes for Draw Steel accuracy"
"Check code quality and standards"

# Documentation
"Update documentation for these changes"
"Document the new [feature]"

# Git Operations
"Commit and push all changes"
"Create commit with appropriate message"

# Issue Closure
"Close issue #XX as resolved"
"Mark issue #XX complete with summary"
```

---

## Workflow Philosophy

This multi-agent workflow is designed around several key principles:

### Separation of Concerns

Each agent has a clear, focused responsibility. This prevents any single agent from being overwhelmed and ensures expertise at each stage.

### Quality Gates

Code review (step 4) and user verification (step 7) act as quality gates, catching issues before they reach production.

### Documentation as Code

Documentation is treated as a first-class citizen, not an afterthought. The docs-specialist ensures documentation stays accurate.

### Atomic Changes

By committing code and docs together, we ensure the repository is always in a consistent state.

### Traceability

Each issue flows through a predictable pipeline, making it easy to track progress and understand where work stands.

### Flexibility

The workflow variants allow you to skip unnecessary steps for simple work while maintaining rigor for complex features.

---

## Future Enhancements

Potential improvements to consider:

- **Automated Testing:** Add a testing agent between implementation and review
- **Design Review:** Add a UI/UX review agent for user-facing changes
- **Performance Review:** Add a performance analysis agent for optimization work
- **Security Review:** Add a security-focused review for auth/data handling
- **Release Notes:** Automate release note generation from closed issues
- **Metrics Tracking:** Track cycle time and agent effectiveness

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

The agent workflow provides a structured, quality-focused approach to development:

- **8 clear stages** from issue selection to closure
- **6 specialized agents** each with focused expertise
- **3 workflow variants** optimized for different complexities
- **Atomic commits** ensuring code and docs stay in sync
- **Quality gates** through code review and user verification

By following this workflow, you ensure consistent quality, maintain accurate documentation, and keep the development process organized and efficient.
