import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import BulkActionsBar from './BulkActionsBar.svelte';

/**
 * Tests for BulkActionsBar Component
 *
 * Issue #76 Phase 1: Dedicated Relationships Management Page
 *
 * This component provides bulk operations UI for selected relationships,
 * allowing users to delete, update strength, or add tags to multiple
 * relationships at once.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the component is implemented.
 */

describe('BulkActionsBar Component - Visibility', () => {
	it('should be visible when items are selected', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 3,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		expect(screen.getByText(/3.*selected/i)).toBeInTheDocument();
	});

	it('should be hidden when no items selected', () => {
		const { container } = render(BulkActionsBar, {
			props: {
				selectedCount: 0,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		// Svelte 5 leaves anchor comments, so check for no visible content
		expect(container.querySelector('[role="toolbar"]')).toBeNull();
		expect(container.textContent?.trim()).toBe('');
	});

	it('should show correct count when 1 item selected', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 1,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		expect(screen.getByText(/1.*selected/i)).toBeInTheDocument();
	});

	it('should show correct count when multiple items selected', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 15,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		expect(screen.getByText(/15.*selected/i)).toBeInTheDocument();
	});
});

describe('BulkActionsBar Component - Delete Button', () => {
	it('should render delete button', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		expect(deleteButton).toBeInTheDocument();
	});

	it('should call onBulkDelete when delete button clicked', async () => {
		const onBulkDelete = vi.fn();

		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete,
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		expect(onBulkDelete).toHaveBeenCalledTimes(1);
	});

	it('should have danger/warning styling on delete button', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		expect(deleteButton).toHaveClass(/danger|warning|destructive|red/);
	});

	it('should have accessible label for delete button', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		expect(deleteButton).toHaveAccessibleName();
	});
});

describe('BulkActionsBar Component - Strength Dropdown', () => {
	it('should render strength dropdown', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const strengthSelect = screen.getByLabelText(/strength|update strength/i);
		expect(strengthSelect).toBeInTheDocument();
	});

	it('should have strength options in dropdown', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /strong/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /moderate/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /weak/i })).toBeInTheDocument();
	});

	it('should call onBulkUpdateStrength when strength selected', async () => {
		const onBulkUpdateStrength = vi.fn();

		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength,
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const strengthSelect = screen.getByLabelText(/strength|update strength/i);
		await fireEvent.change(strengthSelect, { target: { value: 'strong' } });

		expect(onBulkUpdateStrength).toHaveBeenCalledWith('strong');
	});

	it('should call onBulkUpdateStrength with correct value for each option', async () => {
		const onBulkUpdateStrength = vi.fn();

		const { unmount } = render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength,
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const strengthSelect = screen.getByLabelText(/strength|update strength/i);

		await fireEvent.change(strengthSelect, { target: { value: 'strong' } });
		expect(onBulkUpdateStrength).toHaveBeenLastCalledWith('strong');

		await fireEvent.change(strengthSelect, { target: { value: 'moderate' } });
		expect(onBulkUpdateStrength).toHaveBeenLastCalledWith('moderate');

		await fireEvent.change(strengthSelect, { target: { value: 'weak' } });
		expect(onBulkUpdateStrength).toHaveBeenLastCalledWith('weak');
	});

	it('should have default/placeholder option', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: /set strength|select/i })).toBeInTheDocument();
	});
});

describe('BulkActionsBar Component - Add Tag', () => {
	it('should render tag input field', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const tagInput = screen.getByPlaceholderText(/tag|add tag/i);
		expect(tagInput).toBeInTheDocument();
	});

	it('should render add tag button', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add tag/i });
		expect(addButton).toBeInTheDocument();
	});

	it('should call onBulkAddTag with input value when button clicked', async () => {
		const onBulkAddTag = vi.fn();

		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag,
				onClearSelection: vi.fn()
			}
		});

		const tagInput = screen.getByPlaceholderText(/tag|add tag/i);
		const addButton = screen.getByRole('button', { name: /add tag/i });

		await fireEvent.input(tagInput, { target: { value: 'important' } });
		await fireEvent.click(addButton);

		expect(onBulkAddTag).toHaveBeenCalledWith('important');
	});

	it('should clear input after adding tag', async () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const tagInput = screen.getByPlaceholderText(/tag|add tag/i) as HTMLInputElement;
		const addButton = screen.getByRole('button', { name: /add tag/i });

		await fireEvent.input(tagInput, { target: { value: 'important' } });
		await fireEvent.click(addButton);

		expect(tagInput.value).toBe('');
	});

	it('should not call onBulkAddTag when input is empty', async () => {
		const onBulkAddTag = vi.fn();

		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag,
				onClearSelection: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add tag/i });
		await fireEvent.click(addButton);

		expect(onBulkAddTag).not.toHaveBeenCalled();
	});

	it('should trim whitespace from tag input', async () => {
		const onBulkAddTag = vi.fn();

		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag,
				onClearSelection: vi.fn()
			}
		});

		const tagInput = screen.getByPlaceholderText(/tag|add tag/i);
		const addButton = screen.getByRole('button', { name: /add tag/i });

		await fireEvent.input(tagInput, { target: { value: '  important  ' } });
		await fireEvent.click(addButton);

		expect(onBulkAddTag).toHaveBeenCalledWith('important');
	});

	it('should support Enter key to add tag', async () => {
		const onBulkAddTag = vi.fn();

		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag,
				onClearSelection: vi.fn()
			}
		});

		const tagInput = screen.getByPlaceholderText(/tag|add tag/i);

		await fireEvent.input(tagInput, { target: { value: 'quest' } });
		await fireEvent.keyDown(tagInput, { key: 'Enter' });

		expect(onBulkAddTag).toHaveBeenCalledWith('quest');
	});
});

