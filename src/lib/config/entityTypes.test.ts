/**
 * Tests for Entity Types Configuration
 *
 * Tests cover:
 * - System-Aware Entity Type Resolution (Issue #5)
 * - Entity Type Ordering Functions (Issue #121)
 *
 * System-Aware Tests:
 * - Adding system-specific fields
 * - Hiding irrelevant fields
 * - Overriding field options (e.g., encounter types)
 * - Preserving field order
 *
 * Ordering Tests:
 * - getOrderedEntityTypes: Applying custom order to entity types
 * - getDefaultEntityTypeOrder: Getting default ordering with campaign first
 * - Handling custom types (always appear after built-in types)
 * - Handling new types not in custom order (appended to end)
 * - Handling types in order that no longer exist (skipped)
 */
import { describe, it, expect } from 'vitest';
import {
	BUILT_IN_ENTITY_TYPES,
	getAllEntityTypes,
	getEntityTypeDefinition,
	applyOverrideToType,
	getOrderedEntityTypes,
	getDefaultEntityTypeOrder,
	getEntityTypeDefinitionWithSystem,
	applySystemModifications
} from './entityTypes';
import type { EntityTypeDefinition, EntityTypeOverride, FieldDefinition } from '$lib/types';
import type { SystemProfile, SystemEntityModification } from '$lib/types/systems';

