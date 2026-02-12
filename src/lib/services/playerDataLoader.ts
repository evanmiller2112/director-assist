/**
 * Player Data Loader Service
 *
 * Issue #442: Auto-load player_data.json from static directory
 *
 * Fetches, validates, and parses player_data.json exports.
 * Pure TypeScript service with no Svelte dependencies.
 */

import type { PlayerExport, PlayerEntity, PlayerEntityLink } from '$lib/types/playerExport';

/**
 * Loads player data from a URL (defaults to /player_data.json)
 * Fetches, validates, and returns a validated PlayerExport object
 *
 * @param url - URL to fetch from (default: '/player_data.json')
 * @throws Error with user-friendly message on failure
 * @returns Validated PlayerExport with parsed dates
 */
export async function loadPlayerData(url: string = '/player_data.json'): Promise<PlayerExport> {
	try {
		const response = await fetch(url);

		// Handle HTTP errors
		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(
					'No campaign data has been published yet. Ask your Director to export data for the player view.'
				);
			} else {
				throw new Error(
					`Server error while loading campaign data (${response.status}: ${response.statusText})`
				);
			}
		}

		// Parse JSON
		let rawData: unknown;
		try {
			rawData = await response.json();
		} catch (err) {
			throw new Error('Campaign data file is corrupted or invalid.');
		}

		// Validate and return
		return validatePlayerExport(rawData);
	} catch (err) {
		// Re-throw our custom errors (validation errors, HTTP errors)
		if (err instanceof Error && err.message.startsWith('Invalid player export:')) {
			throw err;
		}
		if (err instanceof Error && err.message.startsWith('Server error')) {
			throw err;
		}
		if (err instanceof Error && err.message.startsWith('No campaign data')) {
			throw err;
		}
		if (err instanceof Error && err.message.startsWith('Campaign data file is corrupted')) {
			throw err;
		}

		// Network errors or unknown errors
		throw new Error('Unable to load campaign data. Please check your connection and try again.');
	}
}

/**
 * Validates raw data as a PlayerExport structure
 * Performs defensive validation, filtering out malformed entities
 *
 * @param rawData - Raw data from JSON
 * @throws Error for structural failures (missing required fields)
 * @returns Validated PlayerExport with parsed dates
 */
export function validatePlayerExport(rawData: unknown): PlayerExport {
	// Must be an object
	if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
		throw new Error('Invalid player export: data must be an object');
	}

	const data = rawData as Record<string, unknown>;

	// Required fields
	if (!('campaignName' in data) || typeof data.campaignName !== 'string') {
		throw new Error('Invalid player export: missing required field "campaignName"');
	}

	if (!('entities' in data)) {
		throw new Error('Invalid player export: missing required field "entities"');
	}

	if (!Array.isArray(data.entities)) {
		throw new Error('Invalid player export: "entities" must be an array');
	}

	// Optional fields with defaults
	const version = typeof data.version === 'string' ? data.version : 'unknown';
	const campaignDescription =
		typeof data.campaignDescription === 'string' ? data.campaignDescription : '';

	// Parse exportedAt date
	let exportedAt: Date;
	if (typeof data.exportedAt === 'string') {
		const parsed = new Date(data.exportedAt);
		exportedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
	} else {
		exportedAt = new Date();
	}

	// Validate and filter entities
	const entities: PlayerEntity[] = [];
	for (let i = 0; i < data.entities.length; i++) {
		const validatedEntity = validateEntity(data.entities[i], i);
		if (validatedEntity) {
			entities.push(validatedEntity);
		}
	}

	return {
		version,
		exportedAt,
		campaignName: data.campaignName,
		campaignDescription,
		entities
	};
}

/**
 * Validates a single entity
 * Returns null for invalid entities, logging warnings
 *
 * @param rawEntity - Raw entity data
 * @param index - Index in the entities array (for logging)
 * @returns Validated PlayerEntity or null if invalid
 */
