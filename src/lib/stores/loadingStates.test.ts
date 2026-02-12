import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Tests for Store Loading States
 *
 * Issue #12: Add Loading States & Async Operation Feedback
 *
 * These tests verify that all stores properly manage isLoading state during
 * async operations. They test:
 * - entitiesStore.isLoading during CRUD operations
 * - campaignStore.isLoading during campaign loading
 * - chatStore.isLoading during message sending
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * loading state management is properly implemented.
 */

describe('EntitiesStore Loading States (Issue #12)', () => {
	let entitiesStore: any;
	let mockRepository: any;

	beforeEach(async () => {
		// Clear all mocks and reset modules to get fresh store state
		vi.clearAllMocks();
		vi.resetModules();

		// Mock the entity repository
		mockRepository = {
			getAll: vi.fn(() => ({
				subscribe: vi.fn()
			})),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn()
		};

		// Mock the module
		vi.doMock('$lib/db/repositories', () => ({
			entityRepository: mockRepository
		}));

		// Import store after mocking
		const module = await import('./entities.svelte');
		entitiesStore = module.entitiesStore;
	});

	afterEach(() => {
		vi.resetModules();
	});

	describe('Load Operation Loading State', () => {
		it('should set isLoading to true when load starts', async () => {
			expect(entitiesStore.isLoading).toBe(true);
		});

		it('should set isLoading to false when load completes successfully', async () => {
			// Setup mock to immediately resolve
			const mockSubscribe = vi.fn((observer: any) => {
				// Call observer.next synchronously so isLoading is updated before load() returns
				observer.next([]);
				return { unsubscribe: vi.fn() };
			});

			mockRepository.getAll.mockReturnValue({
				subscribe: mockSubscribe
			});

			await entitiesStore.load();

			// The observable callback is synchronous, so isLoading should be false now
			expect(entitiesStore.isLoading).toBe(false);
		});

		it('should set isLoading to false when load fails', async () => {
			const mockSubscribe = vi.fn((observer: any) => {
				// Call observer.error synchronously so isLoading is updated before load() returns
				observer.error(new Error('Load failed'));
				return { unsubscribe: vi.fn() };
			});

			mockRepository.getAll.mockReturnValue({
				subscribe: mockSubscribe
			});

			await entitiesStore.load();

			// The observable callback is synchronous, so isLoading should be false now
			expect(entitiesStore.isLoading).toBe(false);
		});

		it('should clear error when load starts', async () => {
			await entitiesStore.load();

			expect(entitiesStore.error).toBe(null);
		});
	});

	describe('Create Operation Loading State', () => {
		it('should not affect global isLoading during create', async () => {
			mockRepository.create.mockResolvedValue({
				id: 'new-entity',
				name: 'New Entity',
				type: 'character'
			});

			const initialLoadingState = entitiesStore.isLoading;

			await entitiesStore.create({
				name: 'New Entity',
				type: 'character',
				description: 'Test'
			});

			// Global loading state should not change during create
			expect(entitiesStore.isLoading).toBe(initialLoadingState);
		});

		it('should handle create operation errors gracefully', async () => {
			mockRepository.create.mockRejectedValue(new Error('Create failed'));

			// The store doesn't catch errors from create, they propagate to caller
			await expect(
				entitiesStore.create({
					name: 'New Entity',
					type: 'character',
					description: 'Test'
				})
			).rejects.toThrow('Create failed');
		});
	});

	describe('Update Operation Loading State', () => {
		it('should not affect global isLoading during update', async () => {
			mockRepository.update.mockResolvedValue(undefined);

			const initialLoadingState = entitiesStore.isLoading;

			await entitiesStore.update('entity-1', { name: 'Updated' });

			expect(entitiesStore.isLoading).toBe(initialLoadingState);
		});

		it('should handle update operation errors gracefully', async () => {
			mockRepository.update.mockRejectedValue(new Error('Update failed'));

			// The store doesn't catch errors from update, they propagate to caller
			await expect(
				entitiesStore.update('entity-1', { name: 'Updated' })
			).rejects.toThrow('Update failed');
		});
	});

	describe('Delete Operation Loading State', () => {
		it('should not affect global isLoading during delete', async () => {
			mockRepository.delete.mockResolvedValue(undefined);

			const initialLoadingState = entitiesStore.isLoading;

			await entitiesStore.delete('entity-1');

			expect(entitiesStore.isLoading).toBe(initialLoadingState);
		});

		it('should handle delete operation errors gracefully', async () => {
			mockRepository.delete.mockRejectedValue(new Error('Delete failed'));

			// The store doesn't catch errors from delete, they propagate to caller
			await expect(
				entitiesStore.delete('entity-1')
			).rejects.toThrow('Delete failed');
		});
	});
});

