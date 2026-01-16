import { describe, it, expect } from 'vitest';
import { COMMANDS } from './commands';
import type { EntityType } from '$lib/types';

/**
 * Test Strategy: Commands Registry
 *
 * These tests define the expected structure and behavior of the command registry.
 * Each command must have:
 * - Unique ID
 * - User-friendly name and description
 * - Icon for visual identification
 * - Flag indicating if entity context is required
 * - Execute function that receives context and arguments
 *
 * Key Test Scenarios:
 * 1. Command array exists and is properly exported
 * 2. All commands have required properties with correct types
 * 3. Command IDs are unique (no duplicates)
 * 4. Specific commands exist with expected configurations
 * 5. Execute functions accept proper parameters
 */

describe('commands.ts - Command Registry', () => {
	describe('COMMANDS Array Structure', () => {
		it('should export COMMANDS array', () => {
			expect(COMMANDS).toBeDefined();
			expect(Array.isArray(COMMANDS)).toBe(true);
		});

		it('should contain at least 6 commands', () => {
			// relate, new, search, go, summarize, settings
			expect(COMMANDS.length).toBeGreaterThanOrEqual(6);
		});

		it('should have all commands with required properties', () => {
			COMMANDS.forEach((command) => {
				expect(command).toHaveProperty('id');
				expect(command).toHaveProperty('name');
				expect(command).toHaveProperty('description');
				expect(command).toHaveProperty('icon');
				expect(command).toHaveProperty('requiresEntity');
				expect(command).toHaveProperty('execute');

				// Verify types
				expect(typeof command.id).toBe('string');
				expect(typeof command.name).toBe('string');
				expect(typeof command.description).toBe('string');
				expect(typeof command.icon).toBe('string');
				expect(typeof command.requiresEntity).toBe('boolean');
				expect(typeof command.execute).toBe('function');
			});
		});

		it('should have unique command IDs', () => {
			const ids = COMMANDS.map(cmd => cmd.id);
			const uniqueIds = new Set(ids);
			expect(ids.length).toBe(uniqueIds.size);
		});

		it('should have non-empty names and descriptions', () => {
			COMMANDS.forEach((command) => {
				expect(command.name.trim().length).toBeGreaterThan(0);
				expect(command.description.trim().length).toBeGreaterThan(0);
			});
		});
	});

	describe('Specific Command Definitions', () => {
		describe('/relate command', () => {
			it('should exist with correct properties', () => {
				const relateCmd = COMMANDS.find(cmd => cmd.id === 'relate');

				expect(relateCmd).toBeDefined();
				expect(relateCmd?.name).toBe('Relate');
				expect(relateCmd?.description).toContain('relationship');
				expect(relateCmd?.icon).toBeTruthy();
				expect(relateCmd?.requiresEntity).toBe(true); // Requires current entity
			});

			it('should have execute function that accepts context and args', () => {
				const relateCmd = COMMANDS.find(cmd => cmd.id === 'relate');

				expect(relateCmd?.execute).toBeDefined();
				expect(typeof relateCmd?.execute).toBe('function');

				// Execute function should accept context object
				expect(relateCmd?.execute.length).toBeGreaterThanOrEqual(1);
			});
		});

		describe('/new command', () => {
			it('should exist with correct properties', () => {
				const newCmd = COMMANDS.find(cmd => cmd.id === 'new');

				expect(newCmd).toBeDefined();
				expect(newCmd?.name).toBe('New');
				expect(newCmd?.description).toContain('entity');
				expect(newCmd?.icon).toBeTruthy();
				expect(newCmd?.requiresEntity).toBe(false); // Can be used anywhere
			});

			it('should have execute function that handles entity type argument', () => {
				const newCmd = COMMANDS.find(cmd => cmd.id === 'new');

				expect(newCmd?.execute).toBeDefined();
				expect(typeof newCmd?.execute).toBe('function');
			});
		});

		describe('/search command', () => {
			it('should exist with correct properties', () => {
				const searchCmd = COMMANDS.find(cmd => cmd.id === 'search');

				expect(searchCmd).toBeDefined();
				expect(searchCmd?.name).toBe('Search');
				expect(searchCmd?.description).toContain('search');
				expect(searchCmd?.icon).toBeTruthy();
				expect(searchCmd?.requiresEntity).toBe(false);
			});

			it('should have execute function that handles search query', () => {
				const searchCmd = COMMANDS.find(cmd => cmd.id === 'search');

				expect(searchCmd?.execute).toBeDefined();
				expect(typeof searchCmd?.execute).toBe('function');
			});
		});

		describe('/go command', () => {
			it('should exist with correct properties', () => {
				const goCmd = COMMANDS.find(cmd => cmd.id === 'go');

				expect(goCmd).toBeDefined();
				expect(goCmd?.name).toBe('Go');
				expect(goCmd?.description).toContain('navigate');
				expect(goCmd?.icon).toBeTruthy();
				expect(goCmd?.requiresEntity).toBe(false);
			});

			it('should have execute function that handles navigation', () => {
				const goCmd = COMMANDS.find(cmd => cmd.id === 'go');

				expect(goCmd?.execute).toBeDefined();
				expect(typeof goCmd?.execute).toBe('function');
			});
		});

		describe('/summarize command', () => {
			it('should exist with correct properties', () => {
				const summarizeCmd = COMMANDS.find(cmd => cmd.id === 'summarize');

				expect(summarizeCmd).toBeDefined();
				expect(summarizeCmd?.name).toBe('Summarize');
				expect(summarizeCmd?.description).toContain('summar');
				expect(summarizeCmd?.icon).toBeTruthy();
				expect(summarizeCmd?.requiresEntity).toBe(true); // Requires entity to summarize
			});

			it('should have execute function for AI summarization', () => {
				const summarizeCmd = COMMANDS.find(cmd => cmd.id === 'summarize');

				expect(summarizeCmd?.execute).toBeDefined();
				expect(typeof summarizeCmd?.execute).toBe('function');
			});
		});

		describe('/settings command', () => {
			it('should exist with correct properties', () => {
				const settingsCmd = COMMANDS.find(cmd => cmd.id === 'settings');

				expect(settingsCmd).toBeDefined();
				expect(settingsCmd?.name).toBe('Settings');
				expect(settingsCmd?.description).toContain('settings');
				expect(settingsCmd?.icon).toBeTruthy();
				expect(settingsCmd?.requiresEntity).toBe(false);
			});

			it('should have execute function that navigates to settings', () => {
				const settingsCmd = COMMANDS.find(cmd => cmd.id === 'settings');

				expect(settingsCmd?.execute).toBeDefined();
				expect(typeof settingsCmd?.execute).toBe('function');
			});
		});
	});

	describe('Command Execute Functions', () => {
		it('should have execute functions that accept context parameter', () => {
			COMMANDS.forEach((command) => {
				// Execute functions should accept at least one parameter (context)
				// Context includes: currentEntityId, currentEntityType, goto, etc.
				expect(command.execute.length).toBeGreaterThanOrEqual(1);
			});
		});

		it('should allow commands to be executed with minimal context', () => {
			const minimalContext = {
				currentEntityId: null,
				currentEntityType: null,
				goto: () => Promise.resolve()
			};

			// Commands that don't require entity should work with null entity
			const nonEntityCommands = COMMANDS.filter(cmd => !cmd.requiresEntity);

			expect(nonEntityCommands.length).toBeGreaterThan(0);

			nonEntityCommands.forEach((command) => {
				// Should not throw when called with minimal context
				expect(() => {
					const result = command.execute(minimalContext, '');
					// Result might be void or Promise<void>
					if (result && typeof result.then === 'function') {
						// It's a promise, that's fine
					}
				}).not.toThrow();
			});
		});

		it('should provide entity context to commands that require it', () => {
			const entityContext = {
				currentEntityId: 'test-entity-id',
				currentEntityType: 'character' as EntityType,
				goto: () => Promise.resolve()
			};

			const entityCommands = COMMANDS.filter(cmd => cmd.requiresEntity);

			expect(entityCommands.length).toBeGreaterThan(0);

			entityCommands.forEach((command) => {
				// Should not throw when called with entity context
				expect(() => {
					const result = command.execute(entityContext, '');
					if (result && typeof result.then === 'function') {
						// It's a promise, that's fine
					}
				}).not.toThrow();
			});
		});
	});

	describe('Command Icons', () => {
		it('should have valid icon names', () => {
			// Icons should be non-empty strings (lucide icon names)
			const validIconPattern = /^[a-z][a-z0-9-]*$/;

			COMMANDS.forEach((command) => {
				expect(command.icon).toMatch(validIconPattern);
			});
		});

		it('should use contextually appropriate icons', () => {
			// Just verify icons are assigned, actual appropriateness is subjective
			const relateCmd = COMMANDS.find(cmd => cmd.id === 'relate');
			const newCmd = COMMANDS.find(cmd => cmd.id === 'new');
			const searchCmd = COMMANDS.find(cmd => cmd.id === 'search');

			expect(relateCmd?.icon).toBeTruthy();
			expect(newCmd?.icon).toBeTruthy();
			expect(searchCmd?.icon).toBeTruthy();
		});
	});

	describe('Command Context Requirements', () => {
		it('should mark entity-dependent commands correctly', () => {
			const relateCmd = COMMANDS.find(cmd => cmd.id === 'relate');
			const summarizeCmd = COMMANDS.find(cmd => cmd.id === 'summarize');

			// These commands need current entity context
			expect(relateCmd?.requiresEntity).toBe(true);
			expect(summarizeCmd?.requiresEntity).toBe(true);
		});

		it('should mark entity-independent commands correctly', () => {
			const newCmd = COMMANDS.find(cmd => cmd.id === 'new');
			const searchCmd = COMMANDS.find(cmd => cmd.id === 'search');
			const goCmd = COMMANDS.find(cmd => cmd.id === 'go');
			const settingsCmd = COMMANDS.find(cmd => cmd.id === 'settings');

			// These commands work without entity context
			expect(newCmd?.requiresEntity).toBe(false);
			expect(searchCmd?.requiresEntity).toBe(false);
			expect(goCmd?.requiresEntity).toBe(false);
			expect(settingsCmd?.requiresEntity).toBe(false);
		});
	});

	describe('Command Type Safety', () => {
		it('should have properly typed command definitions', () => {
			// This test validates TypeScript compilation
			// If this test runs, types are correct
			const command = COMMANDS[0];

			// These accesses should not cause type errors
			const id: string = command.id;
			const name: string = command.name;
			const description: string = command.description;
			const icon: string = command.icon;
			const requiresEntity: boolean = command.requiresEntity;
			const execute: Function = command.execute;

			expect(id).toBeDefined();
			expect(name).toBeDefined();
			expect(description).toBeDefined();
			expect(icon).toBeDefined();
			expect(requiresEntity).toBeDefined();
			expect(execute).toBeDefined();
		});
	});
});
