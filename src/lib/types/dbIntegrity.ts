/**
 * Database Integrity Types (Issue #511)
 *
 * Types for the database integrity check system that runs on app startup
 * to detect and report potential data corruption or inconsistencies.
 */

export type IntegrityIssueSeverity = 'minor' | 'major';

export type IntegrityCheckType =
	| 'table_existence'
	| 'sample_validation'
	| 'active_campaign'
	| 'referential_integrity';

export interface IntegrityIssue {
	type: IntegrityCheckType;
	severity: IntegrityIssueSeverity;
	message: string;
	details?: Record<string, unknown>;
}

export interface IntegrityCheckResult {
	completed: boolean;
	checkedAt: Date;
	durationMs: number;
	issues: IntegrityIssue[];
	skipped: boolean;
	hasMinorIssues: boolean;
	hasMajorIssues: boolean;
}

export type RecoveryAction = 'repair' | 'export' | 'reset';
