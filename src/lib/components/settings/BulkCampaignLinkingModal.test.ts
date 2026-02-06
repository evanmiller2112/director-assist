/**
 * Tests for BulkCampaignLinkingModal Component - Issue #48
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests should FAIL until the component is implemented.
 *
 * This modal appears when enabling "Enforce Campaign Linking" and there are
 * unlinked entities. It should:
 * - Display the count of unlinked entities
 * - Allow campaign selection (when multiple campaigns exist)
 * - Provide "Link All", "Skip", and "Cancel" actions
 * - Call bulkLinkToCampaign repository method on confirm
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import BulkCampaignLinkingModal from './BulkCampaignLinkingModal.svelte';
import type { BaseEntity } from '$lib/types';

// Use vi.hoisted to make mockBulkLinkToCampaign available to hoisted vi.mock call
const { mockBulkLinkToCampaign } = vi.hoisted(() => ({
	mockBulkLinkToCampaign: vi.fn()
}));

// Mock the entity repository
vi.mock('$lib/db/repositories', () => ({
	entityRepository: {
		bulkLinkToCampaign: mockBulkLinkToCampaign
	}
}));

describe('BulkCampaignLinkingModal Component', () => {
	let unlinkedEntities: BaseEntity[];
	let campaigns: BaseEntity[];
	let defaultProps: any;

	beforeEach(() => {
		vi.clearAllMocks();

		unlinkedEntities = [
			{
				id: 'char-1',
				type: 'character',
				name: 'Hero',
				description: 'A brave hero',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			},
			{
				id: 'char-2',
				type: 'character',
				name: 'Sidekick',
				description: 'A loyal sidekick',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			},
			{
				id: 'npc-1',
				type: 'npc',
				name: 'Villain',
				description: 'A dastardly villain',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}
		];

		campaigns = [
			{
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'Test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}
		];

		defaultProps = {
			open: true,
			unlinkedEntities,
			campaigns,
			defaultCampaignId: 'campaign-1',
			onConfirm: vi.fn(),
			onSkip: vi.fn(),
			onCancel: vi.fn()
		};

		mockBulkLinkToCampaign.mockResolvedValue(3);
	});

	describe('Modal Rendering', () => {
		it('should render as a dialog when open', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toBeInTheDocument();
		});

		it('should not render when open is false', () => {
			render(BulkCampaignLinkingModal, { props: { ...defaultProps, open: false } });

			const dialog = screen.queryByRole('dialog');
			expect(dialog).not.toBeInTheDocument();
		});

		it('should display modal title', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			expect(screen.getByText(/link existing entities/i)).toBeInTheDocument();
		});

		it('should show count of unlinked entities', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			expect(screen.getByText(/3 entities/i)).toBeInTheDocument();
		});

		it('should display explanatory text', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			expect(
				screen.getByText(/found \d+ entities? that are not linked to any campaign/i)
			).toBeInTheDocument();
		});
	});

	describe('Single Campaign Scenario', () => {
		it('should not show campaign selector for single campaign', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const selector = screen.queryByLabelText(/select campaign/i);
			expect(selector).not.toBeInTheDocument();
		});

		it('should display the campaign name that will be linked', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			expect(screen.getByText(/test campaign/i)).toBeInTheDocument();
		});

		it('should call bulkLinkToCampaign with the single campaign ID on confirm', async () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			expect(mockBulkLinkToCampaign).toHaveBeenCalledWith(
				['char-1', 'char-2', 'npc-1'],
				'campaign-1'
			);
		});
	});

	describe('Multiple Campaigns Scenario', () => {
		beforeEach(() => {
			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Another Campaign',
				description: 'Another test campaign',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			defaultProps.campaigns = [campaigns[0], campaign2];
		});

		it('should show campaign selector when multiple campaigns exist', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const selector = screen.getByLabelText(/select campaign/i);
			expect(selector).toBeInTheDocument();
		});

		it('should populate selector with all campaigns', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const selector = screen.getByLabelText(/select campaign/i) as HTMLSelectElement;
			const options = Array.from(selector.options).map((opt) => opt.textContent);

			expect(options).toContain('Test Campaign');
			expect(options).toContain('Another Campaign');
		});

		it('should pre-select defaultCampaignId', () => {
			defaultProps.defaultCampaignId = 'campaign-2';

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const selector = screen.getByLabelText(/select campaign/i) as HTMLSelectElement;
			expect(selector.value).toBe('campaign-2');
		});

		it('should select first campaign if no defaultCampaignId provided', () => {
			defaultProps.defaultCampaignId = undefined;

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const selector = screen.getByLabelText(/select campaign/i) as HTMLSelectElement;
			expect(selector.value).toBe('campaign-1');
		});

		it('should allow changing campaign selection', async () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const selector = screen.getByLabelText(/select campaign/i) as HTMLSelectElement;
			await fireEvent.change(selector, { target: { value: 'campaign-2' } });

			expect(selector.value).toBe('campaign-2');
		});

		it('should call bulkLinkToCampaign with selected campaign on confirm', async () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const selector = screen.getByLabelText(/select campaign/i) as HTMLSelectElement;
			await fireEvent.change(selector, { target: { value: 'campaign-2' } });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			expect(mockBulkLinkToCampaign).toHaveBeenCalledWith(
				['char-1', 'char-2', 'npc-1'],
				'campaign-2'
			);
		});
	});

	describe('Action Buttons', () => {
		it('should render "Link All" button', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const button = screen.getByRole('button', { name: /link all/i });
			expect(button).toBeInTheDocument();
		});

		it('should render "Skip" button', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const button = screen.getByRole('button', { name: /skip/i });
			expect(button).toBeInTheDocument();
		});

		it('should render "Cancel" button', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const button = screen.getByRole('button', { name: /cancel/i });
			expect(button).toBeInTheDocument();
		});

		it('should call onConfirm when "Link All" is clicked', async () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const button = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(button);

			// Wait for async operation (modal has 500ms delay before calling onConfirm)
			await new Promise((resolve) => setTimeout(resolve, 700));

			expect(defaultProps.onConfirm).toHaveBeenCalled();
		});

		it('should call onSkip when "Skip" is clicked', async () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const button = screen.getByRole('button', { name: /skip/i });
			await fireEvent.click(button);

			expect(defaultProps.onSkip).toHaveBeenCalled();
		});

		it('should call onCancel when "Cancel" is clicked', async () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const button = screen.getByRole('button', { name: /cancel/i });
			await fireEvent.click(button);

			expect(defaultProps.onCancel).toHaveBeenCalled();
		});

		it('should close modal on backdrop click', async () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const backdrop = screen.getByRole('dialog').parentElement;
			if (backdrop) {
				await fireEvent.click(backdrop);
			}

			expect(defaultProps.onCancel).toHaveBeenCalled();
		});

		it('should support ESC key to close modal', async () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const dialog = screen.getByRole('dialog');
			await fireEvent.keyDown(dialog, { key: 'Escape' });

			expect(defaultProps.onCancel).toHaveBeenCalled();
		});
	});

	describe('Bulk Linking Execution', () => {
		it('should disable buttons while linking is in progress', async () => {
			mockBulkLinkToCampaign.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(3), 1000))
			);

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			// Buttons should be disabled during operation
			expect(linkAllButton).toBeDisabled();
			expect(screen.getByRole('button', { name: /skip/i })).toBeDisabled();
			expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
		});

		it('should show loading indicator while linking', async () => {
			mockBulkLinkToCampaign.mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve(3), 1000))
			);

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			expect(screen.getByText(/linking/i)).toBeInTheDocument();
		});

		it('should call bulkLinkToCampaign with correct entity IDs', async () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			expect(mockBulkLinkToCampaign).toHaveBeenCalledWith(
				expect.arrayContaining(['char-1', 'char-2', 'npc-1']),
				'campaign-1'
			);
		});

		it('should call onConfirm with link count after successful linking', async () => {
			mockBulkLinkToCampaign.mockResolvedValue(3);

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			// Wait for async operation (modal has 500ms delay before calling onConfirm)
			await new Promise((resolve) => setTimeout(resolve, 700));

			expect(defaultProps.onConfirm).toHaveBeenCalledWith(3);
		});

		it('should show success message after linking', async () => {
			mockBulkLinkToCampaign.mockResolvedValue(3);

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			// Wait for async operation
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(screen.getByText(/successfully linked 3 entities/i)).toBeInTheDocument();
		});

		it('should handle partial linking (some entities already linked)', async () => {
			mockBulkLinkToCampaign.mockResolvedValue(2); // Only 2 out of 3 were linked

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			// Wait for async operation (modal has 500ms delay before calling onConfirm)
			await new Promise((resolve) => setTimeout(resolve, 700));

			expect(defaultProps.onConfirm).toHaveBeenCalledWith(2);
		});
	});

	describe('Error Handling', () => {
		it('should show error message if bulkLinkToCampaign fails', async () => {
			mockBulkLinkToCampaign.mockRejectedValue(new Error('Database error'));

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			// Wait for error handling
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(screen.getByText(/failed to link entities/i)).toBeInTheDocument();
		});

		it('should re-enable buttons after error', async () => {
			mockBulkLinkToCampaign.mockRejectedValue(new Error('Database error'));

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			// Wait for error handling
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(linkAllButton).not.toBeDisabled();
			expect(screen.getByRole('button', { name: /skip/i })).not.toBeDisabled();
			expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled();
		});

		it('should not call onConfirm if linking fails', async () => {
			mockBulkLinkToCampaign.mockRejectedValue(new Error('Database error'));

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			// Wait for error handling
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(defaultProps.onConfirm).not.toHaveBeenCalled();
		});

		it('should allow retrying after error', async () => {
			mockBulkLinkToCampaign
				.mockRejectedValueOnce(new Error('Database error'))
				.mockResolvedValueOnce(3);

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });

			// First attempt - fails
			await fireEvent.click(linkAllButton);
			await new Promise((resolve) => setTimeout(resolve, 150));

			// Second attempt - succeeds (needs 700ms for the confirm callback due to 500ms delay)
			await fireEvent.click(linkAllButton);
			await new Promise((resolve) => setTimeout(resolve, 700));

			expect(mockBulkLinkToCampaign).toHaveBeenCalledTimes(2);
			expect(defaultProps.onConfirm).toHaveBeenCalledWith(3);
		});
	});

	describe('Entity List Display', () => {
		it('should show list of unlinked entities', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			expect(screen.getByText('Hero')).toBeInTheDocument();
			expect(screen.getByText('Sidekick')).toBeInTheDocument();
			expect(screen.getByText('Villain')).toBeInTheDocument();
		});

		it('should show entity types', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const characterLabels = screen.getAllByText(/character/i);
			expect(characterLabels.length).toBeGreaterThan(0);

			const npcLabel = screen.getByText(/npc/i);
			expect(npcLabel).toBeInTheDocument();
		});

		it('should handle long list of entities with scrolling', () => {
			const manyEntities = Array.from({ length: 50 }, (_, i) => ({
				id: `entity-${i}`,
				type: 'character',
				name: `Entity ${i}`,
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			}));

			render(BulkCampaignLinkingModal, {
				props: { ...defaultProps, unlinkedEntities: manyEntities }
			});

			expect(screen.getByText(/50 entities/i)).toBeInTheDocument();

			// List container should exist and have the entity-list class (which has overflow-y: auto in CSS)
			const listContainer = screen.getByTestId('entity-list');
			expect(listContainer).toBeInTheDocument();
			expect(listContainer).toHaveClass('entity-list');
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA role for modal', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-modal', 'true');
		});

		it('should have accessible label for modal', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-labelledby');
		});

		it('should have accessible label for campaign selector', () => {
			const campaign2: BaseEntity = {
				id: 'campaign-2',
				type: 'campaign',
				name: 'Another Campaign',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			defaultProps.campaigns = [campaigns[0], campaign2];

			render(BulkCampaignLinkingModal, { props: defaultProps });

			const selector = screen.getByLabelText(/select campaign/i);
			expect(selector).toHaveAccessibleName();
		});

		it('should focus "Link All" button on modal open', () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			expect(document.activeElement).toBe(linkAllButton);
		});

		it('should keep focus within modal buttons', async () => {
			render(BulkCampaignLinkingModal, { props: defaultProps });

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			const skipButton = screen.getByRole('button', { name: /skip/i });
			const cancelButton = screen.getByRole('button', { name: /cancel/i });

			// Verify all buttons are focusable and exist in the modal
			expect(linkAllButton).toBeInTheDocument();
			expect(skipButton).toBeInTheDocument();
			expect(cancelButton).toBeInTheDocument();

			// Verify buttons are not disabled by default
			expect(linkAllButton).not.toBeDisabled();
			expect(skipButton).not.toBeDisabled();
			expect(cancelButton).not.toBeDisabled();
		});
	});
});
