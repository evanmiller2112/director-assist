# Global Entity Search - Test Documentation

## Overview

This document describes the comprehensive unit test suite for the Global Entity Search feature (Issue #18). The tests follow TDD principles and cover all key behaviors of the search functionality.

## Test Coverage

### 1. HeaderSearch Component (`src/lib/components/layout/HeaderSearch.test.ts`)

The main search component test suite includes **14 test suites with 45+ test cases** covering:

#### Rendering and Initial State
- ✓ Renders search input with correct placeholder
- ✓ Has correct ARIA attributes for accessibility
- ✓ Does not show dropdown initially
- ✓ Does not show dropdown when input is empty

#### Search Filtering
- ✓ Filters entities by name (case-insensitive)
- ✓ Filters entities by description
- ✓ Filters entities by tags
- ✓ Debounces search input (150ms)
- ✓ Prevents multiple rapid calls to store update

#### Results Grouping
- ✓ Groups results by entity type
- ✓ Limits results to 5 per entity type
- ✓ Maintains separation between different entity types

#### Keyboard Navigation
- ✓ Navigates down with ArrowDown key
- ✓ Navigates up with ArrowUp key
- ✓ Bounds checking: stops at first result (ArrowUp)
- ✓ Bounds checking: stops at last result (ArrowDown)
- ✓ Navigates to entity on Enter key
- ✓ Closes dropdown on Escape key
- ✓ Closes dropdown on Tab key
- ✓ Opens dropdown with ArrowDown when closed but has search text

#### Mouse Interactions
- ✓ Navigates to entity on click
- ✓ Updates selected index on mouse enter (hover)
- ✓ Closes dropdown when clicking outside
- ✓ Does NOT close dropdown when clicking inside search container

#### Focus Behavior
- ✓ Exposes focus() method to focus the input
- ✓ Shows dropdown when focusing input with existing search text
- ✓ Does NOT show dropdown when focusing with empty search

#### No Results Message
- ✓ Shows "No results found" message when search yields no results
- ✓ Includes search query in no results message
- ✓ Shows result count message when results exceed limit

#### State Management
- ✓ Resets selected index when new search is performed
- ✓ Clears search query when closing dropdown
- ✓ Updates aria-expanded attribute based on dropdown state

### 2. Header Component Tests (`src/lib/components/layout/Header.test.ts`)

Tests for search integration in the header component:

#### Search Component Integration
- ✓ Renders HeaderSearch component
- ✓ Exposes focusSearch() method that calls HeaderSearch.focus()
- ✓ Binds HeaderSearch component instance correctly

#### Header Layout
- ✓ Renders campaign name
- ✓ Renders search in correct position
- ✓ Renders chat toggle button
- ✓ Renders settings link

#### Campaign Selector
- ✓ Shows campaign selector button
- ✓ Displays campaign system if available
- ✓ Toggles dropdown when campaign button is clicked

#### Mobile Menu
- ✓ Renders mobile menu button
- ✓ Toggles sidebar when mobile menu button is clicked

#### Action Buttons
- ✓ Toggles chat panel when chat button is clicked
- ✓ Has correct title attributes for accessibility

### 3. Layout Global Keyboard Shortcut Tests (`src/routes/+layout.test.ts`)

Tests for the global Cmd+K / Ctrl+K functionality:

#### Keyboard Shortcut
- ✓ Focuses search when Cmd+K is pressed (Mac)
- ✓ Focuses search when Ctrl+K is pressed (Windows/Linux)
- ✓ Prevents default behavior when Cmd+K is pressed
- ✓ Prevents default behavior when Ctrl+K is pressed
- ✓ Does NOT trigger on K key alone without modifier
- ✓ Does NOT trigger on Cmd/Ctrl with other keys
- ✓ Works regardless of keyboard layout

#### Layout Initialization
- ✓ Initializes database on mount
- ✓ Loads campaign store on mount
- ✓ Loads entities store on mount
- ✓ Loads theme preference on mount

#### Layout Structure
- ✓ Renders Header component
- ✓ Renders Sidebar component
- ✓ Renders main content area
- ✓ Renders Toast component
- ✓ Conditionally renders ChatPanel when open
- ✓ Does NOT render ChatPanel when closed

#### Window Event Listener
- ✓ Attaches keydown listener to window
- ✓ Handles keyboard events globally from anywhere in the app

## Testing Philosophy

### Test-Driven Development Principles

1. **Behavior over Implementation**: Tests focus on what the component does, not how it does it
2. **Clear Test Names**: Each test name follows the pattern `should[ExpectedBehavior]When[Condition]`
3. **Arrange-Act-Assert**: Tests follow the AAA pattern for clarity
4. **Isolation**: Each test is independent with proper setup and teardown
5. **Coverage**: Tests cover happy paths, edge cases, boundary conditions, and error scenarios

### Key Testing Strategies

#### Mocking Strategy
- **Stores**: Mock entities, campaign, UI, and notification stores
- **Navigation**: Mock SvelteKit's `goto` function
- **Components**: Mock child components when testing parent integration
- **External Dependencies**: Mock icon utilities and config functions

#### Test Utilities
- `createMockEntity()`: Creates realistic test entities
- `createMockEntities()`: Creates multiple test entities at once
- `wait()`: Handles async operations and debouncing
- `typeWithDebounce()`: Simulates user typing with debounce delay
- `createKeyboardEvent()`: Creates keyboard events with proper options

#### Store Mocking
- Stores maintain internal state for realistic testing
- `_setEntities()` method allows tests to update entity data
- Filter logic is replicated in mocks to match production behavior

## Running the Tests

### All Tests
```bash
npm test
```

### Watch Mode (recommended for development)
```bash
npm test
```

### Single Run (for CI/CD)
```bash
npm run test:run
```

### With UI Interface
```bash
npm run test:ui
```

### With Coverage Report
```bash
npm run test:coverage
```

## Test File Structure

```
src/
├── lib/
│   └── components/
│       └── layout/
│           ├── HeaderSearch.svelte
│           ├── HeaderSearch.test.ts      # 45+ tests
│           ├── Header.svelte
│           └── Header.test.ts            # 15+ tests
├── routes/
│   ├── +layout.svelte
│   └── +layout.test.ts                   # 15+ tests
└── tests/
    ├── setup.ts                          # Test environment setup
    ├── mocks/
    │   ├── stores.ts                     # Store mocks
    │   └── $app/
    │       ├── navigation.ts             # Navigation mocks
    │       └── stores.ts                 # SvelteKit store mocks
    └── utils/
        └── testUtils.ts                  # Test helper functions
```

## Configuration Files

### Vitest Configuration (`vitest.config.ts`)
- Uses jsdom environment for DOM testing
- Sets up path aliases for imports ($lib, $app)
- Configures coverage reporting
- Auto-imports test globals (describe, it, expect)

### Test Setup (`src/tests/setup.ts`)
- Imports @testing-library/jest-dom matchers
- Configures automatic cleanup after each test
- Mocks window.matchMedia for responsive testing

## Key Test Scenarios

### 1. Search Flow
```
User types → Debounce (150ms) → Store update → Filter entities →
Group by type → Limit to 5 per type → Display results
```

### 2. Keyboard Navigation Flow
```
Type search → Dropdown opens → Arrow keys navigate →
Selected index updates → Enter navigates to entity
```

### 3. Global Shortcut Flow
```
Anywhere in app → Press Cmd/Ctrl+K → Prevent default →
Focus search input → Ready to type
```

## Edge Cases Covered

1. **Empty States**
   - Empty search input
   - No search results
   - No entities in database

2. **Boundary Conditions**
   - Navigating beyond first/last result
   - Exactly 5 results per type (limit)
   - More than 5 results per type (truncation)

3. **User Interactions**
   - Rapid typing (debounce)
   - Click outside to close
   - Mixed keyboard/mouse interaction
   - Re-opening closed dropdown

4. **Accessibility**
   - ARIA attributes
   - Keyboard-only navigation
   - Screen reader support

## Maintenance Notes

### When Adding New Features
1. Add test cases BEFORE implementing the feature (TDD)
2. Update mock stores if data structures change
3. Maintain test coverage above 80%

### When Fixing Bugs
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Verify the test now passes
4. Add regression tests if needed

### Common Issues
- **Timing Issues**: Use `waitFor()` for async operations
- **Mock Updates**: Use `vi.clearAllMocks()` in `beforeEach`
- **Store State**: Use `_setEntities()` to update mock data
- **DOM Cleanup**: Automatic via @testing-library/svelte

## Future Enhancements

Potential areas for additional testing:
- [ ] Integration tests with real database
- [ ] E2E tests with Playwright
- [ ] Performance tests for large entity sets
- [ ] Accessibility audit tests
- [ ] Visual regression tests
- [ ] Search result ranking/relevance tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Svelte](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Svelte Testing Best Practices](https://svelte.dev/docs/testing)
