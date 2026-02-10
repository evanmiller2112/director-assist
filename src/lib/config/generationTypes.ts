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
			},
			{
				key: 'ancestry',
				label: 'Ancestry',
				type: 'select',
				options: [
					{
						value: 'dwarf',
						label: 'Dwarf'
					},
					{
						value: 'elf',
						label: 'Elf'
					},
					{
						value: 'hakaan',
						label: 'Hakaan'
					},
					{
						value: 'human',
						label: 'Human'
					},
					{
						value: 'memonek',
						label: 'Memonek'
					},
					{
						value: 'orc',
						label: 'Orc'
					},
					{
						value: 'time-raider',
						label: 'Time Raider'
					}
				],
				promptTemplate: 'This NPC should be of {value} ancestry.'
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
		promptTemplate: `When generating a plot hook, create an engaging heroic fantasy story premise with themes of hope, courage, and adventure. Frame challenges as opportunities for heroism and emphasize uplifting, inspiring, and positive tones. Make it actionable and compelling for players. Format the response using the suggested structure below.`,
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
		id: 'combat',
		label: 'Combat',
		description: 'Design combat encounters and challenges',
		icon: 'swords',
		promptTemplate: `When generating a combat encounter, create an interesting combat scenario with tactical positioning elements and environmental terrain factors. Consider pacing and difficulty. Format the response using the suggested structure below.`,
		suggestedStructure: `## Combat Name
**Type** (combat, trap, puzzle, social, etc.)

## Setup
- Initial situation
- Trigger conditions

## Enemies/Challenges
- Opponents or obstacles
- Numbers and capabilities
- Tactics they might use

## Terrain and Positioning
- Battlefield layout and tactical positioning opportunities
- Environmental hazards or advantages
- Interactive terrain elements

## Objectives
- Victory conditions
- Optional goals

## Rewards
- Loot, information, or progress
- Experience value

## Scaling
- How to adjust difficulty up or down`,
		typeFields: [
			{
				key: 'encounterDifficulty',
				label: 'Encounter Difficulty',
				type: 'select',
				options: [
					{
						value: 'easy',
						label: 'Easy',
						description: 'A straightforward encounter with minimal risk'
					},
					{
						value: 'medium',
						label: 'Medium',
						description: 'A balanced encounter with moderate challenge'
					},
					{
						value: 'hard',
						label: 'Hard',
						description: 'A difficult encounter requiring good tactics'
					},
					{
						value: 'deadly',
						label: 'Deadly',
						description: 'An extremely dangerous encounter with high stakes'
					}
				],
				defaultValue: 'medium',
				promptTemplate: 'This encounter should be {value} difficulty.'
			},
			{
				key: 'terrainComplexity',
				label: 'Terrain Complexity',
				type: 'select',
				options: [
					{
						value: 'minimal',
						label: 'Minimal',
						description: 'Simple terrain with few tactical elements'
					},
					{
						value: 'standard',
						label: 'Standard',
						description: 'Moderate terrain with some tactical opportunities'
					},
					{
						value: 'complex',
						label: 'Complex',
						description: 'Rich terrain with many tactical possibilities'
					}
				],
				defaultValue: 'standard',
				promptTemplate: 'The terrain should have {value} complexity with varied tactical positioning options.'
			}
		]
	},
	{
		id: 'negotiation',
		label: 'Negotiation',
		description: 'Create negotiation encounters with interests and stakes',
		icon: 'handshake',
		promptTemplate: `When generating a negotiation encounter, create an engaging social challenge with clear interests, patience tracks, motivations, and potential pitfalls. Consider the stakes and what each party wants. Format the response using the suggested structure below.`,
		suggestedStructure: `## Negotiation Title
**Type** (diplomatic, trade, conflict resolution, etc.)

## Setup
- Initial situation
- Who is involved

## Motivations and Interests
- What each party wants
- Why they want it
- Patience levels and triggers

## Stakes
- What happens if negotiation succeeds
- What happens if it fails
- Consequences of different outcomes

## Pitfalls
- Common mistakes or missteps
- Things that could derail the negotiation
- Red lines and deal breakers

## Outcomes
- Possible resolutions
- Compromise options
- Win-win scenarios`,
		typeFields: [
			{
				key: 'startingPosition',
				label: 'Starting Position',
				type: 'select',
				options: [
					{
						value: 'strong_advantage',
						label: 'Strong Advantage',
						description: 'The party starts with significant leverage'
					},
					{
						value: 'advantage',
						label: 'Advantage',
						description: 'The party starts with some leverage'
					},
					{
						value: 'even',
						label: 'Even',
						description: 'Both sides start on equal footing'
					},
					{
						value: 'disadvantage',
						label: 'Disadvantage',
						description: 'The party starts at a disadvantage'
					},
					{
						value: 'strong_disadvantage',
						label: 'Strong Disadvantage',
						description: 'The party starts with significant disadvantage'
					}
				],
				defaultValue: 'even',
				promptTemplate: 'The party starts the negotiation from a {value} position.'
			},
			{
				key: 'negotiationStakes',
				label: 'Stakes',
				type: 'select',
				options: [
					{
						value: 'low',
						label: 'Low',
						description: 'Minor consequences, easy to walk away'
					},
					{
						value: 'moderate',
						label: 'Moderate',
						description: 'Meaningful consequences worth caring about'
					},
					{
						value: 'high',
						label: 'High',
						description: 'Major consequences with significant impact'
					},
					{
						value: 'critical',
						label: 'Critical',
						description: 'Life-changing or campaign-defining consequences'
					}
				],
				defaultValue: 'moderate',
				promptTemplate: 'The stakes of this negotiation are {value}.'
			}
		]
	},
	{
		id: 'montage',
		label: 'Montage',
		description: 'Design montage challenges with multi-round activities',
		icon: 'film',
		promptTemplate: `When generating a montage challenge, create a multi-round sequence with varied challenges and clear round-by-round progression. Consider the theme and difficulty of each challenge. Format the response using the suggested structure below.`,
		suggestedStructure: `## Montage Title
**Theme** | **Number of Rounds**

## Overview
- What the montage represents
- Time scale and scope

## Challenges by Round
### Round 1: [Challenge Name]
- Challenge description
- Skills or approaches that work
- Success and failure outcomes

### Round 2: [Challenge Name]
- Challenge description
- Skills or approaches that work
- Success and failure outcomes

### Round 3: [Challenge Name]
- Challenge description
- Skills or approaches that work
- Success and failure outcomes

## Overall Success and Failure
- What happens if most rounds succeed
- What happens if most rounds fail
- Mixed outcome possibilities`,
		typeFields: [
			{
				key: 'montageDifficulty',
				label: 'Difficulty',
				type: 'select',
				options: [
					{
						value: 'easy',
						label: 'Easy',
						description: 'Simple challenges with low risk'
					},
					{
						value: 'standard',
						label: 'Standard',
						description: 'Balanced challenges with moderate difficulty'
					},
					{
						value: 'hard',
						label: 'Hard',
						description: 'Difficult challenges requiring creativity'
					}
				],
				defaultValue: 'standard',
				promptTemplate: 'The montage challenges should be {value} difficulty.'
			},
			{
				key: 'montageTheme',
				label: 'Theme',
				type: 'select',
				options: [
					{
						value: 'research',
						label: 'Research',
						description: 'Gathering information and learning'
					},
					{
						value: 'travel',
						label: 'Travel',
						description: 'Journey and exploration'
					},
					{
						value: 'infiltration',
						label: 'Infiltration',
						description: 'Sneaking and stealth operations'
					},
					{
						value: 'preparation',
						label: 'Preparation',
						description: 'Getting ready for a big event'
					},
					{
						value: 'crafting',
						label: 'Crafting',
						description: 'Building or creating something'
					},
					{
						value: 'social',
						label: 'Social',
						description: 'Networking and relationship building'
					}
				],
				promptTemplate: 'The montage should follow a {value} theme.'
			}
		]
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
		promptTemplate: `When helping with session prep, provide structured planning guidance including scenes, NPCs, pacing, and key moments. Consider varied encounter types including combat, negotiation encounters/scenes, and montage scenes/opportunities. Include Victory Point objectives for encounters where appropriate. Focus on practical preparation that's ready to run. Format the response using the suggested structure below.`,
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
