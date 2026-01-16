# Contributing to Director Assist

Thank you for considering contributing to Director Assist. This document provides guidelines and information for developers who want to contribute.

## Getting Started

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/director-assist.git
cd director-assist
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

5. Open `http://localhost:5173` in your browser

### Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Type check
npm run check

# Type check in watch mode
npm run check:watch

# Lint code
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
director-assist/
├── src/
│   ├── lib/
│   │   ├── components/      # Svelte components
│   │   │   └── layout/      # Layout components (Header, Sidebar)
│   │   ├── config/          # Configuration files
│   │   │   └── entityTypes.ts  # Entity type definitions
│   │   ├── db/              # Database layer
│   │   │   ├── index.ts     # Dexie setup
│   │   │   └── repositories/  # Data access layer
│   │   ├── stores/          # Svelte stores (reactive state)
│   │   └── types/           # TypeScript type definitions
│   │       ├── entities.ts  # Entity types
│   │       ├── campaign.ts  # Campaign types
│   │       └── ai.ts        # AI integration types
│   ├── routes/              # SvelteKit routes (file-based routing)
│   │   ├── +layout.svelte   # Root layout
│   │   ├── +page.svelte     # Dashboard
│   │   ├── entities/        # Entity management routes
│   │   └── settings/        # Settings page
│   ├── app.css              # Global styles
│   ├── app.html             # HTML template
│   └── app.d.ts             # TypeScript declarations
├── static/                  # Static assets
├── package.json
├── svelte.config.js         # SvelteKit configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Define types explicitly rather than relying on inference for public APIs
- Use interfaces for object shapes, types for unions/primitives
- Avoid `any` - use `unknown` if the type is truly unknown

```typescript
// Good
interface Campaign {
  id: string;
  name: string;
  description: string;
}

// Avoid
const campaign: any = { ... };
```

### Svelte Components

- Use Svelte 5 runes API (`$state`, `$derived`, `$effect`)
- Keep components focused and single-purpose
- Extract reusable logic into stores or utilities
- Use TypeScript in `<script lang="ts">` blocks

```svelte
<script lang="ts">
  import { campaignStore } from '$lib/stores';

  let count = $state(0);
  const doubled = $derived(count * 2);
</script>
```

### File Naming

- Components: PascalCase (`EntityCard.svelte`, `Header.svelte`)
- Utilities/helpers: camelCase (`entityHelpers.ts`)
- Types: camelCase for files, PascalCase for type names (`campaign.ts` contains `Campaign` type)
- Routes: kebab-case or lowercase (`+page.svelte`, `entities/[type]/+page.svelte`)

### Code Organization

- Group related functionality together
- Keep files focused and under 300 lines when possible
- Use barrel exports (`index.ts`) for clean imports
- Put shared types in `src/lib/types/`
- Put shared utilities in appropriate folders

### Comments

- Write comments for complex logic or non-obvious behavior
- Use JSDoc for functions that will be used across files
- Avoid redundant comments that just restate the code

```typescript
// Good - explains WHY
// Generate a unique ID to avoid collisions across imports
const id = nanoid();

// Unnecessary - obvious from code
// Set the name to the provided name
entity.name = name;
```

### Git Commit Messages

Follow the conventional commits format:

