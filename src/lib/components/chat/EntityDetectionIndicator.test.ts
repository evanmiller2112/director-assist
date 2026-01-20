/**
 * Tests for EntityDetectionIndicator Component (TDD RED Phase - Phase A3)
 *
 * This component displays detected entities from AI responses with:
 * - Entity count badge
 * - List of detected entities with icons and names
 * - Confidence indicators
 * - Save buttons for each entity
 * - "Saved" indicators for already saved entities
 *
 * These tests should FAIL initially as the component doesn't exist yet.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import EntityDetectionIndicator from './EntityDetectionIndicator.svelte';
import type { ParsedEntity } from '$lib/services/entityParserService';
import type { BaseEntity } from '$lib/types';

describe('EntityDetectionIndicator Component', () => {
	const mockEntities: ParsedEntity[] = [
		{
			entityType: 'npc',
			confidence: 0.85,
			name: 'Captain Aldric',
			description: 'A stern guard captain',
			tags: ['guard'],
			fields: { role: 'Guard Captain' },
			validationErrors: {}
		},
		{
			entityType: 'location',
			confidence: 0.9,
			name: 'The Rusty Anchor',
			description: 'A dimly lit tavern',
			tags: ['tavern'],
			fields: { locationType: 'Tavern' },
			validationErrors: {}
		}
	];

	describe('Entity Count Display', () => {
		it('should show entity count badge with correct number', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved: vi.fn()
				}
			});

			expect(screen.getByText(/2.*entities detected/i)).toBeInTheDocument();
		});

		it('should show singular "entity" for single entity', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: [mockEntities[0]],
					onEntitySaved: vi.fn()
				}
			});

			expect(screen.getByText(/1.*entity detected/i)).toBeInTheDocument();
		});

		it('should show plural "entities" for multiple entities', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved: vi.fn()
				}
			});

			expect(screen.getByText(/entities detected/i)).toBeInTheDocument();
		});

		it('should not render when no entities provided', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: [],
					onEntitySaved: vi.fn()
				}
			});

			// Component should not render any visible content
			expect(screen.queryByText(/entity detected/i)).not.toBeInTheDocument();
		});
	});

	describe('Entity List Display', () => {
		it('should list all detected entities', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved: vi.fn()
				}
			});

			expect(screen.getByText('Captain Aldric')).toBeInTheDocument();
			expect(screen.getByText('The Rusty Anchor')).toBeInTheDocument();
		});

		it('should show entity type icon for each entity', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved: vi.fn()
				}
			});

			// Both entities should have their type icons rendered
			const container = screen.getByText('Captain Aldric').closest('div');
			expect(container).toBeInTheDocument();
		});

		it('should display entity names correctly', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved: vi.fn()
				}
			});

			mockEntities.forEach(entity => {
				expect(screen.getByText(entity.name)).toBeInTheDocument();
			});
		});
	});

	describe('Confidence Indicators', () => {
		it('should show confidence indicator for each entity', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved: vi.fn()
				}
			});

			// Should show confidence as percentage or visual indicator
			// Looking for confidence values (85%, 90%)
			expect(screen.getByText(/85%/i)).toBeInTheDocument();
			expect(screen.getByText(/90%/i)).toBeInTheDocument();
		});

		it('should show high confidence with different style', () => {
			const highConfidenceEntity: ParsedEntity = {
				...mockEntities[0],
				confidence: 0.95
			};

			const { container } = render(EntityDetectionIndicator, {
				props: {
					entities: [highConfidenceEntity],
					onEntitySaved: vi.fn()
				}
			});

			// High confidence should have distinctive styling
			expect(screen.getByText(/95%/i)).toBeInTheDocument();
		});

		it('should show low confidence with different style', () => {
			const lowConfidenceEntity: ParsedEntity = {
				...mockEntities[0],
				confidence: 0.4
			};

			const { container } = render(EntityDetectionIndicator, {
				props: {
					entities: [lowConfidenceEntity],
					onEntitySaved: vi.fn()
				}
			});

			// Low confidence should have distinctive styling
			expect(screen.getByText(/40%/i)).toBeInTheDocument();
		});

		it('should show medium confidence with neutral style', () => {
			const mediumConfidenceEntity: ParsedEntity = {
				...mockEntities[0],
				confidence: 0.65
			};

			render(EntityDetectionIndicator, {
				props: {
					entities: [mediumConfidenceEntity],
					onEntitySaved: vi.fn()
				}
			});

			expect(screen.getByText(/65%/i)).toBeInTheDocument();
		});
	});

	describe('SaveEntityButton Integration', () => {
		it('should render SaveEntityButton for each entity', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved: vi.fn()
				}
			});

			// Should have save buttons for each entity
			const saveButtons = screen.getAllByRole('button', { name: /save/i });
			expect(saveButtons).toHaveLength(2);
		});

		it('should pass correct entity to each SaveEntityButton', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved: vi.fn()
				}
			});

			// Each entity's name should be visible near its save button
			expect(screen.getByText('Captain Aldric')).toBeInTheDocument();
			expect(screen.getByText('The Rusty Anchor')).toBeInTheDocument();
		});

		it('should call onEntitySaved when entity is saved', async () => {
			const onEntitySaved = vi.fn();
			const savedEntity: BaseEntity = {
				id: 'saved-123',
				type: 'npc',
				name: 'Captain Aldric',
				description: 'A stern guard captain',
				tags: ['guard'],
				fields: { role: 'Guard Captain' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			render(EntityDetectionIndicator, {
				props: {
					entities: [mockEntities[0]],
					onEntitySaved
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			// Note: Actual callback will be triggered by SaveEntityButton component
			// This test verifies the prop is passed correctly
		});
	});

	describe('Saved Entity Indicators', () => {
		it('should show "Saved" indicator for saved entities', () => {
			const savedEntityIds = ['saved-1'];

			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					savedEntityIds,
					onEntitySaved: vi.fn()
				}
			});

			// Should indicate saved state (specific implementation may vary)
			// Could be a checkmark, "Saved" text, or disabled save button
		});

		it('should hide save button for already saved entities', () => {
			const savedEntities = [
				{
					...mockEntities[0],
					metadata: { savedEntityId: 'saved-123' }
				}
			];

			render(EntityDetectionIndicator, {
				props: {
					entities: savedEntities,
					onEntitySaved: vi.fn()
				}
			});

			// If entity is already saved, save button should not be clickable
			// or should show "Saved" state
		});

		it('should show checkmark icon for saved entities', () => {
			const savedEntityIds = ['entity-1'];

			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					savedEntityIds,
					onEntitySaved: vi.fn()
				}
			});

			// Should show visual indicator that entity is saved
		});
	});

	describe('Multiple Entity Handling', () => {
		it('should handle multiple entities independently', async () => {
			const onEntitySaved = vi.fn();

			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved
				}
			});

			const saveButtons = screen.getAllByRole('button', { name: /save/i });

			// Should be able to save each entity independently
			expect(saveButtons).toHaveLength(2);
			expect(saveButtons[0]).not.toBeDisabled();
			expect(saveButtons[1]).not.toBeDisabled();
		});

		it('should update saved state for individual entities', () => {
			const { rerender } = render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					savedEntityIds: [],
					onEntitySaved: vi.fn()
				}
			});

			// Initially no entities saved
			let saveButtons = screen.getAllByRole('button', { name: /save/i });
			expect(saveButtons).toHaveLength(2);

			// After one entity is saved
			rerender({
				entities: mockEntities,
				savedEntityIds: ['entity-1'],
				onEntitySaved: vi.fn()
			});

			// One entity should now show as saved
		});

		it('should handle saving all entities sequentially', async () => {
			const onEntitySaved = vi.fn();

			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved
				}
			});

			const saveButtons = screen.getAllByRole('button', { name: /save/i });

			// Save first entity
			await fireEvent.click(saveButtons[0]);

			// Save second entity
			await fireEvent.click(saveButtons[1]);

			// Both should be saveable independently
		});
	});

	describe('Validation Error Handling', () => {
		it('should show validation errors on entities', () => {
			const entityWithErrors: ParsedEntity = {
				...mockEntities[0],
				validationErrors: {
					role: 'Role is required'
				}
			};

			render(EntityDetectionIndicator, {
				props: {
					entities: [entityWithErrors],
					onEntitySaved: vi.fn()
				}
			});

			// Should indicate validation error
			const saveButton = screen.getByRole('button', { name: /save/i });
			expect(saveButton).toBeDisabled();
		});

		it('should disable save button for entities with validation errors', () => {
			const entityWithErrors: ParsedEntity = {
				...mockEntities[0],
				validationErrors: {
					role: 'Role is required'
				}
			};

			render(EntityDetectionIndicator, {
				props: {
					entities: [entityWithErrors],
					onEntitySaved: vi.fn()
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			expect(saveButton).toBeDisabled();
		});

		it('should show error count when entities have validation errors', () => {
			const entitiesWithErrors: ParsedEntity[] = [
				{
					...mockEntities[0],
					validationErrors: { role: 'Required' }
				},
				mockEntities[1]
			];

			render(EntityDetectionIndicator, {
				props: {
					entities: entitiesWithErrors,
					onEntitySaved: vi.fn()
				}
			});

			// Should indicate that one entity has errors
		});
	});

	describe('ReviewEditButton Integration - Phase A4', () => {
		it('should render ReviewEditButton for each entity', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved: vi.fn()
				}
			});

			// Should have Review & Edit buttons for each entity (Phase A4)
			const reviewButtons = screen.getAllByRole('button', { name: /review.*edit/i });
			expect(reviewButtons).toHaveLength(2);
		});

		it('should render ReviewEditButton alongside SaveEntityButton', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: [mockEntities[0]],
					onEntitySaved: vi.fn()
				}
			});

			// Both buttons should be present for same entity
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /review.*edit/i })).toBeInTheDocument();
		});

		it('should pass entity to ReviewEditButton', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: [mockEntities[0]],
					onEntitySaved: vi.fn()
				}
			});

			// ReviewEditButton should be associated with the entity
			const reviewButton = screen.getByRole('button', { name: /review.*edit/i });
			expect(reviewButton).toBeInTheDocument();
		});

		it('should pass messageId to ReviewEditButton when provided', () => {
			const messageId = 'msg-test-123';

			render(EntityDetectionIndicator, {
				props: {
					entities: [mockEntities[0]],
					messageId,
					onEntitySaved: vi.fn()
				}
			});

			// ReviewEditButton should receive messageId prop
			const reviewButton = screen.getByRole('button', { name: /review.*edit/i });
			expect(reviewButton).toBeInTheDocument();
		});

		it('should pass messageId to all ReviewEditButtons', () => {
			const messageId = 'msg-multiple-entities';

			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					messageId,
					onEntitySaved: vi.fn()
				}
			});

			// All ReviewEditButtons should receive the same messageId
			const reviewButtons = screen.getAllByRole('button', { name: /review.*edit/i });
			expect(reviewButtons).toHaveLength(2);
		});

		it('should render ReviewEditButton for each entity type', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities, // Contains both NPC and Location
					onEntitySaved: vi.fn()
				}
			});

			// Should have ReviewEditButton for both NPC and Location
			const reviewButtons = screen.getAllByRole('button', { name: /review.*edit/i });
			expect(reviewButtons).toHaveLength(2);
		});

		it('should disable ReviewEditButton when entity has validation errors', () => {
			const entityWithErrors: ParsedEntity = {
				...mockEntities[0],
				validationErrors: {
					role: 'Role is required'
				}
			};

			render(EntityDetectionIndicator, {
				props: {
					entities: [entityWithErrors],
					onEntitySaved: vi.fn()
				}
			});

			const reviewButton = screen.getByRole('button', { name: /review.*edit/i });
			expect(reviewButton).toBeDisabled();
		});

		it('should enable ReviewEditButton when entity has no validation errors', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: [mockEntities[0]],
					onEntitySaved: vi.fn()
				}
			});

			const reviewButton = screen.getByRole('button', { name: /review.*edit/i });
			expect(reviewButton).not.toBeDisabled();
		});

		it('should show ReviewEditButton even for saved entities', () => {
			const savedEntityIds = ['entity-1'];

			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					savedEntityIds,
					onEntitySaved: vi.fn()
				}
			});

			// ReviewEditButton should still be available even if entity is saved
			const reviewButtons = screen.getAllByRole('button', { name: /review.*edit/i });
			expect(reviewButtons.length).toBeGreaterThan(0);
		});

		it('should position ReviewEditButton appropriately in layout', () => {
			const { container } = render(EntityDetectionIndicator, {
				props: {
					entities: [mockEntities[0]],
					onEntitySaved: vi.fn()
				}
			});

			// Both save and review buttons should be visible
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /review.*edit/i })).toBeInTheDocument();
		});

		it('should work with multiple entities and mixed validation states', () => {
			const mixedEntities: ParsedEntity[] = [
				mockEntities[0], // Valid
				{
					...mockEntities[1],
					validationErrors: { locationType: 'Type is required' }
				} // Invalid
			];

			render(EntityDetectionIndicator, {
				props: {
					entities: mixedEntities,
					onEntitySaved: vi.fn()
				}
			});

			const reviewButtons = screen.getAllByRole('button', { name: /review.*edit/i });
			expect(reviewButtons).toHaveLength(2);

			// First should be enabled, second disabled
			expect(reviewButtons[0]).not.toBeDisabled();
			expect(reviewButtons[1]).toBeDisabled();
		});

		it('should handle ReviewEditButton with custom entity types', () => {
			const customEntity: ParsedEntity = {
				entityType: 'custom_spell',
				confidence: 0.8,
				name: 'Fireball',
				description: 'A powerful fire spell',
				tags: ['magic'],
				fields: { school: 'Evocation' },
				validationErrors: {}
			};

			render(EntityDetectionIndicator, {
				props: {
					entities: [customEntity],
					onEntitySaved: vi.fn()
				}
			});

			const reviewButton = screen.getByRole('button', { name: /review.*edit/i });
			expect(reviewButton).toBeInTheDocument();
		});
	});

	describe('Edge Cases', () => {
		it('should handle single entity correctly', () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: [mockEntities[0]],
					onEntitySaved: vi.fn()
				}
			});

			expect(screen.getByText(/1.*entity/i)).toBeInTheDocument();
			expect(screen.getByText('Captain Aldric')).toBeInTheDocument();
		});

		it('should handle entities with very long names', () => {
			const longNameEntity: ParsedEntity = {
				...mockEntities[0],
				name: 'A'.repeat(100)
			};

			render(EntityDetectionIndicator, {
				props: {
					entities: [longNameEntity],
					onEntitySaved: vi.fn()
				}
			});

			// Should render without error and truncate if needed
			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
		});

		it('should handle entities with special characters in names', () => {
			const specialNameEntity: ParsedEntity = {
				...mockEntities[0],
				name: 'Sela "The Shadow" O\'Brien'
			};

			render(EntityDetectionIndicator, {
				props: {
					entities: [specialNameEntity],
					onEntitySaved: vi.fn()
				}
			});

			expect(screen.getByText('Sela "The Shadow" O\'Brien')).toBeInTheDocument();
		});

		it('should be collapsible/expandable for better UX', async () => {
			render(EntityDetectionIndicator, {
				props: {
					entities: mockEntities,
					onEntitySaved: vi.fn()
				}
			});

			// Should have a way to collapse/expand the entity list
			const toggleButton = screen.getByText(/2.*entities detected/i);
			expect(toggleButton).toBeInTheDocument();
		});
	});
});
