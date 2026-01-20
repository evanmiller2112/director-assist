// Summary generation service
export { generateSummary, hasApiKey } from './summaryService';
export type { SummaryGenerationResult } from './summaryService';

// Chat service
export { sendChatMessage, hasChatApiKey } from './chatService';

// Entity generation service
export { generateEntity, hasGenerationApiKey } from './entityGenerationService';
export type { GenerationContext, GeneratedEntity, GenerationResult } from './entityGenerationService';

// Context builder for chat AI
export { buildContext, formatContextForPrompt, formatContextEntry, getContextStats } from './contextBuilder';
export type { ContextOptions, EntityContext, BuiltContext } from './contextBuilder';

// Relationship context builder
export {
	buildRelationshipContext,
	formatRelatedEntityEntry,
	formatRelationshipContextForPrompt,
	getRelationshipContextStats,
	buildPrivacySafeSummary
} from './relationshipContextBuilder';
export type {
	RelationshipContextOptions,
	RelatedEntityContext,
	RelationshipContext,
	RelationshipContextStats
} from './relationshipContextBuilder';

// Relationship summary generation service
export {
	generateRelationshipSummary,
	generateRelationshipSummariesBatch,
	hasRelationshipSummaryApiKey
} from './relationshipSummaryService';
export type {
	RelationshipSummaryResult,
	RelationshipSummaryBatchResult,
	RelationshipSummaryContext
} from './relationshipSummaryService';

// Relationship summary caching service
export { relationshipSummaryCacheService } from './relationshipSummaryCacheService';
export type { CachedRelationshipSummaryResult } from './relationshipSummaryCacheService';

// Model management service
export {
	fetchModels,
	clearModelsCache,
	getSelectedModel,
	setSelectedModel,
	getFallbackModels,
	extractDateFromModelId,
	findLatestHaikuModel
} from './modelService';

// Field generation service
export {
	generateField,
	generateSummaryContent,
	generateDescriptionContent,
	isGeneratableField
} from './fieldGenerationService';
export type {
	FieldGenerationContext,
	FieldGenerationResult,
	CoreFieldGenerationContext
} from './fieldGenerationService';

// Relationship context settings service
export {
	getRelationshipContextSettings,
	setRelationshipContextSettings,
	resetRelationshipContextSettings,
	DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS
} from './relationshipContextSettingsService';
export type { RelationshipContextSettings } from './relationshipContextSettingsService';

// Field relationship context service
export { buildFieldRelationshipContext } from './fieldRelationshipContextService';
export type {
	FieldRelationshipContextOptions,
	FieldRelationshipContextResult,
	FieldRelationshipContextReason
} from './fieldRelationshipContextService';

// Sidebar order service
export {
	getSidebarEntityTypeOrder,
	setSidebarEntityTypeOrder,
	resetSidebarEntityTypeOrder,
	getDefaultOrder
} from './sidebarOrderService';

// Backup reminder service
export {
	getLastExportedAt,
	setLastExportedAt,
	getLastBackupPromptDismissedAt,
	setLastBackupPromptDismissedAt,
	getLastMilestoneReached,
	setLastMilestoneReached,
	shouldShowBackupReminder,
	getNextMilestone,
	getDaysSinceExport
} from './backupReminderService';

// AI setup reminder service
export {
	isAiSetupDismissed,
	setAiSetupDismissed,
	hasAnyApiKey,
	shouldShowAiSetupBanner
} from './aiSetupReminderService';
