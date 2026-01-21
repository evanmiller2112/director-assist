/**
 * Relationship Groups Configuration
 *
 * Groups relationship types by semantic category to provide better
 * guidance to users when creating custom entity types.
 */

export interface RelationshipInfo {
	id: string;
	description?: string;
}

export interface RelationshipGroup {
	id: string;
	label: string;
	description: string;
	relationships: string[];
}

/**
 * Organized relationship groups for Draw Steel campaigns
 */
export const RELATIONSHIP_GROUPS: RelationshipGroup[] = [
	{
		id: 'character',
		label: 'Character Relationships',
		description: 'Social and interpersonal connections between entities',
		relationships: [
			'knows',
			'allied_with',
			'enemy_of',
			'member_of',
			'plays'
		]
	},
	{
		id: 'location',
		label: 'Physical Location',
		description: 'Spatial and physical relationships between entities',
		relationships: [
			'located_at',
			'part_of',
			'near',
			'connected_to',
			'contains'
		]
	},
	{
		id: 'authority',
		label: 'Authority & Control',
		description: 'Power dynamics, ownership, and authority relationships',
		relationships: [
			'serves',
			'worships',
			'owns',
			'controls',
			'created_by'
		]
	},
	{
		id: 'causality',
		label: 'Causality & Events',
		description: 'Temporal and cause-and-effect relationships',
		relationships: [
			'involved',
			'caused_by',
			'led_to',
			'affects'
		]
	}
];

/**
 * Flat list of all relationships for backward compatibility
 * This matches the DEFAULT_RELATIONSHIPS export from entityTypes.ts
 */
export const ALL_RELATIONSHIPS: string[] = RELATIONSHIP_GROUPS.flatMap(g => g.relationships);
