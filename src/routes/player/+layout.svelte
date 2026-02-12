<script lang="ts">
    import '../../app.css';
    import { onMount } from 'svelte';
    import { PlayerLayout } from '$lib/components/player';
    import Toast from '$lib/components/ui/Toast.svelte';
    import { uiStore } from '$lib/stores';
    import { afterNavigate } from '$app/navigation';

    afterNavigate(() => {
        uiStore.closeMobileSidebar();
    });

    let { children } = $props();

    onMount(() => {
        uiStore.loadTheme();
    });
</script>

<PlayerLayout>
    {@render children()}
</PlayerLayout>
<Toast />
