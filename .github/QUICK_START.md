# Quick Start: CI/CD Pipeline Setup

Get your CI/CD pipeline live in 5 minutes.

## One-Time Setup (5 minutes)

### Step 1: Enable GitHub Pages
1. Go to https://github.com/evanmiller2112/director-assist/settings/pages
2. Under "Build and deployment", select "GitHub Actions"
3. Click Save
4. Done!

### Step 2: Test It Works
1. Make a small change to any file
2. Commit: `git commit -am "test: verify ci pipeline"`
3. Push: `git push origin main`
4. Go to Actions tab on GitHub
5. Watch the workflows run (should take 2-3 minutes)
6. Visit https://evanmiller2112.github.io/director-assist/ to see your site live

## Making Your First Release

### Quick Version (30 seconds)
```bash
# 1. Bump version
sed -i '' 's/"version": "0.1.0"/"version": "1.0.0"/' package.json

# 2. Update changelog (open in editor and add your changes)
nano CHANGELOG.md

# 3. Commit
git add package.json CHANGELOG.md
git commit -m "chore: release v1.0.0"

# 4. Create tag and push
git tag -a v1.0.0 -m "Release v1.0.0

## Features
- Initial release with director management
- Entity management (cast, crew, etc)
- Local storage with IndexedDB"

git push origin main
git push origin v1.0.0
```

GitHub Actions will automatically:
- ✓ Run all CI checks
- ✓ Create a GitHub Release
- ✓ Add changelog to release notes
- ✓ Mark pre-releases (if using alpha/beta)

### Detailed Version
See `.github/RELEASE_TEMPLATE.md` for step-by-step instructions.

## Daily Development Workflow

```bash
# Create feature
git checkout -b feature/my-feature

# Make changes
# ... edit files ...

# Verify locally
npm run check    # Type check
npm run lint     # Lint
npm run build    # Build
npm run preview  # Preview prod

# Commit when ready
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push -u origin feature/my-feature
# Create PR on GitHub

# Once approved, merge to main
# → CI runs automatically
# → Site deploys automatically
```

## Commands Cheat Sheet

```bash
# Local development
npm install      # Install deps
npm run dev      # Dev server at localhost:5173
npm run check    # TypeScript + Svelte check
npm run lint     # ESLint
npm run build    # Production build

# Git workflow
git checkout -b feature/name      # New feature branch
git commit -m "feat: description" # Commit with type
git push origin feature/name      # Push branch
# Create PR on GitHub
git push origin main              # After merge

# Making a release
git tag -a v1.0.0 -m "Release"    # Create tag
git push origin v1.0.0             # Push tag
# Release created automatically!
```

## What Each Workflow Does

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | Push to main, PRs | Type check, lint, build |
| `deploy.yml` | Push to main | Deploy to GitHub Pages |
| `release.yml` | Git tag push | Create GitHub Release |

## Monitoring Your Workflows

### GitHub Web UI (Best)
1. Your repo → Actions tab
2. See all runs with status
3. Click any run for details

### Command Line
```bash
# See recent commits
git log --oneline -5

# See tags
git tag -l

# See remote branches
git branch -r
```

## Common Issues & Fixes

**Q: Build fails locally but CI passes**
A: Run `npm ci` instead of `npm install`, use Node 20.x

**Q: Site not updating after push**
A:
1. Check Actions tab for failed workflows
2. Wait 1-2 minutes (GitHub needs time to deploy)
3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

**Q: Release not created**
A:
1. Tag must start with 'v': `git tag v1.0.0` (not `1.0.0`)
2. Check Actions for failed CI (must pass first)
3. Use annotated tags: `git tag -a v1.0.0 -m "msg"`

**Q: What's the live site URL?**
A: https://evanmiller2112.github.io/director-assist/

## Files You'll Edit

### Frequently
- `src/` - Your app code
- `CHANGELOG.md` - Before each release (add release notes)
- `package.json` - When changing version (before release)

### Rarely
- `.github/workflows/*.yml` - Only if you need advanced features
- `svelte.config.js` - Already configured correctly

### Never (Maintenance)
- Build outputs (auto-generated)
- `.svelte-kit/` (auto-generated)
- `node_modules/` (auto-generated)

## Release Checklist (Before Release)

- [ ] All features finished and tested
- [ ] Code reviewed and merged to main
- [ ] Local build works: `npm run build && npm run preview`
- [ ] Update `CHANGELOG.md`
- [ ] Update version in `package.json`
- [ ] Create and push Git tag

## Understanding Semantic Versioning

```
v MAJOR . MINOR . PATCH
  |       |       |
  |       |       +-- Bug fixes, patches: v1.0.1, v1.0.2
  |       +---------- New features: v1.1.0, v1.2.0
  +----------------- Breaking changes: v2.0.0
```

Examples:
- `v0.1.0` → Initial beta release
- `v1.0.0` → First stable release
- `v1.0.1` → Bug fix
- `v1.1.0` → New features (backward compatible)
- `v2.0.0` → Breaking changes
- `v1.0.0-beta.1` → Beta testing

## Next Steps

1. ✓ Set up GitHub Pages (see Step 1 above)
2. ✓ Test the pipeline with a small change
3. ✓ Create your first release (v1.0.0)
4. ✓ Share the live link: https://evanmiller2112.github.io/director-assist/

## Documentation

For more details:
- **Full Setup Guide**: `.github/CI_CD_SETUP.md`
- **Release Instructions**: `.github/RELEASE_TEMPLATE.md`
- **Workflow Diagrams**: `.github/WORKFLOW_DIAGRAM.md`
- **Implementation Details**: `.github/IMPLEMENTATION_SUMMARY.md`

## Still Have Questions?

1. Check `.github/CI_CD_SETUP.md` (comprehensive guide)
2. Check `.github/WORKFLOW_DIAGRAM.md` (visual explanations)
3. GitHub Actions docs: https://docs.github.com/actions
4. SvelteKit deployment: https://kit.svelte.dev/docs/adapters

You've got this!
