<script lang="ts">
	import { Trash2, MessageSquare } from 'lucide-svelte';
	import type { ConversationWithMetadata } from '$lib/types';

	interface Props {
		conversation: ConversationWithMetadata;
		isActive: boolean;
		onSelect: (id: string) => void;
		onRename: (id: string, name: string) => void;
		onDelete: (id: string) => void;
	}

	let { conversation, isActive, onSelect, onRename, onDelete }: Props = $props();

	let isEditing = $state(false);
	let editValue = $state('');

	// Format relative time (e.g., "2 hours ago")
	function formatRelativeTime(date: Date | undefined): string {
		if (!date) return '';

		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (seconds < 60) return 'just now';
		if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
		if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
		if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

		return date.toLocaleDateString();
	}

	function handleClick() {
		if (!isEditing) {
			onSelect(conversation.id);
		}
	}

	function handleDoubleClick() {
		startEditing();
	}

	function startEditing() {
		isEditing = true;
		editValue = conversation.name;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isEditing) {
			onSelect(conversation.id);
		}
	}

	function handleEditKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			saveEdit();
		} else if (e.key === 'Escape') {
			cancelEdit();
		}
	}

	function saveEdit() {
		const trimmed = editValue.trim();
		if (trimmed && trimmed !== conversation.name) {
			onRename(conversation.id, trimmed);
		}
		isEditing = false;
	}

	function cancelEdit() {
		isEditing = false;
		editValue = conversation.name;
	}

	function handleDelete(e: Event) {
		e.stopPropagation();
		if (confirm(`Delete conversation "${conversation.name}"? This will also delete all messages in this conversation.`)) {
			onDelete(conversation.id);
		}
	}

	const relativeTime = $derived(formatRelativeTime(conversation.lastMessageTime));
</script>

<li
	data-active={isActive}
	class="group relative px-3 py-2 rounded-lg transition-colors
		{isActive
			? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
			: 'hover:bg-slate-50 dark:hover:bg-slate-700'}"
>
	<div class="flex items-start gap-2">
		<!-- Icon -->
		<div class="flex-shrink-0 mt-1">
			<MessageSquare class="w-4 h-4 text-slate-400 dark:text-slate-500" />
		</div>

		<!-- Content -->
		<div
			class="flex-1 min-w-0 cursor-pointer"
			onclick={handleClick}
			ondblclick={handleDoubleClick}
			onkeydown={handleKeyDown}
			role="button"
			tabindex="0"
			aria-label="{conversation.name}, {conversation.messageCount} messages, {relativeTime}"
		>
			{#if isEditing}
				<input
					type="text"
					bind:value={editValue}
					onkeydown={handleEditKeyDown}
					onblur={saveEdit}
					class="w-full px-2 py-1 text-sm font-medium bg-white dark:bg-slate-800 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
					autofocus
				/>
			{:else}
				<span class="text-sm font-medium text-slate-900 dark:text-white truncate block">
					{conversation.name}
				</span>
			{/if}

			<!-- Metadata -->
			<div class="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
				<!-- Message count -->
				<span class="flex items-center gap-1">
					<span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
						{conversation.messageCount}
					</span>
					<span class="sr-only">messages</span>
				</span>

				<!-- Last message time -->
				{#if relativeTime}
					<span class="text-xs">•</span>
					<span>{relativeTime}</span>
				{/if}
			</div>
		</div>

		<!-- Delete button (visible on hover or when active) - outside clickable area -->
		{#if !isEditing}
			<button
				type="button"
				onclick={handleDelete}
				class="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
				title="Delete conversation"
				aria-label="Delete conversation"
			>
				<Trash2 class="w-3.5 h-3.5" />
			</button>
		{/if}
	</div>
</li>

<style>
	[role="button"]:focus {
		outline: 2px solid rgb(59 130 246 / 0.5);
		outline-offset: 2px;
	}
</style>
