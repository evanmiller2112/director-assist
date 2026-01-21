<script lang="ts">
	import { debugStore } from '$lib/stores';
	import { ChevronDown, ChevronRight, Trash2, Clock, AlertCircle, Send, MessageSquare } from 'lucide-svelte';
	import type { DebugEntry } from '$lib/types/debug';

	const entries = $derived(debugStore.entries);
	const isExpanded = $derived(debugStore.isExpanded);

	let expandedEntries = $state<Set<string>>(new Set());

	function toggleEntry(entryId: string) {
		const newSet = new Set(expandedEntries);
		if (newSet.has(entryId)) {
			newSet.delete(entryId);
		} else {
			newSet.add(entryId);
		}
		expandedEntries = newSet;
	}

	function formatTimestamp(date: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		}).format(date);
	}

	function getEntryIcon(type: DebugEntry['type']) {
		switch (type) {
			case 'request':
				return Send;
			case 'response':
				return MessageSquare;
			case 'error':
				return AlertCircle;
		}
	}

	function getEntryColor(type: DebugEntry['type']) {
		switch (type) {
			case 'request':
				return 'text-blue-600 dark:text-blue-400';
			case 'response':
				return 'text-green-600 dark:text-green-400';
			case 'error':
				return 'text-red-600 dark:text-red-400';
		}
	}
</script>

<div class="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
	<!-- Header -->
	<button
		class="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
		onclick={() => debugStore.toggleExpanded()}
		aria-expanded={isExpanded}
	>
		<div class="flex items-center gap-2">
			{#if isExpanded}
				<ChevronDown class="w-4 h-4 text-slate-500" />
			{:else}
				<ChevronRight class="w-4 h-4 text-slate-500" />
			{/if}
			<span class="font-medium text-slate-700 dark:text-slate-300">Debug Console</span>
			<span class="text-xs text-slate-500 dark:text-slate-400">({entries.length})</span>
		</div>
		{#if entries.length > 0}
			<span
				class="btn-icon-sm text-slate-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
				onclick={(e) => {
					e.stopPropagation();
					debugStore.clearEntries();
					expandedEntries = new Set();
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.stopPropagation();
						debugStore.clearEntries();
						expandedEntries = new Set();
					}
				}}
				role="button"
				tabindex="0"
				title="Clear all entries"
			>
				<Trash2 class="w-4 h-4" />
			</span>
		{/if}
	</button>

	<!-- Entries List -->
	{#if isExpanded}
		<div class="max-h-96 overflow-y-auto border-t border-slate-200 dark:border-slate-700">
			{#if entries.length === 0}
				<div class="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
					No debug entries yet. AI requests and responses will appear here.
				</div>
			{:else}
				<div class="divide-y divide-slate-200 dark:divide-slate-700">
					{#each entries as entry (entry.id)}
						{@const Icon = getEntryIcon(entry.type)}
						{@const colorClass = getEntryColor(entry.type)}
						{@const isEntryExpanded = expandedEntries.has(entry.id)}

						<div class="bg-white dark:bg-slate-800">
							<!-- Entry Header -->
							<button
								class="w-full flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
								onclick={() => toggleEntry(entry.id)}
							>
								<Icon class="w-4 h-4 mt-0.5 {colorClass}" />
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="font-medium text-sm {colorClass} capitalize">{entry.type}</span>
										<span class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
											<Clock class="w-3 h-3" />
											{formatTimestamp(entry.timestamp)}
										</span>
									</div>
									{#if entry.type === 'request' && entry.request}
										<p class="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
											{entry.request.userMessage}
										</p>
									{:else if entry.type === 'response' && entry.response}
										<p class="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
											{entry.response.content.substring(0, 100)}...
										</p>
									{:else if entry.type === 'error' && entry.error}
										<p class="text-xs text-red-600 dark:text-red-400 truncate mt-1">
											{entry.error.message}
										</p>
									{/if}
								</div>
								{#if isEntryExpanded}
									<ChevronDown class="w-4 h-4 text-slate-400" />
								{:else}
									<ChevronRight class="w-4 h-4 text-slate-400" />
								{/if}
							</button>

							<!-- Entry Details -->
							{#if isEntryExpanded}
								<div class="px-3 pb-3 space-y-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
									{#if entry.type === 'request' && entry.request}
										<div class="mt-2">
											<h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">User Message</h4>
											<div class="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded whitespace-pre-wrap break-words">
												{entry.request.userMessage}
											</div>
										</div>

										<div>
											<h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Model</h4>
											<div class="text-xs text-slate-600 dark:text-slate-400">
												{entry.request.model}
											</div>
										</div>

										<div>
											<h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Context</h4>
											<div class="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded">
												<div>Entities: {entry.request.contextData.entityCount}</div>
												<div>Total Characters: {entry.request.contextData.totalCharacters}</div>
												<div>Truncated: {entry.request.contextData.truncated ? 'Yes' : 'No'}</div>
												{#if entry.request.contextData.entities.length > 0}
													<div class="mt-1">
														<div class="font-semibold">Included Entities:</div>
														<ul class="list-disc list-inside ml-2">
															{#each entry.request.contextData.entities as entity}
																<li>{entity.name} ({entity.type}) - {entity.summaryLength} chars</li>
															{/each}
														</ul>
													</div>
												{/if}
											</div>
										</div>

										{#if entry.request.conversationHistory.length > 0}
											<div>
												<h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
													Conversation History ({entry.request.conversationHistory.length} messages)
												</h4>
												<div class="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded max-h-40 overflow-y-auto">
													{#each entry.request.conversationHistory as msg}
														<div class="mb-2">
															<span class="font-semibold capitalize">{msg.role}:</span>
															<span class="whitespace-pre-wrap break-words">{msg.content.substring(0, 100)}{msg.content.length > 100 ? '...' : ''}</span>
														</div>
													{/each}
												</div>
											</div>
										{/if}

										<div>
											<h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">System Prompt</h4>
											<div class="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
												{entry.request.systemPrompt}
											</div>
										</div>
									{:else if entry.type === 'response' && entry.response}
										<div class="mt-2">
											<h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Response Content</h4>
											<div class="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded max-h-60 overflow-y-auto whitespace-pre-wrap break-words">
												{entry.response.content}
											</div>
										</div>

										{#if entry.response.tokenUsage}
											<div>
												<h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Token Usage</h4>
												<div class="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-2 rounded">
													<div>Prompt Tokens: {entry.response.tokenUsage.promptTokens}</div>
													<div>Completion Tokens: {entry.response.tokenUsage.completionTokens}</div>
													<div>Total Tokens: {entry.response.tokenUsage.totalTokens}</div>
												</div>
											</div>
										{/if}

										<div>
											<h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration</h4>
											<div class="text-xs text-slate-600 dark:text-slate-400">
												{entry.response.durationMs}ms
											</div>
										</div>
									{:else if entry.type === 'error' && entry.error}
										<div class="mt-2">
											<h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Error Message</h4>
											<div class="text-xs text-red-600 dark:text-red-400 bg-white dark:bg-slate-800 p-2 rounded whitespace-pre-wrap break-words">
												{entry.error.message}
											</div>
										</div>

										{#if entry.error.status}
											<div>
												<h4 class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status Code</h4>
												<div class="text-xs text-slate-600 dark:text-slate-400">
													{entry.error.status}
												</div>
											</div>
										{/if}
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
