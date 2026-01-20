<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Send, Trash2, Loader2, Settings } from 'lucide-svelte';
	import { chatStore, uiStore, conversationStore } from '$lib/stores';
	import { hasChatApiKey } from '$lib/services/chatService';
	import ChatMessage from './ChatMessage.svelte';
	import ContextSelector from './ContextSelector.svelte';
	import ConversationSidebar from './ConversationSidebar.svelte';
	import GenerationTypeSelector from './GenerationTypeSelector.svelte';
	import TypeFieldsSelector from './TypeFieldsSelector.svelte';
	import type { GenerationType } from '$lib/types';

	let inputValue = $state('');
	let messagesContainer: HTMLDivElement | undefined = $state();
	let chatPanelElement: HTMLElement | undefined = $state();
	let panelWidth = $state('384px'); // Default width (w-96)
	let panelHeight = $state('100%'); // Default height

	const messages = $derived(chatStore.messages);
	const isLoading = $derived(chatStore.isLoading);
	const error = $derived(chatStore.error);
	const streamingContent = $derived(chatStore.streamingContent);
	const hasApiKey = $derived(hasChatApiKey());

	const conversations = $derived(conversationStore.conversations);
	const conversationsLoading = $derived(conversationStore.isLoading);

	const STORAGE_KEY = 'chat-panel-width';
	const HEIGHT_STORAGE_KEY = 'chat-panel-height';

	onMount(() => {
		conversationStore.load();
		chatStore.load();
		loadSavedWidth();
		loadSavedHeight();

		if (chatPanelElement) {
			// Set up resize observer to detect when user resizes the panel
			const resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const width = entry.contentRect.width;
					const height = entry.contentRect.height;

					if (width > 0) {
						const widthPx = `${width}px`;
						if (widthPx !== panelWidth) {
							panelWidth = widthPx;
							saveWidth(widthPx);
						}
					}

					if (height > 0) {
						const heightPx = `${height}px`;
						if (heightPx !== panelHeight) {
							panelHeight = heightPx;
							saveHeight(heightPx);
						}
					}
				}
			});

			resizeObserver.observe(chatPanelElement);

			// Also listen for the 'resize' event for test compatibility
			const handleResizeEvent = () => {
				const currentWidth = chatPanelElement?.style.width;
				const currentHeight = chatPanelElement?.style.height;

				if (currentWidth && currentWidth !== panelWidth) {
					panelWidth = currentWidth;
					saveWidth(currentWidth);
				}

				if (currentHeight && currentHeight !== panelHeight) {
					panelHeight = currentHeight;
					saveHeight(currentHeight);
				}
			};

			chatPanelElement.addEventListener('resize', handleResizeEvent);

			return () => {
				resizeObserver.disconnect();
				chatPanelElement?.removeEventListener('resize', handleResizeEvent);
			};
		}
	});

	function loadSavedWidth() {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				// Validate the saved value - ensure it's valid CSS width
				const parsed = parseInt(saved, 10);

				// Enforce minimum and maximum constraints
				const MIN_WIDTH = 320;
				const MAX_WIDTH = 800;

				// Only use valid positive numbers
				if (!isNaN(parsed) && parsed > 0) {
					// Enforce minimum and cap at maximum width
					const constrainedWidth = Math.max(MIN_WIDTH, Math.min(parsed, MAX_WIDTH));
					panelWidth = `${constrainedWidth}px`;
				} else if (saved.includes('%')) {
					// Handle percentage values (validate they're positive)
					const percentValue = parseInt(saved, 10);
					if (!isNaN(percentValue) && percentValue > 0) {
						panelWidth = saved;
					}
				}
				// If validation fails, keep default panelWidth (384px)
			}
		} catch (e) {
			// localStorage might not be available, use default
			console.warn('Failed to load saved chat panel width:', e);
		}
	}

	function saveWidth(width: string) {
		try {
			localStorage.setItem(STORAGE_KEY, width);
		} catch (e) {
			// localStorage might not be available, fail silently
			console.warn('Failed to save chat panel width:', e);
		}
	}

	function loadSavedHeight() {
		try {
			const saved = localStorage.getItem(HEIGHT_STORAGE_KEY);
			if (saved) {
				// Validate the saved value - ensure it's valid CSS height
				const parsed = parseInt(saved, 10);

				// Enforce minimum and maximum constraints
				const MIN_HEIGHT = 200;
				const MAX_HEIGHT_VH = 90; // 90vh

				// Only use valid positive numbers
				if (!isNaN(parsed) && parsed > 0) {
					// Enforce minimum
					const constrainedHeight = Math.max(MIN_HEIGHT, parsed);
					panelHeight = `${constrainedHeight}px`;
				} else if (saved.includes('%')) {
					// Handle percentage values (validate they're positive)
					const percentValue = parseInt(saved, 10);
					if (!isNaN(percentValue) && percentValue > 0) {
						panelHeight = saved;
					}
				}
				// If validation fails, keep default panelHeight (100%)
			}
		} catch (e) {
			// localStorage might not be available, use default
			console.warn('Failed to load saved chat panel height:', e);
		}
	}

	function saveHeight(height: string) {
		try {
			localStorage.setItem(HEIGHT_STORAGE_KEY, height);
		} catch (e) {
			// localStorage might not be available, fail silently
			console.warn('Failed to save chat panel height:', e);
		}
	}

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

<aside
	bind:this={chatPanelElement}
	style="width: {panelWidth}; min-width: 320px; max-width: 800px; height: {panelHeight}; min-height: 200px; max-height: 90vh; resize: both; overflow: auto; display: flex; flex-direction: column;"
	class="border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark"
>
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

	<!-- Type-specific fields (e.g., Threat Level, Combat Role for NPCs) -->
	<TypeFieldsSelector
		generationType={chatStore.generationType}
		values={chatStore.typeFieldValues}
		onchange={(key, value) => chatStore.setTypeFieldValue(key, value)}
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
			style="flex: 1; overflow-y: auto; padding: 1rem;"
			class="overflow-y-auto space-y-4"
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
