import type { EntityType, EntityId } from './entities';

export interface RelationshipTimelineEvent {
	id: string;
	eventType: 'created' | 'modified';
	timestamp: Date;
	sourceEntity: { id: string; name: string; type: EntityType };
	targetEntity: { id: string; name: string; type: EntityType };
	relationship: string;
	reverseRelationship?: string;
	bidirectional: boolean;
	strength?: 'strong' | 'moderate' | 'weak';
	notes?: string;
	metadata?: { tags?: string[]; tension?: number; [key: string]: unknown };
	linkCreatedAt?: Date;
	linkUpdatedAt?: Date;
}

export interface TimelineFilterOptions {
	entityId?: string;
	entityType?: EntityType;
	relationshipType?: string;
	strength?: 'strong' | 'moderate' | 'weak' | 'all';
	dateFrom?: Date;
	dateTo?: Date;
	eventType?: 'created' | 'modified' | 'all';
	searchQuery?: string;
}
