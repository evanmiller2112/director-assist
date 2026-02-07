<script lang="ts">
	/**
	 * ArgumentCard Component
	 *
	 * Issue #383: Implement Negotiation UI components (TDD - GREEN phase)
	 *
	 * Displays a single argument in the negotiation history:
	 * - Argument type with icon (Lucide icons)
	 * - Tier with color coding (1=gray, 2=blue, 3=purple)
	 * - Interest/patience deltas with color coding
	 * - Player name if provided
	 * - Notes if provided (preserving whitespace)
	 * - Motivation type if applicable
	 * - Formatted timestamp
	 */

	import { ThumbsUp, XCircle, MessageCircle } from 'lucide-svelte';
	import type { NegotiationArgument } from '$lib/types/negotiation';

	interface Props {
		argument: NegotiationArgument;
	}

	let { argument }: Props = $props();

	// Format motivation type for display
	function formatMotivationType(type: string): string {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	// Format relative time
	function formatRelativeTime(date: Date): string {
		const now = Date.now();
		const diff = now - date.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
		if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
		if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
		return `${days} day${days === 1 ? '' : 's'} ago`;
	}

	// Get tier badge color
	const tierColor = $derived(() => {
		if (argument.tier === 1) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
		if (argument.tier === 2) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
		return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
	});

	// Get card border color based on argument type
	const cardBorderColor = $derived(() => {
		if (argument.type === 'pitfall') return 'border-red-300 dark:border-red-700';
		if (argument.type === 'motivation')
			return 'border-green-300 dark:border-green-700';
		return 'border-blue-300 dark:border-blue-700';
	});

	// Get interest delta color
	const interestDeltaColor = $derived(() => {
		if (argument.interestChange > 0) return 'text-green-600 dark:text-green-400';
		if (argument.interestChange < 0) return 'text-red-600 dark:text-red-400';
		return 'text-gray-500 dark:text-gray-400';
	});

	// Get patience delta color
	const patienceDeltaColor = $derived(() => {
		if (argument.patienceChange > 0) return 'text-green-600 dark:text-green-400';
		if (argument.patienceChange < 0) return 'text-red-600 dark:text-red-400';
		return 'text-gray-500 dark:text-gray-400';
	});

	// Format delta value
	function formatDelta(value: number): string {
		if (value > 0) return `+${value}`;
		return value.toString();
	}

	// Get aria label
	const ariaLabel = $derived(() => {
		const parts: string[] = [];
		parts.push(
			argument.type === 'motivation'
				? 'Motivation'
				: argument.type === 'pitfall'
					? 'Pitfall'
					: 'No Motivation'
		);
		parts.push(`Tier ${argument.tier}`);
		if (argument.motivationType) {
			parts.push(formatMotivationType(argument.motivationType));
		}
		return parts.join(' - ');
	});
</script>

<article
	class="rounded-lg border-2 {cardBorderColor()} bg-white p-4 shadow-sm dark:bg-gray-900"
	aria-label={ariaLabel()}
>
	<div class="flex items-start justify-between gap-3">
		<!-- Icon and Type -->
		<div class="flex items-center gap-2">
			{#if argument.type === 'motivation'}
				<ThumbsUp class="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
				<span class="font-medium">Motivation</span>
			{:else if argument.type === 'pitfall'}
				<XCircle
					class="h-5 w-5 text-red-600 dark:text-red-400 lucide-alert-circle"
					aria-hidden="true"
				/>
				<span class="font-medium">Pitfall</span>
			{:else}
				<MessageCircle class="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
				<span class="font-medium">No Motivation</span>
			{/if}
		</div>

		<!-- Tier Badge -->
		<span
			data-testid="tier-badge"
			class="rounded-full px-3 py-1 text-xs font-semibold {tierColor()}"
		>
			Tier {argument.tier}
		</span>
	</div>

	<!-- Motivation Type (if applicable) -->
	{#if argument.motivationType && (argument.type === 'motivation' || argument.type === 'pitfall')}
		<div class="mt-2">
			<span class="inline-block rounded-md bg-blue-50 px-2 py-1 text-sm dark:bg-blue-900/20">
				{formatMotivationType(argument.motivationType)}
			</span>
		</div>
	{/if}

	<!-- Deltas -->
	<div class="mt-3 flex gap-4 text-sm font-semibold">
		<span data-testid="interest-delta" class={interestDeltaColor()}>
			{formatDelta(argument.interestChange)} Interest
		</span>
		<span data-testid="patience-delta" class={patienceDeltaColor()}>
			{formatDelta(argument.patienceChange)} Patience
		</span>
	</div>

	<!-- Player Name -->
	{#if argument.playerName}
		<div data-testid="player-name" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
			Player: <strong>{argument.playerName}</strong>
		</div>
	{/if}

	<!-- Notes -->
	{#if argument.notes}
		<div
			data-testid="notes"
			class="mt-2 rounded-md bg-gray-50 p-2 text-sm text-gray-700 whitespace-pre-wrap dark:bg-gray-800 dark:text-gray-300"
		>
			{argument.notes}
		</div>
	{/if}

	<!-- Timestamp -->
	<time
		data-testid="timestamp"
		datetime={argument.createdAt.toISOString()}
		class="mt-3 block text-xs text-gray-500 dark:text-gray-400"
	>
		{formatRelativeTime(argument.createdAt)}
	</time>
</article>
