# Test Patterns Quick Reference

Quick copy-paste patterns for common testing scenarios in this project.

## Setup Pattern

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import YourComponent from './YourComponent.svelte';
import { createMockEntitiesStore } from '../../../tests/mocks/stores';

describe('YourComponent', () => {
  let mockStore: ReturnType<typeof createMockEntitiesStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockEntitiesStore();
  });

  it('should do something', () => {
    render(YourComponent, {
      context: new Map([['entitiesStore', mockStore]])
    });

    // assertions here
  });
});
```

## Search and Filter Pattern

```typescript
it('should filter results when user types', async () => {
  const entities = [
    createMockEntity({ name: 'Aragorn' }),
    createMockEntity({ name: 'Gandalf' })
  ];
  mockStore._setEntities(entities);

  render(SearchComponent, {
    context: new Map([['entitiesStore', mockStore]])
  });

  const input = screen.getByRole('combobox');
  await fireEvent.input(input, { target: { value: 'ara' } });

  // Wait for debounce
  await wait(160);

  expect(mockStore.setSearchQuery).toHaveBeenCalledWith('ara');
});
```

## Dropdown Open/Close Pattern

```typescript
it('should open dropdown when typing', async () => {
  render(Component);
  const input = screen.getByRole('combobox');

  // Initially closed
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

  // Type to open
  await fireEvent.input(input, { target: { value: 'test' } });

  // Should open
  await waitFor(() => {
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

it('should close dropdown on Escape', async () => {
  render(Component);
  const input = screen.getByRole('combobox');

  // Open dropdown
  await fireEvent.input(input, { target: { value: 'test' } });
  await waitFor(() => {
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  // Close with Escape
  await fireEvent.keyDown(input, createKeyboardEvent('Escape'));

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
```

## Keyboard Navigation Pattern

```typescript
it('should navigate with arrow keys', async () => {
  const entities = createMockEntities(3);
  mockStore._setEntities(entities);

  render(Component);
  const input = screen.getByRole('combobox');

  await fireEvent.input(input, { target: { value: 'test' } });

  await waitFor(() => {
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  const options = screen.getAllByRole('option');

  // First should be selected
  expect(options[0]).toHaveAttribute('aria-selected', 'true');

  // Navigate down
  await fireEvent.keyDown(input, createKeyboardEvent('ArrowDown'));

  // Second should be selected
  expect(options[1]).toHaveAttribute('aria-selected', 'true');
});
```

## Boundary Checking Pattern

```typescript
it('should not go below first item', async () => {
  const entities = createMockEntities(3);
  mockStore._setEntities(entities);

  render(Component);
  const input = screen.getByRole('combobox');

  await fireEvent.input(input, { target: { value: 'test' } });

  const options = screen.getAllByRole('option');

  // Try to go up from first
  await fireEvent.keyDown(input, createKeyboardEvent('ArrowUp'));

  // Should stay on first
  expect(options[0]).toHaveAttribute('aria-selected', 'true');
});

it('should not go beyond last item', async () => {
  const entities = createMockEntities(3);
  mockStore._setEntities(entities);

  render(Component);
  const input = screen.getByRole('combobox');

  await fireEvent.input(input, { target: { value: 'test' } });

  const options = screen.getAllByRole('option');

  // Navigate to last and try to go beyond
  for (let i = 0; i < 10; i++) {
    await fireEvent.keyDown(input, createKeyboardEvent('ArrowDown'));
  }

  // Should stay on last
  expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
});
```

## Navigation (Routing) Pattern

```typescript
import { goto } from '$app/navigation';

it('should navigate when Enter is pressed', async () => {
  const entity = createMockEntity({ id: '123', type: 'character' });
  mockStore._setEntities([entity]);

  render(Component);
  const input = screen.getByRole('combobox');

  await fireEvent.input(input, { target: { value: 'test' } });
  await fireEvent.keyDown(input, createKeyboardEvent('Enter'));

  expect(goto).toHaveBeenCalledWith('/entities/character/123');
});
```

## Click Outside Pattern

```typescript
it('should close when clicking outside', async () => {
  render(Component);
  const input = screen.getByRole('combobox');

  // Open
  await fireEvent.input(input, { target: { value: 'test' } });
  await waitFor(() => {
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  // Click outside
  await fireEvent.click(document.body);

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

it('should NOT close when clicking inside', async () => {
  const { container } = render(Component);
  const input = screen.getByRole('combobox');

  // Open
  await fireEvent.input(input, { target: { value: 'test' } });

  // Click inside
  const searchContainer = container.querySelector('.search-container');
  if (searchContainer) {
    await fireEvent.click(searchContainer);
  }

  // Should still be open
  expect(screen.getByRole('listbox')).toBeInTheDocument();
});
```

## Debouncing Pattern

```typescript
it('should debounce rapid input', async () => {
  vi.useFakeTimers();

  render(Component);
  const input = screen.getByRole('combobox');

  // Type quickly multiple times
  await fireEvent.input(input, { target: { value: 'a' } });
  await fireEvent.input(input, { target: { value: 'ab' } });
  await fireEvent.input(input, { target: { value: 'abc' } });

  // Should not call yet
  expect(mockStore.setSearchQuery).not.toHaveBeenCalled();

  // Advance timer past debounce period
  vi.advanceTimersByTime(150);

  // Should call once with final value
  expect(mockStore.setSearchQuery).toHaveBeenCalledTimes(1);
  expect(mockStore.setSearchQuery).toHaveBeenCalledWith('abc');

  vi.useRealTimers();
});
```

## Async Operations Pattern

```typescript
it('should handle async data loading', async () => {
  render(Component);

  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });
});

it('should show loading state', async () => {
  mockStore.isLoading = true;

  render(Component);

  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  mockStore.isLoading = false;

  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});
```

## Accessibility Pattern

```typescript
it('should have correct ARIA attributes', () => {
  render(Component);

  const input = screen.getByRole('combobox');
  expect(input).toHaveAttribute('aria-label', 'Search entities');
  expect(input).toHaveAttribute('aria-expanded', 'false');
  expect(input).toHaveAttribute('aria-controls', 'search-results');
});

it('should update aria-expanded when dropdown opens', async () => {
  render(Component);
  const input = screen.getByRole('combobox');

  expect(input).toHaveAttribute('aria-expanded', 'false');

  await fireEvent.input(input, { target: { value: 'test' } });

  await waitFor(() => {
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });
});
```

## Global Keyboard Shortcut Pattern

```typescript
it('should trigger on Cmd+K (Mac)', async () => {
  render(LayoutComponent);

  const event = createKeyboardEvent('k', { metaKey: true });
  const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

  await fireEvent.keyDown(window, event);

  expect(preventDefaultSpy).toHaveBeenCalled();
});

it('should trigger on Ctrl+K (Windows/Linux)', async () => {
  render(LayoutComponent);

  const event = createKeyboardEvent('k', { ctrlKey: true });
  const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

  await fireEvent.keyDown(window, event);

  expect(preventDefaultSpy).toHaveBeenCalled();
});

it('should NOT trigger on other keys', async () => {
  render(LayoutComponent);

  const event = createKeyboardEvent('a', { metaKey: true });
  const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

  await fireEvent.keyDown(window, event);

  expect(preventDefaultSpy).not.toHaveBeenCalled();
});
```

## Empty State Pattern

```typescript
it('should show empty message when no results', async () => {
  mockStore._setEntities([]);

  render(Component);
  const input = screen.getByRole('combobox');

  await fireEvent.input(input, { target: { value: 'nonexistent' } });

  await waitFor(() => {
    expect(screen.getByText(/no results found/i)).toBeInTheDocument();
  });
});

it('should include search term in empty message', async () => {
  mockStore._setEntities([]);

  render(Component);
  const input = screen.getByRole('combobox');

  await fireEvent.input(input, { target: { value: 'dragon' } });

  await waitFor(() => {
    expect(screen.getByText(/no results found for "dragon"/i)).toBeInTheDocument();
  });
});
```

## Mouse Interaction Pattern

```typescript
it('should update selection on hover', async () => {
  const entities = createMockEntities(3);
  mockStore._setEntities(entities);

  render(Component);
  const input = screen.getByRole('combobox');

  await fireEvent.input(input, { target: { value: 'test' } });

  const options = screen.getAllByRole('option');

  // Hover second option
  await fireEvent.mouseEnter(options[1]);

  // Should be selected
  expect(options[1]).toHaveAttribute('aria-selected', 'true');
});

it('should navigate on click', async () => {
  const entity = createMockEntity({ id: '123', type: 'character' });
  mockStore._setEntities([entity]);

  render(Component);
  const input = screen.getByRole('combobox');

  await fireEvent.input(input, { target: { value: 'test' } });

  const option = screen.getByRole('option');
  await fireEvent.click(option);

  expect(goto).toHaveBeenCalledWith('/entities/character/123');
});
```

## Component Method Pattern

```typescript
it('should expose public method', () => {
  const { component } = render(Component);

  expect(typeof component.publicMethod).toBe('function');

  // Call and verify
  component.publicMethod();

  // Check side effects
  expect(screen.getByText('Method Called')).toBeInTheDocument();
});

it('should focus input when focus() is called', () => {
  const { component } = render(Component);
  const input = screen.getByRole('combobox');

  expect(document.activeElement).not.toBe(input);

  component.focus();

  expect(document.activeElement).toBe(input);
});
```

## Store Mock Update Pattern

```typescript
it('should react to store updates', async () => {
  mockStore._setEntities([]);

  render(Component);

  expect(screen.getByText(/no entities/i)).toBeInTheDocument();

  // Update store
  mockStore._setEntities([
    createMockEntity({ name: 'New Entity' })
  ]);

  await waitFor(() => {
    expect(screen.getByText('New Entity')).toBeInTheDocument();
  });
});
```

## Common Assertions

```typescript
// Element presence
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Visibility
expect(element).toBeVisible();
expect(element).not.toBeVisible();

// Text content
expect(element).toHaveTextContent('Expected Text');
expect(element).toHaveTextContent(/pattern/i);

// Attributes
expect(element).toHaveAttribute('aria-label', 'Search');
expect(element).toHaveAttribute('aria-expanded', 'true');

// Classes
expect(element).toHaveClass('selected');
expect(element).not.toHaveClass('disabled');

// Focus
expect(document.activeElement).toBe(element);

// Mock calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith('expected', 'args');
expect(mockFn).not.toHaveBeenCalled();
```

## Common Queries

```typescript
// By role (preferred for accessibility)
screen.getByRole('button')
screen.getByRole('combobox')
screen.getByRole('listbox')
screen.getByRole('option')

// By label
screen.getByLabelText('Search entities')

// By placeholder
screen.getByPlaceholderText('Enter search term')

// By text
screen.getByText('Submit')
screen.getByText(/loading/i)

// Query variants
screen.getByRole()       // Throws if not found
screen.queryByRole()     // Returns null if not found
screen.findByRole()      // Async, waits for element

// Multiple elements
screen.getAllByRole('option')
screen.queryAllByRole('option')
```
