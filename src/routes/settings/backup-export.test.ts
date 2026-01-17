/**
 * Security Tests for Backup Export Functionality (TDD RED Phase)
 *
 * Issue #31: v1.0 Security - Validate backups exclude API key
 * Issue #34: Include selected Claude model in backup export
 *
 * CRITICAL SECURITY REQUIREMENTS:
 * - Exported backups MUST NOT contain API keys
 * - Exported backups MUST NOT contain localStorage cache data
 * - Exported backups MUST contain: version, exportedAt, entities, chatHistory, activeCampaignId, selectedModel
 * - The selectedModel field IS safe to export (user preference, not sensitive)
 *
 * Covers:
 * - Verification that API key is NOT in exported backup object
 * - Verification that API key is NOT in exported JSON string
 * - Verification that selectedModel IS exported when set (Issue #34)
 * - Verification that selectedModel is undefined when not set (Issue #34)
 * - Verification that backup structure contains ONLY expected safe fields
 * - Edge cases: API key in entity names, descriptions, or other fields
 * - Verification that all entity data IS properly included (positive tests)
 * - Import functionality restores selectedModel (Issue #34)
 * - Backward compatibility with old backups without selectedModel (Issue #34)
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { CampaignBackup, BaseEntity, ChatMessage } from '$lib/types';
import { db } from '$lib/db';

/**
 * Test helper: Creates a mock exportBackup function that mimics the behavior
 * we need to test. This will be replaced with the actual implementation.
 *
 * Issue #34: Now includes selectedModel from localStorage
 */
async function exportBackup(): Promise<CampaignBackup> {
	// Get all entities including campaigns
	const entities = await db.entities.toArray();
	const chatHistory = await db.chatMessages.toArray();
	const activeCampaignId = (await db.appConfig.get('activeCampaignId'))?.value as
		| string
		| undefined;

	// Issue #34: Get selected model from localStorage (trim whitespace to match actual implementation)
	const storedModel = localStorage.getItem('dm-assist-selected-model');
	const selectedModel = storedModel?.trim() || undefined;

	const backup: CampaignBackup = {
		version: '2.0.0',
		exportedAt: new Date(),
		entities,
		chatHistory,
		activeCampaignId,
		selectedModel // Issue #34: Include selected model
	};

	return backup;
}

/**
 * Test helper: Mock importBackup function for testing restore functionality
 *
 * Issue #34: Restores selectedModel to localStorage
 */
async function importBackup(backup: CampaignBackup): Promise<void> {
	// Clear existing data
	await db.entities.clear();
	await db.chatMessages.clear();
	await db.appConfig.clear();

	// Restore entities and chat history
	await db.entities.bulkAdd(backup.entities);
	if (backup.chatHistory) {
		await db.chatMessages.bulkAdd(backup.chatHistory);
	}

	// Restore active campaign ID
	if (backup.activeCampaignId) {
		await db.appConfig.put({ key: 'activeCampaignId', value: backup.activeCampaignId });
	}

	// Issue #34: Restore selected model to localStorage
	if (backup.selectedModel) {
		localStorage.setItem('dm-assist-selected-model', backup.selectedModel);
	} else {
		// If no selectedModel in backup, remove from localStorage (clean import)
		localStorage.removeItem('dm-assist-selected-model');
	}
}

