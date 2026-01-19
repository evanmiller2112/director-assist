import { conversationRepository, appConfigRepository } from '$lib/db/repositories';
import type { Conversation } from '$lib/types';

// Conversation store using Svelte 5 runes
function createConversationStore() {
	let conversations = $state<Conversation[]>([]);
	let activeConversationId = $state<string | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Derived state for active conversation
	const activeConversation = $derived(
		conversations.find((c) => c.id === activeConversationId)
	);

	return {
		get conversations() {
			return conversations;
		},
		get activeConversationId() {
			return activeConversationId;
		},
		get activeConversation() {
			return activeConversation;
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},

		async load() {
			try {
				// Load active conversation ID from appConfig
				const savedActiveId = await appConfigRepository.getActiveConversationId();
				activeConversationId = savedActiveId;

				// Subscribe to live query for conversations
				const observable = conversationRepository.getAll();
				observable.subscribe({
					next: (data) => {
						conversations = data;
						isLoading = false;
					},
					error: (e) => {
						error = e instanceof Error ? e.message : 'Failed to load conversations';
						isLoading = false;
					}
				});
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to load conversations';
				isLoading = false;
			}
		},

		async create(name?: string) {
			try {
				error = null;
				const conversation = await conversationRepository.create(name);
				// Set newly created conversation as active
				activeConversationId = conversation.id;
				await appConfigRepository.setActiveConversationId(conversation.id);
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to create conversation';
			}
		},

		async setActive(id: string | null) {
			try {
				activeConversationId = id;
				if (id === null) {
					await appConfigRepository.clearActiveConversationId();
				} else {
					await appConfigRepository.setActiveConversationId(id);
				}
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to set active conversation';
			}
		},

		async rename(id: string, name: string) {
			try {
				await conversationRepository.update(id, name);
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to rename conversation';
			}
		},

		async delete(id: string) {
			try {
				// Delete conversation and its messages
				await conversationRepository.delete(id, true);

				// If we deleted the active conversation, switch to another one
				if (activeConversationId === id) {
					// Find the index of the deleted conversation
					const deletedIndex = conversations.findIndex((c) => c.id === id);

					// Try to switch to the next conversation, or previous, or none
					let newActiveId: string | null = null;
					if (conversations.length > 1) {
						if (deletedIndex < conversations.length - 1) {
							// Switch to next conversation
							newActiveId = conversations[deletedIndex + 1].id;
						} else if (deletedIndex > 0) {
							// Switch to previous conversation
							newActiveId = conversations[deletedIndex - 1].id;
						}
					}

					activeConversationId = newActiveId;
					if (newActiveId === null) {
						await appConfigRepository.clearActiveConversationId();
					} else {
						await appConfigRepository.setActiveConversationId(newActiveId);
					}
				}
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to delete conversation';
			}
		},

		// Testing helpers
		_setConversations(convs: Conversation[]) {
			conversations = convs;
		},

		_setActiveConversationId(id: string | null) {
			activeConversationId = id;
		},

		_reset() {
			conversations = [];
			activeConversationId = null;
			isLoading = true;
			error = null;
		}
	};
}

export const conversationStore = createConversationStore();
