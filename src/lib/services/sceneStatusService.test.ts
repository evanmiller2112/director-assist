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
				status: 'planned',
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

		await startScene('scene-1');

		expect(entityRepository.update).toHaveBeenCalledWith(
			'scene-1',
			expect.objectContaining({
				fields: expect.objectContaining({
					status: 'active'
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
			fields: { status: 'planned' },
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);

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
				status: 'planned',
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

		await startScene('scene-3');

		expect(entityRepository.update).toHaveBeenCalledWith(
			'scene-3',
			expect.objectContaining({
				fields: expect.objectContaining({
					status: 'active',
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
				status: 'active',
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

		await completeScene('scene-4');

		expect(entityRepository.update).toHaveBeenCalledWith(
			'scene-4',
			expect.objectContaining({
				fields: expect.objectContaining({
					status: 'completed'
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
				status: 'active',
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
				status: 'active'
			},
			links: [],
			notes: '',
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: {}
		};

		vi.mocked(entityRepository.getById).mockResolvedValue(mockScene);
		vi.mocked(entityRepository.update).mockResolvedValue(undefined);

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
				status: 'active',
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

		await expect(completeScene('nonexistent')).rejects.toThrow('Scene not found');
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
				fields: { status: 'active' },
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
				fields: { status: 'planned' },
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
				fields: { status: 'active' },
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
				fields: { status: 'completed' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);

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
				fields: { status: 'planned' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);

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
				fields: { status: 'active' },
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
				fields: { status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: 'other-campaign' }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);

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
				fields: { status: 'planned' },
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
				fields: { status: 'active' },
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
				fields: { status: 'planned' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);

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
				fields: { status: 'completed', completedAt: new Date().toISOString() },
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
				fields: { status: 'active' },
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: { campaignId: mockCampaignId }
			}
		];

		mockDbEntities.toArray.mockResolvedValue(mockEntities);

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

		const plannedScenes = await getScenesByStatus('planned');

		expect(plannedScenes).toHaveLength(1);
	});
});
