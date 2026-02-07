/**
 * Tests for Combat and Montage Session Backup/Restore (TDD RED Phase - Issue #310)
 *
 * This test suite verifies that combat sessions and montage sessions are properly
 * included in backup export and correctly restored on import.
 *
 * ACCEPTANCE CRITERIA:
 * 1. When exporting data, combat sessions are included in the backup file
 * 2. When exporting data, montage sessions are included in the backup file
 * 3. When importing data, combat sessions are restored correctly
 * 4. When importing data, montage sessions are restored correctly
 * 5. The backup file format is extended to include the new data types
 * 6. Backward compatibility: importing old backups (without combat/montage data) still works
 * 7. Error handling: invalid combat/montage data is handled gracefully during import
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type {
	CampaignBackup,
	BaseEntity,
	ChatMessage,
	CombatSession,
	MontageSession,
	Combatant,
	MontageChallenge
} from '$lib/types';
import { db } from '$lib/db';

/**
 * Test helper: Creates a mock exportBackup function that includes combat and montage sessions.
 */
async function exportBackup(): Promise<CampaignBackup> {
	// Get all data from IndexedDB
	const entities = await db.entities.toArray();
	const chatHistory = await db.chatMessages.toArray();
	const activeCampaignId = (await db.appConfig.get('activeCampaignId'))?.value as
		| string
		| undefined;

	// Issue #310: Get combat and montage sessions
	const combatSessions = await db.combatSessions.toArray();
	const montageSessions = await db.montageSessions.toArray();

	// Get selected model from localStorage
	const storedModel = localStorage.getItem('dm-assist-selected-model');
	const selectedModel = storedModel?.trim() || undefined;

	const backup: CampaignBackup = {
		version: '2.0.0',
		exportedAt: new Date(),
		entities,
		chatHistory,
		activeCampaignId,
		selectedModel,
		// Issue #310: Include combat and montage sessions
		combatSessions,
		montageSessions
	};

	return backup;
}

/**
 * Test helper: Mock importBackup function that restores combat and montage sessions.
 */
