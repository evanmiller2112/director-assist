import type { CommandDefinition } from '$lib/config/commands';
import type { EntityType } from '$lib/types';

/**
 * Command Context for filtering
 */
export interface CommandFilterContext {
	currentEntityId: string | null;
	currentEntityType: EntityType | null;
}

/**
 * Parsed command result
 */
export interface ParsedCommand {
	command: string;
	argument: string;
}

/**
 * Parse command input with argument
 * e.g., "/new npc" -> { command: "new", argument: "npc" }
 * e.g., "/relate" -> { command: "relate", argument: "" }
 * e.g., "/new custom entity" -> { command: "new", argument: "custom entity" }
 */
export function parseCommandWithArgument(input: string): ParsedCommand {
	// Remove leading slash if present
	const trimmed = input.trim();
	const withoutSlash = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

	// Find first space to separate command from argument
	const spaceIndex = withoutSlash.indexOf(' ');

	if (spaceIndex === -1) {
		// No space found - just the command
		return {
			command: withoutSlash.trim().toLowerCase(),
			argument: ''
		};
	}

	// Split into command and argument
	const command = withoutSlash.slice(0, spaceIndex).trim().toLowerCase();
	const argument = withoutSlash.slice(spaceIndex + 1).trim();

	return {
		command,
		argument
	};
}

/**
 * Filter commands based on query and context
 *
 * Filters by:
 * - Query matching (id, name, description)
 * - Entity context (excludes requiresEntity commands when no entity)
 * - Case-insensitive matching
 */
export function filterCommands(
	query: string,
	commands: CommandDefinition[],
	context: CommandFilterContext
): CommandDefinition[] {
	const trimmedQuery = query.trim().toLowerCase();
	const hasEntity = context.currentEntityId !== null;

	// Filter out commands that require entity when no entity is present
	let filtered = commands.filter((cmd) => {
		if (cmd.requiresEntity && !hasEntity) {
			return false;
		}
		return true;
	});

	// If query is empty, return all available commands
	if (trimmedQuery === '') {
		return filtered;
	}

	// Escape special regex characters to prevent regex injection
	const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	// Filter by query matching id, name, or description
	filtered = filtered.filter((cmd) => {
		const searchableText = [cmd.id, cmd.name, cmd.description].join(' ').toLowerCase();
		return searchableText.includes(trimmedQuery);
	});

	return filtered;
}
