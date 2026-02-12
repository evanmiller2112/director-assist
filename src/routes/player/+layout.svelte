<script lang="ts">
    import '../../app.css';
    import { onMount } from 'svelte';
    import { PlayerLayout } from '$lib/components/player';
    import Toast from '$lib/components/ui/Toast.svelte';
    import { uiStore, playerDataStore } from '$lib/stores';
    import { afterNavigate } from '$app/navigation';
    import { loadPlayerData } from '$lib/services/playerDataLoader';

    afterNavigate(() => {
        uiStore.closeMobileSidebar();
    });

    let { children } = $props();

    async function fetchPlayerData() {
        playerDataStore.setLoading(true);
        playerDataStore.setError(null);

        try {
            const data = await loadPlayerData();
            playerDataStore.load(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load player data';
            playerDataStore.setError(errorMessage);
        }
    }

    onMount(() => {
        uiStore.loadTheme();
        fetchPlayerData();
    });
</script>

<PlayerLayout onRefresh={fetchPlayerData}>
    {@render children()}
</PlayerLayout>
<Toast />
