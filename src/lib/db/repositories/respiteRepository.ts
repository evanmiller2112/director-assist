/**
 * Respite Repository
 *
 * Manages respite sessions in IndexedDB for Draw Steel RPG respite tracking.
 *
 * Features:
 * - Respite lifecycle (preparing, active, completed)
 * - Hero management (add, update, remove heroes)
 * - Activity recording and tracking
 * - Victory point to XP conversion
 * - Kit swap recording
 * - Recovery tracking per hero
 */

import { db, ensureDbReady } from '../index';
import { liveQuery, type Observable } from 'dexie';
import { nanoid } from 'nanoid';
import { validateForWrite } from '../validation';
import { RespiteSessionSchema } from '../schemas';
import type {
	RespiteSession,
	RespiteHero,
	KitSwap,
	CreateRespiteInput,
	UpdateRespiteInput
} from '$lib/types/respite';

// ============================================================================
// Helper Functions (Exported for Testing)
// ============================================================================

/**
 * Validate a status transition for respite lifecycle.
 *
 * Valid transitions:
 * - preparing -> active
 * - active -> completed
 */
export function isValidTransition(
	from: RespiteSession['status'],
	to: RespiteSession['status']
): boolean {
	if (from === 'preparing' && to === 'active') return true;
	if (from === 'active' && to === 'completed') return true;
	return false;
}

/**
 * Calculate remaining VP available for conversion.
 */
export function calculateRemainingVP(available: number, converted: number): number {
	return Math.max(0, available - converted);
}

// ============================================================================
// Respite Repository
// ============================================================================

