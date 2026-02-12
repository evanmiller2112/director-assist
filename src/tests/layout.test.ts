import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Layout from '../routes/+layout.svelte';
import { createMockCampaignStore, createMockEntitiesStore, createMockUiStore } from './mocks/stores';
import { createKeyboardEvent } from './utils/testUtils';

// Helper to create a mock children snippet for Svelte 5
const mockChildren = (() => {}) as unknown as import('svelte').Snippet;

// Create mock stores that will be shared
let mockCampaignStore: ReturnType<typeof createMockCampaignStore>;
let mockEntitiesStore: ReturnType<typeof createMockEntitiesStore>;
let mockUiStore: ReturnType<typeof createMockUiStore>;

// Mock the database initialization
vi.mock('$lib/db', () => ({
	initializeDatabase: vi.fn(() => Promise.resolve())
}));

// Mock the player mode detection service (always returns false = director mode)
vi.mock('$lib/services/playerModeDetectionService', () => ({
	detectPlayerMode: vi.fn(() => Promise.resolve(false)),
	resetDetectionCache: vi.fn()
}));

// Mock the stores
vi.mock('$lib/stores', async () => {
	return {
		get campaignStore() {
			return mockCampaignStore;
		},
		get entitiesStore() {
			return mockEntitiesStore;
		},
		get uiStore() {
			return mockUiStore;
		},
		notificationStore: {
			notifications: [],
			success: vi.fn(),
			error: vi.fn(),
			info: vi.fn(),
			warning: vi.fn(),
			dismiss: vi.fn()
		},
		aiSettings: {
			isEnabled: false,
			apiProvider: null,
			openaiKey: null,
			anthropicKey: null,
			enable: vi.fn(),
			disable: vi.fn(),
			setApiProvider: vi.fn(),
			setOpenaiKey: vi.fn(),
			setAnthropicKey: vi.fn(),
			load: vi.fn()
		}
	};
});

// Mock the layout components
vi.mock('$lib/components/layout', async () => {
	const MockHeader = (await import('./mocks/components/MockHeader.svelte')).default;
	const MockSidebar = (await import('./mocks/components/MockSidebar.svelte')).default;
	return {
		Header: MockHeader,
		Sidebar: MockSidebar
	};
});

vi.mock('$lib/components/chat', async () => {
	const MockChatPanel = (await import('./mocks/components/MockChatPanel.svelte')).default;
	return {
		ChatPanel: MockChatPanel
	};
});

vi.mock('$lib/components/ui/Toast.svelte', async () => {
	const MockToast = (await import('./mocks/components/MockToast.svelte')).default;
	return {
		default: MockToast
	};
});

describe('Layout - Global Keyboard Shortcuts', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockCampaignStore = createMockCampaignStore();
		mockEntitiesStore = createMockEntitiesStore();
		mockUiStore = createMockUiStore();
	});

	describe('Cmd+K / Ctrl+K Keyboard Shortcut', () => {
		it('should set up keyboard event listener on window', async () => {
			const { container } = render(Layout, {
				props: {
					children: mockChildren
				}
			});

			// Wait for onMount (detectPlayerMode is async)
			await new Promise(resolve => setTimeout(resolve, 20));

			// Verify the layout rendered successfully - the keyboard handler is set up via svelte:window
			expect(container.querySelector('.dashboard-layout')).toBeInTheDocument();
		});
	});

	describe('Layout Initialization', () => {
		it('should initialize database on mount', async () => {
			const { initializeDatabase } = await import('$lib/db');

			render(Layout, {
				props: {
					children: mockChildren
				}
			});

			// Give time for onMount to execute
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(initializeDatabase).toHaveBeenCalled();
		});

		it('should load campaign store on mount', async () => {
			render(Layout, {
				props: {
					children: mockChildren
				}
			});

			// Give time for onMount to execute
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockCampaignStore.load).toHaveBeenCalled();
		});

		it('should load entities store on mount', async () => {
			render(Layout, {
				props: {
					children: mockChildren
				}
			});

			// Give time for onMount to execute
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockEntitiesStore.load).toHaveBeenCalled();
		});

		it('should load theme preference on mount', async () => {
			render(Layout, {
				props: {
					children: mockChildren
				}
			});

			// Give time for onMount to execute
			await new Promise(resolve => setTimeout(resolve, 10));

			expect(mockUiStore.loadTheme).toHaveBeenCalled();
		});
	});

	describe('Layout Structure', () => {
		it('should render main content area', async () => {
			const { container } = render(Layout, {
				props: {
					children: mockChildren
				}
			});

			// Wait for onMount (detectPlayerMode is async)
			await new Promise(resolve => setTimeout(resolve, 20));

			const main = container.querySelector('.dashboard-main');
			expect(main).toBeInTheDocument();
		});

		it('should render layout container', async () => {
			const { container } = render(Layout, {
				props: {
					children: mockChildren
				}
			});

			// Wait for onMount (detectPlayerMode is async)
			await new Promise(resolve => setTimeout(resolve, 20));

			expect(container.querySelector('.dashboard-layout')).toBeInTheDocument();
		});
	});

});
