<script lang="ts">
	/**
	 * NarrativeTimeline Component
	 *
	 * Issue #400: Build Timeline View UI (GREEN phase of TDD)
	 *
	 * Renders a chronological timeline of narrative events:
	 * - Sorts events by createdAt (oldest first)
	 * - Filters by sessionId if provided
	 * - Passes isFirst/isLast to TimelineEvent components
	 * - Propagates callbacks (onViewSource, onLinkEvent)
	 * - Shows empty state when showEmpty=true and no events
	 */

	import { Calendar } from 'lucide-svelte';
	import TimelineEvent from './TimelineEvent.svelte';
	import type { BaseEntity } from '$lib/types';

	interface Props {
		events: BaseEntity[];
		sessionId?: string;
		onViewSource?: (eventType: string, sourceId: string) => void;
		onLinkEvent?: (eventId: string) => void;
		showEmpty?: boolean;
	}

	let { events = [], sessionId, onViewSource, onLinkEvent, showEmpty = false }: Props = $props();

	// Filter and sort events
	const sortedEvents = $derived.by(() => {
		if (!events || !Array.isArray(events)) {
			return [];
		}

		let filtered = events;

		// Filter by sessionId if provided
		if (sessionId) {
			filtered = events.filter((event) => {
				const eventSessionId = event.fields?.sessionId as string | null | undefined;
				return eventSessionId === sessionId;
			});
		}

		// Sort by createdAt (oldest first)
		return [...filtered].sort((a, b) => {
			const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
			const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
			return dateA - dateB;
		});
	});

	// Check if we should show empty state
	const shouldShowEmpty = $derived(showEmpty && sortedEvents.length === 0);
</script>

<div class="narrative-timeline">
	{#if shouldShowEmpty}
		<!-- Empty state -->
		<div class="flex flex-col items-center justify-center py-12 text-center">
			<Calendar class="mb-4 h-12 w-12 text-gray-400" aria-hidden="true" />
			<p class="text-lg font-medium text-gray-900">No events yet</p>
			<p class="mt-1 text-sm text-gray-500">Timeline events will appear here as they are created</p>
		</div>
	{:else if sortedEvents.length > 0}
		<!-- Timeline list -->
		<ol class="timeline-list space-y-0" role="list" aria-label="Narrative timeline">
			{#each sortedEvents as event, index (event.id)}
				<li>
					<TimelineEvent
						{event}
						isFirst={index === 0}
						isLast={index === sortedEvents.length - 1}
						{onViewSource}
						{onLinkEvent}
					/>
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	.narrative-timeline {
		width: 100%;
	}

	.timeline-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
</style>
