/**
 * Tests for EditRelationshipModal Component - Reactivity Issues
 *
 * Issue #327: Fix Svelte 5 reactivity warnings
 *
 * This test file verifies that the EditRelationshipModal component properly reacts to prop changes.
 * The component has the following reactivity issues:
 * - Lines 24-31: Multiple `link` prop references captured at initial value in $state()
 *   - relationship, strength, notes, tension, tags, bidirectional, playerVisible
 *
 * The problem: When the link prop changes (e.g., user selects a different relationship to edit),
 * the component's state does not update because $state() captures the prop value only at
 * initialization time.
 *
 * While there is an $effect() on lines 37-48 that tries to reset form state when link changes,
 * the initial state capture is still incorrect and causes Svelte 5 warnings.
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * reactivity issues are fixed by senior-web-architect.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import EditRelationshipModal from './EditRelationshipModal.svelte';
import type { BaseEntity, EntityLink } from '$lib/types';
import { createMockEntity } from '../../../tests/utils/testUtils';

describe('EditRelationshipModal - Reactivity: Link Prop Changes', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let onClose: () => void;
	let onSave: (changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>;

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

		onClose = vi.fn();
		onSave = vi.fn().mockResolvedValue(undefined) as (changes: {
			relationship: string;
			notes?: string;
			strength?: 'strong' | 'moderate' | 'weak';
			metadata?: { tags?: string[]; tension?: number };
			bidirectional?: boolean;
			playerVisible?: boolean;
		}) => Promise<void>;
	});

	it('should initially populate form with link prop values', () => {
		const link: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'friend_of',
			bidirectional: true,
			notes: 'Fellow travelers',
			strength: 'strong',
			metadata: {
				tags: ['fellowship'],
				tension: 20
			}
		};

		render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link,
				onClose,
				onSave
			}
		});

		// Verify initial population
		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		expect(relationshipInput.value).toBe('friend_of');

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		expect(strengthSelect.value).toBe('strong');

		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(notesTextarea.value).toBe('Fellow travelers');

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;
		expect(tensionInput.value).toBe('20');

		expect(screen.getByText('fellowship')).toBeInTheDocument();

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		expect(bidirectionalCheckbox.checked).toBe(true);
	});

	it('should update form when link prop changes to a different relationship', async () => {
		const link1: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'friend_of',
			bidirectional: true,
			notes: 'Old friends',
			strength: 'strong',
			metadata: {
				tags: ['friendship'],
				tension: 10
			}
		};

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: link1,
				onClose,
				onSave
			}
		});

		// Verify initial state
		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		expect(relationshipInput.value).toBe('friend_of');

		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(notesTextarea.value).toBe('Old friends');

		// User selects a different relationship to edit
		const link2: EntityLink = {
			id: 'link-2',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'mentor_of',
			bidirectional: false,
			notes: 'Teaches the way',
			strength: 'moderate',
			metadata: {
				tags: ['teacher', 'guide'],
				tension: 5
			}
		};

		await rerender({
			open: true,
			sourceEntity,
			targetEntity,
			link: link2,
			onClose,
			onSave
		});

		// Form should update to new link's values
		expect(relationshipInput.value).toBe('mentor_of');
		expect(notesTextarea.value).toBe('Teaches the way');

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		expect(strengthSelect.value).toBe('moderate');

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;
		expect(tensionInput.value).toBe('5');

		expect(screen.getByText('teacher')).toBeInTheDocument();
		expect(screen.getByText('guide')).toBeInTheDocument();

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		expect(bidirectionalCheckbox.checked).toBe(false);
	});

	it('should clear optional fields when link changes to minimal link', async () => {
		const fullLink: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'ally_of',
			bidirectional: true,
			notes: 'Fighting together',
			strength: 'strong',
			metadata: {
				tags: ['war', 'alliance'],
				tension: 30
			},
			playerVisible: false
		};

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: fullLink,
				onClose,
				onSave
			}
		});

		// Verify full data is present
		expect(screen.getByText('war')).toBeInTheDocument();
		expect(screen.getByText('alliance')).toBeInTheDocument();

		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(notesTextarea.value).toBe('Fighting together');

		// Change to minimal link
		const minimalLink: EntityLink = {
			id: 'link-2',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: false
		};

		await rerender({
			open: true,
			sourceEntity,
			targetEntity,
			link: minimalLink,
			onClose,
			onSave
		});

		// Optional fields should be cleared
		expect(notesTextarea.value).toBe('');

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		expect(strengthSelect.value).toBe('');

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;
		expect(tensionInput.value).toBe('0');

		expect(screen.queryByText('war')).not.toBeInTheDocument();
		expect(screen.queryByText('alliance')).not.toBeInTheDocument();

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		expect(bidirectionalCheckbox.checked).toBe(false);
	});

	it('should update tags when link prop changes', async () => {
		const link1: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'friend_of',
			bidirectional: true,
			metadata: {
				tags: ['old_tag', 'another_tag']
			}
		};

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: link1,
				onClose,
				onSave
			}
		});

		expect(screen.getByText('old_tag')).toBeInTheDocument();
		expect(screen.getByText('another_tag')).toBeInTheDocument();

		// Change link with different tags
		const link2: EntityLink = {
			id: 'link-2',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'friend_of',
			bidirectional: true,
			metadata: {
				tags: ['new_tag', 'different_tag']
			}
		};

		await rerender({
			open: true,
			sourceEntity,
			targetEntity,
			link: link2,
			onClose,
			onSave
		});

		// Old tags should be gone
		expect(screen.queryByText('old_tag')).not.toBeInTheDocument();
		expect(screen.queryByText('another_tag')).not.toBeInTheDocument();

		// New tags should appear
		expect(screen.getByText('new_tag')).toBeInTheDocument();
		expect(screen.getByText('different_tag')).toBeInTheDocument();
	});

	it('should update tension value when link changes', async () => {
		const link1: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'rival_of',
			bidirectional: true,
			metadata: {
				tension: 75
			}
		};

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: link1,
				onClose,
				onSave
			}
		});

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;
		expect(tensionInput.value).toBe('75');

		// Change to link with different tension
		const link2: EntityLink = {
			id: 'link-2',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'rival_of',
			bidirectional: true,
			metadata: {
				tension: 25
			}
		};

		await rerender({
			open: true,
			sourceEntity,
			targetEntity,
			link: link2,
			onClose,
			onSave
		});

		expect(tensionInput.value).toBe('25');
	});

	it('should update playerVisible when link changes', async () => {
		const link1: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'secret_ally',
			bidirectional: true,
			playerVisible: false
		};

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: link1,
				onClose,
				onSave
			}
		});

		const visibilityCheckbox = screen.getByLabelText(/hide from players/i) as HTMLInputElement;
		expect(visibilityCheckbox.checked).toBe(true); // Checked means hidden

		// Change to link that is player visible
		const link2: EntityLink = {
			id: 'link-2',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'public_ally',
			bidirectional: true,
			playerVisible: undefined // visible by default
		};

		await rerender({
			open: true,
			sourceEntity,
			targetEntity,
			link: link2,
			onClose,
			onSave
		});

		expect(visibilityCheckbox.checked).toBe(false); // Not hidden
	});
});

describe('EditRelationshipModal - Reactivity: Link Changes After User Edits', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let onClose: () => void;
	let onSave: (changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>;

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

		onClose = vi.fn();
		onSave = vi.fn().mockResolvedValue(undefined) as (changes: {
			relationship: string;
			notes?: string;
			strength?: 'strong' | 'moderate' | 'weak';
			metadata?: { tags?: string[]; tension?: number };
			bidirectional?: boolean;
			playerVisible?: boolean;
		}) => Promise<void>;
	});

	it('should discard user edits when link prop changes to a different link', async () => {
		const link1: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'friend_of',
			bidirectional: true,
			notes: 'Original notes'
		};

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: link1,
				onClose,
				onSave
			}
		});

		// User makes edits
		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		await fireEvent.input(notesTextarea, {
			target: { value: 'User modified notes' }
		});

		expect(notesTextarea.value).toBe('User modified notes');

		// Link changes (user selects different relationship to edit)
		const link2: EntityLink = {
			id: 'link-2',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'companion_of',
			bidirectional: true,
			notes: 'Different link notes'
		};

		await rerender({
			open: true,
			sourceEntity,
			targetEntity,
			link: link2,
			onClose,
			onSave
		});

		// Form should reset to new link's values, discarding user edits
		expect(notesTextarea.value).toBe('Different link notes');
	});

	it('should reset form when same link ID but different values (data refreshed)', async () => {
		const link1: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'trusts',
			bidirectional: true,
			strength: 'moderate'
		};

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: link1,
				onClose,
				onSave
			}
		});

		const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
		expect(strengthSelect.value).toBe('moderate');

		// Same link ID but updated data (e.g., another user updated it)
		const link1Updated: EntityLink = {
			id: 'link-1', // Same ID
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'deeply_trusts',
			bidirectional: true,
			strength: 'strong'
		};

		await rerender({
			open: true,
			sourceEntity,
			targetEntity,
			link: link1Updated,
			onClose,
			onSave
		});

		// Form should update to reflect refreshed data
		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		expect(relationshipInput.value).toBe('deeply_trusts');
		expect(strengthSelect.value).toBe('strong');
	});

	it('should handle link changes while modal is closed then reopened', async () => {
		const link1: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'follows',
			bidirectional: false,
			notes: 'Link 1 notes'
		};

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: link1,
				onClose,
				onSave
			}
		});

		const notesTextarea = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(notesTextarea.value).toBe('Link 1 notes');

		// Close modal
		await rerender({
			open: false,
			sourceEntity,
			targetEntity,
			link: link1,
			onClose,
			onSave
		});

		// Change link while closed
		const link2: EntityLink = {
			id: 'link-2',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'leads',
			bidirectional: false,
			notes: 'Link 2 notes'
		};

		// Reopen modal with new link
		await rerender({
			open: true,
			sourceEntity,
			targetEntity,
			link: link2,
			onClose,
			onSave
		});

		// Should show new link's data (re-query elements since modal was reopened)
		const notesTextarea2 = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(notesTextarea2.value).toBe('Link 2 notes');

		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		expect(relationshipInput.value).toBe('leads');
	});
});

describe('EditRelationshipModal - Reactivity: Edge Cases', () => {
	let sourceEntity: BaseEntity;
	let targetEntity: BaseEntity;
	let onClose: () => void;
	let onSave: (changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>;

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
		onSave = vi.fn().mockResolvedValue(undefined) as (changes: {
			relationship: string;
			notes?: string;
			strength?: 'strong' | 'moderate' | 'weak';
			metadata?: { tags?: string[]; tension?: number };
			bidirectional?: boolean;
			playerVisible?: boolean;
		}) => Promise<void>;
	});

	it('should handle rapid link prop changes', async () => {
		const links: EntityLink[] = [
			{
				id: 'link-1',
				sourceId: 'source-1',
				targetId: 'target-1',
				targetType: 'npc',
				relationship: 'rel_1',
				bidirectional: true
			},
			{
				id: 'link-2',
				sourceId: 'source-1',
				targetId: 'target-1',
				targetType: 'npc',
				relationship: 'rel_2',
				bidirectional: false
			},
			{
				id: 'link-3',
				sourceId: 'source-1',
				targetId: 'target-1',
				targetType: 'npc',
				relationship: 'rel_3',
				bidirectional: true
			}
		];

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: links[0],
				onClose,
				onSave
			}
		});

		// Rapidly change links
		for (const link of links) {
			await rerender({
				open: true,
				sourceEntity,
				targetEntity,
				link,
				onClose,
				onSave
			});
		}

		// Should end up with last link's data
		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		expect(relationshipInput.value).toBe('rel_3');

		const bidirectionalCheckbox = screen.getByLabelText(/bidirectional/i) as HTMLInputElement;
		expect(bidirectionalCheckbox.checked).toBe(true);
	});

	it('should handle link with empty/null metadata fields', async () => {
		const link1: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true,
			metadata: {
				tags: ['tag1', 'tag2'],
				tension: 50
			}
		};

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: link1,
				onClose,
				onSave
			}
		});

		expect(screen.getByText('tag1')).toBeInTheDocument();

		// Change to link with no metadata
		const link2: EntityLink = {
			id: 'link-2',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true
		};

		await rerender({
			open: true,
			sourceEntity,
			targetEntity,
			link: link2,
			onClose,
			onSave
		});

		// Tags should be cleared
		expect(screen.queryByText('tag1')).not.toBeInTheDocument();
		expect(screen.queryByText('tag2')).not.toBeInTheDocument();

		const tensionInput = screen.getByLabelText(/tension/i) as HTMLInputElement;
		expect(tensionInput.value).toBe('0');
	});

	it('should handle link changes with various strength values', async () => {
		const strengths: Array<'strong' | 'moderate' | 'weak' | undefined> = [
			'strong',
			'moderate',
			'weak',
			undefined
		];

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: {
					id: 'link-1',
					sourceId: 'source-1',
					targetId: 'target-1',
					targetType: 'npc',
					relationship: 'test',
					bidirectional: true,
					strength: strengths[0]
				},
				onClose,
				onSave
			}
		});

		for (let i = 0; i < strengths.length; i++) {
			await rerender({
				open: true,
				sourceEntity,
				targetEntity,
				link: {
					id: `link-${i}`,
					sourceId: 'source-1',
					targetId: 'target-1',
					targetType: 'npc',
					relationship: 'test',
					bidirectional: true,
					strength: strengths[i]
				},
				onClose,
				onSave
			});

			const strengthSelect = screen.getByLabelText(/strength/i) as HTMLSelectElement;
			expect(strengthSelect.value).toBe(strengths[i] || '');
		}
	});

	it('should maintain error state when link changes', async () => {
		const link1: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'test',
			bidirectional: true
		};

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity,
				targetEntity,
				link: link1,
				onClose,
				onSave
			}
		});

		// Clear relationship to trigger validation error
		const relationshipInput = screen.getByLabelText(/relationship.*type/i) as HTMLInputElement;
		await fireEvent.input(relationshipInput, { target: { value: '' } });

		// Try to save
		const saveButton = screen.getByRole('button', { name: /save/i });
		await fireEvent.click(saveButton);

		// Should show error
		expect(screen.getByText(/relationship.*required/i)).toBeInTheDocument();

		// Change link
		const link2: EntityLink = {
			id: 'link-2',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'valid_relationship',
			bidirectional: false
		};

		await rerender({
			open: true,
			sourceEntity,
			targetEntity,
			link: link2,
			onClose,
			onSave
		});

		// Error should be cleared with new link
		expect(screen.queryByText(/relationship.*required/i)).not.toBeInTheDocument();
		expect(relationshipInput.value).toBe('valid_relationship');
	});
});

describe('EditRelationshipModal - Reactivity: Source/Target Entity Changes', () => {
	let onClose: () => void;
	let onSave: (changes: {
		relationship: string;
		notes?: string;
		strength?: 'strong' | 'moderate' | 'weak';
		metadata?: { tags?: string[]; tension?: number };
		bidirectional?: boolean;
		playerVisible?: boolean;
	}) => Promise<void>;

	beforeEach(() => {
		onClose = vi.fn();
		onSave = vi.fn().mockResolvedValue(undefined) as (changes: {
			relationship: string;
			notes?: string;
			strength?: 'strong' | 'moderate' | 'weak';
			metadata?: { tags?: string[]; tension?: number };
			bidirectional?: boolean;
			playerVisible?: boolean;
		}) => Promise<void>;
	});

	it('should update displayed entity names when sourceEntity prop changes', async () => {
		const link: EntityLink = {
			id: 'link-1',
			sourceId: 'source-1',
			targetId: 'target-1',
			targetType: 'npc',
			relationship: 'knows',
			bidirectional: true
		};

		const sourceEntity1 = createMockEntity({
			id: 'source-1',
			name: 'Original Source',
			type: 'character'
		});

		const targetEntity = createMockEntity({
			id: 'target-1',
			name: 'Target Entity',
			type: 'npc'
		});

		const { rerender } = render(EditRelationshipModal, {
			props: {
				open: true,
				sourceEntity: sourceEntity1,
				targetEntity,
				link,
				onClose,
				onSave
			}
		});

		expect(screen.getByText('Original Source')).toBeInTheDocument();

		// Change source entity
		const sourceEntity2 = createMockEntity({
			id: 'source-1',
			name: 'Updated Source',
			type: 'character'
		});

		await rerender({
			open: true,
			sourceEntity: sourceEntity2,
			targetEntity,
			link,
			onClose,
			onSave
		});

		expect(screen.getByText('Updated Source')).toBeInTheDocument();
		expect(screen.queryByText('Original Source')).not.toBeInTheDocument();
	});
});
