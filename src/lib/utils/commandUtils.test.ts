import { describe, it, expect, beforeEach } from 'vitest';
import { filterCommands, parseCommandWithArgument } from './commandUtils';
import type { EntityType } from '$lib/types';

/**
 * Test Strategy: Command Utilities
 *
 * These tests define the behavior of utility functions for command parsing and filtering.
 *
 * Key Test Scenarios for parseCommandWithArgument:
 * 1. Parse simple commands without arguments ("/relate" -> { command: "relate", argument: "" })
 * 2. Parse commands with single word arguments ("/new npc" -> { command: "new", argument: "npc" })
 * 3. Parse commands with multi-word arguments ("/new custom entity" -> { command: "new", argument: "custom entity" })
 * 4. Handle edge cases: empty input, no slash, extra spaces, case sensitivity
 *
 * Key Test Scenarios for filterCommands:
 * 1. Return all commands when query is empty
 * 2. Filter by command ID/name matching query
 * 3. Fuzzy matching for user-friendly search
 * 4. Exclude requiresEntity commands when no entity in context
 * 5. Include requiresEntity commands when entity exists
 * 6. Handle special characters in query
 * 7. Case-insensitive filtering
 */

describe('commandUtils.ts - Command Utilities', () => {
	// Mock command definitions for testing
	const mockCommands = [
		{
			id: 'relate',
			name: 'Relate',
			description: 'Create a relationship between entities',
			icon: 'link',
			requiresEntity: true,
			execute: () => {}
		},
		{
			id: 'new',
			name: 'New',
			description: 'Create a new entity',
			icon: 'plus',
			requiresEntity: false,
			execute: () => {}
		},
		{
			id: 'search',
			name: 'Search',
			description: 'Search for entities',
			icon: 'search',
			requiresEntity: false,
			execute: () => {}
		},
		{
			id: 'go',
			name: 'Go',
			description: 'Navigate to a page',
			icon: 'arrow-right',
			requiresEntity: false,
			execute: () => {}
		},
		{
			id: 'summarize',
			name: 'Summarize',
			description: 'Generate AI summary of entity',
			icon: 'sparkles',
			requiresEntity: true,
			execute: () => {}
		},
		{
			id: 'settings',
			name: 'Settings',
			description: 'Open settings page',
			icon: 'settings',
			requiresEntity: false,
			execute: () => {}
		}
	];

	describe('parseCommandWithArgument', () => {
		describe('Simple Commands (No Arguments)', () => {
			it('should parse command without arguments', () => {
				const result = parseCommandWithArgument('/relate');

				expect(result).toEqual({
					command: 'relate',
					argument: ''
				});
			});

			it('should parse command with leading slash', () => {
				const result = parseCommandWithArgument('/search');

				expect(result).toEqual({
					command: 'search',
					argument: ''
				});
			});

			it('should trim whitespace from command', () => {
				const result = parseCommandWithArgument('/new  ');

				expect(result).toEqual({
					command: 'new',
					argument: ''
				});
			});

			it('should handle command without slash prefix', () => {
				const result = parseCommandWithArgument('relate');

				expect(result).toEqual({
					command: 'relate',
					argument: ''
				});
			});
		});

		describe('Commands with Single-Word Arguments', () => {
			it('should parse command with single word argument', () => {
				const result = parseCommandWithArgument('/new npc');

				expect(result).toEqual({
					command: 'new',
					argument: 'npc'
				});
			});

			it('should parse command with lowercase argument', () => {
				const result = parseCommandWithArgument('/new character');

				expect(result).toEqual({
					command: 'new',
					argument: 'character'
				});
			});

			it('should trim spaces around argument', () => {
				const result = parseCommandWithArgument('/new  location  ');

				expect(result).toEqual({
					command: 'new',
					argument: 'location'
				});
			});
		});

		describe('Commands with Multi-Word Arguments', () => {
			it('should parse command with multi-word argument', () => {
				const result = parseCommandWithArgument('/new custom entity');

				expect(result).toEqual({
					command: 'new',
					argument: 'custom entity'
				});
			});

			it('should preserve internal spaces in argument', () => {
				const result = parseCommandWithArgument('/new my custom type');

				expect(result).toEqual({
					command: 'new',
					argument: 'my custom type'
				});
			});

			it('should handle multiple spaces between words', () => {
				const result = parseCommandWithArgument('/new  custom  entity  ');

				expect(result).toEqual({
					command: 'new',
					argument: 'custom  entity'
				});
			});
		});

		describe('Edge Cases', () => {
			it('should handle empty string', () => {
				const result = parseCommandWithArgument('');

				expect(result).toEqual({
					command: '',
					argument: ''
				});
			});

			it('should handle only slash', () => {
				const result = parseCommandWithArgument('/');

				expect(result).toEqual({
					command: '',
					argument: ''
				});
			});

			it('should handle slash with spaces', () => {
				const result = parseCommandWithArgument('/   ');

				expect(result).toEqual({
					command: '',
					argument: ''
				});
			});

			it('should be case-sensitive for command names', () => {
				const result = parseCommandWithArgument('/New Character');

				// Command should be lowercase, argument preserves case
				expect(result.command).toBe('new');
				expect(result.argument).toBe('Character');
			});

			it('should handle special characters in arguments', () => {
				const result = parseCommandWithArgument('/new npc-type-1');

				expect(result).toEqual({
					command: 'new',
					argument: 'npc-type-1'
				});
			});
		});

		describe('Real-World Usage Patterns', () => {
			it('should parse "/relate" command', () => {
				const result = parseCommandWithArgument('/relate');

				expect(result).toEqual({
					command: 'relate',
					argument: ''
				});
			});

			it('should parse "/new npc" command', () => {
				const result = parseCommandWithArgument('/new npc');

				expect(result).toEqual({
					command: 'new',
					argument: 'npc'
				});
			});

			it('should parse "/search dragons" command', () => {
				const result = parseCommandWithArgument('/search dragons');

				expect(result).toEqual({
					command: 'search',
					argument: 'dragons'
				});
			});

			it('should parse "/go campaign" command', () => {
				const result = parseCommandWithArgument('/go campaign');

				expect(result).toEqual({
					command: 'go',
					argument: 'campaign'
				});
			});
		});
	});

	describe('filterCommands', () => {
		describe('Empty Query (Show All Available)', () => {
			it('should return all commands when query is empty and no entity context', () => {
				const context = {
					currentEntityId: null,
					currentEntityType: null
				};

				const result = filterCommands('', mockCommands, context);

				// Should exclude requiresEntity commands when no entity
				const expectedCommands = mockCommands.filter(cmd => !cmd.requiresEntity);
				expect(result).toHaveLength(expectedCommands.length);
				expect(result.every(cmd => !cmd.requiresEntity)).toBe(true);
			});

			it('should return all commands when query is empty and entity exists', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('', mockCommands, context);

				// Should include all commands when entity exists
				expect(result).toHaveLength(mockCommands.length);
			});

			it('should return commands when query is just whitespace', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('  ', mockCommands, context);

				expect(result).toHaveLength(mockCommands.length);
			});
		});

		describe('Command Filtering by Query', () => {
			it('should filter commands by exact ID match', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('relate', mockCommands, context);

				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('relate');
			});

			it('should filter commands by partial ID match', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('re', mockCommands, context);

				// Should match "relate"
				expect(result.length).toBeGreaterThanOrEqual(1);
				expect(result.some(cmd => cmd.id === 'relate')).toBe(true);
			});

			it('should filter commands by name match', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('Search', mockCommands, context);

				expect(result.length).toBeGreaterThanOrEqual(1);
				expect(result.some(cmd => cmd.name === 'Search')).toBe(true);
			});

			it('should filter commands by description match', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('relationship', mockCommands, context);

				// "relate" has "relationship" in description
				expect(result.some(cmd => cmd.id === 'relate')).toBe(true);
			});

			it('should be case-insensitive when filtering', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const result1 = filterCommands('RELATE', mockCommands, context);
				const result2 = filterCommands('relate', mockCommands, context);
				const result3 = filterCommands('ReLaTe', mockCommands, context);

				expect(result1).toEqual(result2);
				expect(result2).toEqual(result3);
			});

			it('should return empty array when no commands match query', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('nonexistent', mockCommands, context);

				expect(result).toEqual([]);
			});
		});

		describe('Entity Context Filtering', () => {
			it('should exclude requiresEntity commands when currentEntityId is null', () => {
				const context = {
					currentEntityId: null,
					currentEntityType: null
				};

				const result = filterCommands('', mockCommands, context);

				// Should not include "relate" or "summarize"
				expect(result.every(cmd => !cmd.requiresEntity)).toBe(true);
				expect(result.some(cmd => cmd.id === 'relate')).toBe(false);
				expect(result.some(cmd => cmd.id === 'summarize')).toBe(false);
			});

			it('should include requiresEntity commands when currentEntityId exists', () => {
				const context = {
					currentEntityId: 'entity-123',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('', mockCommands, context);

				// Should include "relate" and "summarize"
				expect(result.some(cmd => cmd.id === 'relate')).toBe(true);
				expect(result.some(cmd => cmd.id === 'summarize')).toBe(true);
			});

			it('should filter by query AND entity context', () => {
				const context = {
					currentEntityId: null,
					currentEntityType: null
				};

				const result = filterCommands('relate', mockCommands, context);

				// "relate" requires entity and we have no entity context
				expect(result).toEqual([]);
			});

			it('should filter entity-independent commands without entity context', () => {
				const context = {
					currentEntityId: null,
					currentEntityType: null
				};

				const result = filterCommands('new', mockCommands, context);

				// "new" doesn't require entity, should be included
				expect(result).toHaveLength(1);
				expect(result[0].id).toBe('new');
			});

			it('should handle undefined entity type', () => {
				const context = {
					currentEntityId: 'entity-123',
					currentEntityType: undefined as any
				};

				const result = filterCommands('', mockCommands, context);

				// Should still include all commands if entityId exists
				expect(result).toHaveLength(mockCommands.length);
			});
		});

		describe('Multiple Matching Commands', () => {
			it('should return multiple commands when query matches several', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('s', mockCommands, context);

				// Should match: search, summarize, settings
				expect(result.length).toBeGreaterThanOrEqual(2);
				expect(result.some(cmd => cmd.id === 'search')).toBe(true);
			});

			it('should maintain order of commands', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('', mockCommands, context);

				// Commands should maintain original order
				expect(result[0].id).toBe('relate');
			});
		});

		describe('Special Characters in Query', () => {
			it('should handle query with special regex characters', () => {
				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				// Should not throw even with regex special chars
				expect(() => {
					filterCommands('[test]', mockCommands, context);
				}).not.toThrow();

				expect(() => {
					filterCommands('test*', mockCommands, context);
				}).not.toThrow();

				expect(() => {
					filterCommands('test+', mockCommands, context);
				}).not.toThrow();
			});
		});

		describe('Performance Considerations', () => {
			it('should handle large command arrays efficiently', () => {
				const largeCommandArray = Array.from({ length: 100 }, (_, i) => ({
					id: `command-${i}`,
					name: `Command ${i}`,
					description: `Description for command ${i}`,
					icon: 'icon',
					requiresEntity: i % 2 === 0,
					execute: () => {}
				}));

				const context = {
					currentEntityId: 'test-id',
					currentEntityType: 'character' as EntityType
				};

				const startTime = Date.now();
				const result = filterCommands('command', largeCommandArray, context);
				const endTime = Date.now();

				// Should complete quickly (under 100ms for 100 commands)
				expect(endTime - startTime).toBeLessThan(100);
				expect(result.length).toBeGreaterThan(0);
			});
		});

		describe('Real-World Filtering Scenarios', () => {
			it('should show available commands on entity page', () => {
				const context = {
					currentEntityId: 'char-123',
					currentEntityType: 'character' as EntityType
				};

				const result = filterCommands('', mockCommands, context);

				// All commands available
				expect(result).toHaveLength(6);
				expect(result.some(cmd => cmd.id === 'relate')).toBe(true);
				expect(result.some(cmd => cmd.id === 'summarize')).toBe(true);
			});

			it('should show limited commands on non-entity page', () => {
				const context = {
					currentEntityId: null,
					currentEntityType: null
				};

				const result = filterCommands('', mockCommands, context);

				// Only entity-independent commands
				expect(result).toHaveLength(4);
				expect(result.some(cmd => cmd.id === 'new')).toBe(true);
				expect(result.some(cmd => cmd.id === 'search')).toBe(true);
				expect(result.some(cmd => cmd.id === 'go')).toBe(true);
				expect(result.some(cmd => cmd.id === 'settings')).toBe(true);
			});

			it('should filter to relevant commands as user types', () => {
				const context = {
					currentEntityId: 'char-123',
					currentEntityType: 'character' as EntityType
				};

				// User types "/ne"
				const result1 = filterCommands('ne', mockCommands, context);
				expect(result1.some(cmd => cmd.id === 'new')).toBe(true);

				// User types "/new"
				const result2 = filterCommands('new', mockCommands, context);
				expect(result2).toHaveLength(1);
				expect(result2[0].id).toBe('new');

				// User types "/rel"
				const result3 = filterCommands('rel', mockCommands, context);
				expect(result3.some(cmd => cmd.id === 'relate')).toBe(true);
			});
		});
	});

	describe('Integration between parseCommandWithArgument and filterCommands', () => {
		it('should work together for command execution flow', () => {
			const context = {
				currentEntityId: 'char-123',
				currentEntityType: 'character' as EntityType
			};

			// User types "/new npc"
			const parsed = parseCommandWithArgument('/new npc');
			expect(parsed.command).toBe('new');
			expect(parsed.argument).toBe('npc');

			// Find the command
			const filtered = filterCommands(parsed.command, mockCommands, context);
			expect(filtered).toHaveLength(1);
			expect(filtered[0].id).toBe('new');

			// Now the execute function would be called with the argument
		});

		it('should handle progressive command typing', () => {
			const context = {
				currentEntityId: null,
				currentEntityType: null
			};

			// User progressively types "/new"
			const steps = ['/', '/n', '/ne', '/new'];

			steps.forEach(input => {
				const parsed = parseCommandWithArgument(input);
				const filtered = filterCommands(parsed.command, mockCommands, context);

				// Should progressively narrow down to "new" command
				if (parsed.command.length > 0) {
					expect(filtered.some(cmd => cmd.id.startsWith(parsed.command))).toBeTruthy();
				}
			});
		});
	});
});
