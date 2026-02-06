/**
 * Tests for Player Character Context Service
 *
 * Tests the service that builds full player character context for AI generation
 * when generating content for entities linked to player characters.
 *
 * Key Features Tested:
 * - Finding player characters linked to an entity
 * - Building full character context (all fields: standard + custom)
 * - Formatting context for AI prompts
 * - Privacy protection (excluding hidden/secrets fields)
 * - Backward compatibility (generation works without PC relationships)
 *
 * @see GitHub Issue #319
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	findLinkedPlayerCharacters,
	buildFullCharacterContext,
	formatPlayerCharacterContextForPrompt,
	buildPlayerCharacterContext,
	type LinkedCharacterInfo,
	type PlayerCharacterContext,
	type PlayerCharacterContextResult
} from './playerCharacterContextService';
import type { BaseEntity, EntityId, EntityLink, FieldDefinition } from '$lib/types';

// Mock the entity repository
vi.mock('$lib/db/repositories', () => ({
	entityRepository: {
		getById: vi.fn(),
		getByIds: vi.fn(),
		getEntitiesLinkingTo: vi.fn()
	}
}));

// Mock the entity types config
vi.mock('$lib/config/entityTypes', () => ({
	getEntityTypeDefinition: vi.fn()
}));

describe('playerCharacterContextService', () => {
	// Mock entities for testing
	const mockCharacterId: EntityId = 'char-001';
	const mockEntityId: EntityId = 'entity-001';

	const mockPlayerCharacter: BaseEntity = {
		id: mockCharacterId,
		type: 'character',
		name: 'Thorin Ironhammer',
		description: 'A grizzled dwarven fighter with a mysterious past',
		summary: 'A veteran warrior seeking redemption',
		tags: ['warrior', 'dwarf', 'party-member'],
		fields: {
			playerName: 'John Smith',
			concept: 'Grizzled veteran seeking redemption',
			background: 'Once a royal guard, now a wandering adventurer',
			personality: 'Brave, loyal, but haunted by past failures',
			goals: 'Find and destroy the artifact that caused his disgrace',
			status: 'active',
			// Custom field added by user
			favoriteDrink: 'Dwarven ale',
			battleCry: 'For honor and stone!'
		},
		links: [],
		notes: 'Player enjoys combat encounters',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-02'),
		metadata: {}
	};

	const mockPlayerCharacterWithSecrets: BaseEntity = {
		...mockPlayerCharacter,
		fields: {
			...mockPlayerCharacter.fields,
			secrets: 'Secretly working for the enemy' // Should be excluded from context
		}
	};

	const mockNPC: BaseEntity = {
		id: mockEntityId,
		type: 'npc',
		name: 'Merchant Goldweaver',
		description: 'A shrewd trader',
		tags: ['merchant'],
		fields: {
			role: 'Guild Master'
		},
		links: [
			{
				id: 'link-001',
				targetId: mockCharacterId,
				targetType: 'character',
				relationship: 'knows',
				bidirectional: true
			}
		],
		notes: '',
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-02'),
		metadata: {}
	};

	beforeEach(() => {
		// Clear all mocks before each test
		vi.clearAllMocks();
	});

	describe('findLinkedPlayerCharacters', () => {
		it('should find characters linked via outgoing relationships', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			vi.mocked(entityRepository.getById).mockResolvedValue(mockNPC);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([mockPlayerCharacter]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);

			const result = await findLinkedPlayerCharacters(mockEntityId);

			expect(result).toHaveLength(1);
			expect(result[0].character.id).toBe(mockCharacterId);
			expect(result[0].character.type).toBe('character');
			expect(result[0].relationship).toBe('knows');
		});

		it('should find characters linking to the entity (incoming relationships)', async () => {
			const entityWithNoOutgoing: BaseEntity = {
				...mockNPC,
				links: []
			};

			const characterLinkingToEntity: BaseEntity = {
				...mockPlayerCharacter,
				links: [
					{
						id: 'link-002',
						targetId: mockEntityId,
						targetType: 'npc',
						relationship: 'trusts',
						bidirectional: false
					}
				]
			};

			const { entityRepository } = await import('$lib/db/repositories');
			vi.mocked(entityRepository.getById).mockResolvedValue(entityWithNoOutgoing);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([
				characterLinkingToEntity
			]);

			const result = await findLinkedPlayerCharacters(mockEntityId);

			expect(result).toHaveLength(1);
			expect(result[0].character.id).toBe(mockCharacterId);
			expect(result[0].relationship).toBe('trusts');
		});

		it('should return empty array when no characters are linked', async () => {
			const entityWithNoLinks: BaseEntity = {
				...mockNPC,
				links: []
			};

			const { entityRepository } = await import('$lib/db/repositories');
			vi.mocked(entityRepository.getById).mockResolvedValue(entityWithNoLinks);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);

			const result = await findLinkedPlayerCharacters(mockEntityId);

			expect(result).toEqual([]);
		});

		it('should not return non-character entity types', async () => {
			const entityLinkedToNPC: BaseEntity = {
				...mockNPC,
				links: [
					{
						id: 'link-003',
						targetId: 'npc-002',
						targetType: 'npc', // Not a character
						relationship: 'knows',
						bidirectional: false
					}
				]
			};

			const linkedNPC: BaseEntity = {
				id: 'npc-002',
				type: 'npc',
				name: 'Another NPC',
				description: 'Not a player character',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const { entityRepository } = await import('$lib/db/repositories');
			vi.mocked(entityRepository.getById).mockResolvedValue(entityLinkedToNPC);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([linkedNPC]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);

			const result = await findLinkedPlayerCharacters(mockEntityId);

			expect(result).toEqual([]);
		});

		it('should handle entities with no links array', async () => {
			const entityWithNoLinksArray: BaseEntity = {
				...mockNPC,
				links: []
			};

			const { entityRepository } = await import('$lib/db/repositories');
			vi.mocked(entityRepository.getById).mockResolvedValue(entityWithNoLinksArray);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);

			const result = await findLinkedPlayerCharacters(mockEntityId);

			expect(result).toEqual([]);
		});

		it('should handle multiple linked player characters', async () => {
			const secondCharacter: BaseEntity = {
				...mockPlayerCharacter,
				id: 'char-002',
				name: 'Elara Swiftwind',
				fields: {
					playerName: 'Jane Doe',
					concept: 'Elven ranger'
				}
			};

			const entityLinkedToMultiple: BaseEntity = {
				...mockNPC,
				links: [
					{
						id: 'link-004',
						targetId: mockCharacterId,
						targetType: 'character',
						relationship: 'knows',
						bidirectional: true
					},
					{
						id: 'link-005',
						targetId: 'char-002',
						targetType: 'character',
						relationship: 'trusts',
						bidirectional: false
					}
				]
			};

			const { entityRepository } = await import('$lib/db/repositories');
			vi.mocked(entityRepository.getById).mockResolvedValue(entityLinkedToMultiple);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([
				mockPlayerCharacter,
				secondCharacter
			]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);

			const result = await findLinkedPlayerCharacters(mockEntityId);

			expect(result).toHaveLength(2);
			expect(result[0].character.name).toBe('Thorin Ironhammer');
			expect(result[1].character.name).toBe('Elara Swiftwind');
		});

		it('should handle entity not found error', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			vi.mocked(entityRepository.getById).mockResolvedValue(null);

			await expect(findLinkedPlayerCharacters('nonexistent-id')).rejects.toThrow(
				'Entity not found'
			);
		});
	});

	describe('buildFullCharacterContext', () => {
		it('should include all standard character fields', async () => {
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'playerName',
						label: 'Player Name',
						type: 'text',
						required: true,
						order: 1
					},
					{
						key: 'concept',
						label: 'Character Concept',
						type: 'text',
						required: false,
						order: 2
					}
				],
				defaultRelationships: []
			});

			const linkedChar: LinkedCharacterInfo = {
				character: mockPlayerCharacter,
				relationship: 'knows'
			};

			const result = await buildFullCharacterContext(linkedChar);

			expect(result.characterName).toBe('Thorin Ironhammer');
			expect(result.relationship).toBe('knows');
			expect(result.fields).toBeDefined();
			expect(result.fields['playerName']).toBe('John Smith');
			expect(result.fields['concept']).toBe('Grizzled veteran seeking redemption');
		});

		it('should include custom fields added by users', async () => {
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'playerName',
						label: 'Player Name',
						type: 'text',
						required: true,
						order: 1
					},
					{
						key: 'favoriteDrink',
						label: 'Favorite Drink',
						type: 'text',
						required: false,
						order: 10
					}
				],
				defaultRelationships: []
			});

			const linkedChar: LinkedCharacterInfo = {
				character: mockPlayerCharacter,
				relationship: 'knows'
			};

			const result = await buildFullCharacterContext(linkedChar);

			expect(result.fields['favoriteDrink']).toBe('Dwarven ale');
			expect(result.fields['battleCry']).toBe('For honor and stone!');
		});

		it('should exclude hidden/secrets fields from context', async () => {
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'playerName',
						label: 'Player Name',
						type: 'text',
						required: true,
						order: 1
					},
					{
						key: 'secrets',
						label: 'Secrets',
						type: 'richtext',
						required: false,
						order: 6,
						section: 'hidden'
					}
				],
				defaultRelationships: []
			});

			const linkedChar: LinkedCharacterInfo = {
				character: mockPlayerCharacterWithSecrets,
				relationship: 'knows'
			};

			const result = await buildFullCharacterContext(linkedChar);

			expect(result.fields['secrets']).toBeUndefined();
			expect(result.fields['playerName']).toBe('John Smith');
		});

		it('should properly format field labels', async () => {
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'goals',
						label: 'Goals & Motivations',
						type: 'richtext',
						required: false,
						order: 5
					}
				],
				defaultRelationships: []
			});

			const linkedChar: LinkedCharacterInfo = {
				character: mockPlayerCharacter,
				relationship: 'knows'
			};

			const result = await buildFullCharacterContext(linkedChar);

			// The service should preserve the field definition label
			expect(result.fieldLabels['goals']).toBe('Goals & Motivations');
		});

		it('should handle empty/null field values gracefully', async () => {
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'playerName',
						label: 'Player Name',
						type: 'text',
						required: true,
						order: 1
					}
				],
				defaultRelationships: []
			});

			const characterWithEmptyFields: BaseEntity = {
				...mockPlayerCharacter,
				fields: {
					playerName: 'John Smith',
					concept: '',
					background: null,
					personality: undefined
				}
			};

			const linkedChar: LinkedCharacterInfo = {
				character: characterWithEmptyFields,
				relationship: 'knows'
			};

			const result = await buildFullCharacterContext(linkedChar);

			expect(result.fields['playerName']).toBe('John Smith');
			// Empty/null/undefined values should be excluded or handled gracefully
			expect(result.fields['concept']).toBeUndefined();
		});

		it('should include character description and summary', async () => {
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [],
				defaultRelationships: []
			});

			const linkedChar: LinkedCharacterInfo = {
				character: mockPlayerCharacter,
				relationship: 'knows'
			};

			const result = await buildFullCharacterContext(linkedChar);

			expect(result.description).toBe(mockPlayerCharacter.description);
			expect(result.summary).toBe(mockPlayerCharacter.summary);
		});

		it('should handle character with no type definition (fallback)', async () => {
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');
			vi.mocked(getEntityTypeDefinition).mockReturnValue(undefined);

			const linkedChar: LinkedCharacterInfo = {
				character: mockPlayerCharacter,
				relationship: 'knows'
			};

			const result = await buildFullCharacterContext(linkedChar);

			// Should still include character data even without type definition
			expect(result.characterName).toBe('Thorin Ironhammer');
			expect(result.fields).toBeDefined();
		});
	});

	describe('formatPlayerCharacterContextForPrompt', () => {
		it('should create clearly labeled section header', () => {
			const contexts: PlayerCharacterContext[] = [
				{
					characterName: 'Thorin Ironhammer',
					relationship: 'knows',
					description: 'A grizzled dwarven fighter',
					summary: 'A veteran warrior',
					fields: {
						playerName: 'John Smith',
						concept: 'Grizzled veteran'
					},
					fieldLabels: {
						playerName: 'Player Name',
						concept: 'Character Concept'
					}
				}
			];

			const result = formatPlayerCharacterContextForPrompt(contexts);

			expect(result).toContain('=== Player Character Context ===');
		});

		it('should list all character fields readably', () => {
			const contexts: PlayerCharacterContext[] = [
				{
					characterName: 'Thorin Ironhammer',
					relationship: 'knows',
					description: 'A grizzled dwarven fighter',
					fields: {
						playerName: 'John Smith',
						concept: 'Grizzled veteran seeking redemption',
						background: 'Once a royal guard'
					},
					fieldLabels: {
						playerName: 'Player Name',
						concept: 'Character Concept',
						background: 'Background'
					}
				}
			];

			const result = formatPlayerCharacterContextForPrompt(contexts);

			expect(result).toContain('Thorin Ironhammer');
			expect(result).toContain('Player Name: John Smith');
			expect(result).toContain('Character Concept: Grizzled veteran seeking redemption');
			expect(result).toContain('Background: Once a royal guard');
		});

		it('should include the relationship type', () => {
			const contexts: PlayerCharacterContext[] = [
				{
					characterName: 'Thorin Ironhammer',
					relationship: 'trusts',
					description: 'A grizzled dwarven fighter',
					fields: {
						playerName: 'John Smith'
					},
					fieldLabels: {
						playerName: 'Player Name'
					}
				}
			];

			const result = formatPlayerCharacterContextForPrompt(contexts);

			expect(result).toContain('Relationship: trusts');
		});

		it('should handle multiple linked characters', () => {
			const contexts: PlayerCharacterContext[] = [
				{
					characterName: 'Thorin Ironhammer',
					relationship: 'knows',
					description: 'A grizzled dwarven fighter',
					fields: {
						playerName: 'John Smith'
					},
					fieldLabels: {
						playerName: 'Player Name'
					}
				},
				{
					characterName: 'Elara Swiftwind',
					relationship: 'trusts',
					description: 'An elven ranger',
					fields: {
						playerName: 'Jane Doe'
					},
					fieldLabels: {
						playerName: 'Player Name'
					}
				}
			];

			const result = formatPlayerCharacterContextForPrompt(contexts);

			expect(result).toContain('Thorin Ironhammer');
			expect(result).toContain('Elara Swiftwind');
			expect(result).toContain('John Smith');
			expect(result).toContain('Jane Doe');
		});

		it('should handle empty character list (return empty string)', () => {
			const contexts: PlayerCharacterContext[] = [];

			const result = formatPlayerCharacterContextForPrompt(contexts);

			expect(result).toBe('');
		});

		it('should format description and summary fields', () => {
			const contexts: PlayerCharacterContext[] = [
				{
					characterName: 'Thorin Ironhammer',
					relationship: 'knows',
					description: 'A grizzled dwarven fighter with a mysterious past',
					summary: 'A veteran warrior seeking redemption',
					fields: {},
					fieldLabels: {}
				}
			];

			const result = formatPlayerCharacterContextForPrompt(contexts);

			expect(result).toContain('A grizzled dwarven fighter with a mysterious past');
			expect(result).toContain('A veteran warrior seeking redemption');
		});

		it('should handle characters with many custom fields', () => {
			const contexts: PlayerCharacterContext[] = [
				{
					characterName: 'Thorin Ironhammer',
					relationship: 'knows',
					description: 'A grizzled dwarven fighter',
					fields: {
						playerName: 'John Smith',
						concept: 'Veteran',
						background: 'Royal guard',
						personality: 'Brave',
						goals: 'Redemption',
						favoriteDrink: 'Ale',
						battleCry: 'For honor!',
						weaponOfChoice: 'Warhammer'
					},
					fieldLabels: {
						playerName: 'Player Name',
						concept: 'Character Concept',
						background: 'Background',
						personality: 'Personality',
						goals: 'Goals & Motivations',
						favoriteDrink: 'Favorite Drink',
						battleCry: 'Battle Cry',
						weaponOfChoice: 'Weapon of Choice'
					}
				}
			];

			const result = formatPlayerCharacterContextForPrompt(contexts);

			// All fields should be included
			expect(result).toContain('Favorite Drink: Ale');
			expect(result).toContain('Battle Cry: For honor!');
			expect(result).toContain('Weapon of Choice: Warhammer');
		});
	});

	describe('buildPlayerCharacterContext', () => {
		it('should return hasContext: false when no PCs linked', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			const entityWithNoLinks: BaseEntity = {
				...mockNPC,
				links: []
			};

			vi.mocked(entityRepository.getById).mockResolvedValue(entityWithNoLinks);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);

			const result = await buildPlayerCharacterContext(mockEntityId);

			expect(result.hasContext).toBe(false);
			expect(result.formattedContext).toBe('');
		});

		it('should return full context when PCs are linked', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');

			vi.mocked(entityRepository.getById).mockResolvedValue(mockNPC);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([mockPlayerCharacter]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'playerName',
						label: 'Player Name',
						type: 'text',
						required: true,
						order: 1
					}
				],
				defaultRelationships: []
			});

			const result = await buildPlayerCharacterContext(mockEntityId);

			expect(result.hasContext).toBe(true);
			expect(result.formattedContext).toContain('Thorin Ironhammer');
			expect(result.formattedContext).toContain('Player Character Context');
			expect(result.contexts).toHaveLength(1);
		});

		it('should handle multiple linked PCs', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');

			const secondCharacter: BaseEntity = {
				...mockPlayerCharacter,
				id: 'char-002',
				name: 'Elara Swiftwind',
				fields: {
					playerName: 'Jane Doe',
					concept: 'Elven ranger'
				}
			};

			const entityLinkedToMultiple: BaseEntity = {
				...mockNPC,
				links: [
					{
						id: 'link-006',
						targetId: mockCharacterId,
						targetType: 'character',
						relationship: 'knows',
						bidirectional: true
					},
					{
						id: 'link-007',
						targetId: 'char-002',
						targetType: 'character',
						relationship: 'trusts',
						bidirectional: false
					}
				]
			};

			vi.mocked(entityRepository.getById).mockResolvedValue(entityLinkedToMultiple);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([
				mockPlayerCharacter,
				secondCharacter
			]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'playerName',
						label: 'Player Name',
						type: 'text',
						required: true,
						order: 1
					}
				],
				defaultRelationships: []
			});

			const result = await buildPlayerCharacterContext(mockEntityId);

			expect(result.hasContext).toBe(true);
			expect(result.contexts).toHaveLength(2);
			expect(result.formattedContext).toContain('Thorin Ironhammer');
			expect(result.formattedContext).toContain('Elara Swiftwind');
		});

		it('should work for entities that are being generated for (backward compatibility)', async () => {
			const { entityRepository } = await import('$lib/db/repositories');

			// Entity exists but has no player character relationships
			const locationEntity: BaseEntity = {
				id: 'location-001',
				type: 'location',
				name: 'The Tavern',
				description: 'A cozy tavern',
				tags: [],
				fields: {},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			vi.mocked(entityRepository.getById).mockResolvedValue(locationEntity);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);

			const result = await buildPlayerCharacterContext('location-001');

			// Should work without error and return no context
			expect(result.hasContext).toBe(false);
			expect(result.formattedContext).toBe('');
		});

		it('should handle errors gracefully', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			vi.mocked(entityRepository.getById).mockRejectedValue(new Error('Database error'));

			await expect(buildPlayerCharacterContext('bad-id')).rejects.toThrow('Database error');
		});
	});

	describe('Integration: Full workflow', () => {
		it('should build complete PC context for an NPC that knows a player character', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');

			// Setup: NPC knows a player character
			vi.mocked(entityRepository.getById).mockResolvedValue(mockNPC);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([mockPlayerCharacter]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'playerName',
						label: 'Player Name',
						type: 'text',
						required: true,
						order: 1
					},
					{
						key: 'concept',
						label: 'Character Concept',
						type: 'text',
						required: false,
						order: 2
					},
					{
						key: 'background',
						label: 'Background',
						type: 'richtext',
						required: false,
						order: 3
					},
					{
						key: 'personality',
						label: 'Personality',
						type: 'richtext',
						required: false,
						order: 4
					}
				],
				defaultRelationships: []
			});

			// Execute: Build context
			const result = await buildPlayerCharacterContext(mockEntityId);

			// Verify: Complete context is built
			expect(result.hasContext).toBe(true);
			expect(result.contexts).toHaveLength(1);
			expect(result.contexts![0].characterName).toBe('Thorin Ironhammer');
			expect(result.contexts![0].fields['playerName']).toBe('John Smith');
			expect(result.contexts![0].fields['concept']).toBe('Grizzled veteran seeking redemption');

			// Verify: Formatted context is ready for AI prompt
			expect(result.formattedContext).toContain('=== Player Character Context ===');
			expect(result.formattedContext).toContain('Thorin Ironhammer');
			expect(result.formattedContext).toContain('Player Name: John Smith');
		});

		it('should exclude secrets from PC context', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');

			vi.mocked(entityRepository.getById).mockResolvedValue(mockNPC);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([mockPlayerCharacterWithSecrets]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'playerName',
						label: 'Player Name',
						type: 'text',
						required: true,
						order: 1
					},
					{
						key: 'secrets',
						label: 'Secrets',
						type: 'richtext',
						required: false,
						order: 6,
						section: 'hidden'
					}
				],
				defaultRelationships: []
			});

			const result = await buildPlayerCharacterContext(mockEntityId);

			expect(result.hasContext).toBe(true);
			expect(result.formattedContext).not.toContain('Secretly working for the enemy');
			expect(result.formattedContext).toContain('Player Name: John Smith');
		});
	});

	describe('Edge Cases', () => {
		it('should handle character with only required fields', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');

			const minimalCharacter: BaseEntity = {
				id: 'char-minimal',
				type: 'character',
				name: 'Minimal Character',
				description: '',
				tags: [],
				fields: {
					playerName: 'Test Player'
				},
				links: [],
				notes: '',
				createdAt: new Date(),
				updatedAt: new Date(),
				metadata: {}
			};

			const entityLinkedToMinimal: BaseEntity = {
				...mockNPC,
				links: [
					{
						id: 'link-minimal',
						targetId: 'char-minimal',
						targetType: 'character',
						relationship: 'knows',
						bidirectional: false
					}
				]
			};

			vi.mocked(entityRepository.getById).mockResolvedValue(entityLinkedToMinimal);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([minimalCharacter]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'playerName',
						label: 'Player Name',
						type: 'text',
						required: true,
						order: 1
					}
				],
				defaultRelationships: []
			});

			const result = await buildPlayerCharacterContext(mockEntityId);

			expect(result.hasContext).toBe(true);
			expect(result.contexts![0].fields['playerName']).toBe('Test Player');
		});

		it('should handle very long field values', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');

			const longText = 'A'.repeat(5000);
			const characterWithLongFields: BaseEntity = {
				...mockPlayerCharacter,
				fields: {
					playerName: 'John Smith',
					background: longText
				}
			};

			vi.mocked(entityRepository.getById).mockResolvedValue(mockNPC);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([characterWithLongFields]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'background',
						label: 'Background',
						type: 'richtext',
						required: false,
						order: 3
					}
				],
				defaultRelationships: []
			});

			const result = await buildPlayerCharacterContext(mockEntityId);

			expect(result.hasContext).toBe(true);
			expect(result.formattedContext.length).toBeGreaterThan(1000);
		});

		it('should handle special characters in field values', async () => {
			const { entityRepository } = await import('$lib/db/repositories');
			const { getEntityTypeDefinition } = await import('$lib/config/entityTypes');

			const characterWithSpecialChars: BaseEntity = {
				...mockPlayerCharacter,
				name: "O'Brien the \"Lucky\"",
				fields: {
					playerName: 'John <Smith>',
					concept: 'A character with & special characters'
				}
			};

			vi.mocked(entityRepository.getById).mockResolvedValue(mockNPC);
			vi.mocked(entityRepository.getByIds).mockResolvedValue([characterWithSpecialChars]);
			vi.mocked(entityRepository.getEntitiesLinkingTo).mockResolvedValue([]);
			vi.mocked(getEntityTypeDefinition).mockReturnValue({
				type: 'character',
				label: 'Player Character',
				labelPlural: 'Player Characters',
				icon: 'user',
				color: 'character',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'playerName',
						label: 'Player Name',
						type: 'text',
						required: true,
						order: 1
					}
				],
				defaultRelationships: []
			});

			const result = await buildPlayerCharacterContext(mockEntityId);

			expect(result.hasContext).toBe(true);
			expect(result.formattedContext).toContain('O\'Brien the "Lucky"');
			expect(result.formattedContext).toContain('John <Smith>');
		});
	});
});
