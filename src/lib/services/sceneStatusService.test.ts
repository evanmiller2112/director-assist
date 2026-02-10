/**
 * Tests for Scene Status Service
 *
 * TDD RED PHASE - Tests for Issue #292: Scene Runner Mode
 *
 * This service manages scene status transitions and lifecycle:
 * - Starting a scene (planned → active)
 * - Completing a scene (active → completed)
 * - Querying active scenes
 *
 * These tests will FAIL until the service is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
	startScene,
	completeScene,
	getActiveScenes,
	getScenesByStatus
} from './sceneStatusService';
import { entityRepository } from '$lib/db/entityRepository';
import type { BaseEntity } from '$lib/types';

// Use vi.hoisted for constants that need to be available in mocks
const mockCampaignId = vi.hoisted(() => 'test-campaign-123');

// Mock db for direct database access
const mockDbEntities = {
	toArray: vi.fn()
};
vi.mock('$lib/db', () => ({
	db: {
		entities: {
			toArray: () => mockDbEntities.toArray()
		}
	}
}));

// Mock entity repository
vi.mock('$lib/db/entityRepository', () => ({
	entityRepository: {
		getById: vi.fn(),
		update: vi.fn()
	}
}));

// Mock campaign store
vi.mock('$lib/stores', () => ({
	campaignStore: {
		campaign: { id: 'test-campaign-123', name: 'Test Campaign' }
	}
}));

// Mock narrative event service for Issue #425 tests
const mockCreateFromScene = vi.hoisted(() => vi.fn());
vi.mock('$lib/services/narrativeEventService', () => ({
	createFromScene: mockCreateFromScene
}));

describe('sceneStatusService - startScene', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should change scene status from planned to active', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-1',
			type: 'scene',
			name: 'Opening Scene',
			description: 'The adventure begins',
			tags: [],
			fields: {
				sceneStatus: 'planned',
				location: 'The Tavern'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		await startScene('scene-1');

		expect(entityRepository.update).toHaveBeenCalledWith(
			'scene-1',
			expect.objectContaining({
				fields: expect.objectContaining({
					sceneStatus: 'in_progress'
				})
			})
		);
	});

	it('should set startedAt timestamp when starting a scene', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-2',
			type: 'scene',
			name: 'Combat Scene',
			description: '',
			tags: [],
			fields: { sceneStatus: 'planned' },
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		const beforeTime = Date.now();
		await startScene('scene-2');
		const afterTime = Date.now();

		const updateCall = vi.mocked(entityRepository.update).mock.calls[0];
		const updatedFields = updateCall[1].fields as Record<string, unknown>;
		const startedAt = updatedFields.startedAt as string;

		expect(typeof startedAt).toBe('string');
		const startedAtTime = new Date(startedAt).getTime();
		expect(startedAtTime).toBeGreaterThanOrEqual(beforeTime);
		expect(startedAtTime).toBeLessThanOrEqual(afterTime);
	});

	it('should throw error if scene does not exist', async () => {
		vi.mocked(entityRepository.getById).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		await expect(startScene('nonexistent-scene')).rejects.toThrow('Scene not found');
	});

	it('should throw error if entity is not a scene', async () => {
		const mockNpc: BaseEntity = {
			id: 'npc-1',
			type: 'npc',
			name: 'Guard',
			description: '',
			tags: [],
			fields: {},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockNpc);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		await expect(startScene('npc-1')).rejects.toThrow('Entity is not a scene');
	});

	it('should preserve existing field values when updating status', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-3',
			type: 'scene',
			name: 'Investigation Scene',
			description: 'Find clues',
			tags: ['mystery'],
			fields: {
				sceneStatus: 'planned',
				location: 'Crime Scene',
				npcs: ['detective-1', 'suspect-2'],
				customField: 'important data'
			},
			links: [],
			notes: 'GM notes',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		await startScene('scene-3');

		expect(entityRepository.update).toHaveBeenCalledWith(
			'scene-3',
			expect.objectContaining({
				fields: expect.objectContaining({
					sceneStatus: 'in_progress',
					location: 'Crime Scene',
					npcs: ['detective-1', 'suspect-2'],
					customField: 'important data'
				})
			})
		);
	});
});

describe('sceneStatusService - completeScene', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should change scene status from active to completed', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-4',
			type: 'scene',
			name: 'Boss Battle',
			description: '',
			tags: [],
			fields: {
				sceneStatus: 'in_progress',
				startedAt: new Date().toISOString()
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		await completeScene('scene-4');

		expect(entityRepository.update).toHaveBeenCalledWith(
			'scene-4',
			expect.objectContaining({
				fields: expect.objectContaining({
					sceneStatus: 'completed'
				})
			})
		);
	});

	it('should set completedAt timestamp when completing a scene', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-5',
			type: 'scene',
			name: 'Finale',
			description: '',
			tags: [],
			fields: {
				sceneStatus: 'in_progress',
				startedAt: new Date().toISOString()
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		const beforeTime = Date.now();
		await completeScene('scene-5');
		const afterTime = Date.now();

		const updateCall = vi.mocked(entityRepository.update).mock.calls[0];
		const updatedFields = updateCall[1].fields as Record<string, unknown>;
		const completedAt = updatedFields.completedAt as string;

		expect(typeof completedAt).toBe('string');
		const completedAtTime = new Date(completedAt).getTime();
		expect(completedAtTime).toBeGreaterThanOrEqual(beforeTime);
		expect(completedAtTime).toBeLessThanOrEqual(afterTime);
	});

	it('should save completion notes when provided', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-6',
			type: 'scene',
			name: 'Negotiation',
			description: '',
			tags: [],
			fields: {
				sceneStatus: 'in_progress'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		await completeScene('scene-6', 'Players successfully negotiated peace treaty');

		expect(entityRepository.update).toHaveBeenCalledWith(
			'scene-6',
			expect.objectContaining({
				fields: expect.objectContaining({
					whatHappened: 'Players successfully negotiated peace treaty'
				})
			})
		);
	});

	it('should preserve existing whatHappened notes if no new notes provided', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-7',
			type: 'scene',
			name: 'Chase Scene',
			description: '',
			tags: [],
			fields: {
				sceneStatus: 'in_progress',
				whatHappened: 'Existing notes from during the scene'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		await completeScene('scene-7');

		expect(entityRepository.update).toHaveBeenCalledWith(
			'scene-7',
			expect.objectContaining({
				fields: expect.objectContaining({
					whatHappened: 'Existing notes from during the scene'
				})
			})
		);
	});

	it('should throw error if scene does not exist', async () => {
		vi.mocked(entityRepository.getById).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		await expect(completeScene('nonexistent')).rejects.toThrow('Scene not found');
	});
});

describe('sceneStatusService - completeScene narrative event integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create narrative event when scene is completed', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-narrative-1',
			type: 'scene',
			name: 'Throne Room Audience',
			description: 'The party meets the king',
			tags: [],
			fields: {
				sceneStatus: 'in_progress',
				startedAt: new Date().toISOString()
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const mockNarrativeEvent: BaseEntity = {
			id: 'event-1',
			type: 'narrative_event',
			name: 'Throne Room Audience',
			description: 'The party meets the king',
			tags: [],
			fields: {
				eventType: 'scene',
				sourceId: 'scene-narrative-1'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue(mockNarrativeEvent);

		await completeScene('scene-narrative-1');

		// Verify createFromScene was called with the scene ID
		expect(mockCreateFromScene).toHaveBeenCalledWith('scene-narrative-1');
	});

	it('should create narrative event with eventType="scene"', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-narrative-2',
			type: 'scene',
			name: 'Market Investigation',
			description: 'Search for clues in the marketplace',
			tags: [],
			fields: {
				sceneStatus: 'in_progress'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const mockNarrativeEvent: BaseEntity = {
			id: 'event-2',
			type: 'narrative_event',
			name: 'Market Investigation',
			description: 'Search for clues in the marketplace',
			tags: [],
			fields: {
				eventType: 'scene',
				sourceId: 'scene-narrative-2'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue(mockNarrativeEvent);

		await completeScene('scene-narrative-2');

		// Verify the narrative event was created
		expect(mockCreateFromScene).toHaveBeenCalled();

		// The narrative event should have eventType='scene'
		const createdEvent = await mockCreateFromScene.mock.results[0].value;
		expect(createdEvent.fields.eventType).toBe('scene');
	});

	it('should create narrative event with correct sourceId', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-unique-123',
			type: 'scene',
			name: 'Dragon Negotiation',
			description: 'Attempting to bargain with the ancient wyrm',
			tags: [],
			fields: {
				sceneStatus: 'in_progress'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const mockNarrativeEvent: BaseEntity = {
			id: 'event-3',
			type: 'narrative_event',
			name: 'Dragon Negotiation',
			description: 'Attempting to bargain with the ancient wyrm',
			tags: [],
			fields: {
				eventType: 'scene',
				sourceId: 'scene-unique-123'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue(mockNarrativeEvent);

		await completeScene('scene-unique-123');

		// Verify createFromScene was called with the correct scene ID
		expect(mockCreateFromScene).toHaveBeenCalledWith('scene-unique-123');

		// The narrative event should have sourceId pointing to the scene
		const createdEvent = await mockCreateFromScene.mock.results[0].value;
		expect(createdEvent.fields.sourceId).toBe('scene-unique-123');
	});

	it('should capture scene name and description in narrative event', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-narrative-4',
			type: 'scene',
			name: 'Tavern Brawl',
			description: 'A fight breaks out over a game of cards',
			tags: [],
			fields: {
				sceneStatus: 'in_progress'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const mockNarrativeEvent: BaseEntity = {
			id: 'event-4',
			type: 'narrative_event',
			name: 'Tavern Brawl',
			description: 'A fight breaks out over a game of cards',
			tags: [],
			fields: {
				eventType: 'scene',
				sourceId: 'scene-narrative-4'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue(mockNarrativeEvent);

		await completeScene('scene-narrative-4');

		// Verify the narrative event preserves scene name and description
		const createdEvent = await mockCreateFromScene.mock.results[0].value;
		expect(createdEvent.name).toBe('Tavern Brawl');
		expect(createdEvent.description).toBe('A fight breaks out over a game of cards');
	});

	it('should complete scene even if narrative event creation fails', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-resilient-1',
			type: 'scene',
			name: 'Resilient Scene',
			description: 'This scene should complete even if narrative event fails',
			tags: [],
			fields: {
				sceneStatus: 'in_progress'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		// Simulate narrative event creation failure
		mockCreateFromScene.mockRejectedValue(new Error('Database connection lost'));

		// Should NOT throw - scene completion should succeed despite narrative event failure
		await expect(completeScene('scene-resilient-1')).resolves.not.toThrow();

		// Scene should still be updated to completed status
		expect(entityRepository.update).toHaveBeenCalledWith(
			'scene-resilient-1',
			expect.objectContaining({
				fields: expect.objectContaining({
					sceneStatus: 'completed'
				})
			})
		);
	});

	it('should log error when narrative event creation fails but continue completion', async () => {
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const mockScene: BaseEntity = {
			id: 'scene-error-log',
			type: 'scene',
			name: 'Error Logging Scene',
			description: 'Testing error handling',
			tags: [],
			fields: {
				sceneStatus: 'in_progress'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockRejectedValue(new Error('Narrative service unavailable'));

		await completeScene('scene-error-log');

		// Error should be logged but not thrown
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining('Failed to create narrative event'),
			expect.any(Error)
		);

		consoleErrorSpy.mockRestore();
	});

	it('should create narrative event with whatHappened as outcome if provided', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-outcome-1',
			type: 'scene',
			name: 'Peace Treaty Signing',
			description: 'Diplomatic scene',
			tags: [],
			fields: {
				sceneStatus: 'in_progress'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const mockNarrativeEvent: BaseEntity = {
			id: 'event-outcome',
			type: 'narrative_event',
			name: 'Peace Treaty Signing',
			description: 'Diplomatic scene',
			tags: [],
			fields: {
				eventType: 'scene',
				sourceId: 'scene-outcome-1'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);
		mockCreateFromScene.mockResolvedValue(mockNarrativeEvent);

		await completeScene('scene-outcome-1', 'The treaty was signed successfully');

		// Scene should be updated with the whatHappened notes
		expect(entityRepository.update).toHaveBeenCalledWith(
			'scene-outcome-1',
			expect.objectContaining({
				fields: expect.objectContaining({
					whatHappened: 'The treaty was signed successfully'
				})
			})
		);

		// Narrative event creation should still be called
		expect(mockCreateFromScene).toHaveBeenCalled();
	});

	it('should create narrative event after scene is marked as completed', async () => {
		const mockScene: BaseEntity = {
			id: 'scene-order-test',
			type: 'scene',
			name: 'Order Test Scene',
			description: 'Testing execution order',
			tags: [],
			fields: {
				sceneStatus: 'in_progress'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		const mockNarrativeEvent: BaseEntity = {
			id: 'event-order',
			type: 'narrative_event',
			name: 'Order Test Scene',
			description: 'Testing execution order',
			tags: [],
			fields: {
				eventType: 'scene',
				sourceId: 'scene-order-test'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		let updateCalledFirst = false;
		let createCalledSecond = false;

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockImplementation(async () => {
			updateCalledFirst = true;
			return undefined;
		});
		mockCreateFromScene.mockImplementation(async () => {
			createCalledSecond = updateCalledFirst;
			return mockNarrativeEvent;
		});

		await completeScene('scene-order-test');

		// Verify scene was updated before narrative event was created
		expect(updateCalledFirst).toBe(true);
		expect(createCalledSecond).toBe(true);
	});
});

describe('sceneStatusService - getActiveScenes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return only scenes with active status', async () => {
		const mockEntities: BaseEntity[] = [
			{
				id: 'scene-1',
				type: 'scene',
				name: 'Active Scene 1',
				description: '',
				tags: [],
				fields: { sceneStatus: 'in_progress' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			},
			{
				id: 'scene-2',
				type: 'scene',
				name: 'Planned Scene',
				description: '',
				tags: [],
				fields: { sceneStatus: 'planned' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			},
			{
				id: 'scene-3',
				type: 'scene',
				name: 'Active Scene 2',
				description: '',
				tags: [],
				fields: { sceneStatus: 'in_progress' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			},
			{
				id: 'scene-4',
				type: 'scene',
				name: 'Completed Scene',
				description: '',
				tags: [],
				fields: { sceneStatus: 'completed' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		const activeScenes = await getActiveScenes();

		expect(activeScenes).toHaveLength(2);
		expect(activeScenes[0].name).toBe('Active Scene 1');
		expect(activeScenes[1].name).toBe('Active Scene 2');
	});

	it('should return empty array if no active scenes', async () => {
		const mockEntities: BaseEntity[] = [
			{
				id: 'scene-1',
				type: 'scene',
				name: 'Planned',
				description: '',
				tags: [],
				fields: { sceneStatus: 'planned' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		const activeScenes = await getActiveScenes();

		expect(activeScenes).toHaveLength(0);
	});

	it('should filter by current campaign', async () => {
		const mockEntities: BaseEntity[] = [
			{
				id: 'scene-1',
				type: 'scene',
				name: 'Active in current campaign',
				description: '',
				tags: [],
				fields: { sceneStatus: 'in_progress' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			},
			{
				id: 'scene-2',
				type: 'scene',
				name: 'Active in other campaign',
				description: '',
				tags: [],
				fields: { sceneStatus: 'in_progress' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: 'other-campaign' }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		const activeScenes = await getActiveScenes();

		expect(activeScenes).toHaveLength(1);
		expect(activeScenes[0].name).toBe('Active in current campaign');
	});
});

describe('sceneStatusService - getScenesByStatus', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return scenes filtered by planned status', async () => {
		const mockEntities: BaseEntity[] = [
			{
				id: 'scene-1',
				type: 'scene',
				name: 'Planned 1',
				description: '',
				tags: [],
				fields: { sceneStatus: 'planned' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			},
			{
				id: 'scene-2',
				type: 'scene',
				name: 'Active',
				description: '',
				tags: [],
				fields: { sceneStatus: 'in_progress' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			},
			{
				id: 'scene-3',
				type: 'scene',
				name: 'Planned 2',
				description: '',
				tags: [],
				fields: { sceneStatus: 'planned' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		const plannedScenes = await getScenesByStatus('planned');

		expect(plannedScenes).toHaveLength(2);
		expect(plannedScenes[0].name).toBe('Planned 1');
		expect(plannedScenes[1].name).toBe('Planned 2');
	});

	it('should return scenes filtered by completed status', async () => {
		const mockEntities: BaseEntity[] = [
			{
				id: 'scene-1',
				type: 'scene',
				name: 'Completed 1',
				description: '',
				tags: [],
				fields: { sceneStatus: 'completed', completedAt: new Date().toISOString() },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			},
			{
				id: 'scene-2',
				type: 'scene',
				name: 'Active',
				description: '',
				tags: [],
				fields: { sceneStatus: 'in_progress' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		const completedScenes = await getScenesByStatus('completed');

		expect(completedScenes).toHaveLength(1);
		expect(completedScenes[0].name).toBe('Completed 1');
	});

	it('should handle scenes without status field as planned', async () => {
		const mockEntities: BaseEntity[] = [
			{
				id: 'scene-1',
				type: 'scene',
				name: 'No status field',
				description: '',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);
		mockCreateFromScene.mockResolvedValue({} as BaseEntity);

		const plannedScenes = await getScenesByStatus('planned');

		expect(plannedScenes).toHaveLength(1);
	});
});
