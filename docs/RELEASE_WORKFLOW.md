# Release Workflow

This document describes the workflow for creating new releases of Director Assist. Releases mark stable points in the project's history and follow semantic versioning.

## Overview

The release workflow is a specialized pipeline that handles:
- Merging completed feature branches into main
- Updating version numbers and changelog
- Creating Git tags
- Publishing GitHub releases

## Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/) (SemVer):

```
vMAJOR.MINOR.PATCH

Examples:
v1.0.0 → v1.0.1  (patch: bug fixes)
v1.0.1 → v1.1.0  (minor: new features, backward compatible)
v1.1.0 → v2.0.0  (major: breaking changes)
```

| Version Component | When to Increment | Examples |
|-------------------|-------------------|----------|
| **MAJOR** | Breaking changes, API incompatibilities | Removing features, changing data formats |
| **MINOR** | New features, backward compatible | New entity types, new UI components |
| **PATCH** | Bug fixes, minor improvements | Fixing bugs, typo corrections |

## Pipeline Stages

The release workflow consists of 5 stages:

```
1. Pre-Release Check    → Verify branch is ready
2. Branch Merge         → Merge into main
3. Version Bump         → Update version and changelog
4. Tag Creation         → Create Git tag
5. GitHub Release       → Publish release with notes
```

## The Agents

### 1. mergemaster

**Role:** Branch integration and conflict resolution

**Responsibilities:**
- Verify feature branch is ready to merge
- Check for merge conflicts
- Merge feature branch into main
- Resolve any conflicts that arise
- Verify merge was successful

**When to Use:**
- When a feature branch needs to be merged into main
- When there are potential merge conflicts to resolve

---

### 2. docs-specialist

**Role:** Changelog and release notes

**Responsibilities:**
- Update CHANGELOG.md with new version entry
- Compile list of changes from commits/PRs since last release
- Write clear, user-facing release notes
- Ensure version numbers are updated in documentation

**When to Use:**
- After successful merge, before tagging
- To prepare release notes content

---

### 3. git-manager

**Role:** Version tagging and Git operations

**Responsibilities:**
- Determine appropriate version number (major/minor/patch)
- **Update version in `package.json`** (required - this displays in `npm run dev`)
- Create annotated Git tag
- Push tag to remote
- Commit version bump before tagging

**When to Use:**
- After changelog is updated
- To create the official version tag

**Version Locations to Update:**
| File | Field | Example |
|------|-------|---------|
| `package.json` | `"version"` | `"0.2.0"` |

> **Note:** `package-lock.json` updates automatically when you run `npm install` after changing `package.json`.

---

### 4. github-project-manager

**Role:** GitHub release publication

**Responsibilities:**
- Create GitHub Release from tag
- Attach release notes from changelog
- Mark as latest release
- Link related issues/PRs in release description

**When to Use:**
- After tag is pushed
- To publish the official GitHub release

---

## Release Workflow Steps

### Standard Release

Use this workflow when releasing a new version after completing features or fixes.

**Steps:** 1 → 2 → 3 → 4 → 5

```
1. Pre-Release Check (mergemaster)
   - Verify all tests pass on feature branch
   - Check CI/CD status
   - Confirm branch is up to date with main
   ↓
2. Branch Merge (mergemaster)
   - Merge feature branch into main
   - Resolve any conflicts
   - Verify merge successful
   ↓
3. Version Bump (docs-specialist)
   - Determine version increment type
   - Update CHANGELOG.md
   - Prepare release notes
   ↓
4. Tag Creation (git-manager)
   - Update `package.json` version to match new version
   - Commit version bump
   - Create annotated tag (e.g., v1.2.0)
   - Push commit and tag to remote
   ↓
5. GitHub Release (github-project-manager)
   - Create release from tag
   - Add release notes
   - Publish release
```

### Hotfix Release

Use this workflow for urgent bug fixes that need immediate release.

**Steps:** 1 → 3 → 4 → 5

```
1. Pre-Release Check (mergemaster)
   - Verify hotfix is on main or merge hotfix branch
   - Confirm fix is tested
   ↓
3. Version Bump (docs-specialist)
   - Increment PATCH version
   - Update CHANGELOG.md with fix description
   ↓
4. Tag Creation (git-manager)
   - Create patch version tag
   - Push tag to remote
   ↓
5. GitHub Release (github-project-manager)
   - Create release marked as patch/hotfix
   - Add brief fix description
```

---

## Practical Example

### Releasing v1.2.0 with New Features

