/**
 * Tests for SaveEntityButton Component (TDD RED Phase - Phase A3)
 *
 * This component renders a button to save a ParsedEntity to the database.
 * Shows entity type icon, name, and handles save operation.
 *
 * These tests should FAIL initially as the component doesn't exist yet.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SaveEntityButton from './SaveEntityButton.svelte';
import type { ParsedEntity } from '$lib/services/entityParserService';
import type { BaseEntity } from '$lib/types';

describe('SaveEntityButton Component', () => {
	const mockParsedEntity: ParsedEntity = {
		entityType: 'npc',
		confidence: 0.8,
		name: 'Captain Aldric',
		description: 'A stern guard captain',
		tags: ['guard'],
		fields: {
			role: 'Guard Captain'
		},
		validationErrors: {}
	};

	const mockSavedEntity: BaseEntity = {
		id: 'test-123',
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

	describe('Rendering', () => {
		it('should render with entity type icon and label', () => {
			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave: vi.fn()
				}
			});

			// Should show save button
			const saveButton = screen.getByRole('button', { name: /save/i });
			expect(saveButton).toBeInTheDocument();
		});

		it('should display entity name', () => {
			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave: vi.fn()
				}
			});

			expect(screen.getByText('Captain Aldric')).toBeInTheDocument();
		});

		it('should display entity type icon for NPC', () => {
			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave: vi.fn()
				}
			});

			// Icon should be present (implementation uses lucide-svelte User icon for NPC)
			const button = screen.getByRole('button', { name: /save/i });
			expect(button).toBeInTheDocument();
		});

		it('should display entity type icon for Location', () => {
			const locationEntity: ParsedEntity = {
				...mockParsedEntity,
				entityType: 'location',
				name: 'The Rusty Anchor'
			};

			render(SaveEntityButton, {
				props: {
					entity: locationEntity,
					onSave: vi.fn()
				}
			});

			expect(screen.getByText('The Rusty Anchor')).toBeInTheDocument();
		});

		it('should display entity type icon for Faction', () => {
			const factionEntity: ParsedEntity = {
				...mockParsedEntity,
				entityType: 'faction',
				name: 'Merchant Guild'
			};

			render(SaveEntityButton, {
				props: {
					entity: factionEntity,
					onSave: vi.fn()
				}
			});

			expect(screen.getByText('Merchant Guild')).toBeInTheDocument();
		});
	});

	describe('Disabled State', () => {
		it('should be disabled when entity has validation errors', () => {
			const invalidEntity: ParsedEntity = {
				...mockParsedEntity,
				validationErrors: {
					role: 'Role is required'
				}
			};

			render(SaveEntityButton, {
				props: {
					entity: invalidEntity,
					onSave: vi.fn()
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			expect(saveButton).toBeDisabled();
		});

		it('should not be disabled when entity has no validation errors', () => {
			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave: vi.fn()
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			expect(saveButton).not.toBeDisabled();
		});

		it('should show tooltip when disabled due to validation errors', () => {
			const invalidEntity: ParsedEntity = {
				...mockParsedEntity,
				validationErrors: {
					role: 'Role is required'
				}
			};

			render(SaveEntityButton, {
				props: {
					entity: invalidEntity,
					onSave: vi.fn()
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			expect(saveButton).toHaveAttribute('title');
		});
	});

	describe('Loading State', () => {
		it('should show loading state when saving', async () => {
			const onSave = vi.fn().mockImplementation(() => {
				return new Promise(() => {}); // Never resolves to keep loading
			});

			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			// Button should be disabled during save
			expect(saveButton).toBeDisabled();
		});

		it('should show loading indicator when saving', async () => {
			const onSave = vi.fn().mockImplementation(() => {
				return new Promise(() => {}); // Never resolves
			});

			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			// Should show loading text or spinner
			expect(screen.getByText(/saving/i)).toBeInTheDocument();
		});
	});

	describe('Save Functionality', () => {
		it('should call onSave function when clicked', async () => {
			const onSave = vi.fn().mockResolvedValue({
				success: true,
				entity: mockSavedEntity
			});

			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			expect(onSave).toHaveBeenCalledWith(mockParsedEntity);
		});

		it('should call onSaved callback with saved entity on success', async () => {
			const onSave = vi.fn().mockResolvedValue({
				success: true,
				entity: mockSavedEntity
			});
			const onSaved = vi.fn();

			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave,
					onSaved
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			// Wait for async operation
			await new Promise(resolve => setTimeout(resolve, 0));

			expect(onSaved).toHaveBeenCalledWith(mockSavedEntity);
		});

		it('should not call onSaved when save fails', async () => {
			const onSave = vi.fn().mockResolvedValue({
				success: false,
				error: 'Save failed'
			});
			const onSaved = vi.fn();

			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave,
					onSaved
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			await new Promise(resolve => setTimeout(resolve, 0));

			expect(onSaved).not.toHaveBeenCalled();
		});

		it('should show error message when save fails', async () => {
			const onSave = vi.fn().mockResolvedValue({
				success: false,
				error: 'Database error'
			});

			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			await new Promise(resolve => setTimeout(resolve, 0));

			expect(screen.getByText(/error/i)).toBeInTheDocument();
		});

		it('should reset to normal state after successful save', async () => {
			const onSave = vi.fn().mockResolvedValue({
				success: true,
				entity: mockSavedEntity
			});

			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			await fireEvent.click(saveButton);

			await new Promise(resolve => setTimeout(resolve, 0));

			// Button should be re-enabled after save
			expect(saveButton).not.toBeDisabled();
		});
	});

	describe('Edge Cases', () => {
		it('should handle entity with no name gracefully', () => {
			const entityWithoutName: ParsedEntity = {
				...mockParsedEntity,
				name: ''
			};

			render(SaveEntityButton, {
				props: {
					entity: entityWithoutName,
					onSave: vi.fn()
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });
			expect(saveButton).toBeInTheDocument();
		});

		it('should handle very long entity names', () => {
			const longNameEntity: ParsedEntity = {
				...mockParsedEntity,
				name: 'A'.repeat(100)
			};

			render(SaveEntityButton, {
				props: {
					entity: longNameEntity,
					onSave: vi.fn()
				}
			});

			// Should render without error
			const saveButton = screen.getByRole('button', { name: /save/i });
			expect(saveButton).toBeInTheDocument();
		});

		it('should prevent multiple simultaneous save operations', async () => {
			const onSave = vi.fn().mockImplementation(() => {
				return new Promise(resolve => {
					setTimeout(() => resolve({ success: true, entity: mockSavedEntity }), 100);
				});
			});

			render(SaveEntityButton, {
				props: {
					entity: mockParsedEntity,
					onSave
				}
			});

			const saveButton = screen.getByRole('button', { name: /save/i });

			// Click twice quickly
			await fireEvent.click(saveButton);
			await fireEvent.click(saveButton);

			// Should only be called once
			expect(onSave).toHaveBeenCalledTimes(1);
		});
	});
});
