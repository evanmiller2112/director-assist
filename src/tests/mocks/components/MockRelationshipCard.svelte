<script lang="ts">
	import type { BaseEntity, EntityLink, EntityTypeDefinition } from '$lib/types';

	interface Props {
		linkedEntity: BaseEntity;
		link: EntityLink;
		isReverse: boolean;
		typeDefinition?: EntityTypeDefinition;
		onRemove?: (linkId: string) => void;
	}

	let { linkedEntity, link, isReverse, typeDefinition, onRemove }: Props = $props();
</script>

<div data-testid="relationship-card">
	<span>{linkedEntity.name}</span>
	<span>{link.relationship}</span>
	{#if onRemove}
		<button type="button" onclick={() => onRemove?.(link.id)}>Remove</button>
	{/if}
</div>
