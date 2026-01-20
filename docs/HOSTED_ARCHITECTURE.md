# Hosted Architecture

This document describes how Director Assist supports both self-hosted and hosted modes from a single codebase.

## Core Principle

**Self-hosted is the default.** No environment variables, no configuration, no backend required. Clone, `npm install`, `npm run dev`—it works.

Hosted mode is opt-in via environment variable and requires external backend services.

## Environment Detection

```typescript
// src/lib/config/hosted.ts

// Hosted mode requires explicit opt-in
export const HOSTED_MODE = import.meta.env.VITE_HOSTED_MODE === 'true';

// Helper for conditional features
export function isHosted(): boolean {
  return HOSTED_MODE;
}
```

| Environment | `VITE_HOSTED_MODE` | Behavior |
|-------------|-------------------|----------|
| Self-hosted | undefined / unset | Local IndexedDB, BYOK for AI, no auth |
| Hosted | `'true'` | Remote sync, managed AI, user accounts |

## Feature Matrix

| Feature | Self-Hosted | Hosted |
|---------|-------------|--------|
| Campaign storage | IndexedDB (local) | PostgreSQL (remote) |
| AI integration | User's API key | Managed (no key needed) |
| Authentication | None | OAuth (GitHub/Google) |
| Multi-device sync | N/A | Yes |
| Backups | Manual OCF export | Automatic |
| Billing | N/A | Stripe integration |
| Offline support | Always works | Works, syncs when online |

## Directory Structure

```
src/
├── lib/
│   ├── config/
│   │   └── hosted.ts            # HOSTED_MODE detection
│   │
│   ├── db/                      # Existing IndexedDB (self-hosted storage)
│   │   └── ...
│   │
│   ├── services/
│   │   ├── ai.ts                # Existing AI service
│   │   ├── ai-hosted.ts         # Hosted AI (uses backend proxy)
│   │   ├── storage.ts           # Storage abstraction layer
│   │   ├── storage-local.ts     # IndexedDB implementation (default)
│   │   └── storage-remote.ts    # Remote sync implementation (hosted)
│   │
│   └── components/
│       └── hosted/              # Hosted-only UI components
│           ├── AccountMenu.svelte
│           ├── SyncStatus.svelte
│           └── BillingSettings.svelte
│
├── routes/
│   ├── (app)/                   # Main app routes (shared)
│   │   └── ...
│   │
│   └── api/                     # API routes (hosted only, no-op in self-hosted)
│       ├── auth/
│       │   ├── login/+server.ts
│       │   ├── logout/+server.ts
│       │   └── callback/+server.ts
│       ├── sync/
│       │   └── +server.ts
│       └── ai/
│           └── +server.ts       # LLM proxy endpoint
│
└── hooks.server.ts              # Auth middleware (hosted only)
```

## Implementation Patterns

### Storage Abstraction

```typescript
// src/lib/services/storage.ts
import { HOSTED_MODE } from '$lib/config/hosted';
import { LocalStorage } from './storage-local';
import { RemoteStorage } from './storage-remote';

// Factory returns appropriate implementation
export function createStorage() {
  if (HOSTED_MODE) {
    return new RemoteStorage();
  }
  return new LocalStorage();
}

// Interface both implementations share
export interface StorageService {
  getEntities(campaignId: string): Promise<Entity[]>;
  saveEntity(entity: Entity): Promise<void>;
  deleteEntity(id: string): Promise<void>;
  // ... etc
}
```

### AI Service Abstraction

```typescript
// src/lib/services/ai.ts
import { HOSTED_MODE } from '$lib/config/hosted';

export async function chat(messages: Message[], context: Entity[]) {
  if (HOSTED_MODE) {
    // Use backend proxy (no API key needed client-side)
    return fetch('/api/ai', {
      method: 'POST',
      body: JSON.stringify({ messages, context }),
      credentials: 'include' // Auth cookie
    });
  }

  // Self-hosted: direct API call with user's key
  const apiKey = getStoredApiKey();
  return anthropicClient.messages.create({ ... });
}
```

### Conditional UI

```svelte
<!-- src/lib/components/Header.svelte -->
<script>
  import { HOSTED_MODE } from '$lib/config/hosted';
  import AccountMenu from './hosted/AccountMenu.svelte';
  import SyncStatus from './hosted/SyncStatus.svelte';
</script>

<header>
  <Logo />
  <Nav />

  {#if HOSTED_MODE}
    <SyncStatus />
    <AccountMenu />
  {:else}
    <SettingsButton />
  {/if}
</header>
```

### API Routes (Hosted Only)

```typescript
// src/routes/api/ai/+server.ts
import { HOSTED_MODE } from '$lib/config/hosted';
import { error } from '@sveltejs/kit';

export async function POST({ request, locals }) {
  // These endpoints only function in hosted mode
  if (!HOSTED_MODE) {
    throw error(404, 'Not found');
  }

  // Verify auth
  if (!locals.user) {
    throw error(401, 'Unauthorized');
  }

  // Check usage/billing
  // Proxy to Anthropic
  // ...
}
```

## External Services (Separate Repositories)

The hosted mode requires backend services that live outside this codebase:

| Service | Purpose | Likely Tech |
|---------|---------|-------------|
| **Auth Service** | OAuth, sessions, user management | Could be managed (Auth0, Clerk) or custom |
| **Database** | Campaign storage, user data | PostgreSQL |
| **Sync Service** | Real-time sync, conflict resolution | Custom or managed (Supabase, Convex) |
| **Billing Service** | Subscriptions, usage tracking | Stripe |
| **LLM Proxy** | Rate limiting, cost tracking, model routing | Custom service |

These would be in separate private repositories:
- `director-assist-api` — Auth, sync, billing logic
- `director-assist-infra` — Terraform/Pulumi for deployment

## Migration Path

### For Self-Hosted Users

Nothing changes. The app works exactly as it does today.

### For Hosted Users

1. Sign up creates account, provisions storage
2. Existing self-hosted data can be imported via OCF
3. Data syncs automatically across devices
4. Can export to OCF anytime and switch to self-hosted

## Build Configurations

```bash
# Self-hosted (default)
npm run build

# Hosted
VITE_HOSTED_MODE=true npm run build
```

Both produce the same SvelteKit app; the environment variable controls runtime behavior.

## Testing Strategy

- Unit tests run in both modes
- E2E tests have separate suites for self-hosted and hosted
- CI tests self-hosted by default
- Hosted tests require test backend services

## Security Considerations

- Hosted API routes reject requests when `HOSTED_MODE` is false
- Auth cookies are httpOnly, secure, sameSite
- API key never leaves client in self-hosted mode
- Hosted mode never exposes API key to client
- Rate limiting on all hosted endpoints
