import type { GenerationType } from '$lib/types';

/**
 * Configuration for a type-specific field (e.g., threat level, combat role).
 */
export interface GenerationTypeField {
	key: string;
	label: string;
	type: 'select';
	options: { value: string; label: string; description?: string }[];
	defaultValue?: string;
	promptTemplate: string;
}

/**
 * Configuration for a generation type including metadata and prompt templates.
 */
export interface GenerationTypeConfig {
	id: GenerationType;
	label: string;
	description: string;
	icon: string; // Lucide icon name
	promptTemplate: string;
	suggestedStructure?: string;
	typeFields?: GenerationTypeField[];
}

/**
 * All available generation types with their configurations.
 * Ordered with 'custom' first as the default.
 */
export const GENERATION_TYPES: readonly GenerationTypeConfig[] = [
	{
		id: 'custom',
		label: 'General',
		description: 'general purpose assistant for any campaign needs',
		icon: 'sparkles',
		promptTemplate: ' ',
		suggestedStructure: ''
	},
	{
		id: 'npc',
		label: 'NPC',
		description: 'Generate non-player characters with personality and background',
		icon: 'user',
		promptTemplate: `When generating an NPC, create a complete character with personality, motivations, and background that fits naturally into the campaign world. Format the response using the suggested structure below.`,
		suggestedStructure: `## Name
**Role/Title**

## Personality
- Key traits and mannerisms
- Speaking style

## Motivation
- Primary goals and desires
- Fears and conflicts

## Background
- Relevant history
- Current situation

## Relationships
- Connections to other entities (if any)`,
		typeFields: [
			{
				key: 'threatLevel',
				label: 'Threat Level',
				type: 'select',
				options: [
					{
						value: 'minion',
						label: 'Minion',
						description: 'Minion enemies appear in groups to threaten heroes through numbers'
					},
					{
						value: 'standard',
						label: 'Standard',
						description: 'Standard threat level with balanced combat capabilities'
					},
					{
						value: 'elite',
						label: 'Elite',
						description: 'Elite enemies have above-average threat with enhanced abilities'
					},
					{
						value: 'boss',
						label: 'Boss',
						description: 'Boss enemies are major threats meant to challenge an entire party'
					},
					{
						value: 'solo',
						label: 'Solo',
						description: 'Solo enemies are extremely powerful, designed to fight the entire party alone'
					}
				],
				defaultValue: 'standard',
				promptTemplate: 'This NPC should be created as a {value} threat level enemy.'
			},
			{
				key: 'combatRole',
				label: 'Combat Role',
				type: 'select',
				options: [
					{
						value: 'ambusher',
						label: 'Ambusher',
						description: 'Strikes from hiding and gains advantages from surprise'
					},
					{
						value: 'artillery',
						label: 'Artillery',
						description: 'Attacks from range with powerful area effects'
					},
					{
						value: 'brute',
						label: 'Brute',
						description: 'Deals heavy melee damage through raw power'
					},
					{
						value: 'controller',
						label: 'Controller',
						description: 'Manipulates the battlefield and restricts enemy movement'
					},
					{
						value: 'defender',
						label: 'Defender',
						description: 'Protects allies and absorbs damage'
					},
					{
						value: 'harrier',
						label: 'Harrier',
						description: 'Mobile skirmisher that disrupts enemy positioning'
					},
					{
						value: 'hexer',
						label: 'Hexer',
						description: 'Debuffs enemies and inflicts conditions'
					},
					{
						value: 'leader',
						label: 'Leader',
						description: 'Enhances allies and coordinates group tactics'
					},
					{
						value: 'mount',
						label: 'Mount',
						description: 'Carries riders and provides mobility'
					},
					{
						value: 'support',
						label: 'Support',
						description: 'Heals and buffs allies'
					}
				],
				promptTemplate: 'This NPC should fulfill the {value} combat role.'
			}
		]
	},
	{
		id: 'location',
		label: 'Location',
		description: 'Create locations, places, and settings with atmosphere',
		icon: 'map-pin',
		promptTemplate: `When generating a location, create a vivid place with atmosphere, inhabitants, and points of interest. Include sensory details and what makes this location unique. Format the response using the suggested structure below.`,
		suggestedStructure: `## Location Name
**Type** (e.g., tavern, dungeon, city, etc.)

## Description
- Visual appearance
- Sensory details (sounds, smells, etc.)

## Atmosphere
- Overall mood and feeling
- Notable features

## Inhabitants
- Who lives or works here
- Notable NPCs

## Points of Interest
- Key locations within
- Hidden secrets or discoveries

## Connections
- How it relates to other locations`
	},
	{
		id: 'plot_hook',
		label: 'Plot Hook',
		description: 'Generate plot hooks, story threads, and adventure ideas',
		icon: 'book',
		promptTemplate: `When generating a plot hook, create an engaging story premise with clear stakes, complications, and potential resolutions. Make it actionable and compelling for players. Format the response using the suggested structure below.`,
		suggestedStructure: `## Hook Title
**Type** (e.g., mystery, conflict, discovery, etc.)

## Premise
- Initial situation or discovery
- What draws the characters in

## Complication
- The central conflict or challenge
- Why it matters

## Stakes
- What happens if they succeed
- What happens if they fail

## Potential Resolutions
- Possible approaches players might take
- Key decision points

## Connections
- How it ties to existing campaign elements`
	},
	{
		id: 'encounter',
		label: 'Encounter',
		description: 'Design combat encounters and challenges',
		icon: 'swords',
		promptTemplate: `When generating an encounter, create an interesting combat or challenge scenario with tactical elements, environmental factors, and clear objectives. Consider pacing and difficulty. Format the response using the suggested structure below.`,
		suggestedStructure: `## Encounter Name
**Type** (combat, trap, puzzle, social, etc.)

## Setup
- Initial situation
- Trigger conditions

## Enemies/Challenges
- Opponents or obstacles
- Numbers and capabilities
- Tactics they might use

## Terrain and Environment
- Battlefield layout
- Environmental hazards or advantages
- Interactive elements

## Objectives
- Victory conditions
- Optional goals

## Rewards
- Loot, information, or progress
- Experience value

## Scaling
- How to adjust difficulty up or down`
	},
	{
		id: 'item',
		label: 'Item',
		description: 'Create items, artifacts, and treasures',
		icon: 'package',
		promptTemplate: `When generating an item, create something with interesting properties, history, and appearance. Consider both mechanical and narrative value. Format the response using the suggested structure below.`,
		suggestedStructure: `## Item Name
**Type/Category** (weapon, armor, consumable, artifact, etc.)

## Appearance
- Visual description
- Size, weight, materials
- Distinctive features

## Properties
- Mechanical effects or abilities
- Conditions for use
- Limitations or drawbacks

## History
- Origin and creator
- Previous owners
- Legendary deeds

## Value
- Rarity
- Approximate worth
- Who would want it`
	},
	{
		id: 'faction',
		label: 'Faction',
		description: 'Build factions, organizations, and groups',
		icon: 'users',
		promptTemplate: `When generating a faction, create a cohesive organization with clear goals, resources, leadership, and relationships with other groups. Consider their impact on the campaign world. Format the response using the suggested structure below.`,
		suggestedStructure: `## Faction Name
**Type** (guild, kingdom, cult, merchant company, etc.)

## Overview
- Purpose and identity
- Public reputation
- Size and reach

## Goals
- Primary objectives
- Short-term and long-term ambitions
- Methods and philosophy

## Resources
- Wealth and assets
- Special capabilities
- Territories or bases

## Leadership
- Key figures and hierarchy
- Decision-making structure
- Internal politics

## Relationships
- Allies and enemies
- Trade partners
- Historical connections

## Secrets
- Hidden agendas
- Internal conflicts
- Vulnerabilities`
	},
	{
		id: 'session_prep',
		label: 'Session Prep',
		description: 'Help plan and prepare game sessions',
		icon: 'calendar',
		promptTemplate: `When helping with session prep, provide structured planning guidance including scenes, NPCs, pacing, and key moments. Focus on practical preparation that's ready to run. Format the response using the suggested structure below.`,
		suggestedStructure: `## Session Overview
**Expected Duration** | **Key Themes**

## Opening Scene
- Hook to start the session
- Recap points from last session

## Key Scenes
1. Scene description, objectives, NPCs involved
2. Scene description, objectives, NPCs involved
3. (etc.)

## NPCs to Prep
- Name: Quick reference notes
- Name: Quick reference notes

## Pacing Notes
- Estimated time per scene
- Flexible vs. critical moments
- Where to slow down or speed up

## Key Moments
- Important revelations
- Decision points
- Combat or challenges

## Contingencies
- If players go off-script
- Alternative approaches
- Backup content`
	}
] as const;

/**
 * Get the configuration for a specific generation type.
 * Returns null if the type is not found.
 */
export function getGenerationTypeConfig(type: GenerationType): GenerationTypeConfig | null {
	if (!type) return null;
	return GENERATION_TYPES.find((config) => config.id === type) ?? null;
}
