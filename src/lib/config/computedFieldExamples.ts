/**
 * Draw Steel Computed Field Examples (Issue #165)
 *
 * This module provides 13 pre-built computed field examples specifically tailored
 * for Draw Steel RPG campaigns. These examples demonstrate common formulas for:
 * - Health & Vitality: HP calculations, bloodied/winded states
 * - Ability Scores: Total attributes, attack bonuses
 * - Display & Identification: Character titles, descriptions
 * - Combat: Recovery values, tier checks
 * - Negotiation: DC formatting
 *
 * Each example includes:
 * - name: Human-readable name for the example
 * - category: The category this example belongs to
 * - formula: The formula template with {fieldName} placeholders
 * - outputType: The type of the computed result (number, text, boolean)
 * - description: Explanation of what the formula does
 * - sampleFields: Example field values for testing
 * - expectedResult: The expected result when evaluating with sampleFields
 */

/**
 * Structure for a computed field example
 */
export interface ComputedFieldExample {
	name: string;
	category: string;
	formula: string;
	outputType: 'number' | 'text' | 'boolean';
	description: string;
	sampleFields: Record<string, number | string | boolean>;
	expectedResult: number | string | boolean;
}

/**
 * 13 Draw Steel computed field examples
 */
export const DRAW_STEEL_EXAMPLES: ComputedFieldExample[] = [
	// Health & Vitality Examples (4)
	{
		name: 'Remaining HP',
		category: 'Health & Vitality',
		formula: '{maxHP} - {currentDamage}',
		outputType: 'number',
		description: 'Calculates remaining hit points by subtracting damage from max HP',
		sampleFields: {
			maxHP: 60,
			currentDamage: 15
		},
		expectedResult: 45
	},
	{
		name: 'HP Percentage',
		category: 'Health & Vitality',
		formula: '({currentHP} / {maxHP}) * 100',
		outputType: 'number',
		description: 'Shows current HP as a percentage of maximum HP',
		sampleFields: {
			currentHP: 30,
			maxHP: 60
		},
		expectedResult: 50
	},
	{
		name: 'Is Bloodied',
		category: 'Health & Vitality',
		formula: '{currentHP} <= ({maxHP} / 2)',
		outputType: 'boolean',
		description:
			'Checks if character is bloodied (at or below half HP) - important status in Draw Steel',
		sampleFields: {
			currentHP: 25,
			maxHP: 60
		},
		expectedResult: true
	},
	{
		name: 'Is Winded',
		category: 'Health & Vitality',
		formula: '{currentHP} <= 0',
		outputType: 'boolean',
		description: 'Checks if character is winded (at or below 0 HP) - key state in Draw Steel',
		sampleFields: {
			currentHP: 0
		},
		expectedResult: true
	},

	// Ability Scores Examples (3)
	{
		name: 'Total Attributes',
		category: 'Ability Scores',
		formula: '{might} + {agility} + {reason} + {intuition} + {presence}',
		outputType: 'number',
		description: 'Sums all five Draw Steel ability scores',
		sampleFields: {
			might: 3,
			agility: 2,
			reason: 1,
			intuition: 2,
			presence: 2
		},
		expectedResult: 10
	},
	{
		name: 'Primary Attack Bonus',
		category: 'Ability Scores',
		formula: '{might} + {level}',
		outputType: 'number',
		description: 'Calculates melee attack bonus from Might and level',
		sampleFields: {
			might: 3,
			level: 5
		},
		expectedResult: 8
	},
	{
		name: 'Ranged Attack Bonus',
		category: 'Ability Scores',
		formula: '{agility} + {level}',
		outputType: 'number',
		description: 'Calculates ranged attack bonus from Agility and level',
		sampleFields: {
			agility: 2,
			level: 5
		},
		expectedResult: 7
	},

	// Display & Identification Examples (3)
	{
		name: 'Character Title',
		category: 'Display & Identification',
		formula: '{name} the {class}',
		outputType: 'text',
		description: 'Formats character name with class (e.g., "Aragorn the Ranger")',
		sampleFields: {
			name: 'Aragorn',
			class: 'Ranger'
		},
		expectedResult: 'Aragorn the Ranger'
	},
	{
		name: 'Full Character Description',
		category: 'Display & Identification',
		formula: 'Level {level} {ancestry} {class}',
		outputType: 'text',
		description: 'Creates full character description with level, ancestry, and class',
		sampleFields: {
			level: 5,
			ancestry: 'Human',
			class: 'Conduit'
		},
		expectedResult: 'Level 5 Human Conduit'
	},
	{
		name: 'NPC Identifier',
		category: 'Display & Identification',
		formula: '{name} | {threatLevel} {role}',
		outputType: 'text',
		description:
			'Creates NPC identifier with threat level and role (uses | to avoid operator conflicts)',
		sampleFields: {
			name: 'Orc Captain',
			threatLevel: 'Boss',
			role: 'Leader'
		},
		expectedResult: 'Orc Captain | Boss Leader'
	},

	// Combat Examples (2)
	{
		name: 'Recovery Value',
		category: 'Combat',
		formula: '{maxHP} / 3',
		outputType: 'number',
		description: 'Calculates recovery value (one-third of max HP) for healing',
		sampleFields: {
			maxHP: 60
		},
		expectedResult: 20
	},
	{
		name: 'Is Veteran Tier',
		category: 'Combat',
		formula: '{level} >= 5',
		outputType: 'boolean',
		description: 'Checks if character is Veteran tier (level 5+) in Draw Steel',
		sampleFields: {
			level: 5
		},
		expectedResult: true
	},

	// Negotiation Examples (1)
	{
		name: 'Negotiation Difficulty',
		category: 'Negotiation',
		formula: 'DC {negotiationDC}',
		outputType: 'text',
		description: 'Formats negotiation difficulty class for display',
		sampleFields: {
			negotiationDC: 15
		},
		expectedResult: 'DC 15'
	}
];
