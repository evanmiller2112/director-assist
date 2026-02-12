/**
 * Respite Activity Templates
 *
 * Predefined activity templates for common Draw Steel respite activities.
 * These templates provide quick-select options to speed up activity creation.
 */

import type { RespiteActivityType } from '$lib/types/respite';

export interface ActivityTemplate {
	name: string;
	description: string;
	type: RespiteActivityType;
}

/**
 * Predefined activity templates organized by type.
 */
export const activityTemplates: ActivityTemplate[] = [
	// Project activities
	{
		name: 'Build Fortifications',
		description: 'Strengthen the defenses of a location',
		type: 'project'
	},
	{
		name: 'Establish Safe House',
		description: 'Set up a hidden base of operations',
		type: 'project'
	},
	{
		name: 'Plan Next Mission',
		description: 'Strategize and prepare for the next adventure',
		type: 'project'
	},

	// Crafting activities
	{
		name: 'Brew Potions',
		description: 'Create healing or utility potions',
		type: 'crafting'
	},
	{
		name: 'Repair Equipment',
		description: 'Fix damaged weapons, armor, or gear',
		type: 'crafting'
	},
	{
		name: 'Enchant Item',
		description: 'Imbue an item with magical properties',
		type: 'crafting'
	},

	// Socializing activities
	{
		name: 'Visit the Tavern',
		description: 'Relax and socialize with locals',
		type: 'socializing'
	},
	{
		name: 'Meet with Contact',
		description: 'Connect with an NPC ally or informant',
		type: 'socializing'
	},
	{
		name: 'Attend Local Event',
		description: 'Participate in a festival, market, or gathering',
		type: 'socializing'
	},

	// Training activities
	{
		name: 'Practice Combat Techniques',
		description: 'Hone fighting skills through sparring or drills',
		type: 'training'
	},
	{
		name: 'Study Spellcraft',
		description: 'Deepen understanding of magical arts',
		type: 'training'
	},
	{
		name: 'Physical Conditioning',
		description: 'Build strength and endurance',
		type: 'training'
	},

	// Investigation activities
	{
		name: 'Research in Library',
		description: 'Study ancient texts and historical records',
		type: 'investigation'
	},
	{
		name: 'Gather Intelligence',
		description: 'Collect information about enemies or objectives',
		type: 'investigation'
	},
	{
		name: 'Decode Mystery',
		description: 'Work on solving a puzzle or deciphering clues',
		type: 'investigation'
	}
];

/**
 * Get templates filtered by activity type.
 */
export function getTemplatesByType(type: RespiteActivityType): ActivityTemplate[] {
	return activityTemplates.filter((t) => t.type === type);
}

/**
 * Get all unique activity types that have templates.
 */
export function getTemplateTypes(): RespiteActivityType[] {
	const types = new Set(activityTemplates.map((t) => t.type));
	return Array.from(types) as RespiteActivityType[];
}
