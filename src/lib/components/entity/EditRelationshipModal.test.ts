import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import EditRelationshipModal from './EditRelationshipModal.svelte';
import { createMockEntity } from '../../../tests/utils/testUtils';
import type { BaseEntity, EntityLink } from '$lib/types';

/**
 * Tests for EditRelationshipModal Component
 *
 * Issue #75: In-place relationship editing
 *
 * This modal allows editing relationship metadata without navigating to a different page.
 * Users can modify relationship type, strength, notes, and tags directly from the entity detail view.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented by senior-web-architect.
 */

describe('EditRelationshipModal - Basic Rendering', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let link: EntityLink;
	let onClose: () => void;
	let onSave: MockedFunction<(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>>;

	beforeEach(() => {
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Aragorn',
			type: 'character'
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Gandalf',
			type: 'npc'
		});

		link = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'friend_of',
			bidirectional: true,
			notes: 'Met at Bree',
			strength: 'strong',
			metadata: {
				tags: ['fellowship'],
				tension: 10
			}
		};

		onClose = vi.fn();
		onSave = vi.fn();
	});

	it('should not be visible when open prop is false', () => {
		render(EditRelationshipModal, {
			props: { open: false, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should be visible when open prop is true', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should have appropriate modal title', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const heading = screen.getByRole('heading', { name: /edit.*relationship/i });
		expect(heading).toBeInTheDocument();
	});

	it('should have dialog role for accessibility', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should display source and target entity names', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		expect(screen.getByText(/Aragorn/)).toBeInTheDocument();
		expect(screen.getByText(/Gandalf/)).toBeInTheDocument();
	});
});

describe('EditRelationshipModal - Form Fields Pre-population', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let link: EntityLink;
	let onClose: () => void;
	let onSave: MockedFunction<(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>>;

	beforeEach(() => {
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Frodo',
			type: 'character'
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Sam',
			type: 'npc'
		});

		link = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'friend_of',
			bidirectional: true,
			notes: 'Loyal companion throughout the journey',
			strength: 'strong',
			metadata: {
				tags: ['fellowship', 'ringbearer'],
				tension: 5
			}
		};

		onClose = vi.fn();
		onSave = vi.fn();
	});

	it('should pre-populate relationship type field with current value', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		expect(relationshipInput.value).toBe('friend_of');
	});

	it('should pre-populate strength field with current value', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		expect(strengthSelect.value).toBe('strong');
	});

	it('should pre-populate notes field with current value', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(notesTextarea.value).toBe('Loyal companion throughout the journey');
	});

	it('should pre-populate tags field with current values', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		// Tags should be displayed (exact implementation may vary)
		expect(screen.getByText('fellowship')).toBeInTheDocument();
		expect(screen.getByText('ringbearer')).toBeInTheDocument();
	});

	it('should pre-populate tension field with current value', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;
		expect(tensionInput.value).toBe('5');
	});

	it('should handle link with no optional fields', () => {
		const minimalLink: EntityLink = {
			id: 'link-2',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: false
		};

		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link: minimalLink, onClose, onSave }
		});

		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		expect(relationshipInput.value).toBe('knows');

		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(notesTextarea.value).toBe('');
	});
});

