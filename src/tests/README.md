# Test Suite Guide

## Quick Start

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Open Vitest UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Writing New Tests

### 1. Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import YourComponent from './YourComponent.svelte';

describe('YourComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', () => {
    render(YourComponent);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### 2. Using Mock Stores

```typescript
import { createMockEntitiesStore } from '../tests/mocks/stores';

const mockStore = createMockEntitiesStore();

// Set test data
mockStore._setEntities([
  createMockEntity({ name: 'Test Entity' })
]);

// Pass to component
render(YourComponent, {
  context: new Map([
    ['entitiesStore', mockStore]
  ])
});
```

### 3. Testing User Interactions

```typescript
// Click events
await fireEvent.click(button);

// Keyboard events
await fireEvent.keyDown(input, { key: 'Enter' });

// Input events
await fireEvent.input(input, { target: { value: 'search text' } });

// Mouse events
await fireEvent.mouseEnter(element);
```

### 4. Testing Async Behavior

```typescript
import { waitFor } from '@testing-library/svelte';
import { wait } from '../tests/utils/testUtils';

// Wait for element to appear
await waitFor(() => {
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

// Wait for specific time (e.g., debounce)
await wait(150);
```

## Test Utilities

### Mock Creators

#### `createMockEntity(overrides?)`
Creates a realistic test entity with sensible defaults.

```typescript
const entity = createMockEntity({
  id: 'test-1',
  name: 'Test Character',
  type: 'character',
  description: 'A test character'
});
```

#### `createMockEntities(count, overrides?)`
Creates multiple entities at once.

```typescript
const entities = createMockEntities(10, [
  { type: 'character' },
  { type: 'npc' },
  // ... overrides for each
]);
```

#### `createMockEntitiesStore(entities?)`
Creates a mock entities store with working filter logic.

```typescript
const store = createMockEntitiesStore([entity1, entity2]);

// Update entities in tests
store._setEntities([entity3, entity4]);

// Verify store methods called
expect(store.setSearchQuery).toHaveBeenCalledWith('search');
```

#### `createMockCampaignStore()`
Creates a mock campaign store.

```typescript
const store = createMockCampaignStore();
expect(store.campaign.name).toBe('Test Campaign');
```

### Helper Functions

#### `wait(ms)`
Waits for a specified time.

```typescript
await wait(150); // Wait for debounce
```

#### `createKeyboardEvent(key, options?)`
Creates keyboard events with proper options.

```typescript
const event = createKeyboardEvent('Enter', { ctrlKey: true });
await fireEvent.keyDown(input, event);
```

#### `typeWithDebounce(element, text, debounceMs?)`
Simulates typing with debounce delay.

```typescript
await typeWithDebounce(input, 'search query', 150);
```

## Common Patterns

### Testing Dropdown Behavior

```typescript
it('should open dropdown on input', async () => {
  render(Component);
  const input = screen.getByRole('combobox');

  // Initially closed
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

  // Type to open
  await fireEvent.input(input, { target: { value: 'test' } });

  // Should be open
  await waitFor(() => {
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
```

### Testing Keyboard Navigation

```typescript
it('should navigate with arrow keys', async () => {
  const entities = createMockEntities(3);
  mockStore._setEntities(entities);

  render(Component);
  const input = screen.getByRole('combobox');

  await fireEvent.input(input, { target: { value: 'test' } });

  const options = screen.getAllByRole('option');

  // First should be selected
  expect(options[0]).toHaveAttribute('aria-selected', 'true');

  // Navigate down
  await fireEvent.keyDown(input, { key: 'ArrowDown' });

  // Second should be selected
  expect(options[1]).toHaveAttribute('aria-selected', 'true');
});
```

### Testing Navigation

```typescript
import { goto } from '$app/navigation';

it('should navigate to entity', async () => {
  render(Component);

  const link = screen.getByRole('link');
  await fireEvent.click(link);

  expect(goto).toHaveBeenCalledWith('/entities/character/123');
});
```

### Testing Click Outside

```typescript
it('should close on click outside', async () => {
  render(Component);

  // Open the dropdown
  await fireEvent.input(input, { target: { value: 'test' } });
  expect(screen.getByRole('listbox')).toBeInTheDocument();

  // Click outside
  await fireEvent.click(document.body);

  // Should close
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
```

### Testing Debounced Input

```typescript
it('should debounce search', async () => {
  vi.useFakeTimers();

  render(Component);
  const input = screen.getByRole('combobox');

  // Type quickly
  await fireEvent.input(input, { target: { value: 'a' } });
  await fireEvent.input(input, { target: { value: 'ab' } });
  await fireEvent.input(input, { target: { value: 'abc' } });

  // Should not call yet
  expect(mockStore.setSearchQuery).not.toHaveBeenCalled();

  // Advance timer
  vi.advanceTimersByTime(150);

  // Should call once
  expect(mockStore.setSearchQuery).toHaveBeenCalledTimes(1);
  expect(mockStore.setSearchQuery).toHaveBeenCalledWith('abc');

  vi.useRealTimers();
});
```

## Best Practices

### DO ✅

1. **Clear Test Names**: Use descriptive names that explain what's being tested
   ```typescript
   it('should filter entities by name when user types in search input', ...)
   ```

2. **Isolated Tests**: Each test should be independent
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
     // Reset state
   });
   ```

3. **Test User Behavior**: Focus on what users do, not implementation
   ```typescript
   // Good: User perspective
   await fireEvent.click(screen.getByRole('button', { name: /submit/i }));

   // Avoid: Implementation details
   component.handleSubmit();
   ```

4. **Use Accessibility Queries**: Prefer queries that match how users interact
   ```typescript
   screen.getByRole('button')
   screen.getByLabelText('Search')
   screen.getByPlaceholderText('Enter name')
   ```

5. **Wait for Async**: Use waitFor for asynchronous operations
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

### DON'T ❌

1. **Don't Test Implementation Details**
   ```typescript
   // Bad: Testing internal state
   expect(component.internalState).toBe(true);

   // Good: Testing visible behavior
   expect(screen.getByRole('dialog')).toBeInTheDocument();
   ```

2. **Don't Use Hardcoded Delays**
   ```typescript
   // Bad
   setTimeout(() => { /* test */ }, 1000);

   // Good
   await waitFor(() => { /* assertion */ });
   ```

3. **Don't Share State Between Tests**
   ```typescript
   // Bad: Shared mutable state
   let sharedData = [];

   // Good: Fresh state per test
   beforeEach(() => {
     const testData = [];
   });
   ```

4. **Don't Query by Class or ID**
   ```typescript
   // Bad
   container.querySelector('.my-class')

   // Good
   screen.getByRole('button')
   ```

## Debugging Tests

### View What's Rendered
```typescript
import { render, screen } from '@testing-library/svelte';