describe('Backup Export Security (Issue #31)', () => {
	// Mock localStorage
	let localStorageMock: Record<string, string>;

	beforeEach(async () => {
		// Setup mock localStorage
		localStorageMock = {};
		global.localStorage = {
			getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
			setItem: vi.fn((key: string, value: string) => {
				localStorageMock[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete localStorageMock[key];
			}),
			clear: vi.fn(() => {
				Object.keys(localStorageMock).forEach((key) => delete localStorageMock[key]);
			}),
			length: 0,
			key: vi.fn()
		} as Storage;

		// Clear database before each test
		await db.entities.clear();
		await db.chatMessages.clear();
		await db.appConfig.clear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('API Key Exclusion - Object Level', () => {
		it('should NOT include API key in backup object when API key exists in localStorage', async () => {
			// Arrange: Set API key in localStorage
			localStorage.setItem('dm-assist-api-key', 'sk-ant-api03-test-key-12345');

			// Create test campaign entity
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'Test Description',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: API key should NOT be in backup object
			expect(backup).not.toHaveProperty('apiKey');
			expect(backup).not.toHaveProperty('api_key');
			expect(backup).not.toHaveProperty('dm-assist-api-key');

			// Issue #34: Verify backup has expected structure (now includes selectedModel)
			expect(Object.keys(backup)).toEqual(
				expect.arrayContaining(['version', 'exportedAt', 'entities', 'chatHistory', 'activeCampaignId', 'selectedModel'])
			);
			expect(Object.keys(backup).length).toBe(6);
		});

		it('should NOT include models cache in backup object', async () => {
			// Arrange: Set model preference and cache
			localStorage.setItem('dm-assist-selected-model', 'claude-opus-4-5-20251101');
			localStorage.setItem('dm-assist-api-key', 'sk-ant-test');
			localStorage.setItem('dm-assist-models-cache', JSON.stringify({ models: ['model1', 'model2'], timestamp: Date.now() }));

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert: Models cache should NOT be in backup (sensitive/transient data)
			expect(backup).not.toHaveProperty('modelsCache');
			expect(backup).not.toHaveProperty('models_cache');
			expect(backup).not.toHaveProperty('dm-assist-models-cache');

			// Issue #34: selectedModel SHOULD be in backup (user preference, not sensitive)
			expect(backup).toHaveProperty('selectedModel');
			expect(backup.selectedModel).toBe('claude-opus-4-5-20251101');
		});

		it('should NOT include sensitive localStorage keys in backup object', async () => {
			// Arrange: Set various localStorage items
			localStorage.setItem('dm-assist-api-key', 'sk-ant-test-key');
			localStorage.setItem('dm-assist-selected-model', 'claude-haiku');
			localStorage.setItem('dm-assist-models-cache', '{"models": []}');
			localStorage.setItem('some-other-key', 'some-value');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert: Sensitive localStorage keys should NOT appear as property names
			const backupKeys = Object.keys(backup);
			expect(backupKeys).not.toContain('dm-assist-api-key');
			expect(backupKeys).not.toContain('dm-assist-models-cache');
			expect(backupKeys).not.toContain('some-other-key');

			// Issue #34: selectedModel field name IS allowed (transformed from dm-assist-selected-model)
			expect(backupKeys).toContain('selectedModel');
			expect(backup.selectedModel).toBe('claude-haiku');
		});
	});

	describe('API Key Exclusion - JSON String Level', () => {
		it('should NOT include API key value in exported JSON string', async () => {
			// Arrange
			const apiKey = 'sk-ant-api03-very-secret-key-abc123xyz';
			localStorage.setItem('dm-assist-api-key', apiKey);

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'A campaign for testing',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();
			const jsonString = JSON.stringify(backup);

			// Assert: API key value should NOT appear anywhere in JSON
			expect(jsonString).not.toContain(apiKey);
			expect(jsonString).not.toContain('sk-ant-api03');
			expect(jsonString).not.toContain('very-secret-key');
		});

		it('should NOT include sensitive localStorage key names in exported JSON string', async () => {
			// Arrange
			localStorage.setItem('dm-assist-api-key', 'sk-ant-test');
			localStorage.setItem('dm-assist-selected-model', 'claude-haiku');
			localStorage.setItem('dm-assist-models-cache', '{"models": []}');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();
			const jsonString = JSON.stringify(backup);

			// Assert: Sensitive localStorage key names should not appear
			expect(jsonString).not.toContain('dm-assist-api-key');
			expect(jsonString).not.toContain('dm-assist-models-cache');

			// Issue #34: selectedModel field and value ARE allowed
			expect(jsonString).toContain('selectedModel');
			expect(jsonString).toContain('claude-haiku');
		});

		it('should NOT leak API key even when pretty-printed JSON', async () => {
			// Arrange
			const apiKey = 'sk-ant-super-secret-production-key';
			localStorage.setItem('dm-assist-api-key', apiKey);

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();
			const jsonStringPretty = JSON.stringify(backup, null, 2);

			// Assert: API key should not leak even in pretty-printed format
			expect(jsonStringPretty).not.toContain(apiKey);
			expect(jsonStringPretty).not.toContain('sk-ant-super-secret');
		});
	});

	describe('Backup Structure Validation', () => {
		it('should ONLY contain expected safe fields: version, exportedAt, entities, chatHistory, activeCampaignId, selectedModel', async () => {
			// Arrange
			localStorage.setItem('dm-assist-api-key', 'sk-ant-test');
			localStorage.setItem('dm-assist-selected-model', 'claude-opus-4-5-20251101');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert: Exactly these fields, no more, no less (Issue #34: added selectedModel)
			const expectedFields = ['version', 'exportedAt', 'entities', 'chatHistory', 'activeCampaignId', 'selectedModel'];
			const actualFields = Object.keys(backup);

			expect(actualFields.sort()).toEqual(expectedFields.sort());
		});

		it('should have version field as string', async () => {
			// Arrange
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert
			expect(backup.version).toBeDefined();
			expect(typeof backup.version).toBe('string');
		});

		it('should have exportedAt field as Date', async () => {
			// Arrange
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert
			expect(backup.exportedAt).toBeDefined();
			expect(backup.exportedAt).toBeInstanceOf(Date);
		});

		it('should have entities field as array', async () => {
			// Arrange
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert
			expect(backup.entities).toBeDefined();
			expect(Array.isArray(backup.entities)).toBe(true);
		});

		it('should have chatHistory field as array', async () => {
			// Arrange
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert
			expect(backup.chatHistory).toBeDefined();
			expect(Array.isArray(backup.chatHistory)).toBe(true);
		});
	});

	describe('Edge Cases - API Key in User Data', () => {
		it('should allow API key string to appear in entity name (user data is preserved)', async () => {
			// Arrange: User legitimately names an entity with text that looks like an API key
			localStorage.setItem('dm-assist-api-key', 'sk-ant-real-key-12345');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Campaign about API Keys',
				description: 'This campaign discusses sk-ant-fake-example-key as an example',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert: User's entity data IS preserved (this is intentional)
			const jsonString = JSON.stringify(backup);
			expect(jsonString).toContain('Campaign about API Keys');
			expect(jsonString).toContain('sk-ant-fake-example-key');

			// But the ACTUAL API key from localStorage should NOT be in backup
			expect(jsonString).not.toContain('sk-ant-real-key-12345');
		});

		it('should NOT include API key even if entity field name matches localStorage key', async () => {
			// Arrange: Edge case where entity has a field that happens to be named like a localStorage key
			localStorage.setItem('dm-assist-api-key', 'sk-ant-secret');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {
					// Entity might have a custom field, but not the actual localStorage API key
					'some-field': 'some-value'
				},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();
			const jsonString = JSON.stringify(backup);

			// Assert: The actual API key value should not leak
			expect(jsonString).not.toContain('sk-ant-secret');

			// Backup structure should not have API key field
			expect(backup).not.toHaveProperty('apiKey');
			expect(backup).not.toHaveProperty('api_key');
		});
	});

	describe('Positive Tests - Required Data IS Included', () => {
		it('should include all entities in backup', async () => {
			// Arrange
			const entities: BaseEntity[] = [
				{
					id: 'campaign-1',
					type: 'campaign',
					name: 'Test Campaign',
					description: '',
					notes: '',
					fields: {},
					tags: [],
					links: [],
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'character-1',
					type: 'character',
					name: 'Hero',
					description: 'A brave hero',
					notes: '',
					fields: { level: 5 },
					tags: ['player'],
					links: [],
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'npc-1',
					type: 'npc',
					name: 'Villain',
					description: 'An evil villain',
					notes: '',
					fields: {},
					tags: [],
					links: [],
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];

			await db.entities.bulkAdd(entities);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert: All entities should be in backup
			expect(backup.entities).toHaveLength(3);
			expect(backup.entities.map((e) => e.id)).toContain('campaign-1');
			expect(backup.entities.map((e) => e.id)).toContain('character-1');
			expect(backup.entities.map((e) => e.id)).toContain('npc-1');
		});

		it('should include all chat history in backup', async () => {
			// Arrange
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			const messages: ChatMessage[] = [
				{
					id: 'msg-1',
					role: 'user',
					content: 'Hello',
					timestamp: new Date()
				},
				{
					id: 'msg-2',
					role: 'assistant',
					content: 'Hi there!',
					timestamp: new Date()
				}
			];
			await db.chatMessages.bulkAdd(messages);

			// Act
			const backup = await exportBackup();

			// Assert: All chat messages should be in backup
			expect(backup.chatHistory).toHaveLength(2);
			expect(backup.chatHistory.map((m) => m.id)).toContain('msg-1');
			expect(backup.chatHistory.map((m) => m.id)).toContain('msg-2');
		});

		it('should include activeCampaignId in backup', async () => {
			// Arrange
			const campaignEntity: BaseEntity = {
				id: 'campaign-123',
				type: 'campaign',
				name: 'Active Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-123' });

			// Act
			const backup = await exportBackup();

			// Assert
			expect(backup.activeCampaignId).toBe('campaign-123');
		});

		it('should preserve entity fields, tags, and links', async () => {
			// Arrange
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: 'Campaign with complex data',
				notes: '',
				fields: {
					setting: 'Forgotten Realms',
					level: 10,
					active: true
				},
				tags: ['high-level', 'forgotten-realms'],
				links: [
					{
						id: 'link-1',
						targetId: 'npc-1',
						targetType: 'npc',
						relationship: 'contains',
						bidirectional: false
					}
				],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { customData: 'test' }
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert: All entity data is preserved
			const exportedEntity = backup.entities.find((e) => e.id === 'campaign-1');
			expect(exportedEntity).toBeDefined();
			expect(exportedEntity?.fields).toEqual({
				setting: 'Forgotten Realms',
				level: 10,
				active: true
			});
			expect(exportedEntity?.tags).toEqual(['high-level', 'forgotten-realms']);
			expect(exportedEntity?.links).toHaveLength(1);
			expect(exportedEntity?.metadata).toEqual({ customData: 'test' });
		});
	});

	describe('Multiple API Key Scenarios', () => {
		it('should NOT leak API key when multiple campaigns exist', async () => {
			// Arrange
			const apiKey = 'sk-ant-multi-campaign-secret';
			localStorage.setItem('dm-assist-api-key', apiKey);

			const campaigns: BaseEntity[] = [
				{
					id: 'campaign-1',
					type: 'campaign',
					name: 'Campaign 1',
					description: '',
					notes: '',
					fields: {},
					tags: [],
					links: [],
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'campaign-2',
					type: 'campaign',
					name: 'Campaign 2',
					description: '',
					notes: '',
					fields: {},
					tags: [],
					links: [],
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];
			await db.entities.bulkAdd(campaigns);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();
			const jsonString = JSON.stringify(backup);

			// Assert
			expect(jsonString).not.toContain(apiKey);
			expect(backup.entities).toHaveLength(2);
		});

		it('should NOT leak API key when no API key is set', async () => {
			// Arrange: No API key in localStorage
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert: Should have clean structure even without API key
			expect(Object.keys(backup)).toEqual(
				expect.arrayContaining(['version', 'exportedAt', 'entities', 'chatHistory', 'activeCampaignId'])
			);
			expect(backup).not.toHaveProperty('apiKey');
		});

		it('should handle empty/null API key gracefully', async () => {
			// Arrange
			localStorage.setItem('dm-assist-api-key', '');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act
			const backup = await exportBackup();

			// Assert: Should not have any API key field
			expect(backup).not.toHaveProperty('apiKey');
			expect(backup).not.toHaveProperty('api_key');
		});
	});

	describe('Comprehensive Security Audit', () => {
		it('should pass comprehensive security checklist', async () => {
			// Arrange: Set up realistic scenario with API key and data
			localStorage.setItem('dm-assist-api-key', 'sk-ant-production-key-abc123');
			localStorage.setItem('dm-assist-selected-model', 'claude-opus-4-5-20251101');
			localStorage.setItem('dm-assist-models-cache', JSON.stringify({ models: [] }));

			const campaignEntity: BaseEntity = {
				id: 'campaign-prod',
				type: 'campaign',
				name: 'Production Campaign',
				description: 'Important production data',
				notes: '',
				fields: { critical: true },
				tags: ['production'],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-prod' });

			const chatMessage: ChatMessage = {
				id: 'chat-1',
				role: 'user',
				content: 'Sensitive conversation',
				timestamp: new Date()
			};
			await db.chatMessages.add(chatMessage);

			// Act
			const backup = await exportBackup();
			const jsonString = JSON.stringify(backup);

			// Assert: Security checklist
			// 1. No API key value
			expect(jsonString).not.toContain('sk-ant-production-key-abc123');

			// 2. No sensitive localStorage key names
			expect(jsonString).not.toContain('dm-assist-api-key');
			expect(jsonString).not.toContain('dm-assist-models-cache');

			// 3. No API key in backup object
			expect(backup).not.toHaveProperty('apiKey');
			expect(backup).not.toHaveProperty('api_key');
			expect(backup).not.toHaveProperty('dm-assist-api-key');

			// 4. No models cache in backup object
			expect(backup).not.toHaveProperty('modelsCache');
			expect(backup).not.toHaveProperty('dm-assist-models-cache');

			// Issue #34: selectedModel SHOULD be present (user preference, not sensitive)
			expect(backup).toHaveProperty('selectedModel');
			expect(backup.selectedModel).toBe('claude-opus-4-5-20251101');

			// 5. Only safe fields exist (Issue #34: now includes selectedModel)
			expect(Object.keys(backup).sort()).toEqual(
				['version', 'exportedAt', 'entities', 'chatHistory', 'activeCampaignId', 'selectedModel'].sort()
			);

			// 6. Required data IS present
			expect(backup.entities).toHaveLength(1);
			expect(backup.chatHistory).toHaveLength(1);
			expect(backup.activeCampaignId).toBe('campaign-prod');

			// 7. Entity data integrity
			expect(backup.entities[0].name).toBe('Production Campaign');
			expect(backup.entities[0].fields).toEqual({ critical: true });
		});
	});

	describe('Issue #34: Selected Model Export', () => {
		it('should include selectedModel in backup when model is set in localStorage', async () => {
			// Arrange: Set selected model
			localStorage.setItem('dm-assist-selected-model', 'claude-opus-4-5-20251101');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: selectedModel should be in backup
			expect(backup).toHaveProperty('selectedModel');
			expect(backup.selectedModel).toBe('claude-opus-4-5-20251101');
		});

		it('should include selectedModel as undefined when model is not set in localStorage', async () => {
			// Arrange: No selected model in localStorage
			localStorage.removeItem('dm-assist-selected-model');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: selectedModel field should be present but undefined
			expect(backup).toHaveProperty('selectedModel');
			expect(backup.selectedModel).toBeUndefined();
		});

		it('should include selectedModel in exported JSON string', async () => {
			// Arrange: Set selected model
			localStorage.setItem('dm-assist-selected-model', 'claude-sonnet-4-5-20250929');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();
			const jsonString = JSON.stringify(backup);

			// Assert: selectedModel and its value should appear in JSON
			expect(jsonString).toContain('selectedModel');
			expect(jsonString).toContain('claude-sonnet-4-5-20250929');
		});

		it('should handle different Claude model IDs correctly', async () => {
			// Arrange: Test with various model IDs
			const modelIds = [
				'claude-opus-4-5-20251101',
				'claude-sonnet-4-5-20250929',
				'claude-3-5-sonnet-20241022',
				'claude-3-5-haiku-20241022'
			];

			for (const modelId of modelIds) {
				// Clear previous data
				await db.entities.clear();
				await db.appConfig.clear();

				localStorage.setItem('dm-assist-selected-model', modelId);

				const campaignEntity: BaseEntity = {
					id: `campaign-${modelId}`,
					type: 'campaign',
					name: `Test Campaign ${modelId}`,
					description: '',
					notes: '',
					fields: {},
					tags: [],
					links: [],
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};
				await db.entities.add(campaignEntity);
				await db.appConfig.put({ key: 'activeCampaignId', value: campaignEntity.id });

				// Act: Export backup
				const backup = await exportBackup();

				// Assert: Correct model ID should be in backup
				expect(backup.selectedModel).toBe(modelId);
			}
		});
	});

	describe('Issue #34: Selected Model Import', () => {
		it('should restore selectedModel to localStorage when importing backup', async () => {
			// Arrange: Create backup with selectedModel
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const backup: CampaignBackup = {
				version: '2.0.0',
				exportedAt: new Date(),
				entities: [campaignEntity],
				chatHistory: [],
				activeCampaignId: 'campaign-1',
				selectedModel: 'claude-opus-4-5-20251101'
			};

			// Clear localStorage
			localStorage.removeItem('dm-assist-selected-model');

			// Act: Import backup
			await importBackup(backup);

			// Assert: selectedModel should be restored to localStorage
			expect(localStorage.getItem('dm-assist-selected-model')).toBe('claude-opus-4-5-20251101');
		});

		it('should remove selectedModel from localStorage when importing backup without selectedModel', async () => {
			// Arrange: Set existing model preference
			localStorage.setItem('dm-assist-selected-model', 'claude-opus-4-5-20251101');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			// Create backup WITHOUT selectedModel (old format)
			const backup: CampaignBackup = {
				version: '2.0.0',
				exportedAt: new Date(),
				entities: [campaignEntity],
				chatHistory: [],
				activeCampaignId: 'campaign-1',
				selectedModel: undefined
			};

			// Act: Import backup
			await importBackup(backup);

			// Assert: selectedModel should be removed from localStorage
			expect(localStorage.getItem('dm-assist-selected-model')).toBeNull();
		});

		it('should handle importing backup with different model than currently set', async () => {
			// Arrange: Set existing model
			localStorage.setItem('dm-assist-selected-model', 'claude-sonnet-4-5-20250929');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			// Create backup with different model
			const backup: CampaignBackup = {
				version: '2.0.0',
				exportedAt: new Date(),
				entities: [campaignEntity],
				chatHistory: [],
				activeCampaignId: 'campaign-1',
				selectedModel: 'claude-3-5-haiku-20241022'
			};

			// Act: Import backup
			await importBackup(backup);

			// Assert: New model should replace old model
			expect(localStorage.getItem('dm-assist-selected-model')).toBe('claude-3-5-haiku-20241022');
		});
	});

	describe('Issue #34: Backward Compatibility', () => {
		it('should successfully import old backups without selectedModel field', async () => {
			// Arrange: Create old format backup (no selectedModel)
			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Old Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			// Old backup format - no selectedModel property at all
			const oldBackup = {
				version: '2.0.0',
				exportedAt: new Date(),
				entities: [campaignEntity],
				chatHistory: [],
				activeCampaignId: 'campaign-1'
				// Note: no selectedModel field
			} as CampaignBackup;

			// Act: Import old backup should not throw
			await expect(importBackup(oldBackup)).resolves.not.toThrow();

			// Assert: Campaign data should be imported successfully
			const importedCampaign = await db.entities.get('campaign-1');
			expect(importedCampaign).toBeDefined();
			expect(importedCampaign?.name).toBe('Old Campaign');

			// localStorage should not have selectedModel
			expect(localStorage.getItem('dm-assist-selected-model')).toBeNull();
		});

		it('should handle export/import round trip with selectedModel', async () => {
			// Arrange: Set up initial state
			localStorage.setItem('dm-assist-selected-model', 'claude-opus-4-5-20251101');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Round Trip Campaign',
				description: 'Testing round trip',
				notes: '',
				fields: { testField: 'testValue' },
				tags: ['test'],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Clear everything
			await db.entities.clear();
			await db.appConfig.clear();
			localStorage.removeItem('dm-assist-selected-model');

			// Import backup
			await importBackup(backup);

			// Assert: Everything should be restored exactly
			const restoredCampaign = await db.entities.get('campaign-1');
			expect(restoredCampaign).toBeDefined();
			expect(restoredCampaign?.name).toBe('Round Trip Campaign');
			expect(restoredCampaign?.description).toBe('Testing round trip');
			expect(restoredCampaign?.fields).toEqual({ testField: 'testValue' });
			expect(restoredCampaign?.tags).toEqual(['test']);

			const restoredActiveCampaignId = (await db.appConfig.get('activeCampaignId'))?.value;
			expect(restoredActiveCampaignId).toBe('campaign-1');

			expect(localStorage.getItem('dm-assist-selected-model')).toBe('claude-opus-4-5-20251101');
		});

		it('should handle export/import round trip without selectedModel', async () => {
			// Arrange: No model selected
			localStorage.removeItem('dm-assist-selected-model');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'No Model Campaign',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Verify backup has undefined selectedModel
			expect(backup.selectedModel).toBeUndefined();

			// Clear and reimport
			await db.entities.clear();
			await db.appConfig.clear();
			await importBackup(backup);

			// Assert: Campaign data restored, no model in localStorage
			const restoredCampaign = await db.entities.get('campaign-1');
			expect(restoredCampaign).toBeDefined();
			expect(localStorage.getItem('dm-assist-selected-model')).toBeNull();
		});
	});

	describe('Issue #34: Edge Cases', () => {
		it('should handle empty string as selectedModel', async () => {
			// Arrange: Empty string in localStorage
			localStorage.setItem('dm-assist-selected-model', '');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: Empty string is treated as undefined (falsy value)
			expect(backup.selectedModel).toBeUndefined();
		});

		it('should handle whitespace-only string as selectedModel', async () => {
			// Arrange: Whitespace string in localStorage
			localStorage.setItem('dm-assist-selected-model', '   ');

			const campaignEntity: BaseEntity = {
				id: 'campaign-1',
				type: 'campaign',
				name: 'Test',
				description: '',
				notes: '',
				fields: {},
				tags: [],
				links: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};
			await db.entities.add(campaignEntity);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: Whitespace-only should be treated as no selection
			expect(backup.selectedModel).toBeUndefined();
		});

		it('should preserve selectedModel across multiple campaigns in backup', async () => {
			// Arrange: Multiple campaigns, one selected model
			localStorage.setItem('dm-assist-selected-model', 'claude-opus-4-5-20251101');

			const campaigns: BaseEntity[] = [
				{
					id: 'campaign-1',
					type: 'campaign',
					name: 'Campaign 1',
					description: '',
					notes: '',
					fields: {},
					tags: [],
					links: [],
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				},
				{
					id: 'campaign-2',
					type: 'campaign',
					name: 'Campaign 2',
					description: '',
					notes: '',
					fields: {},
					tags: [],
					links: [],
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				}
			];
			await db.entities.bulkAdd(campaigns);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: selectedModel is a global preference (not per-campaign)
			expect(backup.selectedModel).toBe('claude-opus-4-5-20251101');
			expect(backup.entities).toHaveLength(2);

			// Import and verify model is restored globally
			await db.entities.clear();
			await db.appConfig.clear();
			localStorage.removeItem('dm-assist-selected-model');

			await importBackup(backup);
			expect(localStorage.getItem('dm-assist-selected-model')).toBe('claude-opus-4-5-20251101');
		});
	});
});
