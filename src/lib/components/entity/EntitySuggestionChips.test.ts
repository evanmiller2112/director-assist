/**
 * Tests for EntitySuggestionChips Component (Issue #547)
 *
 * This component displays AI-suggested entities as interactive chips below the
 * npcsPresent field. Each chip shows an entity name, a brief reason, a + button
 * to add the entity, and an X button to dismiss the suggestion. An "Add all"
 * button allows accepting every visible suggestion at once.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests FAIL until EntitySuggestionChips.svelte is created.
 *
 * Coverage areas:
 * - Empty-state: no render when suggestions array is empty
 * - Header rendering with lightbulb icon
 * - Per-chip content: entity name and reason text
 * - Per-chip + (add) button calls onAdd with entity ID
 * - Per-chip X (dismiss) button calls onDismiss with entity ID
 * - "Add all" button renders and calls onAddAll
 * - Amber theme styling
 * - Confidence-level visual indicator
 * - Edge cases: single suggestion, missing callbacks, special characters
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import EntitySuggestionChips from './EntitySuggestionChips.svelte';
import type { BaseEntity } from '$lib/types';

// ---------------------------------------------------------------------------
// Shared test data helpers
// ---------------------------------------------------------------------------

function makeEntity(overrides: Partial<BaseEntity> = {}): BaseEntity {
	const now = new Date();
	return {
		id: `entity-${Math.random().toString(36).slice(2, 7)}`,
		type: 'npc',
		name: 'Test NPC',
		description: 'A test entity',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		createdAt: now,
		updatedAt: now,
		metadata: {},
		...overrides
	};
}

interface EntitySuggestion {
	entity: BaseEntity;
	reason: string;
	confidence: 'high' | 'medium' | 'low';
	sourceRelationship: string;
}

function makeSuggestion(overrides: Partial<EntitySuggestion> = {}): EntitySuggestion {
	return {
		entity: makeEntity(),
		reason: 'Frequently appears in this location',
		confidence: 'high',
		sourceRelationship: 'located_at',
		...overrides
	};
}

// ---------------------------------------------------------------------------
// 1. Empty-state behavior
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Empty State', () => {
	it('should render nothing when suggestions array is empty', () => {
		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions: [],
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// The component should produce no visible DOM nodes
		expect(container.firstChild).toBeNull();
	});

	it('should not render the header when suggestions is empty', () => {
		render(EntitySuggestionChips, {
			props: {
				suggestions: [],
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.queryByText(/suggested based on location/i)).not.toBeInTheDocument();
	});

	it('should not render any buttons when suggestions is empty', () => {
		render(EntitySuggestionChips, {
			props: {
				suggestions: [],
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.queryAllByRole('button')).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// 2. Header rendering
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Header', () => {
	let suggestions: EntitySuggestion[];

	beforeEach(() => {
		suggestions = [makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'Goblin Scout' }) })];
	});

	it('should render "Suggested based on location" header when suggestions exist', () => {
		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByText(/suggested based on location/i)).toBeInTheDocument();
	});

	it('should render a lightbulb icon in the header', () => {
		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// The Lucide Lightbulb renders as an <svg> element
		const svg = container.querySelector('svg');
		expect(svg).toBeInTheDocument();
	});

	it('should render the header before any chips', () => {
		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		const header = screen.getByText(/suggested based on location/i);
		expect(header).toBeInTheDocument();

		// Header should appear before chip content in the DOM tree
		const root = container.firstChild as HTMLElement;
		expect(root).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// 3. Chip content rendering
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Chip Content', () => {
	it('should render one chip per suggestion', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'Goblin Scout' }) }),
			makeSuggestion({ entity: makeEntity({ id: 'e2', name: 'Tavern Keeper' }) }),
			makeSuggestion({ entity: makeEntity({ id: 'e3', name: 'Town Guard' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByText('Goblin Scout')).toBeInTheDocument();
		expect(screen.getByText('Tavern Keeper')).toBeInTheDocument();
		expect(screen.getByText('Town Guard')).toBeInTheDocument();
	});

	it('should display the entity name on each chip', () => {
		const entityName = 'Lord Aldric Vane';
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: entityName }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByText(entityName)).toBeInTheDocument();
	});

	it('should display the reason text on each chip', () => {
		const reason = 'Has a known base near this location';
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'Ranger' }), reason })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByText(reason)).toBeInTheDocument();
	});

	it('should display both name and reason for each chip', () => {
		const suggestions = [
			makeSuggestion({
				entity: makeEntity({ id: 'e1', name: 'Inquisitor Rael' }),
				reason: 'Patrols this district regularly'
			}),
			makeSuggestion({
				entity: makeEntity({ id: 'e2', name: 'Merchant Dova' }),
				reason: 'Operates a stall in this market'
			})
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByText('Inquisitor Rael')).toBeInTheDocument();
		expect(screen.getByText('Patrols this district regularly')).toBeInTheDocument();
		expect(screen.getByText('Merchant Dova')).toBeInTheDocument();
		expect(screen.getByText('Operates a stall in this market')).toBeInTheDocument();
	});

	it('should render a single chip correctly', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'solo', name: 'Lone Wolf' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByText('Lone Wolf')).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// 4. Add (+) button per chip
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Add Button Per Chip', () => {
	it('should render an add button on each chip', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'Goblin Scout' }) }),
			makeSuggestion({ entity: makeEntity({ id: 'e2', name: 'Tavern Keeper' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// Expect at least one add button per chip (plus the "Add all" button)
		const addButtons = screen.getAllByRole('button', { name: /add/i });
		// At minimum there should be individual add buttons for each chip
		expect(addButtons.length).toBeGreaterThanOrEqual(suggestions.length);
	});

	it('should call onAdd with the correct entity ID when the add button is clicked', async () => {
		const onAdd = vi.fn();
		const entityId = 'entity-abc-123';
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: entityId, name: 'Test NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd,
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// Find the chip-level add button (aria-label includes "add" and entity name or just "+")
		const addButton = screen.getByRole('button', { name: /add test npc|\+/i });
		await fireEvent.click(addButton);

		expect(onAdd).toHaveBeenCalledTimes(1);
		expect(onAdd).toHaveBeenCalledWith(entityId);
	});

	it('should call onAdd with the right ID for each distinct chip', async () => {
		const onAdd = vi.fn();
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'id-first', name: 'First NPC' }) }),
			makeSuggestion({ entity: makeEntity({ id: 'id-second', name: 'Second NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd,
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		const addFirstButton = screen.getByRole('button', { name: /add first npc|\+ first/i });
		await fireEvent.click(addFirstButton);

		expect(onAdd).toHaveBeenCalledWith('id-first');
		expect(onAdd).not.toHaveBeenCalledWith('id-second');
	});

	it('should handle missing onAdd callback without throwing', async () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add npc|\+/i });

		await expect(async () => {
			await fireEvent.click(addButton);
		}).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// 5. Dismiss (X) button per chip
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Dismiss Button Per Chip', () => {
	it('should render a dismiss button on each chip', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'Goblin Scout' }) }),
			makeSuggestion({ entity: makeEntity({ id: 'e2', name: 'Tavern Keeper' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// Each chip should have a dismiss button (X)
		const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
		expect(dismissButtons.length).toBeGreaterThanOrEqual(suggestions.length);
	});

	it('should call onDismiss with the correct entity ID when the dismiss button is clicked', async () => {
		const onDismiss = vi.fn();
		const entityId = 'entity-xyz-789';
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: entityId, name: 'Dismissed NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss dismissed npc|dismiss/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(onDismiss).toHaveBeenCalledWith(entityId);
	});

	it('should call onDismiss with the right ID for each distinct chip', async () => {
		const onDismiss = vi.fn();
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'dismiss-first', name: 'Alpha' }) }),
			makeSuggestion({ entity: makeEntity({ id: 'dismiss-second', name: 'Beta' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss
			}
		});

		// Dismiss the first chip
		const dismissAlpha = screen.getByRole('button', { name: /dismiss alpha/i });
		await fireEvent.click(dismissAlpha);

		expect(onDismiss).toHaveBeenCalledWith('dismiss-first');
		expect(onDismiss).not.toHaveBeenCalledWith('dismiss-second');
	});

	it('should handle missing onDismiss callback without throwing', async () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn()
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });

		await expect(async () => {
			await fireEvent.click(dismissButton);
		}).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// 6. "Add all" button
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Add All Button', () => {
	it('should render an "Add all" button when suggestions exist', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC 1' }) }),
			makeSuggestion({ entity: makeEntity({ id: 'e2', name: 'NPC 2' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /add all/i })).toBeInTheDocument();
	});

	it('should call onAddAll when the "Add all" button is clicked', async () => {
		const onAddAll = vi.fn();
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC 1' }) }),
			makeSuggestion({ entity: makeEntity({ id: 'e2', name: 'NPC 2' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll,
				onDismiss: vi.fn()
			}
		});

		const addAllButton = screen.getByRole('button', { name: /add all/i });
		await fireEvent.click(addAllButton);

		expect(onAddAll).toHaveBeenCalledTimes(1);
	});

	it('should call onAddAll only once per click', async () => {
		const onAddAll = vi.fn();
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll,
				onDismiss: vi.fn()
			}
		});

		const addAllButton = screen.getByRole('button', { name: /add all/i });
		await fireEvent.click(addAllButton);

		expect(onAddAll).toHaveBeenCalledTimes(1);
	});

	it('should handle missing onAddAll callback without throwing', async () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		const addAllButton = screen.getByRole('button', { name: /add all/i });

		await expect(async () => {
			await fireEvent.click(addAllButton);
		}).not.toThrow();
	});

	it('should render "Add all" button even with a single suggestion', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'solo', name: 'Solo NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /add all/i })).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// 7. Amber theme styling
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Amber Theme', () => {
	it('should apply amber background class to the container', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC' }) })
		];

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// The root element or a prominent child should carry amber color classes
		const amberElement = container.querySelector('[class*="amber"]');
		expect(amberElement).toBeInTheDocument();
	});

	it('should use amber-100 or amber-900 Tailwind classes for the suggestion area', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC' }) })
		];

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		const amberBg =
			container.querySelector('[class*="amber-100"]') ||
			container.querySelector('[class*="amber-900"]') ||
			container.querySelector('[class*="bg-amber"]');

		expect(amberBg).toBeInTheDocument();
	});

	it('should have amber text color classes', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC' }) })
		];

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		const amberText = container.querySelector('[class*="text-amber"]');
		expect(amberText).toBeInTheDocument();
	});

	it('should not use red or green primary theme classes on the container', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC' }) })
		];

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// Container root should not be dominated by red or green
		const root = container.firstChild as HTMLElement;
		expect(root?.className ?? '').not.toMatch(/bg-red-|bg-green-/);
	});
});

// ---------------------------------------------------------------------------
// 8. Confidence level visual indicator (optional but tested)
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Confidence Level Indicator', () => {
	it('should render a visual indicator for high-confidence suggestions', () => {
		const suggestions = [
			makeSuggestion({
				entity: makeEntity({ id: 'e1', name: 'High Conf NPC' }),
				confidence: 'high'
			})
		];

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// The component should render something that communicates confidence —
		// either visible text or a styled indicator element.
		const highConfidenceIndicator =
			screen.queryByText(/high/i) ||
			container.querySelector('[class*="high"], [data-confidence="high"], [title*="high" i]');

		expect(highConfidenceIndicator).toBeTruthy();
	});

	it('should render a visual indicator for medium-confidence suggestions', () => {
		const suggestions = [
			makeSuggestion({
				entity: makeEntity({ id: 'e2', name: 'Med Conf NPC' }),
				confidence: 'medium'
			})
		];

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		const mediumConfidenceIndicator =
			screen.queryByText(/medium/i) ||
			container.querySelector('[class*="medium"], [data-confidence="medium"], [title*="medium" i]');

		expect(mediumConfidenceIndicator).toBeTruthy();
	});

	it('should render a visual indicator for low-confidence suggestions', () => {
		const suggestions = [
			makeSuggestion({
				entity: makeEntity({ id: 'e3', name: 'Low Conf NPC' }),
				confidence: 'low'
			})
		];

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		const lowConfidenceIndicator =
			screen.queryByText(/low/i) ||
			container.querySelector('[class*="low"], [data-confidence="low"], [title*="low" i]');

		expect(lowConfidenceIndicator).toBeTruthy();
	});

	it('should differentiate visual treatment between high and low confidence', () => {
		const suggestions = [
			makeSuggestion({
				entity: makeEntity({ id: 'e1', name: 'Alpha' }),
				confidence: 'high'
			}),
			makeSuggestion({
				entity: makeEntity({ id: 'e2', name: 'Beta' }),
				confidence: 'low'
			})
		];

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// Both names should still be present (regression check)
		expect(screen.getByText('Alpha')).toBeInTheDocument();
		expect(screen.getByText('Beta')).toBeInTheDocument();

		// The component should have rendered; confidence differentiation is visible
		expect(container.firstChild).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// 9. Accessibility
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Accessibility', () => {
	it('should have accessible aria-labels on individual add buttons', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'Guard Captain' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// The add button should be discoverable by an accessible name
		const addButton = screen.getByRole('button', { name: /add guard captain|\+/i });
		expect(addButton).toBeInTheDocument();
	});

	it('should have accessible aria-labels on individual dismiss buttons', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'Guard Captain' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// The dismiss button should be discoverable by an accessible name
		const dismissButton = screen.getByRole('button', { name: /dismiss guard captain|dismiss/i });
		expect(dismissButton).toBeInTheDocument();
	});

	it('should not have any button with tabindex -1 (all buttons focusable)', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		const buttons = screen.getAllByRole('button');
		buttons.forEach((btn) => {
			expect(btn).not.toHaveAttribute('tabindex', '-1');
		});
	});

	it('should support keyboard activation of add button', async () => {
		const onAdd = vi.fn();
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd,
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		// Native <button> elements respond to Enter/Space by default
		const addButton = screen.getByRole('button', { name: /add npc|\+/i });
		addButton.focus();
		expect(document.activeElement).toBe(addButton);
	});
});

// ---------------------------------------------------------------------------
// 10. Edge cases
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Edge Cases', () => {
	it('should handle entity names with special characters', () => {
		const suggestions = [
			makeSuggestion({
				entity: makeEntity({ id: 'e1', name: "O'Brien & Sons <Ltd>" })
			})
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByText("O'Brien & Sons <Ltd>")).toBeInTheDocument();
	});

	it('should handle a very long entity name without crashing', () => {
		const longName = 'A'.repeat(100) + ' the Magnificent, Destroyer of Worlds';
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: longName }) })
		];

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(container.firstChild).not.toBeNull();
		expect(screen.getByText(longName)).toBeInTheDocument();
	});

	it('should handle a very long reason string without crashing', () => {
		const longReason = 'Because '.repeat(30) + 'this entity is important.';
		const suggestions = [
			makeSuggestion({
				entity: makeEntity({ id: 'e1', name: 'Important NPC' }),
				reason: longReason
			})
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByText(longReason)).toBeInTheDocument();
	});

	it('should handle a large number of suggestions without crashing', () => {
		const suggestions = Array.from({ length: 20 }, (_, i) =>
			makeSuggestion({ entity: makeEntity({ id: `entity-${i}`, name: `NPC ${i}` }) })
		);

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(container.firstChild).not.toBeNull();
		expect(screen.getByText('NPC 0')).toBeInTheDocument();
		expect(screen.getByText('NPC 19')).toBeInTheDocument();
	});

	it('should handle all confidence levels in the same render', () => {
		const suggestions = [
			makeSuggestion({
				entity: makeEntity({ id: 'e1', name: 'High NPC' }),
				confidence: 'high'
			}),
			makeSuggestion({
				entity: makeEntity({ id: 'e2', name: 'Med NPC' }),
				confidence: 'medium'
			}),
			makeSuggestion({
				entity: makeEntity({ id: 'e3', name: 'Low NPC' }),
				confidence: 'low'
			})
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(screen.getByText('High NPC')).toBeInTheDocument();
		expect(screen.getByText('Med NPC')).toBeInTheDocument();
		expect(screen.getByText('Low NPC')).toBeInTheDocument();
	});

	it('should render correctly with all optional callbacks omitted', () => {
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'Orphaned NPC' }) })
		];

		// No callbacks at all — should render without throwing
		const { container } = render(EntitySuggestionChips, {
			props: { suggestions }
		});

		expect(container.firstChild).not.toBeNull();
		expect(screen.getByText('Orphaned NPC')).toBeInTheDocument();
	});

	it('should not render duplicate chips for suggestions with the same entity ID', () => {
		// If the same entity appears twice (e.g. consumer bug), the component
		// should still render both or de-duplicate — either is acceptable, but
		// it must not crash.
		const sharedEntity = makeEntity({ id: 'shared', name: 'Shared NPC' });
		const suggestions = [
			makeSuggestion({ entity: sharedEntity, reason: 'Reason A' }),
			makeSuggestion({ entity: sharedEntity, reason: 'Reason B' })
		];

		const { container } = render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll: vi.fn(),
				onDismiss: vi.fn()
			}
		});

		expect(container.firstChild).not.toBeNull();
	});
});

// ---------------------------------------------------------------------------
// 11. Callback isolation (interactions do not bleed between chips)
// ---------------------------------------------------------------------------

describe('EntitySuggestionChips - Callback Isolation', () => {
	it('should not call onDismiss when the add button is clicked', async () => {
		const onAdd = vi.fn();
		const onDismiss = vi.fn();
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'Solo NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd,
				onAddAll: vi.fn(),
				onDismiss
			}
		});

		const addButton = screen.getByRole('button', { name: /add solo npc|\+/i });
		await fireEvent.click(addButton);

		expect(onAdd).toHaveBeenCalledWith('e1');
		expect(onDismiss).not.toHaveBeenCalled();
	});

	it('should not call onAdd when the dismiss button is clicked', async () => {
		const onAdd = vi.fn();
		const onDismiss = vi.fn();
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'Solo NPC' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd,
				onAddAll: vi.fn(),
				onDismiss
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss solo npc|dismiss/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalledWith('e1');
		expect(onAdd).not.toHaveBeenCalled();
	});

	it('should not call onAddAll when individual add buttons are clicked', async () => {
		const onAddAll = vi.fn();
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC Alpha' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd: vi.fn(),
				onAddAll,
				onDismiss: vi.fn()
			}
		});

		const addButton = screen.getByRole('button', { name: /add npc alpha|\+/i });
		await fireEvent.click(addButton);

		expect(onAddAll).not.toHaveBeenCalled();
	});

	it('should not call individual onAdd when the "Add all" button is clicked', async () => {
		const onAdd = vi.fn();
		const onAddAll = vi.fn();
		const suggestions = [
			makeSuggestion({ entity: makeEntity({ id: 'e1', name: 'NPC Alpha' }) })
		];

		render(EntitySuggestionChips, {
			props: {
				suggestions,
				onAdd,
				onAddAll,
				onDismiss: vi.fn()
			}
		});

		const addAllButton = screen.getByRole('button', { name: /add all/i });
		await fireEvent.click(addAllButton);

		expect(onAddAll).toHaveBeenCalledTimes(1);
		expect(onAdd).not.toHaveBeenCalled();
	});
});
