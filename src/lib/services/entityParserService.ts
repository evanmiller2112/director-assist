import type { EntityType, EntityTypeDefinition, FieldValue, FieldDefinition } from '$lib/types';
import { getEntityTypeDefinition } from '$lib/config/entityTypes';
import { validateDynamicFields } from '$lib/utils/validation';

export interface ParsedEntity {
	entityType: EntityType;
	confidence: number;
	name: string;
	description: string;
	summary?: string;
	tags: string[];
	fields: Record<string, FieldValue>;
	sourceRange?: { start: number; end: number };
	validationErrors: Record<string, string>;
}

export interface ParseResult {
	entities: ParsedEntity[];
	hasMultiple: boolean;
	rawText: string;
	errors: string[];
}

export interface ParserOptions {
	minConfidence?: number;
	preferredType?: EntityType;
	excludeTypes?: EntityType[];
	customTypes?: EntityTypeDefinition[];
}

/**
 * Detect entity type from text content and structure
 */
export function detectEntityType(
	text: string,
	options?: ParserOptions
): { type: EntityType | null; confidence: number } {
	// Handle empty/whitespace input
	const trimmedText = text.trim();
	if (!trimmedText) {
		return { type: null, confidence: 0 };
	}

	const lowerText = trimmedText.toLowerCase();

	// A2: Check for explicit type markers at start of line [NPC], [Location], etc.
	const explicitMarkerMatch = trimmedText.match(/^\[(NPC|Location|Faction|Item|Encounter|Deity|Character)\]/i);
	if (explicitMarkerMatch) {
		const markerType = explicitMarkerMatch[1].toLowerCase();
		// Map "character" to "npc" for compatibility
		const actualType = markerType === 'character' ? 'npc' : markerType;
		// Check if this type should be excluded
		if (!options?.excludeTypes || !options.excludeTypes.includes(actualType as EntityType)) {
			return { type: actualType as EntityType, confidence: 0.7 };
		}
	}

	// A2: Check for "Entity Type: <type>" pattern
	const entityTypeHeaderMatch = trimmedText.match(/Entity Type:\s*(NPC|Location|Faction|Item|Encounter|Deity|Character)/i);
	if (entityTypeHeaderMatch) {
		const headerType = entityTypeHeaderMatch[1].toLowerCase();
		// Map "character" to "npc" for compatibility
		const actualType = headerType === 'character' ? 'npc' : headerType;
		// Check if this type should be excluded
		if (!options?.excludeTypes || !options.excludeTypes.includes(actualType as EntityType)) {
			return { type: actualType as EntityType, confidence: 0.7 };
		}
	}

	// All available types to check (built-in + custom)
	const allTypes = [
		'npc',
		'location',
		'faction',
		'item',
		'encounter',
		'deity',
		...(options?.customTypes || []).map((t) => t.type)
	];

	// Filter out excluded types
	const typesToCheck = options?.excludeTypes
		? allTypes.filter((t) => !options.excludeTypes?.includes(t as EntityType))
		: allTypes;

	// Score each type
	const scores = new Map<string, number>();
	const fieldMatchCounts = new Map<string, number>();

	for (const type of typesToCheck) {
		let score = 0;
		let fieldMatches = 0;

		// Get field definitions for this type - check custom types first
		let typeDef: EntityTypeDefinition | undefined;
		const customTypesArray = options?.customTypes || [];

		// First check if there's a custom type with this exact type
		typeDef = customTypesArray.find((t) => t.type === type);

		// If not found in custom types, fall back to built-in types
		if (!typeDef) {
			typeDef = getEntityTypeDefinition(type, []);
		}

		if (!typeDef) continue;

		// Check for field section headers
		for (const fieldDef of typeDef.fieldDefinitions) {
			const patterns = getFieldPatterns(fieldDef.key, fieldDef.label);
			for (const pattern of patterns) {
				if (lowerText.includes(pattern.toLowerCase())) {
					fieldMatches++;
					// Give more weight to specific field patterns vs generic ones
					// Generic "Type" pattern gets less weight than specific ones like "Goals" or "Leadership"
					const isGenericType = pattern.toLowerCase() === '**type**:';
					score += isGenericType ? 0.05 : 0.1;
					break; // Only count each field once
				}
			}
		}

		fieldMatchCounts.set(type, fieldMatches);

		// Type-specific keyword detection
		score += detectTypeSpecificKeywords(lowerText, type);

		// Check for type header mentions
		if (lowerText.includes(`${type}:`)) {
			score += 0.3;
		}

		// A2: Boost confidence based on field density (more matching fields = higher confidence)
		if (fieldMatches >= 1) {
			score += 0.4; // Base boost for having at least one field match
		}
		if (fieldMatches >= 3) {
			score += 0.2; // Additional boost for 3+ field matches (high density)
		}
		if (fieldMatches >= 4) {
			score += 0.1; // Even more boost for 4+ field matches (very high density)
		}

		scores.set(type, Math.min(score, 1.0)); // Cap at 1.0
	}

	// If there's a tie or close scores, prefer the type with more field matches
	let bestType: string | null = null;
	let bestScore = 0;

	for (const [type, score] of scores.entries()) {
		if (score > bestScore || (score === bestScore && bestType && fieldMatchCounts.get(type)! > fieldMatchCounts.get(bestType)!)) {
			bestScore = score;
			bestType = type;
		}
	}

	// Apply confidence threshold
	const minConfidence = options?.minConfidence || 0;
	if (bestScore < minConfidence) {
		bestType = null;
		bestScore = 0;
	}

	// A2: Handle preferredType - use it if confidence is low (< 0.4), but override if confidence is high
	if (options?.preferredType) {
		if (bestScore < 0.4) {
			// Low confidence, use preferred type
			return { type: options.preferredType, confidence: Math.max(bestScore, 0.3) };
		}
		// High confidence (>= 0.4), ignore preferred type and use detected type
	}

	// If no type detected but preferredType is set, use it
	if (!bestType && options?.preferredType) {
		return { type: options.preferredType, confidence: 0.3 };
	}

	return { type: bestType as EntityType | null, confidence: bestScore };
}

