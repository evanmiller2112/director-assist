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

// Model management service
export {
	fetchModels,
	clearModelsCache,
	getSelectedModel,
	setSelectedModel,
	getFallbackModels
} from './modelService';
