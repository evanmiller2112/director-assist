/**
 * Valibot Schemas for AppConfig Validation (Issue #504)
 *
 * Runtime validation schemas for AppConfig key-value pairs.
 * These schemas provide validation at the IndexedDB boundary.
 */

import * as v from 'valibot';

// AppConfig schema - simple key-value store
export const AppConfigSchema = v.object({
	key: v.string(),
	value: v.unknown()
});
