import type { EntityType } from '$lib/types';

/**
 * Command Context - passed to command execute functions
 */
export interface CommandContext {
	currentEntityId: string | null;
	currentEntityType: EntityType | null;
	goto: (url: string) => Promise<void>;
}

/**
 * Command Definition - defines a command in the command palette
 */
export interface CommandDefinition {
	id: string;
	name: string;
	description: string;
	icon: string;
	requiresEntity: boolean;
	execute: (context: CommandContext, argument: string) => void | Promise<void>;
}

/**
 * Command Registry - all available commands
 */
export const COMMANDS: CommandDefinition[] = [
	{
		id: 'relate',
		name: 'Relate',
		description: 'Create a relationship between entities',
		icon: 'link',
		requiresEntity: true,
		execute: async (context, argument) => {
			if (context.currentEntityId && context.currentEntityType) {
				// Navigate to the entity's relationship editor or trigger relationship dialog
				await context.goto(
					`/entities/${context.currentEntityType}/${context.currentEntityId}?action=relate`
				);
			}
		}
	},
	{
		id: 'new',
		name: 'New',
		description: 'Create a new entity',
		icon: 'plus',
		requiresEntity: false,
		execute: async (context, argument) => {
			// If argument is provided, use it as the entity type
			const entityType = argument.trim() || 'character';
			await context.goto(`/entities/${entityType}/new`);
		}
	},
	{
		id: 'search',
		name: 'Search',
		description: 'search for entities',
		icon: 'search',
		requiresEntity: false,
		execute: async (context, argument) => {
			// Navigate to search page with query parameter
			const query = argument.trim();
			if (query) {
				await context.goto(`/search?q=${encodeURIComponent(query)}`);
			} else {
				await context.goto('/search');
			}
		}
	},
	{
		id: 'go',
		name: 'Go',
		description: 'navigate to a page',
		icon: 'arrow-right',
		requiresEntity: false,
		execute: async (context, argument) => {
			// Navigate to specific pages based on argument
			const destination = argument.trim().toLowerCase();
			switch (destination) {
				case 'campaign':
					await context.goto('/campaign');
					break;
				case 'settings':
					await context.goto('/settings');
					break;
				case 'chat':
					await context.goto('/chat');
					break;
				default:
					// Default to campaign page
					await context.goto('/campaign');
					break;
			}
		}
	},
	{
		id: 'summarize',
		name: 'Summarize',
		description: 'Generate AI summary of entity',
		icon: 'sparkles',
		requiresEntity: true,
		execute: async (context, argument) => {
			if (context.currentEntityId && context.currentEntityType) {
				// Navigate to entity and trigger summarization
				await context.goto(
					`/entities/${context.currentEntityType}/${context.currentEntityId}?action=summarize`
				);
			}
		}
	},
	{
		id: 'settings',
		name: 'Settings',
		description: 'Open settings page',
		icon: 'settings',
		requiresEntity: false,
		execute: async (context, argument) => {
			await context.goto('/settings');
		}
	}
];
