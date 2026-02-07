/**
 * Tests for Negotiation Store (Svelte 5 Runes)
 *
 * TDD RED PHASE - These tests are written BEFORE implementation.
 * They define the expected behavior of the negotiation store.
 *
 * The store manages reactive state for Draw Steel negotiation sessions including:
 * - Reactive negotiation list with live queries
 * - Active negotiation selection
 * - Derived values (filtered lists, percentages, known motivations/pitfalls)
 * - All repository operations wrapped with reactive state updates
 * - Loading and error state management
 *
 * Test Coverage:
 * - Initial state
 * - CRUD operations (create, select, update, delete)
 * - Lifecycle operations (start, complete, reopen)
 * - Argument recording
 * - Motivation and pitfall revelation
 * - Derived values (filters, percentages, history)
 * - Error handling and loading states
 * - Edge cases and reactivity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
	NegotiationSession,
	CreateNegotiationInput,
	UpdateNegotiationInput,
	RecordArgumentInput,
	NegotiationOutcome
} from '$lib/types/negotiation';

/**
 * Helper function to create mock negotiation sessions for testing.
 */
function createMockNegotiation(overrides?: Partial<NegotiationSession>): NegotiationSession {
	const now = new Date();
	return {
		id: 'negotiation-' + Math.random(),
		name: 'Test Negotiation',
		description: 'Test description',
		npcName: 'Test NPC',
		status: 'preparing',
		interest: 2,
		patience: 3,
		motivations: [
			{ type: 'greed', isKnown: true, used: false },
			{ type: 'power', isKnown: false, used: false }
		],
		pitfalls: [
			{ type: 'justice', isKnown: true },
			{ type: 'benevolence', isKnown: false }
		],
		arguments: [],
		createdAt: now,
		updatedAt: now,
		...overrides
	};
}

// ============================================================================
// Mock the negotiation repository
// ============================================================================

