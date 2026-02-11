/**
 * Built-in Relationship Templates Configuration
 *
 * Issue #146: Relationship Templates
 *
 * Pre-configured relationship patterns to speed up relationship creation.
 * Templates provide common relationship types across different categories
 * (Social, Professional, Family, Faction) with optional metadata.
 */

import type { RelationshipTemplate } from '$lib/types/relationships';

/**
 * Built-in relationship templates available to all users.
 * These cover common relationship patterns across various contexts.
 */
export const BUILT_IN_RELATIONSHIP_TEMPLATES: RelationshipTemplate[] = [
	// Social Category
	{
		id: 'builtin-friend',
		name: 'Friend',
		relationship: 'friend of',
		bidirectional: true,
		strength: 'moderate',
		category: 'Social',
		description: 'A friendly relationship between equals',
		isBuiltIn: true
	},
	{
		id: 'builtin-rival',
		name: 'Rival',
		relationship: 'rival of',
		bidirectional: true,
		strength: 'moderate',
		category: 'Social',
		description: 'A competitive relationship with ongoing tension',
		isBuiltIn: true
	},
	{
		id: 'builtin-friend-rival',
		name: 'Friend/Rival',
		relationship: 'friend of',
		reverseRelationship: 'rival of',
		bidirectional: true,
		strength: 'moderate',
		category: 'Social',
		description: 'A complex relationship where feelings differ between parties',
		isBuiltIn: true
	},
	{
		id: 'builtin-lover',
		name: 'Lover',
		relationship: 'lover of',
		bidirectional: true,
		strength: 'strong',
		category: 'Social',
		description: 'A romantic relationship',
		isBuiltIn: true
	},
	{
		id: 'builtin-acquaintance',
		name: 'Acquaintance',
		relationship: 'acquaintance of',
		bidirectional: true,
		strength: 'weak',
		category: 'Social',
		description: 'A casual relationship with minimal depth',
		isBuiltIn: true
	},

	// Professional Category
	{
		id: 'builtin-mentor-student',
		name: 'Mentor/Student',
		relationship: 'mentors',
		reverseRelationship: 'student of',
		bidirectional: false,
		strength: 'moderate',
		category: 'Professional',
		description: 'A teaching or guidance relationship',
		isBuiltIn: true
	},
	{
		id: 'builtin-employer-employee',
		name: 'Employer/Employee',
		relationship: 'employs',
		reverseRelationship: 'works for',
		bidirectional: false,
		strength: 'moderate',
		category: 'Professional',
		description: 'A formal employment relationship',
		isBuiltIn: true
	},
	{
		id: 'builtin-colleague',
		name: 'Colleague',
		relationship: 'colleague of',
		bidirectional: true,
		strength: 'weak',
		category: 'Professional',
		description: 'A professional peer relationship',
		isBuiltIn: true
	},

	// Family Category
	{
		id: 'builtin-parent-child',
		name: 'Parent/Child',
		relationship: 'parent of',
		reverseRelationship: 'child of',
		bidirectional: false,
		strength: 'strong',
		category: 'Family',
		description: 'A parental relationship',
		isBuiltIn: true
	},
	{
		id: 'builtin-sibling',
		name: 'Sibling',
		relationship: 'sibling of',
		bidirectional: true,
		strength: 'strong',
		category: 'Family',
		description: 'A sibling relationship',
		isBuiltIn: true
	},
	{
		id: 'builtin-spouse',
		name: 'Spouse',
		relationship: 'spouse of',
		bidirectional: true,
		strength: 'strong',
		category: 'Family',
		description: 'A married relationship',
		isBuiltIn: true
	},
	{
		id: 'builtin-extended-family',
		name: 'Extended Family',
		relationship: 'related to',
		bidirectional: true,
		strength: 'moderate',
		category: 'Family',
		description: 'A broader family connection (cousins, aunts, uncles, etc.)',
		isBuiltIn: true
	},

	// Faction Category
	{
		id: 'builtin-allied',
		name: 'Allied',
		relationship: 'allied with',
		bidirectional: true,
		strength: 'strong',
		category: 'Faction',
		description: 'A formal alliance between groups or individuals',
		isBuiltIn: true
	},
	{
		id: 'builtin-enemy',
		name: 'Enemy',
		relationship: 'enemy of',
		bidirectional: true,
		strength: 'strong',
		category: 'Faction',
		description: 'Active opposition or hostility',
		isBuiltIn: true
	},
	{
		id: 'builtin-allied-enemy',
		name: 'Allied/Enemy',
		relationship: 'allied with',
		reverseRelationship: 'enemy of',
		bidirectional: true,
		strength: 'strong',
		category: 'Faction',
		description: 'A one-sided alliance where the other party sees an enemy',
		isBuiltIn: true
	},
	{
		id: 'builtin-member',
		name: 'Member',
		relationship: 'member of',
		reverseRelationship: 'has member',
		bidirectional: false,
		strength: 'moderate',
		category: 'Faction',
		description: 'Membership in a group or organization',
		isBuiltIn: true
	}
];
