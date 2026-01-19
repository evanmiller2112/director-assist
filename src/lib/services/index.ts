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

// Relationship context settings service
export {
	getRelationshipContextSettings,
	setRelationshipContextSettings,
	resetRelationshipContextSettings,
	DEFAULT_RELATIONSHIP_CONTEXT_SETTINGS
} from './relationshipContextSettingsService';
export type { RelationshipContextSettings } from './relationshipContextSettingsService';
