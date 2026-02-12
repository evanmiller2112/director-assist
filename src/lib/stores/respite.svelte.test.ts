/**
 * Tests for Respite Store (Svelte 5 Runes)
 *
 * TDD RED PHASE - These tests define the expected behavior of the respite store.
 *
 * The store manages reactive state for Draw Steel respite sessions including:
 * - Reactive respite list with live queries
 * - Active respite selection
 * - Derived values (filtered lists, hero stats, VP stats, activity stats)
 * - All repository operations wrapped with reactive state updates
 * - Loading and error state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
	RespiteSession,
	CreateRespiteInput,
	UpdateRespiteInput,
	RecordActivityInput,
	RespiteHero,
	RespiteActivity
} from '$lib/types/respite';

/**
 * Helper function to create mock respite sessions for testing.
 */
function createMockRespite(overrides?: Partial<RespiteSession>): RespiteSession {
	const now = new Date();
	return {
		id: 'respite-' + Math.random(),
		name: 'Test Respite',
		description: 'Test description',
		status: 'preparing',
		heroes: [
			{
				id: 'hero-1',
				name: 'Valora',
				recoveries: { current: 3, max: 8, gained: 0 }
			},
			{
				id: 'hero-2',
				name: 'Kael',
				recoveries: { current: 6, max: 6, gained: 0 }
			}
		],
		victoryPointsAvailable: 10,
		victoryPointsConverted: 0,
		activities: [],
		kitSwaps: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

// ============================================================================
// Mock the respite repository
// ============================================================================

const mockGetAll = vi.fn(() => ({
	subscribe: vi.fn((observer: any) => {
		observer.next([]);
		return {
			unsubscribe: vi.fn()
		};
	})
}));

const mockCreate = vi.fn();
const mockGetById = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockStartRespite = vi.fn();
const mockCompleteRespite = vi.fn();
const mockAddHero = vi.fn();
const mockUpdateHero = vi.fn();
const mockRemoveHero = vi.fn();
const mockRecordActivity = vi.fn();
const mockUpdateActivity = vi.fn();
const mockCompleteActivity = vi.fn();
const mockConvertVictoryPoints = vi.fn();
const mockRecordKitSwap = vi.fn();

vi.mock('$lib/db/repositories/respiteRepository', () => ({
	respiteRepository: {
		getAll: mockGetAll,
		create: mockCreate,
		getById: mockGetById,
		update: mockUpdate,
		delete: mockDelete,
		startRespite: mockStartRespite,
		completeRespite: mockCompleteRespite,
		addHero: mockAddHero,
		updateHero: mockUpdateHero,
		removeHero: mockRemoveHero,
		recordActivity: mockRecordActivity,
		updateActivity: mockUpdateActivity,
		completeActivity: mockCompleteActivity,
		convertVictoryPoints: mockConvertVictoryPoints,
		recordKitSwap: mockRecordKitSwap
	}
}));

// ============================================================================
// Test Suite
// ============================================================================

describe('Respite Store - Initial State and Reactivity', () => {
	let respiteStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		const module = await import('./respite.svelte');
		respiteStore = module.respiteStore;
	});

	it('should have empty initial state', () => {
		expect(respiteStore.respites).toEqual([]);
		expect(respiteStore.activeRespite).toBeNull();
		expect(respiteStore.isLoading).toBe(false);
		expect(respiteStore.error).toBeNull();
	});

	it('should have empty derived values initially', () => {
		expect(respiteStore.activeRespites).toEqual([]);
		expect(respiteStore.preparingRespites).toEqual([]);
		expect(respiteStore.completedRespites).toEqual([]);
		expect(respiteStore.heroCount).toBe(0);
		expect(respiteStore.fullyRestedHeroes).toEqual([]);
		expect(respiteStore.vpRemaining).toBe(0);
		expect(respiteStore.vpConversionPercent).toBe(0);
		expect(respiteStore.pendingActivities).toEqual([]);
		expect(respiteStore.inProgressActivities).toEqual([]);
		expect(respiteStore.completedActivities).toEqual([]);
		expect(respiteStore.kitSwapHistory).toEqual([]);
	});
});

