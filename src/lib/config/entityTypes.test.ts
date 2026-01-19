import { describe, it, expect } from 'vitest';
import {
	getEntityTypeDefinitionWithSystem,
	applySystemModifications,
	type SystemProfile
} from './entityTypes';
import type { EntityTypeDefinition, FieldDefinition } from '$lib/types';

/**
 * Test Strategy: Entity Type Resolution with System Awareness
 *
 * RED Phase (TDD): These tests define the expected behavior of system-aware
 * entity type resolution. Tests will FAIL until the enhanced entityTypes.ts
 * functions are implemented.
 *
 * The system-aware architecture allows entity types to be modified based on
 * the active game system (Draw Steel, D&D 5e, etc.). This includes:
 * - Adding system-specific fields
 * - Hiding irrelevant fields
 * - Overriding field options (e.g., encounter types)
 * - Preserving field order
 *
 * Key Test Scenarios:
 * 1. Entity types work without system (backwards compatibility)
 * 2. System profiles add additional fields to entity types
 * 3. Field option overrides work correctly
 * 4. Hidden fields are properly filtered
 * 5. Field order is preserved after modifications
 * 6. Multiple modifications can be applied correctly
 */

describe('entityTypes.ts - System-Aware Entity Type Resolution', () => {
	// Mock base entity type definitions
	const mockCharacterType: EntityTypeDefinition = {
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
			}
		],
		defaultRelationships: ['knows', 'allied_with']
	};

	const mockNPCType: EntityTypeDefinition = {
		type: 'npc',
		label: 'NPC',
		labelPlural: 'NPCs',
		icon: 'users',
		color: 'npc',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'role',
				label: 'Role/Occupation',
				type: 'text',
				required: false,
				order: 1
			},
			{
				key: 'personality',
				label: 'Personality',
				type: 'richtext',
				required: false,
				order: 2
			}
		],
		defaultRelationships: ['located_at', 'serves']
	};

	const mockEncounterType: EntityTypeDefinition = {
		type: 'encounter',
		label: 'Encounter',
		labelPlural: 'Encounters',
		icon: 'swords',
		color: 'encounter',
		isBuiltIn: true,
		fieldDefinitions: [
			{
				key: 'encounterType',
				label: 'Type',
				type: 'select',
				options: ['combat', 'social', 'exploration', 'puzzle', 'trap', 'event'],
				required: false,
				order: 1
			},
			{
				key: 'difficulty',
				label: 'Difficulty',
				type: 'select',
				options: ['trivial', 'easy', 'moderate', 'hard', 'deadly'],
				required: false,
				order: 2
			}
		],
		defaultRelationships: ['located_at', 'involves']
	};

	// Mock Draw Steel system profile
	const mockDrawSteelProfile: SystemProfile = {
		id: 'draw-steel',
		name: 'Draw Steel',
		entityTypeModifications: {
			character: {
				additionalFields: [
					{
						key: 'ancestry',
						label: 'Ancestry',
						type: 'text',
						required: false,
						order: 10
					},
					{
						key: 'class',
						label: 'Class',
						type: 'text',
						required: false,
						order: 11
					},
					{
						key: 'kit',
						label: 'Kit',
						type: 'text',
						required: false,
						order: 12
					},
					{
						key: 'heroicResource',
						label: 'Heroic Resource',
						type: 'richtext',
						required: false,
						order: 13
					}
				]
			},
			npc: {
				additionalFields: [
					{
						key: 'threatLevel',
						label: 'Threat Level',
						type: 'select',
						options: ['minion', 'standard', 'boss'],
						required: false,
						order: 10
					},
					{
						key: 'role',
						label: 'Combat Role',
						type: 'select',
						options: ['ambusher', 'artillery', 'brute', 'defender', 'harrier', 'hexer', 'leader', 'support'],
						required: false,
						order: 11
					}
				]
			},
			encounter: {
				additionalFields: [
					{
						key: 'victoryPoints',
						label: 'Victory Points',
						type: 'number',
						required: false,
						order: 10
					},
					{
						key: 'negotiationDC',
						label: 'Negotiation DC',
						type: 'number',
						required: false,
						order: 11
					}
				],
				fieldOptionOverrides: {
					encounterType: ['combat', 'negotiation', 'montage']
				}
			}
		},
		terminology: {
			gm: 'Director'
		}
	};

	describe('getEntityTypeDefinitionWithSystem()', () => {
		describe('Without System Profile (Backwards Compatibility)', () => {
			it('should return base definition when no system provided', () => {
				const result = getEntityTypeDefinitionWithSystem('character', mockCharacterType);

				expect(result).toBeDefined();
				expect(result.type).toBe('character');
				expect(result.fieldDefinitions.length).toBe(3);
			});

			it('should return base definition when system is null', () => {
				const result = getEntityTypeDefinitionWithSystem('character', mockCharacterType, null as any);

				expect(result).toBeDefined();
				expect(result.type).toBe('character');
				expect(result.fieldDefinitions.length).toBe(3);
			});

			it('should return base definition when system is undefined', () => {
				const result = getEntityTypeDefinitionWithSystem('character', mockCharacterType, undefined);

				expect(result).toBeDefined();
				expect(result.type).toBe('character');
				expect(result.fieldDefinitions.length).toBe(3);
			});

			it('should preserve original field order without system', () => {
				const result = getEntityTypeDefinitionWithSystem('character', mockCharacterType);

				expect(result.fieldDefinitions[0].key).toBe('playerName');
				expect(result.fieldDefinitions[1].key).toBe('concept');
				expect(result.fieldDefinitions[2].key).toBe('background');
			});
		});

		describe('With Draw Steel System Profile', () => {
			describe('Character Entity Type', () => {
				it('should add Draw Steel character fields', () => {
					const result = getEntityTypeDefinitionWithSystem(
						'character',
						mockCharacterType,
						mockDrawSteelProfile
					);

					expect(result.fieldDefinitions.length).toBe(7); // 3 base + 4 Draw Steel

					const fieldKeys = result.fieldDefinitions.map((f) => f.key);
					expect(fieldKeys).toContain('ancestry');
					expect(fieldKeys).toContain('class');
					expect(fieldKeys).toContain('kit');
					expect(fieldKeys).toContain('heroicResource');
				});

				it('should preserve base character fields', () => {
					const result = getEntityTypeDefinitionWithSystem(
						'character',
						mockCharacterType,
						mockDrawSteelProfile
					);

					const fieldKeys = result.fieldDefinitions.map((f) => f.key);
					expect(fieldKeys).toContain('playerName');
					expect(fieldKeys).toContain('concept');
					expect(fieldKeys).toContain('background');
				});

				it('should maintain field order (base fields first, then system fields)', () => {
					const result = getEntityTypeDefinitionWithSystem(
						'character',
						mockCharacterType,
						mockDrawSteelProfile
					);

					// Base fields should come first
					expect(result.fieldDefinitions[0].key).toBe('playerName');
					expect(result.fieldDefinitions[1].key).toBe('concept');
					expect(result.fieldDefinitions[2].key).toBe('background');

					// System fields should come after
					const systemFieldKeys = result.fieldDefinitions.slice(3).map((f) => f.key);
					expect(systemFieldKeys).toContain('ancestry');
					expect(systemFieldKeys).toContain('class');
				});
			});

			describe('NPC Entity Type', () => {
				it('should add Draw Steel NPC fields', () => {
					const result = getEntityTypeDefinitionWithSystem('npc', mockNPCType, mockDrawSteelProfile);

					expect(result.fieldDefinitions.length).toBe(3); // 2 base, but 'role' is replaced by Draw Steel 'role'

					const fieldKeys = result.fieldDefinitions.map((f) => f.key);
					expect(fieldKeys).toContain('threatLevel');
					expect(fieldKeys).toContain('role');
				});

				it('should preserve threatLevel field options', () => {
					const result = getEntityTypeDefinitionWithSystem('npc', mockNPCType, mockDrawSteelProfile);

					const threatLevelField = result.fieldDefinitions.find((f) => f.key === 'threatLevel');
					expect(threatLevelField?.options).toEqual(['minion', 'standard', 'boss']);
				});

				it('should preserve combat role field options', () => {
					const result = getEntityTypeDefinitionWithSystem('npc', mockNPCType, mockDrawSteelProfile);

					const roleField = result.fieldDefinitions.find((f) => f.key === 'role');
					expect(roleField?.options).toBeDefined();
					expect(roleField?.options).toContain('ambusher');
					expect(roleField?.options).toContain('brute');
				});
			});

			describe('Encounter Entity Type', () => {
				it('should add Draw Steel encounter fields', () => {
					const result = getEntityTypeDefinitionWithSystem(
						'encounter',
						mockEncounterType,
						mockDrawSteelProfile
					);

					const fieldKeys = result.fieldDefinitions.map((f) => f.key);
					expect(fieldKeys).toContain('victoryPoints');
					expect(fieldKeys).toContain('negotiationDC');
				});

				it('should override encounterType field options with Draw Steel types', () => {
					const result = getEntityTypeDefinitionWithSystem(
						'encounter',
						mockEncounterType,
						mockDrawSteelProfile
					);

					const encounterTypeField = result.fieldDefinitions.find((f) => f.key === 'encounterType');
					expect(encounterTypeField?.options).toEqual(['combat', 'negotiation', 'montage']);
				});

				it('should preserve other field options that are not overridden', () => {
					const result = getEntityTypeDefinitionWithSystem(
						'encounter',
						mockEncounterType,
						mockDrawSteelProfile
					);

					const difficultyField = result.fieldDefinitions.find((f) => f.key === 'difficulty');
					expect(difficultyField?.options).toEqual(['trivial', 'easy', 'moderate', 'hard', 'deadly']);
				});

				it('should have victoryPoints as number type', () => {
					const result = getEntityTypeDefinitionWithSystem(
						'encounter',
						mockEncounterType,
						mockDrawSteelProfile
					);

					const victoryPointsField = result.fieldDefinitions.find((f) => f.key === 'victoryPoints');
					expect(victoryPointsField?.type).toBe('number');
				});
			});

			describe('Entity Type Without Modifications', () => {
				it('should return base definition if entity type has no modifications in system', () => {
					const mockLocationTypeDefinition: EntityTypeDefinition = {
						type: 'location',
						label: 'Location',
						labelPlural: 'Locations',
						icon: 'map-pin',
						color: 'location',
						isBuiltIn: true,
						fieldDefinitions: [
							{
								key: 'locationType',
								label: 'Type',
								type: 'select',
								options: ['city', 'dungeon'],
								required: false,
								order: 1
							}
						],
						defaultRelationships: ['contains']
					};

					const result = getEntityTypeDefinitionWithSystem(
						'location',
						mockLocationTypeDefinition,
						mockDrawSteelProfile
					);

					expect(result.fieldDefinitions.length).toBe(1);
					expect(result.fieldDefinitions[0].key).toBe('locationType');
				});
			});
		});

		describe('System with Hidden Fields', () => {
			it('should hide fields specified in hiddenFields array', () => {
				const systemWithHiddenFields: SystemProfile = {
					id: 'minimal-system',
					name: 'Minimal System',
					entityTypeModifications: {
						character: {
							hiddenFields: ['background']
						}
					},
					terminology: { gm: 'GM' }
				};

				const result = getEntityTypeDefinitionWithSystem(
					'character',
					mockCharacterType,
					systemWithHiddenFields
				);

				const fieldKeys = result.fieldDefinitions.map((f) => f.key);
				expect(fieldKeys).not.toContain('background');
				expect(fieldKeys).toContain('playerName');
				expect(fieldKeys).toContain('concept');
			});

			it('should hide multiple fields', () => {
				const systemWithMultipleHidden: SystemProfile = {
					id: 'minimal-system',
					name: 'Minimal System',
					entityTypeModifications: {
						character: {
							hiddenFields: ['concept', 'background']
						}
					},
					terminology: { gm: 'GM' }
				};

				const result = getEntityTypeDefinitionWithSystem(
					'character',
					mockCharacterType,
					systemWithMultipleHidden
				);

				expect(result.fieldDefinitions.length).toBe(1);
				expect(result.fieldDefinitions[0].key).toBe('playerName');
			});
		});

		describe('Immutability', () => {
			it('should not modify the original entity type definition', () => {
				const originalFieldCount = mockCharacterType.fieldDefinitions.length;

				getEntityTypeDefinitionWithSystem('character', mockCharacterType, mockDrawSteelProfile);

				expect(mockCharacterType.fieldDefinitions.length).toBe(originalFieldCount);
			});

			it('should not modify the original system profile', () => {
				const originalModifications = mockDrawSteelProfile.entityTypeModifications?.character;
				const originalFieldCount = originalModifications?.additionalFields?.length ?? 0;

				getEntityTypeDefinitionWithSystem('character', mockCharacterType, mockDrawSteelProfile);

				expect(originalModifications?.additionalFields?.length).toBe(originalFieldCount);
			});
		});
	});

	describe('applySystemModifications()', () => {
		describe('Adding Additional Fields', () => {
			it('should add fields from additionalFields array', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'name', label: 'Name', type: 'text', required: true, order: 1 }
				];

				const modifications = {
					additionalFields: [
						{ key: 'newField', label: 'New Field', type: 'text', required: false, order: 2 }
					]
				};

				const result = applySystemModifications(baseFields, modifications);

				expect(result.length).toBe(2);
				expect(result[1].key).toBe('newField');
			});

			it('should append additional fields after base fields', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'field1', label: 'Field 1', type: 'text', required: true, order: 1 },
					{ key: 'field2', label: 'Field 2', type: 'text', required: false, order: 2 }
				];

				const modifications = {
					additionalFields: [
						{ key: 'field3', label: 'Field 3', type: 'text', required: false, order: 3 }
					]
				};

				const result = applySystemModifications(baseFields, modifications);

				expect(result[0].key).toBe('field1');
				expect(result[1].key).toBe('field2');
				expect(result[2].key).toBe('field3');
			});
		});

		describe('Hiding Fields', () => {
			it('should remove fields specified in hiddenFields', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'field1', label: 'Field 1', type: 'text', required: true, order: 1 },
					{ key: 'field2', label: 'Field 2', type: 'text', required: false, order: 2 },
					{ key: 'field3', label: 'Field 3', type: 'text', required: false, order: 3 }
				];

				const modifications = {
					hiddenFields: ['field2']
				};

				const result = applySystemModifications(baseFields, modifications);

				expect(result.length).toBe(2);
				expect(result.find((f) => f.key === 'field2')).toBeUndefined();
			});

			it('should handle hiding non-existent fields gracefully', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'field1', label: 'Field 1', type: 'text', required: true, order: 1 }
				];

				const modifications = {
					hiddenFields: ['nonExistent']
				};

				const result = applySystemModifications(baseFields, modifications);

				expect(result.length).toBe(1);
				expect(result[0].key).toBe('field1');
			});
		});

		describe('Field Option Overrides', () => {
			it('should override field options when specified', () => {
				const baseFields: FieldDefinition[] = [
					{
						key: 'type',
						label: 'Type',
						type: 'select',
						options: ['option1', 'option2'],
						required: false,
						order: 1
					}
				];

				const modifications = {
					fieldOptionOverrides: {
						type: ['newOption1', 'newOption2']
					}
				};

				const result = applySystemModifications(baseFields, modifications);

				expect(result[0].options).toEqual(['newOption1', 'newOption2']);
			});

			it('should preserve field options when not overridden', () => {
				const baseFields: FieldDefinition[] = [
					{
						key: 'type',
						label: 'Type',
						type: 'select',
						options: ['option1', 'option2'],
						required: false,
						order: 1
					},
					{
						key: 'category',
						label: 'Category',
						type: 'select',
						options: ['cat1', 'cat2'],
						required: false,
						order: 2
					}
				];

				const modifications = {
					fieldOptionOverrides: {
						type: ['newOption1']
					}
				};

				const result = applySystemModifications(baseFields, modifications);

				expect(result[0].options).toEqual(['newOption1']);
				expect(result[1].options).toEqual(['cat1', 'cat2']);
			});

			it('should handle overrides for non-existent fields gracefully', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'field1', label: 'Field 1', type: 'text', required: true, order: 1 }
				];

				const modifications = {
					fieldOptionOverrides: {
						nonExistent: ['option1']
					}
				};

				const result = applySystemModifications(baseFields, modifications);

				expect(result.length).toBe(1);
				expect(result[0].key).toBe('field1');
			});
		});

		describe('Field Order Preservation', () => {
			it('should preserve order values after modifications', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'field1', label: 'Field 1', type: 'text', required: true, order: 1 },
					{ key: 'field2', label: 'Field 2', type: 'text', required: false, order: 2 }
				];

				const modifications = {
					additionalFields: [
						{ key: 'field3', label: 'Field 3', type: 'text', required: false, order: 3 }
					]
				};

				const result = applySystemModifications(baseFields, modifications);

				expect(result[0].order).toBe(1);
				expect(result[1].order).toBe(2);
				expect(result[2].order).toBe(3);
			});

			it('should sort fields by order value', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'field2', label: 'Field 2', type: 'text', required: false, order: 2 },
					{ key: 'field1', label: 'Field 1', type: 'text', required: true, order: 1 }
				];

				const result = applySystemModifications(baseFields, {});

				expect(result[0].key).toBe('field1');
				expect(result[1].key).toBe('field2');
			});
		});

		describe('Combined Modifications', () => {
			it('should apply all modifications together correctly', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'field1', label: 'Field 1', type: 'text', required: true, order: 1 },
					{ key: 'field2', label: 'Field 2', type: 'text', required: false, order: 2 },
					{
						key: 'type',
						label: 'Type',
						type: 'select',
						options: ['old1', 'old2'],
						required: false,
						order: 3
					}
				];

				const modifications = {
					additionalFields: [
						{ key: 'newField', label: 'New Field', type: 'text', required: false, order: 4 }
					],
					hiddenFields: ['field2'],
					fieldOptionOverrides: {
						type: ['new1', 'new2']
					}
				};

				const result = applySystemModifications(baseFields, modifications);

				// Should have 3 fields: field1, type (modified), newField
				expect(result.length).toBe(3);

				const fieldKeys = result.map((f) => f.key);
				expect(fieldKeys).toContain('field1');
				expect(fieldKeys).not.toContain('field2');
				expect(fieldKeys).toContain('type');
				expect(fieldKeys).toContain('newField');

				const typeField = result.find((f) => f.key === 'type');
				expect(typeField?.options).toEqual(['new1', 'new2']);
			});
		});

		describe('Empty Modifications', () => {
			it('should return base fields unchanged when modifications are empty', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'field1', label: 'Field 1', type: 'text', required: true, order: 1 }
				];

				const result = applySystemModifications(baseFields, {});

				expect(result.length).toBe(1);
				expect(result[0].key).toBe('field1');
			});

			it('should handle undefined modifications gracefully', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'field1', label: 'Field 1', type: 'text', required: true, order: 1 }
				];

				const result = applySystemModifications(baseFields, {} as any);

				expect(result.length).toBe(1);
			});
		});

		describe('Immutability', () => {
			it('should not modify the original fields array', () => {
				const baseFields: FieldDefinition[] = [
					{ key: 'field1', label: 'Field 1', type: 'text', required: true, order: 1 }
				];

				const originalLength = baseFields.length;
				const originalFirstField = { ...baseFields[0] };

				const modifications = {
					additionalFields: [
						{ key: 'field2', label: 'Field 2', type: 'text', required: false, order: 2 }
					]
				};

				applySystemModifications(baseFields, modifications);

				expect(baseFields.length).toBe(originalLength);
				expect(baseFields[0].key).toBe(originalFirstField.key);
			});
		});
	});
});
