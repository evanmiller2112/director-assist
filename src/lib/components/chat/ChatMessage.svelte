<script lang="ts">
	import { User, Bot } from 'lucide-svelte';
	import type { ChatMessage } from '$lib/types';
	import type { ParsedEntity } from '$lib/services/entityParserService';
	import type { BaseEntity } from '$lib/types';
	import { parseAIResponse } from '$lib/services/entityParserService';
	import EntityDetectionIndicator from './EntityDetectionIndicator.svelte';

	interface Props {
		message: ChatMessage;
	}

	let { message }: Props = $props();

	const isUser = $derived(message.role === 'user');

	// Parse assistant messages for entities
	let parsedEntities = $state<ParsedEntity[]>([]);
	let savedEntityIds = $state<string[]>([]);

	// Only parse assistant messages, not user or system messages
	$effect(() => {
		if (message.role === 'assistant') {
			try {
				const parseResult = parseAIResponse(message.content, {
					minConfidence: 0.6
				});
				parsedEntities = parseResult.entities || [];
			} catch (error) {
				// Silently handle parsing errors - don't crash the UI
				console.error('Error parsing entities from message:', error);
				parsedEntities = [];
			}
		} else {
			parsedEntities = [];
		}
	});

	function formatTime(date: Date): string {
		return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function handleEntitySaved(entity: BaseEntity) {
		// Track saved entity IDs to show "Saved" indicators
		savedEntityIds = [...savedEntityIds, entity.id];
	}
</script>

<div class="flex gap-3 {isUser ? 'flex-row-reverse' : ''}">
	<!-- Avatar -->
	<div
		class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
			{isUser ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'}"
	>
		{#if isUser}
			<User class="w-4 h-4 text-blue-600 dark:text-blue-400" />
		{:else}
			<Bot class="w-4 h-4 text-purple-600 dark:text-purple-400" />
		{/if}
	</div>

	<!-- Message content -->
	<div class="flex-1 min-w-0 {isUser ? 'text-right' : ''}">
		<div
			class="inline-block max-w-[85%] rounded-lg px-4 py-2 text-sm
				{isUser
				? 'bg-blue-600 text-white rounded-br-none'
				: 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'}"
		>
			<p class="whitespace-pre-wrap break-words {isUser ? '' : 'text-left'}">{message.content}</p>
		</div>

		<!-- Entity detection indicator for assistant messages -->
		{#if !isUser && parsedEntities.length > 0}
			<EntityDetectionIndicator
				entities={parsedEntities}
				{savedEntityIds}
				onEntitySaved={handleEntitySaved}
			/>
		{/if}

		<p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
			{formatTime(message.timestamp)}
		</p>
	</div>
</div>