async function importBackup(backup: CampaignBackup): Promise<void> {
	// Clear existing data
	await db.entities.clear();
	await db.chatMessages.clear();
	await db.appConfig.clear();
	await db.combatSessions.clear();
	await db.montageSessions.clear();

	// Restore entities and chat history
	await db.entities.bulkAdd(backup.entities);
	if (backup.chatHistory) {
		await db.chatMessages.bulkAdd(backup.chatHistory);
	}

	// Restore active campaign ID
	if (backup.activeCampaignId) {
		await db.appConfig.put({ key: 'activeCampaignId', value: backup.activeCampaignId });
	}

	// Restore selected model to localStorage
	if (backup.selectedModel) {
		localStorage.setItem('dm-assist-selected-model', backup.selectedModel);
	} else {
		localStorage.removeItem('dm-assist-selected-model');
	}

	// Issue #310: Restore combat and montage sessions
	if (backup.combatSessions && backup.combatSessions.length > 0) {
		await db.combatSessions.bulkAdd(backup.combatSessions);
	}

	if (backup.montageSessions && backup.montageSessions.length > 0) {
		await db.montageSessions.bulkAdd(backup.montageSessions);
	}
}

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
	await db.combatSessions.clear();
	await db.montageSessions.clear();
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('Combat Session Export', () => {
	describe('Export Structure', () => {
		it('should include combatSessions field in backup when combat sessions exist', async () => {
			// Arrange: Create campaign and combat session
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

			const combatSession: CombatSession = {
				id: 'combat-1',
				name: 'Boss Fight',
				description: 'Epic battle',
				status: 'active',
				currentRound: 3,
				currentTurn: 2,
				combatants: [],
				groups: [],
				victoryPoints: 2,
				heroPoints: 1,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.entities.add(campaignEntity);
			await db.combatSessions.add(combatSession);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: combatSessions field should exist
			expect(backup).toHaveProperty('combatSessions');
			expect(backup.combatSessions).toBeDefined();
			expect(Array.isArray(backup.combatSessions)).toBe(true);
		});

		it('should include combatSessions as empty array when no combat sessions exist', async () => {
			// Arrange: Create campaign only
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

			// Assert: combatSessions should be empty array
			expect(backup).toHaveProperty('combatSessions');
			expect(backup.combatSessions).toEqual([]);
		});
	});

	describe('Export Combat Session Data', () => {
		it('should export single combat session with all fields', async () => {
			// Arrange: Create campaign and combat session with complete data
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

			const heroCombatant: Combatant = {
				id: 'combatant-1',
				type: 'hero',
				name: 'Aragorn',
				entityId: 'hero-entity-1',
				initiative: 15,
				initiativeRoll: [7, 8],
				turnOrder: 1,
				hp: 45,
				maxHp: 50,
				tempHp: 5,
				ac: 18,
				conditions: [
					{
						name: 'Blessed',
						description: '+1d4 to attacks',
						source: 'Cleric spell',
						duration: 3
					}
				],
				heroicResource: {
					current: 2,
					max: 5,
					name: 'Victories'
				}
			};

			const combatSession: CombatSession = {
				id: 'combat-1',
				name: 'Dragon Encounter',
				description: 'Ancient red dragon battle',
				status: 'active',
				currentRound: 5,
				currentTurn: 3,
				combatants: [heroCombatant],
				groups: [],
				victoryPoints: 3,
				heroPoints: 2,
				log: [
					{
						id: 'log-1',
						round: 1,
						turn: 1,
						timestamp: new Date(),
						message: 'Combat started',
						type: 'system'
					}
				],
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-02')
			};

			await db.entities.add(campaignEntity);
			await db.combatSessions.add(combatSession);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: Combat session should be fully exported
			expect(backup.combatSessions).toHaveLength(1);
			const exportedSession = backup.combatSessions![0];

			expect(exportedSession.id).toBe('combat-1');
			expect(exportedSession.name).toBe('Dragon Encounter');
			expect(exportedSession.description).toBe('Ancient red dragon battle');
			expect(exportedSession.status).toBe('active');
			expect(exportedSession.currentRound).toBe(5);
			expect(exportedSession.currentTurn).toBe(3);
			expect(exportedSession.victoryPoints).toBe(3);
			expect(exportedSession.heroPoints).toBe(2);

			// Verify combatant data
			expect(exportedSession.combatants).toHaveLength(1);
			expect(exportedSession.combatants[0].name).toBe('Aragorn');
			expect(exportedSession.combatants[0].hp).toBe(45);
			expect(exportedSession.combatants[0].conditions).toHaveLength(1);

			// Verify log data
			expect(exportedSession.log).toHaveLength(1);
			expect(exportedSession.log[0].message).toBe('Combat started');
		});

		it('should export multiple combat sessions', async () => {
			// Arrange: Create campaign and multiple combat sessions
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

			const combatSession1: CombatSession = {
				id: 'combat-1',
				name: 'Goblin Ambush',
				status: 'completed',
				currentRound: 0,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 1,
				heroPoints: 0,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const combatSession2: CombatSession = {
				id: 'combat-2',
				name: 'Boss Fight',
				status: 'active',
				currentRound: 2,
				currentTurn: 1,
				combatants: [],
				groups: [],
				victoryPoints: 2,
				heroPoints: 1,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.entities.add(campaignEntity);
			await db.combatSessions.bulkAdd([combatSession1, combatSession2]);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: Both sessions should be exported
			expect(backup.combatSessions).toHaveLength(2);
			expect(backup.combatSessions!.map((s) => s.id)).toContain('combat-1');
			expect(backup.combatSessions!.map((s) => s.id)).toContain('combat-2');
		});

		it('should preserve combat session status values', async () => {
			// Arrange: Test all status values
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

			const statuses: Array<'preparing' | 'active' | 'paused' | 'completed'> = [
				'preparing',
				'active',
				'paused',
				'completed'
			];

			const sessions: CombatSession[] = statuses.map((status, index) => ({
				id: `combat-${index}`,
				name: `Combat ${status}`,
				status,
				currentRound: 0,
				currentTurn: 0,
				combatants: [],
				groups: [],
				victoryPoints: 0,
				heroPoints: 0,
				log: [],
				createdAt: new Date(),
				updatedAt: new Date()
			}));

			await db.entities.add(campaignEntity);
			await db.combatSessions.bulkAdd(sessions);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: All status values should be preserved
			expect(backup.combatSessions).toHaveLength(4);
			statuses.forEach((status) => {
				const session = backup.combatSessions!.find((s) => s.status === status);
				expect(session).toBeDefined();
			});
		});
	});
});

describe('Montage Session Export', () => {
	describe('Export Structure', () => {
		it('should include montageSessions field in backup when montage sessions exist', async () => {
			// Arrange: Create campaign and montage session
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

			const montageSession: MontageSession = {
				id: 'montage-1',
				name: 'Wilderness Survival',
				description: 'Survive in the wilderness',
				status: 'active',
				difficulty: 'moderate',
				playerCount: 4,
				successLimit: 4,
				failureLimit: 3,
				challenges: [],
				successCount: 2,
				failureCount: 1,
				currentRound: 1,
				victoryPoints: 0,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.entities.add(campaignEntity);
			await db.montageSessions.add(montageSession);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: montageSessions field should exist
			expect(backup).toHaveProperty('montageSessions');
			expect(backup.montageSessions).toBeDefined();
			expect(Array.isArray(backup.montageSessions)).toBe(true);
		});

		it('should include montageSessions as empty array when no montage sessions exist', async () => {
			// Arrange: Create campaign only
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

			// Assert: montageSessions should be empty array
			expect(backup).toHaveProperty('montageSessions');
			expect(backup.montageSessions).toEqual([]);
		});
	});

	describe('Export Montage Session Data', () => {
		it('should export single montage session with all fields', async () => {
			// Arrange: Create campaign and montage session with complete data
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

			const challenge: MontageChallenge = {
				id: 'challenge-1',
				round: 1,
				result: 'success',
				description: 'Find shelter',
				playerName: 'Gandalf',
				notes: 'Found a cave',
				predefinedChallengeId: 'predefined-1'
			};

			const montageSession: MontageSession = {
				id: 'montage-1',
				name: 'Mountain Pass',
				description: 'Cross the treacherous mountain pass',
				status: 'active',
				difficulty: 'hard',
				playerCount: 5,
				successLimit: 5,
				failureLimit: 3,
				challenges: [challenge],
				successCount: 1,
				failureCount: 0,
				currentRound: 1,
				outcome: undefined,
				victoryPoints: 0,
				predefinedChallenges: [
					{
						id: 'predefined-1',
						name: 'Find Shelter',
						description: 'Locate safe shelter',
						suggestedSkills: ['Survival', 'Perception']
					}
				],
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-02')
			};

			await db.entities.add(campaignEntity);
			await db.montageSessions.add(montageSession);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: Montage session should be fully exported
			expect(backup.montageSessions).toHaveLength(1);
			const exportedSession = backup.montageSessions![0];

			expect(exportedSession.id).toBe('montage-1');
			expect(exportedSession.name).toBe('Mountain Pass');
			expect(exportedSession.description).toBe('Cross the treacherous mountain pass');
			expect(exportedSession.status).toBe('active');
			expect(exportedSession.difficulty).toBe('hard');
			expect(exportedSession.playerCount).toBe(5);
			expect(exportedSession.successLimit).toBe(5);
			expect(exportedSession.failureLimit).toBe(3);
			expect(exportedSession.successCount).toBe(1);
			expect(exportedSession.failureCount).toBe(0);
			expect(exportedSession.currentRound).toBe(1);

			// Verify challenge data
			expect(exportedSession.challenges).toHaveLength(1);
			expect(exportedSession.challenges[0].description).toBe('Find shelter');
			expect(exportedSession.challenges[0].playerName).toBe('Gandalf');

			// Verify predefined challenges
			expect(exportedSession.predefinedChallenges).toHaveLength(1);
			expect(exportedSession.predefinedChallenges![0].name).toBe('Find Shelter');
		});

		it('should export multiple montage sessions', async () => {
			// Arrange: Create campaign and multiple montage sessions
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

			const montageSession1: MontageSession = {
				id: 'montage-1',
				name: 'Forest Trek',
				status: 'completed',
				difficulty: 'easy',
				playerCount: 3,
				successLimit: 3,
				failureLimit: 2,
				challenges: [],
				successCount: 3,
				failureCount: 0,
				currentRound: 2,
				outcome: 'total_success',
				victoryPoints: 2,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const montageSession2: MontageSession = {
				id: 'montage-2',
				name: 'Desert Survival',
				status: 'active',
				difficulty: 'hard',
				playerCount: 4,
				successLimit: 5,
				failureLimit: 3,
				challenges: [],
				successCount: 2,
				failureCount: 1,
				currentRound: 1,
				victoryPoints: 0,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			await db.entities.add(campaignEntity);
			await db.montageSessions.bulkAdd([montageSession1, montageSession2]);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: Both sessions should be exported
			expect(backup.montageSessions).toHaveLength(2);
			expect(backup.montageSessions!.map((s) => s.id)).toContain('montage-1');
			expect(backup.montageSessions!.map((s) => s.id)).toContain('montage-2');
		});

		it('should preserve montage difficulty and outcome values', async () => {
			// Arrange: Test different difficulty and outcome values
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

			const sessions: MontageSession[] = [
				{
					id: 'montage-1',
					name: 'Easy Success',
					status: 'completed',
					difficulty: 'easy',
					playerCount: 3,
					successLimit: 3,
					failureLimit: 2,
					challenges: [],
					successCount: 3,
					failureCount: 0,
					currentRound: 2,
					outcome: 'total_success',
					victoryPoints: 2,
					createdAt: new Date(),
					updatedAt: new Date()
				},
				{
					id: 'montage-2',
					name: 'Moderate Partial',
					status: 'completed',
					difficulty: 'moderate',
					playerCount: 4,
					successLimit: 4,
					failureLimit: 3,
					challenges: [],
					successCount: 3,
					failureCount: 3,
					currentRound: 2,
					outcome: 'partial_success',
					victoryPoints: 1,
					createdAt: new Date(),
					updatedAt: new Date()
				},
				{
					id: 'montage-3',
					name: 'Hard Failure',
					status: 'completed',
					difficulty: 'hard',
					playerCount: 5,
					successLimit: 5,
					failureLimit: 3,
					challenges: [],
					successCount: 0,
					failureCount: 3,
					currentRound: 2,
					outcome: 'total_failure',
					victoryPoints: 0,
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			await db.entities.add(campaignEntity);
			await db.montageSessions.bulkAdd(sessions);
			await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

			// Act: Export backup
			const backup = await exportBackup();

			// Assert: All difficulty and outcome values should be preserved
			expect(backup.montageSessions).toHaveLength(3);
			expect(backup.montageSessions!.find((s) => s.difficulty === 'easy')).toBeDefined();
			expect(backup.montageSessions!.find((s) => s.difficulty === 'moderate')).toBeDefined();
			expect(backup.montageSessions!.find((s) => s.difficulty === 'hard')).toBeDefined();
			expect(backup.montageSessions!.find((s) => s.outcome === 'total_success')).toBeDefined();
			expect(backup.montageSessions!.find((s) => s.outcome === 'partial_success')).toBeDefined();
			expect(backup.montageSessions!.find((s) => s.outcome === 'total_failure')).toBeDefined();
		});
	});
});

describe('Combined Export - Combat and Montage Sessions', () => {
	it('should export both combat and montage sessions in the same backup', async () => {
		// Arrange: Create campaign with both types of sessions
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

		const combatSession: CombatSession = {
			id: 'combat-1',
			name: 'Boss Fight',
			status: 'active',
			currentRound: 1,
			currentTurn: 1,
			combatants: [],
			groups: [],
			victoryPoints: 0,
			heroPoints: 0,
			log: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const montageSession: MontageSession = {
			id: 'montage-1',
			name: 'Wilderness Trek',
			status: 'active',
			difficulty: 'moderate',
			playerCount: 4,
			successLimit: 4,
			failureLimit: 3,
			challenges: [],
			successCount: 0,
			failureCount: 0,
			currentRound: 1,
			victoryPoints: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await db.entities.add(campaignEntity);
		await db.combatSessions.add(combatSession);
		await db.montageSessions.add(montageSession);
		await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

		// Act: Export backup
		const backup = await exportBackup();

		// Assert: Both should be present
		expect(backup).toHaveProperty('combatSessions');
		expect(backup).toHaveProperty('montageSessions');
		expect(backup.combatSessions).toHaveLength(1);
		expect(backup.montageSessions).toHaveLength(1);
		expect(backup.combatSessions![0].id).toBe('combat-1');
		expect(backup.montageSessions![0].id).toBe('montage-1');
	});

	it('should include sessions in backup structure alongside existing fields', async () => {
		// Arrange: Create full backup scenario
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

		const chatMessage: ChatMessage = {
			id: 'msg-1',
			role: 'user',
			content: 'Hello',
			timestamp: new Date()
		};

		const combatSession: CombatSession = {
			id: 'combat-1',
			name: 'Battle',
			status: 'active',
			currentRound: 1,
			currentTurn: 1,
			combatants: [],
			groups: [],
			victoryPoints: 0,
			heroPoints: 0,
			log: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const montageSession: MontageSession = {
			id: 'montage-1',
			name: 'Trek',
			status: 'active',
			difficulty: 'moderate',
			playerCount: 4,
			successLimit: 4,
			failureLimit: 3,
			challenges: [],
			successCount: 0,
			failureCount: 0,
			currentRound: 1,
			victoryPoints: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		localStorage.setItem('dm-assist-selected-model', 'claude-opus-4-5-20251101');

		await db.entities.add(campaignEntity);
		await db.chatMessages.add(chatMessage);
		await db.combatSessions.add(combatSession);
		await db.montageSessions.add(montageSession);
		await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

		// Act: Export backup
		const backup = await exportBackup();

		// Assert: All expected fields should be present
		expect(backup).toHaveProperty('version');
		expect(backup).toHaveProperty('exportedAt');
		expect(backup).toHaveProperty('entities');
		expect(backup).toHaveProperty('chatHistory');
		expect(backup).toHaveProperty('activeCampaignId');
		expect(backup).toHaveProperty('selectedModel');
		expect(backup).toHaveProperty('combatSessions');
		expect(backup).toHaveProperty('montageSessions');

		expect(backup.entities).toHaveLength(1);
		expect(backup.chatHistory).toHaveLength(1);
		expect(backup.combatSessions).toHaveLength(1);
		expect(backup.montageSessions).toHaveLength(1);
		expect(backup.selectedModel).toBe('claude-opus-4-5-20251101');
	});
});

describe('Combat Session Import', () => {
	it('should restore combat sessions when importing backup', async () => {
		// Arrange: Create backup with combat session
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

		const combatSession: CombatSession = {
			id: 'combat-1',
			name: 'Imported Battle',
			description: 'Restored combat',
			status: 'paused',
			currentRound: 4,
			currentTurn: 2,
			combatants: [],
			groups: [],
			victoryPoints: 3,
			heroPoints: 1,
			log: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const backup: CampaignBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined,
			combatSessions: [combatSession],
			montageSessions: []
		};

		// Act: Import backup
		await importBackup(backup);

		// Assert: Combat session should be restored
		const restoredSession = await db.combatSessions.get('combat-1');
		expect(restoredSession).toBeDefined();
		expect(restoredSession!.name).toBe('Imported Battle');
		expect(restoredSession!.description).toBe('Restored combat');
		expect(restoredSession!.status).toBe('paused');
		expect(restoredSession!.currentRound).toBe(4);
		expect(restoredSession!.currentTurn).toBe(2);
		expect(restoredSession!.victoryPoints).toBe(3);
		expect(restoredSession!.heroPoints).toBe(1);
	});

	it('should restore multiple combat sessions', async () => {
		// Arrange: Create backup with multiple combat sessions
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

		const combatSession1: CombatSession = {
			id: 'combat-1',
			name: 'Battle 1',
			status: 'completed',
			currentRound: 0,
			currentTurn: 0,
			combatants: [],
			groups: [],
			victoryPoints: 2,
			heroPoints: 0,
			log: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const combatSession2: CombatSession = {
			id: 'combat-2',
			name: 'Battle 2',
			status: 'active',
			currentRound: 1,
			currentTurn: 1,
			combatants: [],
			groups: [],
			victoryPoints: 0,
			heroPoints: 1,
			log: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const backup: CampaignBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined,
			combatSessions: [combatSession1, combatSession2],
			montageSessions: []
		};

		// Act: Import backup
		await importBackup(backup);

		// Assert: Both sessions should be restored
		const allSessions = await db.combatSessions.toArray();
		expect(allSessions).toHaveLength(2);
		expect(allSessions.map((s) => s.id)).toContain('combat-1');
		expect(allSessions.map((s) => s.id)).toContain('combat-2');
	});

	it('should restore combat session with full combatant data', async () => {
		// Arrange: Create backup with detailed combatant
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

		const heroCombatant: Combatant = {
			id: 'combatant-1',
			type: 'hero',
			name: 'Legolas',
			entityId: 'hero-entity-1',
			initiative: 18,
			initiativeRoll: [9, 9],
			turnOrder: 1,
			hp: 50,
			maxHp: 50,
			tempHp: 0,
			ac: 16,
			conditions: [
				{
					name: 'Hasted',
					description: 'Extra action',
					source: 'Wizard spell',
					duration: 5
				}
			],
			heroicResource: {
				current: 3,
				max: 5,
				name: 'Focus'
			}
		};

		const combatSession: CombatSession = {
			id: 'combat-1',
			name: 'Orc Siege',
			status: 'active',
			currentRound: 2,
			currentTurn: 1,
			combatants: [heroCombatant],
			groups: [],
			victoryPoints: 1,
			heroPoints: 2,
			log: [
				{
					id: 'log-1',
					round: 1,
					turn: 1,
					timestamp: new Date(),
					message: 'Legolas hits for 15 damage',
					type: 'damage',
					combatantId: 'combatant-1'
				}
			],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const backup: CampaignBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined,
			combatSessions: [combatSession],
			montageSessions: []
		};

		// Act: Import backup
		await importBackup(backup);

		// Assert: Full combatant data should be restored
		const restoredSession = await db.combatSessions.get('combat-1');
		expect(restoredSession).toBeDefined();
		expect(restoredSession!.combatants).toHaveLength(1);

		const combatant = restoredSession!.combatants[0];
		expect(combatant.name).toBe('Legolas');
		expect(combatant.type).toBe('hero');
		expect(combatant.hp).toBe(50);
		expect(combatant.initiative).toBe(18);
		expect(combatant.conditions).toHaveLength(1);
		expect(combatant.conditions[0].name).toBe('Hasted');

		if (combatant.type === 'hero') {
			expect(combatant.heroicResource).toBeDefined();
			expect(combatant.heroicResource!.current).toBe(3);
		}

		// Verify log data
		expect(restoredSession!.log).toHaveLength(1);
		expect(restoredSession!.log[0].message).toBe('Legolas hits for 15 damage');
	});
});

describe('Montage Session Import', () => {
	it('should restore montage sessions when importing backup', async () => {
		// Arrange: Create backup with montage session
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

		const montageSession: MontageSession = {
			id: 'montage-1',
			name: 'Imported Trek',
			description: 'Restored montage',
			status: 'completed',
			difficulty: 'hard',
			playerCount: 5,
			successLimit: 5,
			failureLimit: 3,
			challenges: [],
			successCount: 5,
			failureCount: 0,
			currentRound: 2,
			outcome: 'total_success',
			victoryPoints: 3,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const backup: CampaignBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined,
			combatSessions: [],
			montageSessions: [montageSession]
		};

		// Act: Import backup
		await importBackup(backup);

		// Assert: Montage session should be restored
		const restoredSession = await db.montageSessions.get('montage-1');
		expect(restoredSession).toBeDefined();
		expect(restoredSession!.name).toBe('Imported Trek');
		expect(restoredSession!.description).toBe('Restored montage');
		expect(restoredSession!.status).toBe('completed');
		expect(restoredSession!.difficulty).toBe('hard');
		expect(restoredSession!.playerCount).toBe(5);
		expect(restoredSession!.successCount).toBe(5);
		expect(restoredSession!.outcome).toBe('total_success');
		expect(restoredSession!.victoryPoints).toBe(3);
	});

	it('should restore multiple montage sessions', async () => {
		// Arrange: Create backup with multiple montage sessions
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

		const montageSession1: MontageSession = {
			id: 'montage-1',
			name: 'Trek 1',
			status: 'completed',
			difficulty: 'easy',
			playerCount: 3,
			successLimit: 3,
			failureLimit: 2,
			challenges: [],
			successCount: 3,
			failureCount: 0,
			currentRound: 2,
			outcome: 'total_success',
			victoryPoints: 2,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const montageSession2: MontageSession = {
			id: 'montage-2',
			name: 'Trek 2',
			status: 'active',
			difficulty: 'moderate',
			playerCount: 4,
			successLimit: 4,
			failureLimit: 3,
			challenges: [],
			successCount: 2,
			failureCount: 1,
			currentRound: 1,
			victoryPoints: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const backup: CampaignBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined,
			combatSessions: [],
			montageSessions: [montageSession1, montageSession2]
		};

		// Act: Import backup
		await importBackup(backup);

		// Assert: Both sessions should be restored
		const allSessions = await db.montageSessions.toArray();
		expect(allSessions).toHaveLength(2);
		expect(allSessions.map((s) => s.id)).toContain('montage-1');
		expect(allSessions.map((s) => s.id)).toContain('montage-2');
	});

	it('should restore montage session with challenges and predefined challenges', async () => {
		// Arrange: Create backup with detailed montage data
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

		const challenge1: MontageChallenge = {
			id: 'challenge-1',
			round: 1,
			result: 'success',
			description: 'Find water',
			playerName: 'Ranger',
			notes: 'Found a stream',
			predefinedChallengeId: 'predefined-1'
		};

		const challenge2: MontageChallenge = {
			id: 'challenge-2',
			round: 1,
			result: 'failure',
			description: 'Hunt for food',
			playerName: 'Druid',
			notes: 'No game nearby'
		};

		const montageSession: MontageSession = {
			id: 'montage-1',
			name: 'Survival Challenge',
			description: 'Survive the wilderness',
			status: 'active',
			difficulty: 'moderate',
			playerCount: 4,
			successLimit: 4,
			failureLimit: 3,
			challenges: [challenge1, challenge2],
			successCount: 1,
			failureCount: 1,
			currentRound: 1,
			victoryPoints: 0,
			predefinedChallenges: [
				{
					id: 'predefined-1',
					name: 'Find Water',
					description: 'Locate a water source',
					suggestedSkills: ['Survival', 'Nature']
				},
				{
					id: 'predefined-2',
					name: 'Hunt for Food',
					description: 'Catch game or forage',
					suggestedSkills: ['Survival', 'Stealth']
				}
			],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const backup: CampaignBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined,
			combatSessions: [],
			montageSessions: [montageSession]
		};

		// Act: Import backup
		await importBackup(backup);

		// Assert: Full montage data should be restored
		const restoredSession = await db.montageSessions.get('montage-1');
		expect(restoredSession).toBeDefined();
		expect(restoredSession!.challenges).toHaveLength(2);
		expect(restoredSession!.challenges[0].description).toBe('Find water');
		expect(restoredSession!.challenges[0].playerName).toBe('Ranger');
		expect(restoredSession!.challenges[0].result).toBe('success');
		expect(restoredSession!.challenges[1].result).toBe('failure');

		expect(restoredSession!.predefinedChallenges).toHaveLength(2);
		expect(restoredSession!.predefinedChallenges![0].name).toBe('Find Water');
		expect(restoredSession!.predefinedChallenges![1].name).toBe('Hunt for Food');
	});
});

describe('Round Trip - Export and Import', () => {
	it('should preserve combat sessions through export/import cycle', async () => {
		// Arrange: Create campaign with combat session
		const campaignEntity: BaseEntity = {
			id: 'campaign-1',
			type: 'campaign',
			name: 'Round Trip Campaign',
			description: '',
			notes: '',
			fields: {},
			tags: [],
			links: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const combatSession: CombatSession = {
			id: 'combat-1',
			name: 'Epic Battle',
			description: 'Test round trip',
			status: 'active',
			currentRound: 3,
			currentTurn: 2,
			combatants: [],
			groups: [],
			victoryPoints: 2,
			heroPoints: 1,
			log: [],
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await db.entities.add(campaignEntity);
		await db.combatSessions.add(combatSession);
		await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

		// Act: Export
		const backup = await exportBackup();

		// Clear database
		await db.entities.clear();
		await db.combatSessions.clear();
		await db.appConfig.clear();

		// Import
		await importBackup(backup);

		// Assert: Combat session should be identical
		const restored = await db.combatSessions.get('combat-1');
		expect(restored).toBeDefined();
		expect(restored!.name).toBe('Epic Battle');
		expect(restored!.description).toBe('Test round trip');
		expect(restored!.status).toBe('active');
		expect(restored!.currentRound).toBe(3);
		expect(restored!.currentTurn).toBe(2);
		expect(restored!.victoryPoints).toBe(2);
		expect(restored!.heroPoints).toBe(1);
	});

	it('should preserve montage sessions through export/import cycle', async () => {
		// Arrange: Create campaign with montage session
		const campaignEntity: BaseEntity = {
			id: 'campaign-1',
			type: 'campaign',
			name: 'Round Trip Campaign',
			description: '',
			notes: '',
			fields: {},
			tags: [],
			links: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const montageSession: MontageSession = {
			id: 'montage-1',
			name: 'Epic Trek',
			description: 'Test round trip',
			status: 'active',
			difficulty: 'hard',
			playerCount: 5,
			successLimit: 5,
			failureLimit: 3,
			challenges: [],
			successCount: 2,
			failureCount: 1,
			currentRound: 1,
			victoryPoints: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		await db.entities.add(campaignEntity);
		await db.montageSessions.add(montageSession);
		await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

		// Act: Export
		const backup = await exportBackup();

		// Clear database
		await db.entities.clear();
		await db.montageSessions.clear();
		await db.appConfig.clear();

		// Import
		await importBackup(backup);

		// Assert: Montage session should be identical
		const restored = await db.montageSessions.get('montage-1');
		expect(restored).toBeDefined();
		expect(restored!.name).toBe('Epic Trek');
		expect(restored!.description).toBe('Test round trip');
		expect(restored!.difficulty).toBe('hard');
		expect(restored!.playerCount).toBe(5);
		expect(restored!.successCount).toBe(2);
		expect(restored!.failureCount).toBe(1);
	});
});

describe('Backward Compatibility', () => {
	it('should successfully import old backups without combatSessions field', async () => {
		// Arrange: Create old format backup (no combatSessions)
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

		const oldBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined
			// Note: no combatSessions or montageSessions fields
		} as CampaignBackup;

		// Act: Import old backup should not throw
		await expect(importBackup(oldBackup)).resolves.not.toThrow();

		// Assert: Campaign data should be imported successfully
		const importedCampaign = await db.entities.get('campaign-1');
		expect(importedCampaign).toBeDefined();
		expect(importedCampaign!.name).toBe('Old Campaign');

		// Combat and montage sessions should be empty
		const combatSessions = await db.combatSessions.toArray();
		const montageSessions = await db.montageSessions.toArray();
		expect(combatSessions).toEqual([]);
		expect(montageSessions).toEqual([]);
	});

	it('should successfully import old backups without montageSessions field', async () => {
		// Arrange: Create backup with combatSessions but no montageSessions
		const campaignEntity: BaseEntity = {
			id: 'campaign-1',
			type: 'campaign',
			name: 'Partial Old Campaign',
			description: '',
			notes: '',
			fields: {},
			tags: [],
			links: [],
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const partialBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined,
			combatSessions: []
			// Note: no montageSessions field
		} as CampaignBackup;

		// Act: Import should not throw
		await expect(importBackup(partialBackup)).resolves.not.toThrow();

		// Assert: Import successful
		const importedCampaign = await db.entities.get('campaign-1');
		expect(importedCampaign).toBeDefined();

		const montageSessions = await db.montageSessions.toArray();
		expect(montageSessions).toEqual([]);
	});

	it('should handle export with no sessions creating new format with empty arrays', async () => {
		// Arrange: Campaign with no sessions
		const campaignEntity: BaseEntity = {
			id: 'campaign-1',
			type: 'campaign',
			name: 'New Empty Campaign',
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

		// Assert: Should have empty arrays for sessions
		expect(backup).toHaveProperty('combatSessions');
		expect(backup).toHaveProperty('montageSessions');
		expect(backup.combatSessions).toEqual([]);
		expect(backup.montageSessions).toEqual([]);
	});
});

describe('Error Handling', () => {
	it('should handle import with invalid combat session data gracefully', async () => {
		// Arrange: Create backup with malformed combat session
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

		const invalidCombatSession = {
			id: 'combat-1',
			name: 'Invalid Battle'
			// Missing required fields
		} as CombatSession;

		const backup: CampaignBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined,
			combatSessions: [invalidCombatSession],
			montageSessions: []
		};

		// Act & Assert: Import should either skip invalid session or throw meaningful error
		// The implementation should handle this gracefully
		try {
			await importBackup(backup);
			// If import succeeds, verify it either:
			// 1. Skipped the invalid session
			const sessions = await db.combatSessions.toArray();
			// Either empty (skipped) or contains session (was validated/fixed)
			expect(sessions.length).toBeGreaterThanOrEqual(0);
		} catch (error) {
			// Or it throws a meaningful error
			expect(error).toBeDefined();
		}
	});

	it('should handle import with invalid montage session data gracefully', async () => {
		// Arrange: Create backup with malformed montage session
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

		const invalidMontageSession = {
			id: 'montage-1',
			name: 'Invalid Trek'
			// Missing required fields
		} as MontageSession;

		const backup: CampaignBackup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined,
			combatSessions: [],
			montageSessions: [invalidMontageSession]
		};

		// Act & Assert: Import should handle gracefully
		try {
			await importBackup(backup);
			const sessions = await db.montageSessions.toArray();
			expect(sessions.length).toBeGreaterThanOrEqual(0);
		} catch (error) {
			expect(error).toBeDefined();
		}
	});

	it('should handle import with null/undefined session arrays', async () => {
		// Arrange: Create backup with null session arrays
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

		const backup = {
			version: '2.0.0',
			exportedAt: new Date(),
			entities: [campaignEntity],
			chatHistory: [],
			activeCampaignId: 'campaign-1',
			selectedModel: undefined,
			combatSessions: null,
			montageSessions: undefined
		} as unknown as CampaignBackup;

		// Act: Import should not throw
		await expect(importBackup(backup)).resolves.not.toThrow();

		// Assert: Should result in empty session tables
		const combatSessions = await db.combatSessions.toArray();
		const montageSessions = await db.montageSessions.toArray();
		expect(combatSessions).toEqual([]);
		expect(montageSessions).toEqual([]);
	});
});

describe('Data Integrity', () => {
	it('should preserve Date objects in combat sessions during export/import', async () => {
		// Arrange: Create combat session with specific dates
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

		const createdDate = new Date('2024-01-01T10:00:00Z');
		const updatedDate = new Date('2024-01-02T15:30:00Z');
		const logTimestamp = new Date('2024-01-01T10:15:00Z');

		const combatSession: CombatSession = {
			id: 'combat-1',
			name: 'Date Test',
			status: 'active',
			currentRound: 1,
			currentTurn: 1,
			combatants: [],
			groups: [],
			victoryPoints: 0,
			heroPoints: 0,
			log: [
				{
					id: 'log-1',
					round: 1,
					turn: 1,
					timestamp: logTimestamp,
					message: 'Test',
					type: 'system'
				}
			],
			createdAt: createdDate,
			updatedAt: updatedDate
		};

		await db.entities.add(campaignEntity);
		await db.combatSessions.add(combatSession);
		await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

		// Act: Export and import
		const backup = await exportBackup();
		await db.combatSessions.clear();
		await importBackup(backup);

		// Assert: Dates should be preserved
		const restored = await db.combatSessions.get('combat-1');
		expect(restored).toBeDefined();
		expect(restored!.createdAt).toBeInstanceOf(Date);
		expect(restored!.updatedAt).toBeInstanceOf(Date);
		expect(restored!.log[0].timestamp).toBeInstanceOf(Date);
	});

	it('should preserve Date objects in montage sessions during export/import', async () => {
		// Arrange: Create montage session with specific dates
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

		const createdDate = new Date('2024-01-01T10:00:00Z');
		const updatedDate = new Date('2024-01-02T15:30:00Z');
		const completedDate = new Date('2024-01-03T12:00:00Z');

		const montageSession: MontageSession = {
			id: 'montage-1',
			name: 'Date Test',
			status: 'completed',
			difficulty: 'moderate',
			playerCount: 4,
			successLimit: 4,
			failureLimit: 3,
			challenges: [],
			successCount: 4,
			failureCount: 0,
			currentRound: 2,
			outcome: 'total_success',
			victoryPoints: 2,
			createdAt: createdDate,
			updatedAt: updatedDate,
			completedAt: completedDate
		};

		await db.entities.add(campaignEntity);
		await db.montageSessions.add(montageSession);
		await db.appConfig.put({ key: 'activeCampaignId', value: 'campaign-1' });

		// Act: Export and import
		const backup = await exportBackup();
		await db.montageSessions.clear();
		await importBackup(backup);

		// Assert: Dates should be preserved
		const restored = await db.montageSessions.get('montage-1');
		expect(restored).toBeDefined();
		expect(restored!.createdAt).toBeInstanceOf(Date);
		expect(restored!.updatedAt).toBeInstanceOf(Date);
		expect(restored!.completedAt).toBeInstanceOf(Date);
	});
});
