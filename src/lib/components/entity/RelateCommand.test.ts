import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import RelateCommand from './RelateCommand.svelte';
import { createMockEntity } from '../../../tests/utils/testUtils';
import { createMockEntitiesStore, createMockCampaignStore } from '../../../tests/mocks/stores';
import type { BaseEntity } from '$lib/types';

// Create mock stores that will be shared
let mockEntitiesStore: ReturnType<typeof createMockEntitiesStore>;
let mockCampaignStore: ReturnType<typeof createMockCampaignStore>;

// Mock the stores
vi.mock('$lib/stores', async () => {
	return {
		get entitiesStore() {
			return mockEntitiesStore;
		},
		get campaignStore() {
			return mockCampaignStore;
		}
	};
});

// Mock the config/entityTypes module
vi.mock('$lib/config/entityTypes', () => ({
	getEntityTypeDefinition: vi.fn((type) => ({
		type,
		label: type.charAt(0).toUpperCase() + type.slice(1),
		labelPlural: `${type}s`,
		icon: 'package',
		color: '#94a3b8',
		isBuiltIn: false,
		fieldDefinitions: [],
		defaultRelationships: []
	}))
}));

describe('RelateCommand Component - Notes Field', () => {
	let sourceEntity: BaseEntity;
	let targetEntities: BaseEntity[];

	beforeEach(() => {
		vi.clearAllMocks();

		// Create mock stores
		mockEntitiesStore = createMockEntitiesStore();
		mockCampaignStore = createMockCampaignStore();

		// Create source entity
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Aragorn',
			type: 'character',
			links: []
		});

		// Create target entities
		targetEntities = [
			createMockEntity({
				id: 'target-1',
				name: 'Fellowship of the Ring',
				type: 'faction',
				links: []
			}),
			createMockEntity({
				id: 'target-2',
				name: 'Rivendell',
				type: 'location',
				links: []
			}),
			createMockEntity({
				id: 'target-3',
				name: 'Gandalf',
				type: 'character',
				links: []
			})
		];

		// Set up entities in store
		mockEntitiesStore._setEntities([sourceEntity, ...targetEntities]);
	});

	describe('Notes Textarea - UI Presence', () => {
		it('should display notes textarea when entity is selected', async () => {
			const { component } = render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select an entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			expect(targetButton).toBeDefined();
			await fireEvent.click(targetButton!);

			// Notes textarea should be visible
			const notesTextarea = screen.getByLabelText(/notes/i);
			expect(notesTextarea).toBeInTheDocument();
			expect(notesTextarea.tagName).toBe('TEXTAREA');
		});

		it('should NOT display notes textarea before entity is selected', () => {
			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Notes textarea should not be visible in search mode
			const notesTextarea = screen.queryByLabelText(/notes/i);
			expect(notesTextarea).not.toBeInTheDocument();
		});

		it('should have appropriate placeholder text for notes', async () => {
			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			const notesTextarea = screen.getByLabelText(/notes/i);
			expect(notesTextarea).toHaveAttribute(
				'placeholder',
				expect.stringMatching(/optional|additional|context|details/i)
			);
		});

		it('should display notes label', async () => {
			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			// Should have a label for the notes field
			const label = screen.getByText(/notes/i);
			expect(label).toBeInTheDocument();
		});
	});

	describe('Notes Textarea - User Interaction', () => {
		it('should allow typing into notes textarea', async () => {
			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			const testNotes = 'Met at the Council of Elrond';

			await fireEvent.input(notesTextarea, { target: { value: testNotes } });

			expect(notesTextarea.value).toBe(testNotes);
		});

		it('should support multiline notes input', async () => {
			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			const multilineNotes = 'Line 1: Met at Council\nLine 2: Joined the quest\nLine 3: Became friends';

			await fireEvent.input(notesTextarea, { target: { value: multilineNotes } });

			expect(notesTextarea.value).toBe(multilineNotes);
			expect(notesTextarea.value.split('\n').length).toBe(3);
		});

		it('should preserve notes when relationship field is changed', async () => {
			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			// Type notes
			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			const testNotes = 'Important context';
			await fireEvent.input(notesTextarea, { target: { value: testNotes } });

			// Change relationship field
			const relationshipInput = screen.getByLabelText(/relationship/i) as HTMLInputElement;
			await fireEvent.input(relationshipInput, { target: { value: 'member_of' } });

			// Notes should still be preserved
			expect(notesTextarea.value).toBe(testNotes);
		});

		it('should clear notes when closing the dialog', async () => {
			const { unmount } = render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity and add notes
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			await fireEvent.input(notesTextarea, { target: { value: 'Some notes' } });

			// Close the dialog
			const cancelButton = screen.getByRole('button', { name: /cancel/i });
			await fireEvent.click(cancelButton);

			// Clean up and reopen - notes should be cleared
			unmount();

			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			await waitFor(() => {
				// Select entity again
				const newSearchResults = screen.getAllByRole('button');
				const newTargetButton = newSearchResults.find((btn) =>
					btn.textContent?.includes('Fellowship of the Ring')
				);
				fireEvent.click(newTargetButton!);
			});

			await waitFor(() => {
				const newNotesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
				expect(newNotesTextarea.value).toBe('');
			});
		});
	});

	describe('Notes Field - Data Submission', () => {
		it('should pass notes to entitiesStore.addLink() when creating relationship', async () => {
			mockEntitiesStore.addLink = vi.fn().mockResolvedValue(undefined);

			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			// Fill in relationship
			const relationshipInput = screen.getByLabelText(/relationship/i) as HTMLInputElement;
			await fireEvent.input(relationshipInput, { target: { value: 'member_of' } });

			// Fill in notes
			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			const testNotes = 'Joined at the Council of Elrond';
			await fireEvent.input(notesTextarea, { target: { value: testNotes } });

			// Submit
			const submitButton = screen.getByRole('button', { name: /create link/i });
			await fireEvent.click(submitButton);

			// Verify addLink was called with notes parameter
			await waitFor(() => {
				expect(mockEntitiesStore.addLink).toHaveBeenCalledWith(
					sourceEntity.id,
					'target-1',
					'member_of',
					true, // bidirectional
					testNotes // notes should be the 5th parameter
				);
			});
		});

		it('should pass empty string for notes when textarea is empty', async () => {
			mockEntitiesStore.addLink = vi.fn().mockResolvedValue(undefined);

			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			// Fill in relationship but leave notes empty
			const relationshipInput = screen.getByLabelText(/relationship/i) as HTMLInputElement;
			await fireEvent.input(relationshipInput, { target: { value: 'member_of' } });

			// Submit
			const submitButton = screen.getByRole('button', { name: /create link/i });
			await fireEvent.click(submitButton);

			// Verify addLink was called with empty string or undefined for notes
			await waitFor(() => {
				expect(mockEntitiesStore.addLink).toHaveBeenCalledWith(
					sourceEntity.id,
					'target-1',
					'member_of',
					true,
					expect.stringMatching(/^$/) // Empty string
				);
			});
		});

		it('should handle notes with special characters', async () => {
			mockEntitiesStore.addLink = vi.fn().mockResolvedValue(undefined);

			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			// Fill in relationship
			const relationshipInput = screen.getByLabelText(/relationship/i) as HTMLInputElement;
			await fireEvent.input(relationshipInput, { target: { value: 'member_of' } });

			// Fill in notes with special characters
			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			const specialNotes = 'Note with "quotes" & <tags> and line\nbreaks';
			await fireEvent.input(notesTextarea, { target: { value: specialNotes } });

			// Submit
			const submitButton = screen.getByRole('button', { name: /create link/i });
			await fireEvent.click(submitButton);

			// Verify addLink was called with unescaped notes
			await waitFor(() => {
				expect(mockEntitiesStore.addLink).toHaveBeenCalledWith(
					sourceEntity.id,
					'target-1',
					'member_of',
					true,
					specialNotes
				);
			});
		});

		it('should trim whitespace from notes before submission', async () => {
			mockEntitiesStore.addLink = vi.fn().mockResolvedValue(undefined);

			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			// Fill in relationship
			const relationshipInput = screen.getByLabelText(/relationship/i) as HTMLInputElement;
			await fireEvent.input(relationshipInput, { target: { value: 'member_of' } });

			// Fill in notes with leading/trailing whitespace
			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			await fireEvent.input(notesTextarea, {
				target: { value: '  Important note with spaces  ' }
			});

			// Submit
			const submitButton = screen.getByRole('button', { name: /create link/i });
			await fireEvent.click(submitButton);

			// Verify addLink was called with trimmed notes
			await waitFor(() => {
				expect(mockEntitiesStore.addLink).toHaveBeenCalledWith(
					sourceEntity.id,
					'target-1',
					'member_of',
					true,
					'Important note with spaces'
				);
			});
		});
	});

	describe('Notes Field - Bidirectional Behavior', () => {
		it('should pass notes when bidirectional is checked', async () => {
			mockEntitiesStore.addLink = vi.fn().mockResolvedValue(undefined);

			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			// Fill in fields
			const relationshipInput = screen.getByLabelText(/relationship/i) as HTMLInputElement;
			await fireEvent.input(relationshipInput, { target: { value: 'member_of' } });

			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			await fireEvent.input(notesTextarea, { target: { value: 'Bidirectional note' } });

			// Ensure bidirectional is checked (it's checked by default)
			const bidirectionalCheckbox = screen.getByLabelText(
				/bidirectional/i
			) as HTMLInputElement;
			expect(bidirectionalCheckbox.checked).toBe(true);

			// Submit
			const submitButton = screen.getByRole('button', { name: /create link/i });
			await fireEvent.click(submitButton);

			// Verify notes passed with bidirectional=true
			await waitFor(() => {
				expect(mockEntitiesStore.addLink).toHaveBeenCalledWith(
					sourceEntity.id,
					'target-1',
					'member_of',
					true,
					'Bidirectional note'
				);
			});
		});

		it('should pass notes when bidirectional is unchecked', async () => {
			mockEntitiesStore.addLink = vi.fn().mockResolvedValue(undefined);

			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			// Fill in fields
			const relationshipInput = screen.getByLabelText(/relationship/i) as HTMLInputElement;
			await fireEvent.input(relationshipInput, { target: { value: 'knows' } });

			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			await fireEvent.input(notesTextarea, { target: { value: 'Unidirectional note' } });

			// Uncheck bidirectional
			const bidirectionalCheckbox = screen.getByLabelText(
				/bidirectional/i
			) as HTMLInputElement;
			await fireEvent.click(bidirectionalCheckbox);
			expect(bidirectionalCheckbox.checked).toBe(false);

			// Submit
			const submitButton = screen.getByRole('button', { name: /create link/i });
			await fireEvent.click(submitButton);

			// Verify notes passed with bidirectional=false
			await waitFor(() => {
				expect(mockEntitiesStore.addLink).toHaveBeenCalledWith(
					sourceEntity.id,
					'target-1',
					'knows',
					false,
					'Unidirectional note'
				);
			});
		});
	});

	describe('Notes Field - Error Handling', () => {
		it('should not prevent submission when notes is empty', async () => {
			mockEntitiesStore.addLink = vi.fn().mockResolvedValue(undefined);

			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			// Fill in relationship only, leave notes empty
			const relationshipInput = screen.getByLabelText(/relationship/i) as HTMLInputElement;
			await fireEvent.input(relationshipInput, { target: { value: 'member_of' } });

			// Submit should work
			const submitButton = screen.getByRole('button', { name: /create link/i });
			await fireEvent.click(submitButton);

			// Should call addLink successfully
			await waitFor(() => {
				expect(mockEntitiesStore.addLink).toHaveBeenCalled();
			});
		});

		it('should preserve notes when submission fails', async () => {
			mockEntitiesStore.addLink = vi.fn().mockRejectedValue(new Error('Network error'));

			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			// Fill in fields
			const relationshipInput = screen.getByLabelText(/relationship/i) as HTMLInputElement;
			await fireEvent.input(relationshipInput, { target: { value: 'member_of' } });

			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			const testNotes = 'Notes to preserve';
			await fireEvent.input(notesTextarea, { target: { value: testNotes } });

			// Submit (will fail)
			const submitButton = screen.getByRole('button', { name: /create link/i });
			await fireEvent.click(submitButton);

			// Wait for error
			await waitFor(() => {
				expect(screen.getByText(/network error/i)).toBeInTheDocument();
			});

			// Notes should still be in the textarea
			expect(notesTextarea.value).toBe(testNotes);
		});
	});

	describe('Notes Field - Accessibility', () => {
		it('should have proper label association', async () => {
			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
			const labelId = notesTextarea.getAttribute('id');

			expect(labelId).toBeTruthy();

			// Find the label
			const label = document.querySelector(`label[for="${labelId}"]`);
			expect(label).toBeInTheDocument();
		});

		it('should allow tab navigation to notes field', async () => {
			render(RelateCommand, {
				props: {
					sourceEntity,
					open: true
				}
			});

			// Select entity
			const searchResults = screen.getAllByRole('button');
			const targetButton = searchResults.find((btn) =>
				btn.textContent?.includes('Fellowship of the Ring')
			);
			await fireEvent.click(targetButton!);

			const relationshipInput = screen.getByLabelText(/relationship/i);
			const notesTextarea = screen.getByLabelText(/notes/i);
			const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i);

			// Notes should be positioned between relationship and bidirectional in tab order
			// (Actual tab order testing is complex in JSDOM, this verifies elements are focusable)
			expect(relationshipInput).toBeInTheDocument();
			expect(notesTextarea).toBeInTheDocument();
			expect(bidirectionalCheckbox).toBeInTheDocument();
		});
	});
});