```bash
# Step 1: Pre-Release Check
"Check if feature/issue-98 is ready to merge into main"

# mergemaster response:
# "Branch feature/issue-98 is ready:
#  ✓ All tests passing
#  ✓ Up to date with main
#  ✓ No merge conflicts detected
#
#  Ready to merge."

# Step 2: Branch Merge
"Merge feature/issue-98 into main"

# mergemaster response:
# "Merge complete:
#  ✓ feature/issue-98 merged into main
#  ✓ No conflicts
#  ✓ Push successful
#
#  Handing off to docs-specialist for changelog."

# Step 3: Version Bump
"Update changelog for new release - this adds a new feature"

# docs-specialist response:
# "Changelog updated:
#  ✓ Added v1.2.0 section
#  ✓ Listed new features and fixes
#  ✓ Release notes prepared
#
#  Recommended version: v1.2.0 (new feature, backward compatible)
#
#  Handing off to git-manager for tagging."

# Step 4: Tag Creation
"Create tag v1.2.0 and push"

# git-manager response:
# "Version bump and tag created:
#  ✓ Updated package.json version to 0.2.0
#  ✓ Committed version bump
#  ✓ Created annotated tag v1.2.0
#  ✓ Tag message includes release summary
#  ✓ Pushed commit and tag to origin
#
#  Handing off to github-project-manager for release."

# Step 5: GitHub Release
"Create GitHub release for v1.2.0"

# github-project-manager response:
# "GitHub Release published:
#  ✓ Release v1.2.0 created
#  ✓ Release notes attached
#  ✓ Marked as latest release
#  ✓ URL: https://github.com/user/repo/releases/tag/v1.2.0
#
#  Release complete!"
```

---

## Decision Tree

```
Start: Ready to release?
    ↓
Is there a feature branch to merge?
├─ Yes → Start at Step 1 (mergemaster)
└─ No → Is main ready to release as-is?
    ├─ Yes → Start at Step 3 (docs-specialist)
    └─ No → Not ready for release
    ↓
Is this a breaking change?
├─ Yes → MAJOR version bump (v2.0.0)
└─ No → Continue
    ↓
Is this a new feature?
├─ Yes → MINOR version bump (v1.1.0)
└─ No → PATCH version bump (v1.0.1)
```

---

## Quick Reference

### Commands Cheat Sheet

```bash
# Pre-Release Check
"Check if [branch] is ready to merge"
"Verify branch status for release"

# Branch Merge
"Merge [branch] into main"
"Integrate feature branch for release"

# Version Bump
"Update changelog for [major|minor|patch] release"
"Prepare release notes for v[X.Y.Z]"

# Tag Creation
"Create tag v[X.Y.Z] and push"
"Tag this release as v[X.Y.Z]"

# GitHub Release
"Create GitHub release for v[X.Y.Z]"
"Publish release with notes"
```

### Agent Assignment Summary

| Step | Agent | Primary Action |
|------|-------|----------------|
| Pre-Release Check | mergemaster | Verify branch readiness |
| Branch Merge | mergemaster | Merge to main |
| Version Bump | docs-specialist | Update changelog |
| Tag Creation | git-manager | Create and push tag |
| GitHub Release | github-project-manager | Publish release |

---

## Changelog Format

The changelog should follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- New feature X for better Y
- Support for Z

### Changed
- Improved performance of A
- Updated B to use new approach

### Fixed
- Bug where C would cause D
- Issue #42: E not working correctly

### Removed
- Deprecated feature F
```

---

## Best Practices

### 1. Release Often
Small, frequent releases are better than large, infrequent ones. They're easier to test and roll back if needed.

### 2. Write Good Release Notes
Users read release notes. Make them clear and user-focused, not developer-focused.

### 3. Tag Consistently
Always use the `v` prefix (e.g., `v1.2.0` not `1.2.0`) for consistency.

### 4. Don't Skip Steps
Even for small releases, follow the workflow to maintain consistency.

### 5. Verify Before Publishing
Once a GitHub release is published, it's visible to users. Double-check everything.

---

## Troubleshooting

### Problem: Merge Conflicts

**Solution:** Let mergemaster resolve conflicts. If complex, may need to return to development workflow to fix conflicts in the feature branch first.

### Problem: Forgot to Update Changelog

**Solution:** Don't tag yet. Have docs-specialist update changelog, commit, then proceed to tagging.

### Problem: Wrong Version Number Tagged

**Solution:** Delete the incorrect tag locally and remotely, then create the correct one:
```bash
git tag -d v1.2.0
git push origin :refs/tags/v1.2.0
git tag v1.2.1
git push origin v1.2.1
```

### Problem: Release Notes Need Updates After Publishing

**Solution:** Edit the release directly on GitHub - release notes can be updated without changing the tag.

### Problem: Forgot to Bump package.json Version

**Solution:** Update the version now and commit directly to main:
```bash
# Update package.json version field to match tag
npm version X.Y.Z --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: bump version to X.Y.Z"
git push
```
This ensures `npm run dev` displays the correct version.
