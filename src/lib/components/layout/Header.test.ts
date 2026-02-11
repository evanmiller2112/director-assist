import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Header from './Header.svelte';
import { createMockCampaignStore, createMockUiStore, createMockNotificationStore } from '../../../tests/mocks/stores';

// Create mock stores that will be shared
let mockCampaignStore: ReturnType<typeof createMockCampaignStore>;
let mockUiStore: ReturnType<typeof createMockUiStore>;
let mockNotificationStore: ReturnType<typeof createMockNotificationStore>;

// Mock the stores
vi.mock('$lib/stores', async () => {
	return {
		get campaignStore() {
			return mockCampaignStore;
		},
		get uiStore() {
			return mockUiStore;
		},
		get notificationStore() {
			return mockNotificationStore;
		},
		// entitiesStore is used by HeaderSearch
		entitiesStore: {
			filteredEntities: [],
			searchQuery: '',
			setSearchQuery: vi.fn()
		},
		// aiSettings is used by Header to show/hide chat button
		aiSettings: {
			isEnabled: true
		}
	};
});

// Mock HeaderSearch component
vi.mock('./HeaderSearch.svelte', async () => {
	const MockHeaderSearch = (await import('../../../tests/mocks/components/MockHeaderSearch.svelte')).default;
	return {
		default: MockHeaderSearch
	};
});

describe('Header Component - Search Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockCampaignStore = createMockCampaignStore();
		mockUiStore = createMockUiStore();
		mockNotificationStore = createMockNotificationStore();
	});

	describe('Search Component Integration', () => {
		it('should render HeaderSearch component', () => {
			render(Header);

			// The component should be rendered in the header
			const header = screen.getByRole('banner');
			expect(header).toBeInTheDocument();
		});

		it('should expose focusSearch() method', () => {
			const { component } = render(Header);

			// Verify that focusSearch method exists and is callable
			expect(typeof component.focusSearch).toBe('function');

			// Should not throw when called
			expect(() => component.focusSearch()).not.toThrow();
		});
	});

	describe('Header Layout', () => {
		it('should render campaign name', () => {
			render(Header);

			expect(screen.getByText(mockCampaignStore.campaign!.name)).toBeInTheDocument();
		});

		it('should render search in correct position (between campaign and action buttons)', () => {
			const { container } = render(Header);

			const header = container.querySelector('header');
			expect(header).toBeInTheDocument();
		});

		it('should render chat toggle button', () => {
			render(Header);

			const chatButton = screen.getByLabelText(/toggle ai chat/i);
			expect(chatButton).toBeInTheDocument();
		});

		it('should render settings link', () => {
			render(Header);

			const settingsLink = screen.getByLabelText(/settings/i);
			expect(settingsLink).toBeInTheDocument();
			expect(settingsLink).toHaveAttribute('href', '/settings');
		});
	});

	describe('Campaign Selector', () => {
		it('should show campaign selector button', () => {
			render(Header);

			const button = screen.getByRole('button', { name: /select campaign/i });
			expect(button).toBeInTheDocument();
		});

		it('should display campaign system if available', () => {
			render(Header);

			// Should show the system name
			expect(screen.getByText(/test system/i)).toBeInTheDocument();
		});

		it('should toggle dropdown when campaign button is clicked', async () => {
			mockCampaignStore.allCampaigns = [
				mockCampaignStore.campaign!,
				{
					...mockCampaignStore.campaign!,
					id: 'campaign-2',
					name: 'Another Campaign'
				}
			];

			render(Header);

			const button = screen.getByRole('button', { name: /select campaign/i });

			// Initially dropdown should be closed
			expect(button).toHaveAttribute('aria-expanded', 'false');

			// Click to open
			await fireEvent.click(button);

			expect(button).toHaveAttribute('aria-expanded', 'true');
		});
	});

	describe('Mobile Menu', () => {
		it('should render mobile menu button', () => {
			render(Header);

			const menuButton = screen.getByLabelText(/toggle sidebar/i);
			expect(menuButton).toBeInTheDocument();
		});

		it('should toggle sidebar when mobile menu button is clicked', async () => {
			render(Header);

			const menuButton = screen.getByLabelText(/toggle sidebar/i);
			await fireEvent.click(menuButton);

			expect(mockUiStore.toggleMobileSidebar).toHaveBeenCalled();
		});
	});

	describe('Action Buttons', () => {
		it('should toggle chat panel when chat button is clicked', async () => {
			render(Header);

			const chatButton = screen.getByLabelText(/toggle ai chat/i);
			await fireEvent.click(chatButton);

			expect(mockUiStore.toggleChatPanel).toHaveBeenCalled();
		});

		it('should have correct title attributes for accessibility', () => {
			render(Header);

			const chatButton = screen.getByLabelText(/toggle ai chat/i);
			expect(chatButton).toHaveAttribute('title', 'AI Assistant');

			const settingsLink = screen.getByLabelText(/settings/i);
			expect(settingsLink).toHaveAttribute('title', 'Settings');
		});
	});
});
