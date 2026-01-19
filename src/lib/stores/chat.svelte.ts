import { chatRepository } from '$lib/db/repositories';
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
				// Subscribe to live query for messages
				const observable = chatRepository.getAll();
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

			isLoading = true;
			error = null;
			streamingContent = '';

			try {
				// Add user message
				await chatRepository.add('user', content.trim(), [...contextEntityIds]);

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

				// Add assistant message
				await chatRepository.add('assistant', response, [...contextEntityIds]);
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
				await chatRepository.clearAll();
				messages = [];
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to clear history';
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
