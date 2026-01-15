# CI/CD Pipeline for director-assist

A production-ready, zero-maintenance CI/CD pipeline for your SvelteKit static site.

## What This Gives You

✓ **Automatic deployment** - Push to main → live in minutes
✓ **Quality gates** - Lint and type check on every push
✓ **Release automation** - Create releases with one Git tag
✓ **Auto-changelog** - Release notes generated from commits
✓ **Zero config** - Works out of the box
✓ **Free** - No external services needed

## Quick Start (5 minutes)

### 1. Enable GitHub Pages

Go to: https://github.com/evanmiller2112/director-assist/settings/pages

Under "Build and deployment", select "GitHub Actions" and save.

### 2. Test It

```bash
# Make a small change
git commit -am "test: verify pipeline"
git push origin main

# Watch it deploy:
# → Go to Actions tab on GitHub
# → See workflows run
# → Visit: https://evanmiller2112.github.io/director-assist/
```

### 3. Make Your First Release

```bash
# Update version in package.json (0.1.0 → 1.0.0)
# Update CHANGELOG.md with release notes
# Commit
git add package.json CHANGELOG.md
git commit -m "chore: release v1.0.0"

# Create release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Release created automatically!
```

## How It Works

### On Every Push to Main
1. **CI Workflow** runs (2-3 min)
   - Type check: TypeScript + Svelte validation
   - Lint: ESLint checks
   - Build: Production build
2. **Deploy Workflow** runs (1-2 min)
   - Uploads to GitHub Pages
   - Site goes live

### On Every Git Tag (v*)
1. **Release Workflow** runs (2-3 min)
   - Creates GitHub Release
   - Auto-generates changelog from commits
   - Detects pre-releases (alpha/beta/rc)

## Key Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Continuous Integration (type check, lint, build) |
| `.github/workflows/deploy.yml` | Deploy to GitHub Pages |
| `.github/workflows/release.yml` | Create GitHub Releases |
| `CHANGELOG.md` | Release notes (update before releasing) |
| `CI_CD_SUMMARY.txt` | Quick reference card |

## Documentation

Start with one of these based on your needs:

- **Quick Start**: `.github/QUICK_START.md` (5-minute guide)
- **Full Setup**: `.github/CI_CD_SETUP.md` (comprehensive)
- **Visual Guide**: `.github/WORKFLOW_DIAGRAM.md` (flowcharts)
- **Release Guide**: `.github/RELEASE_TEMPLATE.md` (step-by-step)
- **Implementation**: `.github/IMPLEMENTATION_SUMMARY.md` (what was created)
- **Index**: `.github/README.md` (documentation overview)

## Common Commands

```bash
# Local development
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
npm run check    # Type check
npm run lint     # Lint code

# Deployment (automatic on push)
git push origin main

# Release (automatic on tag)
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Your Live Site

https://evanmiller2112.github.io/director-assist/

Automatically updated every time you push to main.

## Project Structure

```
.github/
├── workflows/          # GitHub Actions workflows
│   ├── ci.yml
│   ├── deploy.yml
│   └── release.yml
└── [documentation files]

CHANGELOG.md            # Release notes
CI_CD_SUMMARY.txt       # Quick reference
CI_CD_README.md         # This file
```

## Next Steps

1. Enable GitHub Pages (see Quick Start above)
2. Push a test commit to verify everything works
3. Create your first release (v1.0.0)
4. Read `.github/QUICK_START.md` for more details

## Questions?

- **Getting started**: `.github/QUICK_START.md`
- **How it works**: `.github/WORKFLOW_DIAGRAM.md`
- **Full details**: `.github/CI_CD_SETUP.md`
- **Releases**: `.github/RELEASE_TEMPLATE.md`

Everything is documented in the `.github/` directory.

## Status

Your pipeline is **ready to use**. Just enable GitHub Pages and you're done!

---

Created: 2026-01-15
For: director-assist SvelteKit project
Type: CI/CD with GitHub Actions + GitHub Pages
