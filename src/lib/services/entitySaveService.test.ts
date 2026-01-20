/**
 * Tests for Entity Save Service (TDD RED Phase - Phase A3)
 *
 * This service converts ParsedEntity objects into BaseEntity objects
 * and saves them to the entitiesStore.
 *
 * These tests should FAIL initially as the service doesn't exist yet.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	saveEntityFromParsed,
	type SaveEntityResult
} from './entitySaveService';
import type { ParsedEntity } from './entityParserService';
import type { EntityTypeDefinition, BaseEntity } from '$lib/types';

// Mock the entitiesStore
vi.mock('$lib/stores/entities.svelte', () => ({
	entitiesStore: {
		create: vi.fn()
	}
}));

import { entitiesStore } from '$lib/stores/entities.svelte';

describe('entitySaveService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('saveEntityFromParsed', () => {
		describe('Successful Conversion and Save', () => {
			it('should convert ParsedEntity to BaseEntity correctly', async () => {
				const parsedEntity: ParsedEntity = {
					entityType: 'npc',
					confidence: 0.8,
					name: 'Captain Aldric',
					description: 'A stern guard captain',
					summary: 'A stern guard captain',
					tags: ['guard', 'captain'],
					fields: {
						role: 'Guard Captain',
						personality: 'Stern but fair'
					},
					validationErrors: {}
				};

				const savedEntity: BaseEntity = {
					id: 'test-id-123',
					type: 'npc',
					name: 'Captain Aldric',
					description: 'A stern guard captain',
					summary: 'A stern guard captain',
					tags: ['guard', 'captain'],
					fields: {
						role: 'Guard Captain',
						personality: 'Stern but fair'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entitiesStore.create).mockResolvedValue(savedEntity);

				const result = await saveEntityFromParsed(parsedEntity);

				expect(result.success).toBe(true);
				expect(result.entity).toBeDefined();
				expect(result.entity?.name).toBe('Captain Aldric');
				expect(result.entity?.type).toBe('npc');
				expect(result.error).toBeUndefined();
			});

			it('should call entitiesStore.create with correct NewEntity structure', async () => {
				const parsedEntity: ParsedEntity = {
					entityType: 'location',
					confidence: 0.9,
					name: 'The Rusty Anchor',
					description: 'A dimly lit tavern',
					tags: ['tavern', 'docks'],
					fields: {
						locationType: 'Tavern',
						atmosphere: 'Dimly lit and smoky'
					},
					validationErrors: {}
				};

				const savedEntity: BaseEntity = {
					id: 'test-id-456',
					type: 'location',
					name: 'The Rusty Anchor',
					description: 'A dimly lit tavern',
					tags: ['tavern', 'docks'],
					fields: {
						locationType: 'Tavern',
						atmosphere: 'Dimly lit and smoky'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entitiesStore.create).mockResolvedValue(savedEntity);

				await saveEntityFromParsed(parsedEntity);

				expect(entitiesStore.create).toHaveBeenCalledWith({
					type: 'location',
					name: 'The Rusty Anchor',
					description: 'A dimly lit tavern',
					summary: undefined,
					tags: ['tavern', 'docks'],
					fields: {
						locationType: 'Tavern',
						atmosphere: 'Dimly lit and smoky'
					},
					notes: '',
					links: [],
					metadata: {}
				});
			});

			it('should preserve summary when provided', async () => {
				const parsedEntity: ParsedEntity = {
					entityType: 'faction',
					confidence: 0.85,
					name: 'Merchant Guild',
					description: 'A powerful trade organization controlling commerce',
					summary: 'Powerful trade guild',
					tags: ['guild', 'trade'],
					fields: {
						goals: 'Control trade routes'
					},
					validationErrors: {}
				};

				const savedEntity: BaseEntity = {
					id: 'test-id-789',
					type: 'faction',
					name: 'Merchant Guild',
					description: 'A powerful trade organization controlling commerce',
					summary: 'Powerful trade guild',
					tags: ['guild', 'trade'],
					fields: {
						goals: 'Control trade routes'
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entitiesStore.create).mockResolvedValue(savedEntity);

				const result = await saveEntityFromParsed(parsedEntity);

				expect(result.entity?.summary).toBe('Powerful trade guild');
			});

			it('should handle entities with empty tags array', async () => {
				const parsedEntity: ParsedEntity = {
					entityType: 'npc',
					confidence: 0.7,
					name: 'Simple NPC',
					description: 'A basic character',
					tags: [],
					fields: {},
					validationErrors: {}
				};

				const savedEntity: BaseEntity = {
					id: 'test-id',
					type: 'npc',
					name: 'Simple NPC',
					description: 'A basic character',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entitiesStore.create).mockResolvedValue(savedEntity);

				const result = await saveEntityFromParsed(parsedEntity);

				expect(result.success).toBe(true);
				expect(result.entity?.tags).toEqual([]);
			});

			it('should handle entities with empty fields object', async () => {
				const parsedEntity: ParsedEntity = {
					entityType: 'item',
					confidence: 0.6,
					name: 'Simple Item',
					description: 'A basic item',
					tags: [],
					fields: {},
					validationErrors: {}
				};

				const savedEntity: BaseEntity = {
					id: 'test-id',
					type: 'item',
					name: 'Simple Item',
					description: 'A basic item',
					tags: [],
					fields: {},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entitiesStore.create).mockResolvedValue(savedEntity);

				const result = await saveEntityFromParsed(parsedEntity);

				expect(result.success).toBe(true);
				expect(result.entity?.fields).toEqual({});
			});
		});

		describe('Error Handling', () => {
			it('should return error when save fails', async () => {
				const parsedEntity: ParsedEntity = {
					entityType: 'npc',
					confidence: 0.8,
					name: 'Test NPC',
					description: 'Test description',
					tags: [],
					fields: {},
					validationErrors: {}
				};

				vi.mocked(entitiesStore.create).mockRejectedValue(
					new Error('Database error')
				);

				const result = await saveEntityFromParsed(parsedEntity);

				expect(result.success).toBe(false);
				expect(result.entity).toBeUndefined();
				expect(result.error).toBe('Database error');
			});

			it('should return error when entitiesStore.create throws string error', async () => {
				const parsedEntity: ParsedEntity = {
					entityType: 'npc',
					confidence: 0.8,
					name: 'Test NPC',
					description: 'Test description',
					tags: [],
					fields: {},
					validationErrors: {}
				};

				vi.mocked(entitiesStore.create).mockRejectedValue('Unknown error');

				const result = await saveEntityFromParsed(parsedEntity);

				expect(result.success).toBe(false);
				expect(result.error).toBe('Failed to save entity');
			});

			it('should return error when ParsedEntity has validation errors', async () => {
				const parsedEntity: ParsedEntity = {
					entityType: 'npc',
					confidence: 0.8,
					name: 'Invalid NPC',
					description: 'Test description',
					tags: [],
					fields: {},
					validationErrors: {
						role: 'Role is required'
					}
				};

				const result = await saveEntityFromParsed(parsedEntity);

				expect(result.success).toBe(false);
				expect(result.entity).toBeUndefined();
				expect(result.error).toBe('Entity has validation errors');
			});
		});

		describe('Custom Entity Types', () => {
			it('should handle custom entity types correctly', async () => {
				const customType: EntityTypeDefinition = {
					type: 'spell',
					label: 'Spell',
					labelPlural: 'Spells',
					icon: 'sparkles',
					color: 'purple',
					isBuiltIn: false,
					fieldDefinitions: [
						{
							key: 'level',
							label: 'Level',
							type: 'number',
							required: true,
							order: 1
						}
					],
					defaultRelationships: []
				};

				const parsedEntity: ParsedEntity = {
					entityType: 'spell',
					confidence: 0.9,
					name: 'Fireball',
					description: 'A powerful evocation spell',
					tags: ['evocation', 'damage'],
					fields: {
						level: 3
					},
					validationErrors: {}
				};

				const savedEntity: BaseEntity = {
					id: 'spell-123',
					type: 'spell',
					name: 'Fireball',
					description: 'A powerful evocation spell',
					tags: ['evocation', 'damage'],
					fields: {
						level: 3
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entitiesStore.create).mockResolvedValue(savedEntity);

				const result = await saveEntityFromParsed(parsedEntity, [customType]);

				expect(result.success).toBe(true);
				expect(result.entity?.type).toBe('spell');
				expect(result.entity?.fields.level).toBe(3);
			});
		});

		describe('Field Mapping', () => {
			it('should correctly map all field types', async () => {
				const parsedEntity: ParsedEntity = {
					entityType: 'npc',
					confidence: 0.9,
					name: 'Complex NPC',
					description: 'An NPC with various field types',
					tags: ['complex'],
					fields: {
						role: 'Wizard',
						level: 10,
						isAlive: true,
						skills: ['magic', 'alchemy'],
						notes: null
					},
					validationErrors: {}
				};

				const savedEntity: BaseEntity = {
					id: 'npc-complex',
					type: 'npc',
					name: 'Complex NPC',
					description: 'An NPC with various field types',
					tags: ['complex'],
					fields: {
						role: 'Wizard',
						level: 10,
						isAlive: true,
						skills: ['magic', 'alchemy'],
						notes: null
					},
					links: [],
					notes: '',
					createdAt: new Date(),
					updatedAt: new Date(),
					metadata: {}
				};

				vi.mocked(entitiesStore.create).mockResolvedValue(savedEntity);

				const result = await saveEntityFromParsed(parsedEntity);

				expect(result.success).toBe(true);
				expect(result.entity?.fields.role).toBe('Wizard');
				expect(result.entity?.fields.level).toBe(10);
				expect(result.entity?.fields.isAlive).toBe(true);
				expect(result.entity?.fields.skills).toEqual(['magic', 'alchemy']);
			});
		});
	});
});
