<script lang="ts">
	/**
	 * TimelineEvent Component
	 *
	 * Issue #400: Build Timeline View UI (GREEN phase of TDD)
	 *
	 * Displays a single event in a vertical timeline view, with:
	 * - Event-type-specific icons (Swords, Mountain, Theater, MessageCircle, Milestone)
	 * - Vertical connecting lines (hidden for first/last events)
	 * - View Source button (when sourceId is present)
	 * - Link button (when showLinkButton=true)
	 * - Event-type-specific color styling via data-event-type attribute
	 * - Formatted date display
	 */

	import { Swords, Mountain, Theater, MessageCircle, Milestone } from 'lucide-svelte';
	import type { BaseEntity } from '$lib/types';

	interface Props {
		event: BaseEntity;
		isFirst?: boolean;
		isLast?: boolean;
		onViewSource?: (eventType: string, sourceId: string) => void;
		showLinkButton?: boolean;
		onLinkEvent?: (eventId: string) => void;
	}

	let { event, isFirst = false, isLast = false, onViewSource, showLinkButton = false, onLinkEvent }: Props = $props();

	// Get event type for rendering
	const eventTypeValue = $derived(event.fields?.eventType as string | null | undefined);

	// Get event type for data attribute and styling
	const eventType = $derived((event.fields?.eventType as string) || 'other');

	// Get outcome if present
	const outcome = $derived.by(() => {
		const outcomeValue = event.fields?.outcome as string | null | undefined;
		return outcomeValue && outcomeValue.trim() !== '' ? outcomeValue : null;
	});

	// Get sourceId if present
	const sourceId = $derived.by(() => {
		const id = event.fields?.sourceId as string | null | undefined;
		return id && id.trim() !== '' ? id : null;
	});

	// Format date
	function formatDate(date: Date): string {
		if (!date || !(date instanceof Date)) return '';

		const options: Intl.DateTimeFormatOptions = {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		};

		return date.toLocaleString('en-US', options);
	}

	// Handle View Source click
	function handleViewSource() {
		if (onViewSource && sourceId) {
			onViewSource(eventType, sourceId);
		}
	}

	// Handle Link click
	function handleLink() {
		if (onLinkEvent) {
			onLinkEvent(event.id);
		}
	}
</script>

<article
	class="timeline-event relative flex gap-4"
	data-event-type={eventType}
	data-is-first={isFirst ? 'true' : undefined}
	data-is-last={isLast ? 'true' : undefined}
>
	<!-- Timeline vertical line and icon -->
	<div class="relative flex flex-col items-center">
		<!-- Top connecting line -->
		<div class="timeline-line line-top w-0.5 flex-1 bg-gray-300 {isFirst ? 'invisible' : ''}"></div>

		<!-- Icon circle -->
		<div class="icon-container z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
			{#if eventTypeValue === 'combat'}
				<Swords class="h-5 w-5 text-gray-600" aria-hidden="true" />
			{:else if eventTypeValue === 'montage'}
				<Mountain class="h-5 w-5 text-gray-600" aria-hidden="true" />
			{:else if eventTypeValue === 'scene'}
				<Theater class="h-5 w-5 text-gray-600" aria-hidden="true" />
			{:else if eventTypeValue === 'negotiation'}
				<MessageCircle class="h-5 w-5 text-gray-600" aria-hidden="true" />
			{:else}
				<Milestone class="h-5 w-5 text-gray-600" aria-hidden="true" />
			{/if}
		</div>

		<!-- Bottom connecting line -->
		<div class="timeline-line line-bottom w-0.5 flex-1 bg-gray-300 {isLast ? 'invisible' : ''}"></div>
	</div>

	<!-- Event content -->
	<div class="flex-1 pb-8">
		<!-- Event header -->
		<div class="mb-2">
			<h3 class="text-lg font-semibold text-gray-900">{event.name}</h3>
			{#if event.createdAt}
				<p class="text-sm text-gray-500">{formatDate(event.createdAt)}</p>
			{/if}
		</div>

		<!-- Event description -->
		{#if event.description && event.description.trim() !== ''}
			<p class="mb-2 text-sm text-gray-700 line-clamp-3">{event.description}</p>
		{/if}

		<!-- Outcome -->
		{#if outcome}
			<p class="mb-3 text-sm text-gray-600">{outcome}</p>
		{/if}

		<!-- Action buttons -->
		<div class="flex gap-2">
			{#if sourceId}
				<button
					type="button"
					onclick={handleViewSource}
					class="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					View Source
				</button>
			{/if}

			{#if showLinkButton}
				<button
					type="button"
					onclick={handleLink}
					class="rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					Link
				</button>
			{/if}
		</div>
	</div>
</article>

<style>
	.timeline-event {
		min-height: 80px;
	}

	.line-top,
	.line-bottom {
		min-height: 1rem;
	}

	/* Event type specific icon colors */
	[data-event-type='combat'] .icon-container {
		border-color: #ef4444;
		background-color: #fef2f2;
	}
	[data-event-type='combat'] :global(svg) {
		color: #ef4444;
	}

	[data-event-type='montage'] .icon-container {
		border-color: #8b5cf6;
		background-color: #f5f3ff;
	}
	[data-event-type='montage'] :global(svg) {
		color: #8b5cf6;
	}

	[data-event-type='scene'] .icon-container {
		border-color: #3b82f6;
		background-color: #eff6ff;
	}
	[data-event-type='scene'] :global(svg) {
		color: #3b82f6;
	}

	[data-event-type='negotiation'] .icon-container {
		border-color: #10b981;
		background-color: #f0fdf4;
	}
	[data-event-type='negotiation'] :global(svg) {
		color: #10b981;
	}

	/* Prevent text overflow */
	.line-clamp-3 {
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
