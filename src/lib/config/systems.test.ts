import { describe, it, expect } from 'vitest';
import { getSystemProfile, getAllSystemProfiles } from './systems';
import type { SystemProfile } from '$lib/types/systems';

/**
 * Test Strategy: System Profiles Configuration
 *
 * RED Phase (TDD): These tests define the expected behavior of the system profile
 * configuration before implementation. Tests will FAIL until the systems.ts module
 * is implemented.
 *
 * System profiles provide game-system-specific customizations (Draw Steel, D&D 5e, etc.)
 * that modify entity types, add system-specific fields, and customize terminology.
 *
 * Key Test Scenarios:
 * 1. Built-in system profiles exist and are properly structured
 * 2. Draw Steel profile has specific entity type modifications
 * 3. System-agnostic profile acts as a passthrough (no modifications)
 * 4. Unknown system IDs return undefined
 * 5. Custom systems can be retrieved alongside built-in systems
 * 6. Draw Steel uses correct terminology ("Director" instead of "GM")
 */

describe('systems.ts - System Profile Configuration', () => {
	describe('getSystemProfile()', () => {
		describe('Built-in System: draw-steel', () => {
			it('should return Draw Steel system profile', () => {
				const profile = getSystemProfile('draw-steel');

				expect(profile).toBeDefined();
				expect(profile?.id).toBe('draw-steel');
				expect(profile?.name).toBe('Draw Steel');
			});

			it('should have entityTypeModifications for character type', () => {
				const profile = getSystemProfile('draw-steel');

				expect(profile?.entityTypeModifications).toBeDefined();
				expect(profile?.entityTypeModifications?.character).toBeDefined();
			});

			it('should add Draw Steel character-specific fields (ancestry, class, kit, heroicResource)', () => {
				const profile = getSystemProfile('draw-steel');
				const characterMods = profile?.entityTypeModifications?.character;

				expect(characterMods?.additionalFields).toBeDefined();
				const fieldKeys = characterMods?.additionalFields?.map((f) => f.key) ?? [];

				expect(fieldKeys).toContain('ancestry');
				expect(fieldKeys).toContain('class');
				expect(fieldKeys).toContain('kit');
				expect(fieldKeys).toContain('heroicResource');
			});

			it('should add Draw Steel NPC-specific fields (threatLevel, role)', () => {
				const profile = getSystemProfile('draw-steel');
				const npcMods = profile?.entityTypeModifications?.npc;

				expect(npcMods?.additionalFields).toBeDefined();
				const fieldKeys = npcMods?.additionalFields?.map((f) => f.key) ?? [];

				expect(fieldKeys).toContain('threatLevel');
				expect(fieldKeys).toContain('role');
			});

			it('should add Draw Steel encounter-specific fields (victoryPoints, negotiationDC)', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;

				expect(encounterMods?.additionalFields).toBeDefined();
				const fieldKeys = encounterMods?.additionalFields?.map((f) => f.key) ?? [];

				expect(fieldKeys).toContain('victoryPoints');
				expect(fieldKeys).toContain('negotiationDC');
			});

			it('should override encounter type options with Draw Steel-specific types', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;

				expect(encounterMods?.fieldOptionOverrides).toBeDefined();
				expect(encounterMods?.fieldOptionOverrides?.encounterType).toBeDefined();

				const encounterTypeOptions = encounterMods?.fieldOptionOverrides?.encounterType;
				expect(encounterTypeOptions).toContain('combat');
				expect(encounterTypeOptions).toContain('negotiation');
				expect(encounterTypeOptions).toContain('montage');
				expect(encounterTypeOptions).toContain('exploration');
				expect(encounterTypeOptions).toContain('social');
				expect(encounterTypeOptions).toContain('puzzle');
				expect(encounterTypeOptions).toContain('trap');
			});

			it('should use "Director" terminology instead of "GM"', () => {
				const profile = getSystemProfile('draw-steel');

				expect(profile?.terminology).toBeDefined();
				expect(profile?.terminology?.gm).toBe('Director');
			});

			it('should have ancestry field as select type with Draw Steel ancestries', () => {
				const profile = getSystemProfile('draw-steel');
				const characterMods = profile?.entityTypeModifications?.character;
				const ancestryField = characterMods?.additionalFields?.find((f) => f.key === 'ancestry');

				expect(ancestryField).toBeDefined();
				expect(ancestryField?.label).toBe('Ancestry');
				expect(ancestryField?.type).toBe('select');
				expect(ancestryField?.options).toContain('Human');
				expect(ancestryField?.options).toContain('Dwarf');
				expect(ancestryField?.options).toContain('Elf');
				expect(ancestryField?.options).toContain('Orc');
				expect(ancestryField?.options).toContain('Dragon Knight');
				expect(ancestryField?.options).toContain('Revenant');
				expect(ancestryField?.required).toBe(false);
				expect(ancestryField?.order).toBeGreaterThan(0);
			});

			it('should have class field as select type with Draw Steel classes', () => {
				const profile = getSystemProfile('draw-steel');
				const characterMods = profile?.entityTypeModifications?.character;
				const classField = characterMods?.additionalFields?.find((f) => f.key === 'class');

				expect(classField).toBeDefined();
				expect(classField?.label).toBe('Class');
				expect(classField?.type).toBe('select');
				expect(classField?.options).toContain('Tactician');
				expect(classField?.options).toContain('Fury');
				expect(classField?.options).toContain('Shadow');
				expect(classField?.options).toContain('Elementalist');
				expect(classField?.options).toContain('Talent');
				expect(classField?.options).toContain('Censor');
				expect(classField?.options).toContain('Conduit');
				expect(classField?.options).toContain('Null');
			});

			it('should have heroicResource field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const characterMods = profile?.entityTypeModifications?.character;
				const heroicResourceField = characterMods?.additionalFields?.find(
					(f) => f.key === 'heroicResource'
				);

				expect(heroicResourceField).toBeDefined();
				expect(heroicResourceField?.type).toBe('richtext');
			});

			it('should have threatLevel field as select type with specific options', () => {
				const profile = getSystemProfile('draw-steel');
				const npcMods = profile?.entityTypeModifications?.npc;
				const threatLevelField = npcMods?.additionalFields?.find((f) => f.key === 'threatLevel');

				expect(threatLevelField).toBeDefined();
				expect(threatLevelField?.type).toBe('select');
				expect(threatLevelField?.options).toBeDefined();
				expect(threatLevelField?.options).toContain('minion');
				expect(threatLevelField?.options).toContain('standard');
				expect(threatLevelField?.options).toContain('boss');
			});

			it('should have victoryPoints field as number type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const victoryPointsField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'victoryPoints'
				);

				expect(victoryPointsField).toBeDefined();
				expect(victoryPointsField?.type).toBe('number');
			});

			it('should have negotiationDC field as number type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const negotiationDCField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'negotiationDC'
				);

				expect(negotiationDCField).toBeDefined();
				expect(negotiationDCField?.type).toBe('number');
			});

			/**
			 * Tests for NEW Draw Steel Encounter Fields (Issue #3)
			 * These tests define the additional fields required for encounters.
			 */

			it('should have challengeLevel field as number type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const challengeLevelField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'challengeLevel'
				);

				expect(challengeLevelField).toBeDefined();
				expect(challengeLevelField?.label).toBe('Challenge Level');
				expect(challengeLevelField?.type).toBe('number');
				expect(challengeLevelField?.required).toBe(false);
			});

			it('should have threats field as entity-refs type with npc entityType', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const threatsField = encounterMods?.additionalFields?.find((f) => f.key === 'threats');

				expect(threatsField).toBeDefined();
				expect(threatsField?.label).toBe('Threats');
				expect(threatsField?.type).toBe('entity-refs');
				expect(threatsField?.entityTypes).toBeDefined();
				expect(threatsField?.entityTypes).toContain('npc');
				expect(threatsField?.required).toBe(false);
			});

			it('should have environment field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const environmentField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'environment'
				);

				expect(environmentField).toBeDefined();
				expect(environmentField?.label).toBe('Environment');
				expect(environmentField?.type).toBe('richtext');
				expect(environmentField?.required).toBe(false);
			});

			it('should have victoryConditions field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const victoryConditionsField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'victoryConditions'
				);

				expect(victoryConditionsField).toBeDefined();
				expect(victoryConditionsField?.label).toBe('Victory Conditions');
				expect(victoryConditionsField?.type).toBe('richtext');
				expect(victoryConditionsField?.required).toBe(false);
			});

			it('should have defeatConditions field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const defeatConditionsField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'defeatConditions'
				);

				expect(defeatConditionsField).toBeDefined();
				expect(defeatConditionsField?.label).toBe('Defeat Conditions');
				expect(defeatConditionsField?.type).toBe('richtext');
				expect(defeatConditionsField?.required).toBe(false);
			});

			it('should have readAloudText field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const readAloudTextField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'readAloudText'
				);

				expect(readAloudTextField).toBeDefined();
				expect(readAloudTextField?.label).toBe('Read-Aloud Text');
				expect(readAloudTextField?.type).toBe('richtext');
				expect(readAloudTextField?.required).toBe(false);
			});

			it('should have tacticalNotes field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const tacticalNotesField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'tacticalNotes'
				);

				expect(tacticalNotesField).toBeDefined();
				expect(tacticalNotesField?.label).toBe('Tactical Notes');
				expect(tacticalNotesField?.type).toBe('richtext');
				expect(tacticalNotesField?.required).toBe(false);
			});

			it('should have treasureRewards field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const treasureRewardsField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'treasureRewards'
				);

				expect(treasureRewardsField).toBeDefined();
				expect(treasureRewardsField?.label).toBe('Treasure & Rewards');
				expect(treasureRewardsField?.type).toBe('richtext');
				expect(treasureRewardsField?.required).toBe(false);
			});

			it('should have negotiationPosition field as select type with specific positions', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const negotiationPositionField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'negotiationPosition'
				);

				expect(negotiationPositionField).toBeDefined();
				expect(negotiationPositionField?.label).toBe('Negotiation Position');
				expect(negotiationPositionField?.type).toBe('select');
				expect(negotiationPositionField?.options).toBeDefined();
				expect(negotiationPositionField?.options).toContain('hostile');
				expect(negotiationPositionField?.options).toContain('unfavorable');
				expect(negotiationPositionField?.options).toContain('neutral');
				expect(negotiationPositionField?.options).toContain('favorable');
				expect(negotiationPositionField?.options).toContain('friendly');
				expect(negotiationPositionField?.required).toBe(false);
			});

			it('should have negotiationMotivations field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const negotiationMotivationsField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'negotiationMotivations'
				);

				expect(negotiationMotivationsField).toBeDefined();
				expect(negotiationMotivationsField?.label).toBe('Negotiation Motivations');
				expect(negotiationMotivationsField?.type).toBe('richtext');
				expect(negotiationMotivationsField?.required).toBe(false);
			});

			/**
			 * Tests for NEW Draw Steel Session Fields (Issue #3)
			 * These tests define the additional fields required for session tracking.
			 */

			it('should have entityTypeModifications for session type', () => {
				const profile = getSystemProfile('draw-steel');

				expect(profile?.entityTypeModifications).toBeDefined();
				expect(profile?.entityTypeModifications?.session).toBeDefined();
			});

			it('should have sessionDuration field as text type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const sessionDurationField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'sessionDuration'
				);

				expect(sessionDurationField).toBeDefined();
				expect(sessionDurationField?.label).toBe('Session Duration');
				expect(sessionDurationField?.type).toBe('text');
				expect(sessionDurationField?.required).toBe(false);
			});

			it('should have inWorldDate field as text type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const inWorldDateField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'inWorldDate'
				);

				expect(inWorldDateField).toBeDefined();
				expect(inWorldDateField?.label).toBe('In-World Date');
				expect(inWorldDateField?.type).toBe('text');
				expect(inWorldDateField?.required).toBe(false);
			});

			it('should have partyPresent field as entity-refs type with character entityType', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const partyPresentField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'partyPresent'
				);

				expect(partyPresentField).toBeDefined();
				expect(partyPresentField?.label).toBe('Party Present');
				expect(partyPresentField?.type).toBe('entity-refs');
				expect(partyPresentField?.entityTypes).toBeDefined();
				expect(partyPresentField?.entityTypes).toContain('character');
				expect(partyPresentField?.required).toBe(false);
			});

			it('should have xpAwarded field as number type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const xpAwardedField = sessionMods?.additionalFields?.find((f) => f.key === 'xpAwarded');

				expect(xpAwardedField).toBeDefined();
				expect(xpAwardedField?.label).toBe('XP Awarded');
				expect(xpAwardedField?.type).toBe('number');
				expect(xpAwardedField?.required).toBe(false);
			});

			// Issue #3 + Draw Steel accuracy refinement
			it('should have gloryAwarded field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const gloryAwardedField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'gloryAwarded'
				);

				expect(gloryAwardedField).toBeDefined();
				expect(gloryAwardedField?.label).toBe('Glory Awarded');
				expect(gloryAwardedField?.type).toBe('richtext');
				expect(gloryAwardedField?.required).toBe(false);
			});

			it('should have treasureAwarded field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const treasureAwardedField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'treasureAwarded'
				);

				expect(treasureAwardedField).toBeDefined();
				expect(treasureAwardedField?.label).toBe('Treasure Awarded');
				expect(treasureAwardedField?.type).toBe('richtext');
				expect(treasureAwardedField?.required).toBe(false);
			});

			it('should have keyDecisions field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const keyDecisionsField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'keyDecisions'
				);

				expect(keyDecisionsField).toBeDefined();
				expect(keyDecisionsField?.label).toBe('Key Decisions');
				expect(keyDecisionsField?.type).toBe('richtext');
				expect(keyDecisionsField?.required).toBe(false);
			});

			it('should have characterDevelopment field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const characterDevelopmentField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'characterDevelopment'
				);

				expect(characterDevelopmentField).toBeDefined();
				expect(characterDevelopmentField?.label).toBe('Character Development');
				expect(characterDevelopmentField?.type).toBe('richtext');
				expect(characterDevelopmentField?.required).toBe(false);
			});

			it('should have campaignMilestones field as tags type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const campaignMilestonesField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'campaignMilestones'
				);

				expect(campaignMilestonesField).toBeDefined();
				expect(campaignMilestonesField?.label).toBe('Campaign Milestones');
				expect(campaignMilestonesField?.type).toBe('tags');
				expect(campaignMilestonesField?.required).toBe(false);
			});

			it('should have powerRollOutcomes field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const powerRollOutcomesField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'powerRollOutcomes'
				);

				expect(powerRollOutcomesField).toBeDefined();
				expect(powerRollOutcomesField?.label).toBe('Power Roll Outcomes');
				expect(powerRollOutcomesField?.type).toBe('richtext');
				expect(powerRollOutcomesField?.required).toBe(false);
			});

			it('should have negotiationOutcomes field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const negotiationOutcomesField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'negotiationOutcomes'
				);

				expect(negotiationOutcomesField).toBeDefined();
				expect(negotiationOutcomesField?.label).toBe('Negotiation Outcomes');
				expect(negotiationOutcomesField?.type).toBe('richtext');
				expect(negotiationOutcomesField?.required).toBe(false);
			});

			it('should have initiativeOrder field as richtext type', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const initiativeOrderField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'initiativeOrder'
				);

				expect(initiativeOrderField).toBeDefined();
				expect(initiativeOrderField?.label).toBe('Initiative Order');
				expect(initiativeOrderField?.type).toBe('richtext');
				expect(initiativeOrderField?.required).toBe(false);
			});

			it('should have encountersRun field as entity-refs type with encounter entityType', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const encountersRunField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'encountersRun'
				);

				expect(encountersRunField).toBeDefined();
				expect(encountersRunField?.label).toBe('Encounters Run');
				expect(encountersRunField?.type).toBe('entity-refs');
				expect(encountersRunField?.entityTypes).toBeDefined();
				expect(encountersRunField?.entityTypes).toContain('encounter');
				expect(encountersRunField?.required).toBe(false);
			});
		});

		describe('Built-in System: system-agnostic', () => {
			it('should return system-agnostic profile', () => {
				const profile = getSystemProfile('system-agnostic');

				expect(profile).toBeDefined();
				expect(profile?.id).toBe('system-agnostic');
				expect(profile?.name).toBe('System Agnostic');
			});

			it('should have no entity type modifications', () => {
				const profile = getSystemProfile('system-agnostic');

				expect(profile?.entityTypeModifications).toEqual({});
			});

			it('should use standard "GM" terminology', () => {
				const profile = getSystemProfile('system-agnostic');

				expect(profile?.terminology).toBeDefined();
				expect(profile?.terminology?.gm).toBe('GM');
			});
		});

		describe('Unknown System IDs', () => {
			it('should return undefined for unknown system ID', () => {
				const profile = getSystemProfile('unknown-system');

				expect(profile).toBeUndefined();
			});

			it('should return undefined for empty string', () => {
				const profile = getSystemProfile('');

				expect(profile).toBeUndefined();
			});

			it('should return undefined for null (type coercion test)', () => {
				const profile = getSystemProfile(null as any);

				expect(profile).toBeUndefined();
			});
		});

		describe('Case Sensitivity', () => {
			it('should be case-sensitive for system IDs', () => {
				const profile = getSystemProfile('Draw-Steel');

				expect(profile).toBeUndefined();
			});

			it('should match exact case for draw-steel', () => {
				const profile = getSystemProfile('draw-steel');

				expect(profile).toBeDefined();
			});
		});
	});

	describe('getAllSystemProfiles()', () => {
		it('should return array of all built-in system profiles', () => {
			const profiles = getAllSystemProfiles();

			expect(Array.isArray(profiles)).toBe(true);
			expect(profiles.length).toBeGreaterThanOrEqual(2); // At least draw-steel and system-agnostic
		});

		it('should include draw-steel profile', () => {
			const profiles = getAllSystemProfiles();
			const drawSteelProfile = profiles.find((p) => p.id === 'draw-steel');

			expect(drawSteelProfile).toBeDefined();
		});

		it('should include system-agnostic profile', () => {
			const profiles = getAllSystemProfiles();
			const agnosticProfile = profiles.find((p) => p.id === 'system-agnostic');

			expect(agnosticProfile).toBeDefined();
		});

		it('should return only built-in systems when no custom systems provided', () => {
			const profiles = getAllSystemProfiles();

			profiles.forEach((profile) => {
				expect(profile).toHaveProperty('id');
				expect(profile).toHaveProperty('name');
				expect(profile).toHaveProperty('entityTypeModifications');
			});
		});

		it('should include custom systems when provided', () => {
			const customSystem: SystemProfile = {
				id: 'custom-system',
				name: 'Custom System',
				entityTypeModifications: {},
				terminology: { gm: 'Narrator' }
			};

			const profiles = getAllSystemProfiles([customSystem]);
			const customProfile = profiles.find((p) => p.id === 'custom-system');

			expect(customProfile).toBeDefined();
			expect(customProfile?.name).toBe('Custom System');
		});

		it('should combine built-in and custom systems', () => {
			const customSystem: SystemProfile = {
				id: 'custom-system',
				name: 'Custom System',
				entityTypeModifications: {},
				terminology: { gm: 'Storyteller' }
			};

			const profiles = getAllSystemProfiles([customSystem]);

			expect(profiles.length).toBeGreaterThanOrEqual(3); // Built-ins + custom
			expect(profiles.find((p) => p.id === 'draw-steel')).toBeDefined();
			expect(profiles.find((p) => p.id === 'system-agnostic')).toBeDefined();
			expect(profiles.find((p) => p.id === 'custom-system')).toBeDefined();
		});

		it('should not mutate the original custom systems array', () => {
			const customSystems: SystemProfile[] = [
				{
					id: 'custom-1',
					name: 'Custom 1',
					entityTypeModifications: {},
					terminology: { gm: 'GM' }
				}
			];

			const originalLength = customSystems.length;
			getAllSystemProfiles(customSystems);

			expect(customSystems.length).toBe(originalLength);
		});

		it('should allow custom system to override built-in system ID (custom takes precedence)', () => {
			const customDrawSteel: SystemProfile = {
				id: 'draw-steel',
				name: 'Custom Draw Steel',
				entityTypeModifications: {},
				terminology: { gm: 'Custom Director' }
			};

			const profiles = getAllSystemProfiles([customDrawSteel]);
			const drawSteelProfiles = profiles.filter((p) => p.id === 'draw-steel');

			// Custom system should replace built-in
			expect(drawSteelProfiles.length).toBe(1);
			expect(drawSteelProfiles[0].name).toBe('Custom Draw Steel');
		});
	});

	describe('SystemProfile Type Structure', () => {
		it('should have all required properties', () => {
			const profile = getSystemProfile('draw-steel');

			expect(profile).toHaveProperty('id');
			expect(profile).toHaveProperty('name');
			expect(profile).toHaveProperty('entityTypeModifications');
			expect(profile).toHaveProperty('terminology');
		});

		it('should have entityTypeModifications as object', () => {
			const profile = getSystemProfile('draw-steel');

			expect(typeof profile?.entityTypeModifications).toBe('object');
		});

		it('should have terminology object with gm property', () => {
			const profile = getSystemProfile('draw-steel');

			expect(profile?.terminology).toBeDefined();
			expect(typeof profile?.terminology?.gm).toBe('string');
		});

		it('should support optional description field', () => {
			const profile = getSystemProfile('draw-steel');

			// Description is optional, but if present should be a string
			if (profile?.description !== undefined) {
				expect(typeof profile.description).toBe('string');
			}
		});
	});

	describe('Field Definition Structure in Modifications', () => {
		it('should have properly structured field definitions', () => {
			const profile = getSystemProfile('draw-steel');
			const characterMods = profile?.entityTypeModifications?.character;
			const fields = characterMods?.additionalFields ?? [];

			fields.forEach((field) => {
				expect(field).toHaveProperty('key');
				expect(field).toHaveProperty('label');
				expect(field).toHaveProperty('type');
				expect(field).toHaveProperty('required');
				expect(field).toHaveProperty('order');

				expect(typeof field.key).toBe('string');
				expect(typeof field.label).toBe('string');
				expect(typeof field.type).toBe('string');
				expect(typeof field.required).toBe('boolean');
				expect(typeof field.order).toBe('number');
			});
		});

		it('should have unique field keys within each entity type', () => {
			const profile = getSystemProfile('draw-steel');
			const characterMods = profile?.entityTypeModifications?.character;
			const fieldKeys = characterMods?.additionalFields?.map((f) => f.key) ?? [];
			const uniqueKeys = new Set(fieldKeys);

			expect(fieldKeys.length).toBe(uniqueKeys.size);
		});

		it('should have positive order values', () => {
			const profile = getSystemProfile('draw-steel');
			const characterMods = profile?.entityTypeModifications?.character;
			const fields = characterMods?.additionalFields ?? [];

			fields.forEach((field) => {
				expect(field.order).toBeGreaterThan(0);
			});
		});
	});

	describe('Edge Cases and Defensive Checks', () => {
		it('should handle missing entityTypeModifications gracefully', () => {
			const profile = getSystemProfile('system-agnostic');

			expect(profile?.entityTypeModifications).toBeDefined();
			expect(profile?.entityTypeModifications).toEqual({});
		});

		it('should handle undefined additionalFields array', () => {
			const profile = getSystemProfile('system-agnostic');
			const characterMods = profile?.entityTypeModifications?.character;

			// Should either be undefined or an empty array
			expect(characterMods?.additionalFields === undefined || Array.isArray(characterMods?.additionalFields)).toBe(true);
		});

		it('should return consistent objects on multiple calls', () => {
			const profile1 = getSystemProfile('draw-steel');
			const profile2 = getSystemProfile('draw-steel');

			expect(profile1?.id).toBe(profile2?.id);
			expect(profile1?.name).toBe(profile2?.name);
		});
	});

	describe('Field Completeness and Structure (Issue #3)', () => {
		describe('Encounter Fields - Comprehensive Coverage', () => {
			it('should have all 10 new encounter fields defined', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const fieldKeys = encounterMods?.additionalFields?.map((f) => f.key) ?? [];

				// Original fields
				expect(fieldKeys).toContain('victoryPoints');
				expect(fieldKeys).toContain('negotiationDC');

				// New fields from Issue #3
				expect(fieldKeys).toContain('challengeLevel');
				expect(fieldKeys).toContain('threats');
				expect(fieldKeys).toContain('environment');
				expect(fieldKeys).toContain('victoryConditions');
				expect(fieldKeys).toContain('defeatConditions');
				expect(fieldKeys).toContain('readAloudText');
				expect(fieldKeys).toContain('tacticalNotes');
				expect(fieldKeys).toContain('treasureRewards');
				expect(fieldKeys).toContain('negotiationPosition');
				expect(fieldKeys).toContain('negotiationMotivations');
			});

			it('should have unique field keys in encounter modifications', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const fieldKeys = encounterMods?.additionalFields?.map((f) => f.key) ?? [];
				const uniqueKeys = new Set(fieldKeys);

				expect(fieldKeys.length).toBe(uniqueKeys.size);
			});

			it('should have positive order values for all encounter fields', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const fields = encounterMods?.additionalFields ?? [];

				fields.forEach((field) => {
					expect(field.order).toBeGreaterThan(0);
				});
			});
		});

		describe('Session Fields - Comprehensive Coverage', () => {
			it('should have all 13 session fields defined', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const fieldKeys = sessionMods?.additionalFields?.map((f) => f.key) ?? [];

				// All fields from Issue #3 + gloryAwarded from Draw Steel review
				expect(fieldKeys).toContain('sessionDuration');
				expect(fieldKeys).toContain('inWorldDate');
				expect(fieldKeys).toContain('partyPresent');
				expect(fieldKeys).toContain('xpAwarded');
				expect(fieldKeys).toContain('gloryAwarded');
				expect(fieldKeys).toContain('treasureAwarded');
				expect(fieldKeys).toContain('keyDecisions');
				expect(fieldKeys).toContain('characterDevelopment');
				expect(fieldKeys).toContain('campaignMilestones');
				expect(fieldKeys).toContain('powerRollOutcomes');
				expect(fieldKeys).toContain('negotiationOutcomes');
				expect(fieldKeys).toContain('initiativeOrder');
				expect(fieldKeys).toContain('encountersRun');
			});

			it('should have unique field keys in session modifications', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const fieldKeys = sessionMods?.additionalFields?.map((f) => f.key) ?? [];
				const uniqueKeys = new Set(fieldKeys);

				expect(fieldKeys.length).toBe(uniqueKeys.size);
			});

			it('should have positive order values for all session fields', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const fields = sessionMods?.additionalFields ?? [];

				fields.forEach((field) => {
					expect(field.order).toBeGreaterThan(0);
				});
			});

			it('should have properly structured field definitions for session', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const fields = sessionMods?.additionalFields ?? [];

				fields.forEach((field) => {
					expect(field).toHaveProperty('key');
					expect(field).toHaveProperty('label');
					expect(field).toHaveProperty('type');
					expect(field).toHaveProperty('required');
					expect(field).toHaveProperty('order');

					expect(typeof field.key).toBe('string');
					expect(typeof field.label).toBe('string');
					expect(typeof field.type).toBe('string');
					expect(typeof field.required).toBe('boolean');
					expect(typeof field.order).toBe('number');
				});
			});
		});

		describe('Entity-Refs Field Validation', () => {
			it('should have correct entityTypes for threats field', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const threatsField = encounterMods?.additionalFields?.find((f) => f.key === 'threats');

				expect(threatsField?.entityTypes).toBeDefined();
				expect(Array.isArray(threatsField?.entityTypes)).toBe(true);
				expect(threatsField?.entityTypes?.length).toBe(1);
				expect(threatsField?.entityTypes?.[0]).toBe('npc');
			});

			it('should have correct entityTypes for partyPresent field', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const partyPresentField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'partyPresent'
				);

				expect(partyPresentField?.entityTypes).toBeDefined();
				expect(Array.isArray(partyPresentField?.entityTypes)).toBe(true);
				expect(partyPresentField?.entityTypes?.length).toBe(1);
				expect(partyPresentField?.entityTypes?.[0]).toBe('character');
			});

			it('should have correct entityTypes for encountersRun field', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const encountersRunField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'encountersRun'
				);

				expect(encountersRunField?.entityTypes).toBeDefined();
				expect(Array.isArray(encountersRunField?.entityTypes)).toBe(true);
				expect(encountersRunField?.entityTypes?.length).toBe(1);
				expect(encountersRunField?.entityTypes?.[0]).toBe('encounter');
			});
		});

		describe('Select Field Options Validation', () => {
			it('should have exactly 5 options for negotiationPosition field', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const negotiationPositionField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'negotiationPosition'
				);

				expect(negotiationPositionField?.options).toBeDefined();
				expect(Array.isArray(negotiationPositionField?.options)).toBe(true);
				expect(negotiationPositionField?.options?.length).toBe(5);
			});

			it('should have negotiationPosition options in expected order', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const negotiationPositionField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'negotiationPosition'
				);

				const expectedOptions = ['hostile', 'unfavorable', 'neutral', 'favorable', 'friendly'];
				expect(negotiationPositionField?.options).toEqual(expectedOptions);
			});
		});

		describe('Field Type Validation', () => {
			it('should use richtext type for all narrative/descriptive fields', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const sessionMods = profile?.entityTypeModifications?.session;

				const encounterRichtextFields = [
					'environment',
					'victoryConditions',
					'defeatConditions',
					'readAloudText',
					'tacticalNotes',
					'treasureRewards',
					'negotiationMotivations'
				];

				const sessionRichtextFields = [
					'treasureAwarded',
					'keyDecisions',
					'characterDevelopment',
					'powerRollOutcomes',
					'negotiationOutcomes',
					'initiativeOrder'
				];

				encounterRichtextFields.forEach((fieldKey) => {
					const field = encounterMods?.additionalFields?.find((f) => f.key === fieldKey);
					expect(field?.type).toBe('richtext');
				});

				sessionRichtextFields.forEach((fieldKey) => {
					const field = sessionMods?.additionalFields?.find((f) => f.key === fieldKey);
					expect(field?.type).toBe('richtext');
				});
			});

			it('should use number type for numeric fields', () => {
				const profile = getSystemProfile('draw-steel');
				const encounterMods = profile?.entityTypeModifications?.encounter;
				const sessionMods = profile?.entityTypeModifications?.session;

				const challengeLevelField = encounterMods?.additionalFields?.find(
					(f) => f.key === 'challengeLevel'
				);
				const xpAwardedField = sessionMods?.additionalFields?.find((f) => f.key === 'xpAwarded');

				expect(challengeLevelField?.type).toBe('number');
				expect(xpAwardedField?.type).toBe('number');
			});

			it('should use text type for simple text fields', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;

				const sessionDurationField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'sessionDuration'
				);
				const inWorldDateField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'inWorldDate'
				);

				expect(sessionDurationField?.type).toBe('text');
				expect(inWorldDateField?.type).toBe('text');
			});

			it('should use tags type for campaignMilestones field', () => {
				const profile = getSystemProfile('draw-steel');
				const sessionMods = profile?.entityTypeModifications?.session;
				const campaignMilestonesField = sessionMods?.additionalFields?.find(
					(f) => f.key === 'campaignMilestones'
				);

				expect(campaignMilestonesField?.type).toBe('tags');
			});
		});
	});
});
