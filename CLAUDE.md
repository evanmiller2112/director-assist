# Claude Code Instructions for Director Assist

## Development Workflow

**IMPORTANT:** This project uses a multi-agent TDD pipeline. Always follow the documented workflow in `docs/AGENT_WORKFLOW.md`.

### The Pipeline

For any feature or bug fix, use the appropriate agents in order:

1. **github-project-manager** - Select and validate issues
2. **Plan agent** - Design implementation approach (skip for trivial fixes)
3. **unit-test-expert** - Write tests FIRST (RED phase - tests should fail)
4. **senior-web-architect** - Implement code to pass tests (GREEN phase)
5. **qa-expert** - Validate against requirements
6. **draw-steel-web-reviewer** - Review Draw Steel accuracy (if game-related)
7. **docs-specialist** - Update documentation
8. **git-manager** - Commit changes (atomic: code + tests + docs together)

### Workflow Variants

| Type | Steps | When to Use |
|------|-------|-------------|
| Simple Bug Fix | 1→3→4→5→7→8 | Clear bug, obvious fix, no game mechanics |
| Standard Feature | 1→2→3→4→5→7→8 | New features not involving Draw Steel |
| Draw Steel Feature | 1→2→3→4→5→6→7→8 | Anything involving game mechanics |

### Key Principles

- **Tests first (TDD):** unit-test-expert writes failing tests BEFORE senior-web-architect implements
- **Agents do the work:** Use specialized agents, don't implement code directly
- **Atomic commits:** Code + tests + docs committed together via git-manager
- **QA is automatic:** Always run qa-expert after implementation, don't wait to be asked

### Quick Reference

```
"Select issue #XX" → github-project-manager
"Plan this feature" → Plan agent
"Write tests for..." → unit-test-expert
"Implement to pass tests" → senior-web-architect
"Validate the implementation" → qa-expert
"Review for Draw Steel accuracy" → draw-steel-web-reviewer
"Update documentation" → docs-specialist
"Commit the changes" → git-manager
```

### Release Workflow

For creating new releases, see `docs/RELEASE_WORKFLOW.md`. The release pipeline:

1. **qa-expert** - Pre-release validation (`npm run check`, `vitest run`, `npm run build`)
2. **mergemaster** - Merge feature branch into main
3. **qa-expert** - Post-merge validation (re-run check + tests after conflict resolution)
4. **docs-specialist** - Update changelog, version bump
5. **git-manager** - Create version tag
6. **github-project-manager** - Publish GitHub release
7. **github-project-manager** - Close the version milestone

**IMPORTANT:** Always validate before AND after merge. Conflict resolution can introduce TypeScript errors.

```
"Validate for release" → qa-expert (npm run check, vitest run, npm run build)
"Merge branch into main" → mergemaster
"Re-validate after merge" → qa-expert
"Update changelog" → docs-specialist
"Create tag vX.Y.Z" → git-manager
"Publish GitHub release" → github-project-manager
"Close milestone vX.Y.Z" → github-project-manager
```

## Tech Stack

- SvelteKit with Svelte 5 runes ($state, $derived, $effect)
- TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB) for local storage
- Lucide icons

## Commands

- `npm run dev` - Start dev server
- `npm run check` - TypeScript type checking
- `npm run build` - Production build