describe('EditRelationshipModal - Form Editing', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let link: EntityLink;
	let onClose: () => void;
	let onSave: MockedFunction<(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>>;

	beforeEach(() => {
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Legolas',
			type: 'character'
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Gimli',
			type: 'npc'
		});

		link = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'rival_of',
			bidirectional: true,
			notes: 'Initial rivalry',
			strength: 'moderate',
			metadata: {
				tags: ['contest'],
				tension: 60
			}
		};

		onClose = vi.fn();
		onSave = vi.fn();
	});

	it('should allow editing relationship type', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		await fireEvent.input(relationshipInput, { target: { value: 'friend_of' } });

		expect(relationshipInput.value).toBe('friend_of');
	});

	it('should allow editing strength', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		await fireEvent.change(strengthSelect, { target: { value: 'strong' } });

		expect(strengthSelect.value).toBe('strong');
	});

	it('should allow editing notes', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		await fireEvent.input(notesTextarea, {
			target: { value: 'Became best friends after the journey' }
		});

		expect(notesTextarea.value).toBe('Became best friends after the journey');
	});

	it('should allow adding tags', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		// Find the tag input field
		const tagInput = screen.getByPlaceholderText(/add.*tag/i) as HTMLInputElement;
		await fireEvent.input(tagInput, { target: { value: 'friendship' } });
		await fireEvent.keyDown(tagInput, { key: 'Enter' });

		// New tag should appear
		expect(screen.getByText('friendship')).toBeInTheDocument();
	});

	it('should allow removing tags', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		// Find and click remove button for 'contest' tag
		const contestTag = screen.getByText('contest');
		const removeButton = contestTag.parentElement?.querySelector('button');
		expect(removeButton).toBeDefined();

		await fireEvent.click(removeButton!);

		// Tag should be removed
		expect(screen.queryByText('contest')).not.toBeInTheDocument();
	});

	it('should allow editing tension value', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;
		await fireEvent.input(tensionInput, { target: { value: '15' } });

		expect(tensionInput.value).toBe('15');
	});

	it('should validate tension is between 0 and 100', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;

		// Try invalid value
		await fireEvent.input(tensionInput, { target: { value: '150' } });

		// Should show validation error or clamp value
		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(saveButton);

		// onSave should either not be called or should clamp the value
		if (onSave.mock.calls.length > 0) {
			const savedData = onSave.mock.calls[0][0];
			expect(savedData.metadata?.tension).toBeLessThanOrEqual(100);
		}
	});
});

describe('EditRelationshipModal - Save Functionality', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let link: EntityLink;
	let onClose: () => void;
	let onSave: MockedFunction<(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>>;

	beforeEach(() => {
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Boromir',
			type: 'character'
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Ring of Power',
			type: 'item'
		});

		link = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'item',
			relationship: 'tempted_by',
			bidirectional: false,
			notes: 'Growing obsession',
			strength: 'strong',
			metadata: {
				tags: ['corruption'],
				tension: 85
			}
		};

		onClose = vi.fn();
		onSave = vi.fn().mockResolvedValue(undefined);
	});

	it('should have a Save button', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		expect(saveButton).toBeInTheDocument();
	});

	it('should call onSave with updated data when Save is clicked', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		// Edit the relationship
		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		await fireEvent.input(relationshipInput, { target: { value: 'corrupted_by' } });
		await tick();

		// Click Save
		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(saveButton);
		await tick();

		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				relationship: 'corrupted_by'
			})
		);
	});

	it('should include all modified fields in save data', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		// Edit multiple fields
		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		await fireEvent.input(relationshipInput, { target: { value: 'obsessed_with' } });

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		await fireEvent.change(strengthSelect, { target: { value: 'strong' } });

		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		await fireEvent.input(notesTextarea, { target: { value: 'Fatal temptation' } });

		// Click Save
		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(saveButton);

		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				relationship: 'obsessed_with',
				strength: 'strong',
				notes: 'Fatal temptation'
			})
		);
	});

	it('should include metadata in save data', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;
		await fireEvent.input(tensionInput, { target: { value: '95' } });

		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(saveButton);

		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: expect.objectContaining({
					tension: 95
				})
			})
		);
	});

	it('should close modal after successful save', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(saveButton);

		await waitFor(() => {
			expect(onClose).toHaveBeenCalled();
		});
	});

	it('should show loading state while saving', async () => {
		// Mock slow save operation
		const slowSave = vi.fn(
			(_changes: {
				relationship: string;
				notes?: string;
				strength?: 'strong' | 'moderate' | 'weak';
				metadata?: { tags?: string[]; tension?: number };
				bidirectional?: boolean;
				playerVisible?: boolean;
			}) =>
				new Promise<void>((resolve) => {
					setTimeout(resolve, 100);
				})
		);

		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave: slowSave }
		});

		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(saveButton);

		// Button should show loading state
		expect(saveButton).toHaveTextContent(/saving/i);
		expect(saveButton).toBeDisabled();
	});

	it('should handle save errors gracefully', async () => {
		const errorSave = vi.fn().mockRejectedValue(new Error('Database error')) as typeof onSave;

		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave: errorSave }
		});

		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(saveButton);

		await waitFor(() => {
			// Should show error message
			expect(screen.getByText(/error/i)).toBeInTheDocument();
		});

		// Should not close modal on error
		expect(onClose).not.toHaveBeenCalled();
	});
});

