/**
 * Tests for Creature Template Repository
 *
 * Issue #305: Creature Templates for Monsters - TDD RED Phase
 *
 * This repository manages creature templates in IndexedDB, providing functionality
 * for CRUD operations, search/filter, library management, and integration with combat.
 *
 * Testing Strategy:
 * - CRUD operations for creature templates
 * - Search by name and tags
 * - Filter by threat level and role
 * - Duplicate templates
 * - Import/export library (merge and replace modes)
 * - Create templates from ad-hoc combat creatures
 * - Edge cases and error handling
 *
 * Creature Template Features:
 * - Unique ID generation
 * - Automatic timestamp management
 * - Tag-based categorization
 * - Role and threat level filtering
 * - Library import/export with conflict resolution
 * - Template duplication with "(Copy)" suffix
 * - Creation from combat creatures
 *
 * These tests will FAIL until implementation is complete (RED phase).
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import { creatureRepository } from './creatureRepository';
import { db } from '../index';
import type {
	CreatureTemplate,
	CreateCreatureTemplateInput,
	CreatureLibraryExport
} from '$lib/types/creature';
import type { CreatureCombatant } from '$lib/types/combat';
import {
	createMockCreatureTemplate,
	createMockCreatureInput,
	createMinionTemplate,
	createEliteTemplate,
	createBossTemplate,
	createCreatureWithRole,
	createCreatureWithTags,
	createCreatureLibrary
} from '$tests/utils/creatureTestUtils';

describe('CreatureRepository - CRUD Operations', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		// Clear creature templates before each test
		await db.creatureTemplates.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.creatureTemplates.clear();
	});

	describe('create', () => {
		it('should create a new creature template', async () => {
			const input = createMockCreatureInput({
				name: 'Goblin Warrior',
				description: 'A basic goblin soldier',
				hp: 15,
				maxHp: 15,
				ac: 13,
				threat: 1,
				role: 'Brute',
				tags: ['goblinoid', 'humanoid'],
				abilities: [
					{
						name: 'Shortsword',
						description: 'Melee attack',
						type: 'action'
					}
				]
			});

			const template = await creatureRepository.create(input);

			expect(template).toBeDefined();
			expect(template.id).toBeDefined();
			expect(template.name).toBe('Goblin Warrior');
			expect(template.description).toBe('A basic goblin soldier');
			expect(template.hp).toBe(15);
			expect(template.maxHp).toBe(15);
			expect(template.ac).toBe(13);
			expect(template.threat).toBe(1);
			expect(template.role).toBe('Brute');
			expect(template.tags).toEqual(['goblinoid', 'humanoid']);
			expect(template.abilities.length).toBe(1);
			expect(template.abilities[0].name).toBe('Shortsword');
			expect(template.createdAt).toBeInstanceOf(Date);
			expect(template.updatedAt).toBeInstanceOf(Date);
		});

		it('should generate unique IDs for each template', async () => {
			const template1 = await creatureRepository.create(createMockCreatureInput({ name: 'Creature 1' }));
			const template2 = await creatureRepository.create(createMockCreatureInput({ name: 'Creature 2' }));

			expect(template1.id).not.toBe(template2.id);
		});

		it('should create template with minimal required fields', async () => {
			const input = createMockCreatureInput({
				name: 'Simple Creature',
				hp: 10,
				maxHp: 10,
				threat: 1,
				role: 'Brute',
				tags: [],
				abilities: []
			});

			const template = await creatureRepository.create(input);

			expect(template.name).toBe('Simple Creature');
			expect(template.description).toBeUndefined();
			expect(template.ac).toBeUndefined();
			expect(template.notes).toBeUndefined();
			expect(template.tags).toEqual([]);
			expect(template.abilities).toEqual([]);
		});

		it('should create template with all optional fields', async () => {
			const input = createMockCreatureInput({
				name: 'Complex Creature',
				description: 'Detailed description',
				hp: 50,
				maxHp: 50,
				ac: 16,
				threat: 2,
				role: 'Leader',
				tags: ['elite', 'boss'],
				abilities: [
					{ name: 'Ability 1', description: 'First ability', type: 'action' },
					{ name: 'Ability 2', description: 'Second ability', type: 'maneuver' }
				],
				notes: 'Special notes'
			});

			const template = await creatureRepository.create(input);

			expect(template.description).toBe('Detailed description');
			expect(template.ac).toBe(16);
			expect(template.notes).toBe('Special notes');
			expect(template.abilities.length).toBe(2);
		});

		it('should set timestamps on creation', async () => {
			const before = new Date();
			const template = await creatureRepository.create(createMockCreatureInput());
			const after = new Date();

			expect(template.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(template.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
			expect(template.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(template.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should create templates with different threat levels', async () => {
			const minion = await creatureRepository.create(createMockCreatureInput({ threat: 1 }));
			const elite = await creatureRepository.create(createMockCreatureInput({ threat: 2 }));
			const boss = await creatureRepository.create(createMockCreatureInput({ threat: 3 }));

			expect(minion.threat).toBe(1);
			expect(elite.threat).toBe(2);
			expect(boss.threat).toBe(3);
		});
	});

	describe('getById', () => {
		it('should retrieve creature template by ID', async () => {
			const created = await creatureRepository.create(createMockCreatureInput({ name: 'Test Creature' }));
			const retrieved = await creatureRepository.getById(created.id);

			expect(retrieved).toBeDefined();
			expect(retrieved?.id).toBe(created.id);
			expect(retrieved?.name).toBe('Test Creature');
		});

		it('should return undefined for non-existent template', async () => {
			const result = await creatureRepository.getById('non-existent-id');

			expect(result).toBeUndefined();
		});

		it('should retrieve template with all fields intact', async () => {
			const input = createMockCreatureInput({
				name: 'Full Creature',
				description: 'Full description',
				hp: 30,
				maxHp: 30,
				ac: 15,
				threat: 2,
				role: 'Defender',
				tags: ['test', 'full'],
				abilities: [{ name: 'Test', description: 'Test ability', type: 'action' }],
				notes: 'Test notes'
			});

			const created = await creatureRepository.create(input);
			const retrieved = await creatureRepository.getById(created.id);

			expect(retrieved?.name).toBe('Full Creature');
			expect(retrieved?.description).toBe('Full description');
			expect(retrieved?.hp).toBe(30);
			expect(retrieved?.maxHp).toBe(30);
			expect(retrieved?.ac).toBe(15);
			expect(retrieved?.threat).toBe(2);
			expect(retrieved?.role).toBe('Defender');
			expect(retrieved?.tags).toEqual(['test', 'full']);
			expect(retrieved?.abilities.length).toBe(1);
			expect(retrieved?.notes).toBe('Test notes');
		});
	});

	describe('getAll', () => {
		it('should return all creature templates', async () => {
			await creatureRepository.create(createMockCreatureInput({ name: 'Creature 1' }));
			await creatureRepository.create(createMockCreatureInput({ name: 'Creature 2' }));
			await creatureRepository.create(createMockCreatureInput({ name: 'Creature 3' }));

			const templates = await creatureRepository.getAll();

			expect(templates.length).toBe(3);
			expect(templates.map(t => t.name)).toContain('Creature 1');
			expect(templates.map(t => t.name)).toContain('Creature 2');
			expect(templates.map(t => t.name)).toContain('Creature 3');
		});

		it('should return empty array when no templates exist', async () => {
			const templates = await creatureRepository.getAll();

			expect(templates).toEqual([]);
		});

		it('should return templates sorted by name alphabetically', async () => {
			await creatureRepository.create(createMockCreatureInput({ name: 'Zebra' }));
			await creatureRepository.create(createMockCreatureInput({ name: 'Alpha' }));
			await creatureRepository.create(createMockCreatureInput({ name: 'Middle' }));

			const templates = await creatureRepository.getAll();

			expect(templates[0].name).toBe('Alpha');
			expect(templates[1].name).toBe('Middle');
			expect(templates[2].name).toBe('Zebra');
		});
	});

	describe('update', () => {
		it('should update creature template', async () => {
			const created = await creatureRepository.create(createMockCreatureInput({ name: 'Original' }));
			const updated = await creatureRepository.update(created.id, { name: 'Updated' });

			expect(updated?.name).toBe('Updated');
			expect(updated?.id).toBe(created.id);
		});

		it('should update timestamp on modification', async () => {
			const created = await creatureRepository.create(createMockCreatureInput());
			const originalUpdatedAt = created.updatedAt;

			// Wait a bit to ensure timestamp difference
			await new Promise(resolve => setTimeout(resolve, 10));

			const updated = await creatureRepository.update(created.id, { name: 'Modified' });

			expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
		});

		it('should preserve createdAt timestamp', async () => {
			const created = await creatureRepository.create(createMockCreatureInput());
			const originalCreatedAt = created.createdAt;

			const updated = await creatureRepository.update(created.id, { name: 'Modified' });

			expect(updated?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
		});

		it('should update multiple fields at once', async () => {
			const created = await creatureRepository.create(createMockCreatureInput({
				name: 'Original',
				hp: 20,
				threat: 1,
				role: 'Brute'
			}));

			const updated = await creatureRepository.update(created.id, {
				name: 'Updated',
				hp: 50,
				maxHp: 50,
				threat: 2,
				role: 'Leader',
				tags: ['elite']
			});

			expect(updated?.name).toBe('Updated');
			expect(updated?.hp).toBe(50);
			expect(updated?.maxHp).toBe(50);
			expect(updated?.threat).toBe(2);
			expect(updated?.role).toBe('Leader');
			expect(updated?.tags).toEqual(['elite']);
		});

		it('should return undefined for non-existent template', async () => {
			const result = await creatureRepository.update('non-existent-id', { name: 'Updated' });

			expect(result).toBeUndefined();
		});

		it('should update abilities array', async () => {
			const created = await creatureRepository.create(createMockCreatureInput({
				abilities: [{ name: 'Old', description: 'Old ability', type: 'action' }]
			}));

			const updated = await creatureRepository.update(created.id, {
				abilities: [
					{ name: 'New 1', description: 'First new', type: 'action' },
					{ name: 'New 2', description: 'Second new', type: 'maneuver' }
				]
			});

			expect(updated?.abilities.length).toBe(2);
			expect(updated?.abilities[0].name).toBe('New 1');
			expect(updated?.abilities[1].name).toBe('New 2');
		});
	});

	describe('delete', () => {
		it('should delete creature template', async () => {
			const created = await creatureRepository.create(createMockCreatureInput());
			await creatureRepository.delete(created.id);

			const retrieved = await creatureRepository.getById(created.id);
			expect(retrieved).toBeUndefined();
		});

		it('should not error when deleting non-existent template', async () => {
			await expect(creatureRepository.delete('non-existent-id')).resolves.not.toThrow();
		});

		it('should remove template from getAll results', async () => {
			const template1 = await creatureRepository.create(createMockCreatureInput({ name: 'Keep' }));
			const template2 = await creatureRepository.create(createMockCreatureInput({ name: 'Delete' }));

			await creatureRepository.delete(template2.id);

			const templates = await creatureRepository.getAll();
			expect(templates.length).toBe(1);
			expect(templates[0].id).toBe(template1.id);
		});
	});

	describe('duplicate', () => {
		it('should duplicate creature template with "(Copy)" suffix', async () => {
			const original = await creatureRepository.create(createMockCreatureInput({
				name: 'Original Creature',
				hp: 20,
				threat: 1,
				role: 'Brute'
			}));

			const duplicate = await creatureRepository.duplicate(original.id);

			expect(duplicate).toBeDefined();
			expect(duplicate?.id).not.toBe(original.id);
			expect(duplicate?.name).toBe('Original Creature (Copy)');
			expect(duplicate?.hp).toBe(20);
			expect(duplicate?.threat).toBe(1);
			expect(duplicate?.role).toBe('Brute');
		});

		it('should duplicate all fields including optional ones', async () => {
			const original = await creatureRepository.create(createMockCreatureInput({
				name: 'Complex',
				description: 'Test description',
				hp: 50,
				maxHp: 50,
				ac: 16,
				threat: 2,
				role: 'Leader',
				tags: ['elite', 'boss'],
				abilities: [
					{ name: 'Ability 1', description: 'First', type: 'action' }
				],
				notes: 'Special notes'
			}));

			const duplicate = await creatureRepository.duplicate(original.id);

			expect(duplicate?.description).toBe('Test description');
			expect(duplicate?.hp).toBe(50);
			expect(duplicate?.maxHp).toBe(50);
			expect(duplicate?.ac).toBe(16);
			expect(duplicate?.threat).toBe(2);
			expect(duplicate?.role).toBe('Leader');
			expect(duplicate?.tags).toEqual(['elite', 'boss']);
			expect(duplicate?.abilities.length).toBe(1);
			expect(duplicate?.notes).toBe('Special notes');
		});

		it('should create new timestamps for duplicate', async () => {
			const original = await creatureRepository.create(createMockCreatureInput());

			await new Promise(resolve => setTimeout(resolve, 10));

			const duplicate = await creatureRepository.duplicate(original.id);

			expect(duplicate?.createdAt.getTime()).toBeGreaterThan(original.createdAt.getTime());
			expect(duplicate?.updatedAt.getTime()).toBeGreaterThan(original.updatedAt.getTime());
		});

		it('should return undefined for non-existent template', async () => {
			const result = await creatureRepository.duplicate('non-existent-id');

			expect(result).toBeUndefined();
		});

		it('should handle multiple duplications with correct naming', async () => {
			const original = await creatureRepository.create(createMockCreatureInput({ name: 'Test' }));
			const dup1 = await creatureRepository.duplicate(original.id);
			const dup2 = await creatureRepository.duplicate(original.id);

			expect(dup1?.name).toBe('Test (Copy)');
			expect(dup2?.name).toBe('Test (Copy)');
		});
	});
});

describe('CreatureRepository - Search and Filter', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		await db.creatureTemplates.clear();

		// Seed test data
		await creatureRepository.create(createMockCreatureInput({ name: 'Goblin Scout', tags: ['goblinoid', 'humanoid'], threat: 1, role: 'Harrier' }));
		await creatureRepository.create(createMockCreatureInput({ name: 'Goblin Warrior', tags: ['goblinoid', 'humanoid'], threat: 1, role: 'Brute' }));
		await creatureRepository.create(createMockCreatureInput({ name: 'Orc Berserker', tags: ['orc', 'humanoid'], threat: 2, role: 'Brute' }));
		await creatureRepository.create(createMockCreatureInput({ name: 'Dragon', tags: ['dragon', 'legendary'], threat: 3, role: 'Leader' }));
		await creatureRepository.create(createMockCreatureInput({ name: 'Fire Elemental', tags: ['elemental', 'fire'], threat: 2, role: 'Artillery' }));
	});

	afterEach(async () => {
		await db.creatureTemplates.clear();
	});

	describe('search', () => {
		it('should search by exact name match', async () => {
			const results = await creatureRepository.search('Goblin Scout');

			expect(results.length).toBe(1);
			expect(results[0].name).toBe('Goblin Scout');
		});

		it('should search by partial name match (case insensitive)', async () => {
			const results = await creatureRepository.search('goblin');

			expect(results.length).toBe(2);
			expect(results.map(r => r.name)).toContain('Goblin Scout');
			expect(results.map(r => r.name)).toContain('Goblin Warrior');
		});

		it('should search with case insensitivity', async () => {
			const results = await creatureRepository.search('DRAGON');

			expect(results.length).toBe(1);
			expect(results[0].name).toBe('Dragon');
		});

		it('should return empty array when no matches found', async () => {
			const results = await creatureRepository.search('Nonexistent');

			expect(results).toEqual([]);
		});

		it('should search by tag', async () => {
			const results = await creatureRepository.search('goblinoid');

			expect(results.length).toBe(2);
			expect(results.map(r => r.name)).toContain('Goblin Scout');
			expect(results.map(r => r.name)).toContain('Goblin Warrior');
		});

		it('should return all templates with empty search query', async () => {
			const results = await creatureRepository.search('');

			expect(results.length).toBe(5);
		});

		it('should trim whitespace from search query', async () => {
			const results = await creatureRepository.search('  Dragon  ');

			expect(results.length).toBe(1);
			expect(results[0].name).toBe('Dragon');
		});
	});

	describe('getByThreat', () => {
		it('should filter by threat level 1', async () => {
			const results = await creatureRepository.getByThreat(1);

			expect(results.length).toBe(2);
			expect(results.every(r => r.threat === 1)).toBe(true);
		});

		it('should filter by threat level 2', async () => {
			const results = await creatureRepository.getByThreat(2);

			expect(results.length).toBe(2);
			expect(results.every(r => r.threat === 2)).toBe(true);
		});

		it('should filter by threat level 3', async () => {
			const results = await creatureRepository.getByThreat(3);

			expect(results.length).toBe(1);
			expect(results[0].name).toBe('Dragon');
		});

		it('should return empty array for threat level with no matches', async () => {
			await db.creatureTemplates.clear();
			const results = await creatureRepository.getByThreat(2);

			expect(results).toEqual([]);
		});

		it('should handle invalid threat levels gracefully', async () => {
			const results = await creatureRepository.getByThreat(99 as any);

			expect(results).toEqual([]);
		});
	});

	describe('getByRole', () => {
		it('should filter by Brute role', async () => {
			const results = await creatureRepository.getByRole('Brute');

			expect(results.length).toBe(2);
			expect(results.every(r => r.role === 'Brute')).toBe(true);
		});

		it('should filter by Leader role', async () => {
			const results = await creatureRepository.getByRole('Leader');

			expect(results.length).toBe(1);
			expect(results[0].name).toBe('Dragon');
		});

		it('should filter by Artillery role', async () => {
			const results = await creatureRepository.getByRole('Artillery');

			expect(results.length).toBe(1);
			expect(results[0].name).toBe('Fire Elemental');
		});

		it('should return empty array for role with no matches', async () => {
			const results = await creatureRepository.getByRole('Mount');

			expect(results).toEqual([]);
		});

		it('should be case sensitive for role matching', async () => {
			const results = await creatureRepository.getByRole('brute' as any);

			expect(results).toEqual([]);
		});
	});

	describe('getByTag', () => {
		it('should filter by single tag', async () => {
			const results = await creatureRepository.getByTag('goblinoid');

			expect(results.length).toBe(2);
			expect(results.every(r => r.tags.includes('goblinoid'))).toBe(true);
		});

		it('should filter by another tag', async () => {
			const results = await creatureRepository.getByTag('dragon');

			expect(results.length).toBe(1);
			expect(results[0].name).toBe('Dragon');
		});

		it('should return templates with matching tag among multiple tags', async () => {
			const results = await creatureRepository.getByTag('humanoid');

			expect(results.length).toBe(3);
			expect(results.map(r => r.name)).toContain('Goblin Scout');
			expect(results.map(r => r.name)).toContain('Goblin Warrior');
			expect(results.map(r => r.name)).toContain('Orc Berserker');
		});

		it('should return empty array for non-existent tag', async () => {
			const results = await creatureRepository.getByTag('nonexistent');

			expect(results).toEqual([]);
		});

		it('should be case sensitive for tag matching', async () => {
			const results = await creatureRepository.getByTag('GOBLINOID');

			expect(results).toEqual([]);
		});
	});
});

describe('CreatureRepository - Library Management', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		await db.creatureTemplates.clear();
	});

	afterEach(async () => {
		await db.creatureTemplates.clear();
	});

	describe('exportLibrary', () => {
		it('should export all creature templates', async () => {
			await creatureRepository.create(createMockCreatureInput({ name: 'Creature 1' }));
			await creatureRepository.create(createMockCreatureInput({ name: 'Creature 2' }));

			const exported = await creatureRepository.exportLibrary();

			expect(exported.version).toBe(1);
			expect(exported.exportedAt).toBeInstanceOf(Date);
			expect(exported.templates.length).toBe(2);
		});

		it('should export empty library', async () => {
			const exported = await creatureRepository.exportLibrary();

			expect(exported.version).toBe(1);
			expect(exported.templates).toEqual([]);
		});

		it('should export templates with all fields', async () => {
			await creatureRepository.create(createMockCreatureInput({
				name: 'Full Creature',
				description: 'Test',
				hp: 50,
				maxHp: 50,
				ac: 16,
				threat: 2,
				role: 'Leader',
				tags: ['test'],
				abilities: [{ name: 'Test', description: 'Test', type: 'action' }],
				notes: 'Notes'
			}));

			const exported = await creatureRepository.exportLibrary();

			expect(exported.templates[0].name).toBe('Full Creature');
			expect(exported.templates[0].description).toBe('Test');
			expect(exported.templates[0].hp).toBe(50);
			expect(exported.templates[0].ac).toBe(16);
			expect(exported.templates[0].tags).toEqual(['test']);
			expect(exported.templates[0].abilities.length).toBe(1);
			expect(exported.templates[0].notes).toBe('Notes');
		});

		it('should not export database IDs', async () => {
			await creatureRepository.create(createMockCreatureInput());

			const exported = await creatureRepository.exportLibrary();

			// IDs should be regenerated on import, so don't export internal IDs
			expect(exported.templates[0].id).toBeUndefined();
		});
	});

	describe('importLibrary - merge mode', () => {
		it('should import templates in merge mode', async () => {
			const library: CreatureLibraryExport = {
				version: 1,
				exportedAt: new Date(),
				templates: [
					createMockCreatureInput({ name: 'Imported 1' }),
					createMockCreatureInput({ name: 'Imported 2' })
				]
			};

			const result = await creatureRepository.importLibrary(library, 'merge');

			expect(result.imported).toBe(2);
			expect(result.skipped).toBe(0);
			expect(result.errors).toEqual([]);

			const templates = await creatureRepository.getAll();
			expect(templates.length).toBe(2);
		});

		it('should merge with existing templates', async () => {
			await creatureRepository.create(createMockCreatureInput({ name: 'Existing' }));

			const library: CreatureLibraryExport = {
				version: 1,
				exportedAt: new Date(),
				templates: [
					createMockCreatureInput({ name: 'New' })
				]
			};

			await creatureRepository.importLibrary(library, 'merge');

			const templates = await creatureRepository.getAll();
			expect(templates.length).toBe(2);
			expect(templates.map(t => t.name)).toContain('Existing');
			expect(templates.map(t => t.name)).toContain('New');
		});

		it('should skip duplicate names in merge mode', async () => {
			await creatureRepository.create(createMockCreatureInput({ name: 'Duplicate' }));

			const library: CreatureLibraryExport = {
				version: 1,
				exportedAt: new Date(),
				templates: [
					createMockCreatureInput({ name: 'Duplicate' })
				]
			};

			const result = await creatureRepository.importLibrary(library, 'merge');

			expect(result.imported).toBe(0);
			expect(result.skipped).toBe(1);

			const templates = await creatureRepository.getAll();
			expect(templates.length).toBe(1);
		});

		it('should generate new IDs for imported templates', async () => {
			const library: CreatureLibraryExport = {
				version: 1,
				exportedAt: new Date(),
				templates: [
					createMockCreatureInput({ name: 'Test' })
				]
			};

			await creatureRepository.importLibrary(library, 'merge');

			const templates = await creatureRepository.getAll();
			expect(templates[0].id).toBeDefined();
			expect(templates[0].id).toBeTruthy();
		});

		it('should set timestamps on imported templates', async () => {
			const library: CreatureLibraryExport = {
				version: 1,
				exportedAt: new Date(),
				templates: [
					createMockCreatureInput({ name: 'Test' })
				]
			};

			const before = new Date();
			await creatureRepository.importLibrary(library, 'merge');
			const after = new Date();

			const templates = await creatureRepository.getAll();
			expect(templates[0].createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(templates[0].createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});
	});

	describe('importLibrary - replace mode', () => {
		it('should replace existing library', async () => {
			await creatureRepository.create(createMockCreatureInput({ name: 'Old 1' }));
			await creatureRepository.create(createMockCreatureInput({ name: 'Old 2' }));

			const library: CreatureLibraryExport = {
				version: 1,
				exportedAt: new Date(),
				templates: [
					createMockCreatureInput({ name: 'New 1' }),
					createMockCreatureInput({ name: 'New 2' })
				]
			};

			await creatureRepository.importLibrary(library, 'replace');

			const templates = await creatureRepository.getAll();
			expect(templates.length).toBe(2);
			expect(templates.map(t => t.name)).not.toContain('Old 1');
			expect(templates.map(t => t.name)).not.toContain('Old 2');
			expect(templates.map(t => t.name)).toContain('New 1');
			expect(templates.map(t => t.name)).toContain('New 2');
		});

		it('should handle replace with empty library', async () => {
			await creatureRepository.create(createMockCreatureInput({ name: 'Existing' }));

			const library: CreatureLibraryExport = {
				version: 1,
				exportedAt: new Date(),
				templates: []
			};

			await creatureRepository.importLibrary(library, 'replace');

			const templates = await creatureRepository.getAll();
			expect(templates).toEqual([]);
		});

		it('should allow duplicates in replace mode', async () => {
			const library: CreatureLibraryExport = {
				version: 1,
				exportedAt: new Date(),
				templates: [
					createMockCreatureInput({ name: 'Same Name' }),
					createMockCreatureInput({ name: 'Same Name' })
				]
			};

			const result = await creatureRepository.importLibrary(library, 'replace');

			expect(result.imported).toBe(2);
			expect(result.skipped).toBe(0);

			const templates = await creatureRepository.getAll();
			expect(templates.length).toBe(2);
		});
	});

	describe('importLibrary - error handling', () => {
		it('should handle invalid version gracefully', async () => {
			const library = {
				version: 999,
				exportedAt: new Date(),
				templates: [createMockCreatureInput()]
			} as CreatureLibraryExport;

			const result = await creatureRepository.importLibrary(library, 'merge');

			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('should continue importing after individual errors', async () => {
			const library: CreatureLibraryExport = {
				version: 1,
				exportedAt: new Date(),
				templates: [
					createMockCreatureInput({ name: 'Valid' }),
					{ name: '', hp: -10 } as any, // Invalid
					createMockCreatureInput({ name: 'Also Valid' })
				]
			};

			const result = await creatureRepository.importLibrary(library, 'merge');

			expect(result.imported).toBe(2);
			expect(result.errors.length).toBe(1);
		});
	});
});

describe('CreatureRepository - Combat Integration', () => {
	beforeAll(async () => {
		await db.open();
	});

	beforeEach(async () => {
		await db.creatureTemplates.clear();
	});

	afterEach(async () => {
		await db.creatureTemplates.clear();
	});

	describe('createFromCombatant', () => {
		it('should create template from combat creature', async () => {
			const combatCreature: CreatureCombatant = {
				id: 'combat-1',
				type: 'creature',
				name: 'Battle Orc',
				initiative: 15,
				initiativeRoll: [7, 8],
				turnOrder: 1,
				hp: 30,
				maxHp: 40,
				tempHp: 0,
				ac: 15,
				conditions: [],
				threat: 2
			};

			const template = await creatureRepository.createFromCombatant(combatCreature);

			expect(template.name).toBe('Battle Orc (From Combat)');
			expect(template.hp).toBe(40); // Should use maxHp
			expect(template.maxHp).toBe(40);
			expect(template.ac).toBe(15);
			expect(template.threat).toBe(2);
			expect(template.role).toBe('Brute'); // Default role
			expect(template.tags).toEqual([]);
			expect(template.abilities).toEqual([]);
		});

		it('should create template from combatant without AC', async () => {
			const combatCreature: CreatureCombatant = {
				id: 'combat-2',
				type: 'creature',
				name: 'Simple Creature',
				initiative: 12,
				initiativeRoll: [6, 6],
				turnOrder: 1,
				hp: 20,
				maxHp: 20,
				tempHp: 0,
				conditions: [],
				threat: 1
			};

			const template = await creatureRepository.createFromCombatant(combatCreature);

			expect(template.name).toBe('Simple Creature (From Combat)');
			expect(template.ac).toBeUndefined();
		});

		it('should handle combatant with startingHp instead of maxHp', async () => {
			const combatCreature: CreatureCombatant = {
				id: 'combat-3',
				type: 'creature',
				name: 'Quick Add',
				initiative: 10,
				initiativeRoll: [5, 5],
				turnOrder: 1,
				hp: 15,
				startingHp: 25,
				tempHp: 0,
				conditions: [],
				threat: 1
			};

			const template = await creatureRepository.createFromCombatant(combatCreature);

			expect(template.hp).toBe(25);
			expect(template.maxHp).toBe(25);
		});

		it('should fallback to current HP if no max or starting HP', async () => {
			const combatCreature: CreatureCombatant = {
				id: 'combat-4',
				type: 'creature',
				name: 'No Max HP',
				initiative: 8,
				initiativeRoll: [4, 4],
				turnOrder: 1,
				hp: 18,
				tempHp: 0,
				conditions: [],
				threat: 1
			};

			const template = await creatureRepository.createFromCombatant(combatCreature);

			expect(template.hp).toBe(18);
			expect(template.maxHp).toBe(18);
		});

		it('should use threat level from combatant', async () => {
			const threat3Creature: CreatureCombatant = {
				id: 'combat-5',
				type: 'creature',
				name: 'Boss Creature',
				initiative: 20,
				initiativeRoll: [10, 10],
				turnOrder: 1,
				hp: 200,
				maxHp: 200,
				tempHp: 0,
				conditions: [],
				threat: 3
			};

			const template = await creatureRepository.createFromCombatant(threat3Creature);

			expect(template.threat).toBe(3);
		});

		it('should generate unique ID for template', async () => {
			const combatCreature: CreatureCombatant = {
				id: 'combat-6',
				type: 'creature',
				name: 'Test',
				initiative: 10,
				initiativeRoll: [5, 5],
				turnOrder: 1,
				hp: 20,
				maxHp: 20,
				tempHp: 0,
				conditions: [],
				threat: 1
			};

			const template = await creatureRepository.createFromCombatant(combatCreature);

			expect(template.id).toBeDefined();
			expect(template.id).not.toBe('combat-6');
		});

		it('should add "(From Combat)" suffix to name', async () => {
			const combatCreature: CreatureCombatant = {
				id: 'combat-7',
				type: 'creature',
				name: 'Improvised Creature',
				initiative: 12,
				initiativeRoll: [6, 6],
				turnOrder: 1,
				hp: 25,
				maxHp: 25,
				tempHp: 0,
				conditions: [],
				threat: 1
			};

			const template = await creatureRepository.createFromCombatant(combatCreature);

			expect(template.name).toBe('Improvised Creature (From Combat)');
		});
	});
});
