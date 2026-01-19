<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Send, Trash2, Loader2, Settings } from 'lucide-svelte';
	import { chatStore, uiStore, conversationStore } from '$lib/stores';
	import { hasChatApiKey } from '$lib/services/chatService';
	import ChatMessage from './ChatMessage.svelte';
	import ContextSelector from './ContextSelector.svelte';
	import ConversationSidebar from './ConversationSidebar.svelte';
	import GenerationTypeSelector from './GenerationTypeSelector.svelte';
	import type { GenerationType } from '$lib/types';

	let inputValue = $state('');
	let messagesContainer: HTMLDivElement | undefined = $state();

	const messages = $derived(chatStore.messages);
	const isLoading = $derived(chatStore.isLoading);
	const error = $derived(chatStore.error);
	const streamingContent = $derived(chatStore.streamingContent);
	const hasApiKey = $derived(hasChatApiKey());

	const conversations = $derived(conversationStore.conversations);
	const conversationsLoading = $derived(conversationStore.isLoading);

	onMount(() => {
		conversationStore.load();
		chatStore.load();
	});

	// Auto-create default conversation if none exist and loading is complete
	$effect(() => {
		if (!conversationsLoading && conversations.length === 0) {
			conversationStore.create('New Conversation');
		}
	});

	// Auto-scroll to bottom when new messages arrive
	$effect(() => {
		if (messages.length > 0 || streamingContent) {
			scrollToBottom();
		}
	});

	function scrollToBottom() {
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!inputValue.trim() || isLoading) return;

		const message = inputValue;
		inputValue = '';
		await chatStore.sendMessage(message);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	}

	async function handleClear() {
		if (confirm('Clear all chat history?')) {
			await chatStore.clearHistory();
		}
	}
</script>

<aside class="w-96 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark flex flex-col h-full">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white">AI Assistant</h2>
		<div class="flex items-center gap-1">
			{#if messages.length > 0}
				<button
					type="button"
					class="p-1.5 text-slate-400 hover:text-red-500 rounded"
					onclick={handleClear}
					title="Clear history"
				>
					<Trash2 class="w-4 h-4" />
				</button>
			{/if}
			<button
				type="button"
				class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
				onclick={() => uiStore.closeChatPanel()}
				title="Close"
			>
				<X class="w-5 h-5" />
			</button>
		</div>
	</div>

	<!-- Conversation Sidebar -->
	<ConversationSidebar />

	<!-- Context selector -->
	<ContextSelector />

	<!-- Generation type selector -->
	<GenerationTypeSelector
		value={chatStore.generationType}
		onchange={(type) => chatStore.setGenerationType(type)}
		disabled={isLoading}
	/>

	{#if !hasApiKey}
		<!-- No API key state -->
		<div class="flex-1 flex flex-col items-center justify-center p-6 text-center">
			<Settings class="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
			<h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">
				API Key Required
			</h3>
			<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
				Configure your Anthropic API key in Settings to start chatting with the AI assistant.
			</p>
			<a href="/settings" class="btn btn-primary text-sm" onclick={() => uiStore.closeChatPanel()}>
				Go to Settings
			</a>
		</div>
	{:else}
		<!-- Messages -->
		<div
			bind:this={messagesContainer}
			class="flex-1 overflow-y-auto p-4 space-y-4"
		>
			{#if messages.length === 0 && !streamingContent}
				<div class="text-center text-slate-400 dark:text-slate-500 py-8">
					<p class="text-sm">
						Start a conversation with your AI campaign assistant.
					</p>
					<p class="text-xs mt-2">
						Select entities above to provide campaign context.
					</p>
				</div>
			{/if}

			{#each messages as message (message.id)}
				<ChatMessage {message} />
			{/each}

			<!-- Streaming message -->
			{#if streamingContent}
				<ChatMessage
					message={{
						id: 'streaming',
						role: 'assistant',
						content: streamingContent,
						timestamp: new Date()
					}}
				/>
			{/if}

			<!-- Loading indicator (before streaming starts) -->
			{#if isLoading && !streamingContent}
				<div class="flex gap-3">
					<div class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
						<Loader2 class="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
					</div>
					<div class="flex-1">
						<div class="inline-block bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2 rounded-bl-none">
							<span class="text-sm text-slate-500 dark:text-slate-400">Thinking...</span>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Error message -->
		{#if error}
			<div class="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
				<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
			</div>
		{/if}

		<!-- Input -->
		<form
			onsubmit={handleSubmit}
			class="p-4 border-t border-slate-200 dark:border-slate-700"
		>
			<div class="flex gap-2">
				<textarea
					bind:value={inputValue}
					onkeydown={handleKeydown}
					placeholder="Ask about your campaign..."
					class="flex-1 resize-none rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					rows="2"
					disabled={isLoading}
				></textarea>
				<button
					type="submit"
					class="self-end p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={isLoading || !inputValue.trim()}
				>
					{#if isLoading}
						<Loader2 class="w-5 h-5 animate-spin" />
					{:else}
						<Send class="w-5 h-5" />
					{/if}
				</button>
			</div>
		</form>
	{/if}
</aside>
