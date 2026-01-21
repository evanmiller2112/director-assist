/**
 * Tests for Entity Type Export/Import Service (TDD RED Phase)
 * GitHub Issue #210: Add clone and template library for custom entities
 *
 * Tests the export and import functionality for entity types and field templates.
 * Allows users to share custom entity types and field templates as JSON files.
 *
 * RED Phase: These tests SHOULD FAIL until implementation is complete.
 *
 * Covers:
 * - Exporting entity types to JSON format
 * - Exporting field templates to JSON format
 * - Validating import data structure
 * - Detecting conflicts with existing types
 * - Providing preview information
 * - Round-trip import/export data integrity
 * - Version compatibility
 * - Metadata handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	exportEntityType,
	exportFieldTemplate,
	validateImport,
	EXPORT_VERSION
} from './entityTypeExportService';
import type {
	EntityTypeDefinition,
	FieldTemplate,
	EntityTypeExport,
	ImportValidationResult
} from '$lib/types';

describe('entityTypeExportService', () => {
	describe('exportEntityType', () => {
		it('should export entity type with correct structure', () => {
			const entityType: EntityTypeDefinition = {
				type: 'custom_monster',
				label: 'Custom Monster',
				labelPlural: 'Custom Monsters',
				description: 'Track monsters and creatures',
				icon: 'skull',
				color: 'red',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'threat_level',
						label: 'Threat Level',
						type: 'select',
						required: false,
						options: ['low', 'medium', 'high'],
						order: 1
					},
					{
						key: 'ac',
						label: 'AC',
						type: 'number',
						required: false,
						order: 2
					}
				],
				defaultRelationships: ['located_at']
			};

			const exported = exportEntityType(entityType);

			expect(exported.version).toBe('1.0.0');
			expect(exported.type).toBe('entity-type');
			expect(exported.data).toEqual(entityType);
			expect(exported.exportedAt).toBeInstanceOf(Date);
			expect(exported.generator.name).toBe('Director Assist');
			expect(exported.generator.version).toBeDefined();
		});

		it('should include metadata when provided', () => {
			const entityType: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'amber',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const metadata = {
				author: 'John Doe',
				sourceUrl: 'https://example.com/quest-type',
				license: 'CC-BY-4.0'
			};

			const exported = exportEntityType(entityType, metadata);

			expect(exported.metadata).toEqual(metadata);
			expect(exported.metadata.author).toBe('John Doe');
			expect(exported.metadata.sourceUrl).toBe('https://example.com/quest-type');
			expect(exported.metadata.license).toBe('CC-BY-4.0');
		});

		it('should include empty metadata object when not provided', () => {
			const entityType: EntityTypeDefinition = {
				type: 'test',
				label: 'Test',
				labelPlural: 'Tests',
				icon: 'test-tube',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const exported = exportEntityType(entityType);

			expect(exported.metadata).toEqual({});
		});

		it('should include current app version in generator', () => {
			const entityType: EntityTypeDefinition = {
				type: 'test',
				label: 'Test',
				labelPlural: 'Tests',
				icon: 'test-tube',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const exported = exportEntityType(entityType);

			expect(exported.generator.version).toBeDefined();
			expect(typeof exported.generator.version).toBe('string');
			// Version should be semver format (e.g., "0.8.0")
			expect(exported.generator.version).toMatch(/^\d+\.\d+\.\d+/);
		});

		it('should set exportedAt to current timestamp', () => {
			const entityType: EntityTypeDefinition = {
				type: 'test',
				label: 'Test',
				labelPlural: 'Tests',
				icon: 'test-tube',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const before = new Date();
			const exported = exportEntityType(entityType);
			const after = new Date();

			expect(exported.exportedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
			expect(exported.exportedAt.getTime()).toBeLessThanOrEqual(after.getTime());
		});

		it('should export complex entity type with all features', () => {
			const complexType: EntityTypeDefinition = {
				type: 'ds-monster-threat',
				label: 'Monster/Threat',
				labelPlural: 'Monsters/Threats',
				description: 'Draw Steel monster with full stats',
				icon: 'skull',
				color: 'red',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'threat_level',
						label: 'Threat Level',
						type: 'select',
						required: false,
						options: ['minion', 'standard', 'boss'],
						helpText: 'Monster threat level',
						order: 1
					},
					{
						key: 'abilities',
						label: 'Abilities',
						type: 'richtext',
						required: false,
						placeholder: 'Enter abilities',
						section: 'combat',
						order: 2,
						aiGenerate: true
					},
					{
						key: 'total_power',
						label: 'Total Power',
						type: 'computed',
						required: false,
						order: 3,
						computedConfig: {
							formula: '{strength} + {intelligence}',
							dependencies: ['strength', 'intelligence'],
							outputType: 'number'
						}
					}
				],
				defaultRelationships: ['located_at', 'part_of']
			};

			const exported = exportEntityType(complexType);

			expect(exported.data).toEqual(complexType);
			expect(exported.data.fieldDefinitions).toHaveLength(3);
			expect(exported.data.fieldDefinitions[2].computedConfig).toBeDefined();
		});

		it('should handle entity type with no field definitions', () => {
			const emptyType: EntityTypeDefinition = {
				type: 'simple',
				label: 'Simple',
				labelPlural: 'Simples',
				icon: 'circle',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const exported = exportEntityType(emptyType);

			expect(exported.data.fieldDefinitions).toEqual([]);
		});

		it('should handle entity type with no default relationships', () => {
			const type: EntityTypeDefinition = {
				type: 'standalone',
				label: 'Standalone',
				labelPlural: 'Standalones',
				icon: 'star',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const exported = exportEntityType(type);

			expect(exported.data.defaultRelationships).toEqual([]);
		});
	});

	describe('exportFieldTemplate', () => {
		it('should export field template with correct structure', () => {
			const template: FieldTemplate = {
				id: 'template-1',
				name: 'Combat Stats',
				description: 'Standard combat statistics',
				category: 'draw-steel',
				fieldDefinitions: [
					{
						key: 'ac',
						label: 'AC',
						type: 'number',
						required: false,
						order: 1
					},
					{
						key: 'hp',
						label: 'HP',
						type: 'number',
						required: false,
						order: 2
					}
				],
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-15')
			};

			const exported = exportFieldTemplate(template);

			expect(exported.version).toBe('1.0.0');
			expect(exported.type).toBe('field-template');
			expect(exported.data).toEqual(template);
			expect(exported.exportedAt).toBeInstanceOf(Date);
			expect(exported.generator.name).toBe('Director Assist');
		});

		it('should include metadata when provided', () => {
			const template: FieldTemplate = {
				id: 'template-1',
				name: 'Social Stats',
				category: 'user',
				fieldDefinitions: [],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const metadata = {
				author: 'Jane Smith',
				sourceUrl: 'https://example.com/templates',
				license: 'MIT'
			};

			const exported = exportFieldTemplate(template, metadata);

			expect(exported.metadata).toEqual(metadata);
		});

		it('should handle template with complex field definitions', () => {
			const template: FieldTemplate = {
				id: 'template-1',
				name: 'Complex Template',
				category: 'user',
				fieldDefinitions: [
					{
						key: 'skills',
						label: 'Skills',
						type: 'multi-select',
						required: false,
						options: ['Stealth', 'Combat', 'Magic'],
						order: 1
					},
					{
						key: 'allies',
						label: 'Allies',
						type: 'entity-refs',
						required: false,
						entityTypes: ['npc', 'character'],
						order: 2
					}
				],
				createdAt: new Date(),
				updatedAt: new Date()
			};

			const exported = exportFieldTemplate(template);

			expect(exported.data.fieldDefinitions).toHaveLength(2);
			expect(exported.data.fieldDefinitions[0].options).toEqual(['Stealth', 'Combat', 'Magic']);
			expect(exported.data.fieldDefinitions[1].entityTypes).toEqual(['npc', 'character']);
		});
	});

	describe('validateImport', () => {
		describe('Valid Import Data', () => {
			it('should accept valid entity type export', () => {
				const validExport: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					data: {
						type: 'custom',
						label: 'Custom',
						labelPlural: 'Customs',
						icon: 'star',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				const result = validateImport(validExport);

				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
				expect(result.preview.name).toBe('Custom');
				expect(result.preview.type).toBe('entity-type');
				expect(result.preview.fieldCount).toBe(0);
			});

			it('should accept valid field template export', () => {
				const validExport: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'field-template',
					data: {
						id: 'template-1',
						name: 'Test Template',
						category: 'user',
						fieldDefinitions: [
							{
								key: 'field1',
								label: 'Field 1',
								type: 'text',
								required: false,
								order: 1
							}
						],
						createdAt: new Date(),
						updatedAt: new Date()
					},
					metadata: {}
				};

				const result = validateImport(validExport);

				expect(result.valid).toBe(true);
				expect(result.errors).toHaveLength(0);
				expect(result.preview.name).toBe('Test Template');
				expect(result.preview.type).toBe('field-template');
				expect(result.preview.fieldCount).toBe(1);
			});

			it('should include warnings for non-critical issues', () => {
				const exportFromOldVersion: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date('2020-01-01'), // Old export
					generator: {
						name: 'Director Assist',
						version: '0.1.0' // Very old version
					},
					type: 'entity-type',
					data: {
						type: 'old_custom',
						label: 'Old Custom',
						labelPlural: 'Old Customs',
						icon: 'archive',
						color: 'gray',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				const result = validateImport(exportFromOldVersion);

				expect(result.valid).toBe(true);
				expect(result.warnings.length).toBeGreaterThan(0);
				expect(result.warnings.some((w) => w.includes('old version'))).toBe(true);
			});
		});

		describe('Invalid Version', () => {
			it('should reject unsupported version', () => {
				const invalidExport = {
					version: '2.0.0', // Future version
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					data: {
						type: 'test',
						label: 'Test',
						labelPlural: 'Tests',
						icon: 'star',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				const result = validateImport(invalidExport);

				expect(result.valid).toBe(false);
				expect(result.errors.some((e) => e.includes('version'))).toBe(true);
			});

			it('should reject missing version field', () => {
				const invalidExport = {
					// version field missing
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					data: {
						type: 'test',
						label: 'Test',
						labelPlural: 'Tests',
						icon: 'star',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				const result = validateImport(invalidExport);

				expect(result.valid).toBe(false);
				expect(result.errors.some((e) => e.includes('version'))).toBe(true);
			});
		});

		describe('Missing Required Fields', () => {
			it('should reject export missing type field', () => {
				const invalidExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					// type field missing
					data: {
						type: 'test',
						label: 'Test',
						labelPlural: 'Tests',
						icon: 'star',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				const result = validateImport(invalidExport);

				expect(result.valid).toBe(false);
				expect(result.errors.some((e) => e.includes('type'))).toBe(true);
			});

			it('should reject export missing data field', () => {
				const invalidExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					// data field missing
					metadata: {}
				};

				const result = validateImport(invalidExport);

				expect(result.valid).toBe(false);
				expect(result.errors.some((e) => e.includes('data'))).toBe(true);
			});

			it('should reject export missing exportedAt field', () => {
				const invalidExport = {
					version: '1.0.0',
					// exportedAt missing
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					data: {
						type: 'test',
						label: 'Test',
						labelPlural: 'Tests',
						icon: 'star',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				const result = validateImport(invalidExport);

				expect(result.valid).toBe(false);
				expect(result.errors.some((e) => e.includes('exportedAt'))).toBe(true);
			});

			it('should reject export missing generator field', () => {
				const invalidExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					// generator missing
					type: 'entity-type',
					data: {
						type: 'test',
						label: 'Test',
						labelPlural: 'Tests',
						icon: 'star',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				const result = validateImport(invalidExport);

				expect(result.valid).toBe(false);
				expect(result.errors.some((e) => e.includes('generator'))).toBe(true);
			});
		});

		describe('Invalid Data Structure', () => {
			it('should reject entity type with invalid structure', () => {
				const invalidExport: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					data: {
						// Missing required fields like type, label, icon, etc.
						type: 'test'
					} as any,
					metadata: {}
				};

				const result = validateImport(invalidExport);

				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(0);
			});

			it('should reject field template with invalid structure', () => {
				const invalidExport: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'field-template',
					data: {
						// Missing required fields like id, name, fieldDefinitions, etc.
						name: 'Test'
					} as any,
					metadata: {}
				};

				const result = validateImport(invalidExport);

				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(0);
			});

			it('should reject entity type with invalid field definitions', () => {
				const invalidExport: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					data: {
						type: 'test',
						label: 'Test',
						labelPlural: 'Tests',
						icon: 'star',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [
							{
								// Missing required field properties
								key: 'field1'
							} as any
						],
						defaultRelationships: []
					},
					metadata: {}
				};

				const result = validateImport(invalidExport);

				expect(result.valid).toBe(false);
				expect(result.errors.some((e) => e.includes('field'))).toBe(true);
			});
		});

		describe('Conflict Detection', () => {
			it('should detect conflict with existing entity type', () => {
				const exportData: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					data: {
						type: 'character', // Built-in type
						label: 'Character',
						labelPlural: 'Characters',
						icon: 'user',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				// Pass existing types to check for conflicts
				const existingTypes = ['character', 'npc', 'location'];
				const result = validateImport(exportData, existingTypes);

				expect(result.preview.conflictsWithExisting).toBe(true);
				expect(result.warnings.some((w) => w.includes('already exists'))).toBe(true);
			});

			it('should detect conflict with existing field template', () => {
				const exportData: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'field-template',
					data: {
						id: 'combat-stats', // Existing template ID
						name: 'Combat Stats',
						category: 'user',
						fieldDefinitions: [],
						createdAt: new Date(),
						updatedAt: new Date()
					},
					metadata: {}
				};

				const existingTemplateIds = ['combat-stats', 'social-stats'];
				const result = validateImport(exportData, [], existingTemplateIds);

				expect(result.preview.conflictsWithExisting).toBe(true);
				expect(result.warnings.some((w) => w.includes('already exists'))).toBe(true);
			});

			it('should not show conflict when no conflicts exist', () => {
				const exportData: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					data: {
						type: 'unique_custom_type',
						label: 'Unique Custom',
						labelPlural: 'Unique Customs',
						icon: 'star',
						color: 'purple',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				const existingTypes = ['character', 'npc', 'location'];
				const result = validateImport(exportData, existingTypes);

				expect(result.preview.conflictsWithExisting).toBe(false);
			});
		});

		describe('Preview Information', () => {
			it('should provide preview with entity type name', () => {
				const exportData: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					data: {
						type: 'custom',
						label: 'Custom Type',
						labelPlural: 'Custom Types',
						icon: 'star',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				const result = validateImport(exportData);

				expect(result.preview.name).toBe('Custom Type');
			});

			it('should provide preview with field template name', () => {
				const exportData: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'field-template',
					data: {
						id: 'template-1',
						name: 'My Template',
						category: 'user',
						fieldDefinitions: [],
						createdAt: new Date(),
						updatedAt: new Date()
					},
					metadata: {}
				};

				const result = validateImport(exportData);

				expect(result.preview.name).toBe('My Template');
			});

			it('should provide preview with correct field count', () => {
				const exportData: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: {
						name: 'Director Assist',
						version: '0.8.0'
					},
					type: 'entity-type',
					data: {
						type: 'custom',
						label: 'Custom',
						labelPlural: 'Customs',
						icon: 'star',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [
							{
								key: 'field1',
								label: 'Field 1',
								type: 'text',
								required: false,
								order: 1
							},
							{
								key: 'field2',
								label: 'Field 2',
								type: 'number',
								required: false,
								order: 2
							},
							{
								key: 'field3',
								label: 'Field 3',
								type: 'boolean',
								required: false,
								order: 3
							}
						],
						defaultRelationships: []
					},
					metadata: {}
				};

				const result = validateImport(exportData);

				expect(result.preview.fieldCount).toBe(3);
			});

			it('should provide preview with type information', () => {
				const entityTypeExport: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: { name: 'Director Assist', version: '0.8.0' },
					type: 'entity-type',
					data: {
						type: 'test',
						label: 'Test',
						labelPlural: 'Tests',
						icon: 'star',
						color: 'blue',
						isBuiltIn: false,
						fieldDefinitions: [],
						defaultRelationships: []
					},
					metadata: {}
				};

				const templateExport: EntityTypeExport = {
					version: '1.0.0',
					exportedAt: new Date(),
					generator: { name: 'Director Assist', version: '0.8.0' },
					type: 'field-template',
					data: {
						id: 'template-1',
						name: 'Template',
						category: 'user',
						fieldDefinitions: [],
						createdAt: new Date(),
						updatedAt: new Date()
					},
					metadata: {}
				};

				const entityResult = validateImport(entityTypeExport);
				const templateResult = validateImport(templateExport);

				expect(entityResult.preview.type).toBe('entity-type');
				expect(templateResult.preview.type).toBe('field-template');
			});
		});

		describe('Edge Cases', () => {
			it('should handle null input', () => {
				const result = validateImport(null as any);

				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(0);
			});

			it('should handle undefined input', () => {
				const result = validateImport(undefined as any);

				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(0);
			});

			it('should handle empty object', () => {
				const result = validateImport({} as any);

				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(0);
			});

			it('should handle malformed JSON data', () => {
				const malformed = {
					version: '1.0.0',
					exportedAt: 'not-a-date',
					generator: 'not-an-object',
					type: 123,
					data: 'not-an-object',
					metadata: null
				};

				const result = validateImport(malformed as any);

				expect(result.valid).toBe(false);
			});
		});
	});

	describe('Round-trip Import/Export', () => {
		it('should preserve all entity type data through export/import cycle', () => {
			const original: EntityTypeDefinition = {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				description: 'Track quests and missions',
				icon: 'scroll',
				color: 'amber',
				isBuiltIn: false,
				fieldDefinitions: [
					{
						key: 'status',
						label: 'Status',
						type: 'select',
						required: true,
						options: ['active', 'completed', 'failed'],
						defaultValue: 'active',
						order: 1
					},
					{
						key: 'reward',
						label: 'Reward',
						type: 'richtext',
						required: false,
						placeholder: 'Enter reward',
						helpText: 'Description of quest reward',
						order: 2
					}
				],
				defaultRelationships: ['assigned_to', 'part_of']
			};

			// Export
			const exported = exportEntityType(original);

			// Validate (simulating import)
			const validation = validateImport(exported);

			// Should be valid
			expect(validation.valid).toBe(true);

			// Data should match original
			expect(exported.data).toEqual(original);
		});

		it('should preserve all field template data through export/import cycle', () => {
			const original: FieldTemplate = {
				id: 'template-1',
				name: 'Social Interaction',
				description: 'Fields for social encounters',
				category: 'draw-steel',
				fieldDefinitions: [
					{
						key: 'attitude',
						label: 'Attitude',
						type: 'select',
						required: false,
						options: ['hostile', 'unfriendly', 'neutral', 'friendly', 'helpful'],
						order: 1
					},
					{
						key: 'goals',
						label: 'Goals',
						type: 'tags',
						required: false,
						order: 2
					}
				],
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-15')
			};

			// Export
			const exported = exportFieldTemplate(original);

			// Validate (simulating import)
			const validation = validateImport(exported);

			// Should be valid
			expect(validation.valid).toBe(true);

			// Data should match original
			expect(exported.data).toEqual(original);
		});

		it('should preserve metadata through round-trip', () => {
			const entityType: EntityTypeDefinition = {
				type: 'test',
				label: 'Test',
				labelPlural: 'Tests',
				icon: 'test-tube',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const metadata = {
				author: 'Test Author',
				sourceUrl: 'https://test.com',
				license: 'MIT'
			};

			const exported = exportEntityType(entityType, metadata);
			const validation = validateImport(exported);

			expect(validation.valid).toBe(true);
			expect(exported.metadata).toEqual(metadata);
		});
	});

	describe('EXPORT_VERSION constant', () => {
		it('should be defined and be a string', () => {
			expect(EXPORT_VERSION).toBeDefined();
			expect(typeof EXPORT_VERSION).toBe('string');
		});

		it('should be in semver format', () => {
			expect(EXPORT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
		});

		it('should match version used in exports', () => {
			const entityType: EntityTypeDefinition = {
				type: 'test',
				label: 'Test',
				labelPlural: 'Tests',
				icon: 'test-tube',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			};

			const exported = exportEntityType(entityType);

			expect(exported.version).toBe(EXPORT_VERSION);
		});
	});
});