/**
 * Get field pattern variations for matching
 */
function getFieldPatterns(key: string, label: string): string[] {
	const patterns = [`**${label.toLowerCase()}**:`, `**${label.toLowerCase()}**`];

	// Add the field key itself as a pattern
	patterns.push(`**${key.toLowerCase()}**:`);

	// Add common variations
	if (key === 'role') {
		patterns.push('**role/occupation**:', '**occupation**:');
	}
	if (key === 'voice') {
		patterns.push('**voice/mannerisms**:', '**mannerisms**:');
	}
	if (key === 'locationType' || key === 'factionType' || key === 'itemType') {
		patterns.push('**type**:');
	}

	return patterns;
}

/**
 * Detect type-specific keywords
 */
function detectTypeSpecificKeywords(text: string, type: string): number {
	let score = 0;

	switch (type) {
		case 'npc':
			if (text.includes('personality')) score += 0.3;
			if (text.includes('role')) score += 0.3;
			if (text.includes('motivation')) score += 0.3;
			if (text.includes('appearance')) score += 0.3;
			if (text.includes('voice')) score += 0.3;
			if (text.includes('mannerisms')) score += 0.3;
			break;

		case 'location':
			// Check for location-specific field sections
			if (text.includes('atmosphere')) score += 0.35;
			if (text.includes('features')) score += 0.35;
			if (text.includes('inhabitants')) score += 0.35;

			// Location keywords (lower priority than field matches)
			const locationKeywords = [
				'tavern',
				'dungeon',
				'city',
				'fortress',
				'temple',
				'castle',
				'village',
				'forest'
			];
			if (locationKeywords.some((kw) => text.includes(kw))) {
				score += 0.2;
			}
			break;

		case 'faction':
			// Check for faction-specific field sections
			if (text.includes('goals')) score += 0.35;
			if (text.includes('leadership')) score += 0.35;
			if (text.includes('resources')) score += 0.35;

			// Faction keywords
			const factionKeywords = ['guild', 'kingdom', 'cult', 'organization', 'company', 'clan', 'order'];
			if (factionKeywords.some((kw) => text.includes(kw))) {
				score += 0.2;
			}
			break;
	}

	return score;
}

/**
 * Extract entity name from text
 */
