/**
 * Entity Prefill Utilities (GREEN Phase - Phase A4)
 *
 * Issue #40: AI Chat Panel - Phase A4 (Save Flow & Prefill)
 *
 * This utility handles serialization and deserialization of parsed entities
 * for URL-based prefilling in entity forms. It enables the "Review & Edit"
 * flow where users can navigate from chat to a prefilled entity form.
 */

import type { ParsedEntity } from '$lib/services/entityParserService';
import type { EntityType, FieldValue } from '$lib/types';

export interface PrefillParams {
	type: EntityType;
	name: string;
	description: string;
	summary?: string;
	tags: string[];
	fields: Record<string, FieldValue>;
	sourceMessageId?: string;
}

/**
 * Serialize ParsedEntity to URL-safe base64 string
 *
 * @param parsed - The parsed entity to serialize
 * @param messageId - Optional source message ID
 * @returns Base64-encoded string safe for URL parameters
 */
export function serializePrefillParams(parsed: ParsedEntity, messageId?: string): string {
	// Build params object
	const params: PrefillParams = {
		type: parsed.entityType,
		name: parsed.name,
		description: parsed.description,
		summary: parsed.summary,
		tags: parsed.tags,
		fields: parsed.fields
	};

	// Include messageId only if provided
	if (messageId) {
		params.sourceMessageId = messageId;
	}

	// JSON stringify and base64 encode
	const jsonStr = JSON.stringify(params);

	// Handle unicode by converting to byte array first
	// This approach is unicode-safe and works in all browsers
	const bytes = new TextEncoder().encode(jsonStr);

	// Convert byte array to binary string
	let binaryStr = '';
	for (let i = 0; i < bytes.length; i++) {
		binaryStr += String.fromCharCode(bytes[i]);
	}

	return btoa(binaryStr);
}

/**
 * Deserialize base64 string back to PrefillParams
 * Returns null if the string is invalid or doesn't contain required fields
 *
 * @param param - Base64-encoded string from URL parameter
 * @returns Deserialized PrefillParams or null if invalid
 */
export function deserializePrefillParams(param: string): PrefillParams | null {
	// Handle empty string
	if (!param || param.trim() === '') {
		return null;
	}

	try {
		// Decode base64 to binary string
		const binaryStr = atob(param);

		// Convert binary string to byte array
		const bytes = new Uint8Array(binaryStr.length);
		for (let i = 0; i < binaryStr.length; i++) {
			bytes[i] = binaryStr.charCodeAt(i);
		}

		// Decode byte array to string (handles unicode)
		const jsonStr = new TextDecoder().decode(bytes);

		// Parse JSON
		const parsed = JSON.parse(jsonStr);

		// Validate required fields exist
		if (!parsed.type || !parsed.name || !parsed.description) {
			return null;
		}

		// Return validated params
		return {
			type: parsed.type,
			name: parsed.name,
			description: parsed.description,
			summary: parsed.summary,
			tags: parsed.tags || [],
			fields: parsed.fields || {},
			sourceMessageId: parsed.sourceMessageId
		};
	} catch (error) {
		// Invalid base64 or JSON
		return null;
	}
}

/**
 * Build complete URL for entity creation with prefill data
 *
 * @param parsed - The parsed entity to prefill
 * @param messageId - Optional source message ID
 * @returns Complete URL path with prefill query parameter
 */
export function buildPrefillUrl(parsed: ParsedEntity, messageId?: string): string {
	const serialized = serializePrefillParams(parsed, messageId);
	return `/entities/new/${parsed.entityType}?prefill=${serialized}`;
}
