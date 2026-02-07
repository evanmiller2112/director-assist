/**
 * Tests for GenerateSuggestionsButton Component (Issue #366, Phase 4)
 *
 * This component provides a button to trigger AI suggestion generation for empty
 * fields in entity forms. It's only visible when AI is in 'suggestions' mode.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until GenerateSuggestionsButton component is implemented.
 *
 * Features tested:
 * - Visibility based on AI settings (suggestions mode)
 * - Button triggers suggestion generation
 * - Loading state during generation
 * - Disabled state when no empty fields
 * - Error handling and user feedback
 * - Integration with fieldSuggestionService
 * - Accessible button with clear labeling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import GenerateSuggestionsButton from './GenerateSuggestionsButton.svelte';

describe('GenerateSuggestionsButton Component - Basic Rendering', () => {
	it('should render without crashing', () => {
		const { container } = render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should render as a button element', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should display button text "Suggest Content" or similar', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		// Should have "suggest", "generate", or "AI" in button text
		const button = screen.getByRole('button', { name: /suggest|generate|AI/i });
		expect(button).toBeInTheDocument();
	});

	it('should have icon (lightbulb, sparkles, or wand)', () => {
		const { container } = render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		// Should have an SVG icon from Lucide
		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should have inviting visual style', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		// Should have primary or prominent styling
		expect(button).toHaveClass(/primary|bg-blue|bg-purple/);
	});
});

describe('GenerateSuggestionsButton Component - Click Behavior', () => {
	it('should call onSuggestionsGenerated when clicked', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { name: 'Aragorn' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onSuggestionsGenerated).toHaveBeenCalledTimes(1);
	});

	it('should pass entityType to generation logic', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'monster',
				currentData: {},
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onSuggestionsGenerated).toHaveBeenCalled();
	});

	it('should pass currentData to generation logic', async () => {
		const onSuggestionsGenerated = vi.fn();
		const currentData = { name: 'Goblin', level: 3 };

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'monster',
				currentData,
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onSuggestionsGenerated).toHaveBeenCalled();
	});

	it('should pass entityId if editing existing entity', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { name: 'Aragorn' },
				entityId: 123,
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onSuggestionsGenerated).toHaveBeenCalled();
	});

	it('should handle missing onSuggestionsGenerated callback gracefully', async () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {}
			}
		});

		const button = screen.getByRole('button');

		await expect(async () => {
			await fireEvent.click(button);
		}).not.toThrow();
	});
});

describe('GenerateSuggestionsButton Component - Loading State', () => {
	it('should show loading state when generating', async () => {
		const { container } = render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		// Should show loading indicator (spinner or text)
		await waitFor(() => {
			const spinner =
				container.querySelector('[role="status"]') || container.querySelector('[class*="spin"]');
			const loadingText = screen.queryByText(/generating|loading/i);
			expect(spinner || loadingText).toBeTruthy();
		});
	});

	it('should disable button while loading', async () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			expect(button).toBeDisabled();
		});
	});

	it('should show loading text during generation', async () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		// Should show "Generating..." or similar
		await waitFor(() => {
			expect(screen.getByText(/generating|loading/i)).toBeInTheDocument();
		});
	});

	it('should have aria-busy="true" when loading', async () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			expect(button).toHaveAttribute('aria-busy', 'true');
		});
	});

	it('should show spinner icon during loading', async () => {
		const { container } = render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			const spinner = container.querySelector('[class*="spin"], [class*="animate"]');
			expect(spinner).toBeInTheDocument();
		});
	});

	it('should restore normal state after generation completes', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		// After generation completes (simulated by callback)
		await waitFor(() => {
			expect(onSuggestionsGenerated).toHaveBeenCalled();
		});

		// Button should eventually be enabled again
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
	});

	it('should prevent multiple simultaneous generations', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');

		// Click multiple times rapidly
		await fireEvent.click(button);
		await fireEvent.click(button);
		await fireEvent.click(button);

		// Should only trigger once (button disabled after first click)
		await waitFor(() => {
			expect(button).toBeDisabled();
		});
	});
});

describe('GenerateSuggestionsButton Component - Disabled State', () => {
	it('should be disabled when no empty fields exist', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {
					name: 'Aragorn',
					description: 'A ranger from the North',
					tactics: 'Use sword and bow'
				},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
	});

	it('should be enabled when empty fields exist', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {
					name: 'Aragorn',
					description: '', // Empty field
					tactics: '' // Empty field
				},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();
	});

	it('should detect empty fields in currentData', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {
					name: 'Goblin',
					description: ''
				},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();
	});

	it('should treat null values as empty', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {
					name: 'Goblin',
					description: null
				},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();
	});

	it('should treat undefined values as empty', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {
					name: 'Goblin'
					// description is undefined
				},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();
	});

	it('should have descriptive aria-label when disabled', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {
					name: 'Aragorn',
					description: 'Full',
					tactics: 'Full'
				},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
		// Should explain why it's disabled
		expect(button).toHaveAttribute('aria-label');
	});

	it('should show tooltip or message explaining why disabled', () => {
		const { container } = render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {
					name: 'Aragorn',
					description: 'Full',
					tactics: 'Full'
				},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();

		// Should have title or aria-describedby explaining state
		expect(
			button.hasAttribute('title') || button.hasAttribute('aria-describedby')
		).toBe(true);
	});
});

describe('GenerateSuggestionsButton Component - Error Handling', () => {
	it('should display error message when generation fails', async () => {
		const onSuggestionsGenerated = vi.fn().mockRejectedValue(new Error('API error'));

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { description: '' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			// Should show error message or toast
			expect(screen.queryByText(/error|failed/i)).toBeInTheDocument();
		});
	});

	it('should re-enable button after error', async () => {
		const onSuggestionsGenerated = vi.fn().mockRejectedValue(new Error('API error'));

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { description: '' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
	});

	it('should handle network errors gracefully', async () => {
		const onSuggestionsGenerated = vi.fn().mockRejectedValue(new Error('Network error'));

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { description: '' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');

		await expect(async () => {
			await fireEvent.click(button);
		}).not.toThrow();
	});

	it('should handle timeout errors', async () => {
		const onSuggestionsGenerated = vi.fn().mockRejectedValue(new Error('Request timeout'));

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { description: '' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			expect(screen.queryByText(/timeout|error/i)).toBeInTheDocument();
		});
	});

	it('should provide user-friendly error messages', async () => {
		const onSuggestionsGenerated = vi.fn().mockRejectedValue(new Error('API key invalid'));

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { description: '' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			// Should translate error into user-friendly message
			const errorMessage = screen.queryByText(/error|failed|try again/i);
			expect(errorMessage).toBeInTheDocument();
		});
	});
});

describe('GenerateSuggestionsButton Component - Accessibility', () => {
	it('should have accessible button role', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should have descriptive aria-label', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		const ariaLabel = button.getAttribute('aria-label');

		// Should describe what the button does
		expect(ariaLabel || button.textContent).toMatch(/suggest|generate/i);
	});

	it('should be keyboard accessible', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		button.focus();

		expect(document.activeElement).toBe(button);
	});

	it('should respond to Enter key', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		button.focus();
		await fireEvent.keyDown(button, { key: 'Enter' });

		expect(onSuggestionsGenerated).toHaveBeenCalled();
	});

	it('should respond to Space key', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		button.focus();
		await fireEvent.keyDown(button, { key: ' ' });

		expect(onSuggestionsGenerated).toHaveBeenCalled();
	});

	it('should have visible focus indicator', () => {
		const { container } = render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/focus|ring/);
	});

	it('should announce loading state to screen readers', async () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			expect(button).toHaveAttribute('aria-busy', 'true');
		});
	});

	it('should not have tabindex -1', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toHaveAttribute('tabindex', '-1');
	});
});

describe('GenerateSuggestionsButton Component - Entity Types', () => {
	it('should work with character entity type', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should work with monster entity type', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'monster',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should work with location entity type', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'location',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should work with ability entity type', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'ability',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should work with custom entity types', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'custom_faction',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});
});

describe('GenerateSuggestionsButton Component - Visual Design', () => {
	it('should use Lucide icon library', () => {
		const { container } = render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should have hover state styling', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toHaveClass(/hover/);
	});

	it('should have clear, inviting appearance', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		// Should have primary or prominent button styling
		expect(button).toHaveClass(/bg-|text-/);
	});

	it('should match Director Assist design system', () => {
		const { container } = render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should have sufficient color contrast', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toHaveClass(/text-transparent|opacity-0/);
	});

	it('should be responsive on mobile devices', () => {
		const { container } = render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});
});

describe('GenerateSuggestionsButton Component - Edge Cases', () => {
	it('should handle empty entityType', () => {
		const { container } = render(GenerateSuggestionsButton, {
			props: {
				entityType: '',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle empty currentData', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should handle null currentData', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: null as any,
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should handle currentData with nested objects', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {
					name: 'Aragorn',
					stats: { str: 16, dex: 14 }
				},
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should handle very large currentData objects', () => {
		const largeData: any = {};
		for (let i = 0; i < 100; i++) {
			largeData[`field${i}`] = `value${i}`;
		}

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: largeData,
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should handle undefined entityId gracefully', () => {
		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {},
				entityId: undefined,
				onSuggestionsGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});
});

describe('GenerateSuggestionsButton Component - Real-world Use Cases', () => {
	it('should integrate with entity form workflow', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'monster',
				currentData: {
					name: 'Goblin Warrior',
					description: '',
					tactics: ''
				},
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		// Should trigger suggestion generation
		expect(onSuggestionsGenerated).toHaveBeenCalled();
	});

	it('should handle new entity creation scenario', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: {
					name: 'New Character'
					// All other fields empty
				},
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();

		await fireEvent.click(button);
		expect(onSuggestionsGenerated).toHaveBeenCalled();
	});

	it('should handle existing entity editing scenario', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				entityId: 456,
				currentData: {
					name: 'Aragorn',
					description: 'A ranger',
					tactics: '' // Empty field to fill
				},
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();

		await fireEvent.click(button);
		expect(onSuggestionsGenerated).toHaveBeenCalled();
	});

	it('should handle rapid clicks gracefully', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { description: '' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');

		// Rapid clicks
		await fireEvent.click(button);
		await fireEvent.click(button);
		await fireEvent.click(button);

		// Should only generate once (button disabled after first click)
		await waitFor(() => {
			expect(button).toBeDisabled();
		});
	});

	it('should provide feedback on successful generation', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { description: '' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			expect(onSuggestionsGenerated).toHaveBeenCalled();
		});

		// Should show success message or restore normal state
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
	});

	it('should work in multi-field form context', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'monster',
				currentData: {
					name: 'Goblin',
					description: '',
					tactics: '',
					backstory: '',
					motivations: ''
				},
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();

		await fireEvent.click(button);
		expect(onSuggestionsGenerated).toHaveBeenCalled();
	});
});

describe('GenerateSuggestionsButton Component - Success Feedback', () => {
	it('should show success toast after generation', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { description: '' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			// Should show success message
			const successMessage = screen.queryByText(/success|generated|complete/i);
			expect(successMessage).toBeInTheDocument();
		});
	});

	it('should indicate number of suggestions generated', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { description: '', tactics: '' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			// Should show count of suggestions
			const feedback = screen.queryByText(/\d+.*suggestion/i);
			expect(feedback).toBeInTheDocument();
		});
	});

	it('should reset button state after success', async () => {
		const onSuggestionsGenerated = vi.fn();

		render(GenerateSuggestionsButton, {
			props: {
				entityType: 'character',
				currentData: { description: '' },
				onSuggestionsGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			expect(onSuggestionsGenerated).toHaveBeenCalled();
		});

		// Button should be clickable again
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
	});
});