describe('Respite Store - CRUD Operations', () => {
	let respiteStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		const module = await import('./respite.svelte');
		respiteStore = module.respiteStore;
	});

	describe('createRespite', () => {
		it('should call repository create and return result', async () => {
			const mockResult = createMockRespite({ name: 'New Respite' });
			mockCreate.mockResolvedValue(mockResult);

			const result = await respiteStore.createRespite({ name: 'New Respite' });

			expect(mockCreate).toHaveBeenCalledWith({ name: 'New Respite' });
			expect(result.name).toBe('New Respite');
		});

		it('should set error on failure', async () => {
			mockCreate.mockRejectedValue(new Error('Create failed'));

			await expect(respiteStore.createRespite({ name: 'Test' })).rejects.toThrow(
				'Create failed'
			);
			expect(respiteStore.error).toBe('Create failed');
		});
	});

	describe('selectRespite', () => {
		it('should set active respite from repository', async () => {
			const mockResult = createMockRespite({ id: 'test-id' });
			mockGetById.mockResolvedValue(mockResult);

			await respiteStore.selectRespite('test-id');

			expect(respiteStore.activeRespite).toBeDefined();
			expect(respiteStore.activeRespite.id).toBe('test-id');
		});

		it('should set active respite to null for missing ID', async () => {
			mockGetById.mockResolvedValue(undefined);

			await respiteStore.selectRespite('missing');

			expect(respiteStore.activeRespite).toBeNull();
		});
	});

	describe('updateRespite', () => {
		it('should call repository update', async () => {
			const mockResult = createMockRespite({ name: 'Updated' });
			mockUpdate.mockResolvedValue(mockResult);

			await respiteStore.updateRespite('test-id', { name: 'Updated' });

			expect(mockUpdate).toHaveBeenCalledWith('test-id', { name: 'Updated' });
		});

		it('should update active respite if matching', async () => {
			const initial = createMockRespite({ id: 'test-id', name: 'Original' });
			mockGetById.mockResolvedValue(initial);
			await respiteStore.selectRespite('test-id');

			const updated = { ...initial, name: 'Updated' };
			mockUpdate.mockResolvedValue(updated);
			await respiteStore.updateRespite('test-id', { name: 'Updated' });

			expect(respiteStore.activeRespite.name).toBe('Updated');
		});
	});

	describe('deleteRespite', () => {
		it('should call repository delete', async () => {
			mockDelete.mockResolvedValue(undefined);

			await respiteStore.deleteRespite('test-id');

			expect(mockDelete).toHaveBeenCalledWith('test-id');
		});

		it('should clear active respite if matching', async () => {
			const mock = createMockRespite({ id: 'test-id' });
			mockGetById.mockResolvedValue(mock);
			await respiteStore.selectRespite('test-id');

			mockDelete.mockResolvedValue(undefined);
			await respiteStore.deleteRespite('test-id');

			expect(respiteStore.activeRespite).toBeNull();
		});
	});
});

describe('Respite Store - Lifecycle Operations', () => {
	let respiteStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		const module = await import('./respite.svelte');
		respiteStore = module.respiteStore;
	});

	describe('startRespite', () => {
		it('should call repository startRespite', async () => {
			const mockResult = createMockRespite({ status: 'active' });
			mockStartRespite.mockResolvedValue(mockResult);

			const result = await respiteStore.startRespite('test-id');

			expect(mockStartRespite).toHaveBeenCalledWith('test-id');
			expect(result.status).toBe('active');
		});

		it('should update active respite if matching', async () => {
			const initial = createMockRespite({ id: 'test-id', status: 'preparing' });
			mockGetById.mockResolvedValue(initial);
			await respiteStore.selectRespite('test-id');

			const started = { ...initial, status: 'active' as const };
			mockStartRespite.mockResolvedValue(started);
			await respiteStore.startRespite('test-id');

			expect(respiteStore.activeRespite.status).toBe('active');
		});

		it('should set error on failure', async () => {
			mockStartRespite.mockRejectedValue(new Error('Already active'));

			await expect(respiteStore.startRespite('test-id')).rejects.toThrow('Already active');
			expect(respiteStore.error).toBe('Already active');
		});
	});

	describe('completeRespite', () => {
		it('should call repository completeRespite', async () => {
			const mockResult = createMockRespite({ status: 'completed' });
			mockCompleteRespite.mockResolvedValue(mockResult);

			const result = await respiteStore.completeRespite('test-id');

			expect(mockCompleteRespite).toHaveBeenCalledWith('test-id');
			expect(result.status).toBe('completed');
		});
	});
});