```
<type>(<scope>): <subject>

<body>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

Examples:
```
feat(entities): add support for custom entity types
fix(search): resolve case-sensitive search issue
docs: update installation instructions
refactor(db): simplify entity repository queries
```

## Architecture Guidelines

### Data Flow

1. **User Action** → Component event handler
2. **Store Update** → Modify Svelte store using runes
3. **Database Sync** → Store triggers database repository
4. **UI Update** → Svelte reactivity updates components

### Adding a New Entity Type

1. Add the type to `EntityType` in `src/lib/types/entities.ts`
2. Add the definition to `BUILT_IN_ENTITY_TYPES` in `src/lib/config/entityTypes.ts`
3. Add icon mapping if needed
4. The rest works automatically through the dynamic system

### Adding a New Field Type

The dynamic field system supports 13 field types. To add a new field type:

1. Add the type to `FieldType` in `src/lib/types/entities.ts`
2. Implement rendering logic in entity forms:
   - `/src/routes/entities/[type]/new/+page.svelte` (create form)
   - `/src/routes/entities/[type]/[id]/edit/+page.svelte` (edit form)
   - `/src/routes/entities/[type]/[id]/+page.svelte` (detail view)
3. Add to `FieldDefinitionEditor.svelte` if applicable
4. Update field value validation in `src/lib/utils/validation.ts`

**Supported Field Types:**
- `text` - Single-line text input
- `textarea` - Multi-line text input
- `richtext` - Markdown editor
- `number` - Numeric input
- `boolean` - Checkbox (Yes/No)
- `select` - Single-choice dropdown
- `multi-select` - Multiple-choice checkboxes
- `tags` - Comma-separated tag input
- `entity-ref` - Single entity reference with searchable dropdown
- `entity-refs` - Multiple entity references with chips
- `date` - Freeform date/timeline input
- `url` - URL input with validation and link preview
- `image` - Image upload with base64 storage and preview

### Database Changes

If you need to change the database schema:

1. Update interfaces in `src/lib/types/`
2. Increment the version in `src/lib/db/index.ts`
3. Add a migration in the version upgrade
4. Test with existing data

```typescript
this.version(2).stores({
  entities: 'id, type, name, *tags, createdAt, updatedAt, newField'
}).upgrade(tx => {
  // Migration logic
});
```

## Testing Guidelines

Currently, the project does not have automated tests. Contributions to add testing infrastructure are welcome.

When making changes, manually test:
- Creating entities (via `/entities/[type]/new`)
- Viewing entity details (via `/entities/[type]/[id]`)
- Editing entities (via `/entities/[type]/[id]/edit`)
- Deleting entities (via delete button on detail page)
- Entity relationships (creating and viewing links)
- Search functionality (finding entities by name, description, tags)
- Theme switching (light/dark/system mode)
- Backup export/import (settings page)
- Browser refresh (data persistence in IndexedDB)

## Pull Request Process

1. Create a feature branch from `main`:
```bash
git checkout -b feat/your-feature-name
```

2. Make your changes following the code style guidelines

3. Test your changes thoroughly

4. Commit with clear, descriptive messages

5. Push to your fork:
```bash
git push origin feat/your-feature-name
```

6. Open a Pull Request against the `main` branch

7. In your PR description:
   - Explain what the change does
   - Reference any related issues
   - Include screenshots for UI changes
   - List any breaking changes

8. Wait for review and address feedback

## Common Tasks

### Adding a New Route

1. Create a new directory in `src/routes/`
2. Add a `+page.svelte` file
3. Optionally add `+page.ts` for load functions
4. Link to the route from navigation

### Adding a New Store

1. Create a file in `src/lib/stores/`
2. Use Svelte 5 runes for reactive state
3. Export a singleton instance
4. Document the store's purpose

```typescript
// src/lib/stores/myStore.svelte.ts
class MyStore {
  myState = $state(initialValue);

  myAction() {
    this.myState = newValue;
  }
}

export const myStore = new MyStore();
```

### Working with IndexedDB

Use the repository pattern:
- Don't access `db` directly in components
- Use repository methods from `src/lib/db/repositories/`
- Use `liveQuery()` for reactive queries

```typescript
// In a component
import { entityRepository } from '$lib/db/repositories';

const entities = entityRepository.getAll(); // Returns Observable
```

## AI Integration Development

The AI assistant is scaffolded but not yet implemented. If you want to work on this:

1. Implement chat interface in a new route
2. Add API key management in settings
3. Create prompt templates for different generation types
4. Implement entity generation from AI responses
5. Add context building from existing entities

See `src/lib/types/ai.ts` for the planned interface.

## Design Principles

- **Local-first**: All data must work offline
- **Privacy**: No user data leaves the browser
- **Speed**: Instant search and navigation
- **Simplicity**: Easy to learn and use
- **Flexibility**: Support different playstyles
- **Accessibility**: Keyboard navigation, screen readers

## Getting Help

- Check existing issues on GitHub
- Open a new issue for bugs or feature requests
- Tag maintainers for questions
- Be respectful and patient

## Code of Conduct

- Be respectful to all contributors
- Provide constructive feedback
- Focus on the code, not the person
- Help create a welcoming environment

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
