<script lang="ts">
    import { playerDataStore } from '$lib/stores';
    import { getEntityTypeDefinition } from '$lib/config/entityTypes';
    import { getIconComponent } from '$lib/utils/icons';
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
        {:else}
            <div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p class="text-slate-500 dark:text-slate-400">
                    No entities have been published yet.
                </p>
            </div>
        {/if}
    {/if}
</div>