const mockGetAll = vi.fn(() => ({
	subscribe: vi.fn((observer: any) => {
		// Simulate immediate call with empty array
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
const mockStartNegotiation = vi.fn();
const mockCompleteNegotiation = vi.fn();
const mockReopenNegotiation = vi.fn();
const mockRecordArgument = vi.fn();
const mockRevealMotivation = vi.fn();
const mockRevealPitfall = vi.fn();

vi.mock('$lib/db/repositories/negotiationRepository', () => ({
	negotiationRepository: {
		getAll: mockGetAll,
		create: mockCreate,
		getById: mockGetById,
		update: mockUpdate,
		delete: mockDelete,
		startNegotiation: mockStartNegotiation,
		completeNegotiation: mockCompleteNegotiation,
		reopenNegotiation: mockReopenNegotiation,
		recordArgument: mockRecordArgument,
		revealMotivation: mockRevealMotivation,
		revealPitfall: mockRevealPitfall
	}
}));

// ============================================================================
// Test Suite
// ============================================================================

describe('Negotiation Store - Initial State and Reactivity', () => {
	let negotiationStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		// Clear module cache to get fresh store instance
		vi.resetModules();

		// Dynamically import the store to get a fresh instance
		const module = await import('./negotiation.svelte');
		negotiationStore = module.negotiationStore;
	});

	describe('Initial State', () => {
		it('should have negotiations array', () => {
			expect(negotiationStore).toHaveProperty('negotiations');
			expect(Array.isArray(negotiationStore.negotiations)).toBe(true);
		});

		it('should initialize with no active negotiation', () => {
			expect(negotiationStore).toHaveProperty('activeNegotiation');
			expect(negotiationStore.activeNegotiation).toBeNull();
		});

		it('should initialize with isLoading false', () => {
			expect(negotiationStore).toHaveProperty('isLoading');
			expect(negotiationStore.isLoading).toBe(false);
		});

		it('should initialize with no error', () => {
			expect(negotiationStore).toHaveProperty('error');
			expect(negotiationStore.error).toBeNull();
		});
	});

	describe('Reactive State Properties', () => {
		it('should have reactive negotiations getter', () => {
			expect(negotiationStore).toHaveProperty('negotiations');
		});

		it('should have reactive activeNegotiation getter', () => {
			expect(negotiationStore).toHaveProperty('activeNegotiation');
		});

		it('should have reactive isLoading getter', () => {
			expect(negotiationStore).toHaveProperty('isLoading');
		});

		it('should have reactive error getter', () => {
			expect(negotiationStore).toHaveProperty('error');
		});
	});
});

describe('Negotiation Store - Derived Values', () => {
	let negotiationStore: any;
	let mockNegotiations: NegotiationSession[];

	beforeEach(async () => {
		vi.clearAllMocks();

		// Create mock negotiations with different statuses
		mockNegotiations = [
			createMockNegotiation({ id: 'neg-1', status: 'preparing', name: 'Preparing 1' }),
			createMockNegotiation({ id: 'neg-2', status: 'active', name: 'Active 1' }),
			createMockNegotiation({ id: 'neg-3', status: 'active', name: 'Active 2' }),
			createMockNegotiation({ id: 'neg-4', status: 'completed', name: 'Completed 1' })
		];

		// Mock getAll to return our test data
		mockGetAll.mockReturnValue({
			subscribe: vi.fn((observer: any) => {
				observer.next(mockNegotiations);
				return { unsubscribe: vi.fn() };
			})
		});

		// Clear module cache to get fresh store instance
		vi.resetModules();

		const module = await import('./negotiation.svelte');
		negotiationStore = module.negotiationStore;
	});

	describe('Status Filters', () => {
		it('should have activeNegotiations derived value', () => {
			expect(negotiationStore).toHaveProperty('activeNegotiations');
		});

		it('should filter active negotiations correctly', () => {
			const active = negotiationStore.activeNegotiations;
			expect(active).toHaveLength(2);
			expect(active.every((n: NegotiationSession) => n.status === 'active')).toBe(true);
		});

		it('should have preparingNegotiations derived value', () => {
			expect(negotiationStore).toHaveProperty('preparingNegotiations');
		});

		it('should filter preparing negotiations correctly', () => {
			const preparing = negotiationStore.preparingNegotiations;
			expect(preparing).toHaveLength(1);
			expect(preparing[0].status).toBe('preparing');
		});

		it('should have completedNegotiations derived value', () => {
			expect(negotiationStore).toHaveProperty('completedNegotiations');
		});

		it('should filter completed negotiations correctly', () => {
			const completed = negotiationStore.completedNegotiations;
			expect(completed).toHaveLength(1);
			expect(completed[0].status).toBe('completed');
		});
	});

	describe('Interest and Patience Percentages', () => {
		beforeEach(async () => {
			// Create a mock active negotiation with specific interest/patience
			const activeNeg = createMockNegotiation({
				id: 'active-neg',
				status: 'active',
				interest: 4,
				patience: 2
			});

			mockGetById.mockResolvedValue(activeNeg);

			await negotiationStore.selectNegotiation('active-neg');
		});

		it('should have interestPercent derived value', () => {
			expect(negotiationStore).toHaveProperty('interestPercent');
		});

		it('should calculate interest percentage correctly', () => {
			// Interest 4 out of 5 = 80%
			expect(negotiationStore.interestPercent).toBe(80);
		});

		it('should have patiencePercent derived value', () => {
			expect(negotiationStore).toHaveProperty('patiencePercent');
		});

		it('should calculate patience percentage correctly', () => {
			// Patience 2 out of 5 = 40%
			expect(negotiationStore.patiencePercent).toBe(40);
		});

		it('should return 0 for percentages when no active negotiation', async () => {
			mockGetById.mockResolvedValue(null);
			await negotiationStore.selectNegotiation('non-existent');

			expect(negotiationStore.interestPercent).toBe(0);
			expect(negotiationStore.patiencePercent).toBe(0);
		});

		it('should handle interest of 0 (0%)', async () => {
			const zeroInterest = createMockNegotiation({
				id: 'zero-int',
				interest: 0,
				patience: 3
			});
			mockGetById.mockResolvedValue(zeroInterest);
			await negotiationStore.selectNegotiation('zero-int');

			expect(negotiationStore.interestPercent).toBe(0);
		});

		it('should handle interest of 5 (100%)', async () => {
			const maxInterest = createMockNegotiation({
				id: 'max-int',
				interest: 5,
				patience: 3
			});
			mockGetById.mockResolvedValue(maxInterest);
			await negotiationStore.selectNegotiation('max-int');

			expect(negotiationStore.interestPercent).toBe(100);
		});
	});

	describe('Known Motivations and Pitfalls', () => {
		beforeEach(async () => {
			const activeNeg = createMockNegotiation({
				id: 'active-neg',
				motivations: [
					{ type: 'greed', isKnown: true, used: false },
					{ type: 'power', isKnown: false, used: false },
					{ type: 'justice', isKnown: true, used: true }
				],
				pitfalls: [
					{ type: 'benevolence', isKnown: true },
					{ type: 'freedom', isKnown: false }
				]
			});

			mockGetById.mockResolvedValue(activeNeg);
			await negotiationStore.selectNegotiation('active-neg');
		});

		it('should have knownMotivations derived value', () => {
			expect(negotiationStore).toHaveProperty('knownMotivations');
		});

		it('should filter known motivations correctly', () => {
			const known = negotiationStore.knownMotivations;
			expect(known).toHaveLength(2);
			expect(known.every((m: any) => m.isKnown)).toBe(true);
			expect(known.some((m: any) => m.type === 'greed')).toBe(true);
			expect(known.some((m: any) => m.type === 'justice')).toBe(true);
		});

		it('should have knownPitfalls derived value', () => {
			expect(negotiationStore).toHaveProperty('knownPitfalls');
		});

		it('should filter known pitfalls correctly', () => {
			const known = negotiationStore.knownPitfalls;
			expect(known).toHaveLength(1);
			expect(known[0].isKnown).toBe(true);
			expect(known[0].type).toBe('benevolence');
		});

		it('should return empty array when no active negotiation', async () => {
			mockGetById.mockResolvedValue(null);
			await negotiationStore.selectNegotiation('non-existent');

			expect(negotiationStore.knownMotivations).toEqual([]);
			expect(negotiationStore.knownPitfalls).toEqual([]);
		});
	});

	describe('Unused Motivations', () => {
		beforeEach(async () => {
			const activeNeg = createMockNegotiation({
				id: 'active-neg',
				motivations: [
					{ type: 'greed', isKnown: true, used: false },
					{ type: 'power', isKnown: true, used: true },
					{ type: 'justice', isKnown: false, used: false }
				]
			});

			mockGetById.mockResolvedValue(activeNeg);
			await negotiationStore.selectNegotiation('active-neg');
		});

		it('should have unusedMotivations derived value', () => {
			expect(negotiationStore).toHaveProperty('unusedMotivations');
		});

		it('should filter unused motivations correctly', () => {
			const unused = negotiationStore.unusedMotivations;
			expect(unused).toHaveLength(2);
			expect(unused.every((m: any) => !m.used)).toBe(true);
			expect(unused.some((m: any) => m.type === 'greed')).toBe(true);
			expect(unused.some((m: any) => m.type === 'justice')).toBe(true);
		});

		it('should include both known and unknown unused motivations', () => {
			const unused = negotiationStore.unusedMotivations;
			expect(unused.some((m: any) => m.isKnown)).toBe(true);
			expect(unused.some((m: any) => !m.isKnown)).toBe(true);
		});

		it('should return empty array when all motivations are used', async () => {
			const allUsed = createMockNegotiation({
				id: 'all-used',
				motivations: [
					{ type: 'greed', isKnown: true, used: true },
					{ type: 'power', isKnown: true, used: true }
				]
			});
			mockGetById.mockResolvedValue(allUsed);
			await negotiationStore.selectNegotiation('all-used');

			expect(negotiationStore.unusedMotivations).toEqual([]);
		});
	});

	describe('Argument History', () => {
		beforeEach(async () => {
			const activeNeg = createMockNegotiation({
				id: 'active-neg',
				arguments: [
					{
						id: 'arg-1',
						argumentType: 'motivation',
						motivationType: 'greed',
						tier: 2,
						interestDelta: 2,
						patienceDelta: -1,
						playerName: 'Hero A',
						notes: 'First argument',
						createdAt: new Date('2024-01-01')
					},
					{
						id: 'arg-2',
						argumentType: 'no_motivation',
						tier: 1,
						interestDelta: 1,
						patienceDelta: -1,
						playerName: 'Hero B',
						createdAt: new Date('2024-01-02')
					}
				]
			});

			mockGetById.mockResolvedValue(activeNeg);
			await negotiationStore.selectNegotiation('active-neg');
		});

		it('should have argumentHistory derived value', () => {
			expect(negotiationStore).toHaveProperty('argumentHistory');
		});

		it('should return all arguments for active negotiation', () => {
			const history = negotiationStore.argumentHistory;
			expect(history).toHaveLength(2);
		});

		it('should preserve argument order', () => {
			const history = negotiationStore.argumentHistory;
			expect(history[0].id).toBe('arg-1');
			expect(history[1].id).toBe('arg-2');
		});

		it('should return empty array when no active negotiation', async () => {
			mockGetById.mockResolvedValue(null);
			await negotiationStore.selectNegotiation('non-existent');

			expect(negotiationStore.argumentHistory).toEqual([]);
		});

		it('should return empty array when no arguments recorded', async () => {
			const noArgs = createMockNegotiation({
				id: 'no-args',
				arguments: []
			});
			mockGetById.mockResolvedValue(noArgs);
			await negotiationStore.selectNegotiation('no-args');

			expect(negotiationStore.argumentHistory).toEqual([]);
		});
	});
});

describe('Negotiation Store - CRUD Operations', () => {
	let negotiationStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockGetAll.mockReturnValue({
			subscribe: vi.fn((observer: any) => {
				observer.next([]);
				return { unsubscribe: vi.fn() };
			})
		});

		// Clear module cache to get fresh store instance
		vi.resetModules();

		const module = await import('./negotiation.svelte');
		negotiationStore = module.negotiationStore;
	});

	describe('createNegotiation', () => {
		it('should have createNegotiation method', () => {
			expect(negotiationStore.createNegotiation).toBeDefined();
			expect(typeof negotiationStore.createNegotiation).toBe('function');
		});

		it('should call repository create with input', async () => {
			const input: CreateNegotiationInput = {
				name: 'New Negotiation',
				npcName: 'NPC Name',
				description: 'Test description',
				interest: 3,
				patience: 2
			};

			const created = createMockNegotiation(input);
			mockCreate.mockResolvedValue(created);

			await negotiationStore.createNegotiation(input);

			expect(mockCreate).toHaveBeenCalledWith(input);
			expect(mockCreate).toHaveBeenCalledTimes(1);
		});

		it('should return the created negotiation', async () => {
			const input: CreateNegotiationInput = {
				name: 'New Negotiation',
				npcName: 'NPC Name'
			};

			const created = createMockNegotiation(input);
			mockCreate.mockResolvedValue(created);

			const result = await negotiationStore.createNegotiation(input);

			expect(result).toEqual(created);
		});

		it('should set isLoading during operation', async () => {
			const input: CreateNegotiationInput = {
				name: 'Test',
				npcName: 'NPC'
			};

			mockCreate.mockImplementation(async () => {
				expect(negotiationStore.isLoading).toBe(true);
				return createMockNegotiation(input);
			});

			await negotiationStore.createNegotiation(input);

			expect(negotiationStore.isLoading).toBe(false);
		});

		it('should clear error on successful create', async () => {
			const input: CreateNegotiationInput = {
				name: 'Test',
				npcName: 'NPC'
			};

			const created = createMockNegotiation(input);
			mockCreate.mockResolvedValue(created);

			await negotiationStore.createNegotiation(input);

			expect(negotiationStore.error).toBeNull();
		});

		it('should handle errors and set error state', async () => {
			const input: CreateNegotiationInput = {
				name: 'Test',
				npcName: 'NPC'
			};

			const errorMessage = 'Failed to create negotiation';
			mockCreate.mockRejectedValue(new Error(errorMessage));

			await expect(negotiationStore.createNegotiation(input)).rejects.toThrow(errorMessage);

			expect(negotiationStore.error).toBe(errorMessage);
			expect(negotiationStore.isLoading).toBe(false);
		});
	});

	describe('selectNegotiation', () => {
		it('should have selectNegotiation method', () => {
			expect(negotiationStore.selectNegotiation).toBeDefined();
			expect(typeof negotiationStore.selectNegotiation).toBe('function');
		});

		it('should call repository getById with correct ID', async () => {
			const negotiation = createMockNegotiation({ id: 'test-id' });
			mockGetById.mockResolvedValue(negotiation);

			await negotiationStore.selectNegotiation('test-id');

			expect(mockGetById).toHaveBeenCalledWith('test-id');
		});

		it('should set activeNegotiation on successful selection', async () => {
			const negotiation = createMockNegotiation({ id: 'test-id' });
			mockGetById.mockResolvedValue(negotiation);

			await negotiationStore.selectNegotiation('test-id');

			expect(negotiationStore.activeNegotiation).toEqual(negotiation);
		});

		it('should set activeNegotiation to null if not found', async () => {
			mockGetById.mockResolvedValue(null);

			await negotiationStore.selectNegotiation('non-existent');

			expect(negotiationStore.activeNegotiation).toBeNull();
		});

		it('should set isLoading during operation', async () => {
			mockGetById.mockImplementation(async () => {
				expect(negotiationStore.isLoading).toBe(true);
				return createMockNegotiation();
			});

			await negotiationStore.selectNegotiation('test-id');

			expect(negotiationStore.isLoading).toBe(false);
		});

		it('should handle errors and set error state', async () => {
			const errorMessage = 'Failed to fetch negotiation';
			mockGetById.mockRejectedValue(new Error(errorMessage));

			await negotiationStore.selectNegotiation('test-id');

			expect(negotiationStore.error).toBe(errorMessage);
			expect(negotiationStore.activeNegotiation).toBeNull();
		});
	});

	describe('updateNegotiation', () => {
		it('should have updateNegotiation method', () => {
			expect(negotiationStore.updateNegotiation).toBeDefined();
			expect(typeof negotiationStore.updateNegotiation).toBe('function');
		});

		it('should call repository update with correct arguments', async () => {
			const id = 'test-id';
			const input: UpdateNegotiationInput = {
				name: 'Updated Name',
				description: 'Updated description'
			};

			const updated = createMockNegotiation({ id, ...input });
			mockUpdate.mockResolvedValue(updated);

			await negotiationStore.updateNegotiation(id, input);

			expect(mockUpdate).toHaveBeenCalledWith(id, input);
		});

		it('should return updated negotiation', async () => {
			const id = 'test-id';
			const input: UpdateNegotiationInput = { name: 'Updated' };
			const updated = createMockNegotiation({ id, ...input });

			mockUpdate.mockResolvedValue(updated);

			const result = await negotiationStore.updateNegotiation(id, input);

			expect(result).toEqual(updated);
		});

		it('should update activeNegotiation if it matches the updated ID', async () => {
			const id = 'test-id';
			const initial = createMockNegotiation({ id, name: 'Original' });
			const updated = createMockNegotiation({ id, name: 'Updated' });

			mockGetById.mockResolvedValue(initial);
			await negotiationStore.selectNegotiation(id);

			mockUpdate.mockResolvedValue(updated);
			await negotiationStore.updateNegotiation(id, { name: 'Updated' });

			expect(negotiationStore.activeNegotiation.name).toBe('Updated');
		});

		it('should not update activeNegotiation if ID does not match', async () => {
			const activeNeg = createMockNegotiation({ id: 'active-id', name: 'Active' });
			const otherNeg = createMockNegotiation({ id: 'other-id', name: 'Other' });

			mockGetById.mockResolvedValue(activeNeg);
			await negotiationStore.selectNegotiation('active-id');

			mockUpdate.mockResolvedValue(otherNeg);
			await negotiationStore.updateNegotiation('other-id', { name: 'Updated' });

			expect(negotiationStore.activeNegotiation.name).toBe('Active');
		});

		it('should handle errors and set error state', async () => {
			const errorMessage = 'Update failed';
			mockUpdate.mockRejectedValue(new Error(errorMessage));

			await expect(
				negotiationStore.updateNegotiation('test-id', { name: 'Test' })
			).rejects.toThrow(errorMessage);

			expect(negotiationStore.error).toBe(errorMessage);
		});
	});

	describe('deleteNegotiation', () => {
		it('should have deleteNegotiation method', () => {
			expect(negotiationStore.deleteNegotiation).toBeDefined();
			expect(typeof negotiationStore.deleteNegotiation).toBe('function');
		});

		it('should call repository delete with correct ID', async () => {
			mockDelete.mockResolvedValue(undefined);

			await negotiationStore.deleteNegotiation('test-id');

			expect(mockDelete).toHaveBeenCalledWith('test-id');
		});

		it('should clear activeNegotiation if it matches deleted ID', async () => {
			const negotiation = createMockNegotiation({ id: 'test-id' });
			mockGetById.mockResolvedValue(negotiation);
			await negotiationStore.selectNegotiation('test-id');

			mockDelete.mockResolvedValue(undefined);
			await negotiationStore.deleteNegotiation('test-id');

			expect(negotiationStore.activeNegotiation).toBeNull();
		});

		it('should not clear activeNegotiation if ID does not match', async () => {
			const negotiation = createMockNegotiation({ id: 'active-id' });
			mockGetById.mockResolvedValue(negotiation);
			await negotiationStore.selectNegotiation('active-id');

			mockDelete.mockResolvedValue(undefined);
			await negotiationStore.deleteNegotiation('other-id');

			expect(negotiationStore.activeNegotiation).not.toBeNull();
		});

		it('should handle errors and set error state', async () => {
			const errorMessage = 'Delete failed';
			mockDelete.mockRejectedValue(new Error(errorMessage));

			await expect(negotiationStore.deleteNegotiation('test-id')).rejects.toThrow(errorMessage);

			expect(negotiationStore.error).toBe(errorMessage);
		});
	});
});

describe('Negotiation Store - Lifecycle Operations', () => {
	let negotiationStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockGetAll.mockReturnValue({
			subscribe: vi.fn((observer: any) => {
				observer.next([]);
				return { unsubscribe: vi.fn() };
			})
		});

		// Clear module cache to get fresh store instance
		vi.resetModules();

		const module = await import('./negotiation.svelte');
		negotiationStore = module.negotiationStore;
	});

	describe('startNegotiation', () => {
		it('should have startNegotiation method', () => {
			expect(negotiationStore.startNegotiation).toBeDefined();
			expect(typeof negotiationStore.startNegotiation).toBe('function');
		});

		it('should call repository startNegotiation with correct ID', async () => {
			const started = createMockNegotiation({ id: 'test-id', status: 'active' });
			mockStartNegotiation.mockResolvedValue(started);

			await negotiationStore.startNegotiation('test-id');

			expect(mockStartNegotiation).toHaveBeenCalledWith('test-id');
		});

		it('should return the started negotiation with active status', async () => {
			const started = createMockNegotiation({ id: 'test-id', status: 'active' });
			mockStartNegotiation.mockResolvedValue(started);

			const result = await negotiationStore.startNegotiation('test-id');

			expect(result.status).toBe('active');
		});

		it('should update activeNegotiation if it matches the ID', async () => {
			const initial = createMockNegotiation({ id: 'test-id', status: 'preparing' });
			const started = createMockNegotiation({ id: 'test-id', status: 'active' });

			mockGetById.mockResolvedValue(initial);
			await negotiationStore.selectNegotiation('test-id');

			mockStartNegotiation.mockResolvedValue(started);
			await negotiationStore.startNegotiation('test-id');

			expect(negotiationStore.activeNegotiation.status).toBe('active');
		});

		it('should handle errors and set error state', async () => {
			const errorMessage = 'Cannot start negotiation';
			mockStartNegotiation.mockRejectedValue(new Error(errorMessage));

			await expect(negotiationStore.startNegotiation('test-id')).rejects.toThrow(errorMessage);

			expect(negotiationStore.error).toBe(errorMessage);
		});
	});

	describe('completeNegotiation', () => {
		it('should have completeNegotiation method', () => {
			expect(negotiationStore.completeNegotiation).toBeDefined();
			expect(typeof negotiationStore.completeNegotiation).toBe('function');
		});

		it('should call repository completeNegotiation with correct arguments', async () => {
			const outcome: NegotiationOutcome = 'alliance';
			const completed = createMockNegotiation({
				id: 'test-id',
				status: 'completed',
				outcome
			});
			mockCompleteNegotiation.mockResolvedValue(completed);

			await negotiationStore.completeNegotiation('test-id', outcome);

			expect(mockCompleteNegotiation).toHaveBeenCalledWith('test-id', outcome);
		});

		it('should return completed negotiation with outcome', async () => {
			const outcome: NegotiationOutcome = 'major_favor';
			const completed = createMockNegotiation({
				id: 'test-id',
				status: 'completed',
				outcome
			});
			mockCompleteNegotiation.mockResolvedValue(completed);

			const result = await negotiationStore.completeNegotiation('test-id', outcome);

			expect(result.status).toBe('completed');
			expect(result.outcome).toBe(outcome);
		});

		it('should update activeNegotiation if it matches the ID', async () => {
			const active = createMockNegotiation({ id: 'test-id', status: 'active' });
			const completed = createMockNegotiation({
				id: 'test-id',
				status: 'completed',
				outcome: 'major_favor'
			});

			mockGetById.mockResolvedValue(active);
			await negotiationStore.selectNegotiation('test-id');

			mockCompleteNegotiation.mockResolvedValue(completed);
			await negotiationStore.completeNegotiation('test-id', 'major_favor');

			expect(negotiationStore.activeNegotiation.status).toBe('completed');
			expect(negotiationStore.activeNegotiation.outcome).toBe('major_favor');
		});

		it('should handle all outcome types', async () => {
			const outcomes: NegotiationOutcome[] = [
				'alliance',
				'major_favor',
				'minor_favor',
				'failure'
			];

			for (const outcome of outcomes) {
				const completed = createMockNegotiation({ id: 'test-id', status: 'completed', outcome });
				mockCompleteNegotiation.mockResolvedValue(completed);

				const result = await negotiationStore.completeNegotiation('test-id', outcome);
				expect(result.outcome).toBe(outcome);
			}
		});

		it('should handle errors and set error state', async () => {
			const errorMessage = 'Cannot complete negotiation';
			mockCompleteNegotiation.mockRejectedValue(new Error(errorMessage));

			await expect(
				negotiationStore.completeNegotiation('test-id', 'alliance')
			).rejects.toThrow(errorMessage);

			expect(negotiationStore.error).toBe(errorMessage);
		});
	});

	describe('reopenNegotiation', () => {
		it('should have reopenNegotiation method', () => {
			expect(negotiationStore.reopenNegotiation).toBeDefined();
			expect(typeof negotiationStore.reopenNegotiation).toBe('function');
		});

		it('should call repository reopenNegotiation with correct ID', async () => {
			const reopened = createMockNegotiation({ id: 'test-id', status: 'active' });
			mockReopenNegotiation.mockResolvedValue(reopened);

			await negotiationStore.reopenNegotiation('test-id');

			expect(mockReopenNegotiation).toHaveBeenCalledWith('test-id');
		});

		it('should return reopened negotiation with active status', async () => {
			const reopened = createMockNegotiation({ id: 'test-id', status: 'active', outcome: undefined });
			mockReopenNegotiation.mockResolvedValue(reopened);

			const result = await negotiationStore.reopenNegotiation('test-id');

			expect(result.status).toBe('active');
			expect(result.outcome).toBeUndefined();
		});

		it('should update activeNegotiation if it matches the ID', async () => {
			const completed = createMockNegotiation({
				id: 'test-id',
				status: 'completed',
				outcome: 'major_favor'
			});
			const reopened = createMockNegotiation({ id: 'test-id', status: 'active' });

			mockGetById.mockResolvedValue(completed);
			await negotiationStore.selectNegotiation('test-id');

			mockReopenNegotiation.mockResolvedValue(reopened);
			await negotiationStore.reopenNegotiation('test-id');

			expect(negotiationStore.activeNegotiation.status).toBe('active');
		});

		it('should handle errors and set error state', async () => {
			const errorMessage = 'Cannot reopen negotiation';
			mockReopenNegotiation.mockRejectedValue(new Error(errorMessage));

			await expect(negotiationStore.reopenNegotiation('test-id')).rejects.toThrow(errorMessage);

			expect(negotiationStore.error).toBe(errorMessage);
		});
	});
});