describe('Respite Store - Hero Management', () => {
	let respiteStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		const module = await import('./respite.svelte');
		respiteStore = module.respiteStore;
	});

	describe('addHero', () => {
		it('should call repository addHero', async () => {
			const mockResult = createMockRespite();
			mockAddHero.mockResolvedValue(mockResult);

			const hero = { name: 'New Hero', recoveries: { current: 3, max: 8 } };
			await respiteStore.addHero('test-id', hero);

			expect(mockAddHero).toHaveBeenCalledWith('test-id', hero);
		});

		it('should set error on duplicate hero', async () => {
			mockAddHero.mockRejectedValue(new Error('Hero "Valora" is already in this respite'));

			await expect(
				respiteStore.addHero('test-id', {
					name: 'Valora',
					recoveries: { current: 3, max: 8 }
				})
			).rejects.toThrow('Hero "Valora" is already in this respite');
			expect(respiteStore.error).toBe('Hero "Valora" is already in this respite');
		});
	});

	describe('updateHero', () => {
		it('should call repository updateHero', async () => {
			const mockResult = createMockRespite();
			mockUpdateHero.mockResolvedValue(mockResult);

			await respiteStore.updateHero('test-id', 'hero-1', { notes: 'Resting' });

			expect(mockUpdateHero).toHaveBeenCalledWith('test-id', 'hero-1', { notes: 'Resting' });
		});
	});

	describe('removeHero', () => {
		it('should call repository removeHero', async () => {
			const mockResult = createMockRespite({ heroes: [] });
			mockRemoveHero.mockResolvedValue(mockResult);

			await respiteStore.removeHero('test-id', 'hero-1');

			expect(mockRemoveHero).toHaveBeenCalledWith('test-id', 'hero-1');
		});
	});
});

describe('Respite Store - Activity Management', () => {
	let respiteStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		const module = await import('./respite.svelte');
		respiteStore = module.respiteStore;
	});

	describe('recordActivity', () => {
		it('should call repository recordActivity', async () => {
			const mockResult = createMockRespite();
			mockRecordActivity.mockResolvedValue(mockResult);

			const input: RecordActivityInput = {
				name: 'Research',
				type: 'investigation'
			};
			await respiteStore.recordActivity('test-id', input);

			expect(mockRecordActivity).toHaveBeenCalledWith('test-id', input);
		});
	});

	describe('updateActivity', () => {
		it('should call repository updateActivity', async () => {
			const mockResult = createMockRespite();
			mockUpdateActivity.mockResolvedValue(mockResult);

			await respiteStore.updateActivity('test-id', 'activity-1', {
				status: 'in_progress'
			});

			expect(mockUpdateActivity).toHaveBeenCalledWith('test-id', 'activity-1', {
				status: 'in_progress'
			});
		});
	});

	describe('completeActivity', () => {
		it('should call repository completeActivity', async () => {
			const mockResult = createMockRespite();
			mockCompleteActivity.mockResolvedValue(mockResult);

			await respiteStore.completeActivity('test-id', 'activity-1', 'Found a map');

			expect(mockCompleteActivity).toHaveBeenCalledWith(
				'test-id',
				'activity-1',
				'Found a map'
			);
		});
	});
});

describe('Respite Store - VP Conversion', () => {
	let respiteStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		const module = await import('./respite.svelte');
		respiteStore = module.respiteStore;
	});

	describe('convertVictoryPoints', () => {
		it('should call repository convertVictoryPoints', async () => {
			const mockResult = createMockRespite({ victoryPointsConverted: 5 });
			mockConvertVictoryPoints.mockResolvedValue(mockResult);

			await respiteStore.convertVictoryPoints('test-id', 5);

			expect(mockConvertVictoryPoints).toHaveBeenCalledWith('test-id', 5);
		});

		it('should set error on over-conversion', async () => {
			mockConvertVictoryPoints.mockRejectedValue(
				new Error('Cannot convert 20 VP: only 10 VP remaining')
			);

			await expect(
				respiteStore.convertVictoryPoints('test-id', 20)
			).rejects.toThrow('Cannot convert 20 VP: only 10 VP remaining');
			expect(respiteStore.error).toBe('Cannot convert 20 VP: only 10 VP remaining');
		});
	});
});

