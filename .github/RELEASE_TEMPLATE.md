# Release Checklist

## Pre-Release
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with release notes
- [ ] Review all commits since last release
- [ ] Ensure all CI checks pass
- [ ] Test the build locally: `npm run build && npm run preview`

## Creating the Release

### Using Git Command Line
```bash
# 1. Commit version bump
git add package.json CHANGELOG.md
git commit -m "chore: bump version to v1.0.0"

# 2. Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0

## Features
- New feature X
- Improvement Y

## Bug Fixes
- Fixed issue Z"

# 3. Push to remote
git push origin main
git push origin v1.0.0
```

### Tag Format
```
v[MAJOR].[MINOR].[PATCH][-PRERELEASE]

Examples:
v1.0.0              # Release
v1.1.0              # Minor release
v1.0.1              # Patch release
v2.0.0-alpha.1      # Alpha release
v2.0.0-beta.1       # Beta release
v2.0.0-rc.1         # Release candidate
```

## Post-Release
- [ ] Verify GitHub Release was created automatically
- [ ] Verify GitHub Pages deployment was successful
- [ ] Announce release (GitHub Discussions, etc.)
- [ ] Create next version section in CHANGELOG.md (Unreleased)

## Semantic Versioning Guide

Use MAJOR.MINOR.PATCH format:

- **MAJOR** (v1.0.0 → v2.0.0): Breaking changes to user-facing features
- **MINOR** (v1.0.0 → v1.1.0): New features that are backward compatible
- **PATCH** (v1.0.0 → v1.0.1): Bug fixes that are backward compatible

### Examples
- User-facing UI changes that break workflows → MAJOR
- New entity types or features → MINOR
- Bug fixes, dependency updates → PATCH
- Internal refactoring → PATCH
