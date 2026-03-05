/**
 * Backup Date Rehydration Service
 *
 * After JSON.parse, all Date objects in a backup file become ISO strings.
 * Any code that later calls .toISOString() on those strings throws a TypeError.
 * This utility walks the raw parsed backup object and converts every date field
 * back to a real Date object before the data is stored or used.
 *
 * Design principles:
 * - Does NOT mutate the input — returns a new object at every level it modifies
 * - Idempotent — if a field is already a Date, it passes through unchanged
 * - Optional fields that are absent remain absent (not coerced to undefined)
 * - No Valibot schemas — just straightforward structural mapping
 */

import type { CampaignBackup } from '$lib/types';

// ---------------------------------------------------------------------------
// Core helper
// ---------------------------------------------------------------------------

/**
 * Converts a value to a Date.
 * - If already a Date, returns it as-is (idempotency).
 * - If a string, parses it via the Date constructor.
 */
function toDate(value: Date | string): Date {
	if (value instanceof Date) {
		return value;
	}
	return new Date(value);
}

// ---------------------------------------------------------------------------
// Per-collection rehydrators
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateEntityLink(link: any): any {
	const result = { ...link };
	if ('createdAt' in link && link.createdAt !== undefined) {
		result.createdAt = toDate(link.createdAt);
	}
	if ('updatedAt' in link && link.updatedAt !== undefined) {
		result.updatedAt = toDate(link.updatedAt);
	}
	return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateEntity(entity: any): any {
	return {
		...entity,
		createdAt: toDate(entity.createdAt),
		updatedAt: toDate(entity.updatedAt),
		links: Array.isArray(entity.links) ? entity.links.map(rehydrateEntityLink) : entity.links
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateChatMessage(msg: any): any {
	return {
		...msg,
		timestamp: toDate(msg.timestamp)
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateNegotiationArgument(arg: any): any {
	return {
		...arg,
		createdAt: toDate(arg.createdAt)
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateNegotiationSession(session: any): any {
	const result = {
		...session,
		createdAt: toDate(session.createdAt),
		updatedAt: toDate(session.updatedAt),
		arguments: Array.isArray(session.arguments)
			? session.arguments.map(rehydrateNegotiationArgument)
			: session.arguments
	};
	if ('completedAt' in session && session.completedAt !== undefined) {
		result.completedAt = toDate(session.completedAt);
	}
	return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateCombatLogEntry(entry: any): any {
	return {
		...entry,
		timestamp: toDate(entry.timestamp)
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateCombatSession(session: any): any {
	return {
		...session,
		createdAt: toDate(session.createdAt),
		updatedAt: toDate(session.updatedAt),
		log: Array.isArray(session.log) ? session.log.map(rehydrateCombatLogEntry) : session.log
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateMontageSession(session: any): any {
	const result = {
		...session,
		createdAt: toDate(session.createdAt),
		updatedAt: toDate(session.updatedAt)
	};
	if ('completedAt' in session && session.completedAt !== undefined) {
		result.completedAt = toDate(session.completedAt);
	}
	return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateKitSwap(swap: any): any {
	return {
		...swap,
		createdAt: toDate(swap.createdAt)
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rehydrateRespiteSession(session: any): any {
	const result = {
		...session,
		createdAt: toDate(session.createdAt),
		updatedAt: toDate(session.updatedAt),
		kitSwaps: Array.isArray(session.kitSwaps)
			? session.kitSwaps.map(rehydrateKitSwap)
			: session.kitSwaps
	};
	if ('completedAt' in session && session.completedAt !== undefined) {
		result.completedAt = toDate(session.completedAt);
	}
	return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Takes a raw object produced by JSON.parse of a backup file and returns a
 * new object with every date field converted from ISO string to Date.
 *
 * The input is typed as `unknown` to make clear this comes from untrusted
 * JSON. The return type matches CampaignBackup so callers get full type safety
 * after rehydration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rehydrateBackupDates(raw: any): CampaignBackup {
	const backup = { ...raw };

	// Top-level date
	backup.exportedAt = toDate(raw.exportedAt);

	// entities[] — always present per CampaignBackup shape
	if (Array.isArray(raw.entities)) {
		backup.entities = raw.entities.map(rehydrateEntity);
	}

	// chatHistory[] — always present per CampaignBackup shape
	if (Array.isArray(raw.chatHistory)) {
		backup.chatHistory = raw.chatHistory.map(rehydrateChatMessage);
	}

	// Optional session collections — preserve absent as absent (not undefined)
	if ('negotiationSessions' in raw) {
		backup.negotiationSessions = Array.isArray(raw.negotiationSessions)
			? raw.negotiationSessions.map(rehydrateNegotiationSession)
			: raw.negotiationSessions;
	}

	if ('combatSessions' in raw) {
		backup.combatSessions = Array.isArray(raw.combatSessions)
			? raw.combatSessions.map(rehydrateCombatSession)
			: raw.combatSessions;
	}

	if ('montageSessions' in raw) {
		backup.montageSessions = Array.isArray(raw.montageSessions)
			? raw.montageSessions.map(rehydrateMontageSession)
			: raw.montageSessions;
	}

	if ('respiteSessions' in raw) {
		backup.respiteSessions = Array.isArray(raw.respiteSessions)
			? raw.respiteSessions.map(rehydrateRespiteSession)
			: raw.respiteSessions;
	}

	return backup as CampaignBackup;
}
