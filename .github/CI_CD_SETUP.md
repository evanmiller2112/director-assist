# CI/CD Setup Guide for director-assist

This document explains the CI/CD pipeline and how to use it effectively.

## Overview

The project uses **GitHub Actions** to automate:
1. **Continuous Integration (CI)** - Code quality checks on every push/PR
2. **Continuous Deployment (CD)** - Automatic deployment to GitHub Pages
3. **Release Management** - Automated release creation from Git tags

## Workflows Explained

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on:
- Every push to `main` branch
- Every pull request to `main` branch

Actions:
- **Type Check**: Runs `npm run check` (svelte-check + TypeScript)
- **Lint**: Runs `npm run lint` (ESLint)
- **Build**: Runs `npm run build` (SvelteKit production build)

**Purpose**: Ensures code quality and that the project builds successfully before merging.

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

Runs on:
- Every push to `main` branch (after CI passes)

Actions:
- Builds the project
- Uploads to GitHub Pages
- Sets environment URL

**Purpose**: Automatically deploys latest main branch to your live site.

**Live URL**: `https://evanmiller2112.github.io/director-assist/`

### 3. Release Workflow (`.github/workflows/release.yml`)

Runs on:
- Push of a Git tag matching `v*` (e.g., `v1.0.0`)

Actions:
- Builds the project
- Creates a GitHub Release with automatic changelog
- Marks pre-releases (alpha, beta, rc versions)

**Purpose**: Automates release documentation and GitHub Releases page.

## GitHub Pages Configuration

To enable GitHub Pages deployment, you need to configure it once:

### Steps:
1. Go to repository Settings → Pages
2. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
   - Leave blank (our workflow handles it)
3. Your site will be available at: `https://evanmiller2112.github.io/director-assist/`

### SvelteKit Static Adapter Setup

The `svelte.config.js` is already configured for static export:
```javascript
adapter: adapter({
  pages: 'build',
  assets: 'build',
  fallback: 'index.html',  // Client-side routing fallback
  precompress: false,
  strict: true
})
```

This generates a fully static site in the `build/` directory.

## Making a Release

### Quick Start

```bash
# 1. Update version in package.json
# From: "version": "0.1.0"
# To:   "version": "1.0.0"

# 2. Update CHANGELOG.md with release notes
# Add changes under a new [1.0.0] section

# 3. Commit changes
git add package.json CHANGELOG.md
git commit -m "chore: bump version to v1.0.0"

# 4. Create an annotated tag
git tag -a v1.0.0 -m "Release v1.0.0

## Features
- Feature X
- Feature Y

## Bug Fixes
- Fixed issue Z"

# 5. Push to GitHub
git push origin main
git push origin v1.0.0
```

### What Happens Next

1. GitHub Actions detects the tag push
2. Runs CI tests (must pass)
3. Creates a GitHub Release with:
   - Tag name as title
   - Changelog from commits since last release
   - Pre-release label (if using alpha/beta/rc)

### View Your Release

1. Go to your GitHub repo
2. Click "Releases" in the right sidebar
3. Your release will appear there with the changelog

## Version Numbering (Semantic Versioning)

Format: `v[MAJOR].[MINOR].[PATCH][-PRERELEASE]`

### When to Increment

**MAJOR** (v1.0.0 → v2.0.0):
- Breaking changes that require user migration
- Major UI overhaul
- Incompatible API changes

**MINOR** (v1.0.0 → v1.1.0):
- New features
- Non-breaking enhancements
- New entity types

**PATCH** (v1.0.0 → v1.0.1):
- Bug fixes
- Performance improvements
- Internal refactoring
- Dependency updates

### Pre-Release Versions

Use for testing before full release:
- `v1.0.0-alpha.1` - First alpha release
- `v1.0.0-beta.1` - First beta release
- `v1.0.0-rc.1` - Release candidate

GitHub Actions automatically marks these as pre-releases.

## Monitoring Your Workflows

### In GitHub Web UI

1. Go to your repo
2. Click "Actions" tab
3. See all workflow runs
4. Click any run to see detailed logs

### Workflow Status Badge

Add to your README.md:
```markdown
[![CI](https://github.com/evanmiller2112/director-assist/actions/workflows/ci.yml/badge.svg)](https://github.com/evanmiller2112/director-assist/actions/workflows/ci.yml)
```

## Troubleshooting

### Build Fails in CI but Works Locally

**Causes**:
- Different Node.js versions (CI uses 20.x)
- Cache issues
- Missing environment variables

**Solutions**:
1. Run `npm ci` instead of `npm install` locally
2. Check Node version: `node --version` (should be 20.x)
3. Clear npm cache: `npm cache clean --force`

### GitHub Pages Not Updating

**Causes**:
- Deploy workflow failed
- Pages not configured correctly

**Solutions**:
1. Check "Actions" tab for failed workflows
2. Verify Settings → Pages shows "GitHub Actions" as source
3. Wait 1-2 minutes for deployment (check "Deployments" tab)

### Release Not Created Automatically

**Causes**:
- Tag doesn't match `v*` pattern
- CI checks failed before release workflow
- Invalid Git tag format

**Solutions**:
1. Tag must start with 'v': `git tag v1.0.0` (not `1.0.0`)
2. Check Actions tab - CI workflow must pass first
3. Annotated tags work best: `git tag -a v1.0.0 -m "message"`

## Future Enhancements

### Testing
When you add tests (Vitest, Playwright):
```yaml
- name: Run tests
  run: npm test
```

### Build Size Analysis
Monitor build size changes:
```yaml
- name: Check build size
  run: npm run analyze  # Add this script to package.json
```

### Preview Deployments
Deploy PRs to preview URLs (requires Netlify/Vercel):
```yaml
- name: Deploy preview
  if: github.event_name == 'pull_request'
```

### Automated Dependency Updates
Use Dependabot to auto-update dependencies with auto-merge for patch versions.

## Files Modified/Created

- `.github/workflows/ci.yml` - CI pipeline
- `.github/workflows/deploy.yml` - GitHub Pages deployment
- `.github/workflows/release.yml` - Release automation
- `CHANGELOG.md` - Release notes documentation
- `.github/RELEASE_TEMPLATE.md` - Release checklist and guide
- `svelte.config.js` - Already configured, no changes needed

## Key Takeaways

1. **Every push to main = automatic live deployment**
2. **Every Git tag v* = automatic GitHub Release**
3. **Every PR/push = automatic CI checks**
4. **Zero configuration needed** - workflows ready to use
5. **Add tests later** - CI pipeline can be extended easily

## Questions?

- GitHub Actions docs: https://docs.github.com/actions
- SvelteKit deployment: https://kit.svelte.dev/docs/adapters
- Semantic Versioning: https://semver.org/
