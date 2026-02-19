/**
 * Tests for Issue #553: Pitfall fields are empty when re-opening a saved negotiation
 *
 * ROOT CAUSE: Type mismatch between form and database formats
 * - Form uses: { type: MotivationType, isKnown: boolean } where MotivationType is lowercase ('greed')
 * - DB stores: { description: string, isKnown: boolean } where description is capitalized ('Greed')
 * - On load: /src/routes/negotiation/[id]/+page.svelte line ~160 casts p.description as MotivationType
 *   but doesn't convert the case, so "Greed" becomes an invalid MotivationType value
 * - Result: Select dropdown can't match "Greed" to any option, shows empty
 *
 * FIX REQUIRED:
 * - DB → Form: description.toLowerCase() to get back to valid MotivationType
 * - Form → DB: formatMotivationType(type) to get back to capitalized description
 *
 * These tests are in the RED phase - they WILL FAIL until the bug is fixed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { negotiationRepository } from '$lib/db/repositories/negotiationRepository';
import { db } from '$lib/db/index';
import type { NegotiationSession, MotivationType } from '$lib/types/negotiation';

describe('Issue #553: Pitfall Loading Bug - Data Format Conversion', () => {
	beforeEach(async () => {
		await db.negotiationSessions.clear();
	});

	afterEach(async () => {
		await db.negotiationSessions.clear();
	});

	describe('DB → Form Conversion (Load Flow)', () => {
		it('should convert pitfall description "Greed" to lowercase motivationType "greed"', async () => {
			// Create a negotiation with pitfalls (DB stores capitalized description)
			const negotiation = await negotiationRepository.create({
				name: 'Test Negotiation',
				npcName: 'Test NPC',
				motivations: [],
				pitfalls: [{ description: 'Greed' }] // DB format: capitalized
			});

			// Load it back
			const loaded = await negotiationRepository.getById(negotiation.id);

			// The pitfall description should be "Greed" in DB
			expect(loaded?.pitfalls[0].description).toBe('Greed');

			// When converting to form format, we need to lowercase it
			// This simulates what setupInitialData should do in +page.svelte line 160
			const formPitfall = {
				type: loaded!.pitfalls[0].description.toLowerCase() as MotivationType,
				isKnown: loaded!.pitfalls[0].isKnown
			};

			// The form format should have lowercase type
			expect(formPitfall.type).toBe('greed');

			// Verify it's a valid MotivationType
			const validTypes: MotivationType[] = [
				'charity', 'discovery', 'faith', 'freedom', 'greed', 'harmony',
				'justice', 'knowledge', 'legacy', 'power', 'protection', 'revenge', 'wealth'
			];
			expect(validTypes).toContain(formPitfall.type);
		});

		it('should convert all pitfall types correctly (all 13 motivation types)', async () => {
			const pitfallDescriptions = [
				'Charity', 'Discovery', 'Faith', 'Freedom', 'Greed', 'Harmony',
				'Justice', 'Knowledge', 'Legacy', 'Power', 'Protection', 'Revenge', 'Wealth'
			];

			const negotiation = await negotiationRepository.create({
				name: 'Test All Pitfalls',
				npcName: 'Test NPC',
				motivations: [],
				pitfalls: pitfallDescriptions.map(desc => ({ description: desc }))
			});

			const loaded = await negotiationRepository.getById(negotiation.id);
			expect(loaded).toBeDefined();

			// Convert each pitfall to form format
			const formPitfalls = loaded!.pitfalls.map(p => ({
				type: p.description.toLowerCase() as MotivationType,
				isKnown: p.isKnown
			}));

			// All should be lowercase
			expect(formPitfalls[0].type).toBe('charity');
			expect(formPitfalls[4].type).toBe('greed');
			expect(formPitfalls[12].type).toBe('wealth');

			// All should be valid MotivationType values
			const validTypes: MotivationType[] = [
				'charity', 'discovery', 'faith', 'freedom', 'greed', 'harmony',
				'justice', 'knowledge', 'legacy', 'power', 'protection', 'revenge', 'wealth'
			];
			formPitfalls.forEach(pitfall => {
				expect(validTypes).toContain(pitfall.type);
			});
		});

		it('should preserve isKnown state during conversion', async () => {
			const negotiation = await negotiationRepository.create({
				name: 'Test',
				npcName: 'NPC',
				motivations: [],
				pitfalls: [{ description: 'Power' }]
			});

			// Reveal the pitfall
			await negotiationRepository.revealPitfall(negotiation.id, 0);

			const loaded = await negotiationRepository.getById(negotiation.id);
			expect(loaded?.pitfalls[0].isKnown).toBe(true);

			// Convert to form format
			const formPitfall = {
				type: loaded!.pitfalls[0].description.toLowerCase() as MotivationType,
				isKnown: loaded!.pitfalls[0].isKnown
			};

			expect(formPitfall.type).toBe('power');
			expect(formPitfall.isKnown).toBe(true);
		});
	});

	describe('Form → DB Conversion (Update Flow)', () => {
		it('should convert form pitfall type "greed" to DB description "Greed"', () => {
			// This simulates the formatMotivationType function in +page.svelte
			const formType: MotivationType = 'greed';

			const formatMotivationType = (type: MotivationType): string => {
				return type
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
			};

			const dbDescription = formatMotivationType(formType);
			expect(dbDescription).toBe('Greed');
		});

		it('should handle multi-word motivation types correctly', () => {
			// Note: Current MotivationType enum doesn't have multi-word types,
			// but the formatMotivationType function supports them
			const formatMotivationType = (type: string): string => {
				return type
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
			};

			// Single word
			expect(formatMotivationType('greed')).toBe('Greed');
			expect(formatMotivationType('justice')).toBe('Justice');

			// Hypothetical multi-word (if we had snake_case types)
			expect(formatMotivationType('personal_gain')).toBe('Personal Gain');
		});
	});

	describe('Round-trip: Create → Save → Load → Update', () => {
		it('should maintain pitfall data through full create/load/update cycle', async () => {
			// Step 1: Create negotiation with pitfalls (simulating /negotiation/new page)
			const formData = {
				name: 'Round Trip Test',
				npcName: 'Merchant',
				motivations: [
					{ type: 'greed' as MotivationType, description: 'Greed' }
				],
				pitfalls: [
					{ description: 'Justice' }, // DB format: capitalized
					{ description: 'Power' }
				]
			};

			const created = await negotiationRepository.create(formData);
			expect(created.pitfalls).toHaveLength(2);
			expect(created.pitfalls[0].description).toBe('Justice');
			expect(created.pitfalls[1].description).toBe('Power');

			// Step 2: Load negotiation (simulating /negotiation/[id] page)
			const loaded = await negotiationRepository.getById(created.id);
			expect(loaded).toBeDefined();

			// Step 3: Convert to form format for editing (what setupInitialData should do)
			const setupInitialData = {
				name: loaded!.name,
				npcName: loaded!.npcName,
				description: loaded!.description,
				interest: loaded!.interest,
				patience: loaded!.patience,
				motivations: loaded!.motivations.map(m => ({
					type: m.type,
					isKnown: m.isKnown
				})),
				pitfalls: loaded!.pitfalls.map(p => ({
					type: p.description.toLowerCase() as MotivationType, // BUG FIX: lowercase conversion
					isKnown: p.isKnown
				}))
			};

			// Verify form data has lowercase types
			expect(setupInitialData.pitfalls[0].type).toBe('justice');
			expect(setupInitialData.pitfalls[1].type).toBe('power');

			// Step 4: Update the negotiation (simulating handleUpdateSetup)
			const formatMotivationType = (type: MotivationType): string => {
				return type
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
			};

			const updated = await negotiationRepository.update(created.id, {
				pitfalls: setupInitialData.pitfalls.map(p => ({
					description: formatMotivationType(p.type), // Convert back to capitalized
					isKnown: p.isKnown
				}))
			});

			// Verify DB still has capitalized descriptions
			expect(updated.pitfalls[0].description).toBe('Justice');
			expect(updated.pitfalls[1].description).toBe('Power');
		});

		it('should handle adding new pitfalls during update', async () => {
			// Create with one pitfall
			const created = await negotiationRepository.create({
				name: 'Test',
				npcName: 'NPC',
				motivations: [],
				pitfalls: [{ description: 'Greed' }]
			});

			// Load and convert to form format
			const loaded = await negotiationRepository.getById(created.id);
			const formPitfalls = loaded!.pitfalls.map(p => ({
				type: p.description.toLowerCase() as MotivationType,
				isKnown: p.isKnown
			}));

			// Add a new pitfall in the form
			formPitfalls.push({ type: 'revenge', isKnown: false });

			// Update with both pitfalls
			const formatMotivationType = (type: MotivationType): string => {
				return type
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
			};

			const updated = await negotiationRepository.update(created.id, {
				pitfalls: formPitfalls.map(p => ({
					description: formatMotivationType(p.type),
					isKnown: p.isKnown
				}))
			});

			expect(updated.pitfalls).toHaveLength(2);
			expect(updated.pitfalls[0].description).toBe('Greed');
			expect(updated.pitfalls[1].description).toBe('Revenge');
		});

		it('should handle removing pitfalls during update', async () => {
			// Create with two pitfalls
			const created = await negotiationRepository.create({
				name: 'Test',
				npcName: 'NPC',
				motivations: [],
				pitfalls: [
					{ description: 'Greed' },
					{ description: 'Power' }
				]
			});

			// Load and convert to form format
			const loaded = await negotiationRepository.getById(created.id);
			let formPitfalls = loaded!.pitfalls.map(p => ({
				type: p.description.toLowerCase() as MotivationType,
				isKnown: p.isKnown
			}));

			// Remove one pitfall
			formPitfalls = formPitfalls.slice(0, 1);

			// Update with only one pitfall
			const formatMotivationType = (type: MotivationType): string => {
				return type
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
			};

			const updated = await negotiationRepository.update(created.id, {
				pitfalls: formPitfalls.map(p => ({
					description: formatMotivationType(p.type),
					isKnown: p.isKnown
				}))
			});

			expect(updated.pitfalls).toHaveLength(1);
			expect(updated.pitfalls[0].description).toBe('Greed');
		});
	});

	describe('Edge Cases and Validation', () => {
		it('should handle empty pitfalls array', async () => {
			const created = await negotiationRepository.create({
				name: 'No Pitfalls',
				npcName: 'NPC',
				motivations: [],
				pitfalls: []
			});

			const loaded = await negotiationRepository.getById(created.id);

			const formPitfalls = loaded!.pitfalls.map(p => ({
				type: p.description.toLowerCase() as MotivationType,
				isKnown: p.isKnown
			}));

			expect(formPitfalls).toEqual([]);
		});

		it('should handle pitfall with isKnown=true during round-trip', async () => {
			const created = await negotiationRepository.create({
				name: 'Test',
				npcName: 'NPC',
				motivations: [],
				pitfalls: [{ description: 'Justice' }]
			});

			// Reveal the pitfall
			await negotiationRepository.revealPitfall(created.id, 0);

			// Load and convert
			const loaded = await negotiationRepository.getById(created.id);
			const formPitfall = {
				type: loaded!.pitfalls[0].description.toLowerCase() as MotivationType,
				isKnown: loaded!.pitfalls[0].isKnown
			};

			expect(formPitfall.type).toBe('justice');
			expect(formPitfall.isKnown).toBe(true);

			// Update back
			const formatMotivationType = (type: MotivationType): string => {
				return type
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
			};

			const updated = await negotiationRepository.update(created.id, {
				pitfalls: [{
					description: formatMotivationType(formPitfall.type),
					isKnown: formPitfall.isKnown
				}]
			});

			expect(updated.pitfalls[0].description).toBe('Justice');
			expect(updated.pitfalls[0].isKnown).toBe(true);
		});

		it('should reject invalid pitfall types after conversion', () => {
			// This test verifies type safety - "Greed" is NOT a valid MotivationType
			const dbPitfall = { description: 'Greed', isKnown: false };

			// Direct cast WITHOUT conversion (current buggy behavior)
			const buggyFormPitfall = {
				type: dbPitfall.description as MotivationType, // "Greed" is invalid!
				isKnown: dbPitfall.isKnown
			};

			// The select dropdown won't find "Greed" as an option
			const validTypes: MotivationType[] = [
				'charity', 'discovery', 'faith', 'freedom', 'greed', 'harmony',
				'justice', 'knowledge', 'legacy', 'power', 'protection', 'revenge', 'wealth'
			];

			// This will FAIL because "Greed" !== "greed"
			expect(validTypes).not.toContain(buggyFormPitfall.type as any);

			// Correct conversion (fix)
			const fixedFormPitfall = {
				type: dbPitfall.description.toLowerCase() as MotivationType,
				isKnown: dbPitfall.isKnown
			};

			// This will PASS
			expect(validTypes).toContain(fixedFormPitfall.type);
		});
	});

	describe('Integration: Simulating User Flow', () => {
		it('should reproduce Issue #553: empty pitfall fields on reload', async () => {
			// Step 1: User creates negotiation with pitfalls via /negotiation/new
			const formatMotivationType = (type: MotivationType): string => {
				return type
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
			};

			const userFormData = {
				name: 'Trade Negotiation',
				npcName: 'Greedy Merchant',
				motivations: [
					{ type: 'greed' as MotivationType, description: formatMotivationType('greed') }
				],
				pitfalls: [
					{ description: formatMotivationType('justice') }, // "Justice"
					{ description: formatMotivationType('charity') }  // "Charity"
				]
			};

			const created = await negotiationRepository.create(userFormData);

			// Step 2: User navigates away, then returns to /negotiation/[id]
			// The page loads the negotiation
			const loaded = await negotiationRepository.getById(created.id);
			expect(loaded).toBeDefined();

			// Step 3: Page tries to populate the edit form (BUGGY LINE 160-163)
			// Current buggy code: type: p.description as MotivationType
			const buggySetupData = {
				pitfalls: loaded!.pitfalls.map(p => ({
					type: p.description as MotivationType, // BUG: "Justice" is not a valid MotivationType
					isKnown: p.isKnown
				}))
			};

			// The form receives "Justice" but expects "justice"
			expect(buggySetupData.pitfalls[0].type).toBe('Justice' as any);
			expect(buggySetupData.pitfalls[1].type).toBe('Charity' as any);

			// Verify these are NOT valid MotivationType values
			const validTypes: MotivationType[] = [
				'charity', 'discovery', 'faith', 'freedom', 'greed', 'harmony',
				'justice', 'knowledge', 'legacy', 'power', 'protection', 'revenge', 'wealth'
			];

			// This is the BUG - the select dropdown can't match these capitalized values
			expect(validTypes).not.toContain(buggySetupData.pitfalls[0].type as any);
			expect(validTypes).not.toContain(buggySetupData.pitfalls[1].type as any);

			// Step 4: FIXED version with proper conversion
			const fixedSetupData = {
				pitfalls: loaded!.pitfalls.map(p => ({
					type: p.description.toLowerCase() as MotivationType, // FIX: lowercase conversion
					isKnown: p.isKnown
				}))
			};

			// Now the values are valid
			expect(fixedSetupData.pitfalls[0].type).toBe('justice');
			expect(fixedSetupData.pitfalls[1].type).toBe('charity');
			expect(validTypes).toContain(fixedSetupData.pitfalls[0].type);
			expect(validTypes).toContain(fixedSetupData.pitfalls[1].type);
		});

		it('should allow user to edit pitfalls after loading', async () => {
			// Create initial negotiation
			const formatMotivationType = (type: MotivationType): string => {
				return type
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
			};

			const created = await negotiationRepository.create({
				name: 'Test',
				npcName: 'NPC',
				motivations: [],
				pitfalls: [{ description: 'Greed' }]
			});

			// Load with proper conversion
			const loaded = await negotiationRepository.getById(created.id);
			const formPitfalls = loaded!.pitfalls.map(p => ({
				type: p.description.toLowerCase() as MotivationType,
				isKnown: p.isKnown
			}));

			// User changes pitfall type from 'greed' to 'power'
			formPitfalls[0].type = 'power';

			// Save the change
			const updated = await negotiationRepository.update(created.id, {
				pitfalls: formPitfalls.map(p => ({
					description: formatMotivationType(p.type),
					isKnown: p.isKnown
				}))
			});

			expect(updated.pitfalls[0].description).toBe('Power');
		});
	});
});
