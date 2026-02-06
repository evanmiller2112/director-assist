/**
 * Tests for CampaignLinkingSettings Component - Issue #48
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests should FAIL until the component is implemented.
 *
 * This component provides UI for the "Enforce Campaign Linking" setting.
 * It should:
 * - Display a toggle for enabling/disabling the setting
 * - Be disabled when no campaigns exist
 * - Show a dropdown for default campaign selection when multiple campaigns exist
 * - Trigger bulk linking modal when enabling with unlinked entities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CampaignLinkingSettings from './CampaignLinkingSettings.svelte';
import {
	createMockCampaignStore,
	createMockEntitiesStore,
	createMockNotificationStore
} from '../../../tests/mocks/stores';

// Use vi.hoisted to make variables available to hoisted vi.mock calls
const { mockCampaignStore, mockEntitiesStore, mockNotificationStore, mockGetEntitiesWithoutCampaignLink, mockBulkLinkToCampaign } = vi.hoisted(() => {
	return {
		mockCampaignStore: { current: null as ReturnType<typeof createMockCampaignStore> | null },
		mockEntitiesStore: { current: null as ReturnType<typeof createMockEntitiesStore> | null },
		mockNotificationStore: { current: null as ReturnType<typeof createMockNotificationStore> | null },
		mockGetEntitiesWithoutCampaignLink: vi.fn(),
		mockBulkLinkToCampaign: vi.fn()
	};
});

// Mock the stores
vi.mock('$lib/stores', () => {
	return {
		get campaignStore() {
			return mockCampaignStore.current;
		},
		get entitiesStore() {
			return mockEntitiesStore.current;
		},
		get notificationStore() {
			return mockNotificationStore.current;
		}
	};
});

// Mock the entity repository
vi.mock('$lib/db/repositories', () => ({
	entityRepository: {
		getEntitiesWithoutCampaignLink: mockGetEntitiesWithoutCampaignLink,
		bulkLinkToCampaign: mockBulkLinkToCampaign
	}
}));

describe('CampaignLinkingSettings Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockCampaignStore.current = createMockCampaignStore();
		mockEntitiesStore.current = createMockEntitiesStore();
		mockNotificationStore.current = createMockNotificationStore();

		// Default: 1 campaign, setting disabled
		mockCampaignStore.current.campaign.metadata = {
			customEntityTypes: [],
			entityTypeOverrides: [],
			settings: {
				customRelationships: [],
				enabledEntityTypes: [],
				enforceCampaignLinking: false
			}
		};

		mockGetEntitiesWithoutCampaignLink.mockResolvedValue([]);
	});

	describe('Component Rendering', () => {
		it('should render the settings section', () => {
			render(CampaignLinkingSettings);

			// Check for the section header specifically
			expect(screen.getByRole('heading', { name: /campaign linking/i })).toBeInTheDocument();
		});

		it('should render a toggle for enforce campaign linking', () => {
			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			expect(toggle).toBeInTheDocument();
		});

		it('should show help text explaining the feature', () => {
			render(CampaignLinkingSettings);

			expect(
				screen.getByText(/automatically link all new entities to campaigns/i)
			).toBeInTheDocument();
		});

		it('should display the toggle in unchecked state by default', () => {
			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			expect(toggle).not.toBeChecked();
		});

		it('should display the toggle in checked state when setting is enabled', () => {
			mockCampaignStore.current!.campaign.metadata.settings.enforceCampaignLinking = true;

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			expect(toggle).toBeChecked();
		});
	});

	describe('No Campaigns Scenario', () => {
		it('should disable the toggle when no campaigns exist', () => {
			mockCampaignStore.current!.allCampaigns = [];
			mockCampaignStore.current!.campaign = null;

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			expect(toggle).toBeDisabled();
		});

		it('should show explanatory text when no campaigns exist', () => {
			mockCampaignStore.current!.allCampaigns = [];
			mockCampaignStore.current!.campaign = null;

			render(CampaignLinkingSettings);

			expect(screen.getByText(/create a campaign first/i)).toBeInTheDocument();
		});
	});

	describe('Single Campaign Scenario', () => {
		it('should enable the toggle when one campaign exists', () => {
			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			expect(toggle).not.toBeDisabled();
		});

		it('should not show default campaign selector for single campaign', () => {
			render(CampaignLinkingSettings);

			const selector = screen.queryByLabelText(/default campaign/i);
			expect(selector).not.toBeInTheDocument();
		});

		it('should call setEnforceCampaignLinking when toggled on', async () => {
			const setEnforceCampaignLinking = vi.fn();
			mockCampaignStore.current!.setEnforceCampaignLinking = setEnforceCampaignLinking;

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			await fireEvent.click(toggle);

			expect(setEnforceCampaignLinking).toHaveBeenCalledWith(
				true,
				mockCampaignStore.current!.campaign.id
			);
		});

		it('should call setEnforceCampaignLinking when toggled off', async () => {
			mockCampaignStore.current!.campaign.metadata.settings.enforceCampaignLinking = true;
			const setEnforceCampaignLinking = vi.fn();
			mockCampaignStore.current!.setEnforceCampaignLinking = setEnforceCampaignLinking;

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			await fireEvent.click(toggle);

			expect(setEnforceCampaignLinking).toHaveBeenCalledWith(false);
		});
	});

	describe('Multiple Campaigns Scenario', () => {
		beforeEach(() => {
			const campaign2 = {
				...mockCampaignStore.current!.campaign,
				id: 'campaign-2',
				name: 'Another Campaign'
			};

			mockCampaignStore.current!.allCampaigns = [mockCampaignStore.current!.campaign, campaign2];
		});

		it('should show default campaign selector when multiple campaigns exist', () => {
			render(CampaignLinkingSettings);

			const selector = screen.getByLabelText(/default campaign/i);
			expect(selector).toBeInTheDocument();
		});

		it('should populate selector with all campaigns', () => {
			render(CampaignLinkingSettings);

			const selector = screen.getByLabelText(/default campaign/i) as HTMLSelectElement;
			const options = Array.from(selector.options).map((opt) => opt.textContent);

			expect(options).toContain('Test Campaign');
			expect(options).toContain('Another Campaign');
		});

		it('should select active campaign by default', () => {
			mockCampaignStore.current!.campaign.metadata.settings.defaultCampaignId = 'campaign-2';

			render(CampaignLinkingSettings);

			const selector = screen.getByLabelText(/default campaign/i) as HTMLSelectElement;
			expect(selector.value).toBe('campaign-2');
		});

		it('should call setDefaultCampaignId when changing selection', async () => {
			const setDefaultCampaignId = vi.fn();
			mockCampaignStore.current!.setDefaultCampaignId = setDefaultCampaignId;

			render(CampaignLinkingSettings);

			const selector = screen.getByLabelText(/default campaign/i) as HTMLSelectElement;
			await fireEvent.change(selector, { target: { value: 'campaign-2' } });

			expect(setDefaultCampaignId).toHaveBeenCalledWith('campaign-2');
		});

		it('should call setEnforceCampaignLinking with selected default campaign', async () => {
			const setEnforceCampaignLinking = vi.fn();
			mockCampaignStore.current!.setEnforceCampaignLinking = setEnforceCampaignLinking;
			mockCampaignStore.current!.campaign.metadata.settings.defaultCampaignId = 'campaign-2';

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			await fireEvent.click(toggle);

			expect(setEnforceCampaignLinking).toHaveBeenCalledWith(true, 'campaign-2');
		});
	});

	describe('Bulk Linking on Enable', () => {
		it('should NOT show modal when toggling on with no unlinked entities', async () => {
			mockGetEntitiesWithoutCampaignLink.mockResolvedValue([]);

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			await fireEvent.click(toggle);

			// Wait for async operations
			await new Promise((resolve) => setTimeout(resolve, 100));

			const modal = screen.queryByRole('dialog');
			expect(modal).not.toBeInTheDocument();
		});

		it('should show bulk linking modal when toggling on with unlinked entities', async () => {
			const unlinkedEntities = [
				{
					id: 'char-1',
					type: 'character',
					name: 'Hero',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				{
					id: 'npc-1',
					type: 'npc',
					name: 'Villain',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			mockGetEntitiesWithoutCampaignLink.mockResolvedValue(unlinkedEntities);

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			await fireEvent.click(toggle);

			// Wait for async operations
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(screen.getByText(/2 entities/i)).toBeInTheDocument();
		});

		it('should revert toggle if user cancels bulk linking modal', async () => {
			const unlinkedEntities = [
				{
					id: 'char-1',
					type: 'character',
					name: 'Hero',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			mockGetEntitiesWithoutCampaignLink.mockResolvedValue(unlinkedEntities);

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			await fireEvent.click(toggle);

			// Wait for modal to appear
			await new Promise((resolve) => setTimeout(resolve, 100));

			const cancelButton = screen.getByRole('button', { name: /cancel/i });
			await fireEvent.click(cancelButton);

			// Toggle should be reverted to unchecked
			expect(toggle).not.toBeChecked();
		});

		it('should keep toggle enabled after user confirms bulk linking', async () => {
			const unlinkedEntities = [
				{
					id: 'char-1',
					type: 'character',
					name: 'Hero',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			mockGetEntitiesWithoutCampaignLink.mockResolvedValue(unlinkedEntities);
			mockBulkLinkToCampaign.mockResolvedValue(1);

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			await fireEvent.click(toggle);

			// Wait for modal to appear
			await new Promise((resolve) => setTimeout(resolve, 100));

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			// Wait for operation to complete (modal has 500ms delay before calling onConfirm)
			await new Promise((resolve) => setTimeout(resolve, 700));

			// Toggle should remain checked
			expect(toggle).toBeChecked();
		});
	});

	describe('Error Handling', () => {
		it('should show error notification if setEnforceCampaignLinking fails', async () => {
			const setEnforceCampaignLinking = vi.fn().mockRejectedValue(new Error('Failed to update'));
			mockCampaignStore.current!.setEnforceCampaignLinking = setEnforceCampaignLinking;

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			await fireEvent.click(toggle);

			// Wait for error handling
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(mockNotificationStore.current!.error).toHaveBeenCalled();
		});

		it('should show error message in modal if bulk linking fails', async () => {
			const unlinkedEntities = [
				{
					id: 'char-1',
					type: 'character',
					name: 'Hero',
					description: '',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			mockGetEntitiesWithoutCampaignLink.mockResolvedValue(unlinkedEntities);
			mockBulkLinkToCampaign.mockRejectedValue(new Error('Bulk link failed'));

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			await fireEvent.click(toggle);

			// Wait for modal
			await new Promise((resolve) => setTimeout(resolve, 100));

			const linkAllButton = screen.getByRole('button', { name: /link all/i });
			await fireEvent.click(linkAllButton);

			// Wait for error handling
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Modal shows inline error message instead of using notification store
			expect(screen.getByText(/failed to link entities/i)).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('should have proper label for toggle', () => {
			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			expect(toggle).toHaveAccessibleName();
		});

		it('should have proper label for default campaign selector', () => {
			const campaign2 = {
				...mockCampaignStore.current!.campaign,
				id: 'campaign-2',
				name: 'Another Campaign'
			};

			mockCampaignStore.current!.allCampaigns = [mockCampaignStore.current!.campaign, campaign2];

			render(CampaignLinkingSettings);

			const selector = screen.getByLabelText(/default campaign/i);
			expect(selector).toHaveAccessibleName();
		});

		it('should have descriptive aria-label for disabled state', () => {
			mockCampaignStore.current!.allCampaigns = [];
			mockCampaignStore.current!.campaign = null;

			render(CampaignLinkingSettings);

			const toggle = screen.getByRole('checkbox', { name: /enforce campaign linking/i });
			expect(toggle).toHaveAttribute('aria-disabled', 'true');
		});
	});

	describe('Dark Mode Text Styling - Issue #306', () => {
		it('should have proper dark mode text classes on the h3 heading', () => {
			const { container } = render(CampaignLinkingSettings);

			const heading = screen.getByRole('heading', { name: /campaign linking/i });

			// Should have both light and dark mode text color classes
			expect(heading).toHaveClass('text-slate-900');
			expect(heading).toHaveClass('dark:text-white');
		});

		it('should use global .label class for enforce campaign linking label', () => {
			const { container } = render(CampaignLinkingSettings);

			// Find the label element for the enforce-campaign-linking checkbox
			const label = container.querySelector('label[for="enforce-campaign-linking"]');
			expect(label).toBeTruthy();

			// Should use the global .label class which includes dark mode styling
			expect(label).toHaveClass('label');
		});

		it('should use global .label class for default campaign label', () => {
			// Setup multiple campaigns to show the default campaign selector
			const campaign2 = {
				...mockCampaignStore.current!.campaign,
				id: 'campaign-2',
				name: 'Another Campaign'
			};

			mockCampaignStore.current!.allCampaigns = [mockCampaignStore.current!.campaign, campaign2];

			const { container } = render(CampaignLinkingSettings);

			// Find the label element for the default-campaign select
			const label = container.querySelector('label[for="default-campaign"]');
			expect(label).toBeTruthy();

			// Should use the global .label class which includes dark mode styling
			expect(label).toHaveClass('label');
		});

		it('should ensure all labels have proper text color in dark mode', () => {
			// Setup multiple campaigns to test all labels
			const campaign2 = {
				...mockCampaignStore.current!.campaign,
				id: 'campaign-2',
				name: 'Another Campaign'
			};

			mockCampaignStore.current!.allCampaigns = [mockCampaignStore.current!.campaign, campaign2];

			const { container } = render(CampaignLinkingSettings);

			// Get all label elements
			const labels = container.querySelectorAll('label');

			// Should have at least 2 labels (enforce and default campaign)
			expect(labels.length).toBeGreaterThanOrEqual(2);

			// All labels should have the .label class for consistent dark mode styling
			labels.forEach((label) => {
				expect(label).toHaveClass('label');
			});
		});
	});
});
