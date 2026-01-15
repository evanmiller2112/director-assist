# CI/CD Workflow Diagrams

## Full Pipeline Overview

```
                            Your Development
                                  |
                    ┌─────────────┴─────────────┐
                    |                           |
              Push to main                  Create Git Tag
                    |                           |
                    v                           v
            ┌───────────────┐          ┌─────────────────┐
            │  CI Workflow  │          │ Release Workflow│
            │  (ci.yml)     │          │  (release.yml)  │
            └───────┬───────┘          └────────┬────────┘
                    |                           |
        ┌───────────┴────────┬────────┐         |
        |                    |        |         |
        v                    v        v         v
    ┌──────┐         ┌──────────┐ ┌────────┐ ┌─────────────┐
    │Type  │         │Lint Code │ │Build   │ │Auto Create  │
    │Check │         │with      │ │Prod    │ │GitHub       │
    │TS    │         │ESLint    │ │Bundle  │ │Release +    │
    └──────┘         └──────────┘ └────────┘ │Changelog    │
        |                  |          |       └─────────────┘
        └──────────────────┴──────────┘              |
                   |                                 |
            ┌──────v──────┐                    ┌────v─────────┐
            │All Checks   │                    │Release Page  │
            │Pass?        │                    │Updated on    │
            └──────┬──────┘                    │GitHub        │
                   |                           └──────────────┘
        ┌──────────v──────────┐
        │Deploy Workflow      │
        │(deploy.yml)         │
        └──────────┬──────────┘
                   |
        ┌──────────v──────────┐
        │Build Prod Bundle    │
        │Upload to GitHub     │
        │Pages                │
        └──────────┬──────────┘
                   |
        ┌──────────v──────────────────┐
        │Live Site Updated             │
        │https://evanmiller2112.      │
        │github.io/director-assist/   │
        └──────────────────────────────┘
```

## Detailed CI Workflow

```
Pull Request or Push to Main
         |
         v
    ┌─────────────────────────────┐
    │  Checkout Code              │
    │  Setup Node.js 20.x         │
    │  Restore npm Cache          │
    └────────────┬────────────────┘
                 |
                 v
    ┌─────────────────────────────┐
    │  Install Dependencies       │
    │  npm ci                     │
    └────────────┬────────────────┘
                 |
    ┌────────────v────────────────┐
    │  Type Checking              │
    │  svelte-check + TypeScript  │
    │  npm run check              │
    └────────────┬────────────────┘
                 |
                 v (if failed)
            ┌────────────┐
            │ Fail Build │
            │ Notify Dev │
            └────────────┘
                 |
                 v (if passed)
    ┌─────────────────────────────┐
    │  Lint Code                  │
    │  ESLint Check               │
    │  npm run lint               │
    └────────────┬────────────────┘
                 |
                 v (if failed)
            ┌────────────┐
            │ Fail Build │
            │ Notify Dev │
            └────────────┘
                 |
                 v (if passed)
    ┌─────────────────────────────┐
    │  Build for Production       │
    │  SvelteKit Static Build     │
    │  npm run build              │
    │  Outputs: ./build/          │
    └────────────┬────────────────┘
                 |
                 v (if failed)
            ┌────────────────┐
            │ Fail Build     │
            │ Notify Dev     │
            │ Show logs      │
            └────────────────┘
                 |
                 v (if passed)
    ┌─────────────────────────────┐
    │  Upload Build Artifacts     │
    │  For Deploy Workflow        │
    │  Keep 1 day                 │
    └────────────┬────────────────┘
                 |
                 v
        ┌──────────────────┐
        │  SUCCESS!        │
        │  Ready to Deploy │
        └──────────────────┘
```

## Deployment Workflow

```
CI Workflow Succeeded
         |
         v
    ┌──────────────────────────┐
    │ Checkout Code            │
    │ Setup Node.js            │
    │ Restore npm Cache        │
    └────────────┬─────────────┘
                 |
                 v
    ┌──────────────────────────┐
    │ Install Dependencies     │
    │ npm ci                   │
    └────────────┬─────────────┘
                 |
                 v
    ┌──────────────────────────┐
    │ Build Production Bundle  │
    │ npm run build            │
    │ Creates: ./build/        │
    └────────────┬─────────────┘
                 |
                 v
    ┌──────────────────────────┐
    │ Configure GitHub Pages   │
    │ (Authentication + API)   │
    └────────────┬─────────────┘
                 |
                 v
    ┌──────────────────────────┐
    │ Upload Build Artifact    │
    │ To GitHub Pages Storage  │
    └────────────┬─────────────┘
                 |
                 v
    ┌──────────────────────────┐
    │ Deploy to GitHub Pages   │
    │ Make Live                │
    └────────────┬─────────────┘
                 |
                 v
    ┌──────────────────────────┐
    │      SUCCESS!            │
    │                          │
    │ Site Live at:            │
    │ https://evanmiller2112.  │
    │ github.io/director-assist│
    └──────────────────────────┘
```