export function extractEntityName(text: string): string | null {
	const trimmedText = text.trim();
	if (!trimmedText) return null;

	// Try markdown header (## Name)
	const headerMatch = trimmedText.match(/^##\s+(.+)$/m);
	if (headerMatch) {
		let name = headerMatch[1].trim();
		// Strip entity type prefixes
		name = name.replace(/^(NPC|Character|Location|Place|Faction|Organization|Guild|Item|Artifact|Weapon|Encounter|Combat|Deity|God):\s*/i, '');
		return name.trim();
	}

	// Try bold text at start (**Name**)
	const boldMatch = trimmedText.match(/^\*\*([^*]+)\*\*/);
	if (boldMatch) {
		return boldMatch[1].trim();
	}

	// Try Name: label
	const labelMatch = trimmedText.match(/^Name:\s*(.+)$/m);
	if (labelMatch) {
		return labelMatch[1].trim();
	}

	return null;
}

/**
 * Extract fields from text based on entity type
 */
export function extractFields(
	text: string,
	entityType: EntityType,
	customTypes?: EntityTypeDefinition[]
): Record<string, FieldValue> {
	const fields: Record<string, FieldValue> = {};

	// Prefer custom type definition if provided
	let typeDef: EntityTypeDefinition | undefined;
	let isCustomType = false;
	if (customTypes && customTypes.length > 0) {
		typeDef = customTypes.find((t) => t.type === entityType);
		if (typeDef) isCustomType = true;
	}
	if (!typeDef) {
		typeDef = getEntityTypeDefinition(entityType, []);
	}
	if (!typeDef) return fields;

	for (const fieldDef of typeDef.fieldDefinitions) {
		const value = extractFieldValue(text, fieldDef, typeDef, isCustomType);
		if (value !== null && value !== undefined) {
			fields[fieldDef.key] = value;
		}
	}

	// Apply default values for fields that weren't found in text
	// This ensures entities with required fields that have defaults can be saved
	for (const fieldDef of typeDef.fieldDefinitions) {
		if (
			fieldDef.defaultValue !== undefined &&
			fields[fieldDef.key] === undefined
		) {
			fields[fieldDef.key] = fieldDef.defaultValue;
		}
	}

	// Also check for common fields that might not be in type definition
	// e.g., "inhabitants" for locations, "leadership" for factions, "tags" for all
	if (entityType === 'location') {
		const inhabitantsMatch = text.match(/\*\*Inhabitants\*\*:\s*(.+?)(?=\n\n|\n\*\*|$)/is);
		if (inhabitantsMatch && !fields.inhabitants) {
			let value = inhabitantsMatch[1].trim();
			value = value.replace(/\n\*\*[^*]+\*\*:.*/s, '').trim();
			fields.inhabitants = value;
		}
	}

	if (entityType === 'faction') {
		const leadershipMatch = text.match(/\*\*Leadership\*\*:\s*(.+?)(?=\n\n|\n\*\*|$)/is);
		if (leadershipMatch && !fields.leadership) {
			let value = leadershipMatch[1].trim();
			value = value.replace(/\n\*\*[^*]+\*\*:.*/s, '').trim();
			fields.leadership = value;
		}
	}

	// Check for tags field (applies to all entity types)
	if (!fields.tags) {
		const tagMatch = text.match(/\*\*Tags\*\*:\s*(.+?)(?:\n|$)/i);
		if (tagMatch) {
			const tagStr = tagMatch[1].trim();
			fields.tags = tagStr
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean);
		}
	}

	return fields;
}

/**
 * Extract a specific field value from text
 */
function extractFieldValue(
	text: string,
	fieldDef: FieldDefinition,
	typeDef: EntityTypeDefinition,
	isCustomType: boolean
): FieldValue {
	// Build patterns to match
	const patterns = getFieldPatterns(fieldDef.key, fieldDef.label);

	// Try each pattern
	for (const pattern of patterns) {
		const regex = new RegExp(`${escapeRegex(pattern)}\\s*(.+?)(?=\\n\\n|\\n\\*\\*|$)`, 'is');
		const match = text.match(regex);
		if (match) {
			let value = match[1].trim();

			// Clean up the value - remove subsequent field headers
			value = value.replace(/\n\*\*[^*]+\*\*:.*/s, '').trim();

			// Handle different field types
			return parseFieldValue(value, fieldDef, isCustomType);
		}
	}

	return undefined;
}

/**
 * Parse a raw field value according to its type
 */
