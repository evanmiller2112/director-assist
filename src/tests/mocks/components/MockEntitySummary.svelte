<script lang="ts">
	import type { BaseEntity } from '$lib/types';

	interface Props {
		entity: BaseEntity;
		editable?: boolean;
	}

	let { entity, editable = false }: Props = $props();
</script>

<div data-testid="mock-entity-summary">
	{#if entity.summary}
		<p>{entity.summary}</p>
	{:else}
		<p>No summary available</p>
	{/if}
</div>
