<script lang="ts">
    import type { Snippet } from 'svelte';
    import { playerDataStore, uiStore } from '$lib/stores';
    import PlayerHeader from './PlayerHeader.svelte';
    import PlayerSidebar from './PlayerSidebar.svelte';

    let { children, onRefresh }: { children: Snippet; onRefresh?: () => Promise<void> } = $props();

    let headerComponent: ReturnType<typeof PlayerHeader> | undefined = $state();

    function handleSearch(query: string) {
        // Search state will be consumed via context in future issues (#444)
        // For now, basic search functionality is available
    }

    function handleGlobalKeydown(e: KeyboardEvent) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            headerComponent?.focusSearch();
        }
    }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<div class="dashboard-layout">
    <PlayerHeader
        bind:this={headerComponent}
        campaignName={playerDataStore.campaignName}
        exportedAt={playerDataStore.data?.exportedAt}
        onSearch={handleSearch}
        onRefresh={onRefresh}
    />
    <PlayerSidebar
        mobileOpen={uiStore.mobileSidebarOpen}
        entityTypes={playerDataStore.entityTypes}
        entitiesByType={playerDataStore.entitiesByType}
    />

    <!-- Mobile sidebar backdrop -->
    {#if uiStore.mobileSidebarOpen}
        <button
            class="sidebar-backdrop lg:hidden"
            onclick={() => uiStore.closeMobileSidebar()}
            aria-label="Close sidebar"
        ></button>
    {/if}

    <main class="dashboard-main">
        <div class="flex-1 overflow-y-auto p-6">
            {@render children()}
        </div>
    </main>
</div>
