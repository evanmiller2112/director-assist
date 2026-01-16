# Test Files Index

Complete index of all test-related files created for the Global Entity Search feature.

## Configuration Files

### `/vitest.config.ts`
**Purpose**: Main Vitest configuration for the project
**Key Settings**:
- jsdom environment for DOM testing
- Path aliases for clean imports ($lib, $app)
- Test file patterns
- Coverage configuration

**Usage**:
```bash
# Uses this config automatically
npm test
npm run test:coverage
```

### `/package.json` (modified)
**Changes Added**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Test Setup Files

### `/src/tests/setup.ts`
**Purpose**: Global test environment configuration
**Contents**:
- Imports @testing-library/jest-dom matchers
- Configures automatic cleanup
- Mocks window.matchMedia
- Runs before every test file

**When to modify**: When adding global test utilities or mocks

## Mock Files

### `/src/tests/mocks/stores.ts`
**Purpose**: Mock store creators for testing
**Exports**:
- `createMockEntitiesStore()` - Entities store with working filter logic
- `createMockCampaignStore()` - Campaign store
- `createMockUiStore()` - UI state store
- `createMockNotificationStore()` - Notification system

**Usage**:
```typescript
import { createMockEntitiesStore } from '../../../tests/mocks/stores';

const mockStore = createMockEntitiesStore();
mockStore._setEntities([...entities]);
```

### `/src/tests/mocks/$app/navigation.ts`
**Purpose**: Mock SvelteKit navigation functions
**Exports**:
- `goto` - Mock navigation function
- `beforeNavigate`, `afterNavigate` - Navigation lifecycle hooks
- `invalidate`, `invalidateAll` - Data invalidation
- `preloadData`, `preloadCode` - Preloading

**Usage**:
```typescript
import { goto } from '$app/navigation';

await fireEvent.click(link);
expect(goto).toHaveBeenCalledWith('/path');
```

### `/src/tests/mocks/$app/stores.ts`
**Purpose**: Mock SvelteKit stores ($app/stores)
**Exports**:
- `page` - Readable store with page data
- `navigating` - Navigation state
- `updated` - App update state

## Test Utilities

### `/src/tests/utils/testUtils.ts`
**Purpose**: Reusable test helper functions
**Exports**:
- `createMockEntity(overrides?)` - Create single test entity
- `createMockEntities(count, overrides?)` - Create multiple entities
- `wait(ms)` - Promise-based delay
- `typeWithDebounce(element, text, ms?)` - Simulate typing with debounce
- `createKeyboardEvent(key, options?)` - Create keyboard events

**Usage**:
```typescript
import { createMockEntity, wait } from '../../../tests/utils/testUtils';

const entity = createMockEntity({ name: 'Test' });
await wait(150); // Wait for debounce
```

## Test Files

### `/src/lib/components/layout/HeaderSearch.test.ts`
**Purpose**: Tests for HeaderSearch component
**Test Count**: 31 test cases
**Test Suites**:
1. Rendering and Initial State (4 tests)
2. Search Filtering (4 tests)
3. Results Grouping (2 tests)
4. Keyboard Navigation (8 tests)
5. Mouse Interactions (4 tests)
6. Focus Behavior (3 tests)
7. No Results Message (3 tests)
8. State Management (3 tests)

**Key Behaviors Tested**:
- Search input rendering and ARIA attributes
- Filtering by name, description, and tags
- Debouncing (150ms delay)
- Results grouping by type, limited to 5 per type
- Arrow key navigation with bounds checking
- Enter to navigate, Escape to close
- Click to select, hover to highlight
- Click outside to close
- Focus management
- Empty state messaging

**Run individually**:
```bash
npm test HeaderSearch.test.ts
```

### `/src/lib/components/layout/Header.test.ts`
**Purpose**: Tests for Header component search integration
**Test Count**: 14 test cases
**Test Suites**:
1. Search Component Integration (3 tests)
2. Header Layout (4 tests)
3. Campaign Selector (3 tests)
4. Mobile Menu (2 tests)
5. Action Buttons (2 tests)

**Key Behaviors Tested**:
- HeaderSearch component rendering
- focusSearch() method exposure
- Layout structure and positioning
- Campaign dropdown functionality
- Mobile sidebar toggle
- Chat panel toggle
- Settings link
- Accessibility attributes

**Run individually**:
```bash
npm test Header.test.ts
```

### `/src/routes/+layout.test.ts`
**Purpose**: Tests for global keyboard shortcut and layout initialization
**Test Count**: 19 test cases
**Test Suites**:
1. Cmd+K / Ctrl+K Keyboard Shortcut (7 tests)
2. Layout Initialization (4 tests)
3. Layout Structure (6 tests)
4. Window Event Listener (2 tests)

**Key Behaviors Tested**:
- Cmd+K on Mac focuses search
- Ctrl+K on Windows/Linux focuses search
- Prevents default browser behavior
- Does NOT trigger on other key combinations
- Database initialization on mount
- Store loading (campaign, entities, UI)
- Theme loading
- Component rendering (Header, Sidebar, Main, Toast, ChatPanel)
- Global event listener attachment

**Run individually**:
```bash
npm test +layout.test.ts
```

## Documentation Files

### `/TEST_DOCUMENTATION.md`
**Purpose**: Comprehensive test documentation
**Contents**:
- Complete test coverage overview
- Testing philosophy and principles
- Test execution commands
- File structure
- Key test scenarios
- Edge cases covered
- Maintenance notes
- Future enhancements

