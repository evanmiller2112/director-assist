<script lang="ts">
	import { MessageCircle } from 'lucide-svelte';

	interface Props {
		isMinimized: boolean;
		onclick?: () => void;
	}

	let { isMinimized, onclick }: Props = $props();
</script>

{#if isMinimized}
	<button
		type="button"
		style="position: fixed; bottom: 1.5rem; right: 1.5rem; width: 56px; height: 56px; z-index: 50; cursor: pointer; background-color: #2563eb; color: white; border-radius: 9999px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); transition: all 0.2s; padding: 0.75rem; display: flex; align-items: center; justify-content: center;"
		class="hover:bg-blue-700 hover:shadow-xl"
		onclick={onclick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				onclick?.();
			}
		}}
		aria-label="Open chat"
	>
		<MessageCircle class="w-6 h-6" />
	</button>
{/if}
