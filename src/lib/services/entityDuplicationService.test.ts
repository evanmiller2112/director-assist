/**
 * Tests for Entity Duplication Service (TDD RED Phase)
 * GitHub Issue #221: Template-based quick duplication
 *
 * Tests the entity duplication service that allows users to duplicate entities
 * using a template as a base. This enables quick creation of similar entities
 * (e.g., multiple NPCs, locations, or monsters) with shared field structures.
 *
 * RED Phase: These tests SHOULD FAIL until implementation is complete.
 *
 * Covers:
 * - Basic entity duplication (name, description, fields)
 * - Template-based duplication with field structure preservation
 * - Entity-ref field handling (clear vs. preserve options)
 * - Relationship handling (clear vs. preserve options)
 * - Metadata handling
 * - Timestamp handling (new createdAt/updatedAt)
 * - Custom field preservation
 * - Array and complex field type handling
 * - Error handling for non-existent source entities
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { duplicateEntity } from './entityDuplicationService';
import { db } from '$lib/db';
import { createMockEntity } from '../../tests/utils/testUtils';
import type { BaseEntity } from '$lib/types';

describe('EntityDuplicationService', () => {
	beforeAll(async () => {
		await db.open();
	});

	afterAll(async () => {
		await db.close();
	});

	beforeEach(async () => {
		await db.entities.clear();
	});

	afterEach(async () => {
		await db.entities.clear();
	});

	describe('Basic Duplication', () => {
		it('should duplicate an entity with a new name', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Original NPC',
				type: 'npc',
				description: 'A mysterious figure',
				tags: ['merchant', 'quest-giver'],
				fields: {
					occupation: 'Blacksmith',
					alignment: 'Neutral Good'
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id, {
				newName: 'Copy of Original NPC'
			});

			expect(duplicated).toBeDefined();
			expect(duplicated.id).not.toBe(sourceEntity.id);
			expect(duplicated.name).toBe('Copy of Original NPC');
			expect(duplicated.type).toBe('npc');
			expect(duplicated.description).toBe('A mysterious figure');
			expect(duplicated.tags).toEqual(['merchant', 'quest-giver']);
			expect(duplicated.fields).toEqual({
				occupation: 'Blacksmith',
				alignment: 'Neutral Good'
			});
		});

		it('should generate a default name if none provided', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Town Guard',
				type: 'npc'
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.name).toBe('Town Guard (Copy)');
		});

		it('should create new timestamps for the duplicated entity', async () => {
			const oldDate = new Date('2023-01-01');
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Old Entity',
				createdAt: oldDate,
				updatedAt: oldDate
			});

			await db.entities.add(sourceEntity);

			const beforeDuplicate = new Date();
			const duplicated = await duplicateEntity(sourceEntity.id);
			const afterDuplicate = new Date();

			expect(duplicated.createdAt.getTime()).toBeGreaterThanOrEqual(beforeDuplicate.getTime());
			expect(duplicated.createdAt.getTime()).toBeLessThanOrEqual(afterDuplicate.getTime());
			expect(duplicated.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeDuplicate.getTime());
			expect(duplicated.updatedAt.getTime()).toBeLessThanOrEqual(afterDuplicate.getTime());
		});

		it('should persist the duplicated entity to the database', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Original',
				type: 'location'
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id, {
				newName: 'Duplicate'
			});

			const fromDb = await db.entities.get(duplicated.id);
			expect(fromDb).toBeDefined();
			expect(fromDb!.name).toBe('Duplicate');
			expect(fromDb!.type).toBe('location');
		});

		it('should throw error if source entity does not exist', async () => {
			await expect(duplicateEntity('non-existent-id')).rejects.toThrow(
				'Source entity not found'
			);
		});
	});

	describe('Field Duplication', () => {
		it('should deep copy all field values', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source Character',
				type: 'character',
				fields: {
					class: 'Warrior',
					level: 5,
					hitPoints: 45,
					equipment: ['Sword', 'Shield', 'Armor'],
					proficient: true
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.fields.class).toBe('Warrior');
			expect(duplicated.fields.level).toBe(5);
			expect(duplicated.fields.hitPoints).toBe(45);
			expect(duplicated.fields.equipment).toEqual(['Sword', 'Shield', 'Armor']);
			expect(duplicated.fields.proficient).toBe(true);
		});

		it('should preserve custom fields from entity type definition', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Monster',
				type: 'ds-monster-threat', // Custom entity type
				fields: {
					threat_level: 'boss',
					role: 'brute',
					ac: 18,
					hp: 150,
					movement: 30,
					abilities: '**Smash Attack**: Deal 2d10 damage'
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.fields.threat_level).toBe('boss');
			expect(duplicated.fields.role).toBe('brute');
			expect(duplicated.fields.ac).toBe(18);
			expect(duplicated.fields.hp).toBe(150);
			expect(duplicated.fields.movement).toBe(30);
			expect(duplicated.fields.abilities).toBe('**Smash Attack**: Deal 2d10 damage');
		});

		it('should handle empty fields object', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Minimal Entity',
				fields: {}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.fields).toEqual({});
		});

		it('should preserve rich text and markdown fields', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Story Location',
				type: 'location',
				fields: {
					history: '# The Ancient Castle\n\nBuilt in **1204**, this castle has seen many battles.',
					description: 'A foreboding structure with *tall towers* and deep dungeons.'
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.fields.history).toBe(
				'# The Ancient Castle\n\nBuilt in **1204**, this castle has seen many battles.'
			);
			expect(duplicated.fields.description).toBe(
				'A foreboding structure with *tall towers* and deep dungeons.'
			);
		});

		it('should handle null and undefined field values', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Entity with nulls',
				fields: {
					optional_field: null,
					another_field: undefined,
					present_field: 'value'
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.fields.optional_field).toBeNull();
			expect(duplicated.fields.another_field).toBeUndefined();
			expect(duplicated.fields.present_field).toBe('value');
		});
	});

	describe('Entity-Ref Field Handling', () => {
		it('should clear entity-ref fields by default', async () => {
			const targetEntity = createMockEntity({
				id: 'target-1',
				name: 'Referenced Entity',
				type: 'location'
			});

			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source NPC',
				type: 'npc',
				fields: {
					name: 'John',
					home_location: 'target-1', // entity-ref field
					occupation: 'Merchant'
				}
			});

			await db.entities.add(targetEntity);
			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.fields.name).toBe('John');
			expect(duplicated.fields.home_location).toBeNull(); // Cleared
			expect(duplicated.fields.occupation).toBe('Merchant');
		});

		it('should preserve entity-ref fields when option is specified', async () => {
			const targetEntity = createMockEntity({
				id: 'target-1',
				name: 'Shared Location',
				type: 'location'
			});

			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source Character',
				type: 'character',
				fields: {
					home_location: 'target-1',
					current_quest: 'quest-123'
				}
			});

			await db.entities.add(targetEntity);
			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id, {
				preserveEntityRefs: true
			});

			expect(duplicated.fields.home_location).toBe('target-1');
			expect(duplicated.fields.current_quest).toBe('quest-123');
		});

		it('should clear entity-refs fields (multiple references)', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Party Leader',
				type: 'character',
				fields: {
					party_members: ['char-1', 'char-2', 'char-3'], // entity-refs field
					class: 'Fighter'
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.fields.party_members).toEqual([]); // Cleared to empty array
			expect(duplicated.fields.class).toBe('Fighter');
		});

		it('should preserve entity-refs fields when option is specified', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Faction Leader',
				type: 'npc',
				fields: {
					faction_members: ['npc-1', 'npc-2', 'npc-3'],
					alignment: 'Lawful Good'
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id, {
				preserveEntityRefs: true
			});

			expect(duplicated.fields.faction_members).toEqual(['npc-1', 'npc-2', 'npc-3']);
			expect(duplicated.fields.alignment).toBe('Lawful Good');
		});

		it('should handle mixed field types correctly', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Complex Entity',
				type: 'character',
				fields: {
					// Regular fields (should be preserved)
					name: 'Gandalf',
					class: 'Wizard',
					level: 20,
					// Entity-ref fields (should be cleared by default)
					mentor: 'npc-saruman',
					companions: ['char-frodo', 'char-aragorn'],
					// Regular fields again
					alignment: 'Neutral Good',
					spells: ['Fireball', 'Lightning Bolt']
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			// Regular fields preserved
			expect(duplicated.fields.name).toBe('Gandalf');
			expect(duplicated.fields.class).toBe('Wizard');
			expect(duplicated.fields.level).toBe(20);
			expect(duplicated.fields.alignment).toBe('Neutral Good');
			expect(duplicated.fields.spells).toEqual(['Fireball', 'Lightning Bolt']);

			// Entity-ref fields cleared
			expect(duplicated.fields.mentor).toBeNull();
			expect(duplicated.fields.companions).toEqual([]);
		});
	});

	describe('Relationship Handling', () => {
		it('should clear all relationships by default', async () => {
			const targetEntity1 = createMockEntity({
				id: 'target-1',
				name: 'Faction A',
				type: 'faction'
			});

			const targetEntity2 = createMockEntity({
				id: 'target-2',
				name: 'Location B',
				type: 'location'
			});

			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source Character',
				type: 'character',
				links: [
					{
						id: 'link-1',
						sourceId: 'source-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					},
					{
						id: 'link-2',
						sourceId: 'source-1',
						targetId: 'target-2',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: true,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(targetEntity1);
			await db.entities.add(targetEntity2);
			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.links).toEqual([]);
		});

		it('should preserve relationships when option is specified', async () => {
			const targetEntity = createMockEntity({
				id: 'target-1',
				name: 'Shared Faction',
				type: 'faction'
			});

			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source Character',
				type: 'character',
				links: [
					{
						id: 'link-1',
						sourceId: 'source-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						notes: 'Senior member',
						strength: 'strong' as const,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(targetEntity);
			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id, {
				preserveRelationships: true
			});

			expect(duplicated.links).toHaveLength(1);
			expect(duplicated.links[0].targetId).toBe('target-1');
			expect(duplicated.links[0].relationship).toBe('member_of');
			expect(duplicated.links[0].notes).toBe('Senior member');
			expect(duplicated.links[0].strength).toBe('strong');
		});

		it('should generate new link IDs when preserving relationships', async () => {
			const targetEntity = createMockEntity({
				id: 'target-1',
				name: 'Target',
				type: 'faction'
			});

			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source',
				type: 'character',
				links: [
					{
						id: 'original-link-id',
						sourceId: 'source-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(targetEntity);
			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id, {
				preserveRelationships: true
			});

			expect(duplicated.links[0].id).not.toBe('original-link-id');
			expect(duplicated.links[0].id).toBeTruthy();
		});

		it('should update sourceId to new entity when preserving relationships', async () => {
			const targetEntity = createMockEntity({
				id: 'target-1',
				name: 'Target',
				type: 'location'
			});

			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source',
				type: 'npc',
				links: [
					{
						id: 'link-1',
						sourceId: 'source-1',
						targetId: 'target-1',
						targetType: 'location',
						relationship: 'located_at',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(targetEntity);
			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id, {
				preserveRelationships: true
			});

			expect(duplicated.links[0].sourceId).toBe(duplicated.id);
			expect(duplicated.links[0].sourceId).not.toBe('source-1');
		});

		it('should create new timestamps for preserved links', async () => {
			const oldDate = new Date('2023-01-01');
			const targetEntity = createMockEntity({
				id: 'target-1',
				name: 'Target',
				type: 'faction'
			});

			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source',
				type: 'character',
				links: [
					{
						id: 'link-1',
						sourceId: 'source-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: oldDate,
						updatedAt: oldDate
					}
				]
			});

			await db.entities.add(targetEntity);
			await db.entities.add(sourceEntity);

			const beforeDuplicate = new Date();
			const duplicated = await duplicateEntity(sourceEntity.id, {
				preserveRelationships: true
			});
			const afterDuplicate = new Date();

			const link = duplicated.links[0];
			expect(link.createdAt!.getTime()).toBeGreaterThanOrEqual(beforeDuplicate.getTime());
			expect(link.createdAt!.getTime()).toBeLessThanOrEqual(afterDuplicate.getTime());
			expect(link.updatedAt!.getTime()).toBeGreaterThanOrEqual(beforeDuplicate.getTime());
			expect(link.updatedAt!.getTime()).toBeLessThanOrEqual(afterDuplicate.getTime());
		});

		it('should NOT create bidirectional reverse links (avoid duplicates)', async () => {
			const targetEntity = createMockEntity({
				id: 'target-1',
				name: 'Target Faction',
				type: 'faction',
				links: []
			});

			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source Character',
				type: 'character',
				links: [
					{
						id: 'link-1',
						sourceId: 'source-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: true,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(targetEntity);
			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id, {
				preserveRelationships: true
			});

			// Target entity should NOT have a new link automatically created
			const targetAfter = await db.entities.get('target-1');
			expect(targetAfter!.links).toHaveLength(0);

			// Duplicated entity should have the link (marked bidirectional)
			expect(duplicated.links).toHaveLength(1);
			expect(duplicated.links[0].bidirectional).toBe(true);
		});
	});

	describe('Metadata and Core Properties', () => {
		it('should preserve description field', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source Entity',
				description: 'This is a detailed description\nwith multiple lines.',
				type: 'npc'
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.description).toBe('This is a detailed description\nwith multiple lines.');
		});

		it('should preserve tags array', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Tagged Entity',
				type: 'location',
				tags: ['important', 'capital', 'quest-location']
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.tags).toEqual(['important', 'capital', 'quest-location']);
			expect(duplicated.tags).not.toBe(sourceEntity.tags); // Different array reference
		});

		it('should preserve imageUrl if present', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Entity with Image',
				type: 'character',
				imageUrl: 'https://example.com/portrait.jpg'
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.imageUrl).toBe('https://example.com/portrait.jpg');
		});

		it('should preserve notes field', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Entity with Notes',
				type: 'npc',
				notes: 'DM Secret: This NPC is actually a dragon in disguise.'
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.notes).toBe('DM Secret: This NPC is actually a dragon in disguise.');
		});

		it('should preserve playerVisible setting', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Hidden Entity',
				type: 'npc',
				playerVisible: false
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.playerVisible).toBe(false);
		});

		it('should preserve metadata object', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Entity with Metadata',
				type: 'character',
				metadata: {
					customProp: 'value',
					importSource: 'forge-steel',
					version: 2
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.metadata).toEqual({
				customProp: 'value',
				importSource: 'forge-steel',
				version: 2
			});
			expect(duplicated.metadata).not.toBe(sourceEntity.metadata); // Different object reference
		});

		it('should preserve entity type', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Custom Type Entity',
				type: 'ds-monster-threat' // Custom entity type
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.type).toBe('ds-monster-threat');
		});

		it('should handle empty description and notes', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Minimal Entity',
				description: '',
				notes: '',
				type: 'item'
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.description).toBe('');
			expect(duplicated.notes).toBe('');
		});
	});

	describe('Template-Based Use Cases', () => {
		it('should create multiple NPCs from a template', async () => {
			const npcTemplate = createMockEntity({
				id: 'template-1',
				name: 'Town Guard Template',
				type: 'npc',
				description: 'A standard town guard',
				fields: {
					occupation: 'Guard',
					alignment: 'Lawful Neutral',
					weapon: 'Spear',
					armor_class: 14,
					hit_points: 30
				},
				tags: ['guard', 'npc']
			});

			await db.entities.add(npcTemplate);

			// Duplicate to create multiple guards
			const guard1 = await duplicateEntity(npcTemplate.id, { newName: 'Guard Marcus' });
			const guard2 = await duplicateEntity(npcTemplate.id, { newName: 'Guard Elena' });
			const guard3 = await duplicateEntity(npcTemplate.id, { newName: 'Guard Thorin' });

			// All should have same field structure but different IDs and names
			expect(guard1.name).toBe('Guard Marcus');
			expect(guard2.name).toBe('Guard Elena');
			expect(guard3.name).toBe('Guard Thorin');

			expect(guard1.fields.occupation).toBe('Guard');
			expect(guard2.fields.occupation).toBe('Guard');
			expect(guard3.fields.occupation).toBe('Guard');

			expect(guard1.id).not.toBe(guard2.id);
			expect(guard2.id).not.toBe(guard3.id);
			expect(guard1.id).not.toBe(guard3.id);
		});

		it('should create multiple monsters from a template with shared stats', async () => {
			const monsterTemplate = createMockEntity({
				id: 'template-1',
				name: 'Goblin Template',
				type: 'ds-monster-threat',
				fields: {
					threat_level: 'minion',
					role: 'striker',
					ac: 13,
					hp: 7,
					movement: 30,
					abilities: '**Nimble Escape**: Can disengage as a bonus action'
				}
			});

			await db.entities.add(monsterTemplate);

			const goblin1 = await duplicateEntity(monsterTemplate.id, { newName: 'Goblin Scout 1' });
			const goblin2 = await duplicateEntity(monsterTemplate.id, { newName: 'Goblin Scout 2' });

			expect(goblin1.fields.threat_level).toBe('minion');
			expect(goblin2.fields.threat_level).toBe('minion');
			expect(goblin1.fields.ac).toBe(13);
			expect(goblin2.fields.ac).toBe(13);
			expect(goblin1.id).not.toBe(goblin2.id);
		});

		it('should create location variants from a template', async () => {
			const locationTemplate = createMockEntity({
				id: 'template-1',
				name: 'Village Template',
				type: 'location',
				description: 'A small rural village',
				fields: {
					population: 200,
					government: 'Elder Council',
					primary_industry: 'Farming',
					defenses: 'Wooden palisade'
				},
				tags: ['settlement', 'rural']
			});

			await db.entities.add(locationTemplate);

			const village1 = await duplicateEntity(locationTemplate.id, { newName: 'Millbrook' });
			const village2 = await duplicateEntity(locationTemplate.id, { newName: 'Oakshire' });

			expect(village1.fields.government).toBe('Elder Council');
			expect(village2.fields.government).toBe('Elder Council');
			expect(village1.tags).toEqual(['settlement', 'rural']);
			expect(village2.tags).toEqual(['settlement', 'rural']);
		});
	});

	describe('Options and Configuration', () => {
		it('should accept all duplication options together', async () => {
			const targetEntity = createMockEntity({
				id: 'target-1',
				name: 'Faction',
				type: 'faction'
			});

			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Source',
				type: 'character',
				fields: {
					name: 'Gandalf',
					mentor: 'npc-1', // entity-ref
					companions: ['char-1', 'char-2'] // entity-refs
				},
				links: [
					{
						id: 'link-1',
						sourceId: 'source-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(targetEntity);
			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id, {
				newName: 'Custom Name',
				preserveEntityRefs: true,
				preserveRelationships: true
			});

			expect(duplicated.name).toBe('Custom Name');
			expect(duplicated.fields.mentor).toBe('npc-1'); // Preserved
			expect(duplicated.fields.companions).toEqual(['char-1', 'char-2']); // Preserved
			expect(duplicated.links).toHaveLength(1); // Preserved
		});

		it('should handle options with default values correctly', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Entity',
				type: 'npc',
				fields: {
					regular_field: 'value',
					entity_ref: 'ref-1'
				},
				links: [
					{
						id: 'link-1',
						sourceId: 'source-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			// Default behavior: clear entity-refs and relationships
			expect(duplicated.fields.regular_field).toBe('value');
			expect(duplicated.fields.entity_ref).toBeNull();
			expect(duplicated.links).toEqual([]);
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle entities with no fields', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Empty Entity',
				type: 'item',
				fields: {}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.fields).toEqual({});
		});

		it('should handle entities with no tags', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Untagged Entity',
				type: 'npc',
				tags: []
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.tags).toEqual([]);
		});

		it('should handle entities with no relationships', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Isolated Entity',
				type: 'character',
				links: []
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.links).toEqual([]);
		});

		it('should handle very long entity names', async () => {
			const longName = 'A'.repeat(500);
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: longName,
				type: 'npc'
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.name).toBe(`${longName} (Copy)`);
		});

		it('should handle special characters in entity names', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: "O'Malley's Tavern & Inn (Est. 1492)",
				type: 'location'
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.name).toBe("O'Malley's Tavern & Inn (Est. 1492) (Copy)");
		});

		it('should handle Unicode characters in fields', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Entity with Unicode',
				type: 'npc',
				fields: {
					name: '雷神トール',
					greeting: 'Привет! 你好! مرحبا',
					emoji: '⚔️🛡️🗡️'
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.fields.name).toBe('雷神トール');
			expect(duplicated.fields.greeting).toBe('Привет! 你好! مرحبا');
			expect(duplicated.fields.emoji).toBe('⚔️🛡️🗡️');
		});

		it('should handle entity with undefined metadata', async () => {
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Entity',
				type: 'npc'
			});

			// Explicitly ensure metadata exists as empty object (per BaseEntity interface)
			sourceEntity.metadata = {};

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			expect(duplicated.metadata).toBeDefined();
			expect(duplicated.metadata).toEqual({});
		});
	});

	describe('Integration with Entity Type Definitions', () => {
		it('should identify entity-ref fields based on entity type definition', async () => {
			// This test assumes the service will look up the entity type definition
			// to determine which fields are entity-ref or entity-refs types
			const sourceEntity = createMockEntity({
				id: 'source-1',
				name: 'Character with Complex Fields',
				type: 'character',
				fields: {
					// Regular fields (should be preserved)
					name: 'Aragorn',
					class: 'Ranger',
					level: 10,
					// Assume these are entity-ref fields based on entity type definition
					home_location: 'location-1',
					current_quest: 'quest-1',
					party_members: ['char-1', 'char-2']
				}
			});

			await db.entities.add(sourceEntity);

			const duplicated = await duplicateEntity(sourceEntity.id);

			// Service should use entity type definition to determine which fields to clear
			expect(duplicated.fields.name).toBe('Aragorn');
			expect(duplicated.fields.class).toBe('Ranger');
			expect(duplicated.fields.level).toBe(10);

			// These should be cleared (based on type definition)
			expect(duplicated.fields.home_location).toBeNull();
			expect(duplicated.fields.current_quest).toBeNull();
			expect(duplicated.fields.party_members).toEqual([]);
		});
	});
});
