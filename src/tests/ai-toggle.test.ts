/**
 * Integration Tests for AI Toggle Feature
 *
 * Issue #122: Add 'AI Off' toggle to disable all AI features
 * Issue #465 (section 2): Fix 15 skipped tests blocked by dynamic import timeouts
 *
 * TESTING STRATEGY:
 * - Focus on individual component testing rather than full page integration
 * - Test components in isolation with different AI enabled states
 * - Verify visibility and behavior of AI-related UI elements
 *
 * COMPONENTS TESTED:
 * - EntitySummary: Tests AI toggle behavior in entity summary display
 * - SettingsPage: Tests AI mode selection (off/suggestions/full) and related UI
 *
 * MOCKING APPROACH:
 * - Mock all stores ($lib/stores) and services ($lib/services) used by the components
 * - Mock $app/stores to provide page context
 * - Mock complex child components (SystemSelector, LoadingButton, etc.) with simple Svelte mocks
 * - Mock database and repository dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import EntitySummary from '$lib/components/entity/EntitySummary.svelte';
import SettingsPage from '../routes/settings/+page.svelte';

// Mock $app/stores - must be at the top level
const { mockPageStore } = vi.hoisted(() => ({
	mockPageStore: {
		subscribe: vi.fn((callback) => {
			callback({
				url: new URL('http://localhost/settings'),
				params: {},
				route: { id: null },
				status: 200,
				error: null,
				data: {},
				form: undefined
			});
			return () => {};
		})
	}
}));

vi.mock('$app/stores', () => ({
	page: mockPageStore,
	navigating: { subscribe: vi.fn(() => () => {}) },
	updated: { subscribe: vi.fn(() => () => {}) }
}));

// Mock stores - must be defined in vi.hoisted() to be available during hoisting
const {
	mockAiSettings,
	mockCampaignStore,
	mockUiStore,
	mockNotificationStore,
	mockEntitiesStore,
	mockDebugStore,
	mockLocalStorage,
	getAiEnabled,
	setAiEnabled
} = vi.hoisted(() => {
	let aiEnabled = false;
	let aiMode: 'off' | 'suggestions' | 'full' = 'off';

	const mockAiSettings = {
		get aiEnabled() {
			return aiEnabled;
		},
		get isEnabled() {
			return aiEnabled;
		},
		get aiMode() {
			return aiMode;
		},
		load: vi.fn(),
		setEnabled: vi.fn(),
		setMode: vi.fn((mode: 'off' | 'suggestions' | 'full') => {
			aiMode = mode;
			aiEnabled = mode !== 'off';
		}),
		toggle: vi.fn()
	};

	const mockCampaignStore = {
		campaign: {
			id: 'test-campaign',
			type: 'campaign' as const,
			name: 'Test Campaign',
			description: 'Test',
			tags: [],
			fields: { system: 'Test System' },
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		},
		customEntityTypes: [],
		entityTypeOverrides: [],
		allCampaigns: [],
		activeCampaignId: 'test-campaign',
		load: vi.fn(),
		setActiveCampaign: vi.fn(),
		getCurrentSystemProfile: vi.fn(() => ({ id: 'draw-steel', name: 'Draw Steel' })),
		setSystemProfile: vi.fn()
	};

	const mockUiStore = {
		sidebarOpen: true,
		chatPanelOpen: false,
		theme: 'light' as const,
		toggleSidebar: vi.fn(),
		toggleChatPanel: vi.fn(),
		loadTheme: vi.fn(),
		setTheme: vi.fn()
	};

	const mockNotificationStore = {
		notifications: [],
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
		dismiss: vi.fn()
	};

	const mockEntitiesStore = {
		entities: [],
		filteredEntities: [],
		searchQuery: '',
		availableRelationshipTypes: [],
		relationshipFilter: {},
		setSearchQuery: vi.fn(),
		load: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		getById: vi.fn(),
		getByType: vi.fn(),
		addLink: vi.fn(),
		removeLink: vi.fn(),
		getLinkedWithRelationships: vi.fn(() => []),
		filterByRelatedTo: vi.fn(),
		filterByRelationshipType: vi.fn(),
		filterByHasRelationships: vi.fn(),
		setRelationshipFilter: vi.fn(),
		clearRelationshipFilter: vi.fn()
	};

	const mockDebugStore = {
		enabled: false,
		load: vi.fn(),
		setEnabled: vi.fn()
	};

	const mockLocalStorage = (() => {
		let store: Record<string, string> = {};
		return {
			getItem: (key: string) => store[key] || null,
			setItem: (key: string, value: string) => {
				store[key] = value;
			},
			removeItem: (key: string) => {
				delete store[key];
			},
			clear: () => {
				store = {};
			}
		};
	})();

	return {
		mockAiSettings,
		mockCampaignStore,
		mockUiStore,
		mockNotificationStore,
		mockEntitiesStore,
		mockDebugStore,
		mockLocalStorage,
		getAiEnabled: () => aiEnabled,
		setAiEnabled: (value: boolean) => { aiEnabled = value; }
	};
});

Object.defineProperty(global, 'localStorage', {
	value: mockLocalStorage,
	writable: true
});

vi.mock('$lib/stores', () => ({
	campaignStore: mockCampaignStore,
	uiStore: mockUiStore,
	notificationStore: mockNotificationStore,
	entitiesStore: mockEntitiesStore,
	aiSettings: mockAiSettings,
	debugStore: mockDebugStore
}));

vi.mock('$lib/services', () => ({
	hasGenerationApiKey: () => getAiEnabled() && !!mockLocalStorage.getItem('dm-assist-api-key'),
	fetchModels: vi.fn(() => Promise.resolve([])),
	getSelectedModel: vi.fn(() => ''),
	setSelectedModel: vi.fn(),
	clearModelsCache: vi.fn(),
	getFallbackModels: vi.fn(() => []),
	getRelationshipContextSettings: vi.fn(() => ({
		enabled: true,
		maxRelatedEntities: 20,
		maxCharacters: 4000,
		contextBudgetAllocation: 50,
		autoGenerateSummaries: false
	})),
	setRelationshipContextSettings: vi.fn(),
	getLastExportedAt: vi.fn(() => null),
	getDaysSinceExport: vi.fn(() => null),
	setLastExportedAt: vi.fn(),
	setLastMilestoneReached: vi.fn(),
	refreshAllStores: vi.fn(),
	resetAllStores: vi.fn(),
	getLastPublishedAt: vi.fn(() => null),
	getDaysSincePublish: vi.fn(() => null),
	getPublishFreshness: vi.fn(() => 'never')
}));

vi.mock('$lib/services/summaryService', () => ({
	hasApiKey: () => !!mockLocalStorage.getItem('dm-assist-api-key'),
	generateSummary: vi.fn(() => Promise.resolve({ success: true, summary: 'Test summary' }))
}));

// Mock db and repositories (used by SettingsPage)
vi.mock('$lib/db', () => ({
	db: {
		entities: { toArray: vi.fn(() => Promise.resolve([])) },
		chatMessages: { toArray: vi.fn(() => Promise.resolve([])), clear: vi.fn(), bulkAdd: vi.fn() },
		campaign: { clear: vi.fn() },
		appConfig: { clear: vi.fn(), put: vi.fn() },
		combatSessions: { toArray: vi.fn(() => Promise.resolve([])), clear: vi.fn(), bulkAdd: vi.fn() },
		montageSessions: { toArray: vi.fn(() => Promise.resolve([])), clear: vi.fn(), bulkAdd: vi.fn() },
		negotiationSessions: { toArray: vi.fn(() => Promise.resolve([])), clear: vi.fn(), bulkAdd: vi.fn() },
		suggestions: { clear: vi.fn() },
		transaction: vi.fn((mode, tables, callback) => callback())
	}
}));

vi.mock('$lib/db/repositories', () => ({
	entityRepository: {},
	chatRepository: {},
	appConfigRepository: {
		getActiveCampaignId: vi.fn(() => Promise.resolve('test-campaign'))
	}
}));

vi.mock('$lib/db/migrations/migrateCampaignToEntity', () => ({
	convertOldCampaignToEntity: vi.fn()
}));

// Mock the settings components that SettingsPage imports
vi.mock('$lib/components/settings/PlayerExportModal.svelte', async () => {
	const MockPlayerExportModal = (await import('./mocks/components/MockPlayerExportModal.svelte')).default;
	return {
		default: MockPlayerExportModal
	};
});

vi.mock('$lib/components/settings/PublishPlayerDataModal.svelte', async () => {
	const MockPlayerExportModal = (await import('./mocks/components/MockPlayerExportModal.svelte')).default;
	return {
		default: MockPlayerExportModal
	};
});

vi.mock('$lib/components/settings/ForgeSteelImportModal.svelte', async () => {
	const MockForgeSteelImportModal = (await import('./mocks/components/MockForgeSteelImportModal.svelte')).default;
	return {
		default: MockForgeSteelImportModal
	};
});

vi.mock('$lib/components/settings', async () => {
	const MockSystemSelector = (await import('./mocks/components/MockSystemSelector.svelte')).default;
	const MockCampaignLinkingSettings = (await import('./mocks/components/MockCampaignLinkingSettings.svelte')).default;
	return {
		SystemSelector: MockSystemSelector,
		CampaignLinkingSettings: MockCampaignLinkingSettings
	};
});

vi.mock('$lib/components/ui/LoadingButton.svelte', async () => {
	const MockLoadingButton = (await import('./mocks/components/MockLoadingButton.svelte')).default;
	return {
		default: MockLoadingButton
	};
});

describe('AI Toggle Integration Tests (Issue #122)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockLocalStorage.clear();
		setAiEnabled(false);
		mockAiSettings.setMode('off');
	});

	describe('EntitySummary Component', () => {
		const mockEntity = {
			id: 'test-entity',
			type: 'character' as const,
			name: 'Test Character',
			description: 'Test description',
			summary: undefined,
			fields: {},
			tags: [],
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		it('should show sparkles icon in header when AI is enabled', async () => {
			setAiEnabled(true);
			mockLocalStorage.setItem('dm-assist-api-key', 'test-key');
			const { container } = render(EntitySummary, { props: { entity: mockEntity, editable: true } });

			// Wait for component to render
			await screen.findByText(/^Summary$/i);

			// Sparkles icon should be visible when AI is enabled
			// The icon is an SVG element inside the h3 with "Summary" text
			const summaryHeadings = screen.getAllByText(/^Summary$/i);
			const summaryH3 = summaryHeadings[summaryHeadings.length - 1].closest('h3');
			const sparklesIcon = summaryH3?.querySelector('svg');
			expect(sparklesIcon).toBeInTheDocument();
		});

		it('should hide sparkles icon in header when AI is disabled', async () => {
			setAiEnabled(false);
			const { container } = render(EntitySummary, { props: { entity: mockEntity, editable: true } });

			// Wait for component to render
			await screen.findByText(/^Summary$/i);

			// Sparkles should not be in the header when AI is disabled
			const summaryHeadings = screen.getAllByText(/^Summary$/i);
			const summaryH3 = summaryHeadings[summaryHeadings.length - 1].closest('h3');
			const sparklesIcon = summaryH3?.querySelector('svg');
			expect(sparklesIcon).not.toBeInTheDocument();
		});

		it('should hide generate button when AI is disabled', async () => {
			setAiEnabled(false);
			render(EntitySummary, { props: { entity: mockEntity, editable: true } });

			// Generate button should NOT be visible
			const generateBtn = screen.queryByTitle(/generate summary/i);
			expect(generateBtn).not.toBeInTheDocument();
		});

		it('should show generate button when AI is enabled and has API key', async () => {
			setAiEnabled(true);
			mockLocalStorage.setItem('dm-assist-api-key', 'test-key');
			render(EntitySummary, { props: { entity: mockEntity, editable: true } });

			// Generate button should be visible - get all and check the last one
			const generateBtns = screen.getAllByTitle(/generate summary/i);
			expect(generateBtns.length).toBeGreaterThan(0);
			expect(generateBtns[generateBtns.length - 1]).toBeInTheDocument();
		});

		it('should still show existing summary when AI is disabled', async () => {
			setAiEnabled(false);
			const entityWithSummary = {
				...mockEntity,
				summary: 'This is an existing AI-generated summary'
			};
			render(EntitySummary, { props: { entity: entityWithSummary, editable: false } });

			// Existing summary should still be visible
			expect(screen.getByText(/existing ai-generated summary/i)).toBeInTheDocument();
		});

		it('should allow editing existing summary when AI is disabled', async () => {
			setAiEnabled(false);
			const entityWithSummary = {
				...mockEntity,
				summary: 'Existing summary'
			};
			render(EntitySummary, { props: { entity: entityWithSummary, editable: true } });

			// Edit button should be visible
			const editBtn = screen.getByTitle(/edit summary/i);
			expect(editBtn).toBeInTheDocument();

			// Click edit
			await fireEvent.click(editBtn);

			// Textarea should be visible with existing content
			const textarea = screen.getByRole('textbox');
			expect(textarea).toBeInTheDocument();
			expect(textarea).toHaveValue('Existing summary');
		});

		it('should show appropriate message when AI is disabled and no summary exists', async () => {
			setAiEnabled(false);
			render(EntitySummary, { props: { entity: mockEntity, editable: false } });

			// Should show message that AI is disabled
			const message = screen.getByText(/ai features are disabled/i);
			expect(message).toBeInTheDocument();
		});

		it('should show appropriate message when AI is enabled but no API key', async () => {
			setAiEnabled(true);
			mockLocalStorage.clear();
			render(EntitySummary, { props: { entity: mockEntity, editable: false } });

			// Should show message to configure API key
			const message = screen.getByText(/configure.*api key.*settings/i);
			expect(message).toBeInTheDocument();
		});
	});

	describe('Settings Page - AI Mode Selection', () => {
		it('should display AI mode radio buttons with "Off" selected when AI is disabled', async () => {
			mockAiSettings.setMode('off');
			const { container } = render(SettingsPage);

			// Radio buttons have name="aiMode" in the HTML
			const radios = container.querySelectorAll('input[name="aiMode"]');
			expect(radios.length).toBeGreaterThan(0);

			const offRadio = Array.from(radios).find(r => (r as HTMLInputElement).value === 'off');
			expect(offRadio).toBeInTheDocument();
			expect(offRadio).toBeChecked();
		});

		it('should display AI mode radio buttons with "Suggestions Only" available', async () => {
			mockAiSettings.setMode('suggestions');
			const { container } = render(SettingsPage);

			const radios = container.querySelectorAll('input[name="aiMode"]');
			const suggestionsRadio = Array.from(radios).find(r => (r as HTMLInputElement).value === 'suggestions');
			expect(suggestionsRadio).toBeInTheDocument();
			expect(suggestionsRadio).toBeChecked();
		});

		it('should call aiSettings.setMode() when a different mode is selected', async () => {
			mockAiSettings.setMode('off');
			const { container } = render(SettingsPage);

			const radios = container.querySelectorAll('input[name="aiMode"]');
			const suggestionsRadio = Array.from(radios).find(r => (r as HTMLInputElement).value === 'suggestions');
			if (suggestionsRadio) {
				await fireEvent.click(suggestionsRadio);
				expect(mockAiSettings.setMode).toHaveBeenCalledWith('suggestions');
			}
		});

		it('should show descriptive text for AI modes', async () => {
			mockAiSettings.setMode('off');
			render(SettingsPage);

			// Should have descriptive text for each mode
			expect(screen.getByText(/AI features disabled/i)).toBeInTheDocument();
			expect(screen.getByText(/AI suggests content, you choose what to accept/i)).toBeInTheDocument();
			expect(screen.getByText(/AI automatically generates content/i)).toBeInTheDocument();
		});

		it('should show API key section when AI is enabled (suggestions mode)', async () => {
			mockAiSettings.setMode('suggestions');
			render(SettingsPage);

			// API key input should be visible
			const apiKeyInput = screen.getByLabelText(/^API Key$/i);
			expect(apiKeyInput).toBeInTheDocument();
		});

		it('should hide API key section when AI is disabled (off mode)', async () => {
			mockAiSettings.setMode('off');
			render(SettingsPage);

			// API key input should NOT be visible
			const apiKeyInput = screen.queryByLabelText(/^API Key$/i);
			expect(apiKeyInput).not.toBeInTheDocument();
		});

		it('should hide model selection when AI is disabled', async () => {
			mockAiSettings.setMode('off');
			render(SettingsPage);

			// Claude Model select should NOT be visible
			expect(screen.queryByLabelText(/claude model/i)).not.toBeInTheDocument();
		});
	});
});
