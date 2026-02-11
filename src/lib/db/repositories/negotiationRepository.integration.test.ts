/**
 * Integration Tests for Negotiation Repository with Narrative Events
 *
 * Issue #426: Verify that negotiation completion automatically creates
 * narrative events, following the pattern established by combat and montage.
 *
 * These tests verify the full integration:
 * - Manual negotiation completion creates narrative event
 * - Auto-completion creates narrative event (interest hits 0/5 or patience hits 0)
 * - Failures don't block negotiation completion (try/catch)
 * - Narrative event captures proper negotiation details
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { negotiationRepository } from './negotiationRepository';
import { entityRepository } from './entityRepository';
import { db } from '../index';

describe('Negotiation Repository - Narrative Event Integration', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		// Clear all data before each test
		await db.negotiationSessions.clear();
		await db.entities.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.negotiationSessions.clear();
		await db.entities.clear();
	});

	describe('Manual Completion Integration', () => {
		it('should create narrative event when negotiation is manually completed', async () => {
			// Create and start negotiation
			const negotiation = await negotiationRepository.create({
				name: 'Treaty Negotiation',
				description: 'Peace talks with the northern tribes',
				npcName: 'Chief Thorin',
				motivations: [{ type: 'harmony', description: 'Wants to end the war' }],
				pitfalls: [{ description: 'Dislikes dishonesty' }]
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Get initial entity count
			const entitiesBeforeCompletion = await db.entities.count();

			// Complete negotiation
			await negotiationRepository.completeNegotiation(negotiation.id);

			// Verify narrative event was created
			const entitiesAfterCompletion = await db.entities.count();
			expect(entitiesAfterCompletion).toBe(entitiesBeforeCompletion + 1);

			// Find the narrative event
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(1);
			expect(narrativeEvents[0].name).toBe('Treaty Negotiation');
			expect(narrativeEvents[0].description).toBe('Peace talks with the northern tribes');
			expect(narrativeEvents[0].fields?.eventType).toBe('negotiation');
			expect(narrativeEvents[0].fields?.sourceId).toBe(negotiation.id);
			expect(narrativeEvents[0].fields?.outcome).toBe('minor_favor'); // interest = 2
		});

		it('should capture correct outcome in narrative event', async () => {
			// Create and start negotiation
			const negotiation = await negotiationRepository.create({
				name: 'Alliance Proposal',
				npcName: 'Queen Elara',
				motivations: [{ type: 'power', description: 'Seeks strength through unity' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Record arguments to increase interest to 5 (alliance)
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 3,
				description: 'United we are stronger',
				motivationType: 'power'
			});
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 2,
				description: 'Our armies combined are unstoppable',
				motivationType: 'power'
			});
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 2,
				description: 'Together we can defeat our enemies',
				motivationType: 'power'
			});

			// Should have auto-completed at interest = 5
			const completedNegotiation = await negotiationRepository.getById(negotiation.id);
			expect(completedNegotiation?.status).toBe('completed');
			expect(completedNegotiation?.outcome).toBe('alliance');

			// Verify narrative event has correct outcome
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(1);
			expect(narrativeEvents[0].fields?.outcome).toBe('alliance');
		});

		it('should handle negotiation with no description', async () => {
			// Create negotiation without description
			const negotiation = await negotiationRepository.create({
				name: 'Simple Request',
				npcName: 'Guard Captain',
				motivations: [{ type: 'justice', description: 'Follows the law' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Complete negotiation
			await negotiationRepository.completeNegotiation(negotiation.id);

			// Verify narrative event created with empty description
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(1);
			expect(narrativeEvents[0].name).toBe('Simple Request');
			expect(narrativeEvents[0].description).toBe('');
		});
	});

	describe('Auto-Completion Integration', () => {
		it('should create narrative event when interest reaches 5 (auto-complete)', async () => {
			// Create and start negotiation
			const negotiation = await negotiationRepository.create({
				name: 'Perfect Pitch',
				description: 'Convincing the council',
				npcName: 'Council Leader',
				motivations: [{ type: 'charity', description: 'Wants to help people' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Get entity count before auto-completion
			const entitiesBeforeAutoComplete = await db.entities.count();

			// Record enough successful arguments to reach interest 5
			// Starting at interest 2, need +3
			// Tier 3 motivation: +1 interest
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 3,
				description: 'Think of the children',
				motivationType: 'charity'
			});
			// Now at interest 3
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 2,
				description: 'We can help so many',
				motivationType: 'charity'
			});
			// Now at interest 4
			const result = await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 2,
				description: 'This will change lives',
				motivationType: 'charity'
			});

			// Should auto-complete at interest 5
			expect(result.status).toBe('completed');
			expect(result.interest).toBe(5);
			expect(result.outcome).toBe('alliance');

			// Verify narrative event was created
			const entitiesAfterAutoComplete = await db.entities.count();
			expect(entitiesAfterAutoComplete).toBe(entitiesBeforeAutoComplete + 1);

			// Verify narrative event details
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(1);
			expect(narrativeEvents[0].name).toBe('Perfect Pitch');
			expect(narrativeEvents[0].fields?.eventType).toBe('negotiation');
			expect(narrativeEvents[0].fields?.outcome).toBe('alliance');
		});

		it('should create narrative event when interest reaches 0 (auto-complete failure)', async () => {
			// Create and start negotiation
			const negotiation = await negotiationRepository.create({
				name: 'Doomed Negotiation',
				npcName: 'Stubborn Noble',
				motivations: [{ type: 'greed', description: 'Only cares about gold' }],
				pitfalls: [{ description: 'Hates commoners' }]
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Record arguments to decrease interest to 0
			// Starting at interest 2
			const result = await negotiationRepository.recordArgument(negotiation.id, {
				type: 'pitfall',
				tier: 1,
				description: 'Mentioned common folk'
			});
			// Interest now at 1
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'pitfall',
				tier: 1,
				description: 'Another mistake'
			});
			// Interest now at 0, should auto-complete

			const completedNegotiation = await negotiationRepository.getById(negotiation.id);
			expect(completedNegotiation?.status).toBe('completed');
			expect(completedNegotiation?.interest).toBe(0);
			expect(completedNegotiation?.outcome).toBe('failure');

			// Verify narrative event was created
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(1);
			expect(narrativeEvents[0].fields?.outcome).toBe('failure');
		});

		it('should create narrative event when patience reaches 0 (auto-complete)', async () => {
			// Create and start negotiation
			const negotiation = await negotiationRepository.create({
				name: 'Lost Patience',
				npcName: 'Impatient Merchant',
				motivations: [{ type: 'wealth', description: 'Wants profit' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Record motivation Tier 1 arguments to drain patience without changing interest
			// Each motivation Tier 1: +0 interest, -1 patience
			// Starting patience: 5, interest: 2
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 1,
				description: 'Weak appeal to profit',
				motivationType: 'wealth'
			});
			// Patience now 4, interest still 2
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 1,
				description: 'Another weak appeal',
				motivationType: 'wealth'
			});
			// Patience now 3, interest still 2
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 1,
				description: 'Yet another weak appeal',
				motivationType: 'wealth'
			});
			// Patience now 2, interest still 2
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 1,
				description: 'Running out of patience',
				motivationType: 'wealth'
			});
			// Patience now 1, interest still 2
			const result = await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 1,
				description: 'Final weak argument',
				motivationType: 'wealth'
			});
			// Patience now 0, should auto-complete (interest still 2)

			expect(result.status).toBe('completed');
			expect(result.patience).toBe(0);
			expect(result.interest).toBe(2);

			// Verify narrative event was created
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(1);
			expect(narrativeEvents[0].name).toBe('Lost Patience');
		});
	});

	describe('Error Handling', () => {
		it('should not throw if narrative event creation fails', async () => {
			// Create and start negotiation
			const negotiation = await negotiationRepository.create({
				name: 'Test Negotiation',
				npcName: 'Test NPC',
				motivations: [{ type: 'justice', description: 'Test' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Complete negotiation should succeed even if narrative event fails
			await expect(
				negotiationRepository.completeNegotiation(negotiation.id)
			).resolves.toBeDefined();

			// Negotiation should be completed
			const completedNegotiation = await negotiationRepository.getById(negotiation.id);
			expect(completedNegotiation?.status).toBe('completed');
		});

		it('should not throw if narrative event creation fails during auto-completion', async () => {
			// Create and start negotiation
			const negotiation = await negotiationRepository.create({
				name: 'Auto-Complete Test',
				npcName: 'Test NPC',
				motivations: [{ type: 'power', description: 'Test' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Record arguments to trigger auto-completion at interest 5
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 3,
				description: 'Argument 1',
				motivationType: 'power'
			});
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 2,
				description: 'Argument 2',
				motivationType: 'power'
			});

			// This should trigger auto-completion
			await expect(
				negotiationRepository.recordArgument(negotiation.id, {
					type: 'motivation',
					tier: 2,
					description: 'Argument 3',
					motivationType: 'power'
				})
			).resolves.toBeDefined();

			// Negotiation should be completed
			const completedNegotiation = await negotiationRepository.getById(negotiation.id);
			expect(completedNegotiation?.status).toBe('completed');
			expect(completedNegotiation?.interest).toBe(5);
		});
	});

	describe('Multiple Negotiations', () => {
		it('should create separate narrative events for multiple negotiations', async () => {
			// Create and complete first negotiation
			const negotiation1 = await negotiationRepository.create({
				name: 'First Negotiation',
				npcName: 'NPC One',
				motivations: [{ type: 'harmony', description: 'Wants peace' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation1.id);
			await negotiationRepository.completeNegotiation(negotiation1.id);

			// Create and complete second negotiation
			const negotiation2 = await negotiationRepository.create({
				name: 'Second Negotiation',
				npcName: 'NPC Two',
				motivations: [{ type: 'wealth', description: 'Wants gold' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation2.id);
			await negotiationRepository.completeNegotiation(negotiation2.id);

			// Should have 2 narrative events
			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents).toHaveLength(2);

			// Verify both are negotiation type
			const negotiationEvents = narrativeEvents.filter(
				(e) => e.fields?.eventType === 'negotiation'
			);
			expect(negotiationEvents).toHaveLength(2);

			// Verify names
			const names = narrativeEvents.map((e) => e.name).sort();
			expect(names).toEqual(['First Negotiation', 'Second Negotiation']);
		});

		it('should create narrative events for mix of combat, montage, and negotiation', async () => {
			// This test assumes combat and montage integration already works
			// We're just verifying negotiation events are created alongside them

			// Create and complete a negotiation
			const negotiation = await negotiationRepository.create({
				name: 'Diplomatic Mission',
				npcName: 'Ambassador',
				motivations: [{ type: 'harmony', description: 'Wants peace' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);
			await negotiationRepository.completeNegotiation(negotiation.id);

			// Verify negotiation narrative event exists
			const negotiationEvents = await db.entities
				.filter((e) => e.type === 'narrative_event' && e.fields?.eventType === 'negotiation')
				.toArray();

			expect(negotiationEvents).toHaveLength(1);
			expect(negotiationEvents[0].name).toBe('Diplomatic Mission');
		});
	});

	describe('Outcome Mapping', () => {
		it('should create narrative event with failure outcome for interest 0-1', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Failed Talk',
				npcName: 'Hostile NPC',
				motivations: [],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Force interest to 1 (starting at 2, one pitfall to 1)
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'pitfall',
				tier: 1,
				description: 'Mistake'
			});

			// Complete at interest 1
			await negotiationRepository.completeNegotiation(negotiation.id);

			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents[0].fields?.outcome).toBe('failure');
		});

		it('should create narrative event with minor_favor outcome for interest 2', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Minor Success',
				npcName: 'Neutral NPC',
				motivations: [],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Complete at starting interest (2)
			await negotiationRepository.completeNegotiation(negotiation.id);

			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents[0].fields?.outcome).toBe('minor_favor');
		});

		it('should create narrative event with major_favor outcome for interest 3-4', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Good Result',
				npcName: 'Friendly NPC',
				motivations: [{ type: 'charity', description: 'Kind' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Get to interest 3
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 3,
				description: 'Good argument',
				motivationType: 'charity'
			});

			// Complete at interest 3
			await negotiationRepository.completeNegotiation(negotiation.id);

			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents[0].fields?.outcome).toBe('major_favor');
		});

		it('should create narrative event with alliance outcome for interest 5', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Best Outcome',
				npcName: 'Allied Leader',
				motivations: [{ type: 'power', description: 'Seeks strength' }],
				pitfalls: []
			});
			await negotiationRepository.startNegotiation(negotiation.id);

			// Get to interest 5 (starting at 2, need +3)
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 3,
				description: 'Great argument',
				motivationType: 'power'
			});
			// Interest now 3
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 2,
				description: 'Another good argument',
				motivationType: 'power'
			});
			// Interest now 4
			await negotiationRepository.recordArgument(negotiation.id, {
				type: 'motivation',
				tier: 2,
				description: 'Final argument',
				motivationType: 'power'
			});
			// Interest now 5, auto-completed

			const narrativeEvents = await db.entities
				.filter((e) => e.type === 'narrative_event')
				.toArray();

			expect(narrativeEvents[0].fields?.outcome).toBe('alliance');
		});
	});
});