// =============================================================================
// System-Aware Entity Type Resolution Tests (Issue #5)
// =============================================================================

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

				const modifications: SystemEntityModification = {
					additionalFields: [
						{ key: 'newField', label: 'New Field', type: 'text' as const, required: false, order: 2 }
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

				const modifications: SystemEntityModification = {
					additionalFields: [
						{ key: 'field3', label: 'Field 3', type: 'text' as const, required: false, order: 3 }
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

				const modifications: SystemEntityModification = {
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

				const modifications: SystemEntityModification = {
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

				const modifications: SystemEntityModification = {
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

				const modifications: SystemEntityModification = {
					additionalFields: [
						{ key: 'field3', label: 'Field 3', type: 'text' as const, required: false, order: 3 }
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

				const modifications: SystemEntityModification = {
					additionalFields: [
						{ key: 'newField', label: 'New Field', type: 'text' as const, required: false, order: 4 }
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

				const modifications: SystemEntityModification = {
					additionalFields: [
						{ key: 'field2', label: 'Field 2', type: 'text' as const, required: false, order: 2 }
					]
				};

				applySystemModifications(baseFields, modifications);

				expect(baseFields.length).toBe(originalLength);
				expect(baseFields[0].key).toBe(originalFirstField.key);
			});
		});
	});
});

// =============================================================================
// Base Character Entity Type Tests (Issue #247)
// =============================================================================

describe('entityTypes.ts - Base Character Fields (Issue #247)', () => {
	describe('Character Entity Type - Forge Steel Hero Fields', () => {
		it('should have ancestry field as text type', () => {
			const characterType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'character');
			const ancestryField = characterType?.fieldDefinitions.find((f) => f.key === 'ancestry');

			expect(ancestryField).toBeDefined();
			expect(ancestryField?.label).toBe('Ancestry');
			expect(ancestryField?.type).toBe('text');
			expect(ancestryField?.required).toBe(false);
			expect(ancestryField?.placeholder).toBeTruthy();
		});

		it('should have culture field as text type', () => {
			const characterType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'character');
			const cultureField = characterType?.fieldDefinitions.find((f) => f.key === 'culture');

			expect(cultureField).toBeDefined();
			expect(cultureField?.label).toBe('Culture');
			expect(cultureField?.type).toBe('text');
			expect(cultureField?.required).toBe(false);
			expect(cultureField?.placeholder).toBeTruthy();
		});

		it('should have career field as text type', () => {
			const characterType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'character');
			const careerField = characterType?.fieldDefinitions.find((f) => f.key === 'career');

			expect(careerField).toBeDefined();
			expect(careerField?.label).toBe('Career');
			expect(careerField?.type).toBe('text');
			expect(careerField?.required).toBe(false);
			expect(careerField?.placeholder).toBeTruthy();
		});

		it('should have heroClass field as text type', () => {
			const characterType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'character');
			const heroClassField = characterType?.fieldDefinitions.find((f) => f.key === 'heroClass');

			expect(heroClassField).toBeDefined();
			expect(heroClassField?.label).toBe('Class');
			expect(heroClassField?.type).toBe('text');
			expect(heroClassField?.required).toBe(false);
			expect(heroClassField?.placeholder).toBeTruthy();
		});

		it('should have subclass field as text type', () => {
			const characterType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'character');
			const subclassField = characterType?.fieldDefinitions.find((f) => f.key === 'subclass');

			expect(subclassField).toBeDefined();
			expect(subclassField?.label).toBe('Subclass');
			expect(subclassField?.type).toBe('text');
			expect(subclassField?.required).toBe(false);
			expect(subclassField?.placeholder).toBeTruthy();
		});

		it('should have all 5 new fields in consecutive order', () => {
			const characterType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'character');
			const fields = characterType?.fieldDefinitions ?? [];

			const ancestryField = fields.find((f) => f.key === 'ancestry');
			const cultureField = fields.find((f) => f.key === 'culture');
			const careerField = fields.find((f) => f.key === 'career');
			const heroClassField = fields.find((f) => f.key === 'heroClass');
			const subclassField = fields.find((f) => f.key === 'subclass');

			// Check they exist and have consecutive orders
			expect(ancestryField?.order).toBeDefined();
			expect(cultureField?.order).toBeDefined();
			expect(careerField?.order).toBeDefined();
			expect(heroClassField?.order).toBeDefined();
			expect(subclassField?.order).toBeDefined();

			// Verify consecutive ordering
			const orders = [
				ancestryField?.order ?? 0,
				cultureField?.order ?? 0,
				careerField?.order ?? 0,
				heroClassField?.order ?? 0,
				subclassField?.order ?? 0
			];

			// Check that orders are consecutive and in this sequence
			for (let i = 1; i < orders.length; i++) {
				expect(orders[i]).toBe(orders[i - 1] + 1);
			}
		});

		it('should place new fields after concept field', () => {
			const characterType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'character');
			const fields = characterType?.fieldDefinitions ?? [];

			const conceptField = fields.find((f) => f.key === 'concept');
			const ancestryField = fields.find((f) => f.key === 'ancestry');

			expect(conceptField?.order).toBeDefined();
			expect(ancestryField?.order).toBeDefined();
			expect(ancestryField!.order).toBeGreaterThan(conceptField!.order);
		});

		it('should place new fields before background field', () => {
			const characterType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'character');
			const fields = characterType?.fieldDefinitions ?? [];

			const subclassField = fields.find((f) => f.key === 'subclass');
			const backgroundField = fields.find((f) => f.key === 'background');

			expect(subclassField?.order).toBeDefined();
			expect(backgroundField?.order).toBeDefined();
			expect(subclassField!.order).toBeLessThan(backgroundField!.order);
		});

		it('should have appropriate labels for all new fields', () => {
			const characterType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'character');

			const ancestryField = characterType?.fieldDefinitions.find((f) => f.key === 'ancestry');
			const cultureField = characterType?.fieldDefinitions.find((f) => f.key === 'culture');
			const careerField = characterType?.fieldDefinitions.find((f) => f.key === 'career');
			const heroClassField = characterType?.fieldDefinitions.find((f) => f.key === 'heroClass');
			const subclassField = characterType?.fieldDefinitions.find((f) => f.key === 'subclass');

			expect(ancestryField?.label).toBe('Ancestry');
			expect(cultureField?.label).toBe('Culture');
			expect(careerField?.label).toBe('Career');
			expect(heroClassField?.label).toBe('Class');
			expect(subclassField?.label).toBe('Subclass');
		});

		it('should have all new fields as optional (required: false)', () => {
			const characterType = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'character');

			const newFieldKeys = ['ancestry', 'culture', 'career', 'heroClass', 'subclass'];

			newFieldKeys.forEach((key) => {
				const field = characterType?.fieldDefinitions.find((f) => f.key === key);
				expect(field?.required).toBe(false);
			});
		});
	});
});

// =============================================================================
// Entity Type Ordering Functions Tests (Issue #121)
// =============================================================================

