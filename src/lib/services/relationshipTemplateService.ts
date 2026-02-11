/**
 * Relationship Template Service
 *
 * Issue #146: Relationship Templates
 *
 * Manages custom relationship templates using localStorage.
 * Provides CRUD operations and merges custom templates with built-in templates.
 *
 * Follows patterns established by suggestionSettingsService:
 * - localStorage-based persistence
 * - SSR-safe (handles window === undefined)
 * - Graceful error handling for corrupted data
 * - ID generation for new templates
 */

import type {
	RelationshipTemplate,
	CreateRelationshipTemplateInput,
	UpdateRelationshipTemplateInput
} from '$lib/types/relationships';
import { BUILT_IN_RELATIONSHIP_TEMPLATES } from '$lib/config/relationshipTemplates';

const STORAGE_KEY = 'relationship-templates';

/**
 * Get custom templates from localStorage.
 * Returns empty array if no templates are stored, data is corrupted, or in SSR context.
 */
export function getCustomTemplates(): RelationshipTemplate[] {
	// Handle SSR context (no window)
	if (typeof window === 'undefined') {
		return [];
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);

		// Return empty array if nothing stored or empty string
		if (!stored) {
			return [];
		}

		// Parse stored templates
		const parsed = JSON.parse(stored);

		// Validate that parsed value is an array
		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed;
	} catch (error) {
		// Return empty array on any error (JSON parse error, etc.)
		return [];
	}
}

/**
 * Save custom templates to localStorage.
 * Handles SSR context gracefully.
 */
function saveToLocalStorage(templates: RelationshipTemplate[]): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
	}
}

/**
 * Generate a unique ID for a custom template.
 * Uses timestamp-based approach to ensure uniqueness.
 */
function generateId(): string {
	return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save a new custom template.
 * Generates ID and sets isBuiltIn to false automatically.
 * Appends to existing custom templates.
 */
export function saveCustomTemplate(input: CreateRelationshipTemplateInput): RelationshipTemplate {
	// Get existing templates (handles corrupted data)
	const existing = getCustomTemplates();

	// Create new template with generated ID and isBuiltIn=false
	const newTemplate: RelationshipTemplate = {
		...input,
		id: generateId(),
		isBuiltIn: false
	};

	// Append to existing templates
	const updated = [...existing, newTemplate];

	// Persist to localStorage
	saveToLocalStorage(updated);

	return newTemplate;
}

/**
 * Update an existing custom template by ID.
 * Returns updated template if found, undefined if not found.
 * Does not allow modifying ID or isBuiltIn fields.
 */
export function updateCustomTemplate(
	id: string,
	updates: UpdateRelationshipTemplateInput
): RelationshipTemplate | undefined {
	// Get existing templates (handles corrupted data)
	const existing = getCustomTemplates();

	// Find template index
	const index = existing.findIndex((t) => t.id === id);

	if (index === -1) {
		return undefined;
	}

	// Apply updates while preserving id and isBuiltIn
	const updated: RelationshipTemplate = {
		...existing[index],
		...updates,
		id: existing[index].id, // Preserve ID
		isBuiltIn: existing[index].isBuiltIn // Preserve isBuiltIn
	};

	// Replace in array
	const newTemplates = [...existing];
	newTemplates[index] = updated;

	// Persist to localStorage
	saveToLocalStorage(newTemplates);

	return updated;
}

/**
 * Delete a custom template by ID.
 * Returns true if deleted, false if not found.
 */
export function deleteCustomTemplate(id: string): boolean {
	// Get existing templates (handles corrupted data)
	const existing = getCustomTemplates();

	// Find template
	const index = existing.findIndex((t) => t.id === id);

	if (index === -1) {
		return false;
	}

	// Remove from array
	const updated = existing.filter((t) => t.id !== id);

	// Persist to localStorage
	saveToLocalStorage(updated);

	return true;
}

/**
 * Get all templates (built-in + custom).
 * Returns merged array with no duplicates.
 */
export function getAllTemplates(): RelationshipTemplate[] {
	const custom = getCustomTemplates();
	return [...BUILT_IN_RELATIONSHIP_TEMPLATES, ...custom];
}

/**
 * Get templates grouped by category.
 * Returns a Map with category names as keys and arrays of templates as values.
 * Templates without a category are placed in 'Uncategorized'.
 */
export function getTemplatesByCategory(): Map<string, RelationshipTemplate[]> {
	const all = getAllTemplates();
	const byCategory = new Map<string, RelationshipTemplate[]>();

	for (const template of all) {
		const category = template.category || 'Uncategorized';

		if (!byCategory.has(category)) {
			byCategory.set(category, []);
		}

		byCategory.get(category)!.push(template);
	}

	return byCategory;
}

/**
 * Reset all custom templates.
 * Removes the localStorage key entirely.
 */
export function resetCustomTemplates(): void {
	if (typeof window !== 'undefined') {
		localStorage.removeItem(STORAGE_KEY);
	}
}