const { container } = render(Component);
console.log(container.innerHTML);

// Or use debug
screen.debug();
```

### Check Available Queries
```typescript
// Shows all available queries for current DOM
screen.logTestingPlaygroundURL();
```

### Verbose Error Messages
```typescript
// Shows full DOM when query fails
const element = screen.getByRole('button', { name: /submit/i });
```

### Check Mock Calls
```typescript
// See all calls to a mock
console.log(mockFn.mock.calls);

// Check specific call
expect(mockFn).toHaveBeenNthCalledWith(2, 'expected', 'args');
```

## CI/CD Integration

The test suite is designed to run in CI environments:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### Tests Timing Out
- Increase timeout in vitest.config.ts
- Check for missing `await` statements
- Verify async operations complete

### Mocks Not Working
- Check `vi.clearAllMocks()` in beforeEach
- Verify mock paths match actual imports
- Use `vi.doMock()` for dynamic mocks

### DOM Elements Not Found
- Use `screen.debug()` to see rendered output
- Check if element is conditionally rendered
- Use `waitFor()` for async-rendered elements

### Random Test Failures
- Check for shared state between tests
- Verify proper cleanup in afterEach
- Look for timing issues (use vi.useFakeTimers)

## Resources

- [Vitest API](https://vitest.dev/api/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
