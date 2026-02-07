/**
 * Tests for Negotiation Repository
 *
 * Draw Steel Negotiation System - TDD RED Phase
 *
 * This repository manages negotiation sessions in IndexedDB, providing functionality
 * for negotiation lifecycle, argument recording, interest/patience tracking, and Draw Steel mechanics.
 *
 * Testing Strategy:
 * - Helper functions for interest/patience calculations
 * - CRUD operations for negotiation sessions
 * - Negotiation lifecycle (start, complete, reopen)
 * - Argument recording with automatic interest/patience updates
 * - Auto-completion when interest hits 0 or 5, or patience hits 0
 * - Motivation and pitfall management
 * - Edge cases for Draw Steel rules
 *
 * Draw Steel Negotiation Specifics:
 * - Interest starts at 2 (range 0-5)
 * - Patience starts at 5 (decreases with each argument)
 * - Motivation appeal arguments: Tier 1: interest +0, patience -1 | Tier 2: interest +1, patience -1 | Tier 3: interest +1, patience 0
 * - No motivation arguments: Tier 1: interest -1, patience -1 | Tier 2: interest +0, patience -1 | Tier 3: interest +1, patience -1
 * - Pitfall arguments: Always interest -1, patience -1
 * - Outcomes based on final interest: 0 = Failure, 1 = Failure, 2 = Minor Favor, 3 = Major Favor, 4 = Major Favor, 5 = Alliance
 * - Session auto-completes when interest reaches 0, 5, or patience reaches 0
 *
 * These tests will FAIL until implementation is complete (RED phase).
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { negotiationRepository } from './negotiationRepository';
import { db } from '../index';
import type {
	NegotiationSession,
	ArgumentType,
	NegotiationTier,
	NegotiationOutcome
} from '$lib/types/negotiation';

describe('NegotiationRepository - Helper Functions', () => {
	describe('calculateInterestChange', () => {
		describe('Motivation appeal arguments', () => {
			it('should return 0 interest change for Tier 1', () => {
				const change = negotiationRepository.calculateInterestChange('motivation', 1);
				expect(change).toBe(0);
			});

			it('should return +1 interest change for Tier 2', () => {
				const change = negotiationRepository.calculateInterestChange('motivation', 2);
				expect(change).toBe(1);
			});

			it('should return +1 interest change for Tier 3', () => {
				const change = negotiationRepository.calculateInterestChange('motivation', 3);
				expect(change).toBe(1);
			});
		});

		describe('No motivation arguments', () => {
			it('should return -1 interest change for Tier 1', () => {
				const change = negotiationRepository.calculateInterestChange('no_motivation', 1);
				expect(change).toBe(-1);
			});

			it('should return 0 interest change for Tier 2', () => {
				const change = negotiationRepository.calculateInterestChange('no_motivation', 2);
				expect(change).toBe(0);
			});

			it('should return +1 interest change for Tier 3', () => {
				const change = negotiationRepository.calculateInterestChange('no_motivation', 3);
				expect(change).toBe(1);
			});
		});

		describe('Pitfall arguments', () => {
			it('should return -1 interest change for Tier 1', () => {
				const change = negotiationRepository.calculateInterestChange('pitfall', 1);
				expect(change).toBe(-1);
			});

			it('should return -1 interest change for Tier 2', () => {
				const change = negotiationRepository.calculateInterestChange('pitfall', 2);
				expect(change).toBe(-1);
			});

			it('should return -1 interest change for Tier 3', () => {
				const change = negotiationRepository.calculateInterestChange('pitfall', 3);
				expect(change).toBe(-1);
			});
		});
	});

	describe('calculatePatienceChange', () => {
		describe('Motivation appeal arguments', () => {
			it('should return -1 patience change for Tier 1', () => {
				const change = negotiationRepository.calculatePatienceChange('motivation', 1);
				expect(change).toBe(-1);
			});

			it('should return -1 patience change for Tier 2', () => {
				const change = negotiationRepository.calculatePatienceChange('motivation', 2);
				expect(change).toBe(-1);
			});

			it('should return 0 patience change for Tier 3', () => {
				const change = negotiationRepository.calculatePatienceChange('motivation', 3);
				expect(change).toBe(0);
			});
		});

		describe('No motivation arguments', () => {
			it('should return -1 patience change for Tier 1', () => {
				const change = negotiationRepository.calculatePatienceChange('no_motivation', 1);
				expect(change).toBe(-1);
			});

			it('should return -1 patience change for Tier 2', () => {
				const change = negotiationRepository.calculatePatienceChange('no_motivation', 2);
				expect(change).toBe(-1);
			});

			it('should return -1 patience change for Tier 3', () => {
				const change = negotiationRepository.calculatePatienceChange('no_motivation', 3);
				expect(change).toBe(-1);
			});
		});

		describe('Pitfall arguments', () => {
			it('should return -1 patience change for Tier 1', () => {
				const change = negotiationRepository.calculatePatienceChange('pitfall', 1);
				expect(change).toBe(-1);
			});

			it('should return -1 patience change for Tier 2', () => {
				const change = negotiationRepository.calculatePatienceChange('pitfall', 2);
				expect(change).toBe(-1);
			});

			it('should return -1 patience change for Tier 3', () => {
				const change = negotiationRepository.calculatePatienceChange('pitfall', 3);
				expect(change).toBe(-1);
			});
		});
	});

	describe('getOutcomeForInterest', () => {
		it('should return "failure" for interest 0', () => {
			const outcome = negotiationRepository.getOutcomeForInterest(0);
			expect(outcome).toBe('failure');
		});

		it('should return "failure" for interest 1', () => {
			const outcome = negotiationRepository.getOutcomeForInterest(1);
			expect(outcome).toBe('failure');
		});

		it('should return "minor_favor" for interest 2', () => {
			const outcome = negotiationRepository.getOutcomeForInterest(2);
			expect(outcome).toBe('minor_favor');
		});

		it('should return "major_favor" for interest 3', () => {
			const outcome = negotiationRepository.getOutcomeForInterest(3);
			expect(outcome).toBe('major_favor');
		});

		it('should return "major_favor" for interest 4', () => {
			const outcome = negotiationRepository.getOutcomeForInterest(4);
			expect(outcome).toBe('major_favor');
		});

		it('should return "alliance" for interest 5', () => {
			const outcome = negotiationRepository.getOutcomeForInterest(5);
			expect(outcome).toBe('alliance');
		});
	});
});

describe('NegotiationRepository - CRUD Operations', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		// Clear negotiation sessions before each test
		await db.negotiationSessions.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.negotiationSessions.clear();
	});

	describe('create', () => {
		it('should create a new negotiation session with default values', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Convince the Mayor',
				description: 'Persuade the mayor to support our cause',
				npcName: 'Mayor Thompson',
				motivations: [
					{ type: 'reputation', description: 'Cares about public image' },
					{ type: 'wealth', description: 'Interested in financial gain' }
				],
				pitfalls: [
					{ description: 'Hates being threatened' },
					{ description: 'Dislikes dishonesty' }
				]
			});

			expect(negotiation).toBeDefined();
			expect(negotiation.id).toBeDefined();
			expect(negotiation.name).toBe('Convince the Mayor');
			expect(negotiation.description).toBe('Persuade the mayor to support our cause');
			expect(negotiation.npcName).toBe('Mayor Thompson');
			expect(negotiation.status).toBe('preparing');
			expect(negotiation.interest).toBe(2);
			expect(negotiation.patience).toBe(5);
			expect(negotiation.arguments).toEqual([]);
			expect(negotiation.motivations).toHaveLength(2);
			expect(negotiation.motivations[0].isKnown).toBe(false);
			expect(negotiation.motivations[0].timesUsed).toBe(0);
			expect(negotiation.pitfalls).toHaveLength(2);
			expect(negotiation.pitfalls[0].isKnown).toBe(false);
			expect(negotiation.outcome).toBeUndefined();
			expect(negotiation.createdAt).toBeInstanceOf(Date);
			expect(negotiation.updatedAt).toBeInstanceOf(Date);
			expect(negotiation.completedAt).toBeUndefined();
		});

		it('should generate unique IDs for each negotiation', async () => {
			const negotiation1 = await negotiationRepository.create({
				name: 'Negotiation 1',
				npcName: 'NPC 1',
				motivations: [],
				pitfalls: []
			});
			const negotiation2 = await negotiationRepository.create({
				name: 'Negotiation 2',
				npcName: 'NPC 2',
				motivations: [],
				pitfalls: []
			});

			expect(negotiation1.id).not.toBe(negotiation2.id);
		});

		it('should create negotiation without description', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Quick Negotiation',
				npcName: 'Guard',
				motivations: [],
				pitfalls: []
			});

			expect(negotiation.description).toBeUndefined();
		});

		it('should create negotiation with empty motivations and pitfalls', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Simple Talk',
				npcName: 'Stranger',
				motivations: [],
				pitfalls: []
			});

			expect(negotiation.motivations).toEqual([]);
			expect(negotiation.pitfalls).toEqual([]);
		});

		it('should set timestamps on creation', async () => {
			const before = new Date();
			const negotiation = await negotiationRepository.create({
				name: 'Timed Negotiation',
				npcName: 'Merchant',
				motivations: [],
				pitfalls: []
			});
			const after = new Date();

			expect(negotiation.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(negotiation.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
			expect(negotiation.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(negotiation.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should initialize motivations with isKnown=false and timesUsed=0', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Test',
				npcName: 'NPC',
				motivations: [
					{ type: 'justice', description: 'Seeks fairness' },
					{ type: 'power', description: 'Desires control' }
				],
				pitfalls: []
			});

			expect(negotiation.motivations[0].isKnown).toBe(false);
			expect(negotiation.motivations[0].timesUsed).toBe(0);
			expect(negotiation.motivations[1].isKnown).toBe(false);
			expect(negotiation.motivations[1].timesUsed).toBe(0);
		});

		it('should initialize pitfalls with isKnown=false', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Test',
				npcName: 'NPC',
				motivations: [],
				pitfalls: [
					{ description: 'Hates violence' },
					{ description: 'Distrusts outsiders' }
				]
			});

			expect(negotiation.pitfalls[0].isKnown).toBe(false);
			expect(negotiation.pitfalls[1].isKnown).toBe(false);
		});
	});

	describe('getById', () => {
		it('should retrieve negotiation session by ID', async () => {
			const created = await negotiationRepository.create({
				name: 'Test Negotiation',
				npcName: 'Test NPC',
				motivations: [],
				pitfalls: []
			});
			const retrieved = await negotiationRepository.getById(created.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(created.id);
			expect(retrieved?.name).toBe('Test Negotiation');
		});

		it('should return undefined for non-existent negotiation', async () => {
			const result = await negotiationRepository.getById('non-existent-id');

			expect(result).toBeUndefined();
		});
	});

	describe('getAll', () => {
		it('should return observable of all negotiation sessions', async () => {
			await negotiationRepository.create({
				name: 'Negotiation 1',
				npcName: 'NPC 1',
				motivations: [],
				pitfalls: []
			});
			await negotiationRepository.create({
				name: 'Negotiation 2',
				npcName: 'NPC 2',
				motivations: [],
				pitfalls: []
			});
			await negotiationRepository.create({
				name: 'Negotiation 3',
				npcName: 'NPC 3',
				motivations: [],
				pitfalls: []
			});

			const observable = negotiationRepository.getAll();
			let negotiations: NegotiationSession[] = [];

			const subscription = observable.subscribe((data) => {
				negotiations = data;
			});

			await new Promise(resolve => setTimeout(resolve, 50));

			expect(negotiations.length).toBeGreaterThanOrEqual(3);
			subscription.unsubscribe();
		});

		it('should return empty array when no negotiations exist', async () => {
			const observable = negotiationRepository.getAll();
			let negotiations: NegotiationSession[] = [];

			const subscription = observable.subscribe((data) => {
				negotiations = data;
			});

			await new Promise(resolve => setTimeout(resolve, 50));

			expect(negotiations).toEqual([]);
			subscription.unsubscribe();
		});
	});

	describe('update', () => {
		it('should update negotiation session', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Original Name',
				npcName: 'Original NPC',
				motivations: [],
				pitfalls: []
			});

			await new Promise(resolve => setTimeout(resolve, 10));

			const updated = await negotiationRepository.update(negotiation.id, {
				name: 'Updated Name',
				description: 'New description'
			});

			expect(updated.name).toBe('Updated Name');
			expect(updated.description).toBe('New description');
			expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(negotiation.updatedAt.getTime());
		});

		it('should throw error for non-existent negotiation', async () => {
			await expect(
				negotiationRepository.update('non-existent', { name: 'Test' })
			).rejects.toThrow();
		});

		it('should update only specified fields', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Original',
				description: 'Original Description',
				npcName: 'Original NPC',
				motivations: [],
				pitfalls: []
			});

			const updated = await negotiationRepository.update(negotiation.id, {
				name: 'New Name'
			});

			expect(updated.name).toBe('New Name');
			expect(updated.description).toBe('Original Description');
			expect(updated.npcName).toBe('Original NPC');
		});

		it('should allow updating motivations', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Test',
				npcName: 'NPC',
				motivations: [
					{ type: 'justice', description: 'Original motivation' }
				],
				pitfalls: []
			});

			const updated = await negotiationRepository.update(negotiation.id, {
				motivations: [
					{ type: 'wealth', description: 'New motivation', isKnown: false, timesUsed: 0 },
					{ type: 'power', description: 'Another motivation', isKnown: false, timesUsed: 0 }
				]
			});

			expect(updated.motivations).toHaveLength(2);
			expect(updated.motivations[0].type).toBe('wealth');
			expect(updated.motivations[1].type).toBe('power');
		});

		it('should allow updating pitfalls', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Test',
				npcName: 'NPC',
				motivations: [],
				pitfalls: [
					{ description: 'Original pitfall' }
				]
			});

			const updated = await negotiationRepository.update(negotiation.id, {
				pitfalls: [
					{ description: 'New pitfall 1', isKnown: false },
					{ description: 'New pitfall 2', isKnown: false }
				]
			});

			expect(updated.pitfalls).toHaveLength(2);
			expect(updated.pitfalls[0].description).toBe('New pitfall 1');
			expect(updated.pitfalls[1].description).toBe('New pitfall 2');
		});
	});

	describe('delete', () => {
		it('should delete negotiation session', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'To Delete',
				npcName: 'NPC',
				motivations: [],
				pitfalls: []
			});

			await negotiationRepository.delete(negotiation.id);

			const retrieved = await negotiationRepository.getById(negotiation.id);
			expect(retrieved).toBeUndefined();
		});

		it('should not throw when deleting non-existent negotiation', async () => {
			await expect(
				negotiationRepository.delete('non-existent')
			).resolves.not.toThrow();
		});
	});
});

describe('NegotiationRepository - Lifecycle Operations', () => {
	let negotiationId: string;

	beforeEach(async () => {
		await db.negotiationSessions.clear();
		const negotiation = await negotiationRepository.create({
			name: 'Test Negotiation',
			npcName: 'Test NPC',
			motivations: [
				{ type: 'justice', description: 'Seeks fairness' }
			],
			pitfalls: [
				{ description: 'Hates threats' }
			]
		});
		negotiationId = negotiation.id;
	});

	afterEach(async () => {
		await db.negotiationSessions.clear();
	});

	describe('startNegotiation', () => {
		it('should transition negotiation from preparing to active', async () => {
			const negotiation = await negotiationRepository.startNegotiation(negotiationId);

			expect(negotiation.status).toBe('active');
			expect(negotiation.interest).toBe(2);
			expect(negotiation.patience).toBe(5);
		});

		it('should throw error if negotiation already active', async () => {
			await negotiationRepository.startNegotiation(negotiationId);

			await expect(
				negotiationRepository.startNegotiation(negotiationId)
			).rejects.toThrow('already active');
		});

		it('should throw error if negotiation is completed', async () => {
			await negotiationRepository.startNegotiation(negotiationId);
			await negotiationRepository.completeNegotiation(negotiationId);

			await expect(
				negotiationRepository.startNegotiation(negotiationId)
			).rejects.toThrow('completed');
		});

		it('should update timestamp', async () => {
			const before = await negotiationRepository.getById(negotiationId);
			await new Promise(resolve => setTimeout(resolve, 10));

			const negotiation = await negotiationRepository.startNegotiation(negotiationId);

			expect(negotiation.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime());
		});
	});

	describe('completeNegotiation', () => {
		it('should mark negotiation as completed with outcome', async () => {
			await negotiationRepository.startNegotiation(negotiationId);

			const negotiation = await negotiationRepository.completeNegotiation(negotiationId);

			expect(negotiation.status).toBe('completed');
			expect(negotiation.outcome).toBeDefined();
			expect(negotiation.completedAt).toBeInstanceOf(Date);
		});

		it('should calculate outcome based on current interest level', async () => {
			await negotiationRepository.startNegotiation(negotiationId);

			const negotiation = await negotiationRepository.completeNegotiation(negotiationId);

			expect(negotiation.outcome).toBe('minor_favor'); // interest is 2
		});

		it('should throw error if negotiation not active', async () => {
			await expect(
				negotiationRepository.completeNegotiation(negotiationId)
			).rejects.toThrow('not active');
		});

		it('should set completedAt timestamp', async () => {
			await negotiationRepository.startNegotiation(negotiationId);

			const before = new Date();
			const negotiation = await negotiationRepository.completeNegotiation(negotiationId);
			const after = new Date();

			expect(negotiation.completedAt).toBeInstanceOf(Date);
			expect(negotiation.completedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(negotiation.completedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('reopenNegotiation', () => {
		it('should reopen completed negotiation', async () => {
			await negotiationRepository.startNegotiation(negotiationId);
			await negotiationRepository.completeNegotiation(negotiationId);

			const negotiation = await negotiationRepository.reopenNegotiation(negotiationId);

			expect(negotiation.status).toBe('active');
			expect(negotiation.outcome).toBeUndefined();
			expect(negotiation.completedAt).toBeUndefined();
		});

		it('should throw error if negotiation not completed', async () => {
			await expect(
				negotiationRepository.reopenNegotiation(negotiationId)
			).rejects.toThrow('not completed');
		});

		it('should preserve arguments and interest/patience when reopening', async () => {
			await negotiationRepository.startNegotiation(negotiationId);
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 2,
				description: 'Test argument',
				motivationType: 'justice'
			});
			await negotiationRepository.completeNegotiation(negotiationId);

			const negotiation = await negotiationRepository.reopenNegotiation(negotiationId);

			expect(negotiation.arguments.length).toBe(1);
			expect(negotiation.interest).toBe(3); // 2 + 1 from Tier 2 motivation
			expect(negotiation.patience).toBe(4); // 5 - 1 from argument
		});
	});
});

describe('NegotiationRepository - Argument Recording', () => {
	let negotiationId: string;

	beforeEach(async () => {
		await db.negotiationSessions.clear();
		const negotiation = await negotiationRepository.create({
			name: 'Test Negotiation',
			npcName: 'Test NPC',
			motivations: [
				{ type: 'justice', description: 'Seeks fairness' },
				{ type: 'wealth', description: 'Wants money' }
			],
			pitfalls: [
				{ description: 'Hates threats' }
			]
		});
		negotiationId = negotiation.id;
		await negotiationRepository.startNegotiation(negotiationId);
	});

	afterEach(async () => {
		await db.negotiationSessions.clear();
	});

	describe('recordArgument', () => {
		it('should record a Tier 1 motivation argument', async () => {
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 1,
				description: 'Appeal to justice',
				motivationType: 'justice'
			});

			expect(negotiation.arguments).toHaveLength(1);
			expect(negotiation.arguments[0].type).toBe('motivation');
			expect(negotiation.arguments[0].tier).toBe(1);
			expect(negotiation.arguments[0].description).toBe('Appeal to justice');
			expect(negotiation.arguments[0].motivationType).toBe('justice');
			expect(negotiation.arguments[0].interestChange).toBe(0);
			expect(negotiation.arguments[0].patienceChange).toBe(-1);
			expect(negotiation.interest).toBe(2); // 2 + 0
			expect(negotiation.patience).toBe(4); // 5 - 1
		});

		it('should record a Tier 2 motivation argument', async () => {
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 2,
				description: 'Strong appeal to justice',
				motivationType: 'justice'
			});

			expect(negotiation.arguments[0].interestChange).toBe(1);
			expect(negotiation.arguments[0].patienceChange).toBe(-1);
			expect(negotiation.interest).toBe(3); // 2 + 1
			expect(negotiation.patience).toBe(4); // 5 - 1
		});

		it('should record a Tier 3 motivation argument', async () => {
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 3,
				description: 'Masterful appeal to justice',
				motivationType: 'justice'
			});

			expect(negotiation.arguments[0].interestChange).toBe(1);
			expect(negotiation.arguments[0].patienceChange).toBe(0);
			expect(negotiation.interest).toBe(3); // 2 + 1
			expect(negotiation.patience).toBe(5); // 5 - 0
		});

		it('should record a Tier 1 no motivation argument', async () => {
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 1,
				description: 'Weak generic argument'
			});

			expect(negotiation.arguments[0].type).toBe('no_motivation');
			expect(negotiation.arguments[0].interestChange).toBe(-1);
			expect(negotiation.arguments[0].patienceChange).toBe(-1);
			expect(negotiation.interest).toBe(1); // 2 - 1
			expect(negotiation.patience).toBe(4); // 5 - 1
		});

		it('should record a Tier 2 no motivation argument', async () => {
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 2,
				description: 'Decent generic argument'
			});

			expect(negotiation.arguments[0].interestChange).toBe(0);
			expect(negotiation.arguments[0].patienceChange).toBe(-1);
			expect(negotiation.interest).toBe(2); // 2 + 0
			expect(negotiation.patience).toBe(4); // 5 - 1
		});

		it('should record a Tier 3 no motivation argument', async () => {
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 3,
				description: 'Strong generic argument'
			});

			expect(negotiation.arguments[0].interestChange).toBe(1);
			expect(negotiation.arguments[0].patienceChange).toBe(-1);
			expect(negotiation.interest).toBe(3); // 2 + 1
			expect(negotiation.patience).toBe(4); // 5 - 1
		});

		it('should record a pitfall argument', async () => {
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'pitfall',
				tier: 1,
				description: 'Accidentally threatened them'
			});

			expect(negotiation.arguments[0].type).toBe('pitfall');
			expect(negotiation.arguments[0].interestChange).toBe(-1);
			expect(negotiation.arguments[0].patienceChange).toBe(-1);
			expect(negotiation.interest).toBe(1); // 2 - 1
			expect(negotiation.patience).toBe(4); // 5 - 1
		});

		it('should enforce interest minimum of 0', async () => {
			// Drive interest down
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 1,
				description: 'Bad argument 1'
			});
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 1,
				description: 'Bad argument 2'
			});

			expect(negotiation.interest).toBe(0); // Can't go below 0
		});

		it('should enforce interest maximum of 5', async () => {
			// Drive interest up
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 2,
				description: 'Good argument 1',
				motivationType: 'justice'
			});
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 2,
				description: 'Good argument 2',
				motivationType: 'wealth'
			});
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 2,
				description: 'Good argument 3',
				motivationType: 'justice'
			});

			expect(negotiation.interest).toBe(5); // Can't go above 5
		});

		it('should auto-complete when interest reaches 0', async () => {
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'pitfall',
				tier: 1,
				description: 'Mistake 1'
			});
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'pitfall',
				tier: 1,
				description: 'Mistake 2'
			});

			expect(negotiation.status).toBe('completed');
			expect(negotiation.interest).toBe(0);
			expect(negotiation.outcome).toBe('failure');
		});

		it('should auto-complete when interest reaches 5', async () => {
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 3,
				description: 'Excellent 1',
				motivationType: 'justice'
			});
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 3,
				description: 'Excellent 2',
				motivationType: 'wealth'
			});
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 3,
				description: 'Excellent 3',
				motivationType: 'justice'
			});

			expect(negotiation.status).toBe('completed');
			expect(negotiation.interest).toBe(5);
			expect(negotiation.outcome).toBe('alliance');
		});

		it('should auto-complete when patience reaches 0', async () => {
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 2,
				description: 'Arg 1'
			});
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 2,
				description: 'Arg 2'
			});
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 2,
				description: 'Arg 3'
			});
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 2,
				description: 'Arg 4'
			});
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 2,
				description: 'Arg 5'
			});

			expect(negotiation.status).toBe('completed');
			expect(negotiation.patience).toBe(0);
			expect(negotiation.outcome).toBeDefined();
		});

		it('should throw error if negotiation not active', async () => {
			const newNegotiation = await negotiationRepository.create({
				name: 'Not Started',
				npcName: 'NPC',
				motivations: [],
				pitfalls: []
			});

			await expect(
				negotiationRepository.recordArgument(newNegotiation.id, {
					type: 'no_motivation',
					tier: 1,
					description: 'Test'
				})
			).rejects.toThrow('not active');
		});

		it('should generate unique IDs for arguments', async () => {
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 1,
				description: 'Arg 1',
				motivationType: 'justice'
			});
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 1,
				description: 'Arg 2',
				motivationType: 'wealth'
			});

			expect(negotiation.arguments[0].id).toBeDefined();
			expect(negotiation.arguments[1].id).toBeDefined();
			expect(negotiation.arguments[0].id).not.toBe(negotiation.arguments[1].id);
		});

		it('should include optional player name', async () => {
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 2,
				description: 'Diplomatic appeal',
				motivationType: 'justice',
				playerName: 'Aragorn'
			});

			expect(negotiation.arguments[0].playerName).toBe('Aragorn');
		});

		it('should include optional notes', async () => {
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'pitfall',
				tier: 1,
				description: 'Threatened them',
				notes: 'Used Intimidation skill, critical failure'
			});

			expect(negotiation.arguments[0].notes).toBe('Used Intimidation skill, critical failure');
		});

		it('should track multiple arguments in sequence', async () => {
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 2,
				description: 'First argument',
				motivationType: 'justice'
			});
			await negotiationRepository.recordArgument(negotiationId, {
				type: 'no_motivation',
				tier: 1,
				description: 'Second argument'
			});
			const negotiation = await negotiationRepository.recordArgument(negotiationId, {
				type: 'motivation',
				tier: 3,
				description: 'Third argument',
				motivationType: 'wealth'
			});

			expect(negotiation.arguments).toHaveLength(3);
			expect(negotiation.interest).toBe(3); // 2 + 1 - 1 + 1
			expect(negotiation.patience).toBe(3); // 5 - 1 - 1 - 1 + 0 (Tier 3 gives 0)
		});
	});
});

describe('NegotiationRepository - Motivation and Pitfall Management', () => {
	let negotiationId: string;

	beforeEach(async () => {
		await db.negotiationSessions.clear();
		const negotiation = await negotiationRepository.create({
			name: 'Test Negotiation',
			npcName: 'Test NPC',
			motivations: [
				{ type: 'justice', description: 'Seeks fairness' },
				{ type: 'wealth', description: 'Wants money' },
				{ type: 'power', description: 'Desires control' }
			],
			pitfalls: [
				{ description: 'Hates threats' },
				{ description: 'Distrusts outsiders' }
			]
		});
		negotiationId = negotiation.id;
	});

	afterEach(async () => {
		await db.negotiationSessions.clear();
	});

	describe('revealMotivation', () => {
		it('should mark motivation as known', async () => {
			const negotiation = await negotiationRepository.revealMotivation(negotiationId, 0);

			expect(negotiation.motivations[0].isKnown).toBe(true);
			expect(negotiation.motivations[1].isKnown).toBe(false);
		});

		it('should reveal multiple motivations independently', async () => {
			await negotiationRepository.revealMotivation(negotiationId, 0);
			const negotiation = await negotiationRepository.revealMotivation(negotiationId, 2);

			expect(negotiation.motivations[0].isKnown).toBe(true);
			expect(negotiation.motivations[1].isKnown).toBe(false);
			expect(negotiation.motivations[2].isKnown).toBe(true);
		});

		it('should throw error for invalid motivation index', async () => {
			await expect(
				negotiationRepository.revealMotivation(negotiationId, 10)
			).rejects.toThrow();
		});

		it('should update timestamp', async () => {
			const before = await negotiationRepository.getById(negotiationId);
			await new Promise(resolve => setTimeout(resolve, 10));

			const negotiation = await negotiationRepository.revealMotivation(negotiationId, 0);

			expect(negotiation.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime());
		});
	});

	describe('revealPitfall', () => {
		it('should mark pitfall as known', async () => {
			const negotiation = await negotiationRepository.revealPitfall(negotiationId, 0);

			expect(negotiation.pitfalls[0].isKnown).toBe(true);
			expect(negotiation.pitfalls[1].isKnown).toBe(false);
		});

		it('should reveal multiple pitfalls independently', async () => {
			await negotiationRepository.revealPitfall(negotiationId, 0);
			const negotiation = await negotiationRepository.revealPitfall(negotiationId, 1);

			expect(negotiation.pitfalls[0].isKnown).toBe(true);
			expect(negotiation.pitfalls[1].isKnown).toBe(true);
		});

		it('should throw error for invalid pitfall index', async () => {
			await expect(
				negotiationRepository.revealPitfall(negotiationId, 10)
			).rejects.toThrow();
		});

		it('should update timestamp', async () => {
			const before = await negotiationRepository.getById(negotiationId);
			await new Promise(resolve => setTimeout(resolve, 10));

			const negotiation = await negotiationRepository.revealPitfall(negotiationId, 0);

			expect(negotiation.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime());
		});
	});

	describe('markMotivationUsed', () => {
		it('should increment timesUsed for a motivation type', async () => {
			const negotiation = await negotiationRepository.markMotivationUsed(negotiationId, 'justice');

			expect(negotiation.motivations[0].timesUsed).toBe(1);
			expect(negotiation.motivations[1].timesUsed).toBe(0);
			expect(negotiation.motivations[2].timesUsed).toBe(0);
		});

		it('should increment timesUsed multiple times for same motivation', async () => {
			await negotiationRepository.markMotivationUsed(negotiationId, 'justice');
			await negotiationRepository.markMotivationUsed(negotiationId, 'justice');
			const negotiation = await negotiationRepository.markMotivationUsed(negotiationId, 'justice');

			expect(negotiation.motivations[0].timesUsed).toBe(3);
		});

		it('should track usage for different motivations independently', async () => {
			await negotiationRepository.markMotivationUsed(negotiationId, 'justice');
			await negotiationRepository.markMotivationUsed(negotiationId, 'wealth');
			const negotiation = await negotiationRepository.markMotivationUsed(negotiationId, 'justice');

			expect(negotiation.motivations[0].timesUsed).toBe(2); // justice
			expect(negotiation.motivations[1].timesUsed).toBe(1); // wealth
			expect(negotiation.motivations[2].timesUsed).toBe(0); // power
		});

		it('should throw error for non-existent motivation type', async () => {
			await expect(
				negotiationRepository.markMotivationUsed(negotiationId, 'nonexistent' as any)
			).rejects.toThrow();
		});

		it('should update timestamp', async () => {
			const before = await negotiationRepository.getById(negotiationId);
			await new Promise(resolve => setTimeout(resolve, 10));

			const negotiation = await negotiationRepository.markMotivationUsed(negotiationId, 'justice');

			expect(negotiation.updatedAt.getTime()).toBeGreaterThanOrEqual(before!.updatedAt.getTime());
		});
	});
});

describe('NegotiationRepository - Integration Tests', () => {
	beforeEach(async () => {
		await db.negotiationSessions.clear();
	});

	afterEach(async () => {
		await db.negotiationSessions.clear();
	});

	it('should complete full successful negotiation flow', async () => {
		// Create negotiation
		const created = await negotiationRepository.create({
			name: 'Convince the Queen',
			description: 'Persuade Queen to support our cause',
			npcName: 'Queen Elena',
			motivations: [
				{ type: 'justice', description: 'Cares about fairness' },
				{ type: 'reputation', description: 'Protects her image' }
			],
			pitfalls: [
				{ description: 'Hates being rushed' }
			]
		});

		// Start negotiation
		await negotiationRepository.startNegotiation(created.id);

		// Reveal a motivation
		await negotiationRepository.revealMotivation(created.id, 0);

		// Make good arguments using revealed motivation
		await negotiationRepository.recordArgument(created.id, {
			type: 'motivation',
			tier: 2,
			description: 'Appeal to justice',
			motivationType: 'justice',
			playerName: 'Diplomat'
		});
		await negotiationRepository.recordArgument(created.id, {
			type: 'motivation',
			tier: 3,
			description: 'Masterful appeal to justice',
			motivationType: 'justice',
			playerName: 'Diplomat'
		});

		const final = await negotiationRepository.recordArgument(created.id, {
			type: 'motivation',
			tier: 3,
			description: 'Final perfect argument',
			motivationType: 'justice',
			playerName: 'Diplomat'
		});

		// Check final state
		expect(final.status).toBe('completed');
		expect(final.interest).toBe(5); // 2 + 1 + 1 + 1
		expect(final.outcome).toBe('alliance');
		expect(final.motivations[0].isKnown).toBe(true);
		expect(final.arguments).toHaveLength(3);
	});

	it('should handle failed negotiation with pitfalls', async () => {
		const created = await negotiationRepository.create({
			name: 'Negotiate with Warlord',
			npcName: 'Warlord Kragg',
			motivations: [
				{ type: 'power', description: 'Seeks dominance' }
			],
			pitfalls: [
				{ description: 'Hates weakness' },
				{ description: 'Triggered by insults' }
			]
		});

		await negotiationRepository.startNegotiation(created.id);

		// Accidentally hit pitfalls
		await negotiationRepository.recordArgument(created.id, {
			type: 'pitfall',
			tier: 1,
			description: 'Insulted their honor',
			notes: 'Critical failure on Persuasion'
		});

		const final = await negotiationRepository.recordArgument(created.id, {
			type: 'pitfall',
			tier: 1,
			description: 'Showed weakness',
			notes: 'Another critical failure'
		});

		expect(final.status).toBe('completed');
		expect(final.interest).toBe(0); // 2 - 1 - 1
		expect(final.outcome).toBe('failure');
	});

	it('should handle patience depletion before reaching outcome', async () => {
		const created = await negotiationRepository.create({
			name: 'Long Negotiation',
			npcName: 'Merchant',
			motivations: [
				{ type: 'wealth', description: 'Wants profit' }
			],
			pitfalls: []
		});

		await negotiationRepository.startNegotiation(created.id);

		// Use up all patience with mediocre arguments
		await negotiationRepository.recordArgument(created.id, {
			type: 'no_motivation',
			tier: 2,
			description: 'Generic argument 1'
		});
		await negotiationRepository.recordArgument(created.id, {
			type: 'no_motivation',
			tier: 2,
			description: 'Generic argument 2'
		});
		await negotiationRepository.recordArgument(created.id, {
			type: 'no_motivation',
			tier: 2,
			description: 'Generic argument 3'
		});
		await negotiationRepository.recordArgument(created.id, {
			type: 'no_motivation',
			tier: 2,
			description: 'Generic argument 4'
		});
		const final = await negotiationRepository.recordArgument(created.id, {
			type: 'no_motivation',
			tier: 2,
			description: 'Generic argument 5'
		});

		expect(final.status).toBe('completed');
		expect(final.patience).toBe(0);
		expect(final.interest).toBe(2); // Unchanged since Tier 2 no motivation = 0
		expect(final.outcome).toBe('minor_favor'); // Based on interest level 2
	});
});
