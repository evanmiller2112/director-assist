/**
 * Type definitions for relationships management page
 * Issue #76 Phase 1: Dedicated Relationships Management Page
 */

/**
 * Filter options for relationships table
 */
export interface RelationshipFilterOptions {
	relationshipType?: string;
	targetEntityType?: string;
	strength?: 'strong' | 'moderate' | 'weak' | 'all';
	searchQuery?: string;
}

/**
 * Sort options for relationships table
 */
export interface RelationshipSortOptions {
	field: 'targetName' | 'relationship' | 'strength' | 'createdAt';
	direction: 'asc' | 'desc';
}

/**
 * Bulk action types for relationships
 */
export interface BulkActionType {
	type: 'delete' | 'updateStrength' | 'addTag';
	payload?: unknown;
}

/**
 * Relationship Template
 * Issue #146: Pre-configured relationship patterns to speed up relationship creation
 */
export interface RelationshipTemplate {
	id: string;
	name: string;
	relationship: string;
	reverseRelationship?: string;
	bidirectional: boolean;
	strength?: 'strong' | 'moderate' | 'weak';
	category?: string;
	description?: string;
	isBuiltIn: boolean;
}

/**
 * Input type for creating a new custom relationship template
 * Omits id and isBuiltIn as these are set by the service
 */
export type CreateRelationshipTemplateInput = Omit<RelationshipTemplate, 'id' | 'isBuiltIn'>;

/**
 * Input type for updating an existing custom relationship template
 * Allows partial updates, omits id and isBuiltIn as these are immutable
 */
export type UpdateRelationshipTemplateInput = Partial<Omit<RelationshipTemplate, 'id' | 'isBuiltIn'>>;
