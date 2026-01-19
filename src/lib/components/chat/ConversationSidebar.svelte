<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, MessageSquare } from 'lucide-svelte';
	import { conversationStore, chatStore } from '$lib/stores';
	import ConversationListItem from './ConversationListItem.svelte';

	const conversations = $derived(conversationStore.conversations);
	const activeConversationId = $derived(conversationStore.activeConversationId);
	const isLoading = $derived(conversationStore.isLoading);

	onMount(() => {
		conversationStore.load();
	});

	async function handleNewConversation() {
		await conversationStore.create();
	}

	async function handleSelectConversation(id: string) {
		await conversationStore.setActive(id);
		await chatStore.switchConversation(id);
	}

	async function handleRenameConversation(id: string, name: string) {
		await conversationStore.rename(id, name);
	}

	async function handleDeleteConversation(id: string) {
		await conversationStore.delete(id);
	}
</script>

<div class="flex flex-col h-full border-b border-slate-200 dark:border-slate-700">
	<!-- Header with New Conversation button -->
	<div class="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
		<button
			type="button"
			onclick={handleNewConversation}
			class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
			disabled={isLoading}
		>
			<Plus class="w-4 h-4" />
			New Conversation
		</button>
	</div>

	<!-- Conversation List -->
	<div class="flex-1 overflow-y-auto">
		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<div class="text-sm text-slate-400 dark:text-slate-500">
					Loading conversations...
				</div>
			</div>
		{:else if conversations.length === 0}
			<!-- Empty State -->
			<div class="flex flex-col items-center justify-center py-8 px-4 text-center">
				<MessageSquare class="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
				<h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					No conversations yet
				</h3>
				<p class="text-xs text-slate-500 dark:text-slate-400">
					Create your first conversation to get started
				</p>
			</div>
		{:else}
			<!-- Conversation List -->
			<ul role="list" class="p-2 space-y-1">
				{#each conversations as conversation (conversation.id)}
					<ConversationListItem
						{conversation}
						isActive={conversation.id === activeConversationId}
						onSelect={handleSelectConversation}
						onRename={handleRenameConversation}
						onDelete={handleDeleteConversation}
					/>
				{/each}
			</ul>
		{/if}
	</div>
</div>