export const respiteRepository = {
	// Export helper functions for testing
	isValidTransition,
	calculateRemainingVP,

	// ========================================================================
	// CRUD Operations
	// ========================================================================

	/**
	 * Get all respite sessions as a live query (reactive).
	 */
	getAll(): Observable<RespiteSession[]> {
		return liveQuery(() => db.respiteSessions.toArray());
	},

	/**
	 * Get single respite session by ID.
	 */
	async getById(id: string): Promise<RespiteSession | undefined> {
		await ensureDbReady();
		return db.respiteSessions.get(id);
	},

	/**
	 * Create a new respite session.
	 * Defaults: status='preparing', victoryPointsConverted=0
	 */
	async create(input: CreateRespiteInput): Promise<RespiteSession> {
		await ensureDbReady();

		const now = new Date();

		// Initialize heroes with gained=0
		const heroes: RespiteHero[] = (input.heroes || []).map((h) => ({
			id: nanoid(),
			name: h.name,
			heroId: h.heroId,
			recoveries: {
				current: h.recoveries.current,
				max: h.recoveries.max,
				gained: 0
			}
		}));

		const respite: RespiteSession = {
			id: nanoid(),
			name: input.name,
			description: input.description,
			status: 'preparing',
			heroes,
			victoryPointsAvailable: input.victoryPointsAvailable ?? 0,
			victoryPointsConverted: 0,
			activityIds: [],
			kitSwaps: [],
			createdAt: now,
			updatedAt: now
		};

		validateForWrite(RespiteSessionSchema, respite, 'Creating respite session');
		await db.respiteSessions.add(JSON.parse(JSON.stringify(respite)));
		return respite;
	},

	/**
	 * Update respite session fields.
	 */
	async update(id: string, input: UpdateRespiteInput): Promise<RespiteSession> {
		await ensureDbReady();

		const respite = await db.respiteSessions.get(id);
		if (!respite) {
			throw new Error(`Respite session ${id} not found`);
		}

		const updated: RespiteSession = {
			...respite,
			...input,
			updatedAt: new Date()
		};

		await db.respiteSessions.put(JSON.parse(JSON.stringify(updated)));
		return updated;
	},

	/**
	 * Delete respite session.
	 */
	async delete(id: string): Promise<void> {
		await ensureDbReady();
		await db.respiteSessions.delete(id);
	},

	/**
	 * Get respite sessions by campaign ID.
	 */
	async getByCampaignId(campaignId: string): Promise<RespiteSession[]> {
		await ensureDbReady();
		const all = await db.respiteSessions.toArray();
		return all.filter((r) => r.campaignId === campaignId);
	},

	/**
	 * Get respite sessions that include a specific character.
	 */
	async getByCharacterId(characterId: string): Promise<RespiteSession[]> {
		await ensureDbReady();
		const all = await db.respiteSessions.toArray();
		return all.filter(
			(r) => r.characterIds && r.characterIds.includes(characterId)
		);
	},

	// ========================================================================
	// Lifecycle Operations
	// ========================================================================

	/**
	 * Start respite (preparing -> active).
	 */
	async startRespite(id: string): Promise<RespiteSession> {
		await ensureDbReady();

		const respite = await db.respiteSessions.get(id);
		if (!respite) {
			throw new Error(`Respite session ${id} not found`);
		}

		if (respite.status === 'active') {
			throw new Error('Respite is already active');
		}

		if (respite.status === 'completed') {
			throw new Error('Cannot start a completed respite');
		}

		const updated: RespiteSession = {
			...respite,
			status: 'active',
			updatedAt: new Date()
		};

		await db.respiteSessions.put(JSON.parse(JSON.stringify(updated)));
		return updated;
	},

	/**
	 * Complete respite (active -> completed).
	 * Creates narrative event (wrapped in try/catch to prevent blocking completion).
	 *
	 * NOTE: The narrative event creation requires activity data. The caller should
	 * load activity entities and pass them to the narrative service if needed.
	 */
	async completeRespite(id: string): Promise<RespiteSession> {
		await ensureDbReady();

		const respite = await db.respiteSessions.get(id);
		if (!respite) {
			throw new Error(`Respite session ${id} not found`);
		}

		if (respite.status !== 'active') {
			throw new Error('Respite is not active');
		}

		const updated: RespiteSession = {
			...respite,
			status: 'completed',
			completedAt: new Date(),
			updatedAt: new Date()
		};

		await db.respiteSessions.put(JSON.parse(JSON.stringify(updated)));

		// NOTE: Narrative event creation moved to service layer where activity entities can be loaded
		// See respiteActivityService for the orchestration

		return updated;
	},

	// ========================================================================
	// Hero Management
	// ========================================================================

	/**
	 * Add a hero to the respite session.
	 * Prevents duplicate heroes by name.
	 */
	async addHero(
		id: string,
		hero: { name: string; heroId?: string; recoveries: { current: number; max: number } }
	): Promise<RespiteSession> {
		await ensureDbReady();

		const respite = await db.respiteSessions.get(id);
		if (!respite) {
			throw new Error(`Respite session ${id} not found`);
		}

		// Check for duplicate hero by name
		const existing = respite.heroes.find(
			(h) => h.name.toLowerCase() === hero.name.toLowerCase()
		);
		if (existing) {
			throw new Error(`Hero "${hero.name}" is already in this respite`);
		}

		const newHero: RespiteHero = {
			id: nanoid(),
			name: hero.name,
			heroId: hero.heroId,
			recoveries: {
				current: hero.recoveries.current,
				max: hero.recoveries.max,
				gained: 0
			}
		};

		const updated: RespiteSession = {
			...respite,
			heroes: [...respite.heroes, newHero],
			updatedAt: new Date()
		};

		await db.respiteSessions.put(JSON.parse(JSON.stringify(updated)));
		return updated;
	},

	/**
	 * Update a hero's data in the respite session.
	 */
	async updateHero(
		id: string,
		heroId: string,
		updates: Partial<Pick<RespiteHero, 'name' | 'recoveries' | 'conditions' | 'notes'>>
	): Promise<RespiteSession> {
		await ensureDbReady();

		const respite = await db.respiteSessions.get(id);
		if (!respite) {
			throw new Error(`Respite session ${id} not found`);
		}

		const heroIndex = respite.heroes.findIndex((h) => h.id === heroId);
		if (heroIndex === -1) {
			throw new Error(`Hero ${heroId} not found in respite`);
		}

		const heroes = [...respite.heroes];
		heroes[heroIndex] = {
			...heroes[heroIndex],
			...updates,
			recoveries: updates.recoveries
				? { ...heroes[heroIndex].recoveries, ...updates.recoveries }
				: heroes[heroIndex].recoveries
		};

		const updated: RespiteSession = {
			...respite,
			heroes,
			updatedAt: new Date()
		};

		await db.respiteSessions.put(JSON.parse(JSON.stringify(updated)));
		return updated;
	},

	/**
	 * Remove a hero from the respite session.
	 */
	async removeHero(id: string, heroId: string): Promise<RespiteSession> {
		await ensureDbReady();

		const respite = await db.respiteSessions.get(id);
		if (!respite) {
			throw new Error(`Respite session ${id} not found`);
		}

		const heroIndex = respite.heroes.findIndex((h) => h.id === heroId);
		if (heroIndex === -1) {
			throw new Error(`Hero ${heroId} not found in respite`);
		}

		const updated: RespiteSession = {
			...respite,
			heroes: respite.heroes.filter((h) => h.id !== heroId),
			updatedAt: new Date()
		};

		await db.respiteSessions.put(JSON.parse(JSON.stringify(updated)));
		return updated;
	},

	// ========================================================================
	// Activity Management
	// ========================================================================

	/**
	 * Add an activity entity ID to the respite's activityIds array.
	 * Used when creating a new activity entity that belongs to this respite.
	 */
	async addActivityId(respiteId: string, activityEntityId: string): Promise<RespiteSession> {
		await ensureDbReady();

		const respite = await db.respiteSessions.get(respiteId);
		if (!respite) {
			throw new Error(`Respite session ${respiteId} not found`);
		}

		// Prevent duplicate activity IDs
		if (respite.activityIds.includes(activityEntityId)) {
			throw new Error(`Activity ${activityEntityId} is already linked to this respite`);
		}

		const updated: RespiteSession = {
			...respite,
			activityIds: [...respite.activityIds, activityEntityId],
			updatedAt: new Date()
		};

		await db.respiteSessions.put(JSON.parse(JSON.stringify(updated)));
		return updated;
	},

	/**
	 * Remove an activity entity ID from the respite's activityIds array.
	 * Used when deleting an activity entity that belongs to this respite.
	 */
	async removeActivityId(respiteId: string, activityEntityId: string): Promise<RespiteSession> {
		await ensureDbReady();

		const respite = await db.respiteSessions.get(respiteId);
		if (!respite) {
			throw new Error(`Respite session ${respiteId} not found`);
		}

		const updated: RespiteSession = {
			...respite,
			activityIds: respite.activityIds.filter((id) => id !== activityEntityId),
			updatedAt: new Date()
		};

		await db.respiteSessions.put(JSON.parse(JSON.stringify(updated)));
		return updated;
	},

	// ========================================================================
	// Victory Point Conversion
	// ========================================================================

	/**
	 * Convert victory points to XP.
	 * Prevents over-conversion (cannot convert more than available).
	 */
	async convertVictoryPoints(id: string, amount: number): Promise<RespiteSession> {
		await ensureDbReady();

		const respite = await db.respiteSessions.get(id);
		if (!respite) {
			throw new Error(`Respite session ${id} not found`);
		}

		if (amount <= 0) {
			throw new Error('Conversion amount must be positive');
		}

		const remaining = calculateRemainingVP(
			respite.victoryPointsAvailable,
			respite.victoryPointsConverted
		);

		if (amount > remaining) {
			throw new Error(
				`Cannot convert ${amount} VP: only ${remaining} VP remaining`
			);
		}

		const updated: RespiteSession = {
			...respite,
			victoryPointsConverted: respite.victoryPointsConverted + amount,
			updatedAt: new Date()
		};

		await db.respiteSessions.put(JSON.parse(JSON.stringify(updated)));
		return updated;
	},

	// ========================================================================
	// Kit Swap Recording
	// ========================================================================

	/**
	 * Record a kit swap for a hero.
	 */
	async recordKitSwap(
		id: string,
		swap: { heroId: string; from: string; to: string; reason?: string }
	): Promise<RespiteSession> {
		await ensureDbReady();

		const respite = await db.respiteSessions.get(id);
		if (!respite) {
			throw new Error(`Respite session ${id} not found`);
		}

		// Validate hero exists in the respite
		const hero = respite.heroes.find((h) => h.id === swap.heroId);
		if (!hero) {
			throw new Error(`Hero ${swap.heroId} not found in respite`);
		}

		const kitSwap: KitSwap = {
			id: nanoid(),
			heroId: swap.heroId,
			from: swap.from,
			to: swap.to,
			reason: swap.reason,
			createdAt: new Date()
		};

		const updated: RespiteSession = {
			...respite,
			kitSwaps: [...respite.kitSwaps, kitSwap],
			updatedAt: new Date()
		};

		await db.respiteSessions.put(JSON.parse(JSON.stringify(updated)));
		return updated;
	}
};
