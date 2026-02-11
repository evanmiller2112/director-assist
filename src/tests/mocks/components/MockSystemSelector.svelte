<script lang="ts">
	interface Props {
		value?: string;
		onchange?: (systemId: string) => void;
		disabled?: boolean;
		showDescription?: boolean;
	}

	let { value = '', onchange, disabled = false, showDescription = false }: Props = $props();
</script>

<select data-testid="mock-system-selector">
	<option>Mock SystemSelector</option>
</select>
