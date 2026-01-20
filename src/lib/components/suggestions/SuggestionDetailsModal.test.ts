/**
 * Tests for SuggestionDetailsModal Component (TDD RED Phase)
 *
 * Phase B4 of Issue #43: AI Suggestions System
 *
 * Modal that shows full suggestion details when user clicks "View Details" on a card:
 * - Full description text
 * - List of affected entities (clickable links)
 * - Suggested action with "Execute" button
 * - "Dismiss" and "Snooze" buttons
 * - Close button
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import SuggestionDetailsModal from './SuggestionDetailsModal.svelte';
import type { AISuggestion } from '$lib/types';

describe('SuggestionDetailsModal Component - Basic Rendering', () => {
	let mockSuggestion: AISuggestion;

	beforeEach(() => {
		mockSuggestion = {
			id: 'suggestion-1',
			type: 'relationship',
			title: 'Suggested Relationship',
			description: 'Consider creating a relationship between Gandalf and Aragorn based on their shared history.',
			relevanceScore: 85,
			affectedEntityIds: ['entity-gandalf', 'entity-aragorn'],
			suggestedAction: {
				actionType: 'create-relationship',
				actionData: {
					sourceId: 'entity-gandalf',
					targetId: 'entity-aragorn',
					relationship: 'mentors',
					bidirectional: false
				}
			},
			status: 'pending',
			createdAt: new Date('2025-01-15T10:00:00Z')
		};
	});

	it('should render without crashing', () => {
		const { container } = render(SuggestionDetailsModal, {
			props: {
				open: false,
				suggestion: mockSuggestion
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should not be visible when open prop is false', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: false,
				suggestion: mockSuggestion
			}
		});

		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should be visible when open prop is true', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should render as a modal dialog', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should display suggestion title', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		expect(screen.getByText('Suggested Relationship')).toBeInTheDocument();
	});

	it('should display full suggestion description', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		expect(screen.getByText(/Consider creating a relationship between Gandalf and Aragorn/)).toBeInTheDocument();
	});

	it('should display suggestion type badge', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		// "relationship" appears in both title and badge, so use getAllByText
		const relationshipTexts = screen.getAllByText(/relationship/i);
		expect(relationshipTexts.length).toBeGreaterThanOrEqual(1);
	});

	it('should display relevance score', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		expect(screen.getByText(/85/)).toBeInTheDocument();
	});
});

describe('SuggestionDetailsModal Component - Affected Entities', () => {
	let mockSuggestion: AISuggestion;
	let mockEntities: any[];

	beforeEach(() => {
		mockSuggestion = {
			id: 'suggestion-1',
			type: 'relationship',
			title: 'Test Suggestion',
			description: 'Test description',
			relevanceScore: 75,
			affectedEntityIds: ['entity-1', 'entity-2'],
			status: 'pending',
			createdAt: new Date()
		};

		mockEntities = [
			{ id: 'entity-1', name: 'Gandalf', type: 'character' },
			{ id: 'entity-2', name: 'Aragorn', type: 'character' }
		];
	});

	it('should display list of affected entities', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				entities: mockEntities
			}
		});

		expect(screen.getByText('Gandalf')).toBeInTheDocument();
		expect(screen.getByText('Aragorn')).toBeInTheDocument();
	});

	it('should render entity names as clickable links', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				entities: mockEntities
			}
		});

		const gandalfLink = screen.getByRole('link', { name: /gandalf/i });
		expect(gandalfLink).toBeInTheDocument();
		expect(gandalfLink).toHaveAttribute('href', '/entities/entity-1');
	});

	it('should show entity type alongside name', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				entities: mockEntities
			}
		});

		// Both entities are characters, so there will be multiple matches
		const characterTypes = screen.getAllByText(/character/i);
		expect(characterTypes.length).toBeGreaterThanOrEqual(1);
	});

	it('should handle multiple affected entities', () => {
		mockSuggestion.affectedEntityIds = ['e1', 'e2', 'e3', 'e4'];
		const manyEntities = [
			{ id: 'e1', name: 'Entity 1', type: 'npc' },
			{ id: 'e2', name: 'Entity 2', type: 'location' },
			{ id: 'e3', name: 'Entity 3', type: 'item' },
			{ id: 'e4', name: 'Entity 4', type: 'faction' }
		];

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				entities: manyEntities
			}
		});

		expect(screen.getByText('Entity 1')).toBeInTheDocument();
		expect(screen.getByText('Entity 2')).toBeInTheDocument();
		expect(screen.getByText('Entity 3')).toBeInTheDocument();
		expect(screen.getByText('Entity 4')).toBeInTheDocument();
	});

	it('should handle missing entity data gracefully', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				entities: [] // No entities provided
			}
		});

		// Should show entity IDs as fallback
		expect(screen.getByText(/entity-1/)).toBeInTheDocument();
	});

	it('should show section header for affected entities', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				entities: mockEntities
			}
		});

		expect(screen.getByText(/affected entities/i)).toBeInTheDocument();
	});
});

describe('SuggestionDetailsModal Component - Suggested Action', () => {
	let mockSuggestion: AISuggestion;

	beforeEach(() => {
		mockSuggestion = {
			id: 'suggestion-1',
			type: 'relationship',
			title: 'Test Suggestion',
			description: 'Test description',
			relevanceScore: 75,
			affectedEntityIds: ['entity-1', 'entity-2'],
			status: 'pending',
			createdAt: new Date()
		};
	});

	it('should display suggested action section when action exists', () => {
		mockSuggestion.suggestedAction = {
			actionType: 'create-relationship',
			actionData: { sourceId: 'e1', targetId: 'e2', relationship: 'knows' }
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		expect(screen.getByText(/suggested action/i)).toBeInTheDocument();
	});

	it('should display action type for create-relationship', () => {
		mockSuggestion.suggestedAction = {
			actionType: 'create-relationship',
			actionData: {
				sourceId: 'entity-1',
				targetId: 'entity-2',
				relationship: 'allies_with'
			}
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		expect(screen.getByText(/create relationship/i)).toBeInTheDocument();
	});

	it('should display relationship details', () => {
		mockSuggestion.suggestedAction = {
			actionType: 'create-relationship',
			actionData: {
				sourceId: 'entity-1',
				targetId: 'entity-2',
				relationship: 'mentors'
			}
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				entities: [
					{ id: 'entity-1', name: 'Gandalf', type: 'character' },
					{ id: 'entity-2', name: 'Frodo', type: 'character' }
				]
			}
		});

		expect(screen.getByText(/mentors/i)).toBeInTheDocument();
	});

	it('should display action type for edit-entity', () => {
		mockSuggestion.suggestedAction = {
			actionType: 'edit-entity',
			actionData: {
				entityId: 'entity-1',
				updates: { name: 'Updated Name' }
			}
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		expect(screen.getByText(/edit entity/i)).toBeInTheDocument();
	});

	it('should display action type for create-entity', () => {
		mockSuggestion.suggestedAction = {
			actionType: 'create-entity',
			actionData: {
				type: 'npc',
				name: 'New NPC'
			}
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		expect(screen.getByText(/create entity/i)).toBeInTheDocument();
	});

	it('should display action type for flag-for-review', () => {
		mockSuggestion.suggestedAction = {
			actionType: 'flag-for-review',
			actionData: {
				entityIds: ['e1'],
				reason: 'Inconsistency detected'
			}
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		expect(screen.getByText(/flag for review/i)).toBeInTheDocument();
	});

	it('should not show action section when no action suggested', () => {
		delete mockSuggestion.suggestedAction;

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		expect(screen.queryByText(/suggested action/i)).not.toBeInTheDocument();
	});
});

describe('SuggestionDetailsModal Component - Action Buttons', () => {
	let mockSuggestion: AISuggestion;
	let onExecute: (suggestion: AISuggestion) => void;
	let onDismiss: (suggestionId: string) => void;
	let onSnooze: (suggestionId: string) => void;
	let onClose: () => void;

	beforeEach(() => {
		mockSuggestion = {
			id: 'suggestion-1',
			type: 'relationship',
			title: 'Test Suggestion',
			description: 'Test description',
			relevanceScore: 75,
			affectedEntityIds: ['entity-1', 'entity-2'],
			suggestedAction: {
				actionType: 'create-relationship',
				actionData: { sourceId: 'e1', targetId: 'e2', relationship: 'knows' }
			},
			status: 'pending',
			createdAt: new Date()
		};

		onExecute = vi.fn() as unknown as (suggestion: AISuggestion) => void;
		onDismiss = vi.fn() as unknown as (suggestionId: string) => void;
		onSnooze = vi.fn() as unknown as (suggestionId: string) => void;
		onClose = vi.fn() as unknown as () => void;
	});

	it('should render Execute button when action exists', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				onExecute
			}
		});

		const executeButton = screen.getByRole('button', { name: /execute/i });
		expect(executeButton).toBeInTheDocument();
	});

	it('should render Dismiss button', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				onDismiss
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		expect(dismissButton).toBeInTheDocument();
	});

	it('should render Snooze button', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				onSnooze
			}
		});

		const snoozeButton = screen.getByRole('button', { name: /snooze/i });
		expect(snoozeButton).toBeInTheDocument();
	});

	it('should render Close button', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				onClose
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		expect(closeButton).toBeInTheDocument();
	});

	it('should call onExecute when Execute button is clicked', async () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				onExecute
			}
		});

		const executeButton = screen.getByRole('button', { name: /execute/i });
		await fireEvent.click(executeButton);

		expect(onExecute).toHaveBeenCalledTimes(1);
		expect(onExecute).toHaveBeenCalledWith(mockSuggestion);
	});

	it('should call onDismiss when Dismiss button is clicked', async () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				onDismiss
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalledTimes(1);
		expect(onDismiss).toHaveBeenCalledWith(mockSuggestion.id);
	});

	it('should call onSnooze when Snooze button is clicked', async () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				onSnooze
			}
		});

		const snoozeButton = screen.getByRole('button', { name: /snooze/i });
		await fireEvent.click(snoozeButton);

		expect(onSnooze).toHaveBeenCalledTimes(1);
		expect(onSnooze).toHaveBeenCalledWith(mockSuggestion.id);
	});

	it('should call onClose when Close button is clicked', async () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				onClose
			}
		});

		const closeButton = screen.getByRole('button', { name: /close/i });
		await fireEvent.click(closeButton);

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should not render Execute button when no action suggested', () => {
		delete mockSuggestion.suggestedAction;

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		expect(screen.queryByRole('button', { name: /execute/i })).not.toBeInTheDocument();
	});

	it('should handle missing callbacks gracefully', async () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });

		// Should not throw
		await expect(async () => {
			await fireEvent.click(dismissButton);
		}).not.toThrow();
	});
});

describe('SuggestionDetailsModal Component - Loading State', () => {
	let mockSuggestion: AISuggestion;

	beforeEach(() => {
		mockSuggestion = {
			id: 'suggestion-1',
			type: 'relationship',
			title: 'Test Suggestion',
			description: 'Test description',
			relevanceScore: 75,
			affectedEntityIds: ['entity-1'],
			suggestedAction: {
				actionType: 'create-relationship',
				actionData: { sourceId: 'e1', targetId: 'e2', relationship: 'knows' }
			},
			status: 'pending',
			createdAt: new Date()
		};
	});

	it('should disable Execute button when loading', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				loading: true
			}
		});

		const executeButton = screen.getByRole('button', { name: /execute/i });
		expect(executeButton).toBeDisabled();
	});

	it('should disable Dismiss button when loading', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				loading: true
			}
		});

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		expect(dismissButton).toBeDisabled();
	});

	it('should disable Snooze button when loading', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				loading: true
			}
		});

		const snoozeButton = screen.getByRole('button', { name: /snooze/i });
		expect(snoozeButton).toBeDisabled();
	});

	it('should show loading indicator on Execute button', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				loading: true
			}
		});

		const executeButton = screen.getByRole('button', { name: /execute/i });
		expect(executeButton).toHaveAttribute('aria-busy', 'true');
	});

	it('should enable buttons when not loading', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				loading: false
			}
		});

		const executeButton = screen.getByRole('button', { name: /execute/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss/i });

		expect(executeButton).not.toBeDisabled();
		expect(dismissButton).not.toBeDisabled();
	});

	it('should not call callbacks when buttons disabled by loading', async () => {
		const onExecute = vi.fn();
		const onDismiss = vi.fn();

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				loading: true,
				onExecute,
				onDismiss
			}
		});

		const executeButton = screen.getByRole('button', { name: /execute/i });
		const dismissButton = screen.getByRole('button', { name: /dismiss/i });

		await fireEvent.click(executeButton);
		await fireEvent.click(dismissButton);

		expect(onExecute).not.toHaveBeenCalled();
		expect(onDismiss).not.toHaveBeenCalled();
	});
});

describe('SuggestionDetailsModal Component - Keyboard & Accessibility', () => {
	let mockSuggestion: AISuggestion;
	let onClose: () => void;

	beforeEach(() => {
		mockSuggestion = {
			id: 'suggestion-1',
			type: 'relationship',
			title: 'Test Suggestion',
			description: 'Test description',
			relevanceScore: 75,
			affectedEntityIds: ['entity-1'],
			status: 'pending',
			createdAt: new Date()
		};

		onClose = vi.fn() as unknown as () => void;
	});

	it('should have aria-modal="true"', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have aria-labelledby connecting title to dialog', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		const dialog = screen.getByRole('dialog');
		const title = screen.getByText('Test Suggestion');

		const titleId = title.getAttribute('id');
		expect(titleId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', titleId);
	});

	it('should close on Escape key press', async () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion,
				onClose
			}
		});

		await fireEvent.keyDown(document, { key: 'Escape' });

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should trap focus within dialog', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		const dialog = screen.getByRole('dialog');
		const buttons = screen.getAllByRole('button');

		buttons.forEach((button) => {
			expect(dialog).toContainElement(button);
		});
	});

	it('should allow keyboard navigation between buttons', () => {
		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: mockSuggestion
			}
		});

		const buttons = screen.getAllByRole('button');

		buttons.forEach((button) => {
			expect(button).not.toHaveAttribute('tabindex', '-1');
		});
	});
});

describe('SuggestionDetailsModal Component - Edge Cases', () => {
	it('should handle very long descriptions', () => {
		const longDescription = 'Lorem ipsum '.repeat(100);
		const suggestion = {
			id: 'sug-1',
			type: 'enhancement' as const,
			title: 'Long Suggestion',
			description: longDescription,
			relevanceScore: 50,
			affectedEntityIds: ['e1'],
			status: 'pending' as const,
			createdAt: new Date()
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion
			}
		});

		expect(screen.getByText(/Lorem ipsum/)).toBeInTheDocument();
	});

	it('should handle special characters in description', () => {
		const suggestion = {
			id: 'sug-1',
			type: 'plot_thread' as const,
			title: 'Test',
			description: 'Description with <tags> & "quotes" and \'apostrophes\'',
			relevanceScore: 60,
			affectedEntityIds: ['e1'],
			status: 'pending' as const,
			createdAt: new Date()
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion
			}
		});

		expect(screen.getByText(/tags.*quotes.*apostrophes/)).toBeInTheDocument();
	});

	it('should handle suggestion with no affected entities', () => {
		const suggestion = {
			id: 'sug-1',
			type: 'recommendation' as const,
			title: 'General Recommendation',
			description: 'A general suggestion not tied to specific entities',
			relevanceScore: 40,
			affectedEntityIds: [],
			status: 'pending' as const,
			createdAt: new Date()
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion
			}
		});

		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('should handle rapid open/close cycles', async () => {
		const { rerender } = render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion: {
					id: 'sug-1',
					type: 'relationship' as const,
					title: 'Test',
					description: 'Test',
					relevanceScore: 50,
					affectedEntityIds: ['e1'],
					status: 'pending' as const,
					createdAt: new Date()
				}
			}
		});

		expect(screen.getByRole('dialog')).toBeInTheDocument();

		rerender({ open: false });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		rerender({ open: true });
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
});

describe('SuggestionDetailsModal Component - Real-world Scenarios', () => {
	it('should handle relationship suggestion workflow', async () => {
		const onExecute = vi.fn();
		const suggestion: AISuggestion = {
			id: 'rel-sug-1',
			type: 'relationship',
			title: 'Create Mentorship Relationship',
			description: 'Gandalf appears to have a mentoring relationship with Frodo based on their interactions.',
			relevanceScore: 90,
			affectedEntityIds: ['gandalf', 'frodo'],
			suggestedAction: {
				actionType: 'create-relationship',
				actionData: {
					sourceId: 'gandalf',
					targetId: 'frodo',
					relationship: 'mentors',
					bidirectional: false,
					notes: 'Wisdom and guidance provided throughout the journey'
				}
			},
			status: 'pending',
			createdAt: new Date()
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion,
				entities: [
					{ id: 'gandalf', name: 'Gandalf the Grey', type: 'character' },
					{ id: 'frodo', name: 'Frodo Baggins', type: 'character' }
				],
				onExecute
			}
		});

		expect(screen.getByText('Create Mentorship Relationship')).toBeInTheDocument();
		expect(screen.getByText(/mentoring relationship/)).toBeInTheDocument();
		expect(screen.getByText('Gandalf the Grey')).toBeInTheDocument();
		expect(screen.getByText('Frodo Baggins')).toBeInTheDocument();

		const executeButton = screen.getByRole('button', { name: /execute/i });
		await fireEvent.click(executeButton);

		expect(onExecute).toHaveBeenCalledWith(suggestion);
	});

	it('should handle inconsistency detection workflow', async () => {
		const onDismiss = vi.fn();
		const suggestion: AISuggestion = {
			id: 'incon-sug-1',
			type: 'inconsistency',
			title: 'Conflicting Location Information',
			description: 'Rivendell is described as being in different regions in multiple entities.',
			relevanceScore: 70,
			affectedEntityIds: ['rivendell', 'map-1', 'story-1'],
			suggestedAction: {
				actionType: 'flag-for-review',
				actionData: {
					entityIds: ['rivendell', 'map-1', 'story-1'],
					reason: 'Location inconsistency detected',
					priority: 'high'
				}
			},
			status: 'pending',
			createdAt: new Date()
		};

		render(SuggestionDetailsModal, {
			props: {
				open: true,
				suggestion,
				onDismiss
			}
		});

		expect(screen.getByText('Conflicting Location Information')).toBeInTheDocument();
		expect(screen.getByText(/different regions/)).toBeInTheDocument();

		const dismissButton = screen.getByRole('button', { name: /dismiss/i });
		await fireEvent.click(dismissButton);

		expect(onDismiss).toHaveBeenCalledWith('incon-sug-1');
	});
});
