# CI/CD Pipeline Documentation

This directory contains the complete CI/CD setup for director-assist.

## Quick Links

**Start Here:**
- [Quick Start Guide](./QUICK_START.md) - Get up and running in 5 minutes
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - What was created and why

**Learning:**
- [Complete Setup Guide](./CI_CD_SETUP.md) - Detailed explanation of all workflows
- [Workflow Diagrams](./WORKFLOW_DIAGRAM.md) - Visual explanations of how everything works
- [Release Instructions](./RELEASE_TEMPLATE.md) - Step-by-step release process

**Reference:**
- [README Additions](./README_ADDITIONS.md) - Suggested updates to main README

## What's Included

### GitHub Actions Workflows
- **ci.yml** - Runs on every push/PR: type check, lint, build
- **deploy.yml** - Deploys main branch to GitHub Pages
- **release.yml** - Creates GitHub releases from Git tags

### Automation
- Automatic type checking and linting
- Automatic build on every push
- Automatic deployment to GitHub Pages (main branch)
- Automatic GitHub Release creation from Git tags
- Auto-generated changelog from commit history

### Documentation
- Complete setup guide with screenshots
- Release checklist and procedures
- Workflow diagrams for visual understanding
- Quick start for immediate use
- Troubleshooting guide

## Status

| Component | Status | Action |
|-----------|--------|--------|
| Workflows | ✓ Ready | Push a commit to test |
| GitHub Pages | ⏳ Pending | Enable in repo settings |
| CHANGELOG | ✓ Created | Update before releases |
| Documentation | ✓ Complete | Read for details |

## One-Time Setup Required

Enable GitHub Pages in your repository settings:

1. Go to: https://github.com/evanmiller2112/director-assist/settings/pages
2. Under "Build and deployment", select "GitHub Actions"
3. Click Save
4. Done!

After this, everything is automatic.

## Your Workflow

```
code changes → push → CI checks → deploy to live site
```

Or for releases:

```
bump version → commit → tag → automatic GitHub Release
```

## Key Features

✓ **Zero config needed** - Works out of the box
✓ **Type safe** - TypeScript + Svelte type checking
✓ **Code quality** - ESLint on every push
✓ **Auto-deploy** - Live within minutes of push
✓ **Release automation** - Tag → Release page
✓ **Free** - Built-in GitHub Actions for public repos
✓ **Fast** - SvelteKit static builds in ~1 minute

## File Structure

```
.github/
├── workflows/
│   ├── ci.yml              # CI pipeline (type check, lint, build)
│   ├── deploy.yml          # Deploy to GitHub Pages
│   └── release.yml         # Create GitHub releases
├── CI_CD_SETUP.md          # Complete guide
├── IMPLEMENTATION_SUMMARY.md # What was created
├── QUICK_START.md          # Get started in 5 min
├── RELEASE_TEMPLATE.md     # Release checklist
├── WORKFLOW_DIAGRAM.md     # Visual diagrams
├── README_ADDITIONS.md     # For main README
└── README.md               # This file
```

## What to Do First

1. **Read**: [Quick Start Guide](./QUICK_START.md) (5 minutes)
2. **Enable**: GitHub Pages in repo settings (1 minute)
3. **Test**: Push a small change to main (3 minutes)
4. **Verify**: Check Actions tab for workflow run
5. **Visit**: https://evanmiller2112.github.io/director-assist/

## Common Tasks

### Deploy a change
```bash
git push origin main  # Automatic!
```

### Create a release
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0  # Automatic release created!
```

### View workflow status
Go to: https://github.com/evanmiller2112/director-assist/actions

### View releases
Go to: https://github.com/evanmiller2112/director-assist/releases

## Troubleshooting

**Issue**: "Branch protection requires CI to pass"
- Solution: Check the Actions tab, fix issues shown in workflow logs

**Issue**: "GitHub Pages not updated"
- Solution: Verify Pages is set to "GitHub Actions" in settings

**Issue**: "Release not created from tag"
- Solution: Ensure tag starts with 'v' (e.g., v1.0.0 not 1.0.0)

See [CI_CD_SETUP.md](./CI_CD_SETUP.md#troubleshooting) for more.

## Next Steps

1. Read the [Quick Start Guide](./QUICK_START.md)
2. Enable GitHub Pages
3. Push your first change
4. Watch it deploy automatically
5. Create your first release

Detailed documentation is available in this directory for any questions.

---

**Questions?** Check the appropriate guide:
- Getting started → [QUICK_START.md](./QUICK_START.md)
- How it works → [WORKFLOW_DIAGRAM.md](./WORKFLOW_DIAGRAM.md)
- Full details → [CI_CD_SETUP.md](./CI_CD_SETUP.md)
- Making releases → [RELEASE_TEMPLATE.md](./RELEASE_TEMPLATE.md)