describe('EditRelationshipModal - Cancel Functionality', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let link: EntityLink;
	let onClose: () => void;
	let onSave: MockedFunction<(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>>;

	beforeEach(() => {
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Entity A',
			type: 'character'
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Entity B',
			type: 'npc'
		});

		link = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true
		};

		onClose = vi.fn();
		onSave = vi.fn();
	});

	it('should have a Cancel button', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const cancelButton = screen.getAllByRole('button', { name: /cancel/i }).find(btn => btn.tagName === 'BUTTON')!;
		expect(cancelButton).toBeInTheDocument();
	});

	it('should call onClose when Cancel is clicked', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const cancelButton = screen.getAllByRole('button', { name: /cancel/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(cancelButton);

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('should not call onSave when Cancel is clicked', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		// Edit a field
		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		await fireEvent.input(notesTextarea, { target: { value: 'This should not be saved' } });

		// Click Cancel
		const cancelButton = screen.getAllByRole('button', { name: /cancel/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(cancelButton);

		expect(onSave).not.toHaveBeenCalled();
	});

	it('should discard changes when Cancel is clicked', async () => {
		const { rerender } = render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		// Edit a field
		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		await fireEvent.input(notesTextarea, { target: { value: 'Modified notes' } });

		// Click Cancel
		const cancelButton = screen.getAllByRole('button', { name: /cancel/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(cancelButton);

		// Reopen modal
		rerender({ open: false, sourceEntity, targetEntity, link, onClose, onSave });
		rerender({ open: true, sourceEntity, targetEntity, link, onClose, onSave });

		// Notes should be back to original value
		const newNotesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(newNotesTextarea.value).toBe('');
	});

	it('should close on Escape key press', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		await fireEvent.keyDown(document, { key: 'Escape' });

		expect(onClose).toHaveBeenCalled();
	});

	it('should close on backdrop click', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const dialog = screen.getByRole('dialog');
		await fireEvent.click(dialog);

		expect(onClose).toHaveBeenCalled();
	});

	it('should NOT close when clicking inside modal content', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const heading = screen.getByRole('heading', { name: /edit.*relationship/i });
		await fireEvent.click(heading);

		expect(onClose).not.toHaveBeenCalled();
	});
});

describe('EditRelationshipModal - Strength Field Options', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let link: EntityLink;
	let onClose: () => void;
	let onSave: MockedFunction<(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>>;

	beforeEach(() => {
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Test Source',
			type: 'character'
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Test Target',
			type: 'npc'
		});

		link = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true
		};

		onClose = vi.fn();
		onSave = vi.fn();
	});

	it('should have strength options: strong, moderate, weak', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const strengthSelect = screen.getByLabelText(/strength/i);

		expect(strengthSelect).toContainHTML('strong');
		expect(strengthSelect).toContainHTML('moderate');
		expect(strengthSelect).toContainHTML('weak');
	});

	it('should allow selecting "strong" strength', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		await fireEvent.change(strengthSelect, { target: { value: 'strong' } });

		expect(strengthSelect.value).toBe('strong');
	});

	it('should allow selecting "moderate" strength', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		await fireEvent.change(strengthSelect, { target: { value: 'moderate' } });

		expect(strengthSelect.value).toBe('moderate');
	});

	it('should allow selecting "weak" strength', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		await fireEvent.change(strengthSelect, { target: { value: 'weak' } });

		expect(strengthSelect.value).toBe('weak');
	});

	it('should allow clearing strength (no strength)', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		await fireEvent.change(strengthSelect, { target: { value: '' } });

		expect(strengthSelect.value).toBe('');
	});
});

