<script lang="ts">
	import { getEntityTypeDefinition } from '$lib/config/entityTypes';
	import { campaignStore } from '$lib/stores';
	import { X, ArrowRight, ArrowLeftRight, Edit, EyeOff } from 'lucide-svelte';
	import type { BaseEntity, EntityLink, EntityTypeDefinition } from '$lib/types';

	interface Props {
		linkedEntity: BaseEntity;
		link: EntityLink;
		isReverse: boolean;
		typeDefinition?: EntityTypeDefinition;
		onRemove?: (linkId: string) => void;
		onEdit?: (linkId: string) => void;
		onNavigate?: (targetEntity: BaseEntity, relationship: string) => void;
	}

	let { linkedEntity, link, isReverse, typeDefinition, onRemove, onEdit, onNavigate }: Props = $props();

	function handleNavigate(event: MouseEvent) {
		if (onNavigate && linkedEntity) {
			event.preventDefault();
			const relationship = isReverse && link.reverseRelationship ? link.reverseRelationship : link.relationship;
			onNavigate(linkedEntity, relationship);
		}
	}

	const linkedTypeDefinition = $derived(
		linkedEntity
			? getEntityTypeDefinition(
					linkedEntity.type,
					campaignStore.customEntityTypes,
					campaignStore.entityTypeOverrides
				)
			: undefined
	);

	const isAsymmetric = $derived(
		link.bidirectional && link.reverseRelationship && link.reverseRelationship !== link.relationship
	);

	// Format date for display
	function formatDate(date: Date | undefined): string {
		if (!date) return '';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Get strength color classes
	function getStrengthClasses(strength: 'strong' | 'moderate' | 'weak' | undefined): string {
		switch (strength) {
			case 'strong':
				return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
			case 'moderate':
				return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
			case 'weak':
				return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
			default:
				return '';
		}
	}

	function handleRemove() {
		if (onRemove && !isReverse) {
			onRemove(link.id);
		}
	}

	function handleEdit() {
		if (onEdit && !isReverse) {
			onEdit(link.id);
		}
	}
</script>

<article
	class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow group relative"
	class:border-l-4={isReverse}
	class:border-l-blue-400={isReverse}
	class:reverse={isReverse}
	class:incoming={isReverse}
>
	{#if linkedEntity}
	<!-- Header with entity name and type -->
	<div class="flex items-start justify-between mb-2">
		<div class="flex-1 min-w-0">
			<a
				href="/entities/{linkedEntity.type}/{linkedEntity.id}"
				onclick={onNavigate ? handleNavigate : undefined}
				class="text-lg font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
			>
				{linkedEntity.name}
			</a>
			<div class="flex items-center gap-2 mt-1">
				<span
					class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
				>
					{linkedTypeDefinition?.label ?? linkedEntity.type}
				</span>
				{#if link.playerVisible === false}
					<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300" title="Hidden from players">
						<EyeOff class="w-3 h-3" />
						DM Only
					</span>
				{/if}
			</div>
		</div>

		<!-- Action buttons (only for forward links) -->
		{#if !isReverse}
			<div class="flex items-center gap-1">
				{#if onEdit}
					<button
						onclick={handleEdit}
						class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400"
						aria-label="Edit relationship"
						type="button"
					>
						<Edit class="w-4 h-4" />
					</button>
				{/if}
				{#if onRemove}
					<button
						onclick={handleRemove}
						class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400"
						aria-label="Remove relationship"
						type="button"
					>
						<X class="w-4 h-4" />
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Relationship -->
	<div class="flex items-center gap-2 mb-3">
		{#if isReverse}
			<span class="reverse incoming arrow text-slate-400 dark:text-slate-500" title="Incoming relationship">
				←
			</span>
		{/if}

		<span class="text-sm font-medium text-slate-600 dark:text-slate-400">
			{link.relationship}
		</span>

		{#if link.bidirectional}
			{#if isAsymmetric}
				<span title="Bidirectional asymmetric">
					<ArrowLeftRight class="w-3.5 h-3.5 text-blue-500" />
				</span>
				<span class="text-xs text-blue-500 dark:text-blue-400">
					{link.reverseRelationship}
				</span>
			{:else}
				<span title="Bidirectional">
					<ArrowLeftRight class="w-3.5 h-3.5 text-slate-400" />
				</span>
			{/if}
		{:else if !isReverse}
			<span title="Unidirectional">
				<ArrowRight class="w-3.5 h-3.5 text-slate-400" />
			</span>
		{/if}
	</div>

	<!-- Strength badge -->
	{#if link.strength}
		<div class="mb-2">
			<span
				class="strength-{link.strength} inline-block px-2 py-1 rounded-md text-xs font-medium {getStrengthClasses(link.strength)}"
			>
				{link.strength}
			</span>
		</div>
	{/if}

	<!-- Notes -->
	{#if link.notes && link.notes.trim()}
		<div class="mb-3 notes">
			<p class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
				{link.notes}
			</p>
		</div>
	{/if}

	<!-- Tags -->
	{#if link.metadata?.tags && link.metadata.tags.length > 0}
		<div class="mb-3 tags">
			<div class="flex flex-wrap gap-1.5">
				{#each link.metadata.tags as tag}
					<span
						class="tag badge inline-block px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
					>
						{tag}
					</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Tension indicator -->
	{#if link.metadata?.tension !== undefined && link.metadata.tension !== null}
		<div class="mb-3 tension">
			<div class="flex items-center justify-between text-xs mb-1">
				<span class="font-medium text-slate-500 dark:text-slate-400">Tension</span>
				<span class="font-semibold text-slate-700 dark:text-slate-300">{link.metadata.tension}</span>
			</div>
			<div class="progress-bar w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
				<div
					class="bar h-full rounded-full transition-all duration-300"
					class:bg-green-500={link.metadata.tension < 30}
					class:bg-yellow-500={link.metadata.tension >= 30 && link.metadata.tension < 70}
					class:bg-red-500={link.metadata.tension >= 70}
					style="width: {link.metadata.tension}%"
				></div>
			</div>
		</div>
	{/if}

	<!-- Timestamps -->
	{#if link.createdAt || link.updatedAt}
		<div class="text-xs text-slate-400 dark:text-slate-500">
			{#if link.updatedAt && link.updatedAt !== link.createdAt}
				<div>Updated: {formatDate(link.updatedAt)}</div>
			{:else if link.createdAt}
				<div>Created: {formatDate(link.createdAt)}</div>
			{/if}
		</div>
	{/if}
	{/if}
</article>
