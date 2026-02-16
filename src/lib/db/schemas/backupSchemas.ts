/**
 * Valibot Schemas for Backup Validation (Issue #504)
 *
 * Runtime validation schemas for CampaignBackup type.
 * These schemas provide validation at the IndexedDB boundary.
 */

import * as v from 'valibot';
import { BaseEntitySchema } from './entitySchemas';
import { ChatMessageSchema } from './aiSchemas';
import { CombatSessionSchema } from './combatSchemas';
import { MontageSessionSchema } from './montageSchemas';
import { NegotiationSessionSchema } from './negotiationSchemas';

// CampaignBackup schema
export const CampaignBackupSchema = v.looseObject({
	version: v.string(),
	exportedAt: v.union([v.date(), v.pipe(v.string(), v.isoTimestamp(), v.transform((s) => new Date(s)))]),
	campaign: v.optional(v.unknown()), // Deprecated, backward compat
	entities: v.array(BaseEntitySchema),
	chatHistory: v.array(ChatMessageSchema),
	activeCampaignId: v.optional(v.string()),
	selectedModel: v.optional(v.string()),
	combatSessions: v.optional(v.array(CombatSessionSchema)),
	montageSessions: v.optional(v.array(MontageSessionSchema)),
	negotiationSessions: v.optional(v.array(NegotiationSessionSchema))
});