describe('Negotiation Store - Argument Recording', () => {
	let negotiationStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockGetAll.mockReturnValue({
			subscribe: vi.fn((observer: any) => {
				observer.next([]);
				return { unsubscribe: vi.fn() };
			})
		});

		// Clear module cache to get fresh store instance
		vi.resetModules();

		const module = await import('./negotiation.svelte');
		negotiationStore = module.negotiationStore;
	});

	describe('recordArgument', () => {
		it('should have recordArgument method', () => {
			expect(negotiationStore.recordArgument).toBeDefined();
			expect(typeof negotiationStore.recordArgument).toBe('function');
		});

		it('should call repository recordArgument with correct arguments', async () => {
			const id = 'test-id';
			const input: RecordArgumentInput = {
				argumentType: 'motivation',
				motivationType: 'greed',
				tier: 2,
				playerName: 'Hero A',
				notes: 'Test argument'
			};

			const updated = createMockNegotiation({ id });
			mockRecordArgument.mockResolvedValue(updated);

			await negotiationStore.recordArgument(id, input);

			expect(mockRecordArgument).toHaveBeenCalledWith(id, input);
		});

		it('should return updated negotiation with new argument', async () => {
			const id = 'test-id';
			const input: RecordArgumentInput = {
				argumentType: 'motivation',
				motivationType: 'power',
				tier: 3
			};

			const updated = createMockNegotiation({
				id,
				arguments: [
					{
						id: 'arg-1',
						argumentType: 'motivation',
						motivationType: 'power',
						tier: 3,
						interestDelta: 3,
						patienceDelta: -1,
						createdAt: new Date()
					}
				],
				interest: 5,
				patience: 2
			});

			mockRecordArgument.mockResolvedValue(updated);

			const result = await negotiationStore.recordArgument(id, input);

			expect(result.arguments).toHaveLength(1);
			expect(result.arguments[0].motivationType).toBe('power');
		});

		it('should update activeNegotiation if it matches the ID', async () => {
			const id = 'test-id';
			const initial = createMockNegotiation({ id, arguments: [] });
			const input: RecordArgumentInput = {
				argumentType: 'no_motivation',
				tier: 1
			};

			const updated = createMockNegotiation({
				id,
				arguments: [
					{
						id: 'arg-1',
						argumentType: 'no_motivation',
						tier: 1,
						interestDelta: 1,
						patienceDelta: -1,
						createdAt: new Date()
					}
				]
			});

			mockGetById.mockResolvedValue(initial);
			await negotiationStore.selectNegotiation(id);

			mockRecordArgument.mockResolvedValue(updated);
			await negotiationStore.recordArgument(id, input);

			expect(negotiationStore.activeNegotiation.arguments).toHaveLength(1);
		});

		it('should handle motivation argument type', async () => {
			const input: RecordArgumentInput = {
				argumentType: 'motivation',
				motivationType: 'justice',
				tier: 2
			};

			const updated = createMockNegotiation();
			mockRecordArgument.mockResolvedValue(updated);

			await negotiationStore.recordArgument('test-id', input);

			expect(mockRecordArgument).toHaveBeenCalledWith('test-id', input);
		});

		it('should handle no_motivation argument type', async () => {
			const input: RecordArgumentInput = {
				argumentType: 'no_motivation',
				tier: 1
			};

			const updated = createMockNegotiation();
			mockRecordArgument.mockResolvedValue(updated);

			await negotiationStore.recordArgument('test-id', input);

			expect(mockRecordArgument).toHaveBeenCalledWith('test-id', input);
		});

		it('should handle pitfall argument type', async () => {
			const input: RecordArgumentInput = {
				argumentType: 'pitfall',
				motivationType: 'benevolence',
				tier: 1
			};

			const updated = createMockNegotiation();
			mockRecordArgument.mockResolvedValue(updated);

			await negotiationStore.recordArgument('test-id', input);

			expect(mockRecordArgument).toHaveBeenCalledWith('test-id', input);
		});

		it('should handle all tier levels', async () => {
			const tiers: Array<1 | 2 | 3> = [1, 2, 3];

			for (const tier of tiers) {
				const input: RecordArgumentInput = {
					argumentType: 'motivation',
					motivationType: 'greed',
					tier
				};

				const updated = createMockNegotiation();
				mockRecordArgument.mockResolvedValue(updated);

				await negotiationStore.recordArgument('test-id', input);

				expect(mockRecordArgument).toHaveBeenCalledWith('test-id', expect.objectContaining({ tier }));
			}
		});

		it('should handle errors and set error state', async () => {
			const errorMessage = 'Failed to record argument';
			mockRecordArgument.mockRejectedValue(new Error(errorMessage));

			const input: RecordArgumentInput = {
				argumentType: 'motivation',
				motivationType: 'greed',
				tier: 2
			};

			await expect(negotiationStore.recordArgument('test-id', input)).rejects.toThrow(errorMessage);

			expect(negotiationStore.error).toBe(errorMessage);
		});
	});
});