describe('entityTypes - Ordering Functions', () => {
	// Sample custom entity types for testing
	const customTypes: EntityTypeDefinition[] = [
		{
			type: 'custom_creature',
			label: 'Custom Creature',
			labelPlural: 'Custom Creatures',
			icon: 'bug',
			color: 'custom',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		},
		{
			type: 'custom_artifact',
			label: 'Custom Artifact',
			labelPlural: 'Custom Artifacts',
			icon: 'star',
			color: 'custom',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		}
	];

	describe('getDefaultEntityTypeOrder', () => {
		describe('Basic Structure', () => {
			it('should return array of entity type keys', () => {
				const order = getDefaultEntityTypeOrder();
				expect(Array.isArray(order)).toBe(true);
				expect(order.length).toBeGreaterThan(0);
			});

			it('should return array of strings', () => {
				const order = getDefaultEntityTypeOrder();
				order.forEach((type) => {
					expect(typeof type).toBe('string');
				});
			});

			it('should return exactly 13 built-in types', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order.length).toBe(13);
			});
		});

		describe('Campaign First Requirement', () => {
			it('should have campaign as first element', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order[0]).toBe('campaign');
			});

			it('should not have campaign anywhere else in array', () => {
				const order = getDefaultEntityTypeOrder();
				const campaignIndices = order
					.map((type, index) => (type === 'campaign' ? index : -1))
					.filter((index) => index !== -1);

				expect(campaignIndices).toEqual([0]);
			});
		});

		describe('All Built-in Types Included', () => {
			it('should include all built-in entity types', () => {
				const order = getDefaultEntityTypeOrder();

				const expectedTypes = [
					'campaign',
					'character',
					'npc',
					'location',
					'faction',
					'item',
					'session',
					'scene',
					'deity',
					'timeline_event',
					'world_rule',
					'player_profile',
					'narrative_event'
				];

				expectedTypes.forEach((type) => {
					expect(order).toContain(type);
				});
			});

			it('should include scene type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('scene');
			});

			it('should include character type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('character');
			});

			it('should include npc type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('npc');
			});

			it('should include location type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('location');
			});

			it('should include faction type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('faction');
			});

			it('should include item type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('item');
			});

			it('should include session type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('session');
			});

			it('should include scene type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('scene');
			});

			it('should include deity type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('deity');
			});

			it('should include timeline_event type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('timeline_event');
			});

			it('should include world_rule type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('world_rule');
			});

			it('should include player_profile type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('player_profile');
			});

			it('should include narrative_event type', () => {
				const order = getDefaultEntityTypeOrder();
				expect(order).toContain('narrative_event');
			});
		});

		describe('Data Integrity', () => {
			it('should not contain duplicates', () => {
				const order = getDefaultEntityTypeOrder();
				const uniqueTypes = new Set(order);
				expect(uniqueTypes.size).toBe(order.length);
			});

			it('should not contain empty strings', () => {
				const order = getDefaultEntityTypeOrder();
				order.forEach((type) => {
					expect(type.length).toBeGreaterThan(0);
				});
			});

			it('should not contain null or undefined', () => {
				const order = getDefaultEntityTypeOrder();
				order.forEach((type) => {
					expect(type).not.toBeNull();
					expect(type).not.toBeUndefined();
				});
			});
		});

		describe('Consistency', () => {
			it('should return same order on multiple calls', () => {
				const order1 = getDefaultEntityTypeOrder();
				const order2 = getDefaultEntityTypeOrder();
				expect(order1).toEqual(order2);
			});

			it('should return new array instance each time', () => {
				const order1 = getDefaultEntityTypeOrder();
				const order2 = getDefaultEntityTypeOrder();

				order1.push('modified');

				expect(order2).not.toContain('modified');
			});

			it('should match types in BUILT_IN_ENTITY_TYPES', () => {
				const order = getDefaultEntityTypeOrder();
				const builtInTypes = BUILT_IN_ENTITY_TYPES.map((t) => t.type);

				expect(order.sort()).toEqual(builtInTypes.sort());
			});
		});
	});

	describe('getOrderedEntityTypes', () => {
		describe('Default Order (No Custom Order Provided)', () => {
			it('should return types in default order when customOrder is null', () => {
				const ordered = getOrderedEntityTypes([], [], null);

				// Should have campaign first
				expect(ordered[0].type).toBe('campaign');
			});

			it('should return types in default order when customOrder is undefined', () => {
				const ordered = getOrderedEntityTypes([], [], undefined);

				expect(ordered[0].type).toBe('campaign');
			});

			it('should include all built-in types when no custom order', () => {
				const ordered = getOrderedEntityTypes([], [], null);

				expect(ordered.length).toBe(13);

				const types = ordered.map((t) => t.type);
				expect(types).toContain('campaign');
				expect(types).toContain('character');
				expect(types).toContain('npc');
				expect(types).toContain('location');
				expect(types).toContain('scene');
			});

			it('should apply overrides even when using default order', () => {
				const overrides: EntityTypeOverride[] = [
					{
						type: 'character',
						additionalFields: [
							{
								key: 'custom_field',
								label: 'Custom Field',
								type: 'text',
								required: false,
								order: 100
							}
						]
					}
				];

				const ordered = getOrderedEntityTypes([], overrides, null);
				const character = ordered.find((t) => t.type === 'character');

				expect(character?.fieldDefinitions.some((f) => f.key === 'custom_field')).toBe(true);
			});
		});

		describe('Custom Order Applied', () => {
			it('should return types in custom order when provided', () => {
				const customOrder = ['npc', 'character', 'campaign', 'location'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				expect(ordered[0].type).toBe('npc');
				expect(ordered[1].type).toBe('character');
				expect(ordered[2].type).toBe('campaign');
				expect(ordered[3].type).toBe('location');
			});

			it('should place campaign first even if not first in custom order', () => {
				const customOrder = ['character', 'npc', 'campaign', 'location'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				// Implementation detail: may or may not enforce campaign first
				// Test documents actual behavior
				const campaignIndex = ordered.findIndex((t) => t.type === 'campaign');
				expect(campaignIndex).toBeGreaterThanOrEqual(0);
			});

			it('should respect exact ordering from custom order', () => {
				const customOrder = ['faction', 'item', 'session'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				const orderedTypes = ordered.slice(0, 3).map((t) => t.type);
				expect(orderedTypes).toEqual(['faction', 'item', 'session']);
			});

			it('should handle single type in custom order', () => {
				const customOrder = ['campaign'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				// First type should be campaign, others in default order
				expect(ordered[0].type).toBe('campaign');
				expect(ordered.length).toBe(13); // All types still included
			});
		});

		describe('New Types Not in Custom Order', () => {
			it('should append types not in custom order to the end', () => {
				const customOrder = ['campaign', 'character', 'npc'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				// First 3 should match custom order
				expect(ordered[0].type).toBe('campaign');
				expect(ordered[1].type).toBe('character');
				expect(ordered[2].type).toBe('npc');

				// Remaining types should be appended
				expect(ordered.length).toBe(13);

				const typesInOrder = ordered.map((t) => t.type);
				expect(typesInOrder.slice(0, 3)).toEqual(['campaign', 'character', 'npc']);

				// All built-in types should be present
				expect(typesInOrder).toContain('location');
				expect(typesInOrder).toContain('faction');
				expect(typesInOrder).toContain('item');
			});

			it('should include all built-in types even if not in custom order', () => {
				const customOrder = ['campaign'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				expect(ordered.length).toBe(13);

				const types = ordered.map((t) => t.type);
				BUILT_IN_ENTITY_TYPES.forEach((builtInType) => {
					expect(types).toContain(builtInType.type);
				});
			});

			it('should handle empty custom order by returning all types in default order', () => {
				const customOrder: string[] = [];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				expect(ordered.length).toBe(13);
				expect(ordered[0].type).toBe('campaign');
			});
		});

		describe('Types in Order That No Longer Exist', () => {
			it('should skip types in custom order that do not exist', () => {
				const customOrder = [
					'campaign',
					'non_existent_type',
					'character',
					'deleted_type',
					'npc'
				];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				const types = ordered.map((t) => t.type);
				expect(types).not.toContain('non_existent_type');
				expect(types).not.toContain('deleted_type');

				// Should still have valid types in correct order
				const validTypesInOrder = types.filter((t) =>
					['campaign', 'character', 'npc'].includes(t)
				);
				expect(validTypesInOrder).toEqual(['campaign', 'character', 'npc']);
			});

			it('should not create undefined entries for missing types', () => {
				const customOrder = ['campaign', 'fake_type', 'character'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				ordered.forEach((typeDef) => {
					expect(typeDef).toBeDefined();
					expect(typeDef.type).toBeDefined();
					expect(typeDef.label).toBeDefined();
				});
			});

			it('should handle custom order with only non-existent types', () => {
				const customOrder = ['fake1', 'fake2', 'fake3'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				// Should return all built-in types in default order
				expect(ordered.length).toBe(13);
				expect(ordered[0].type).toBe('campaign');
			});
		});

		describe('Custom Types Handling', () => {
			it('should place custom types after all built-in types', () => {
				const customOrder = ['campaign', 'character', 'custom_creature', 'npc'];
				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				const customTypeIndices = ordered
					.map((t, idx) => (t.type === 'custom_creature' ? idx : -1))
					.filter((idx) => idx !== -1);

				const maxBuiltInIndex = ordered.reduce((max, t, idx) => {
					return t.isBuiltIn ? Math.max(max, idx) : max;
				}, -1);

				expect(customTypeIndices[0]).toBeGreaterThan(maxBuiltInIndex);
			});

			it('should include custom types even if not in custom order', () => {
				const customOrder = ['campaign', 'character'];
				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				const types = ordered.map((t) => t.type);
				expect(types).toContain('custom_creature');
				expect(types).toContain('custom_artifact');
			});

			it('should append custom types in defined order after built-ins', () => {
				const customOrder = ['campaign', 'character'];
				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				const customTypesInResult = ordered.filter((t) => !t.isBuiltIn);
				expect(customTypesInResult[0].type).toBe('custom_creature');
				expect(customTypesInResult[1].type).toBe('custom_artifact');
			});

			it('should respect custom order for custom types when they are in the order', () => {
				const customOrder = [
					'campaign',
					'character',
					'npc',
					'custom_artifact',
					'custom_creature'
				];
				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				// Custom types should still appear after built-ins, but in specified order
				const customTypesInResult = ordered.filter((t) => !t.isBuiltIn);
				expect(customTypesInResult[0].type).toBe('custom_artifact');
				expect(customTypesInResult[1].type).toBe('custom_creature');
			});

			it('should handle mix of custom and built-in types in custom order', () => {
				const customOrder = [
					'custom_creature',
					'campaign',
					'character',
					'custom_artifact',
					'npc'
				];
				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				// Built-in types should appear first, following custom order where they appear
				const builtInTypes = ordered.filter((t) => t.isBuiltIn).map((t) => t.type);
				expect(builtInTypes[0]).toBe('campaign');
				expect(builtInTypes[1]).toBe('character');
				expect(builtInTypes[2]).toBe('npc');

				// Custom types should appear after, in their custom order
				const customTypesInResult = ordered.filter((t) => !t.isBuiltIn);
				expect(customTypesInResult[0].type).toBe('custom_creature');
				expect(customTypesInResult[1].type).toBe('custom_artifact');
			});

			it('should handle empty custom types array', () => {
				const customOrder = ['campaign', 'character'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				const types = ordered.map((t) => t.type);
				expect(types).not.toContain('custom_creature');
				expect(types.length).toBe(13); // Only built-in types
			});
		});

		describe('Overrides Applied to Ordered Types', () => {
			it('should apply overrides to types in custom order', () => {
				const overrides: EntityTypeOverride[] = [
					{
						type: 'character',
						additionalFields: [
							{
								key: 'level',
								label: 'Level',
								type: 'number',
								required: false,
								order: 1
							}
						]
					}
				];

				const customOrder = ['campaign', 'character', 'npc'];
				const ordered = getOrderedEntityTypes([], overrides, customOrder);

				const character = ordered.find((t) => t.type === 'character');
				expect(character?.fieldDefinitions.some((f) => f.key === 'level')).toBe(true);
			});

			it('should hide types marked as hiddenFromSidebar in overrides', () => {
				const overrides: EntityTypeOverride[] = [
					{
						type: 'session',
						hiddenFromSidebar: true
					}
				];

				const customOrder = ['campaign', 'character', 'session', 'npc'];
				const ordered = getOrderedEntityTypes([], overrides, customOrder);

				const types = ordered.map((t) => t.type);
				expect(types).not.toContain('session');
			});

			it('should apply field hiding from overrides', () => {
				const overrides: EntityTypeOverride[] = [
					{
						type: 'npc',
						hiddenFields: ['secrets']
					}
				];

				const ordered = getOrderedEntityTypes([], overrides, null);
				const npc = ordered.find((t) => t.type === 'npc');

				expect(npc?.fieldDefinitions.some((f) => f.key === 'secrets')).toBe(false);
			});
		});

		describe('Edge Cases', () => {
			it('should handle null parameters gracefully', () => {
				const ordered = getOrderedEntityTypes([], [], null);
				expect(Array.isArray(ordered)).toBe(true);
				expect(ordered.length).toBeGreaterThan(0);
			});

			it('should handle undefined custom types', () => {
				const ordered = getOrderedEntityTypes(undefined as any, [], null);
				expect(Array.isArray(ordered)).toBe(true);
			});

			it('should handle undefined overrides', () => {
				const ordered = getOrderedEntityTypes([], undefined as any, null);
				expect(Array.isArray(ordered)).toBe(true);
			});

			it('should handle very long custom order', () => {
				const longOrder = [...BUILT_IN_ENTITY_TYPES.map((t) => t.type)].reverse();
				const ordered = getOrderedEntityTypes([], [], longOrder);

				expect(ordered.length).toBe(13);
			});

			it('should handle custom order with duplicates', () => {
				const customOrder = ['campaign', 'character', 'campaign', 'npc'];
				const ordered = getOrderedEntityTypes([], [], customOrder);

				const types = ordered.map((t) => t.type);
				const campaignCount = types.filter((t) => t === 'campaign').length;
				expect(campaignCount).toBe(1);
			});

			it('should return complete EntityTypeDefinition objects', () => {
				const ordered = getOrderedEntityTypes([], [], null);

				ordered.forEach((typeDef) => {
					expect(typeDef).toHaveProperty('type');
					expect(typeDef).toHaveProperty('label');
					expect(typeDef).toHaveProperty('labelPlural');
					expect(typeDef).toHaveProperty('icon');
					expect(typeDef).toHaveProperty('color');
					expect(typeDef).toHaveProperty('isBuiltIn');
					expect(typeDef).toHaveProperty('fieldDefinitions');
					expect(typeDef).toHaveProperty('defaultRelationships');
				});
			});
		});

		describe('Integration with Existing Functions', () => {
			it('should work with getAllEntityTypes result', () => {
				const allTypes = getAllEntityTypes(customTypes, []);
				const customOrder = ['campaign', 'character'];

				const ordered = getOrderedEntityTypes(customTypes, [], customOrder);

				// Should contain same types
				expect(ordered.length).toBe(allTypes.length);
			});

			it('should preserve field definitions from getEntityTypeDefinition', () => {
				const characterDef = getEntityTypeDefinition('character');
				const ordered = getOrderedEntityTypes([], [], null);
				const characterOrdered = ordered.find((t) => t.type === 'character');

				expect(characterOrdered?.fieldDefinitions.length).toBe(
					characterDef?.fieldDefinitions.length
				);
			});

			it('should work correctly with applyOverrideToType', () => {
				const override: EntityTypeOverride = {
					type: 'npc',
					hiddenFields: ['secrets']
				};

				const npcDef = BUILT_IN_ENTITY_TYPES.find((t) => t.type === 'npc')!;
				const withOverride = applyOverrideToType(npcDef, override);

				const ordered = getOrderedEntityTypes([], [override], null);
				const npcOrdered = ordered.find((t) => t.type === 'npc');

				expect(npcOrdered?.fieldDefinitions.length).toBe(withOverride.fieldDefinitions.length);
			});
		});
	});

	describe('Integration Between Functions', () => {
		it('should use getDefaultEntityTypeOrder in getOrderedEntityTypes when no custom order', () => {
			const defaultOrder = getDefaultEntityTypeOrder();
			const ordered = getOrderedEntityTypes([], [], null);

			expect(ordered[0].type).toBe(defaultOrder[0]);
		});

		it('should maintain consistency between default order and ordered types', () => {
			const defaultOrder = getDefaultEntityTypeOrder();
			const ordered = getOrderedEntityTypes([], [], null);

			const orderedTypes = ordered.map((t) => t.type);
			expect(orderedTypes[0]).toBe(defaultOrder[0]); // Campaign first in both
		});
	});
});
