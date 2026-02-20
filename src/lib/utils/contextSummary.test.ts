import { describe, it, expect } from 'vitest';
import {
	formatContextSummary,
	type ContextSummaryInput,
	type EntityTypeDefinition
} from './contextSummary';

describe('formatContextSummary', () => {
	describe('default/empty states', () => {
		it('should return default message when no context is available', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toBe('No context available');
		});

		it('should return default message when all values are empty', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					name: '',
					description: '',
					tags: [],
					notes: '',
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toBe('No context available');
		});

		it('should return default message when values are undefined/null', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					name: undefined,
					description: undefined,
					tags: undefined,
					notes: undefined,
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toBe('No context available');
		});
	});

	describe('campaign context', () => {
		it('should include campaign name, setting, and system when provided', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					fields: {}
				},
				campaignContext: {
					name: 'The Lost Kingdom',
					setting: 'Forgotten Realms',
					system: 'Draw Steel'
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('The Lost Kingdom');
			expect(result).toContain('Forgotten Realms');
			expect(result).toContain('Draw Steel');
		});

		it('should format campaign context with labels', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					fields: {}
				},
				campaignContext: {
					name: 'The Lost Kingdom',
					setting: 'Forgotten Realms',
					system: 'Draw Steel'
				}
			};

			const result = formatContextSummary(input);

			expect(result).toMatch(/Campaign:/i);
			expect(result).toMatch(/Setting:/i);
			expect(result).toMatch(/System:/i);
		});

		it('should handle partial campaign context', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					fields: {}
				},
				campaignContext: {
					name: 'The Lost Kingdom',
					setting: '',
					system: ''
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('The Lost Kingdom');
			expect(result).not.toContain('Setting:');
			expect(result).not.toContain('System:');
		});
	});

	describe('entity metadata', () => {
		it('should include entity name when provided', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					name: 'Aragorn',
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Aragorn');
			expect(result).toMatch(/Name:/i);
		});

		it('should include entity description when provided', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					description: 'A ranger from the North',
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('A ranger from the North');
			expect(result).toMatch(/Description:/i);
		});

		it('should include tags when provided', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					tags: ['hero', 'ranger', 'human'],
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('hero');
			expect(result).toContain('ranger');
			expect(result).toContain('human');
			expect(result).toMatch(/Tags:/i);
		});

		it('should include notes when provided', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					notes: 'Important NPC in the campaign',
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Important NPC in the campaign');
			expect(result).toMatch(/Notes:/i);
		});

		it('should include multiple entity metadata fields together', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					name: 'Aragorn',
					description: 'A ranger from the North',
					tags: ['hero', 'ranger'],
					notes: 'Important NPC',
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Aragorn');
			expect(result).toContain('A ranger from the North');
			expect(result).toContain('hero');
			expect(result).toContain('ranger');
			expect(result).toContain('Important NPC');
		});
	});

	describe('field filtering', () => {
		it('should exclude the target field from summary', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [
					{ key: 'class', label: 'Class', type: 'text', section: 'basic' },
					{ key: 'background', label: 'Background', type: 'text', section: 'basic' }
				]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						class: 'Wizard',
						background: 'Scholar'
					}
				},
				targetFieldKey: 'background' // Exclude this field
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Wizard'); // class should be included
			expect(result).not.toContain('Scholar'); // background should be excluded
			expect(result).not.toContain('Background:'); // background label should be excluded
		});

		it('should exclude hidden fields from summary', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [
					{ key: 'name', label: 'Name', type: 'text', section: 'basic' },
					{ key: 'secret', label: 'Secret', type: 'text', section: 'hidden' },
					{ key: 'class', label: 'Class', type: 'text', section: 'basic' }
				]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						name: 'Aragorn',
						secret: 'This is hidden',
						class: 'Ranger'
					}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Aragorn');
			expect(result).toContain('Ranger');
			expect(result).not.toContain('This is hidden');
			expect(result).not.toContain('Secret:');
		});

		it('should handle both target field and hidden fields exclusion together', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [
					{ key: 'name', label: 'Name', type: 'text', section: 'basic' },
					{ key: 'secret', label: 'Secret', type: 'text', section: 'hidden' },
					{ key: 'class', label: 'Class', type: 'text', section: 'basic' },
					{ key: 'background', label: 'Background', type: 'text', section: 'basic' }
				]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						name: 'Aragorn',
						secret: 'Hidden data',
						class: 'Ranger',
						background: 'Noble'
					}
				},
				targetFieldKey: 'background'
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Aragorn');
			expect(result).toContain('Ranger');
			expect(result).not.toContain('Noble'); // target field excluded
			expect(result).not.toContain('Hidden data'); // hidden field excluded
		});
	});

	describe('value truncation', () => {
		it('should truncate long string values', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					description:
						'This is a very long description that goes on and on and should be truncated at some reasonable length to avoid making the tooltip too large and unwieldy for users to read',
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			// Should contain truncated version with ellipsis
			expect(result).toMatch(/\.\.\./);
			// Should not contain the full text
			expect(result.length).toBeLessThan(input.currentValues.description!.length + 50);
		});

		it('should not truncate short string values', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					description: 'Short description',
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Short description');
			expect(result).not.toMatch(/Short description\.\.\./);
		});

		it('should limit number of fields shown to 5 with overflow message', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [
					{ key: 'field1', label: 'Field 1', type: 'text', section: 'basic' },
					{ key: 'field2', label: 'Field 2', type: 'text', section: 'basic' },
					{ key: 'field3', label: 'Field 3', type: 'text', section: 'basic' },
					{ key: 'field4', label: 'Field 4', type: 'text', section: 'basic' },
					{ key: 'field5', label: 'Field 5', type: 'text', section: 'basic' },
					{ key: 'field6', label: 'Field 6', type: 'text', section: 'basic' },
					{ key: 'field7', label: 'Field 7', type: 'text', section: 'basic' }
				]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						field1: 'Value 1',
						field2: 'Value 2',
						field3: 'Value 3',
						field4: 'Value 4',
						field5: 'Value 5',
						field6: 'Value 6',
						field7: 'Value 7'
					}
				}
			};

			const result = formatContextSummary(input);

			// Should show first 5 fields
			expect(result).toContain('Value 1');
			expect(result).toContain('Value 2');
			expect(result).toContain('Value 3');
			expect(result).toContain('Value 4');
			expect(result).toContain('Value 5');

			// Should show overflow message
			expect(result).toMatch(/and \d+ more/i);

			// Should not show fields beyond limit
			expect(result).not.toContain('Value 6');
			expect(result).not.toContain('Value 7');
		});

		it('should not show overflow message when exactly 5 fields', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [
					{ key: 'field1', label: 'Field 1', type: 'text', section: 'basic' },
					{ key: 'field2', label: 'Field 2', type: 'text', section: 'basic' },
					{ key: 'field3', label: 'Field 3', type: 'text', section: 'basic' },
					{ key: 'field4', label: 'Field 4', type: 'text', section: 'basic' },
					{ key: 'field5', label: 'Field 5', type: 'text', section: 'basic' }
				]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						field1: 'Value 1',
						field2: 'Value 2',
						field3: 'Value 3',
						field4: 'Value 4',
						field5: 'Value 5'
					}
				}
			};

			const result = formatContextSummary(input);

			expect(result).not.toMatch(/and \d+ more/i);
		});
	});

	describe('field value type formatting', () => {
		it('should format string field values', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [{ key: 'class', label: 'Class', type: 'text', section: 'basic' }]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						class: 'Wizard'
					}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Class:');
			expect(result).toContain('Wizard');
		});

		it('should format array field values as comma-separated list', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [{ key: 'skills', label: 'Skills', type: 'tags', section: 'basic' }]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						skills: ['Arcana', 'History', 'Investigation']
					}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Skills:');
			expect(result).toContain('Arcana');
			expect(result).toContain('History');
			expect(result).toContain('Investigation');
			// Should be comma-separated or similar formatting
			expect(result).toMatch(/Arcana.*History.*Investigation/);
		});

		it('should format boolean field values as Yes/No', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [{ key: 'isAlive', label: 'Alive', type: 'checkbox', section: 'basic' }]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						isAlive: true
					}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Alive:');
			expect(result).toMatch(/Yes|True/i);
		});

		it('should format number field values', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [{ key: 'level', label: 'Level', type: 'number', section: 'basic' }]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						level: 5
					}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Level:');
			expect(result).toContain('5');
		});

		it('should skip empty string field values', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [
					{ key: 'class', label: 'Class', type: 'text', section: 'basic' },
					{ key: 'race', label: 'Race', type: 'text', section: 'basic' }
				]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						class: 'Wizard',
						race: '' // Empty string should be skipped
					}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Wizard');
			expect(result).not.toContain('Race:');
		});

		it('should skip empty array field values', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [
					{ key: 'class', label: 'Class', type: 'text', section: 'basic' },
					{ key: 'skills', label: 'Skills', type: 'tags', section: 'basic' }
				]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						class: 'Wizard',
						skills: [] // Empty array should be skipped
					}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Wizard');
			expect(result).not.toContain('Skills:');
		});

		it('should handle null and undefined field values', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [
					{ key: 'class', label: 'Class', type: 'text', section: 'basic' },
					{ key: 'race', label: 'Race', type: 'text', section: 'basic' },
					{ key: 'level', label: 'Level', type: 'number', section: 'basic' }
				]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						class: 'Wizard',
						race: null as any,
						level: undefined as any
					}
				}
			};

			const result = formatContextSummary(input);

			expect(result).toContain('Wizard');
			expect(result).not.toContain('Race:');
			expect(result).not.toContain('Level:');
		});
	});

	describe('comprehensive integration scenarios', () => {
		it('should combine campaign context, entity metadata, and fields correctly', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [
					{ key: 'class', label: 'Class', type: 'text', section: 'basic' },
					{ key: 'race', label: 'Race', type: 'text', section: 'basic' }
				]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					name: 'Aragorn',
					description: 'Ranger of the North',
					tags: ['hero', 'ranger'],
					fields: {
						class: 'Ranger',
						race: 'Human'
					}
				},
				campaignContext: {
					name: 'The Lost Kingdom',
					setting: 'Middle Earth',
					system: 'Draw Steel'
				}
			};

			const result = formatContextSummary(input);

			// Campaign context
			expect(result).toContain('The Lost Kingdom');
			expect(result).toContain('Middle Earth');
			expect(result).toContain('Draw Steel');

			// Entity metadata
			expect(result).toContain('Aragorn');
			expect(result).toContain('Ranger of the North');
			expect(result).toContain('hero');
			expect(result).toContain('ranger');

			// Fields
			expect(result).toContain('Ranger');
			expect(result).toContain('Human');
		});

		it('should handle complex filtering scenario with all rules applied', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [
					{ key: 'name', label: 'Name', type: 'text', section: 'basic' },
					{ key: 'class', label: 'Class', type: 'text', section: 'basic' },
					{ key: 'race', label: 'Race', type: 'text', section: 'basic' },
					{ key: 'secret', label: 'Secret', type: 'text', section: 'hidden' },
					{ key: 'background', label: 'Background', type: 'text', section: 'basic' },
					{ key: 'level', label: 'Level', type: 'number', section: 'basic' }
				]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					name: 'Aragorn',
					fields: {
						name: 'Aragorn', // Should be shown in fields section
						class: 'Ranger',
						race: 'Human',
						secret: 'Hidden info', // Hidden field - should not show
						background: 'Noble', // Target field - should not show
						level: 5
					}
				},
				targetFieldKey: 'background'
			};

			const result = formatContextSummary(input);

			// Should include
			expect(result).toContain('Aragorn');
			expect(result).toContain('Ranger');
			expect(result).toContain('Human');
			expect(result).toContain('5');

			// Should exclude
			expect(result).not.toContain('Noble'); // target field
			expect(result).not.toContain('Hidden info'); // hidden field
			expect(result).not.toContain('Secret:');
			expect(result).not.toContain('Background:');
		});
	});

	describe('edge cases', () => {
		it('should handle missing typeDefinition gracefully', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					name: 'Aragorn',
					fields: {
						class: 'Ranger'
					}
				}
			};

			// Should not throw error
			expect(() => formatContextSummary(input)).not.toThrow();

			const result = formatContextSummary(input);
			expect(result).toContain('Aragorn');
		});

		it('should handle empty tags array differently than undefined', () => {
			const input: ContextSummaryInput = {
				entityType: 'character',
				currentValues: {
					name: 'Aragorn',
					tags: [],
					fields: {}
				}
			};

			const result = formatContextSummary(input);

			// Empty array should not add tags section
			expect(result).not.toContain('Tags:');
		});

		it('should handle fields with special characters in values', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fieldDefinitions: [{ key: 'notes', label: 'Notes', type: 'textarea', section: 'basic' }]
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					fields: {
						notes: 'Has "quotes" and\nnewlines\tand\ttabs'
					}
				}
			};

			const result = formatContextSummary(input);

			// Should include the value without errors
			expect(result).toContain('Has');
		});

		it('should prioritize showing the most important context when at limit', () => {
			const typeDefinition: EntityTypeDefinition = {
				id: 'character',
				name: 'Character',
				icon: 'user',
				fields: Array.from({ length: 10 }, (_, i) => ({
					key: `field${i + 1}`,
					label: `Field ${i + 1}`,
					type: 'text' as const,
					section: 'basic' as const
				}))
			};

			const input: ContextSummaryInput = {
				entityType: 'character',
				typeDefinition,
				currentValues: {
					name: 'Aragorn',
					description: 'Ranger of the North',
					tags: ['hero'],
					fields: Object.fromEntries(
						Array.from({ length: 10 }, (_, i) => [`field${i + 1}`, `Value ${i + 1}`])
					)
				}
			};

			const result = formatContextSummary(input);

			// Entity metadata should always be shown regardless of field limit
			expect(result).toContain('Aragorn');
			expect(result).toContain('Ranger of the North');
			expect(result).toContain('hero');

			// Only first 5 fields should be shown
			expect(result).toContain('Value 1');
			expect(result).toContain('Value 5');
			expect(result).not.toContain('Value 10');
		});
	});
});
