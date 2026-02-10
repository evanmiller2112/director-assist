import type { GenerationType } from '$lib/types';
import type { SystemId } from '$lib/types/systems';
import type { GenerationTypeConfig, GenerationTypeField } from './generationTypes';

/**
 * System-specific overrides for generation types
 * Allows systems like Draw Steel to enhance base generation types with system-specific content
 */
export interface SystemGenerationOverride {
	promptAddendum?: string; // Additional prompt content
	structureAddendum?: string; // Additional structure guidance
	additionalTypeFields?: GenerationTypeField[]; // Extra type fields
	typeFieldOverrides?: GenerationTypeField[]; // Override base fields
}

/**
 * Registry of system-specific generation type overrides
 * Maps systemId -> generationType -> override
 */
export const SYSTEM_GENERATION_OVERRIDES: Record<
	SystemId,
	Partial<Record<GenerationType, SystemGenerationOverride>>
> = {
	'system-agnostic': {},
	'draw-steel': {
		npc: {
			promptAddendum: `\n\nFor Draw Steel campaigns, consider the following:
- Choose an appropriate ancestry (human, dwarf, elf, etc.) that fits the character concept
- Select a class if relevant (Censor, Conduit, Elementalist, Fury, Null, Shadow, Tactician, Talent, Troubadour)
- Use "Director" terminology when referring to the person running the game
- Specify threat level: minion (group enemies), elite (enhanced), boss (major threat), or solo (extremely powerful)
- Assign a combat role: brute (heavy damage), controller (battlefield manipulation), support (healing/buffs), artillery (ranged), defender (protection), harrier (mobile), hexer (debuffs), leader (coordination), ambusher (surprise), or mount (mobility)`
		},
		combat: {
			promptAddendum: `\n\nFor Draw Steel tactical encounters:
- Consider Victory Points as an objective-based win condition
- Include Negotiation encounters as social/diplomatic challenges
- Design Montage scenes for skill-based group challenges
- Use "Director" terminology when referring to the person running the game
- Leverage tactical grid-based combat with 5-foot squares
- Consider battlefield terrain and positioning mechanics
- Include environmental hazards or interactive elements on the grid`,
			structureAddendum: `

## Victory Point Conditions
- Primary objectives for earning victory points
- Optional secondary objectives`
		},
		session_prep: {
			promptAddendum: `\n\nFor Draw Steel session preparation:
- Plan encounters using Draw Steel mechanics (combat, negotiation, montage)
- Consider XP rewards and experience progression
- Prepare for the Director's role in managing tactical combat
- Include Victory Point objectives for varied encounter types
- Balance encounter difficulty using threat levels (minion, elite, boss, solo)
- Consider heroic resources and abilities available to the party`
		},
		plot_hook: {
			promptAddendum: `\n\nFor Draw Steel heroic fantasy campaigns:
- Design hooks that lead to tactical combat encounters
- Use "Director" terminology when referring to the person running the game
- Consider how the hook might lead to combat, negotiation, or montage encounters
- Emphasize heroic fantasy themes and epic challenges
- Include opportunities for heroes to use their tactical abilities and resources`
		},
		item: {
			promptAddendum: `\n\nFor Draw Steel items and equipment:
- Use "Director" terminology when referring to the person running the game
- Consider Renown as the primary item currency (items can be purchased with Renown)
- Distinguish between mechanical benefits (stat bonuses, abilities) and narrative benefits (reputation, access, story hooks)
- Items should have appropriate power levels that scale with character tier and Renown cost
- Heroic items should feel significant and tied to the heroic fantasy setting
- Consider whether the item provides tactical advantages in grid-based combat`
		}
	}
};

/**
 * Get system-specific override for a generation type
 * Returns null if no override exists
 */
export function getSystemGenerationOverride(
	systemId: SystemId | null | undefined,
	generationType: GenerationType
): SystemGenerationOverride | null {
	// Handle null/undefined systemId
	if (!systemId) {
		return null;
	}

	// Get the overrides for this system
	const systemOverrides = SYSTEM_GENERATION_OVERRIDES[systemId];

	// If system not found or no overrides, return null
	if (!systemOverrides) {
		return null;
	}

	// If system-agnostic (which has empty overrides), return null
	if (systemId === 'system-agnostic') {
		return null;
	}

	// Get the specific override for this type
	const override = systemOverrides[generationType];

	// Return null if no override exists for this type
	return override || null;
}

/**
 * Merge base generation config with system-specific override
 * Returns enhanced config with system-specific additions
 * Does NOT mutate the original config
 */
export function mergeGenerationConfig(
	baseConfig: GenerationTypeConfig,
	override: SystemGenerationOverride | null
): GenerationTypeConfig {
	// If no override, return a clone of the base config
	if (!override) {
		return {
			...baseConfig,
			// Clone arrays to prevent mutation
			typeFields: baseConfig.typeFields ? [...baseConfig.typeFields] : undefined
		};
	}

	// Create a new config object by cloning base
	const merged: GenerationTypeConfig = {
		...baseConfig,
		// Clone typeFields array if it exists
		typeFields: baseConfig.typeFields ? [...baseConfig.typeFields] : undefined
	};

	// Append promptAddendum if provided
	if (override.promptAddendum) {
		merged.promptTemplate = baseConfig.promptTemplate + override.promptAddendum;
	}

	// Append structureAddendum if provided
	if (override.structureAddendum) {
		merged.suggestedStructure = (baseConfig.suggestedStructure || '') + override.structureAddendum;
	}

	// Merge additionalTypeFields if provided
	if (override.additionalTypeFields && override.additionalTypeFields.length > 0) {
		// Initialize typeFields array if it doesn't exist
		if (!merged.typeFields) {
			merged.typeFields = [];
		}
		// Add the additional fields
		merged.typeFields = [...merged.typeFields, ...override.additionalTypeFields];
	}

	return merged;
}
