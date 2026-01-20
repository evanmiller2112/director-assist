<script lang="ts">
	import { GitBranch, BookOpen, AlertTriangle, Lightbulb, Sparkles, Check, X, Eye } from 'lucide-svelte';
	import type { AISuggestion } from '$lib/types/ai';

	interface Props {
		suggestion: AISuggestion;
		onAccept?: (suggestion: AISuggestion) => void;
		onDismiss?: (suggestion: AISuggestion) => void;
		onViewDetails?: (suggestion: AISuggestion) => void;
	}

	let { suggestion, onAccept, onDismiss, onViewDetails }: Props = $props();

	// Get type icon
	function getTypeIcon(type: string) {
		switch (type) {
			case 'relationship':
				return GitBranch;
			case 'plot_thread':
				return BookOpen;
			case 'inconsistency':
				return AlertTriangle;
			case 'enhancement':
				return Lightbulb;
			case 'recommendation':
				return Sparkles;
			default:
				return Sparkles;
		}
	}

	const TypeIcon = $derived(getTypeIcon(suggestion.type));

	// Get priority level based on relevance score
	const priority = $derived.by(() => {
		if (suggestion.relevanceScore >= 80) return 'high';
		if (suggestion.relevanceScore >= 50) return 'medium';
		return 'low';
	});

	// Get relevance badge classes
	const badgeClasses = $derived.by(() => {
		if (priority === 'high') {
			return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
		}
		if (priority === 'medium') {
			return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
		}
		return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
	});

	// Get border classes
	const borderClasses = $derived.by(() => {
		if (priority === 'high') {
			return 'border-red-300 dark:border-red-700';
		}
		if (priority === 'medium') {
			return 'border-yellow-300 dark:border-yellow-700';
		}
		return 'border-slate-200 dark:border-slate-700';
	});

	// Format relative time
	function formatRelativeTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffMins < 1) return 'just now';
		if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
		if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
		return date.toLocaleDateString();
	}

	const relativeTime = $derived(formatRelativeTime(suggestion.createdAt));

	// Show action buttons only for pending suggestions
	const showActions = $derived(suggestion.status === 'pending');

	// Opacity for non-pending suggestions
	const cardOpacity = $derived(suggestion.status === 'pending' ? '' : 'opacity-60');

	function handleAccept() {
		if (onAccept) {
			onAccept(suggestion);
		}
	}

	function handleDismiss() {
		if (onDismiss) {
			onDismiss(suggestion);
		}
	}

	function handleViewDetails() {
		if (onViewDetails) {
			onViewDetails(suggestion);
		}
	}
</script>

<article
	class="group border rounded-lg p-4 bg-white dark:bg-slate-800 hover:shadow-md transition-all {borderClasses} {cardOpacity}"
>
	<!-- Header with icon and relevance badge -->
	<div class="flex items-start justify-between mb-2">
		<div class="flex items-center gap-2 flex-1 min-w-0">
			<div class="flex-shrink-0">
				<TypeIcon class="w-5 h-5 text-slate-600 dark:text-slate-400" />
			</div>
			<h3 class="text-lg font-semibold text-slate-900 dark:text-white truncate">
				{suggestion.title || ''}
			</h3>
		</div>
		<span
			class="flex-shrink-0 ml-2 inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold {badgeClasses}"
		>
			{suggestion.relevanceScore}
		</span>
	</div>

	<!-- Description -->
	<p class="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-3">
		{suggestion.description || ''}
	</p>

	<!-- Time -->
	<div class="text-xs text-slate-400 dark:text-slate-500 mb-3">
		<time datetime={suggestion.createdAt.toISOString()}>
			{relativeTime}
		</time>
	</div>

	<!-- Action buttons (hover revealed, only for pending) -->
	{#if showActions}
		<div
			class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
		>
			<button
				type="button"
				onclick={handleAccept}
				class="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30"
				aria-label="Accept suggestion"
			>
				<Check class="w-4 h-4" />
				Accept
			</button>
			<button
				type="button"
				onclick={handleDismiss}
				class="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
				aria-label="Dismiss suggestion"
			>
				<X class="w-4 h-4" />
				Dismiss
			</button>
			<button
				type="button"
				onclick={handleViewDetails}
				class="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
				aria-label="View details"
			>
				<Eye class="w-4 h-4" />
				Details
			</button>
		</div>
	{/if}
</article>
