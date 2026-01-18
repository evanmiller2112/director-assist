<script lang="ts">
	import type { BaseEntity, EntityLink } from '$lib/types';
	import { ArrowRight, ArrowLeftRight, X } from 'lucide-svelte';

	interface Props {
		linkedEntity: BaseEntity;
		link: EntityLink;
		isReverse: boolean;
		selected: boolean;
		onSelect: (selected: boolean) => void;
		onRemove: () => void;
	}

	let { linkedEntity, link, isReverse, selected, onSelect, onRemove }: Props = $props();

	const isAsymmetric = $derived(
		link.bidirectional && link.reverseRelationship && link.reverseRelationship !== link.relationship
	);

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

	function handleCheckboxChange() {
		onSelect(!selected);
	}

	function handleRemoveClick() {
		onRemove();
	}
</script>

<tr class={selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
	<!-- Checkbox -->
	<td class="px-4 py-3">
		<input
			type="checkbox"
			checked={selected}
			onchange={handleCheckboxChange}
			class="rounded border-slate-300 dark:border-slate-600"
		/>
	</td>

	<!-- Target Entity Name -->
	<td class="px-4 py-3">
		<a
			href="/entities/{linkedEntity.type}/{linkedEntity.id}"
			class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
		>
			{linkedEntity.name}
		</a>
	</td>

	<!-- Entity Type -->
	<td class="px-4 py-3">
		<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
			{linkedEntity.type}
		</span>
	</td>

	<!-- Relationship Type with Direction Indicator -->
	<td class="px-4 py-3">
		<div class="flex items-center gap-2">
			{#if isReverse}
				<span class="text-slate-400 dark:text-slate-500 reverse" title="Incoming relationship">
					←
				</span>
			{/if}

			<span class="text-sm text-slate-900 dark:text-white">
				{link.relationship}
			</span>

			{#if link.bidirectional}
				{#if isAsymmetric}
					<span class="bidirectional" title="Bidirectional asymmetric">
						<ArrowLeftRight class="w-3.5 h-3.5 text-blue-500" />
					</span>
					<span class="text-xs text-blue-500 dark:text-blue-400">
						{link.reverseRelationship}
					</span>
				{:else}
					<span class="bidirectional" title="Bidirectional">
						<ArrowLeftRight class="w-3.5 h-3.5 text-slate-400" />
					</span>
				{/if}
			{:else if !isReverse}
				<span class="arrow direction" title="Unidirectional">
					<ArrowRight class="w-3.5 h-3.5 text-slate-400" />
				</span>
			{/if}
		</div>
	</td>

	<!-- Strength -->
	<td class="px-4 py-3">
		{#if link.strength}
			<span class="inline-block px-2 py-1 rounded-md text-xs font-medium {getStrengthClasses(link.strength)}">
				{link.strength}
			</span>
		{:else}
			<span class="text-slate-400 dark:text-slate-500">-</span>
		{/if}
	</td>

	<!-- Actions -->
	<td class="px-4 py-3">
		{#if !isReverse}
			<button
				type="button"
				onclick={handleRemoveClick}
				class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-600 dark:text-red-400 danger"
				aria-label="Remove relationship"
			>
				<X class="w-4 h-4" />
			</button>
		{/if}
	</td>
</tr>
