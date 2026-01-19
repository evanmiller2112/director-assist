# Director Assist Roadmap

This document outlines the future direction of Director Assist, including plans for a hosted service. We're committed to transparency—this is published so you know exactly what we're building and why.

## Our Philosophy

**Director Assist will always be free and self-hostable.** The core application—campaign management, entity tracking, relationship mapping, AI-assisted content generation—works entirely in your browser with your own API key.

If we build a hosted service, it will only charge for things that genuinely require cloud infrastructure:

- **Hosting** — We run the servers so you don't have to
- **Storage** — Your campaigns synced and backed up across devices
- **LLM Integration** — We handle API costs, rate limits, and model access

We will not paywall features that can work locally. This isn't just a promise—the codebase is open source. You can always self-host.

---

## For Users: What We're Planning

### Current: Self-Hosted (Always Free)

Everything the app does today:
- Full campaign and entity management
- AI content generation (with your API key)
- Relationship mapping and visualization
- Session planning tools
- Local data storage in your browser

### Future: Hosted Service (Paid)

A managed version for Directors who want convenience:

| Feature | Why It Needs Cloud |
|---------|-------------------|
| Multi-device sync | Your campaigns follow you—start on desktop, continue on tablet at the table |
| Automatic backups | Never lose a campaign to a browser wipe |
| No API key needed | We handle Claude/LLM costs, you just use it |
| Collaboration | Share campaigns with co-Directors (future) |
| Player views | Read-only access for players to see initiative, their character info (future) |

### Data Portability: Open Campaign Format (OCF)

We're developing **OCF (Open Campaign Format)**—an open JSON schema for campaign data. This means:

- **Full export anytime** — Download your complete campaign as OCF JSON
- **No lock-in** — Import into self-hosted Director Assist or any tool that supports OCF
- **Community interop** — Other TTRPG tools can adopt OCF for data exchange

See [docs/OCF_SPEC.md](docs/OCF_SPEC.md) for the technical specification.

### Potential Future Features

These are ideas we're considering for the hosted service. They depend on user demand:

- **Content packs** — Pre-built monsters, NPCs, encounters
- **Community library** — Share your custom entity types with others
- **Session transcripts** — Searchable history of your AI conversations
- **Campaign analytics** — Session counts, most-used NPCs, encounter stats
- **Fine-tuned AI** — Prompts optimized from aggregate usage patterns

---

## For Contributors: Technical Roadmap

### Current Architecture

- **Frontend**: SvelteKit + Svelte 5 (runes), TypeScript, Tailwind CSS
- **Storage**: Dexie.js (IndexedDB) for local persistence
- **AI**: Direct Anthropic API calls from client (BYOK model)

### Hosted Service Architecture (Planned)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   SvelteKit     │────▶│   API Layer     │────▶│   PostgreSQL    │
│   Frontend      │     │   (auth, sync)  │     │   (campaigns)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   LLM Proxy     │
                        │   (rate limit,  │
                        │    billing)     │
                        └─────────────────┘
```

Key technical decisions to make:
- [ ] Auth provider (likely OAuth with GitHub/Google)
- [ ] Sync strategy (CRDT vs last-write-wins vs operational transform)
- [ ] Hosting platform (Vercel, Fly.io, self-managed)
- [ ] Payment processor (Stripe)

### OCF Implementation

The Open Campaign Format will be implemented in phases:

1. **Phase 1**: Export current campaign to OCF JSON (extends existing backup)
2. **Phase 2**: Import OCF JSON into Director Assist
3. **Phase 3**: Publish OCF schema for community adoption
4. **Phase 4**: Streaming sync format for hosted service

### Contributing to the Hosted Service

The hosted service code will live in this repository (likely under `src/lib/server/` and `src/routes/api/`). We'll use feature flags to enable/disable hosted features.

If you're interested in contributing to the hosted service specifically:
- Auth and user management
- Sync and conflict resolution
- Payment integration
- Infrastructure/DevOps

Open an issue or discussion to coordinate.

---

## Timeline

No specific dates—we'll ship when it's ready. Current priorities:

1. **Now**: Continue improving the self-hosted experience
2. **Next**: OCF specification and export implementation
3. **Later**: Hosted service MVP (sync + LLM proxy)
4. **Future**: Collaboration features

---

## Feedback

Have thoughts on this roadmap? Want to see something prioritized?

- Open an issue on GitHub
- Start a discussion
- PRs welcome

This is your tool. We're building it together.