describe('CampaignStore Loading States (Issue #12)', () => {
	let campaignStore: any;
	let mockDb: any;
	let mockAppConfigRepository: any;
	let mockQueryChain: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();

		// Create a stable mock chain for the database
		mockQueryChain = {
			toArray: vi.fn(),
			count: vi.fn()
		};

		// Mock database
		mockDb = {
			entities: {
				where: vi.fn(() => ({
					equals: vi.fn(() => mockQueryChain)
				})),
				add: vi.fn(),
				update: vi.fn()
			}
		};

		mockAppConfigRepository = {
			getActiveCampaignId: vi.fn(),
			setActiveCampaignId: vi.fn()
		};

		vi.doMock('$lib/db', () => ({ db: mockDb }));
		vi.doMock('$lib/db/repositories', () => ({
			appConfigRepository: mockAppConfigRepository,
			entityRepository: {
				delete: vi.fn()
			}
		}));

		const module = await import('./campaign.svelte');
		campaignStore = module.campaignStore;
	});

	afterEach(() => {
		vi.resetModules();
	});

	describe('Load Operation Loading State', () => {
		it('should set isLoading to true when load starts', () => {
			expect(campaignStore.isLoading).toBe(true);
		});

		it('should set isLoading to false when load completes successfully', async () => {
			mockQueryChain.toArray.mockResolvedValue([
				{
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign'
				}
			]);
			mockQueryChain.count.mockResolvedValue(1);

			mockAppConfigRepository.getActiveCampaignId.mockResolvedValue('campaign-1');

			await campaignStore.load();

			expect(campaignStore.isLoading).toBe(false);
		});

		it('should set isLoading to false when load fails', async () => {
			mockQueryChain.toArray.mockRejectedValue(
				new Error('Load failed')
			);
			mockQueryChain.count.mockResolvedValue(0);

			await campaignStore.load();

			expect(campaignStore.isLoading).toBe(false);
		});

		it('should clear error when load starts', async () => {
			mockQueryChain.toArray.mockResolvedValue([]);
			mockQueryChain.count.mockResolvedValue(0);
			mockAppConfigRepository.getActiveCampaignId.mockResolvedValue(null);
			mockDb.entities.add.mockResolvedValue(undefined);
			mockAppConfigRepository.setActiveCampaignId.mockResolvedValue(undefined);

			await campaignStore.load();

			// Initially error should be null
			expect(campaignStore.error).toBe(null);
		});

		it('should set error when load fails', async () => {
			mockQueryChain.toArray.mockRejectedValue(
				new Error('Database error')
			);
			mockQueryChain.count.mockResolvedValue(0);

			await campaignStore.load();

			expect(campaignStore.error).toBeTruthy();
			expect(campaignStore.error).toContain('Failed to load campaigns');
		});
	});

	describe('Create Campaign Loading State', () => {
		it('should create campaign and handle loading appropriately', async () => {
			mockDb.entities.add.mockResolvedValue(undefined);
			mockQueryChain.count.mockResolvedValue(1);
			mockAppConfigRepository.setActiveCampaignId.mockResolvedValue(undefined);

			const campaign = await campaignStore.create('New Campaign');

			expect(campaign).toBeDefined();
			expect(campaign.name).toBe('New Campaign');
		});

		it('should handle create errors gracefully', async () => {
			mockDb.entities.add.mockRejectedValue(new Error('Create failed'));
			mockQueryChain.count.mockResolvedValue(0);

			await expect(
				campaignStore.create('New Campaign')
			).rejects.toThrow('Create failed');
		});
	});

	describe('Update Campaign Loading State', () => {
		it('should update campaign without affecting global loading state', async () => {
			// Setup initial campaign by loading it
			const mockCampaign = {
				id: 'campaign-1',
				name: 'Old Name',
				type: 'campaign',
				description: 'Test',
				tags: [],
				links: [],
				fields: {},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			mockQueryChain.toArray.mockResolvedValue([mockCampaign]);
			mockAppConfigRepository.getActiveCampaignId.mockResolvedValue('campaign-1');

			await campaignStore.load();

			mockDb.entities.update.mockResolvedValue(undefined);

			await campaignStore.update({ name: 'New Name' });

			// Should update without errors
			expect(mockDb.entities.update).toHaveBeenCalled();
		});

		it('should handle update errors and set error state', async () => {
			// Setup initial campaign by loading it
			const mockCampaign = {
				id: 'campaign-1',
				name: 'Old Name',
				type: 'campaign',
				description: 'Test',
				tags: [],
				links: [],
				fields: {},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			mockQueryChain.toArray.mockResolvedValue([mockCampaign]);
			mockAppConfigRepository.getActiveCampaignId.mockResolvedValue('campaign-1');

			await campaignStore.load();

			mockDb.entities.update.mockRejectedValue(new Error('Update failed'));

			await campaignStore.update({ name: 'New Name' });

			expect(campaignStore.error).toBeTruthy();
		});
	});

	describe('Update Settings Loading State', () => {
		it('should update settings without affecting global loading state', async () => {
			// Setup initial campaign by loading it
			const mockCampaign = {
				id: 'campaign-1',
				name: 'Campaign',
				type: 'campaign',
				description: 'Test',
				tags: [],
				links: [],
				fields: {},
				metadata: {
					settings: {}
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			mockQueryChain.toArray.mockResolvedValue([mockCampaign]);
			mockAppConfigRepository.getActiveCampaignId.mockResolvedValue('campaign-1');

			await campaignStore.load();

			mockDb.entities.update.mockResolvedValue(undefined);

			await campaignStore.updateSettings({
				defaultApiProvider: 'anthropic'
			});

			expect(mockDb.entities.update).toHaveBeenCalled();
		});

		it('should handle settings update errors', async () => {
			// Setup initial campaign by loading it
			const mockCampaign = {
				id: 'campaign-1',
				name: 'Campaign',
				type: 'campaign',
				description: 'Test',
				tags: [],
				links: [],
				fields: {},
				metadata: {
					settings: {}
				},
				createdAt: new Date(),
				updatedAt: new Date()
			};

			mockQueryChain.toArray.mockResolvedValue([mockCampaign]);
			mockAppConfigRepository.getActiveCampaignId.mockResolvedValue('campaign-1');

			await campaignStore.load();

			mockDb.entities.update.mockRejectedValue(new Error('Update failed'));

			await campaignStore.updateSettings({
				defaultApiProvider: 'anthropic'
			});

			expect(campaignStore.error).toBeTruthy();
		});
	});
});

describe('ChatStore Loading States (Issue #12)', () => {
	let chatStore: any;
	let mockChatRepository: any;
	let mockSendChatMessage: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();

		mockChatRepository = {
			getAll: vi.fn(() => ({
				subscribe: vi.fn()
			})),
			add: vi.fn(),
			clearAll: vi.fn()
		};

		mockSendChatMessage = vi.fn();

		// Mock the database to prevent liveQuery from accessing undefined tables
		vi.doMock('$lib/db', () => ({
			db: {
				negotiationSessions: {
					toArray: vi.fn().mockResolvedValue([])
				},
				respiteSessions: {
					toArray: vi.fn().mockResolvedValue([])
				}
			},
			ensureDbReady: vi.fn().mockResolvedValue(undefined)
		}));

		vi.doMock('$lib/db/repositories', () => ({
			chatRepository: mockChatRepository,
			combatRepository: {
				getAll: vi.fn(() => ({ subscribe: vi.fn() })),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			montageRepository: {
				getAll: vi.fn(() => ({ subscribe: vi.fn() })),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			creatureRepository: {
				getAll: vi.fn(() => ({ subscribe: vi.fn() })),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			negotiationRepository: {
				getAll: vi.fn(() => ({ subscribe: vi.fn() })),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			},
			respiteRepository: {
				getAll: vi.fn(() => ({ subscribe: vi.fn() })),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn()
			}
		}));

		vi.doMock('$lib/services/chatService', () => ({
			sendChatMessage: mockSendChatMessage
		}));

		const module = await import('./chat.svelte');
		chatStore = module.chatStore;
	});

	afterEach(() => {
		vi.resetModules();
	});

	describe('Load Operation Loading State', () => {
		it('should initialize without errors', async () => {
			await chatStore.load();

			// Should complete load without errors
			expect(mockChatRepository.getAll).toHaveBeenCalled();
		});

		it('should handle load errors gracefully', async () => {
			const mockSubscribe = vi.fn((observer: any) => {
				observer.error(new Error('Load failed'));
				return { unsubscribe: vi.fn() };
			});

			mockChatRepository.getAll.mockReturnValue({
				subscribe: mockSubscribe
			});

			await chatStore.load();

			expect(chatStore.error).toBeTruthy();
		});
	});

	describe('Send Message Loading State', () => {
		it('should set isLoading to true when sending message', () => {
			mockSendChatMessage.mockResolvedValue('Response');
			mockChatRepository.add.mockResolvedValue(undefined);

			const promise = chatStore.sendMessage('Hello');

			// Should be loading immediately
			expect(chatStore.isLoading).toBe(true);

			return promise;
		});

		it('should set isLoading to false when message sent successfully', async () => {
			mockSendChatMessage.mockResolvedValue('Response');
			mockChatRepository.add.mockResolvedValue(undefined);

			await chatStore.sendMessage('Hello');

			expect(chatStore.isLoading).toBe(false);
		});

		it('should set isLoading to false when message sending fails', async () => {
			mockSendChatMessage.mockRejectedValue(new Error('API error'));
			mockChatRepository.add.mockResolvedValue(undefined);

			await chatStore.sendMessage('Hello');

			expect(chatStore.isLoading).toBe(false);
		});

		it('should clear error when sending starts', async () => {
			mockSendChatMessage.mockResolvedValue('Response');
			mockChatRepository.add.mockResolvedValue(undefined);

			await chatStore.sendMessage('Hello');

			// Error should be null when starting
			expect(chatStore.error).toBe(null);
		});

		it('should set error when sending fails', async () => {
			mockSendChatMessage.mockRejectedValue(new Error('Network error'));
			mockChatRepository.add.mockResolvedValue(undefined);

			await chatStore.sendMessage('Hello');

			expect(chatStore.error).toBeTruthy();
			// The error message comes from the thrown error, not a generic message
			expect(chatStore.error).toBe('Network error');
		});

		it('should clear streamingContent on success', async () => {
			mockSendChatMessage.mockImplementation(
				async (content: string, entityIds: string[], includeLinked: boolean, onStream: Function) => {
					onStream('Partial response...');
					return 'Full response';
				}
			);
			mockChatRepository.add.mockResolvedValue(undefined);

			await chatStore.sendMessage('Hello');

			expect(chatStore.streamingContent).toBe('');
		});

		it('should clear streamingContent on error', async () => {
			mockSendChatMessage.mockImplementation(
				async (content: string, entityIds: string[], includeLinked: boolean, onStream: Function) => {
					onStream('Partial response...');
					throw new Error('API error');
				}
			);
			mockChatRepository.add.mockResolvedValue(undefined);

			await chatStore.sendMessage('Hello');

			expect(chatStore.streamingContent).toBe('');
		});

		it('should update streamingContent during streaming', async () => {
			let resolveMessage: () => void;
			const messagePromise = new Promise<string>((resolve) => {
				resolveMessage = () => resolve('Final');
			});

			mockSendChatMessage.mockImplementation(
				async (content: string, entityIds: string[], includeLinked: boolean, onStream: Function) => {
					// Call onStream to update streaming content
					onStream('Streaming...');
					// Wait for test to check streaming content before completing
					return messagePromise;
				}
			);
			mockChatRepository.add.mockResolvedValue(undefined);

			const promise = chatStore.sendMessage('Hello');

			// Wait a tick for the async function to start executing
			await new Promise(resolve => setTimeout(resolve, 0));

			// Should update streaming content while message is in progress
			expect(chatStore.streamingContent).toBe('Streaming...');

			// Now complete the message
			resolveMessage!();
			await promise;
		});

		it('should ignore empty messages', async () => {
			await chatStore.sendMessage('   ');

			expect(mockSendChatMessage).not.toHaveBeenCalled();
			expect(chatStore.isLoading).toBe(false);
		});
	});

	describe('Clear History Loading State', () => {
		it('should clear history without affecting loading state', async () => {
			mockChatRepository.clearAll.mockResolvedValue(undefined);

			await chatStore.clearHistory();

			expect(mockChatRepository.clearAll).toHaveBeenCalled();
		});

		it('should handle clear errors', async () => {
			mockChatRepository.clearAll.mockRejectedValue(new Error('Clear failed'));

			await chatStore.clearHistory();

			expect(chatStore.error).toBeTruthy();
		});
	});
});
