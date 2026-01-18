/**
 * Breadcrumb Utilities for Relationship Navigation
 *
 * Issue #79: Relationship Navigation Breadcrumbs
 *
 * These utilities manage the navigation breadcrumb trail when users navigate
 * through relationship chains, allowing them to see where they've been and
 * navigate back through the relationship hierarchy.
 */

export interface BreadcrumbSegment {
	entityId: string;
	relationship: string;
	entityName: string;
	entityType: string;
}

/**
 * Parse breadcrumb path from URL parameter string.
 * Format: "entityId:relationship:entityName:entityType,..."
 *
 * @param pathParam - URL parameter string containing breadcrumb path
 * @returns Array of breadcrumb segments
 */
export function parseBreadcrumbPath(pathParam: string | null): BreadcrumbSegment[] {
	// Handle null, undefined, empty, or whitespace-only input
	if (!pathParam || typeof pathParam !== 'string' || !pathParam.trim()) {
		return [];
	}

	const segments: BreadcrumbSegment[] = [];

	// Split by comma to get individual segments
	const parts = pathParam.split(',');

	for (const part of parts) {
		// Skip empty parts (from trailing commas, leading commas, or multiple consecutive commas)
		if (!part.trim()) {
			continue;
		}

		// Split segment by colon
		const fields = part.split(':');

		// Skip segments that don't have at least 4 parts
		if (fields.length < 4) {
			continue;
		}

		// Extract and URL-decode the fields
		const [entityId, relationship, entityName, entityType] = fields.map((field) =>
			decodeURIComponent(field)
		);

		segments.push({
			entityId,
			relationship,
			entityName,
			entityType
		});
	}

	return segments;
}

/**
 * Custom URL encoding that also encodes apostrophes and parentheses.
 * Standard encodeURIComponent doesn't encode these characters.
 *
 * @param str - String to encode
 * @returns URL-encoded string
 */
function encodeField(str: string): string {
	return encodeURIComponent(str)
		.replace(/'/g, '%27')
		.replace(/\(/g, '%28')
		.replace(/\)/g, '%29');
}

/**
 * Serialize breadcrumb segments to URL parameter string.
 * Format: "entityId:relationship:entityName:entityType,..."
 *
 * @param segments - Array of breadcrumb segments
 * @returns URL parameter string
 */
export function serializeBreadcrumbPath(segments: BreadcrumbSegment[]): string {
	if (!segments || segments.length === 0) {
		return '';
	}

	return segments
		.map((segment) => {
			// URL-encode each field
			const parts = [
				encodeField(segment.entityId),
				encodeField(segment.relationship),
				encodeField(segment.entityName),
				encodeField(segment.entityType)
			];
			return parts.join(':');
		})
		.join(',');
}

/**
 * Truncate breadcrumb path to maximum length, keeping most recent entries.
 *
 * @param segments - Array of breadcrumb segments
 * @param maxLength - Maximum number of segments to keep
 * @returns Truncated array of breadcrumb segments
 */
export function truncatePath(
	segments: BreadcrumbSegment[],
	maxLength: number
): BreadcrumbSegment[] {
	if (!segments || segments.length === 0) {
		return [];
	}

	// Handle max length of 0 or negative
	if (maxLength <= 0) {
		return [];
	}

	// If segments count is under or equal to max, return all
	if (segments.length <= maxLength) {
		return [...segments]; // Return a copy to avoid mutation
	}

	// Keep the most recent segments (from the end)
	return segments.slice(-maxLength);
}

/**
 * Build navigation URL with updated breadcrumb path.
 * Automatically truncates to max of 6 segments when adding would exceed.
 *
 * @param targetType - Entity type for the URL path
 * @param targetId - Entity ID for the URL path
 * @param currentSegments - Current breadcrumb segments
 * @param relationship - Relationship type being navigated
 * @param currentEntity - Current entity being navigated from
 * @returns Complete navigation URL with breadcrumb path
 */
export function buildNavigationUrl(
	targetType: string,
	targetId: string,
	currentSegments: BreadcrumbSegment[],
	relationship: string,
	currentEntity: { id: string; name: string; type: string }
): string {
	// Create new segment for current entity
	const newSegment: BreadcrumbSegment = {
		entityId: currentEntity.id,
		relationship,
		entityName: currentEntity.name,
		entityType: currentEntity.type
	};

	// Combine current segments with new segment
	const allSegments = [...currentSegments, newSegment];

	// Truncate to max of 6 segments
	const truncatedSegments = truncatePath(allSegments, 6);

	// Serialize to URL parameter
	const pathParam = serializeBreadcrumbPath(truncatedSegments);

	// Build complete URL
	return `/entities/${targetType}/${targetId}?navPath=${pathParam}`;
}
