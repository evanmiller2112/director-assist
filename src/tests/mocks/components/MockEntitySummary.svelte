<script lang="ts">
	import type { BaseEntity } from '$lib/types';

	interface Props {
		entity: BaseEntity;
		editable?: boolean;
	}

	let { entity, editable = false }: Props = $props();
</script>

<div data-testid="entity-summary">
	{#if entity.summary}
		<p>{entity.summary}</p>
	{:else}
		<p>No summary available</p>
	{/if}
	{#if editable}
		<button type="button">Edit Summary</button>
	{/if}
</div>