## Release Workflow

```
Git Tag Pushed (v1.0.0)
         |
         v
    ┌──────────────────────────┐
    │ Fetch Full Repo History  │
    │ (for changelog)          │
    └────────────┬─────────────┘
                 |
                 v
    ┌──────────────────────────┐
    │ Setup Node.js            │
    │ Install Dependencies     │
    └────────────┬─────────────┘
                 |
                 v
    ┌──────────────────────────┐
    │ Build Project            │
    │ npm run build            │
    └────────────┬─────────────┘
                 |
                 v (if failed)
            ┌─────────────┐
            │ Fail: No    │
            │ Release     │
            │ Created     │
            └─────────────┘
                 |
                 v (if passed)
    ┌──────────────────────────┐
    │ Generate Changelog       │
    │ Get commits since:       │
    │ - Last tag (if exists)   │
    │ - Or all commits         │
    │ Format as list           │
    └────────────┬─────────────┘
                 |
                 v
    ┌──────────────────────────┐
    │ Create GitHub Release    │
    │ - Tag: v1.0.0            │
    │ - Changelog body         │
    │ - Detect pre-release     │
    │   (alpha/beta/rc)        │
    └────────────┬─────────────┘
                 |
                 v
    ┌──────────────────────────┐
    │      SUCCESS!            │
    │                          │
    │ Release Visible at:      │
    │ /releases                │
    └──────────────────────────┘
```

## State Transitions

### For a Pull Request

```
┌─────────────┐
│ PR Created  │
└──────┬──────┘
       │
       v
┌──────────────┐     ┌────────────────┐
│ CI Checks    ├────>│ Show Status     │
│ Run          │     │ in PR           │
└──────┬───────┘     └────────────────┘
       │
       v
   ┌─────────────┐
   │ Pass?       │
   └──┬──────┬──┘
      │      │
   Yes│      │No
      v      v
   ┌──┐  ┌────────────┐
   │✓ │  │ ✗ Blocked  │
   │  │  │ Fix Issues │
   └──┘  └────────────┘
   Can         |
   Merge       v
              ┌─────────┐
              │ Re-push │
              │ Changes │
              └────┬────┘
                   |
            (checks run again)
```

### For a Commit to Main

```
┌──────────────┐
│ Push to main │
└──────┬───────┘
       │
       v
┌────────────────┐
│ CI Workflow    │
│ Runs           │
└────────┬───────┘
         │
         v
    ┌─────────┐
    │ Pass?   │
    └──┬───┬──┘
       │   │
    Yes│   │No
       │   │
       v   v
   ┌──┐  ┌─────────────┐
   │✓ │  │ Fail Notify │
   └──┘  │ Check logs  │
   |     │ in Actions  │
   v     └─────────────┘
┌─────────────┐
│Deploy Workflow
│ Runs
└────────┬────┘
         │
         v
    ┌────────────┐
    │Upload Site │
    │Go Live!    │
    └────────────┘
```

### For a Release Tag

```
┌────────────────────┐
│ git tag v1.0.0     │
│ git push origin ... │
└────────┬───────────┘
         │
         v
┌──────────────────┐
│Release Workflow  │
│Runs              │
└────────┬─────────┘
         │
         v
┌──────────────────┐
│Build + Generate  │
│Changelog         │
└────────┬─────────┘
         │
         v
    ┌─────────┐
    │ Success?│
    └──┬───┬──┘
       │   │
    Yes│   │No
       │   │
       v   v
   ┌────┐ ┌──────────┐
   │    │ │No Release│
   │✓   │ │Created   │
   │    │ │Check Logs│
   └────┘ └──────────┘
   |
   v
┌──────────────────┐
│GitHub Release    │
│Page Updated      │
│With Changelog    │
└──────────────────┘
```

## Timing Expectations

### Pull Request CI Check
- **Total time**: 2-3 minutes
- Node setup: 30s
- Dependency install: 20-40s
- Type check: 10-20s
- Lint: 5-10s
- Build: 30-60s

### Deployment to Production
- **Total time**: 3-5 minutes after push
- CI runs: 2-3 min
- Deploy uploads: 30-60s
- GitHub Pages CDN: 30-60s
- **Total**: ~4-6 minutes until live

### Release Creation
- **Total time**: 2-3 minutes
- CI + build: 2-3 min
- Release creation: <1s
- **Live immediately**: Refresh releases page

## Environment Variables

Currently: **None required**

All operations are public and don't need secrets.

### Future Additions
When you add features that need secrets:
```yaml
- name: Deploy to Vercel
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

Add secrets in: Settings → Secrets and variables → Actions