function parseFieldValue(value: string, fieldDef: FieldDefinition, isCustomType: boolean): FieldValue {
	switch (fieldDef.type) {
		case 'number':
			const num = parseFloat(value);
			// Return the parsed number if valid, otherwise return the string value
			// This allows validation to catch invalid numbers
			return isNaN(num) ? value : num;

		case 'boolean':
			return value.toLowerCase() === 'true';

		case 'select':
			// For select fields, try to match case-insensitively against options
			if (fieldDef.options) {
				const normalizedValue = value.toLowerCase();
				const match = fieldDef.options.find((opt) => opt.toLowerCase() === normalizedValue);
				if (match) {
					return match; // Return exact option value (preserves casing)
				}
				// For custom types with invalid values, return the original value
				// This allows validation to catch invalid select options
				if (isCustomType) {
					return value; // Keep original invalid value for validation
				}
			}
			// For built-in types or no options, return value as-is
			return value;

		case 'tags':
		case 'multi-select':
			if (value.includes(',')) {
				return value
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean);
			}
			return [value];

		default:
			return value;
	}
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split text into multiple entity sections
 */
export function splitIntoEntitySections(text: string): string[] {
	const trimmedText = text.trim();
	if (!trimmedText) return [];

	// Split on horizontal rules or level 1/2 headers
	const separatorRegex = /(?:\n---+\n|\n\*\*\*+\n|\n===+\n|(?=\n#{1,2}\s+))/;

	const sections = trimmedText
		.split(separatorRegex)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	return sections;
}

/**
 * Generate a summary from description
 */
export function generateSummary(description: string, maxLength: number = 150): string {
	const trimmedDesc = description.trim();
	if (!trimmedDesc) return '';

	// Try to get the first sentence
	const sentenceMatch = trimmedDesc.match(/^[^.!?]+[.!?]/);
	if (sentenceMatch) {
		const firstSentence = sentenceMatch[0].trim();
		if (firstSentence.length <= maxLength) {
			return firstSentence;
		}
	}

	// No sentence found or too long - truncate
	if (trimmedDesc.length <= maxLength) {
		return trimmedDesc;
	}

	// Truncate with ellipsis
	return trimmedDesc.substring(0, maxLength - 3) + '...';
}

/**
 * Extract tags from text
 */
export function extractTags(text: string, entityType: EntityType): string[] {
	const tags: string[] = [];

	// Look for explicit tags
	const tagMatch = text.match(/\*\*Tags\*\*:\s*(.+)/i);
	if (tagMatch) {
		const tagStr = tagMatch[1].trim();
		const extractedTags = tagStr
			.split(',')
			.map((t) => t.trim().toLowerCase())
			.filter(Boolean);
		tags.push(...extractedTags);
	}

	// Look for bullet list tags
	const bulletMatch = text.match(/Tags:\s*\n((?:[-*]\s+.+\n?)+)/i);
	if (bulletMatch) {
		const bullets = bulletMatch[1].match(/[-*]\s+(.+)/g);
		if (bullets) {
			const bulletTags = bullets
				.map((b) => b.replace(/^[-*]\s+/, '').trim().toLowerCase())
				.filter(Boolean);
			tags.push(...bulletTags);
		}
	}

	// If no explicit tags and the name contains strong type indicators, infer the entity type as a tag
	if (tags.length === 0) {
		const lowerText = text.toLowerCase();
		const hasStrongIndicator =
			lowerText.includes('tavern') ||
			lowerText.includes('dungeon') ||
			lowerText.includes('castle') ||
			lowerText.includes('temple') ||
			lowerText.includes('guild') ||
			lowerText.includes('faction') ||
			lowerText.includes('deity');

		if (hasStrongIndicator) {
			tags.push(entityType.toLowerCase());
		}
	}

	// Deduplicate and return
	return Array.from(new Set(tags));
}

/**
 * Parse an AI response and extract entities
 */
export function parseAIResponse(responseText: string, options?: ParserOptions): ParseResult {
	const result: ParseResult = {
		entities: [],
		hasMultiple: false,
		rawText: responseText,
		errors: []
	};

	// Handle empty input
	const trimmedText = responseText.trim();
	if (!trimmedText) {
		return result;
	}

	// Split into sections
	const sections = splitIntoEntitySections(trimmedText);
	result.hasMultiple = sections.length > 1;

	// Track position for sourceRange
	let currentPosition = 0;

	// Parse each section
	for (const section of sections) {
		try {
			const entity = parseSingleEntity(section, options);
			if (entity) {
				// Check if entity type should be excluded
				if (options?.excludeTypes && options.excludeTypes.includes(entity.entityType)) {
					continue; // Skip excluded entity types
				}

				// Add sourceRange
				const startPos = responseText.indexOf(section, currentPosition);
				entity.sourceRange = {
					start: startPos >= 0 ? startPos : currentPosition,
					end: startPos >= 0 ? startPos + section.length : currentPosition + section.length
				};
				currentPosition = entity.sourceRange.end;

				result.entities.push(entity);
			} else {
				// Entity without name should be skipped (error case)
				result.errors.push('Failed to parse entity section: missing name');
			}
		} catch (error) {
			result.errors.push(`Error parsing section: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	// Filter entities by confidence
	const minConfidence = options?.minConfidence ?? 0.2;
	result.entities = result.entities.filter((e) => e.confidence >= minConfidence);

	return result;
}

/**
 * Parse a single entity from a text section
 */
function parseSingleEntity(text: string, options?: ParserOptions): ParsedEntity | null {
	// Extract name
	const name = extractEntityName(text);
	if (!name) {
		return null; // Must have a name
	}

	// Detect entity type (first without exclusions to get true type)
	const trueTypeDetection = detectEntityType(text, { ...options, excludeTypes: undefined });

	// Check if the true type should be excluded
	if (trueTypeDetection.type && options?.excludeTypes?.includes(trueTypeDetection.type)) {
		return null; // Skip this entity entirely
	}

	// Now detect with exclusions for the actual type to use
	const typeDetection = detectEntityType(text, options);
	if (!typeDetection.type) {
		// No type detected, but we have a name
		if (options?.preferredType) {
			// Use preferred type if provided
			typeDetection.type = options.preferredType;
			typeDetection.confidence = 0.3;
		} else {
			// Default to 'npc' as a generic fallback (most common entity type)
			typeDetection.type = 'npc';
			typeDetection.confidence = 0.2;
		}
	}

	// Extract fields
	const fields = extractFields(text, typeDetection.type, options?.customTypes);

	// Extract description (everything after the header, excluding field sections)
	const description = extractDescription(text);

	// Generate summary
	const summary = generateSummary(description);

	// Extract tags
	const tags = extractTags(text, typeDetection.type);

	// Create entity without validation errors first
	const entityWithoutValidation: Omit<ParsedEntity, 'validationErrors'> = {
		entityType: typeDetection.type,
		confidence: typeDetection.confidence,
		name,
		description,
		summary,
		tags,
		fields
	};

	// Validate the entity
	const validationErrors = validateParsedEntity(entityWithoutValidation, options?.customTypes);

	return {
		...entityWithoutValidation,
		validationErrors
	};
}

/**
 * Extract description from text (all content, including field values)
 */
function extractDescription(text: string): string {
	// For description, we want all the content
	// Remove the header if present
	const withoutHeader = text.replace(/^##\s+.+$/m, '').trim();

	// Return everything
	return withoutHeader || text;
}

/**
 * Validate a parsed entity against its type definition
 * Returns a record of validation errors (empty if valid)
 */
export function validateParsedEntity(
	entity: Omit<ParsedEntity, 'validationErrors'> | ParsedEntity,
	customTypes?: EntityTypeDefinition[] | EntityTypeDefinition
): Record<string, string> {
	// Handle both array and single type definition
	const customTypesArray = Array.isArray(customTypes) ? customTypes : customTypes ? [customTypes] : [];

	// Get type definition - check custom types first (they can override built-in types)
	let typeDef: EntityTypeDefinition | undefined;

	// First check if there's a custom type with this exact type
	typeDef = customTypesArray.find((t) => t.type === entity.entityType);

	// If not found in custom types, fall back to built-in types
	if (!typeDef) {
		typeDef = getEntityTypeDefinition(entity.entityType, []);
	}

	if (!typeDef) {
		return {}; // No validation if type not found
	}

	// Use the existing validateDynamicFields from validation utils
	// This already handles required fields, select options, number validation, URL validation, etc.
	return validateDynamicFields(entity.fields, typeDef.fieldDefinitions);
}