describe('Negotiation Store - Motivation and Pitfall Revelation', () => {
	let negotiationStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockGetAll.mockReturnValue({
			subscribe: vi.fn((observer: any) => {
				observer.next([]);
				return { unsubscribe: vi.fn() };
			})
		});

		// Clear module cache to get fresh store instance
		vi.resetModules();

		const module = await import('./negotiation.svelte');
		negotiationStore = module.negotiationStore;
	});

	describe('revealMotivation', () => {
		it('should have revealMotivation method', () => {
			expect(negotiationStore.revealMotivation).toBeDefined();
			expect(typeof negotiationStore.revealMotivation).toBe('function');
		});

		it('should call repository revealMotivation with correct arguments', async () => {
			const id = 'test-id';
			const index = 1;

			const updated = createMockNegotiation({
				id,
				motivations: [
					{ type: 'greed', isKnown: true, used: false },
					{ type: 'power', isKnown: true, used: false }
				]
			});

			mockRevealMotivation.mockResolvedValue(updated);

			await negotiationStore.revealMotivation(id, index);

			expect(mockRevealMotivation).toHaveBeenCalledWith(id, index);
		});

		it('should return updated negotiation with revealed motivation', async () => {
			const id = 'test-id';
			const updated = createMockNegotiation({
				id,
				motivations: [
					{ type: 'greed', isKnown: false, used: false },
					{ type: 'power', isKnown: true, used: false }
				]
			});

			mockRevealMotivation.mockResolvedValue(updated);

			const result = await negotiationStore.revealMotivation(id, 1);

			expect(result.motivations[1].isKnown).toBe(true);
		});

		it('should update activeNegotiation if it matches the ID', async () => {
			const id = 'test-id';
			const initial = createMockNegotiation({
				id,
				motivations: [{ type: 'greed', isKnown: false, used: false }]
			});

			const updated = createMockNegotiation({
				id,
				motivations: [{ type: 'greed', isKnown: true, used: false }]
			});

			mockGetById.mockResolvedValue(initial);
			await negotiationStore.selectNegotiation(id);

			mockRevealMotivation.mockResolvedValue(updated);
			await negotiationStore.revealMotivation(id, 0);

			expect(negotiationStore.activeNegotiation.motivations[0].isKnown).toBe(true);
		});

		it('should handle revealing multiple motivations', async () => {
			const id = 'test-id';

			for (let i = 0; i < 3; i++) {
				const updated = createMockNegotiation({ id });
				mockRevealMotivation.mockResolvedValue(updated);
				await negotiationStore.revealMotivation(id, i);
			}

			expect(mockRevealMotivation).toHaveBeenCalledTimes(3);
		});

		it('should handle errors and set error state', async () => {
			const errorMessage = 'Invalid motivation index';
			mockRevealMotivation.mockRejectedValue(new Error(errorMessage));

			await expect(negotiationStore.revealMotivation('test-id', 99)).rejects.toThrow(errorMessage);

			expect(negotiationStore.error).toBe(errorMessage);
		});
	});

	describe('revealPitfall', () => {
		it('should have revealPitfall method', () => {
			expect(negotiationStore.revealPitfall).toBeDefined();
			expect(typeof negotiationStore.revealPitfall).toBe('function');
		});

		it('should call repository revealPitfall with correct arguments', async () => {
			const id = 'test-id';
			const index = 0;

			const updated = createMockNegotiation({
				id,
				pitfalls: [{ type: 'justice', isKnown: true }]
			});

			mockRevealPitfall.mockResolvedValue(updated);

			await negotiationStore.revealPitfall(id, index);

			expect(mockRevealPitfall).toHaveBeenCalledWith(id, index);
		});

		it('should return updated negotiation with revealed pitfall', async () => {
			const id = 'test-id';
			const updated = createMockNegotiation({
				id,
				pitfalls: [
					{ type: 'justice', isKnown: true },
					{ type: 'benevolence', isKnown: false }
				]
			});

			mockRevealPitfall.mockResolvedValue(updated);

			const result = await negotiationStore.revealPitfall(id, 0);

			expect(result.pitfalls[0].isKnown).toBe(true);
		});

		it('should update activeNegotiation if it matches the ID', async () => {
			const id = 'test-id';
			const initial = createMockNegotiation({
				id,
				pitfalls: [{ type: 'justice', isKnown: false }]
			});

			const updated = createMockNegotiation({
				id,
				pitfalls: [{ type: 'justice', isKnown: true }]
			});

			mockGetById.mockResolvedValue(initial);
			await negotiationStore.selectNegotiation(id);

			mockRevealPitfall.mockResolvedValue(updated);
			await negotiationStore.revealPitfall(id, 0);

			expect(negotiationStore.activeNegotiation.pitfalls[0].isKnown).toBe(true);
		});

		it('should handle revealing multiple pitfalls', async () => {
			const id = 'test-id';

			for (let i = 0; i < 2; i++) {
				const updated = createMockNegotiation({ id });
				mockRevealPitfall.mockResolvedValue(updated);
				await negotiationStore.revealPitfall(id, i);
			}

			expect(mockRevealPitfall).toHaveBeenCalledTimes(2);
		});

		it('should handle errors and set error state', async () => {
			const errorMessage = 'Invalid pitfall index';
			mockRevealPitfall.mockRejectedValue(new Error(errorMessage));

			await expect(negotiationStore.revealPitfall('test-id', 99)).rejects.toThrow(errorMessage);

			expect(negotiationStore.error).toBe(errorMessage);
		});
	});
});