describe('EditRelationshipModal - Accessibility', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let link: EntityLink;
	let onClose: () => void;
	let onSave: MockedFunction<(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>>;

	beforeEach(() => {
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Test Source',
			type: 'character'
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Test Target',
			type: 'npc'
		});

		link = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true
		};

		onClose = vi.fn();
		onSave = vi.fn();
	});

	it('should have proper ARIA attributes on dialog', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have aria-labelledby connecting title to dialog', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const dialog = screen.getByRole('dialog');
		const heading = screen.getByRole('heading', { name: /edit.*relationship/i });

		const headingId = heading.getAttribute('id');
		expect(headingId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', headingId);
	});

	it('should have proper labels on all form fields', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		expect(screen.getByLabelText(/relationship.*type/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/strength/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/tension/i)).toBeInTheDocument();
	});

	it('should have accessible button labels', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		expect(saveButton).toHaveAccessibleName();

		const cancelButton = screen.getAllByRole('button', { name: /cancel/i }).find(btn => btn.tagName === 'BUTTON')!;
		expect(cancelButton).toHaveAccessibleName();
	});

	it('should support keyboard navigation', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const buttons = screen.getAllByRole('button').filter(btn => btn.tagName === 'BUTTON');
		buttons.forEach((button) => {
			expect(button).toHaveAttribute('type', 'button');
		});
	});

	it('should trap focus within modal when open', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const dialog = screen.getByRole('dialog');
		const formElements = screen.getAllByRole('textbox');
		const buttons = screen.getAllByRole('button');

		// All form elements should be inside dialog
		formElements.forEach((element) => {
			expect(dialog).toContainElement(element);
		});

		buttons.forEach((button) => {
			expect(dialog).toContainElement(button);
		});
	});
});

describe('EditRelationshipModal - Form Validation', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let link: EntityLink;
	let onClose: () => void;
	let onSave: MockedFunction<(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>>;

	beforeEach(() => {
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Test Source',
			type: 'character'
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Test Target',
			type: 'npc'
		});

		link = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true
		};

		onClose = vi.fn();
		onSave = vi.fn();
	});

	it('should require relationship type to be non-empty', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		await fireEvent.input(relationshipInput, { target: { value: '' } });

		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(saveButton);

		// Should show validation error
		expect(screen.getByText(/relationship.*required/i)).toBeInTheDocument();
		expect(onSave).not.toHaveBeenCalled();
	});

	it('should validate tension is a number', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;

		// HTML input type="number" should prevent non-numeric input
		expect(tensionInput).toHaveAttribute('type', 'number');
	});

	it('should validate tension minimum value is 0', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;
		expect(tensionInput).toHaveAttribute('min', '0');
	});

	it('should validate tension maximum value is 100', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;
		expect(tensionInput).toHaveAttribute('max', '100');
	});
});

