/**
 * Creature Template Repository
 *
 * Issue #305: Creature Templates for Monsters
 *
 * This repository manages creature templates in IndexedDB, providing:
 * - CRUD operations for creature templates
 * - Search by name and tags
 * - Filter by threat level and role
 * - Duplicate templates
 * - Import/export library functionality
 * - Create templates from combat creatures
 */

import { db, ensureDbReady } from '../index';
import type {
	CreatureTemplate,
	CreateCreatureTemplateInput,
	UpdateCreatureTemplateInput,
	CreatureLibraryExport,
	ImportMode,
	ImportResult
} from '$lib/types/creature';
import type { CreatureCombatant } from '$lib/types/combat';

/**
 * Generate a unique ID for a creature template.
 */
function generateId(): string {
	return `creature-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creature Template Repository
 */
class CreatureRepository {
	/**
	 * Create a new creature template.
	 */
	async create(input: CreateCreatureTemplateInput): Promise<CreatureTemplate> {
		await ensureDbReady();

		const now = new Date();
		const template: CreatureTemplate = {
			id: generateId(),
			...input,
			abilities: input.abilities || [],
			createdAt: now,
			updatedAt: now
		};

		await db.creatureTemplates.add(template);
		return template;
	}

	/**
	 * Get a creature template by ID.
	 */
	async getById(id: string): Promise<CreatureTemplate | undefined> {
		await ensureDbReady();
		return await db.creatureTemplates.get(id);
	}

	/**
	 * Get all creature templates, sorted alphabetically by name.
	 */
	async getAll(): Promise<CreatureTemplate[]> {
		await ensureDbReady();
		return await db.creatureTemplates.orderBy('name').toArray();
	}

	/**
	 * Update a creature template.
	 */
	async update(
		id: string,
		updates: UpdateCreatureTemplateInput
	): Promise<CreatureTemplate | undefined> {
		await ensureDbReady();

		const existing = await db.creatureTemplates.get(id);
		if (!existing) {
			return undefined;
		}

		const updated: CreatureTemplate = {
			...existing,
			...updates,
			id: existing.id, // Preserve ID
			createdAt: existing.createdAt, // Preserve creation timestamp
			updatedAt: new Date() // Update modification timestamp
		};

		await db.creatureTemplates.put(updated);
		return updated;
	}

	/**
	 * Delete a creature template.
	 */
	async delete(id: string): Promise<void> {
		await ensureDbReady();
		await db.creatureTemplates.delete(id);
	}

	/**
	 * Duplicate a creature template with "(Copy)" suffix.
	 */
	async duplicate(id: string): Promise<CreatureTemplate | undefined> {
		await ensureDbReady();

		const original = await db.creatureTemplates.get(id);
		if (!original) {
			return undefined;
		}

		const now = new Date();
		const duplicate: CreatureTemplate = {
			...original,
			id: generateId(),
			name: `${original.name} (Copy)`,
			createdAt: now,
			updatedAt: now
		};

		await db.creatureTemplates.add(duplicate);
		return duplicate;
	}

	/**
	 * Search creature templates by name or tags (case insensitive).
	 * Returns all templates if query is empty.
	 */
	async search(query: string): Promise<CreatureTemplate[]> {
		await ensureDbReady();

		const trimmedQuery = query.trim();

		if (trimmedQuery === '') {
			return await this.getAll();
		}

		const lowerQuery = trimmedQuery.toLowerCase();

		// Search by name or tags
		const allTemplates = await db.creatureTemplates.toArray();
		return allTemplates.filter(
			(template) =>
				template.name.toLowerCase().includes(lowerQuery) ||
				template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
		);
	}

	/**
	 * Get creature templates by threat level.
	 */
	async getByThreat(threat: number): Promise<CreatureTemplate[]> {
		await ensureDbReady();

		if (threat !== 1 && threat !== 2 && threat !== 3) {
			return [];
		}

		return await db.creatureTemplates.where('threat').equals(threat).sortBy('name');
	}

	/**
	 * Get creature templates by role.
	 */
	async getByRole(role: string): Promise<CreatureTemplate[]> {
		await ensureDbReady();

		const allTemplates = await db.creatureTemplates.toArray();
		return allTemplates.filter((template) => template.role === role).sort((a, b) =>
			a.name.localeCompare(b.name)
		);
	}

	/**
	 * Get creature templates by tag.
	 */
	async getByTag(tag: string): Promise<CreatureTemplate[]> {
		await ensureDbReady();

		// Use multi-entry index for efficient tag search
		return await db.creatureTemplates.where('tags').equals(tag).sortBy('name');
	}

	/**
	 * Export all creature templates as a library.
	 */
	async exportLibrary(): Promise<CreatureLibraryExport> {
		await ensureDbReady();

		const templates = await db.creatureTemplates.toArray();

		return {
			version: 1,
			exportedAt: new Date(),
			templates: templates.map(({ id, createdAt, updatedAt, ...rest }) => rest)
		};
	}

	/**
	 * Import a creature library.
	 * @param library - The library to import
	 * @param mode - 'merge' to add new templates, 'replace' to clear and import
	 */
	async importLibrary(library: CreatureLibraryExport, mode: ImportMode): Promise<ImportResult> {
		await ensureDbReady();

		const result: ImportResult = {
			imported: 0,
			skipped: 0,
			errors: []
		};

		// Validate version
		if (library.version !== 1) {
			result.errors.push(`Unsupported library version: ${library.version}`);
			return result;
		}

		// Replace mode: clear existing templates
		if (mode === 'replace') {
			await db.creatureTemplates.clear();
		}

		// Get existing template names for duplicate detection in merge mode
		const existingNames = new Set<string>();
		if (mode === 'merge') {
			const existing = await db.creatureTemplates.toArray();
			existing.forEach((template) => existingNames.add(template.name));
		}

		// Import templates
		for (const templateInput of library.templates) {
			try {
				// Skip duplicates in merge mode
				if (mode === 'merge' && existingNames.has(templateInput.name)) {
					result.skipped++;
					continue;
				}

				// Validate required fields
				if (!templateInput.name || typeof templateInput.hp !== 'number' ||
					typeof templateInput.maxHp !== 'number' || !templateInput.threat) {
					result.errors.push(`Invalid template: ${templateInput.name || 'unnamed'}`);
					result.skipped++;
					continue;
				}

				// Create template
				await this.create(templateInput as CreateCreatureTemplateInput);
				result.imported++;
			} catch (error) {
				result.errors.push(
					`Failed to import "${templateInput.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
				);
			}
		}

		return result;
	}

	/**
	 * Create a creature template from a combat creature.
	 * Useful for saving ad-hoc creatures created during combat.
	 */
	async createFromCombatant(combatant: CreatureCombatant): Promise<CreatureTemplate> {
		await ensureDbReady();

		// Determine maxHp from the combatant
		const maxHp = combatant.maxHp ?? combatant.startingHp ?? combatant.hp;

		const input: CreateCreatureTemplateInput = {
			name: `${combatant.name} (From Combat)`,
			hp: maxHp,
			maxHp: maxHp,
			ac: combatant.ac,
			threat: combatant.threat as 1 | 2 | 3,
			role: 'Brute', // Default role
			tags: [],
			abilities: []
		};

		return await this.create(input);
	}
}

// Export singleton instance
export const creatureRepository = new CreatureRepository();