export function validateEntity(rawEntity: unknown, index: number): PlayerEntity | null {
	// Must be an object
	if (!rawEntity || typeof rawEntity !== 'object' || Array.isArray(rawEntity)) {
		console.warn(`Skipping entity at index ${index}: not an object`);
		return null;
	}

	const entity = rawEntity as Record<string, unknown>;

	// Required string fields
	const requiredStringFields = ['id', 'type', 'name', 'description'];
	for (const field of requiredStringFields) {
		if (!(field in entity) || typeof entity[field] !== 'string') {
			console.warn(`Skipping entity at index ${index}: missing or invalid field "${field}"`);
			return null;
		}
	}

	// Optional string fields
	const summary = typeof entity.summary === 'string' ? entity.summary : undefined;
	const imageUrl = typeof entity.imageUrl === 'string' ? entity.imageUrl : undefined;

	// Tags (array of strings, default to empty array)
	let tags: string[] = [];
	if (Array.isArray(entity.tags)) {
		tags = entity.tags.filter((tag): tag is string => typeof tag === 'string');
	}

	// Fields (object, default to empty object)
	// Note: We accept unknown field values and let TypeScript cast them to FieldValue
	let fields: Record<string, any> = {};
	if (entity.fields && typeof entity.fields === 'object' && !Array.isArray(entity.fields)) {
		fields = entity.fields as Record<string, any>;
	}

	// Links (array of PlayerEntityLink, default to empty array)
	let links: PlayerEntityLink[] = [];
	if (Array.isArray(entity.links)) {
		links = entity.links
			.filter((link): link is Record<string, unknown> => {
				return link && typeof link === 'object' && !Array.isArray(link);
			})
			.map((link) => validateLink(link))
			.filter((link): link is PlayerEntityLink => link !== null);
	}

	// Parse dates
	let createdAt: Date;
	if (typeof entity.createdAt === 'string') {
		const parsed = new Date(entity.createdAt);
		createdAt = isNaN(parsed.getTime()) ? new Date() : parsed;
	} else {
		createdAt = new Date();
	}

	let updatedAt: Date;
	if (typeof entity.updatedAt === 'string') {
		const parsed = new Date(entity.updatedAt);
		updatedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
	} else {
		updatedAt = new Date();
	}

	// Build result
	const result: PlayerEntity = {
		id: entity.id as string,
		type: entity.type as string,
		name: entity.name as string,
		description: entity.description as string,
		tags,
		fields,
		links,
		createdAt,
		updatedAt
	};

	// Add optional fields
	if (summary !== undefined) {
		result.summary = summary;
	}
	if (imageUrl !== undefined) {
		result.imageUrl = imageUrl;
	}

	return result;
}

/**
 * Validates a single link within an entity
 *
 * @param rawLink - Raw link data
 * @returns Validated PlayerEntityLink or null if invalid
 */
function validateLink(rawLink: Record<string, unknown>): PlayerEntityLink | null {
	// Required fields
	const requiredFields = ['id', 'targetId', 'targetType', 'relationship', 'bidirectional'];
	for (const field of requiredFields) {
		if (!(field in rawLink)) {
			return null;
		}
	}

	// Type checks
	if (typeof rawLink.id !== 'string') return null;
	if (typeof rawLink.targetId !== 'string') return null;
	if (typeof rawLink.targetType !== 'string') return null;
	if (typeof rawLink.relationship !== 'string') return null;
	if (typeof rawLink.bidirectional !== 'boolean') return null;

	// Build result
	const result: PlayerEntityLink = {
		id: rawLink.id,
		targetId: rawLink.targetId,
		targetType: rawLink.targetType,
		relationship: rawLink.relationship,
		bidirectional: rawLink.bidirectional
	};

	// Optional fields
	if (typeof rawLink.reverseRelationship === 'string') {
		result.reverseRelationship = rawLink.reverseRelationship;
	}
	if (
		typeof rawLink.strength === 'string' &&
		['strong', 'moderate', 'weak'].includes(rawLink.strength)
	) {
		result.strength = rawLink.strength as 'strong' | 'moderate' | 'weak';
	}

	return result;
}
