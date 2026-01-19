/**
 * Tests for RelationshipContextSelector Component
 *
 * Issue #62 & #134: Relationship Context UI with Cache Status
 *
 * Main component for selecting which relationships to include in AI generation context.
 * Displays collapsible list of relationships with cache status, selection controls,
 * and token count estimate.
 *
 * These are FAILING tests written following TDD principles (RED phase).
 * They define the expected behavior before implementation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import RelationshipContextSelector from './RelationshipContextSelector.svelte';
import type { BaseEntity, EntityLink } from '$lib/types';
import type { CacheStatus } from '$lib/types/cache';

describe('RelationshipContextSelector Component', () => {
	// Mock source entity
	const mockSourceEntity: BaseEntity = {
		id: 'npc-1',
		type: 'npc',
		name: 'Aldric the Brave',
		description: 'A noble knight',
		summary: 'A brave knight',
		tags: [],
		fields: {},
		links: [
			{
				id: 'link-1',
				sourceId: 'npc-1',
				targetId: 'faction-1',
				targetType: 'faction',
				relationship: 'member_of',
				bidirectional: false
			},
			{
				id: 'link-2',
				sourceId: 'npc-1',
				targetId: 'npc-2',
				targetType: 'npc',
				relationship: 'ally_of',
				bidirectional: true
			},
			{
				id: 'link-3',
				sourceId: 'npc-1',
				targetId: 'location-1',
				targetType: 'location',
				relationship: 'located_in',
				bidirectional: false
			}
		],
		notes: '',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-10'),
		metadata: {}
	};

	// Mock related entities
	const mockFaction: BaseEntity = {
		id: 'faction-1',
		type: 'faction',
		name: 'Order of the Silver Dawn',
		description: 'A religious order',
		summary: 'A holy order',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-10'),
		metadata: {}
	};

	const mockAlly: BaseEntity = {
		id: 'npc-2',
		type: 'npc',
		name: 'Sera the Wise',
		description: 'A wise mage',
		summary: 'A powerful mage',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-10'),
		metadata: {}
	};

	const mockLocation: BaseEntity = {
		id: 'location-1',
		type: 'location',
		name: 'Silverkeep',
		description: 'A fortified city',
		summary: 'The capital city',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-10'),
		metadata: {}
	};

	const mockRelatedEntities = [mockFaction, mockAlly, mockLocation];

	// Mock relationship context data
	const mockRelationshipContext = [
		{
			relationship: mockSourceEntity.links[0],
			targetEntity: mockFaction,
			cacheStatus: 'valid' as CacheStatus,
			summary: 'Aldric is a devoted member of the Order.',
			generatedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
			tokenCount: 42
		},
		{
			relationship: mockSourceEntity.links[1],
			targetEntity: mockAlly,
			cacheStatus: 'stale' as CacheStatus,
			summary: 'Aldric and Sera have fought together.',
			generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
			tokenCount: 38
		},
		{
			relationship: mockSourceEntity.links[2],
			targetEntity: mockLocation,
			cacheStatus: 'missing' as CacheStatus,
			summary: undefined,
			generatedAt: undefined,
			tokenCount: 0
		}
	];

	describe('Basic Rendering', () => {
		it('should render without crashing', () => {
			const { container } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});
			expect(container).toBeInTheDocument();
		});

		it('should render header with "Relationship Context" title', () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			expect(screen.getByText(/relationship context/i)).toBeInTheDocument();
		});

		it('should show relationship count badge', () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			expect(screen.getByText('3')).toBeInTheDocument();
		});

		it('should render collapsed by default', () => {
			const { container } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			// Content should be hidden
			const content = container.querySelector('[data-testid="relationship-list"]');
			expect(content).not.toBeVisible();
		});
	});

	describe('Expand/Collapse Behavior', () => {
		it('should expand when header is clicked', async () => {
			const { container } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const content = container.querySelector('[data-testid="relationship-list"]');
			expect(content).toBeVisible();
		});

		it('should collapse when header is clicked again', async () => {
			const { container } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });

			// Expand
			await fireEvent.click(header);
			let content = container.querySelector('[data-testid="relationship-list"]');
			expect(content).toBeVisible();

			// Collapse
			await fireEvent.click(header);
			content = container.querySelector('[data-testid="relationship-list"]');
			expect(content).not.toBeVisible();
		});

		it('should show chevron icon indicating expand state', () => {
			const { container } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const chevron = container.querySelector('[data-testid="chevron"], svg');
			expect(chevron).toBeInTheDocument();
		});

		it('should rotate chevron when expanded', async () => {
			const { container } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const chevron = screen.getByTestId('chevron');
			expect(chevron).toHaveClass('rotate-180', 'transform');
		});
	});

	describe('Relationship List', () => {
		it('should render all relationships when expanded', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			expect(screen.getByText('Order of the Silver Dawn')).toBeInTheDocument();
			expect(screen.getByText('Sera the Wise')).toBeInTheDocument();
			expect(screen.getByText('Silverkeep')).toBeInTheDocument();
		});

		it('should render RelationshipContextItem components', async () => {
			const { container } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const items = container.querySelectorAll('[data-testid="relationship-item"]');
			expect(items).toHaveLength(3);
		});

		it('should show empty state when no relationships', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: { ...mockSourceEntity, links: [] },
					relationshipContext: []
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			expect(screen.getByText(/no relationships|no related entities/i)).toBeInTheDocument();
		});
	});

	describe('Select All / Select None', () => {
		it('should render "Select All" button when expanded', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
		});

		it('should render "Select None" button when expanded', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			expect(screen.getByRole('button', { name: /select none|deselect all/i })).toBeInTheDocument();
		});

		it('should select all relationships when "Select All" is clicked', async () => {
			const onContextChange = vi.fn();

			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext,
					onContextChange
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const selectAllButton = screen.getByRole('button', { name: /select all/i });
			await fireEvent.click(selectAllButton);

			expect(onContextChange).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ relationship: mockSourceEntity.links[0], included: true }),
					expect.objectContaining({ relationship: mockSourceEntity.links[1], included: true }),
					expect.objectContaining({ relationship: mockSourceEntity.links[2], included: true })
				])
			);
		});

		it('should deselect all relationships when "Select None" is clicked', async () => {
			const onContextChange = vi.fn();

			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext,
					onContextChange
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const selectNoneButton = screen.getByRole('button', { name: /select none|deselect all/i });
			await fireEvent.click(selectNoneButton);

			expect(onContextChange).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ relationship: mockSourceEntity.links[0], included: false }),
					expect.objectContaining({ relationship: mockSourceEntity.links[1], included: false }),
					expect.objectContaining({ relationship: mockSourceEntity.links[2], included: false })
				])
			);
		});
	});

	describe('Individual Checkbox Toggle', () => {
		it('should toggle individual relationship when checkbox is clicked', async () => {
			const onContextChange = vi.fn();

			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx, i) => ({
						...ctx,
						included: i === 0 // Only first one included
					})),
					onContextChange
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const checkboxes = screen.getAllByRole('checkbox');
			await fireEvent.click(checkboxes[1]); // Toggle second relationship

			expect(onContextChange).toHaveBeenCalled();
		});

		it('should update included state when toggled', async () => {
			const onContextChange = vi.fn();

			const { rerender } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx) => ({
						...ctx,
						included: false
					})),
					onContextChange
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const checkboxes = screen.getAllByRole('checkbox');
			expect(checkboxes[0]).not.toBeChecked();

			await fireEvent.click(checkboxes[0]);
			expect(onContextChange).toHaveBeenCalled();

			// Re-render with updated state
			rerender({
				sourceEntity: mockSourceEntity,
				relationshipContext: mockRelationshipContext.map((ctx, i) => ({
					...ctx,
					included: i === 0
				})),
				onContextChange
			});

			const updatedCheckboxes = screen.getAllByRole('checkbox');
			expect(updatedCheckboxes[0]).toBeChecked();
		});
	});

	describe('Token Count Estimate', () => {
		it('should display total token count estimate', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx) => ({
						...ctx,
						included: true
					}))
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			// Total: 42 + 38 + 0 = 80 tokens
			expect(screen.getByText(/80.*tokens?/i)).toBeInTheDocument();
		});

		it('should update token count when selection changes', async () => {
			const onContextChange = vi.fn();

			const { rerender } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx) => ({
						...ctx,
						included: true
					})),
					onContextChange
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			// Initially all selected: 42 + 38 = 80 tokens
			expect(screen.getByText(/Total context.*80/i)).toBeInTheDocument();

			// Deselect one
			const checkboxes = screen.getAllByRole('checkbox');
			await fireEvent.click(checkboxes[1]);

			// Re-render with updated selection
			rerender({
				sourceEntity: mockSourceEntity,
				relationshipContext: mockRelationshipContext.map((ctx, i) => ({
					...ctx,
					included: i !== 1 // Deselect second item
				})),
				onContextChange
			});

			// Now: 42 + 0 = 42 tokens
			expect(screen.getByText(/Total context.*42/i)).toBeInTheDocument();
		});

		it('should only count tokens for included relationships', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx, i) => ({
						...ctx,
						included: i === 0 // Only first one included
					}))
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			// Only first relationship: 42 tokens
			expect(screen.getByText(/Total context.*42/i)).toBeInTheDocument();
			expect(screen.queryByText(/Total context.*80/i)).not.toBeInTheDocument();
		});

		it('should show zero tokens when nothing selected', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx) => ({
						...ctx,
						included: false
					}))
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			expect(screen.getByText(/Total context.*0/i)).toBeInTheDocument();
		});
	});

	describe('Regeneration State', () => {
		it('should show loading state during regeneration', () => {
			const { container } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx, i) => ({
						...ctx,
						regenerating: i === 0 // First one regenerating
					}))
				}
			});

			// Should show loading indicator
			const spinner = container.querySelector('[role="status"], [class*="spin"]');
			expect(spinner).toBeInTheDocument();
		});

		it('should pass regenerating state to RelationshipContextItem', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx, i) => ({
						...ctx,
						regenerating: i === 0,
						included: true
					}))
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			// First item should be in regenerating state
			const buttons = screen.getAllByRole('button', { name: /regenerate/i });
			expect(buttons[0]).toBeDisabled();
		});
	});

	describe('Cache Status Summary', () => {
		it('should show summary of cache statuses', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			// Should show counts like "1 valid, 1 stale, 1 missing"
			expect(screen.getByText(/1.*valid/i)).toBeInTheDocument();
			expect(screen.getByText(/1.*stale/i)).toBeInTheDocument();
			expect(screen.getByText(/1.*missing/i)).toBeInTheDocument();
		});

		it('should update cache status summary when statuses change', async () => {
			const { rerender } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			expect(screen.getByText(/1.*valid/i)).toBeInTheDocument();

			// All become valid
			rerender({
				sourceEntity: mockSourceEntity,
				relationshipContext: mockRelationshipContext.map((ctx) => ({
					...ctx,
					cacheStatus: 'valid' as CacheStatus,
					summary: 'Updated summary',
					generatedAt: new Date()
				}))
			});

			expect(screen.getByText(/3.*valid/i)).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have accessible expand/collapse button', () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const button = screen.getByRole('button', { name: /relationship context/i });
			expect(button).toHaveAttribute('aria-expanded', 'false');
		});

		it('should update aria-expanded when toggled', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const button = screen.getByRole('button', { name: /relationship context/i });
			expect(button).toHaveAttribute('aria-expanded', 'false');

			await fireEvent.click(button);
			expect(button).toHaveAttribute('aria-expanded', 'true');
		});

		it('should have accessible region for content', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const region = screen.getByRole('region', { name: /relationship context/i });
			expect(region).toBeInTheDocument();
		});
	});

	describe('Context Change Callback', () => {
		it('should call onContextChange with updated context', async () => {
			const onContextChange = vi.fn();

			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx) => ({
						...ctx,
						included: false
					})),
					onContextChange
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const selectAllButton = screen.getByRole('button', { name: /select all/i });
			await fireEvent.click(selectAllButton);

			expect(onContextChange).toHaveBeenCalled();
			const call = onContextChange.mock.calls[0][0];
			expect(call).toHaveLength(3);
			expect(call.every((ctx: any) => ctx.included)).toBe(true);
		});

		it('should include all context data in callback', async () => {
			const onContextChange = vi.fn();

			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx) => ({
						...ctx,
						included: false
					})),
					onContextChange
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const checkboxes = screen.getAllByRole('checkbox');
			await fireEvent.click(checkboxes[0]);

			expect(onContextChange).toHaveBeenCalled();
			const call = onContextChange.mock.calls[0][0];
			expect(call[0]).toMatchObject({
				relationship: expect.any(Object),
				targetEntity: expect.any(Object),
				cacheStatus: expect.any(String),
				included: expect.any(Boolean)
			});
		});
	});

	describe('Integration Scenarios', () => {
		it('should handle complete workflow with all features', async () => {
			const onContextChange = vi.fn();

			render(RelationshipContextSelector, {
				props: {
					sourceEntity: mockSourceEntity,
					relationshipContext: mockRelationshipContext.map((ctx) => ({
						...ctx,
						included: false
					})),
					onContextChange
				}
			});

			// Start collapsed
			let content = screen.queryByTestId('relationship-list');
			expect(content).not.toBeVisible();

			// Expand
			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);
			expect(screen.getByTestId('relationship-list')).toBeVisible();

			// Check all items rendered
			expect(screen.getByText('Order of the Silver Dawn')).toBeInTheDocument();
			expect(screen.getByText('Sera the Wise')).toBeInTheDocument();
			expect(screen.getByText('Silverkeep')).toBeInTheDocument();

			// Select all
			const selectAllButton = screen.getByRole('button', { name: /select all/i });
			await fireEvent.click(selectAllButton);
			expect(onContextChange).toHaveBeenCalled();

			// Token count should be displayed
			expect(screen.getByText(/Total context/i)).toBeInTheDocument();

			// Cache status summary (status dots)
			expect(screen.getByText(/1 valid/i)).toBeInTheDocument();
			expect(screen.getByText(/1 stale/i)).toBeInTheDocument();
		});

		it('should handle empty relationships list', async () => {
			render(RelationshipContextSelector, {
				props: {
					sourceEntity: { ...mockSourceEntity, links: [] },
					relationshipContext: []
				}
			});

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			expect(screen.getByText(/no relationships|no related entities/i)).toBeInTheDocument();
			expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
		});

		it('should handle single relationship', async () => {
			const singleContext = [mockRelationshipContext[0]];
			const singleEntity = {
				...mockSourceEntity,
				links: [mockSourceEntity.links[0]]
			};

			render(RelationshipContextSelector, {
				props: {
					sourceEntity: singleEntity,
					relationshipContext: singleContext
				}
			});

			expect(screen.getByText('1')).toBeInTheDocument();

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			const checkboxes = screen.getAllByRole('checkbox');
			expect(checkboxes).toHaveLength(1);
		});
	});

	describe('Performance', () => {
		it('should handle many relationships efficiently', async () => {
			// Create 50 relationships
			const manyLinks: EntityLink[] = Array.from({ length: 50 }, (_, i) => ({
				id: `link-${i}`,
				sourceId: 'npc-1',
				targetId: `entity-${i}`,
				targetType: 'npc',
				relationship: 'knows',
				bidirectional: false
			}));

			const manyContext = manyLinks.map((link, i) => ({
				relationship: link,
				targetEntity: {
					...mockAlly,
					id: `entity-${i}`,
					name: `Entity ${i}`
				},
				cacheStatus: 'valid' as CacheStatus,
				summary: `Summary ${i}`,
				generatedAt: new Date(),
				tokenCount: 40,
				included: false
			}));

			const { container } = render(RelationshipContextSelector, {
				props: {
					sourceEntity: { ...mockSourceEntity, links: manyLinks },
					relationshipContext: manyContext
				}
			});

			expect(screen.getByText('50')).toBeInTheDocument();

			const header = screen.getByRole('button', { name: /relationship context/i });
			await fireEvent.click(header);

			// Should render all items
			const items = container.querySelectorAll('[data-testid="relationship-item"]');
			expect(items).toHaveLength(50);
		});
	});
});
