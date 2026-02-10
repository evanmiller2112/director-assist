<script lang="ts">
	import { User, Bot } from 'lucide-svelte';
	import type { ChatMessage } from '$lib/types';
	import type { ParsedEntity } from '$lib/services/entityParserService';
	import type { BaseEntity } from '$lib/types';
	import { parseAIResponse } from '$lib/services/entityParserService';
	import EntityDetectionIndicator from './EntityDetectionIndicator.svelte';
	import { extractMentionTokens, matchEntitiesToMentions } from '$lib/services/mentionDetectionService';
	import { entityRepository } from '$lib/db/repositories/entityRepository';

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

	// Extract mentions and match to entities
	let contextEntities = $state<BaseEntity[]>([]);
	let renderedContent = $state<string>('');

	// Helper to extract entity name from ID (e.g., "entity-gandalf-123" -> "Gandalf")
	function extractNameFromEntityId(entityId: string): string {
		// Pattern: entity-{name}-{id}
		const match = entityId.match(/^entity-(.+)-\d+$/);
		if (match) {
			// Capitalize first letter of each word
			return match[1]
				.split('-')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');
		}
		return entityId;
	}

	$effect(() => {
		// Extract mention tokens (synchronous)
		const tokens = extractMentionTokens(message.content);

		// Start with empty entities, will be populated async
		let entities: BaseEntity[] = [];
		let entityStubs: Array<{ id: string; name: string; type: string }> = [];

		// Async operation to fetch entities
		const loadEntities = async () => {
			if (message.contextEntities && message.contextEntities.length > 0) {
				entities = await entityRepository.getByIds(message.contextEntities);
				contextEntities = entities;

				// Build entity stubs from fetched entities
				entityStubs = entities.map(e => ({
					id: e.id,
					name: e.name,
					type: e.type
				}));
			} else {
				contextEntities = [];
				entityStubs = [];
			}

			// Re-render with entity linking
			renderWithMentions(tokens, entityStubs);
		};

		// Helper function to render content with mentions
		function renderWithMentions(
			mentionTokens: typeof tokens,
			entities: typeof entityStubs
		) {
			if (mentionTokens.length === 0) {
				renderedContent = message.content;
				return;
			}

			// Match mentions to entities
			const matches = matchEntitiesToMentions(mentionTokens, entities);

			let result = '';
			let lastIndex = 0;

			// Sort tokens by start index to process in order
			const sortedTokens = [...mentionTokens].sort((a, b) => a.startIndex - b.startIndex);

			for (const token of sortedTokens) {
				// Add text before mention
				result += message.content.substring(lastIndex, token.startIndex);

				// Find matching entity
				const match = matches.find(m =>
					m.entityName.toLowerCase() === token.name.toLowerCase()
				);

				// Build mention span
				const classes = ['mention'];
				let dataAttrs = `data-testid="mention-${token.name}"`;

				if (match) {
					classes.push('mention-linked', 'cursor-pointer');
					dataAttrs += ` data-entity-id="${match.entityId}"`;
				}

				const mentionText = message.content.substring(token.startIndex, token.endIndex);
				result += `<span class="${classes.join(' ')}" ${dataAttrs}>${mentionText}</span>`;

				lastIndex = token.endIndex;
			}

			// Add remaining text
			result += message.content.substring(lastIndex);
			renderedContent = result;
		}

		// For messages with contextEntities, create stub entities from IDs
		// This allows matching even before async load completes
		if (message.contextEntities && message.contextEntities.length > 0) {
			entityStubs = message.contextEntities.map(id => ({
				id,
				name: extractNameFromEntityId(id),
				type: 'unknown'
			}));
		}

		// Render immediately with mentions and entity stubs
		renderWithMentions(tokens, entityStubs);

		// Load actual entities asynchronously and re-render if needed
		loadEntities();
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
			<p class="whitespace-pre-wrap break-words {isUser ? '' : 'text-left'}">
				{@html renderedContent}
			</p>
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

<style>
	:global(.mention) {
		background-color: rgba(59, 130, 246, 0.1);
		font-weight: 500;
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
	}

	:global(.mention-linked) {
		background-color: rgba(59, 130, 246, 0.2);
		border-bottom: 1px dotted rgba(59, 130, 246, 0.5);
	}

	:global(.mention-linked:hover) {
		background-color: rgba(59, 130, 246, 0.3);
	}

	/* For dark mode */
	:global(.dark .mention) {
		background-color: rgba(59, 130, 246, 0.15);
	}

	:global(.dark .mention-linked) {
		background-color: rgba(59, 130, 246, 0.25);
		border-bottom-color: rgba(59, 130, 246, 0.6);
	}

	:global(.dark .mention-linked:hover) {
		background-color: rgba(59, 130, 246, 0.35);
	}
</style>