**Audience**: Team members, code reviewers, future developers

### `/src/tests/README.md`
**Purpose**: Developer guide for writing tests
**Contents**:
- Quick start guide
- How to write new tests
- Test utilities reference
- Common patterns and examples
- Best practices (DO/DON'T)
- Debugging tips
- CI/CD integration
- Troubleshooting guide

**Audience**: Developers writing or maintaining tests

### `/TEST_PATTERNS.md`
**Purpose**: Quick reference for copy-paste test patterns
**Contents**:
- Code snippets for common scenarios
- Setup patterns
- Search/filter patterns
- Keyboard navigation patterns
- Async operation patterns
- Mock patterns
- Common assertions
- Query examples

**Audience**: Developers writing tests (quick reference)

### `/TESTING_SUMMARY.md`
**Purpose**: High-level summary of testing implementation
**Contents**:
- What has been delivered
- Test statistics
- Testing philosophy applied
- Test execution commands
- Known considerations
- Success criteria
- Next steps

**Audience**: Project managers, stakeholders, team leads

### `/TEST_FILES_INDEX.md` (this file)
**Purpose**: Complete index of all test files
**Contents**: You're reading it!

## File Tree

```
director-assist/
├── vitest.config.ts                              # Vitest configuration
├── package.json                                   # Updated with test scripts
├── TEST_DOCUMENTATION.md                          # Comprehensive docs
├── TESTING_SUMMARY.md                             # High-level summary
├── TEST_PATTERNS.md                               # Quick reference patterns
├── TEST_FILES_INDEX.md                            # This file
│
└── src/
    ├── tests/
    │   ├── setup.ts                               # Global test setup
    │   ├── README.md                              # Developer guide
    │   │
    │   ├── mocks/
    │   │   ├── stores.ts                          # Mock stores
    │   │   └── $app/
    │   │       ├── navigation.ts                  # Navigation mocks
    │   │       └── stores.ts                      # SvelteKit store mocks
    │   │
    │   └── utils/
    │       └── testUtils.ts                       # Test helper functions
    │
    ├── lib/
    │   └── components/
    │       └── layout/
    │           ├── HeaderSearch.svelte
    │           ├── HeaderSearch.test.ts           # 31 tests
    │           ├── Header.svelte
    │           └── Header.test.ts                 # 14 tests
    │
    └── routes/
        ├── +layout.svelte
        └── +layout.test.ts                        # 19 tests
```

## Quick Commands Reference

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Open visual test UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test HeaderSearch.test.ts

# Run tests matching pattern
npm test -- --grep="keyboard navigation"

# Run with debugging
npm test -- --inspect-brk
```

## Dependencies Added

The following packages were installed for testing:

```json
{
  "devDependencies": {
    "vitest": "^4.0.17",
    "@vitest/ui": "^4.0.17",
    "@testing-library/svelte": "^5.3.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^27.4.0",
    "happy-dom": "^20.3.1"
  }
}
```

## Coverage Goals

| Metric | Target | Purpose |
|--------|--------|---------|
| Line Coverage | 80%+ | Most code paths executed |
| Branch Coverage | 75%+ | Most conditional logic tested |
| Function Coverage | 80%+ | Most functions called |
| Statement Coverage | 80%+ | Most statements executed |

## Test Statistics Summary

| Metric | Count |
|--------|-------|
| Total Test Files | 3 |
| Total Test Cases | 64 |
| Total Test Suites | 14 |
| Mock Files | 4 |
| Utility Functions | 5 |
| Documentation Files | 5 |

## Related Component Files

These are the files being tested (implementation):

```
src/lib/components/layout/
├── HeaderSearch.svelte          # Search component with dropdown
├── Header.svelte                # Header with search integration
└── index.ts                     # Component exports

src/routes/
└── +layout.svelte               # Layout with global keyboard shortcut

src/lib/stores/
├── entities.svelte.ts           # Entities store (mocked in tests)
├── campaign.svelte.ts           # Campaign store (mocked in tests)
├── ui.svelte.ts                 # UI store (mocked in tests)
└── notifications.svelte.ts      # Notifications store (mocked in tests)
```

## Integration Points

The test suite integrates with:

1. **Vitest**: Test runner and framework
2. **Testing Library**: DOM testing utilities
3. **jsdom**: Browser environment simulation
4. **SvelteKit**: Framework-specific testing
5. **TypeScript**: Type-safe tests

## Maintenance Schedule

Recommended maintenance activities:

- **Weekly**: Run full test suite
- **Monthly**: Review coverage reports
- **Quarterly**: Refactor and update tests
- **Per Release**: Ensure all tests pass
- **After Bug Fixes**: Add regression tests

## Support Resources

If you need help:

1. Check `/src/tests/README.md` for developer guide
2. Check `/TEST_PATTERNS.md` for code examples
3. Review `/TEST_DOCUMENTATION.md` for detailed info
4. Check [Vitest docs](https://vitest.dev/)
5. Check [Testing Library docs](https://testing-library.com/)

## Future Enhancements

Potential additions to the test suite:

- [ ] Integration tests with real stores
- [ ] E2E tests with Playwright
- [ ] Visual regression tests
- [ ] Performance benchmarks
- [ ] Accessibility auditing
- [ ] Component interaction tests
- [ ] Search relevance testing