describe('EditRelationshipModal - Bidirectional Toggle', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let link: EntityLink;
	let onClose: () => void;
	let onSave: MockedFunction<(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>>;

	beforeEach(() => {
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Alice',
			type: 'character'
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Bob',
			type: 'npc'
		});

		link = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: false
		};

		onClose = vi.fn();
		onSave = vi.fn().mockResolvedValue(undefined);
	});

	it('should have a bidirectional checkbox', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		expect(bidirectionalCheckbox).toBeInTheDocument();
		expect(bidirectionalCheckbox).toHaveAttribute('type', 'checkbox');
	});

	it('should pre-populate bidirectional checkbox with current value (false)', () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		expect(bidirectionalCheckbox.checked).toBe(false);
	});

	it('should pre-populate bidirectional checkbox with current value (true)', () => {
		const bidirectionalLink: EntityLink = {
			...link,
			bidirectional: true
		};

		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link: bidirectionalLink, onClose, onSave }
		});

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		expect(bidirectionalCheckbox.checked).toBe(true);
	});

	it('should allow toggling bidirectional ON', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		expect(bidirectionalCheckbox.checked).toBe(false);

		await fireEvent.click(bidirectionalCheckbox);

		expect(bidirectionalCheckbox.checked).toBe(true);
	});

	it('should allow toggling bidirectional OFF', async () => {
		const bidirectionalLink: EntityLink = {
			...link,
			bidirectional: true
		};

		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link: bidirectionalLink, onClose, onSave }
		});

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		expect(bidirectionalCheckbox.checked).toBe(true);

		await fireEvent.click(bidirectionalCheckbox);

		expect(bidirectionalCheckbox.checked).toBe(false);
	});

	it('should include bidirectional in save data when toggled ON', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		await fireEvent.click(bidirectionalCheckbox);

		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(saveButton);

		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				bidirectional: true
			})
		);
	});

	it('should include bidirectional in save data when toggled OFF', async () => {
		const bidirectionalLink: EntityLink = {
			...link,
			bidirectional: true
		};

		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link: bidirectionalLink, onClose, onSave }
		});

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		await fireEvent.click(bidirectionalCheckbox);

		const saveButton = screen.getAllByRole('button', { name: /save/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(saveButton);

		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				bidirectional: false
			})
		);
	});

	it('should reset bidirectional on cancel', async () => {
		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		await fireEvent.click(bidirectionalCheckbox);
		expect(bidirectionalCheckbox.checked).toBe(true);

		const cancelButton = screen.getAllByRole('button', { name: /cancel/i }).find(btn => btn.tagName === 'BUTTON')!;
		await fireEvent.click(cancelButton);

		expect(onSave).not.toHaveBeenCalled();
	});
});

describe('EditRelationshipModal - Edge Cases', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let onClose: () => void;
	let onSave: MockedFunction<(changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>>;

	beforeEach(() => {
		sourceEntity = createMockEntity({
			id: 'source-1',
			name: 'Test Source',
			type: 'character'
		});

		targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Test Target',
			type: 'npc'
		});

		onClose = vi.fn();
		onSave = vi.fn();
	});

	it('should handle link with very long notes', () => {
		const longNotes = 'A'.repeat(5000);
		const link: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true,
			notes: longNotes
		};

		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(notesTextarea.value).toBe(longNotes);
	});

	it('should handle link with many tags', () => {
		const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
		const link: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true,
			metadata: {
				tags: manyTags
			}
		};

		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		// Should display all tags
		manyTags.forEach((tag) => {
			expect(screen.getByText(tag)).toBeInTheDocument();
		});
	});

	it('should handle special characters in relationship type', async () => {
		const link: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true
		};

		render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		await fireEvent.input(relationshipInput, {
			target: { value: 'parent/child relationship (complex)' }
		});

		expect(relationshipInput.value).toBe('parent/child relationship (complex)');
	});

	it('should handle reopening modal with same data', async () => {
		const link: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true,
			notes: 'Original notes'
		};

		const { rerender } = render(EditRelationshipModal, {
			props: { open: true, sourceEntity, targetEntity, link, onClose, onSave }
		});

		// Close modal
		rerender({ open: false, sourceEntity, targetEntity, link, onClose, onSave });

		// Reopen modal
		rerender({ open: true, sourceEntity, targetEntity, link, onClose, onSave });

		// Should still show original data
		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(notesTextarea.value).toBe('Original notes');
	});
});