describe('BulkActionsBar Component - Clear Selection', () => {
	it('should render clear selection button', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const clearButton = screen.getByRole('button', { name: /clear|deselect/i });
		expect(clearButton).toBeInTheDocument();
	});

	it('should call onClearSelection when clear button clicked', async () => {
		const onClearSelection = vi.fn();

		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection
			}
		});

		const clearButton = screen.getByRole('button', { name: /clear|deselect/i });
		await fireEvent.click(clearButton);

		expect(onClearSelection).toHaveBeenCalledTimes(1);
	});

	it('should have appropriate styling for clear button', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const clearButton = screen.getByRole('button', { name: /clear|deselect/i });
		// Should have secondary/ghost styling
		expect(clearButton.className).toMatch(/secondary|ghost|outline/);
	});
});

describe('BulkActionsBar Component - Layout', () => {
	it('should render all action elements in horizontal layout', () => {
		const { container } = render(BulkActionsBar, {
			props: {
				selectedCount: 3,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		// Should have a container with flex/grid layout
		const bar = container.querySelector('[role="toolbar"]');
		expect(bar).toHaveClass(/flex|grid/);
	});

	it('should display count on the left', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 5,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const countElement = screen.getByText(/5.*selected/i);
		expect(countElement).toBeInTheDocument();
	});

	it('should have appropriate spacing between elements', () => {
		const { container } = render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		// Container should have gap/space classes
		const bar = container.querySelector('[role="toolbar"]');
		expect(bar).toHaveClass(/gap|space/);
	});

	it('should have sticky or fixed positioning', () => {
		const { container } = render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		// Should be sticky or fixed for visibility while scrolling
		const bar = container.querySelector('[role="toolbar"]');
		expect(bar).toHaveClass(/sticky|fixed/);
	});
});

describe('BulkActionsBar Component - Accessibility', () => {
	it('should have accessible labels for all buttons', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			expect(button).toHaveAccessibleName();
		});
	});

	it('should have accessible label for strength dropdown', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const strengthSelect = screen.getByLabelText(/strength|update strength/i);
		expect(strengthSelect).toHaveAccessibleName();
	});

	it('should have accessible label for tag input', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const tagInput = screen.getByPlaceholderText(/tag|add tag/i);
		expect(tagInput).toHaveAttribute('placeholder');
	});

	it('should support keyboard navigation', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((button) => {
			expect(button).toHaveAttribute('type', 'button');
		});
	});
});

describe('BulkActionsBar Component - Edge Cases', () => {
	it('should handle very large selection count', () => {
		render(BulkActionsBar, {
			props: {
				selectedCount: 9999,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		expect(screen.getByText(/9999.*selected/i)).toBeInTheDocument();
	});

	it('should not render when selectedCount is 0', () => {
		const { container } = render(BulkActionsBar, {
			props: {
				selectedCount: 0,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		// Svelte 5 leaves anchor comments, so check for no visible content
		expect(container.querySelector('[role="toolbar"]')).toBeNull();
		expect(container.textContent?.trim()).toBe('');
	});

	it('should not render when selectedCount is negative', () => {
		const { container } = render(BulkActionsBar, {
			props: {
				selectedCount: -1,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag: vi.fn(),
				onClearSelection: vi.fn()
			}
		});

		// Svelte 5 leaves anchor comments, so check for no visible content
		expect(container.querySelector('[role="toolbar"]')).toBeNull();
		expect(container.textContent?.trim()).toBe('');
	});

	it('should handle special characters in tag input', async () => {
		const onBulkAddTag = vi.fn();

		render(BulkActionsBar, {
			props: {
				selectedCount: 2,
				onBulkDelete: vi.fn(),
				onBulkUpdateStrength: vi.fn(),
				onBulkAddTag,
				onClearSelection: vi.fn()
			}
		});

		const tagInput = screen.getByPlaceholderText(/tag|add tag/i);
		const addButton = screen.getByRole('button', { name: /add tag/i });

		await fireEvent.input(tagInput, { target: { value: 'tag-with-special_chars!' } });
		await fireEvent.click(addButton);

		expect(onBulkAddTag).toHaveBeenCalledWith('tag-with-special_chars!');
	});
});
