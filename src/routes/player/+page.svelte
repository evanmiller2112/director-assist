<script lang="ts">
    import { page } from '$app/stores';
    import { playerDataStore } from '$lib/stores';
    import { getEntityTypeDefinition } from '$lib/config/entityTypes';
    import { getIconComponent } from '$lib/utils/icons';
    import { PlayerEntityCard } from '$lib/components/player';

    // Read search query from URL
    const searchQuery = $derived($page.url.searchParams.get('q') ?? '');

    // Search results (filtered entities if search query exists)
    const searchResults = $derived.by(() => {
        if (!searchQuery.trim()) return [];
        return playerDataStore.searchEntities(searchQuery);
    });

    // Recently updated entities (top 12, sorted by updatedAt descending)
    const recentEntities = $derived.by(() => {
        if (!playerDataStore.entities.length) return [];
        return [...playerDataStore.entities]
            .sort((a, b) => {
                const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 12);
    });
</script>

<svelte:head>
    <title>{playerDataStore.campaignName || 'Player View'} - Director Assist</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
    {#if playerDataStore.isLoading}
        <div class="text-center py-12">
            <div class="inline-block w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin"></div>
            <p class="text-slate-500 dark:text-slate-400 mt-4">Loading campaign data...</p>
        </div>
    {:else if playerDataStore.error}
        <div class="text-center py-12">
            <p class="text-red-500 dark:text-red-400">{playerDataStore.error}</p>
        </div>
    {:else if !playerDataStore.isLoaded}
        <div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p class="text-slate-500 dark:text-slate-400 mb-2">
                No campaign data available.
            </p>
            <p class="text-sm text-slate-400 dark:text-slate-500">
                Ask your Director to publish campaign data for the player view.
            </p>
        </div>
    {:else}
        <!-- Search Results View -->
        {#if searchQuery.trim()}
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Search Results for "{searchQuery}"
                </h1>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                    {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
                </p>
            </div>

            {#if searchResults.length === 0}
                <div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p class="text-slate-500 dark:text-slate-400 mb-2">
                        No entities found matching "{searchQuery}".
                    </p>
                    <p class="text-sm text-slate-400 dark:text-slate-500">
                        Try a different search term or browse by type below.
                    </p>
                </div>
            {:else}
                <div class="grid gap-3 mb-8">
                    {#each searchResults as entity}
                        <PlayerEntityCard {entity} />
                    {/each}
                </div>
            {/if}

            <!-- Show entity types below search results -->
            {#if playerDataStore.entityTypes.length > 0}
                <div class="mt-12">
                    <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">
                        Browse by Type
                    </h2>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {#each playerDataStore.entityTypes as type}
                            {@const typeDef = getEntityTypeDefinition(type)}
                            {@const Icon = getIconComponent(typeDef?.icon ?? 'package')}
                            {@const count = playerDataStore.getByType(type).length}
                            <a
                                href="/player/{type}"
                                class="entity-card hover:scale-[1.02] transition-transform"
                                data-type={type}
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                                        <Icon class="w-5 h-5" style="color: var(--color-{typeDef?.color ?? 'slate'}, currentColor)" />
                                    </div>
                                    <div>
                                        <div class="text-2xl font-bold text-slate-900 dark:text-white">{count}</div>
                                        <div class="text-sm text-slate-500 dark:text-slate-400">
                                            {typeDef?.labelPlural ?? type}
                                        </div>
                                    </div>
                                </div>
                            </a>
                        {/each}
                    </div>
                </div>
            {/if}

        <!-- Default Overview View -->
        {:else}
            <!-- Campaign Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {playerDataStore.campaignName}
                </h1>
                {#if playerDataStore.campaignDescription}
                    <p class="text-slate-600 dark:text-slate-400">
                        {playerDataStore.campaignDescription}
                    </p>
                {/if}
            </div>

            <!-- Entity Type Stats Grid -->
            {#if playerDataStore.entityTypes.length > 0}
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
                    {#each playerDataStore.entityTypes as type}
                        {@const typeDef = getEntityTypeDefinition(type)}
                        {@const Icon = getIconComponent(typeDef?.icon ?? 'package')}
                        {@const count = playerDataStore.getByType(type).length}
                        <a
                            href="/player/{type}"
                            class="entity-card hover:scale-[1.02] transition-transform"
                            data-type={type}
                        >
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                                    <Icon class="w-5 h-5" style="color: var(--color-{typeDef?.color ?? 'slate'}, currentColor)" />
                                </div>
                                <div>
                                    <div class="text-2xl font-bold text-slate-900 dark:text-white">{count}</div>
                                    <div class="text-sm text-slate-500 dark:text-slate-400">
                                        {typeDef?.labelPlural ?? type}
                                    </div>
                                </div>
                            </div>
                        </a>
                    {/each}
                </div>

                <!-- Recently Updated Entities -->
                {#if recentEntities.length > 0}
                    <div>
                        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Recently Updated
                        </h2>
                        <div class="grid gap-3">
                            {#each recentEntities as entity}
                                <PlayerEntityCard {entity} />
                            {/each}
                        </div>
                    </div>
                {/if}
            {:else}
                <div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p class="text-slate-500 dark:text-slate-400">
                        No entities have been published yet.
                    </p>
                </div>
            {/if}
        {/if}
    {/if}
</div>