describe('Respite Store - Kit Swap', () => {
	let respiteStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		const module = await import('./respite.svelte');
		respiteStore = module.respiteStore;
	});

	describe('recordKitSwap', () => {
		it('should call repository recordKitSwap', async () => {
			const mockResult = createMockRespite();
			mockRecordKitSwap.mockResolvedValue(mockResult);

			const swap = { heroId: 'hero-1', from: 'Kit A', to: 'Kit B' };
			await respiteStore.recordKitSwap('test-id', swap);

			expect(mockRecordKitSwap).toHaveBeenCalledWith('test-id', swap);
		});
	});
});

describe('Respite Store - Derived Values with Active Respite', () => {
	let respiteStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		const module = await import('./respite.svelte');
		respiteStore = module.respiteStore;
	});

	it('should compute heroCount from active respite', async () => {
		const mock = createMockRespite({
			id: 'test-id',
			heroes: [
				{ id: 'h1', name: 'Hero 1', recoveries: { current: 3, max: 8, gained: 0 } },
				{ id: 'h2', name: 'Hero 2', recoveries: { current: 5, max: 6, gained: 0 } }
			]
		});
		mockGetById.mockResolvedValue(mock);
		await respiteStore.selectRespite('test-id');

		expect(respiteStore.heroCount).toBe(2);
	});

	it('should compute fullyRestedHeroes', async () => {
		const mock = createMockRespite({
			id: 'test-id',
			heroes: [
				{ id: 'h1', name: 'Hero 1', recoveries: { current: 8, max: 8, gained: 5 } },
				{ id: 'h2', name: 'Hero 2', recoveries: { current: 3, max: 6, gained: 0 } }
			]
		});
		mockGetById.mockResolvedValue(mock);
		await respiteStore.selectRespite('test-id');

		expect(respiteStore.fullyRestedHeroes).toHaveLength(1);
		expect(respiteStore.fullyRestedHeroes[0].name).toBe('Hero 1');
	});

	it('should compute vpRemaining', async () => {
		const mock = createMockRespite({
			id: 'test-id',
			victoryPointsAvailable: 10,
			victoryPointsConverted: 3
		});
		mockGetById.mockResolvedValue(mock);
		await respiteStore.selectRespite('test-id');

		expect(respiteStore.vpRemaining).toBe(7);
	});

	it('should compute vpConversionPercent', async () => {
		const mock = createMockRespite({
			id: 'test-id',
			victoryPointsAvailable: 10,
			victoryPointsConverted: 5
		});
		mockGetById.mockResolvedValue(mock);
		await respiteStore.selectRespite('test-id');

		expect(respiteStore.vpConversionPercent).toBe(50);
	});

	it('should compute activities by status', async () => {
		const mock = createMockRespite({
			id: 'test-id',
			activities: [
				{
					id: 'a1',
					name: 'Research',
					type: 'investigation',
					status: 'pending',
					createdAt: new Date()
				},
				{
					id: 'a2',
					name: 'Training',
					type: 'training',
					status: 'in_progress',
					createdAt: new Date()
				},
				{
					id: 'a3',
					name: 'Crafting',
					type: 'crafting',
					status: 'completed',
					outcome: 'Made a sword',
					createdAt: new Date()
				}
			]
		});
		mockGetById.mockResolvedValue(mock);
		await respiteStore.selectRespite('test-id');

		expect(respiteStore.pendingActivities).toHaveLength(1);
		expect(respiteStore.inProgressActivities).toHaveLength(1);
		expect(respiteStore.completedActivities).toHaveLength(1);
	});

	it('should compute kitSwapHistory', async () => {
		const mock = createMockRespite({
			id: 'test-id',
			kitSwaps: [
				{
					id: 'ks1',
					heroId: 'hero-1',
					from: 'Kit A',
					to: 'Kit B',
					createdAt: new Date()
				}
			]
		});
		mockGetById.mockResolvedValue(mock);
		await respiteStore.selectRespite('test-id');

		expect(respiteStore.kitSwapHistory).toHaveLength(1);
	});
});

describe('Respite Store - Error Handling', () => {
	let respiteStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		const module = await import('./respite.svelte');
		respiteStore = module.respiteStore;
	});

	it('should clear error with clearError()', () => {
		// Trigger an error first
		respiteStore.clearError();
		expect(respiteStore.error).toBeNull();
	});

	it('should have destroy method for cleanup', () => {
		expect(typeof respiteStore.destroy).toBe('function');
		respiteStore.destroy();
	});
});
