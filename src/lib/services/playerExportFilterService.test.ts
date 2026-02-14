/**
 * Tests for Player Export Filter Service (TDD RED Phase)
 *
 * This service filters campaign data to create player-safe exports by:
 * 1. Filtering out entire entities based on visibility rules
 * 2. Removing sensitive fields (notes, hidden section fields, preparation)
 * 3. Filtering entity links (removing DM-only links and sensitive link properties)
 *
 * Covers:
 * - Entity visibility rules (playerVisible, player_profile, timeline_event knownBy)
 * - Field filtering (notes, hidden section, preparation for sessions)
 * - Link filtering (playerVisible, notes, metadata removal)
 * - Integration scenarios with mixed visibility
 * - Edge cases and boundary conditions
 *
 * NOTE: These tests are expected to FAIL initially (RED phase).
 * Implementation will be added in the GREEN phase to make them pass.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
	isEntityPlayerVisible,
	filterEntityForPlayer,
	getHiddenFieldKeys,
	filterFieldsForPlayer,
	filterLinksForPlayer,
	filterEntitiesForPlayer
} from './playerExportFilterService';
import type { BaseEntity, EntityLink, FieldDefinition, EntityTypeDefinition } from '$lib/types/entities';
import type { PlayerEntity, PlayerEntityLink } from '$lib/types/playerExport';
import type { PlayerExportFieldConfig } from '$lib/types/playerFieldVisibility';
import { PLAYER_EXPORT_FIELD_OVERRIDES_KEY } from '$lib/types/playerFieldVisibility';

describe('playerExportFilterService', () => {
	// Test fixtures
	let baseEntity: BaseEntity;
	let entityTypeDefinition: EntityTypeDefinition;

	beforeEach(() => {
		// Standard test entity
		baseEntity = {
			id: 'entity-1',
			type: 'npc',
			name: 'Test NPC',
			description: 'A test non-player character',
			summary: 'Brief summary',
			tags: ['friendly', 'merchant'],
			imageUrl: 'https://example.com/npc.png',
			fields: {
				alignment: 'neutral good',
				occupation: 'shopkeeper',
				secret_motivation: 'Actually a spy'
			},
			links: [],
			notes: 'DM notes about this character',
			playerVisible: true,
			createdAt: new Date('2025-01-01'),
			updatedAt: new Date('2025-01-10'),
			metadata: { customField: 'value' }
		};

		// Standard entity type definition
		entityTypeDefinition = {
			type: 'npc',
			label: 'NPC',
			labelPlural: 'NPCs',
			description: 'Non-player characters',
			icon: 'users',
			color: 'blue',
			isBuiltIn: true,
			fieldDefinitions: [
				{
					key: 'alignment',
					label: 'Alignment',
					type: 'text',
					required: false,
					section: 'public',
					order: 1
				},
				{
					key: 'occupation',
					label: 'Occupation',
					type: 'text',
					required: false,
					section: 'public',
					order: 2
				},
				{
					key: 'secret_motivation',
					label: 'Secret Motivation',
					type: 'textarea',
					required: false,
					section: 'hidden',
					order: 3
				}
			],
			defaultRelationships: ['member_of', 'located_at']
		};
	});

	describe('isEntityPlayerVisible', () => {
		describe('playerVisible flag', () => {
			it('should return false for playerVisible: false', () => {
				const entity: BaseEntity = { ...baseEntity, playerVisible: false };
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(false);
			});

			it('should return true for playerVisible: true', () => {
				const entity: BaseEntity = { ...baseEntity, playerVisible: true };
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});

			it('should return true for playerVisible: undefined (default visible)', () => {
				const entity: BaseEntity = { ...baseEntity };
				delete entity.playerVisible;
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});
		});

		describe('player_profile type filtering', () => {
			it('should return false for player_profile type', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'player_profile',
					playerVisible: true
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(false);
			});

			it('should return false for player_profile even when playerVisible is undefined', () => {
				const entity: BaseEntity = { ...baseEntity, type: 'player_profile' };
				delete entity.playerVisible;
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(false);
			});
		});

		describe('timeline_event knownBy filtering', () => {
			it('should return false for timeline_event with knownBy: secret', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { knownBy: 'secret' },
					playerVisible: true
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(false);
			});

			it('should return false for timeline_event with knownBy: lost', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { knownBy: 'lost' },
					playerVisible: true
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(false);
			});

			it('should return true for timeline_event with knownBy: common_knowledge', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { knownBy: 'common_knowledge' },
					playerVisible: true
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});

			it('should return true for timeline_event with knownBy: scholarly', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { knownBy: 'scholarly' },
					playerVisible: true
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});

			it('should return true for timeline_event without knownBy field', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { otherField: 'value' },
					playerVisible: true
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});

			it('should return true for timeline_event with empty knownBy field', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { knownBy: '' },
					playerVisible: true
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});

			it('should respect playerVisible: false even with knownBy: common_knowledge', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { knownBy: 'common_knowledge' },
					playerVisible: false
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(false);
			});
		});

		describe('other entity types', () => {
			it('should return true for character with playerVisible: true', () => {
				const entity: BaseEntity = { ...baseEntity, type: 'character' };
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});

			it('should return true for location with playerVisible: undefined', () => {
				const entity: BaseEntity = { ...baseEntity, type: 'location' };
				delete entity.playerVisible;
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});

			it('should return true for session with playerVisible: true', () => {
				const entity: BaseEntity = { ...baseEntity, type: 'session' };
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});

			it('should return true for custom entity type', () => {
				const entity: BaseEntity = { ...baseEntity, type: 'custom_type' };
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});
		});

		describe('edge cases', () => {
			it('should handle timeline_event with knownBy as number (type coercion)', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { knownBy: 123 },
					playerVisible: true
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true); // Non-string knownBy treated as not secret/lost
			});

			it('should handle timeline_event with knownBy: null', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { knownBy: null },
					playerVisible: true
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true);
			});

			it('should be case-sensitive for knownBy values', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { knownBy: 'SECRET' }, // Uppercase
					playerVisible: true
				};
				const result = isEntityPlayerVisible(entity);
				expect(result).toBe(true); // 'SECRET' !== 'secret'
			});
		});
	});

	describe('getHiddenFieldKeys', () => {
		it('should return empty array when no field definitions provided', () => {
			const result = getHiddenFieldKeys([]);
			expect(result).toEqual([]);
		});

		it('should return keys of fields with section: hidden', () => {
			const fieldDefs: FieldDefinition[] = [
				{
					key: 'public_field',
					label: 'Public Field',
					type: 'text',
					required: false,
					section: 'public',
					order: 1
				},
				{
					key: 'secret_field',
					label: 'Secret Field',
					type: 'text',
					required: false,
					section: 'hidden',
					order: 2
				},
				{
					key: 'another_secret',
					label: 'Another Secret',
					type: 'textarea',
					required: false,
					section: 'hidden',
					order: 3
				}
			];
			const result = getHiddenFieldKeys(fieldDefs);
			expect(result).toEqual(['secret_field', 'another_secret']);
		});

		it('should return empty array when no hidden fields exist', () => {
			const fieldDefs: FieldDefinition[] = [
				{
					key: 'field1',
					label: 'Field 1',
					type: 'text',
					required: false,
					section: 'public',
					order: 1
				},
				{
					key: 'field2',
					label: 'Field 2',
					type: 'text',
					required: false,
					section: 'details',
					order: 2
				}
			];
			const result = getHiddenFieldKeys(fieldDefs);
			expect(result).toEqual([]);
		});

		it('should handle fields without section property', () => {
			const fieldDefs: FieldDefinition[] = [
				{
					key: 'field_no_section',
					label: 'Field No Section',
					type: 'text',
					required: false,
					order: 1
				},
				{
					key: 'hidden_field',
					label: 'Hidden Field',
					type: 'text',
					required: false,
					section: 'hidden',
					order: 2
				}
			];
			const result = getHiddenFieldKeys(fieldDefs);
			expect(result).toEqual(['hidden_field']);
		});

		it('should preserve order of hidden field keys', () => {
			const fieldDefs: FieldDefinition[] = [
				{
					key: 'secret_c',
					label: 'Secret C',
					type: 'text',
					required: false,
					section: 'hidden',
					order: 3
				},
				{
					key: 'secret_a',
					label: 'Secret A',
					type: 'text',
					required: false,
					section: 'hidden',
					order: 1
				},
				{
					key: 'secret_b',
					label: 'Secret B',
					type: 'text',
					required: false,
					section: 'hidden',
					order: 2
				}
			];
			const result = getHiddenFieldKeys(fieldDefs);
			expect(result).toEqual(['secret_c', 'secret_a', 'secret_b']);
		});
	});

	describe('filterFieldsForPlayer', () => {
		describe('notes field removal', () => {
			it('should remove notes field even if not marked hidden', () => {
				const fields = {
					name: 'Test',
					notes: 'Secret DM notes',
					description: 'Public description'
				};
				const result = filterFieldsForPlayer(fields, [], false);
				expect(result).not.toHaveProperty('notes');
				expect(result).toHaveProperty('name');
				expect(result).toHaveProperty('description');
			});

			it('should handle fields without notes property', () => {
				const fields = {
					name: 'Test',
					description: 'Public description'
				};
				const result = filterFieldsForPlayer(fields, [], false);
				expect(result).toEqual(fields);
			});
		});

		describe('hidden field removal', () => {
			it('should remove fields marked as hidden', () => {
				const fields = {
					public_field: 'visible',
					secret_field: 'hidden data',
					another_secret: 'more hidden data',
					normal_field: 'visible too'
				};
				const hiddenKeys = ['secret_field', 'another_secret'];
				const result = filterFieldsForPlayer(fields, hiddenKeys, false);
				expect(result).toEqual({
					public_field: 'visible',
					normal_field: 'visible too'
				});
			});

			it('should handle empty hidden keys array', () => {
				const fields = {
					field1: 'value1',
					field2: 'value2'
				};
				const result = filterFieldsForPlayer(fields, [], false);
				expect(result).toEqual(fields);
			});

			it('should handle hidden keys that do not exist in fields', () => {
				const fields = {
					existing_field: 'value'
				};
				const hiddenKeys = ['non_existent_field', 'another_missing'];
				const result = filterFieldsForPlayer(fields, hiddenKeys, false);
				expect(result).toEqual(fields);
			});
		});

		describe('session preparation field removal', () => {
			it('should remove preparation field for session entities', () => {
				const fields = {
					title: 'Session 1',
					date: '2025-01-15',
					preparation: 'DM prep notes for this session',
					summary: 'Session summary'
				};
				const result = filterFieldsForPlayer(fields, [], true);
				expect(result).not.toHaveProperty('preparation');
				expect(result).toHaveProperty('title');
				expect(result).toHaveProperty('date');
				expect(result).toHaveProperty('summary');
			});

			it('should not remove preparation field for non-session entities', () => {
				const fields = {
					name: 'Test',
					preparation: 'Some preparation field'
				};
				const result = filterFieldsForPlayer(fields, [], false);
				expect(result).toHaveProperty('preparation');
			});

			it('should handle session without preparation field', () => {
				const fields = {
					title: 'Session 1',
					date: '2025-01-15'
				};
				const result = filterFieldsForPlayer(fields, [], true);
				expect(result).toEqual(fields);
			});
		});

		describe('combined filtering', () => {
			it('should remove notes, hidden fields, and preparation together', () => {
				const fields = {
					public_field: 'visible',
					notes: 'DM notes',
					secret_motivation: 'hidden',
					preparation: 'prep notes',
					description: 'visible description'
				};
				const hiddenKeys = ['secret_motivation'];
				const result = filterFieldsForPlayer(fields, hiddenKeys, true);
				expect(result).toEqual({
					public_field: 'visible',
					description: 'visible description'
				});
			});

			it('should preserve field values of different types', () => {
				const fields = {
					name: 'Test',
					age: 25,
					active: true,
					tags: ['tag1', 'tag2'],
					empty: null,
					undefined_field: undefined
				};
				const result = filterFieldsForPlayer(fields, [], false);
				expect(result).toEqual(fields);
			});
		});

		describe('edge cases', () => {
			it('should handle empty fields object', () => {
				const result = filterFieldsForPlayer({}, [], false);
				expect(result).toEqual({});
			});

			it('should handle fields with only filtered keys', () => {
				const fields = {
					notes: 'notes',
					secret: 'secret',
					preparation: 'prep'
				};
				const result = filterFieldsForPlayer(fields, ['secret'], true);
				expect(result).toEqual({});
			});

			it('should not mutate original fields object', () => {
				const fields = {
					keep: 'value',
					notes: 'remove',
					secret: 'remove'
				};
				const original = { ...fields };
				filterFieldsForPlayer(fields, ['secret'], false);
				expect(fields).toEqual(original);
			});

			it('should handle fields with numeric keys', () => {
				const fields = {
					'0': 'value0',
					'1': 'value1',
					notes: 'remove'
				};
				const result = filterFieldsForPlayer(fields, [], false);
				expect(result).toEqual({
					'0': 'value0',
					'1': 'value1'
				});
			});

			it('should handle fields with special characters in keys', () => {
				const fields = {
					'field-with-dash': 'value1',
					'field_with_underscore': 'value2',
					'field.with.dot': 'value3',
					notes: 'remove'
				};
				const result = filterFieldsForPlayer(fields, [], false);
				expect(result).toHaveProperty('field-with-dash');
				expect(result).toHaveProperty('field_with_underscore');
				expect(result).toHaveProperty('field.with.dot');
				expect(result).not.toHaveProperty('notes');
			});
		});
	});

	describe('filterLinksForPlayer', () => {
		let testLinks: EntityLink[];

		beforeEach(() => {
			testLinks = [
				{
					id: 'link-1',
					sourceId: 'entity-1',
					targetId: 'entity-2',
					targetType: 'npc',
					relationship: 'knows',
					bidirectional: true,
					notes: 'They met at a tavern',
					strength: 'strong',
					playerVisible: true,
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-10'),
					metadata: { tension: 5 }
				},
				{
					id: 'link-2',
					sourceId: 'entity-1',
					targetId: 'entity-3',
					targetType: 'location',
					relationship: 'located_at',
					bidirectional: false,
					notes: 'Secret hideout',
					strength: 'moderate',
					playerVisible: false,
					createdAt: new Date('2025-01-05'),
					updatedAt: new Date('2025-01-12')
				}
			];
		});

		describe('playerVisible filtering', () => {
			it('should remove links with playerVisible: false', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('link-1');
			});

			it('should keep links with playerVisible: true', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: true,
						playerVisible: true
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result).toHaveLength(1);
			});

			it('should keep links with playerVisible: undefined (default visible)', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: true
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result).toHaveLength(1);
			});

			it('should handle empty links array', () => {
				const result = filterLinksForPlayer([]);
				expect(result).toEqual([]);
			});

			it('should filter multiple hidden links', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: true,
						playerVisible: true
					},
					{
						id: 'link-2',
						targetId: 'target-2',
						targetType: 'faction',
						relationship: 'secret_member',
						bidirectional: false,
						playerVisible: false
					},
					{
						id: 'link-3',
						targetId: 'target-3',
						targetType: 'item',
						relationship: 'hidden_item',
						bidirectional: false,
						playerVisible: false
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('link-1');
			});
		});

		describe('property removal', () => {
			it('should remove notes property from links', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).not.toHaveProperty('notes');
			});

			it('should remove metadata property from links', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).not.toHaveProperty('metadata');
			});

			it('should remove playerVisible property from output', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).not.toHaveProperty('playerVisible');
			});

			it('should remove createdAt property from output', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).not.toHaveProperty('createdAt');
			});

			it('should remove updatedAt property from output', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).not.toHaveProperty('updatedAt');
			});

			it('should remove sourceId property from output', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).not.toHaveProperty('sourceId');
			});
		});

		describe('property preservation', () => {
			it('should preserve id property', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).toHaveProperty('id');
				expect(result[0].id).toBe('link-1');
			});

			it('should preserve targetId property', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).toHaveProperty('targetId');
				expect(result[0].targetId).toBe('entity-2');
			});

			it('should preserve targetType property', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).toHaveProperty('targetType');
				expect(result[0].targetType).toBe('npc');
			});

			it('should preserve relationship property', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).toHaveProperty('relationship');
				expect(result[0].relationship).toBe('knows');
			});

			it('should preserve bidirectional property', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).toHaveProperty('bidirectional');
				expect(result[0].bidirectional).toBe(true);
			});

			it('should preserve reverseRelationship property', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'patron_of',
						bidirectional: true,
						reverseRelationship: 'client_of',
						playerVisible: true
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result[0]).toHaveProperty('reverseRelationship');
				expect(result[0].reverseRelationship).toBe('client_of');
			});

			it('should preserve strength property', () => {
				const result = filterLinksForPlayer(testLinks);
				expect(result[0]).toHaveProperty('strength');
				expect(result[0].strength).toBe('strong');
			});
		});

		describe('optional properties', () => {
			it('should handle links without reverseRelationship', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: true,
						playerVisible: true
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result[0]).not.toHaveProperty('reverseRelationship');
			});

			it('should handle links without strength', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: true,
						playerVisible: true
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result[0]).not.toHaveProperty('strength');
			});

			it('should handle links without notes', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: true,
						playerVisible: true
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result).toHaveLength(1);
			});

			it('should handle links without metadata', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: true,
						playerVisible: true
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result).toHaveLength(1);
			});
		});

		describe('edge cases', () => {
			it('should not mutate original links array', () => {
				const originalLength = testLinks.length;
				const originalFirstLink = { ...testLinks[0] };
				filterLinksForPlayer(testLinks);
				expect(testLinks.length).toBe(originalLength);
				expect(testLinks[0].id).toBe(originalFirstLink.id);
				expect(testLinks[0].targetId).toBe(originalFirstLink.targetId);
				expect(testLinks[0].playerVisible).toBe(originalFirstLink.playerVisible);
			});

			it('should handle all links being filtered out', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'secret',
						bidirectional: false,
						playerVisible: false
					},
					{
						id: 'link-2',
						targetId: 'target-2',
						targetType: 'faction',
						relationship: 'hidden',
						bidirectional: false,
						playerVisible: false
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result).toEqual([]);
			});

			it('should handle links with undefined reverseRelationship correctly', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: true,
						reverseRelationship: undefined,
						playerVisible: true
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result[0]).toHaveProperty('reverseRelationship');
				expect(result[0].reverseRelationship).toBeUndefined();
			});

			it('should handle links with all strength types', () => {
				const links: EntityLink[] = [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'npc',
						relationship: 'knows',
						bidirectional: true,
						strength: 'strong',
						playerVisible: true
					},
					{
						id: 'link-2',
						targetId: 'target-2',
						targetType: 'npc',
						relationship: 'acquaintance',
						bidirectional: true,
						strength: 'moderate',
						playerVisible: true
					},
					{
						id: 'link-3',
						targetId: 'target-3',
						targetType: 'npc',
						relationship: 'seen_once',
						bidirectional: true,
						strength: 'weak',
						playerVisible: true
					}
				];
				const result = filterLinksForPlayer(links);
				expect(result).toHaveLength(3);
				expect(result[0].strength).toBe('strong');
				expect(result[1].strength).toBe('moderate');
				expect(result[2].strength).toBe('weak');
			});
		});
	});

	describe('filterEntityForPlayer', () => {
		describe('entity visibility', () => {
			it('should return null when entity is not player visible', () => {
				const entity: BaseEntity = { ...baseEntity, playerVisible: false };
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).toBeNull();
			});

			it('should return null for player_profile type', () => {
				const entity: BaseEntity = { ...baseEntity, type: 'player_profile' };
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).toBeNull();
			});

			it('should return null for timeline_event with knownBy: secret', () => {
				const entity: BaseEntity = {
					...baseEntity,
					type: 'timeline_event',
					fields: { knownBy: 'secret' }
				};
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).toBeNull();
			});

			it('should filter visible entity', () => {
				const entity: BaseEntity = { ...baseEntity, playerVisible: true };
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
			});
		});

		describe('field filtering', () => {
			it('should remove notes field', () => {
				const entity: BaseEntity = { ...baseEntity, notes: 'Secret DM notes' };
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result).not.toHaveProperty('notes');
			});

			it('should remove fields with section: hidden', () => {
				const entity: BaseEntity = {
					...baseEntity,
					fields: {
						alignment: 'neutral good',
						occupation: 'shopkeeper',
						secret_motivation: 'Actually a spy'
					}
				};
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result!.fields).toHaveProperty('alignment');
				expect(result!.fields).toHaveProperty('occupation');
				expect(result!.fields).not.toHaveProperty('secret_motivation');
			});

			it('should remove preparation field for session type', () => {
				const sessionTypeDef: EntityTypeDefinition = {
					...entityTypeDefinition,
					type: 'session'
				};
				const entity: BaseEntity = {
					...baseEntity,
					type: 'session',
					fields: {
						title: 'Session 1',
						preparation: 'DM prep notes',
						summary: 'Session summary'
					}
				};
				const result = filterEntityForPlayer(entity, sessionTypeDef);
				expect(result).not.toBeNull();
				expect(result!.fields).toHaveProperty('title');
				expect(result!.fields).toHaveProperty('summary');
				expect(result!.fields).not.toHaveProperty('preparation');
			});

			it('should preserve public fields', () => {
				const entity: BaseEntity = {
					...baseEntity,
					fields: {
						alignment: 'neutral good',
						occupation: 'shopkeeper'
					}
				};
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result!.fields).toEqual({
					alignment: 'neutral good',
					occupation: 'shopkeeper'
				});
			});
		});

		describe('link filtering', () => {
			it('should filter links correctly', () => {
				const entity: BaseEntity = {
					...baseEntity,
					links: [
						{
							id: 'link-1',
							targetId: 'target-1',
							targetType: 'npc',
							relationship: 'knows',
							bidirectional: true,
							notes: 'Link notes',
							playerVisible: true,
							metadata: { tension: 5 }
						},
						{
							id: 'link-2',
							targetId: 'target-2',
							targetType: 'faction',
							relationship: 'secret_member',
							bidirectional: false,
							playerVisible: false
						}
					]
				};
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result!.links).toHaveLength(1);
				expect(result!.links[0].id).toBe('link-1');
				expect(result!.links[0]).not.toHaveProperty('notes');
				expect(result!.links[0]).not.toHaveProperty('metadata');
			});

			it('should handle entity with no links', () => {
				const entity: BaseEntity = { ...baseEntity, links: [] };
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result!.links).toEqual([]);
			});
		});

		describe('property preservation', () => {
			it('should preserve core entity properties', () => {
				const entity: BaseEntity = { ...baseEntity };
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result!.id).toBe(entity.id);
				expect(result!.type).toBe(entity.type);
				expect(result!.name).toBe(entity.name);
				expect(result!.description).toBe(entity.description);
				expect(result!.summary).toBe(entity.summary);
				expect(result!.tags).toEqual(entity.tags);
				expect(result!.imageUrl).toBe(entity.imageUrl);
				expect(result!.createdAt).toEqual(entity.createdAt);
				expect(result!.updatedAt).toEqual(entity.updatedAt);
			});

			it('should not include metadata property', () => {
				const entity: BaseEntity = { ...baseEntity, metadata: { custom: 'data' } };
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result).not.toHaveProperty('metadata');
			});

			it('should not include playerVisible property', () => {
				const entity: BaseEntity = { ...baseEntity, playerVisible: true };
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result).not.toHaveProperty('playerVisible');
			});

			it('should handle entity with optional fields missing', () => {
				const entity: BaseEntity = {
					...baseEntity,
					summary: undefined,
					imageUrl: undefined
				};
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result!.summary).toBeUndefined();
				expect(result!.imageUrl).toBeUndefined();
			});
		});

		describe('undefined type definition', () => {
			it('should handle entity with no type definition', () => {
				const entity: BaseEntity = { ...baseEntity };
				const result = filterEntityForPlayer(entity, undefined);
				expect(result).not.toBeNull();
				// Should still filter notes but not field-specific filtering
				expect(result).not.toHaveProperty('notes');
			});

			it('should not filter hidden fields when type definition is undefined', () => {
				const entity: BaseEntity = {
					...baseEntity,
					fields: {
						public_field: 'value',
						secret_field: 'secret'
					}
				};
				const result = filterEntityForPlayer(entity, undefined);
				expect(result).not.toBeNull();
				expect(result!.fields).toHaveProperty('public_field');
				expect(result!.fields).toHaveProperty('secret_field');
			});
		});

		describe('edge cases', () => {
			it('should handle entity with empty fields object', () => {
				const entity: BaseEntity = { ...baseEntity, fields: {} };
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result!.fields).toEqual({});
			});

			it('should handle entity with empty tags array', () => {
				const entity: BaseEntity = { ...baseEntity, tags: [] };
				const result = filterEntityForPlayer(entity, entityTypeDefinition);
				expect(result).not.toBeNull();
				expect(result!.tags).toEqual([]);
			});

			it('should not mutate original entity', () => {
				const entity: BaseEntity = { ...baseEntity };
				const originalId = entity.id;
				const originalName = entity.name;
				const originalNotes = entity.notes;
				const originalLinks = entity.links;
				filterEntityForPlayer(entity, entityTypeDefinition);
				expect(entity.id).toBe(originalId);
				expect(entity.name).toBe(originalName);
				expect(entity.notes).toBe(originalNotes);
				expect(entity.links).toBe(originalLinks);
			});

			it('should handle entity with all fields being filtered out', () => {
				const entity: BaseEntity = {
					...baseEntity,
					fields: {
						secret1: 'hidden',
						secret2: 'also hidden'
					}
				};
				const typeDef: EntityTypeDefinition = {
					...entityTypeDefinition,
					fieldDefinitions: [
						{
							key: 'secret1',
							label: 'Secret 1',
							type: 'text',
							required: false,
							section: 'hidden',
							order: 1
						},
						{
							key: 'secret2',
							label: 'Secret 2',
							type: 'text',
							required: false,
							section: 'hidden',
							order: 2
						}
					]
				};
				const result = filterEntityForPlayer(entity, typeDef);
				expect(result).not.toBeNull();
				expect(result!.fields).toEqual({});
			});
		});
	});

	describe('filterEntitiesForPlayer (integration)', () => {
		let testEntities: BaseEntity[];
		let typeDefinitions: EntityTypeDefinition[];

		beforeEach(() => {
			testEntities = [
				{
					id: 'entity-1',
					type: 'npc',
					name: 'Visible NPC',
					description: 'A visible character',
					tags: ['friendly'],
					fields: { alignment: 'good' },
					links: [],
					notes: 'DM notes',
					playerVisible: true,
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-10'),
					metadata: {}
				},
				{
					id: 'entity-2',
					type: 'npc',
					name: 'Hidden NPC',
					description: 'A hidden character',
					tags: ['secret'],
					fields: { alignment: 'evil' },
					links: [],
					notes: 'Secret villain',
					playerVisible: false,
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-10'),
					metadata: {}
				},
				{
					id: 'entity-3',
					type: 'player_profile',
					name: 'Player Profile',
					description: 'Should be filtered',
					tags: [],
					fields: {},
					links: [],
					notes: 'Player data',
					playerVisible: true,
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-10'),
					metadata: {}
				},
				{
					id: 'entity-4',
					type: 'location',
					name: 'Visible Location',
					description: 'A public location',
					tags: ['city'],
					fields: { population: 10000 },
					links: [],
					notes: 'Location notes',
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-10'),
					metadata: {}
				}
			];

			typeDefinitions = [
				{
					type: 'npc',
					label: 'NPC',
					labelPlural: 'NPCs',
					icon: 'users',
					color: 'blue',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'alignment',
							label: 'Alignment',
							type: 'text',
							required: false,
							section: 'public',
							order: 1
						}
					],
					defaultRelationships: []
				},
				{
					type: 'location',
					label: 'Location',
					labelPlural: 'Locations',
					icon: 'map-pin',
					color: 'green',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'population',
							label: 'Population',
							type: 'number',
							required: false,
							section: 'public',
							order: 1
						}
					],
					defaultRelationships: []
				}
			];
		});

		describe('filtering multiple entities', () => {
			it('should filter out DM-only entities', () => {
				const result = filterEntitiesForPlayer(testEntities, typeDefinitions);
				expect(result).toHaveLength(2);
				expect(result.map((e) => e.id)).toContain('entity-1');
				expect(result.map((e) => e.id)).toContain('entity-4');
				expect(result.map((e) => e.id)).not.toContain('entity-2');
				expect(result.map((e) => e.id)).not.toContain('entity-3');
			});

			it('should return empty array for empty input', () => {
				const result = filterEntitiesForPlayer([], typeDefinitions);
				expect(result).toEqual([]);
			});

			it('should handle all entities being filtered out', () => {
				const allHidden: BaseEntity[] = [
					{ ...testEntities[0], playerVisible: false },
					{ ...testEntities[1], playerVisible: false }
				];
				const result = filterEntitiesForPlayer(allHidden, typeDefinitions);
				expect(result).toEqual([]);
			});

			it('should handle all entities being visible', () => {
				const allVisible: BaseEntity[] = [
					{ ...testEntities[0] },
					{ ...testEntities[3] }
				];
				const result = filterEntitiesForPlayer(allVisible, typeDefinitions);
				expect(result).toHaveLength(2);
			});
		});

		describe('field and link filtering in bulk', () => {
			it('should filter fields and links for all entities', () => {
				const entitiesWithSecrets: BaseEntity[] = [
					{
						...testEntities[0],
						fields: {
							public_field: 'visible',
							secret_field: 'hidden'
						},
						links: [
							{
								id: 'link-1',
								targetId: 'target-1',
								targetType: 'npc',
								relationship: 'knows',
								bidirectional: true,
								notes: 'Link notes',
								playerVisible: true
							}
						]
					}
				];
				const typeDef: EntityTypeDefinition[] = [
					{
						...typeDefinitions[0],
						fieldDefinitions: [
							{
								key: 'public_field',
								label: 'Public',
								type: 'text',
								required: false,
								section: 'public',
								order: 1
							},
							{
								key: 'secret_field',
								label: 'Secret',
								type: 'text',
								required: false,
								section: 'hidden',
								order: 2
							}
						]
					}
				];
				const result = filterEntitiesForPlayer(entitiesWithSecrets, typeDef);
				expect(result).toHaveLength(1);
				expect(result[0].fields).toHaveProperty('public_field');
				expect(result[0].fields).not.toHaveProperty('secret_field');
				expect(result[0].links).toHaveLength(1);
				expect(result[0].links[0]).not.toHaveProperty('notes');
			});

			it('should handle entities with missing type definitions', () => {
				const mixedEntities: BaseEntity[] = [
					testEntities[0],
					{ ...testEntities[0], type: 'custom_type', id: 'custom-1' }
				];
				const result = filterEntitiesForPlayer(mixedEntities, typeDefinitions);
				expect(result).toHaveLength(2);
			});
		});

		describe('timeline events filtering', () => {
			it('should filter timeline events by knownBy field', () => {
				const events: BaseEntity[] = [
					{
						id: 'event-1',
						type: 'timeline_event',
						name: 'Public Event',
						description: 'Everyone knows',
						tags: [],
						fields: { knownBy: 'common_knowledge' },
						links: [],
						notes: '',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {}
					},
					{
						id: 'event-2',
						type: 'timeline_event',
						name: 'Secret Event',
						description: 'Hidden from players',
						tags: [],
						fields: { knownBy: 'secret' },
						links: [],
						notes: '',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {}
					},
					{
						id: 'event-3',
						type: 'timeline_event',
						name: 'Lost Event',
						description: 'Forgotten knowledge',
						tags: [],
						fields: { knownBy: 'lost' },
						links: [],
						notes: '',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {}
					},
					{
						id: 'event-4',
						type: 'timeline_event',
						name: 'Scholarly Event',
						description: 'In books',
						tags: [],
						fields: { knownBy: 'scholarly' },
						links: [],
						notes: '',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {}
					}
				];
				const result = filterEntitiesForPlayer(events, typeDefinitions);
				expect(result).toHaveLength(2);
				expect(result.map((e) => e.id)).toContain('event-1');
				expect(result.map((e) => e.id)).toContain('event-4');
			});
		});

		describe('edge cases', () => {
			it('should not mutate original entities array', () => {
				const originalLength = testEntities.length;
				const originalFirstId = testEntities[0].id;
				const originalFirstNotes = testEntities[0].notes;
				filterEntitiesForPlayer(testEntities, typeDefinitions);
				expect(testEntities.length).toBe(originalLength);
				expect(testEntities[0].id).toBe(originalFirstId);
				expect(testEntities[0].notes).toBe(originalFirstNotes);
			});

			it('should handle empty type definitions array', () => {
				const result = filterEntitiesForPlayer(testEntities, []);
				expect(result.length).toBeGreaterThan(0);
			});

			it('should preserve entity order after filtering', () => {
				const orderedEntities: BaseEntity[] = [
					{ ...testEntities[0], id: 'a', name: 'A' },
					{ ...testEntities[0], id: 'b', name: 'B' },
					{ ...testEntities[0], id: 'c', name: 'C' }
				];
				const result = filterEntitiesForPlayer(orderedEntities, typeDefinitions);
				expect(result[0].id).toBe('a');
				expect(result[1].id).toBe('b');
				expect(result[2].id).toBe('c');
			});

			it('should handle large number of entities efficiently', () => {
				const manyEntities: BaseEntity[] = [];
				for (let i = 0; i < 1000; i++) {
					manyEntities.push({
						...testEntities[0],
						id: `entity-${i}`,
						name: `Entity ${i}`
					});
				}
				const result = filterEntitiesForPlayer(manyEntities, typeDefinitions);
				expect(result).toHaveLength(1000);
			});
		});

		describe('session type filtering', () => {
			it('should remove preparation field from session entities', () => {
				const sessions: BaseEntity[] = [
					{
						id: 'session-1',
						type: 'session',
						name: 'Session 1',
						description: 'First session',
						tags: [],
						fields: {
							date: '2025-01-15',
							preparation: 'DM prep notes',
							summary: 'Session summary'
						},
						links: [],
						notes: 'Session notes',
						createdAt: new Date(),
						updatedAt: new Date(),
						metadata: {}
					}
				];
				const sessionTypeDef: EntityTypeDefinition = {
					type: 'session',
					label: 'Session',
					labelPlural: 'Sessions',
					icon: 'calendar',
					color: 'purple',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'date',
							label: 'Date',
							type: 'date',
							required: false,
							order: 1
						},
						{
							key: 'preparation',
							label: 'Preparation',
							type: 'textarea',
							required: false,
							order: 2
						},
						{
							key: 'summary',
							label: 'Summary',
							type: 'textarea',
							required: false,
							order: 3
						}
					],
					defaultRelationships: []
				};
				const result = filterEntitiesForPlayer(sessions, [sessionTypeDef]);
				expect(result).toHaveLength(1);
				expect(result[0].fields).toHaveProperty('date');
				expect(result[0].fields).toHaveProperty('summary');
				expect(result[0].fields).not.toHaveProperty('preparation');
			});
		});
	});

	// =====================================================================
	// Issue #439: PlayerExportFieldConfig integration tests
	// =====================================================================
	describe('filterFieldsForPlayer with PlayerExportFieldConfig', () => {
		const npcFieldDefs: FieldDefinition[] = [
			{
				key: 'alignment',
				label: 'Alignment',
				type: 'text',
				required: false,
				section: 'public',
				order: 1
			},
			{
				key: 'occupation',
				label: 'Occupation',
				type: 'text',
				required: false,
				section: 'public',
				order: 2
			},
			{
				key: 'secret_motivation',
				label: 'Secret Motivation',
				type: 'textarea',
				required: false,
				section: 'hidden',
				order: 3
			}
		];

		let npcEntity: BaseEntity;

		beforeEach(() => {
			npcEntity = {
				id: 'npc-1',
				type: 'npc',
				name: 'Test NPC',
				description: 'A test NPC',
				tags: [],
				fields: {
					alignment: 'neutral good',
					occupation: 'shopkeeper',
					secret_motivation: 'Actually a spy',
					notes: 'DM only notes field'
				},
				links: [],
				notes: 'DM notes',
				playerVisible: true,
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-10'),
				metadata: {}
			};
		});

		it('should exclude a field when config sets it to false', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						occupation: false // hide occupation via config
					}
				}
			};
			const result = filterFieldsForPlayer(
				npcEntity.fields,
				['secret_motivation'],
				false,
				'npc',
				npcEntity,
				npcFieldDefs,
				config
			);
			expect(result).not.toHaveProperty('occupation');
			expect(result).toHaveProperty('alignment');
			// notes and secret_motivation still hidden by hardcoded rules
			expect(result).not.toHaveProperty('notes');
			expect(result).not.toHaveProperty('secret_motivation');
		});

		it('should include a normally-hidden field when config sets it to true', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						secret_motivation: true // force-show a hidden-section field
					}
				}
			};
			const result = filterFieldsForPlayer(
				npcEntity.fields,
				['secret_motivation'],
				false,
				'npc',
				npcEntity,
				npcFieldDefs,
				config
			);
			// Config overrides the hidden section rule
			expect(result).toHaveProperty('secret_motivation', 'Actually a spy');
			expect(result).toHaveProperty('alignment');
			expect(result).toHaveProperty('occupation');
		});

		it('should behave identically to old behavior when config is undefined', () => {
			// Old signature: filterFieldsForPlayer(fields, hiddenKeys, isSession)
			// New signature: filterFieldsForPlayer(fields, hiddenKeys, isSession, entityType, entity, fieldDefs, config)
			// With config=undefined, behavior should be the same as old implementation
			const result = filterFieldsForPlayer(
				npcEntity.fields,
				['secret_motivation'],
				false,
				'npc',
				npcEntity,
				npcFieldDefs,
				undefined
			);
			expect(result).toHaveProperty('alignment');
			expect(result).toHaveProperty('occupation');
			expect(result).not.toHaveProperty('secret_motivation');
			expect(result).not.toHaveProperty('notes');
		});

		it('should hide notes field even when config explicitly sets it to true', () => {
			// The isFieldPlayerVisible cascade handles this: config overrides hardcoded.
			// But actually, with config setting notes=true, it should show notes.
			// That's the whole point - config CAN override hardcoded rules.
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						notes: true // force-show notes
					}
				}
			};
			const result = filterFieldsForPlayer(
				npcEntity.fields,
				['secret_motivation'],
				false,
				'npc',
				npcEntity,
				npcFieldDefs,
				config
			);
			// Config overrides hardcoded rule for notes
			expect(result).toHaveProperty('notes', 'DM only notes field');
		});

		it('should hide preparation on session when config is undefined', () => {
			const sessionEntity: BaseEntity = {
				...npcEntity,
				type: 'session',
				fields: {
					date: '2025-01-15',
					preparation: 'DM prep notes',
					summary: 'Session summary'
				}
			};
			const sessionFieldDefs: FieldDefinition[] = [
				{ key: 'date', label: 'Date', type: 'date', required: false, order: 1 },
				{ key: 'preparation', label: 'Preparation', type: 'textarea', required: false, order: 2 },
				{ key: 'summary', label: 'Summary', type: 'textarea', required: false, order: 3 }
			];
			const result = filterFieldsForPlayer(
				sessionEntity.fields,
				[],
				true,
				'session',
				sessionEntity,
				sessionFieldDefs,
				undefined
			);
			expect(result).not.toHaveProperty('preparation');
			expect(result).toHaveProperty('date');
			expect(result).toHaveProperty('summary');
		});

		it('should show preparation on session when config explicitly allows it', () => {
			const sessionEntity: BaseEntity = {
				...npcEntity,
				type: 'session',
				fields: {
					date: '2025-01-15',
					preparation: 'DM prep notes',
					summary: 'Session summary'
				}
			};
			const sessionFieldDefs: FieldDefinition[] = [
				{ key: 'date', label: 'Date', type: 'date', required: false, order: 1 },
				{ key: 'preparation', label: 'Preparation', type: 'textarea', required: false, order: 2 },
				{ key: 'summary', label: 'Summary', type: 'textarea', required: false, order: 3 }
			];
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					session: {
						preparation: true
					}
				}
			};
			const result = filterFieldsForPlayer(
				sessionEntity.fields,
				[],
				true,
				'session',
				sessionEntity,
				sessionFieldDefs,
				config
			);
			expect(result).toHaveProperty('preparation', 'DM prep notes');
		});

		it('should handle config for a different entity type (no effect)', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					location: {
						occupation: false // config is for 'location', not 'npc'
					}
				}
			};
			const result = filterFieldsForPlayer(
				npcEntity.fields,
				['secret_motivation'],
				false,
				'npc',
				npcEntity,
				npcFieldDefs,
				config
			);
			// occupation should still be visible since config doesn't apply to npc
			expect(result).toHaveProperty('occupation');
		});

		it('should handle empty fieldVisibility config', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {}
			};
			const result = filterFieldsForPlayer(
				npcEntity.fields,
				['secret_motivation'],
				false,
				'npc',
				npcEntity,
				npcFieldDefs,
				config
			);
			// Same as no config - fall through to hardcoded rules
			expect(result).toHaveProperty('alignment');
			expect(result).toHaveProperty('occupation');
			expect(result).not.toHaveProperty('secret_motivation');
			expect(result).not.toHaveProperty('notes');
		});
	});

	describe('filterEntityForPlayer with PlayerExportFieldConfig', () => {
		let npcEntity: BaseEntity;
		let npcTypeDef: EntityTypeDefinition;

		beforeEach(() => {
			npcEntity = {
				id: 'npc-1',
				type: 'npc',
				name: 'Test NPC',
				description: 'A test NPC',
				tags: ['friendly'],
				fields: {
					alignment: 'neutral good',
					occupation: 'shopkeeper',
					secret_motivation: 'Actually a spy'
				},
				links: [],
				notes: 'DM notes',
				playerVisible: true,
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-10'),
				metadata: {}
			};

			npcTypeDef = {
				type: 'npc',
				label: 'NPC',
				labelPlural: 'NPCs',
				description: 'Non-player characters',
				icon: 'users',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'alignment',
						label: 'Alignment',
						type: 'text',
						required: false,
						section: 'public',
						order: 1
					},
					{
						key: 'occupation',
						label: 'Occupation',
						type: 'text',
						required: false,
						section: 'public',
						order: 2
					},
					{
						key: 'secret_motivation',
						label: 'Secret Motivation',
						type: 'textarea',
						required: false,
						section: 'hidden',
						order: 3
					}
				],
				defaultRelationships: []
			};
		});

		it('should pass config through and filter fields accordingly', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						occupation: false
					}
				}
			};
			const result = filterEntityForPlayer(npcEntity, npcTypeDef, config);
			expect(result).not.toBeNull();
			expect(result!.fields).toHaveProperty('alignment');
			expect(result!.fields).not.toHaveProperty('occupation');
			expect(result!.fields).not.toHaveProperty('secret_motivation');
		});

		it('should force-show hidden field when config sets it to true', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						secret_motivation: true
					}
				}
			};
			const result = filterEntityForPlayer(npcEntity, npcTypeDef, config);
			expect(result).not.toBeNull();
			expect(result!.fields).toHaveProperty('secret_motivation', 'Actually a spy');
		});

		it('should use backward-compatible behavior when config is undefined', () => {
			const result = filterEntityForPlayer(npcEntity, npcTypeDef, undefined);
			expect(result).not.toBeNull();
			expect(result!.fields).toHaveProperty('alignment');
			expect(result!.fields).toHaveProperty('occupation');
			expect(result!.fields).not.toHaveProperty('secret_motivation');
		});

		it('should use backward-compatible behavior when config is omitted', () => {
			// Calling without the third argument at all
			const result = filterEntityForPlayer(npcEntity, npcTypeDef);
			expect(result).not.toBeNull();
			expect(result!.fields).toHaveProperty('alignment');
			expect(result!.fields).toHaveProperty('occupation');
			expect(result!.fields).not.toHaveProperty('secret_motivation');
		});

		it('should still return null for invisible entities even with config', () => {
			const hiddenEntity: BaseEntity = { ...npcEntity, playerVisible: false };
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: { alignment: true }
				}
			};
			const result = filterEntityForPlayer(hiddenEntity, npcTypeDef, config);
			expect(result).toBeNull();
		});
	});

	describe('filterEntityForPlayer with per-entity overrides', () => {
		let npcEntity: BaseEntity;
		let npcTypeDef: EntityTypeDefinition;

		beforeEach(() => {
			npcEntity = {
				id: 'npc-1',
				type: 'npc',
				name: 'Test NPC',
				description: 'A test NPC',
				tags: [],
				fields: {
					alignment: 'neutral good',
					occupation: 'shopkeeper',
					secret_motivation: 'Actually a spy'
				},
				links: [],
				notes: 'DM notes',
				playerVisible: true,
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-10'),
				metadata: {}
			};

			npcTypeDef = {
				type: 'npc',
				label: 'NPC',
				labelPlural: 'NPCs',
				icon: 'users',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'alignment',
						label: 'Alignment',
						type: 'text',
						required: false,
						section: 'public',
						order: 1
					},
					{
						key: 'occupation',
						label: 'Occupation',
						type: 'text',
						required: false,
						section: 'public',
						order: 2
					},
					{
						key: 'secret_motivation',
						label: 'Secret Motivation',
						type: 'textarea',
						required: false,
						section: 'hidden',
						order: 3
					}
				],
				defaultRelationships: []
			};
		});

		it('should respect per-entity override to hide a public field', () => {
			const entityWithOverrides: BaseEntity = {
				...npcEntity,
				metadata: {
					[PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: {
						alignment: false // hide alignment for this specific entity
					}
				}
			};
			const result = filterEntityForPlayer(entityWithOverrides, npcTypeDef);
			expect(result).not.toBeNull();
			expect(result!.fields).not.toHaveProperty('alignment');
			expect(result!.fields).toHaveProperty('occupation');
		});

		it('should respect per-entity override to show a hidden field', () => {
			const entityWithOverrides: BaseEntity = {
				...npcEntity,
				metadata: {
					[PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: {
						secret_motivation: true // show hidden field for this entity only
					}
				}
			};
			const result = filterEntityForPlayer(entityWithOverrides, npcTypeDef);
			expect(result).not.toBeNull();
			expect(result!.fields).toHaveProperty('secret_motivation', 'Actually a spy');
		});

		it('should have per-entity override take priority over category config', () => {
			const entityWithOverrides: BaseEntity = {
				...npcEntity,
				metadata: {
					[PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: {
						occupation: true // entity says show
					}
				}
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						occupation: false // category config says hide
					}
				}
			};
			const result = filterEntityForPlayer(entityWithOverrides, npcTypeDef, config);
			expect(result).not.toBeNull();
			// Per-entity override wins over category config
			expect(result!.fields).toHaveProperty('occupation', 'shopkeeper');
		});

		it('should have per-entity override take priority to hide over category config show', () => {
			const entityWithOverrides: BaseEntity = {
				...npcEntity,
				metadata: {
					[PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: {
						secret_motivation: false // entity says hide
					}
				}
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						secret_motivation: true // category config says show
					}
				}
			};
			const result = filterEntityForPlayer(entityWithOverrides, npcTypeDef, config);
			expect(result).not.toBeNull();
			// Per-entity override wins
			expect(result!.fields).not.toHaveProperty('secret_motivation');
		});
	});

	describe('filterEntitiesForPlayer with PlayerExportFieldConfig', () => {
		let testEntities: BaseEntity[];
		let typeDefinitions: EntityTypeDefinition[];

		beforeEach(() => {
			testEntities = [
				{
					id: 'npc-1',
					type: 'npc',
					name: 'NPC One',
					description: 'First NPC',
					tags: [],
					fields: {
						alignment: 'good',
						secret_motivation: 'spy'
					},
					links: [],
					notes: 'DM notes',
					playerVisible: true,
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-10'),
					metadata: {}
				},
				{
					id: 'npc-2',
					type: 'npc',
					name: 'NPC Two',
					description: 'Second NPC',
					tags: [],
					fields: {
						alignment: 'evil',
						secret_motivation: 'power'
					},
					links: [],
					notes: 'More DM notes',
					playerVisible: true,
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-10'),
					metadata: {}
				}
			];

			typeDefinitions = [
				{
					type: 'npc',
					label: 'NPC',
					labelPlural: 'NPCs',
					icon: 'users',
					color: 'blue',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'alignment',
							label: 'Alignment',
							type: 'text',
							required: false,
							section: 'public',
							order: 1
						},
						{
							key: 'secret_motivation',
							label: 'Secret Motivation',
							type: 'textarea',
							required: false,
							section: 'hidden',
							order: 2
						}
					],
					defaultRelationships: []
				}
			];
		});

		it('should pass config to all entities during bulk filtering', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						secret_motivation: true // show hidden field for all NPCs
					}
				}
			};
			const result = filterEntitiesForPlayer(testEntities, typeDefinitions, config);
			expect(result).toHaveLength(2);
			expect(result[0].fields).toHaveProperty('secret_motivation', 'spy');
			expect(result[1].fields).toHaveProperty('secret_motivation', 'power');
		});

		it('should behave identically to old behavior when config is undefined', () => {
			const result = filterEntitiesForPlayer(testEntities, typeDefinitions, undefined);
			expect(result).toHaveLength(2);
			expect(result[0].fields).not.toHaveProperty('secret_motivation');
			expect(result[1].fields).not.toHaveProperty('secret_motivation');
			expect(result[0].fields).toHaveProperty('alignment');
			expect(result[1].fields).toHaveProperty('alignment');
		});

		it('should behave identically to old behavior when config is omitted', () => {
			const result = filterEntitiesForPlayer(testEntities, typeDefinitions);
			expect(result).toHaveLength(2);
			expect(result[0].fields).not.toHaveProperty('secret_motivation');
			expect(result[1].fields).not.toHaveProperty('secret_motivation');
		});

		it('should handle per-entity overrides in bulk filtering', () => {
			// Give npc-1 a per-entity override to show secret_motivation
			testEntities[0].metadata = {
				[PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: {
					secret_motivation: true
				}
			};
			const result = filterEntitiesForPlayer(testEntities, typeDefinitions);
			expect(result).toHaveLength(2);
			// npc-1 has per-entity override -> shows secret_motivation
			expect(result[0].fields).toHaveProperty('secret_motivation', 'spy');
			// npc-2 has no override -> hidden by default
			expect(result[1].fields).not.toHaveProperty('secret_motivation');
		});

		it('should combine config and per-entity overrides correctly', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						alignment: false // hide alignment for all NPCs via config
					}
				}
			};
			// npc-2 overrides: show alignment despite category config
			testEntities[1].metadata = {
				[PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: {
					alignment: true
				}
			};
			const result = filterEntitiesForPlayer(testEntities, typeDefinitions, config);
			expect(result).toHaveLength(2);
			// npc-1: alignment hidden by config
			expect(result[0].fields).not.toHaveProperty('alignment');
			// npc-2: alignment shown by per-entity override (overrides config)
			expect(result[1].fields).toHaveProperty('alignment', 'evil');
		});
	});

	// =====================================================================
	// Issue #520: Category-level entity visibility via categoryVisibility
	// =====================================================================
	describe('isEntityPlayerVisible with categoryVisibility', () => {
		it('should return false when categoryVisibility sets entity type to false', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: false
				}
			};
			const entity: BaseEntity = {
				...baseEntity,
				type: 'npc',
				playerVisible: undefined
			};
			const result = isEntityPlayerVisible(entity, config);
			expect(result).toBe(false);
		});

		it('should return true when categoryVisibility sets entity type to true', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: true
				}
			};
			const entity: BaseEntity = {
				...baseEntity,
				type: 'npc',
				playerVisible: undefined
			};
			const result = isEntityPlayerVisible(entity, config);
			expect(result).toBe(true);
		});

		it('should return true when categoryVisibility is undefined (default visible)', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {}
				// categoryVisibility not defined
			};
			const entity: BaseEntity = {
				...baseEntity,
				type: 'npc',
				playerVisible: undefined
			};
			const result = isEntityPlayerVisible(entity, config);
			expect(result).toBe(true);
		});

		it('should return true when entity type not in categoryVisibility', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					location: false // different type
				}
			};
			const entity: BaseEntity = {
				...baseEntity,
				type: 'npc',
				playerVisible: undefined
			};
			const result = isEntityPlayerVisible(entity, config);
			expect(result).toBe(true);
		});

		it('should respect entity-level playerVisible: false even if category is visible', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: true // category says visible
				}
			};
			const entity: BaseEntity = {
				...baseEntity,
				type: 'npc',
				playerVisible: false // entity-level override
			};
			const result = isEntityPlayerVisible(entity, config);
			expect(result).toBe(false);
		});

		it('should respect entity-level playerVisible: true even if category is hidden', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: false // category says hidden
				}
			};
			const entity: BaseEntity = {
				...baseEntity,
				type: 'npc',
				playerVisible: true // entity-level override
			};
			const result = isEntityPlayerVisible(entity, config);
			expect(result).toBe(true);
		});

		it('should hide player_profile even if categoryVisibility sets it to true', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					player_profile: true // try to show
				}
			};
			const entity: BaseEntity = {
				...baseEntity,
				type: 'player_profile',
				playerVisible: undefined
			};
			const result = isEntityPlayerVisible(entity, config);
			expect(result).toBe(false); // hardcoded rule wins
		});

		it('should hide secret timeline_event even if categoryVisibility sets timeline_event to true', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					timeline_event: true // try to show all timeline events
				}
			};
			const entity: BaseEntity = {
				...baseEntity,
				type: 'timeline_event',
				fields: { knownBy: 'secret' },
				playerVisible: undefined
			};
			const result = isEntityPlayerVisible(entity, config);
			expect(result).toBe(false); // hardcoded knownBy rule wins
		});

		it('should show common_knowledge timeline_event when categoryVisibility not set', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {}
				// categoryVisibility not set
			};
			const entity: BaseEntity = {
				...baseEntity,
				type: 'timeline_event',
				fields: { knownBy: 'common_knowledge' },
				playerVisible: undefined
			};
			const result = isEntityPlayerVisible(entity, config);
			expect(result).toBe(true);
		});

		it('should hide timeline_event with knownBy: lost even with categoryVisibility: true', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					timeline_event: true
				}
			};
			const entity: BaseEntity = {
				...baseEntity,
				type: 'timeline_event',
				fields: { knownBy: 'lost' },
				playerVisible: undefined
			};
			const result = isEntityPlayerVisible(entity, config);
			expect(result).toBe(false);
		});

		it('should work without config parameter (backward compatibility)', () => {
			const entity: BaseEntity = {
				...baseEntity,
				type: 'npc',
				playerVisible: undefined
			};
			const result = isEntityPlayerVisible(entity);
			expect(result).toBe(true);
		});

		it('should work with undefined config (backward compatibility)', () => {
			const entity: BaseEntity = {
				...baseEntity,
				type: 'npc',
				playerVisible: undefined
			};
			const result = isEntityPlayerVisible(entity, undefined);
			expect(result).toBe(true);
		});

		it('should hide all entities of a hidden category', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: false
				}
			};
			const entities: BaseEntity[] = [
				{ ...baseEntity, id: 'npc-1', type: 'npc', playerVisible: undefined },
				{ ...baseEntity, id: 'npc-2', type: 'npc', playerVisible: undefined },
				{ ...baseEntity, id: 'loc-1', type: 'location', playerVisible: undefined }
			];
			const result = entities.map((e) => isEntityPlayerVisible(e, config));
			expect(result).toEqual([false, false, true]);
		});
	});

	describe('filterEntitiesForPlayer with categoryVisibility', () => {
		let testEntities: BaseEntity[];
		let typeDefinitions: EntityTypeDefinition[];

		beforeEach(() => {
			testEntities = [
				{
					id: 'npc-1',
					type: 'npc',
					name: 'NPC One',
					description: 'First NPC',
					tags: [],
					fields: { alignment: 'good' },
					links: [],
					notes: 'DM notes',
					playerVisible: undefined,
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-10'),
					metadata: {}
				},
				{
					id: 'npc-2',
					type: 'npc',
					name: 'NPC Two',
					description: 'Second NPC',
					tags: [],
					fields: { alignment: 'evil' },
					links: [],
					notes: 'More notes',
					playerVisible: undefined,
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-10'),
					metadata: {}
				},
				{
					id: 'loc-1',
					type: 'location',
					name: 'Location One',
					description: 'A location',
					tags: [],
					fields: { population: 1000 },
					links: [],
					notes: 'Location notes',
					playerVisible: undefined,
					createdAt: new Date('2025-01-01'),
					updatedAt: new Date('2025-01-10'),
					metadata: {}
				}
			];

			typeDefinitions = [
				{
					type: 'npc',
					label: 'NPC',
					labelPlural: 'NPCs',
					icon: 'users',
					color: 'blue',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'alignment',
							label: 'Alignment',
							type: 'text',
							required: false,
							section: 'public',
							order: 1
						}
					],
					defaultRelationships: []
				},
				{
					type: 'location',
					label: 'Location',
					labelPlural: 'Locations',
					icon: 'map-pin',
					color: 'green',
					isBuiltIn: true,
					fieldDefinitions: [
						{
							key: 'population',
							label: 'Population',
							type: 'number',
							required: false,
							section: 'public',
							order: 1
						}
					],
					defaultRelationships: []
				}
			];
		});

		it('should exclude all entities of a hidden category', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: false // hide all NPCs
				}
			};
			const result = filterEntitiesForPlayer(testEntities, typeDefinitions, config);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('loc-1');
		});

		it('should include all entities of a visible category', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: true,
					location: true
				}
			};
			const result = filterEntitiesForPlayer(testEntities, typeDefinitions, config);
			expect(result).toHaveLength(3);
		});

		it('should combine category hiding with entity-level hiding', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: true // category says visible
				}
			};
			// But npc-1 has entity-level playerVisible: false
			testEntities[0].playerVisible = false;

			const result = filterEntitiesForPlayer(testEntities, typeDefinitions, config);
			expect(result).toHaveLength(2); // npc-2 and loc-1
			expect(result.map((e) => e.id)).toContain('npc-2');
			expect(result.map((e) => e.id)).toContain('loc-1');
			expect(result.map((e) => e.id)).not.toContain('npc-1');
		});

		it('should allow entity-level playerVisible: true to override hidden category', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: false // hide all NPCs by category
				}
			};
			// But npc-1 has entity-level override
			testEntities[0].playerVisible = true;

			const result = filterEntitiesForPlayer(testEntities, typeDefinitions, config);
			expect(result).toHaveLength(2); // npc-1 (override) and loc-1
			expect(result.map((e) => e.id)).toContain('npc-1');
			expect(result.map((e) => e.id)).toContain('loc-1');
			expect(result.map((e) => e.id)).not.toContain('npc-2');
		});

		it('should hide multiple categories', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: false,
					location: false
				}
			};
			const result = filterEntitiesForPlayer(testEntities, typeDefinitions, config);
			expect(result).toEqual([]);
		});

		it('should work with mixed category settings', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					npc: false,
					location: true
				}
			};
			const result = filterEntitiesForPlayer(testEntities, typeDefinitions, config);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('loc-1');
		});

		it('should default to visible when category not in categoryVisibility', () => {
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {},
				categoryVisibility: {
					faction: false // different type
				}
			};
			const result = filterEntitiesForPlayer(testEntities, typeDefinitions, config);
			expect(result).toHaveLength(3); // all visible by default
		});
	});

	// =====================================================================
	// Regression tests: ensure existing behavior unchanged with new signatures
	// =====================================================================
	describe('regression: backward compatibility with config parameter', () => {
		let baseEntity: BaseEntity;
		let entityTypeDefinition: EntityTypeDefinition;

		beforeEach(() => {
			baseEntity = {
				id: 'entity-1',
				type: 'npc',
				name: 'Test NPC',
				description: 'A test non-player character',
				summary: 'Brief summary',
				tags: ['friendly', 'merchant'],
				imageUrl: 'https://example.com/npc.png',
				fields: {
					alignment: 'neutral good',
					occupation: 'shopkeeper',
					secret_motivation: 'Actually a spy',
					notes: 'field-level notes'
				},
				links: [],
				notes: 'DM notes about this character',
				playerVisible: true,
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-10'),
				metadata: {}
			};

			entityTypeDefinition = {
				type: 'npc',
				label: 'NPC',
				labelPlural: 'NPCs',
				icon: 'users',
				color: 'blue',
				isBuiltIn: true,
				fieldDefinitions: [
					{
						key: 'alignment',
						label: 'Alignment',
						type: 'text',
						required: false,
						section: 'public',
						order: 1
					},
					{
						key: 'occupation',
						label: 'Occupation',
						type: 'text',
						required: false,
						section: 'public',
						order: 2
					},
					{
						key: 'secret_motivation',
						label: 'Secret Motivation',
						type: 'textarea',
						required: false,
						section: 'hidden',
						order: 3
					}
				],
				defaultRelationships: []
			};
		});

		it('filterFieldsForPlayer with old 3-arg call still works', () => {
			// The old 3-argument call must still work for backward compatibility
			const result = filterFieldsForPlayer(
				baseEntity.fields,
				['secret_motivation'],
				false
			);
			expect(result).toHaveProperty('alignment');
			expect(result).toHaveProperty('occupation');
			expect(result).not.toHaveProperty('secret_motivation');
			expect(result).not.toHaveProperty('notes');
		});

		it('filterEntityForPlayer without config still filters correctly', () => {
			const result = filterEntityForPlayer(baseEntity, entityTypeDefinition);
			expect(result).not.toBeNull();
			expect(result!.fields).toHaveProperty('alignment');
			expect(result!.fields).toHaveProperty('occupation');
			expect(result!.fields).not.toHaveProperty('secret_motivation');
		});

		it('filterEntitiesForPlayer without config still filters correctly', () => {
			const entities = [baseEntity];
			const typeDefs = [entityTypeDefinition];
			const result = filterEntitiesForPlayer(entities, typeDefs);
			expect(result).toHaveLength(1);
			expect(result[0].fields).toHaveProperty('alignment');
			expect(result[0].fields).not.toHaveProperty('secret_motivation');
		});

		it('session preparation still hidden without config', () => {
			const sessionEntity: BaseEntity = {
				...baseEntity,
				type: 'session',
				fields: {
					date: '2025-01-15',
					preparation: 'DM prep',
					summary: 'Session summary'
				}
			};
			const sessionTypeDef: EntityTypeDefinition = {
				...entityTypeDefinition,
				type: 'session',
				fieldDefinitions: [
					{ key: 'date', label: 'Date', type: 'date', required: false, order: 1 },
					{ key: 'preparation', label: 'Prep', type: 'textarea', required: false, order: 2 },
					{ key: 'summary', label: 'Summary', type: 'textarea', required: false, order: 3 }
				]
			};
			const result = filterEntityForPlayer(sessionEntity, sessionTypeDef);
			expect(result).not.toBeNull();
			expect(result!.fields).not.toHaveProperty('preparation');
			expect(result!.fields).toHaveProperty('date');
			expect(result!.fields).toHaveProperty('summary');
		});

		it('notes field in fields object still hidden without config', () => {
			const result = filterFieldsForPlayer(
				{ name: 'Test', notes: 'secret' },
				[],
				false
			);
			expect(result).not.toHaveProperty('notes');
			expect(result).toHaveProperty('name');
		});
	});

	// -----------------------------------------------------------------------
	// GitHub Issue #522: Core field visibility in filterEntityForPlayer
	// -----------------------------------------------------------------------
	describe('Core field visibility in filterEntityForPlayer', () => {
		it('description is empty string when __core_description is hidden via per-category config', () => {
			const entity: BaseEntity = {
				...baseEntity,
				description: 'Full character backstory'
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: { __core_description: false }
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.description).toBe('');
		});

		it('tags is empty array when __core_tags is hidden', () => {
			const entity: BaseEntity = {
				...baseEntity,
				tags: ['friendly', 'merchant', 'quest-giver']
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: { __core_tags: false }
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.tags).toEqual([]);
		});

		it('summary is omitted when __core_summary is hidden', () => {
			const entity: BaseEntity = {
				...baseEntity,
				summary: 'A brief character summary'
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: { __core_summary: false }
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.summary).toBeUndefined();
		});

		it('imageUrl is omitted when __core_imageUrl is hidden', () => {
			const entity: BaseEntity = {
				...baseEntity,
				imageUrl: 'https://example.com/image.png'
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: { __core_imageUrl: false }
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.imageUrl).toBeUndefined();
		});

		it('links is empty array when __core_relationships is hidden', () => {
			const entity: BaseEntity = {
				...baseEntity,
				links: [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						playerVisible: true
					}
				]
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: { __core_relationships: false }
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.links).toEqual([]);
		});

		it('createdAt is undefined when __core_createdAt is hidden', () => {
			const entity: BaseEntity = {
				...baseEntity,
				createdAt: new Date('2025-01-01T00:00:00Z')
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: { __core_createdAt: false }
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.createdAt).toBeUndefined();
		});

		it('updatedAt is undefined when __core_updatedAt is hidden', () => {
			const entity: BaseEntity = {
				...baseEntity,
				updatedAt: new Date('2025-01-10T12:30:00Z')
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: { __core_updatedAt: false }
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.updatedAt).toBeUndefined();
		});

		it('all core fields visible by default (no config, backward compat)', () => {
			const entity: BaseEntity = {
				...baseEntity,
				description: 'Description text',
				summary: 'Summary text',
				tags: ['tag1', 'tag2'],
				imageUrl: 'https://example.com/image.png',
				links: [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false,
						playerVisible: true
					}
				],
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-10')
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, undefined);
			expect(result).not.toBeNull();
			expect(result!.description).toBe('Description text');
			expect(result!.summary).toBe('Summary text');
			expect(result!.tags).toEqual(['tag1', 'tag2']);
			expect(result!.imageUrl).toBe('https://example.com/image.png');
			expect(result!.links).toHaveLength(1);
			expect(result!.createdAt).toEqual(new Date('2025-01-01'));
			expect(result!.updatedAt).toEqual(new Date('2025-01-10'));
		});

		it('per-entity override hides description (via entity.metadata.playerExportFieldOverrides)', () => {
			const entity: BaseEntity = {
				...baseEntity,
				description: 'Secret description',
				metadata: {
					[PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: {
						__core_description: false
					}
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, undefined);
			expect(result).not.toBeNull();
			expect(result!.description).toBe('');
		});

		it('multiple core fields hidden simultaneously', () => {
			const entity: BaseEntity = {
				...baseEntity,
				description: 'Description',
				summary: 'Summary',
				tags: ['tag1'],
				imageUrl: 'https://example.com/image.png',
				links: [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false
					}
				],
				createdAt: new Date('2025-01-01'),
				updatedAt: new Date('2025-01-10')
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						__core_description: false,
						__core_tags: false,
						__core_relationships: false,
						__core_createdAt: false
					}
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.description).toBe('');
			expect(result!.tags).toEqual([]);
			expect(result!.links).toEqual([]);
			expect(result!.createdAt).toBeUndefined();
			// These should still be visible
			expect(result!.summary).toBe('Summary');
			expect(result!.imageUrl).toBe('https://example.com/image.png');
			expect(result!.updatedAt).toEqual(new Date('2025-01-10'));
		});

		it('relationship section hidden does NOT affect custom field filtering', () => {
			const entity: BaseEntity = {
				...baseEntity,
				fields: {
					alignment: 'neutral good',
					occupation: 'shopkeeper',
					secret_motivation: 'Actually a spy'
				},
				links: [
					{
						id: 'link-1',
						targetId: 'target-1',
						targetType: 'faction',
						relationship: 'member_of',
						bidirectional: false
					}
				]
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						__core_relationships: false
					}
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.links).toEqual([]);
			// Custom fields should still be filtered normally
			expect(result!.fields).toHaveProperty('alignment');
			expect(result!.fields).toHaveProperty('occupation');
			expect(result!.fields).not.toHaveProperty('secret_motivation');
		});

		it('per-entity override can show description even when category hides it', () => {
			const entity: BaseEntity = {
				...baseEntity,
				description: 'Important description',
				metadata: {
					[PLAYER_EXPORT_FIELD_OVERRIDES_KEY]: {
						__core_description: true
					}
				}
			};
			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						__core_description: false
					}
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.description).toBe('Important description');
		});

		it('entity without optional summary/imageUrl fields works correctly when hidden', () => {
			const entity: BaseEntity = {
				...baseEntity
			};
			delete entity.summary;
			delete entity.imageUrl;

			const config: PlayerExportFieldConfig = {
				fieldVisibility: {
					npc: {
						__core_summary: false,
						__core_imageUrl: false
					}
				}
			};
			const result = filterEntityForPlayer(entity, entityTypeDefinition, config);
			expect(result).not.toBeNull();
			expect(result!.summary).toBeUndefined();
			expect(result!.imageUrl).toBeUndefined();
			expect(result!.description).toBe(baseEntity.description);
		});
	});
});
