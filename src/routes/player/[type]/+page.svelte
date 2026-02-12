<script lang="ts">
    import { page } from '$app/stores';
    import { playerDataStore } from '$lib/stores';
    import { getEntityTypeDefinition } from '$lib/config/entityTypes';
    import { getIconComponent } from '$lib/utils/icons';
    import { PlayerEntityCard } from '$lib/components/player';

    const entityType = $derived($page.params.type ?? '');
    const typeDef = $derived(getEntityTypeDefinition(entityType));
    const entities = $derived(playerDataStore.getByType(entityType));
    const Icon = $derived(getIconComponent(typeDef?.icon ?? 'package'));
</script>

<svelte:head>
    <title>{typeDef?.labelPlural ?? 'Entities'} - {playerDataStore.campaignName || 'Player View'}</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
    <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700">
            <Icon class="w-5 h-5" style="color: var(--color-{typeDef?.color ?? 'slate'}, currentColor)" />
        </div>
        <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                {typeDef?.labelPlural ?? 'Entities'}
            </h1>
            <p class="text-sm text-slate-500 dark:text-slate-400">
                {entities.length} {entities.length === 1 ? 'entry' : 'entries'}
            </p>
        </div>
    </div>

    {#if entities.length === 0}
        <div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p class="text-slate-500 dark:text-slate-400">
                No {typeDef?.labelPlural?.toLowerCase() ?? 'entities'} available.
            </p>
        </div>
    {:else}
        <div class="grid gap-3">
            {#each entities as entity}
                <PlayerEntityCard {entity} />
            {/each}
        </div>
    {/if}
</div>
