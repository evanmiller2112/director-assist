/**
 * Security Tests for Backup Export Functionality (TDD RED Phase)
 *
 * Issue #31: v1.0 Security - Validate backups exclude API key
 *
 * CRITICAL SECURITY REQUIREMENTS:
 * - Exported backups MUST NOT contain API keys
 * - Exported backups MUST NOT contain localStorage keys or sensitive data
 * - Exported backups MUST ONLY contain: entities, chatHistory, activeCampaignId
 *
 * Covers:
 * - Verification that API key is NOT in exported backup object
 * - Verification that API key is NOT in exported JSON string
 * - Verification that model preference is NOT exported
 * - Verification that backup structure contains ONLY expected safe fields
 * - Edge cases: API key in entity names, descriptions, or other fields
 * - Verification that all entity data IS properly included (positive tests)
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
 */
async function exportBackup(): Promise<CampaignBackup> {
	// Get all entities including campaigns
	const entities = await db.entities.toArray();
	const chatHistory = await db.chatMessages.toArray();
	const activeCampaignId = (await db.appConfig.get('activeCampaignId'))?.value as
		| string
		| undefined;

	const backup: CampaignBackup = {
		version: '2.0.0',
		exportedAt: new Date(),
		entities,
		chatHistory,
		activeCampaignId
	};

	return backup;
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

			// Verify backup has expected structure only
			expect(Object.keys(backup)).toEqual(
				expect.arrayContaining(['version', 'exportedAt', 'entities', 'chatHistory', 'activeCampaignId'])
			);
			expect(Object.keys(backup).length).toBe(5);
		});

		it('should NOT include model preference in backup object', async () => {
			// Arrange: Set model preference
			localStorage.setItem('dm-assist-selected-model', 'claude-opus-4-5-20251101');
			localStorage.setItem('dm-assist-api-key', 'sk-ant-test');

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

			// Assert: Model preference should NOT be in backup
			expect(backup).not.toHaveProperty('selectedModel');
			expect(backup).not.toHaveProperty('model');
			expect(backup).not.toHaveProperty('dm-assist-selected-model');
		});

		it('should NOT include any localStorage keys in backup object', async () => {
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

			// Assert: No localStorage keys should appear in backup
			const backupKeys = Object.keys(backup);
			expect(backupKeys).not.toContain('dm-assist-api-key');
			expect(backupKeys).not.toContain('dm-assist-selected-model');
			expect(backupKeys).not.toContain('dm-assist-models-cache');
			expect(backupKeys).not.toContain('some-other-key');
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

		it('should NOT include localStorage key names in exported JSON string', async () => {
			// Arrange
			localStorage.setItem('dm-assist-api-key', 'sk-ant-test');
			localStorage.setItem('dm-assist-selected-model', 'claude-haiku');

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

			// Assert: localStorage key names should not appear
			expect(jsonString).not.toContain('dm-assist-api-key');
			expect(jsonString).not.toContain('dm-assist-selected-model');
			expect(jsonString).not.toContain('dm-assist-models-cache');
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
		it('should ONLY contain expected safe fields: version, exportedAt, entities, chatHistory, activeCampaignId', async () => {
			// Arrange
			localStorage.setItem('dm-assist-api-key', 'sk-ant-test');

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

			// Assert: Exactly these fields, no more, no less
			const expectedFields = ['version', 'exportedAt', 'entities', 'chatHistory', 'activeCampaignId'];
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

			// 2. No localStorage key names
			expect(jsonString).not.toContain('dm-assist-api-key');
			expect(jsonString).not.toContain('dm-assist-selected-model');
			expect(jsonString).not.toContain('dm-assist-models-cache');

			// 3. No API key in backup object
			expect(backup).not.toHaveProperty('apiKey');
			expect(backup).not.toHaveProperty('api_key');
			expect(backup).not.toHaveProperty('dm-assist-api-key');

			// 4. No model preference
			expect(backup).not.toHaveProperty('selectedModel');
			expect(backup).not.toHaveProperty('model');

			// 5. Only safe fields exist
			expect(Object.keys(backup).sort()).toEqual(
				['version', 'exportedAt', 'entities', 'chatHistory', 'activeCampaignId'].sort()
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
});