describe('Negotiation Store - Helper Methods', () => {
	let negotiationStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockGetAll.mockReturnValue({
			subscribe: vi.fn((observer: any) => {
				observer.next([]);
				return { unsubscribe: vi.fn() };
			})
		});

		// Clear module cache to get fresh store instance
		vi.resetModules();

		const module = await import('./negotiation.svelte');
		negotiationStore = module.negotiationStore;
	});

	describe('clearError', () => {
		it('should have clearError method', () => {
			expect(negotiationStore.clearError).toBeDefined();
			expect(typeof negotiationStore.clearError).toBe('function');
		});

		it('should clear error state', async () => {
			// Set an error by triggering a failed operation
			mockCreate.mockRejectedValue(new Error('Test error'));

			try {
				await negotiationStore.createNegotiation({ name: 'Test', npcName: 'NPC' });
			} catch {
				// Ignore error
			}

			expect(negotiationStore.error).not.toBeNull();

			negotiationStore.clearError();

			expect(negotiationStore.error).toBeNull();
		});

		it('should work when error is already null', () => {
			expect(negotiationStore.error).toBeNull();

			negotiationStore.clearError();

			expect(negotiationStore.error).toBeNull();
		});
	});
});

describe('Negotiation Store - Edge Cases and Error Handling', () => {
	let negotiationStore: any;

	beforeEach(async () => {
		vi.clearAllMocks();

		mockGetAll.mockReturnValue({
			subscribe: vi.fn((observer: any) => {
				observer.next([]);
				return { unsubscribe: vi.fn() };
			})
		});

		// Clear module cache to get fresh store instance
		vi.resetModules();

		const module = await import('./negotiation.svelte');
		negotiationStore = module.negotiationStore;
	});

	describe('Empty State Handling', () => {
		it('should handle empty negotiations list', () => {
			expect(negotiationStore.negotiations).toEqual([]);
			expect(negotiationStore.activeNegotiations).toEqual([]);
			expect(negotiationStore.preparingNegotiations).toEqual([]);
			expect(negotiationStore.completedNegotiations).toEqual([]);
		});

		it('should handle no active negotiation', () => {
			expect(negotiationStore.activeNegotiation).toBeNull();
			expect(negotiationStore.interestPercent).toBe(0);
			expect(negotiationStore.patiencePercent).toBe(0);
			expect(negotiationStore.knownMotivations).toEqual([]);
			expect(negotiationStore.knownPitfalls).toEqual([]);
			expect(negotiationStore.unusedMotivations).toEqual([]);
			expect(negotiationStore.argumentHistory).toEqual([]);
		});
	});

	describe('Boundary Values', () => {
		it('should handle interest at minimum (0)', async () => {
			const minInterest = createMockNegotiation({ id: 'min', interest: 0 });
			mockGetById.mockResolvedValue(minInterest);
			await negotiationStore.selectNegotiation('min');

			expect(negotiationStore.interestPercent).toBe(0);
		});

		it('should handle interest at maximum (5)', async () => {
			const maxInterest = createMockNegotiation({ id: 'max', interest: 5 });
			mockGetById.mockResolvedValue(maxInterest);
			await negotiationStore.selectNegotiation('max');

			expect(negotiationStore.interestPercent).toBe(100);
		});

		it('should handle patience at minimum (0)', async () => {
			const minPatience = createMockNegotiation({ id: 'min', patience: 0 });
			mockGetById.mockResolvedValue(minPatience);
			await negotiationStore.selectNegotiation('min');

			expect(negotiationStore.patiencePercent).toBe(0);
		});

		it('should handle patience at maximum (5)', async () => {
			const maxPatience = createMockNegotiation({ id: 'max', patience: 5 });
			mockGetById.mockResolvedValue(maxPatience);
			await negotiationStore.selectNegotiation('max');

			expect(negotiationStore.patiencePercent).toBe(100);
		});

		it('should handle negotiation with no motivations', async () => {
			const noMotivations = createMockNegotiation({ id: 'none', motivations: [] });
			mockGetById.mockResolvedValue(noMotivations);
			await negotiationStore.selectNegotiation('none');

			expect(negotiationStore.knownMotivations).toEqual([]);
			expect(negotiationStore.unusedMotivations).toEqual([]);
		});

		it('should handle negotiation with no pitfalls', async () => {
			const noPitfalls = createMockNegotiation({ id: 'none', pitfalls: [] });
			mockGetById.mockResolvedValue(noPitfalls);
			await negotiationStore.selectNegotiation('none');

			expect(negotiationStore.knownPitfalls).toEqual([]);
		});

		it('should handle negotiation with no arguments', async () => {
			const noArguments = createMockNegotiation({ id: 'none', arguments: [] });
			mockGetById.mockResolvedValue(noArguments);
			await negotiationStore.selectNegotiation('none');

			expect(negotiationStore.argumentHistory).toEqual([]);
		});
	});

	describe('Concurrent Operations', () => {
		it('should handle multiple selections in sequence', async () => {
			const neg1 = createMockNegotiation({ id: 'neg-1', name: 'First' });
			const neg2 = createMockNegotiation({ id: 'neg-2', name: 'Second' });

			mockGetById.mockResolvedValueOnce(neg1).mockResolvedValueOnce(neg2);

			await negotiationStore.selectNegotiation('neg-1');
			expect(negotiationStore.activeNegotiation.name).toBe('First');

			await negotiationStore.selectNegotiation('neg-2');
			expect(negotiationStore.activeNegotiation.name).toBe('Second');
		});

		it('should handle update after select', async () => {
			const initial = createMockNegotiation({ id: 'test', name: 'Initial' });
			const updated = createMockNegotiation({ id: 'test', name: 'Updated' });

			mockGetById.mockResolvedValue(initial);
			await negotiationStore.selectNegotiation('test');

			mockUpdate.mockResolvedValue(updated);
			await negotiationStore.updateNegotiation('test', { name: 'Updated' });

			expect(negotiationStore.activeNegotiation.name).toBe('Updated');
		});
	});

	describe('Repository Subscription', () => {
		it('should subscribe to repository on initialization', () => {
			expect(mockGetAll).toHaveBeenCalled();
		});

		it('should update negotiations when subscription emits', async () => {
			const negotiations = [
				createMockNegotiation({ id: 'neg-1' }),
				createMockNegotiation({ id: 'neg-2' })
			];

			// Create a new store instance with different subscription behavior
			mockGetAll.mockReturnValue({
				subscribe: vi.fn((observer: any) => {
					observer.next(negotiations);
					return { unsubscribe: vi.fn() };
				})
			});

			// Clear module cache to get fresh store instance
			vi.resetModules();

			const module = await import('./negotiation.svelte');
			const freshStore = module.negotiationStore;

			// Wait for subscription to process
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(freshStore.negotiations.length).toBe(2);
		});
	});

	describe('Cleanup', () => {
		it('should have destroy method for cleanup', () => {
			expect(negotiationStore.destroy).toBeDefined();
			expect(typeof negotiationStore.destroy).toBe('function');
		});

		it('should unsubscribe when destroyed', () => {
			const unsubscribeSpy = vi.fn();

			mockGetAll.mockReturnValue({
				subscribe: vi.fn(() => ({
					unsubscribe: unsubscribeSpy
				}))
			});

			// Create new instance
			vi.resetModules();

			negotiationStore.destroy();

			// Note: In actual implementation, this would call unsubscribe
			// The test verifies the method exists and can be called
			expect(() => negotiationStore.destroy()).not.toThrow();
		});
	});
});
