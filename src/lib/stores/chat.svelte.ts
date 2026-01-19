import { chatRepository } from '$lib/db/repositories';
import { conversationStore } from '$lib/stores';
import { sendChatMessage } from '$lib/services/chatService';
import type { ChatMessage, GenerationType } from '$lib/types';

// Chat store using Svelte 5 runes
function createChatStore() {
	let messages = $state<ChatMessage[]>([]);
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let contextEntityIds = $state<string[]>([]);
	let streamingContent = $state<string>('');
	let includeLinkedEntities = $state(true);
	let generationType = $state<GenerationType>('custom');

	return {
		get messages() {
			return messages;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		get contextEntityIds() {
			return contextEntityIds;
		},
		get streamingContent() {
			return streamingContent;
		},
		get includeLinkedEntities() {
			return includeLinkedEntities;
		},
		get generationType() {
			return generationType;
		},

		async load() {
			try {
				// Check if conversationStore is available and has an active conversation
				const activeConversationId =
					conversationStore && conversationStore.activeConversationId
						? conversationStore.activeConversationId
						: null;

				// Load messages for active conversation, or all if no conversation
				const observable = activeConversationId
					? chatRepository.getByConversation(activeConversationId)
					: chatRepository.getAll();

				observable.subscribe({
					next: (data) => {
						messages = data;
					},
					error: (e) => {
						error = e instanceof Error ? e.message : 'Failed to load messages';
					}
				});
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load messages';
			}
		},

		async sendMessage(content: string): Promise<void> {
			if (!content.trim()) return;

			// Check if conversationStore is available and has an active conversation
			const activeConversationId =
				conversationStore && conversationStore.activeConversationId
					? conversationStore.activeConversationId
					: null;

			// If conversationStore exists and is loaded, require an active conversation
			if (conversationStore && !conversationStore.isLoading && !activeConversationId) {
				error = 'No active conversation';
				return;
			}

			isLoading = true;
			error = null;
			streamingContent = '';

			try {
				// Add user message with conversationId (if available)
				if (activeConversationId) {
					await chatRepository.add(
						'user',
						content.trim(),
						[...contextEntityIds],
						activeConversationId
					);
				} else {
					await chatRepository.add('user', content.trim(), [...contextEntityIds]);
				}

				// Get AI response with streaming
				const response = await sendChatMessage(
					content.trim(),
					contextEntityIds,
					includeLinkedEntities,
					(partial) => {
						streamingContent = partial;
					},
					generationType
				);

				// Add assistant message with same conversationId
				if (activeConversationId) {
					await chatRepository.add(
						'assistant',
						response,
						[...contextEntityIds],
						activeConversationId
					);
				} else {
					await chatRepository.add('assistant', response, [...contextEntityIds]);
				}
				streamingContent = '';
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to send message';
				streamingContent = '';
			} finally {
				isLoading = false;
			}
		},

		async clearHistory(): Promise<void> {
			try {
				const activeConversationId =
					conversationStore && conversationStore.activeConversationId
						? conversationStore.activeConversationId
						: null;

				if (activeConversationId) {
					await chatRepository.clearByConversation(activeConversationId);
				} else {
					await chatRepository.clearAll();
				}
				messages = [];
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to clear history';
			}
		},

		async switchConversation(conversationId: string | null): Promise<void> {
			try {
				streamingContent = '';
				error = null; // Clear any previous errors
				// Load messages for the new conversation
				const observable = conversationId
					? chatRepository.getByConversation(conversationId)
					: chatRepository.getAll();

				observable.subscribe({
					next: (data) => {
						messages = data;
					},
					error: (e) => {
						error = e instanceof Error ? e.message : 'Failed to load messages';
					}
				});
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load messages';
			}
		},

		setContextEntities(ids: string[]) {
			contextEntityIds = ids;
		},

		addContextEntity(id: string) {
			if (!contextEntityIds.includes(id)) {
				contextEntityIds = [...contextEntityIds, id];
			}
		},

		removeContextEntity(id: string) {
			contextEntityIds = contextEntityIds.filter((eid) => eid !== id);
		},

		clearContextEntities() {
			contextEntityIds = [];
		},

		setIncludeLinkedEntities(include: boolean) {
			includeLinkedEntities = include;
		},

		setGenerationType(type: GenerationType) {
			generationType = type;
		}
	};
}

export const chatStore = createChatStore();
