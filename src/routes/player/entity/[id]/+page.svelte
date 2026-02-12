<script lang="ts">
    import { page } from '$app/stores';
    import { playerDataStore } from '$lib/stores';
    import { getEntityTypeDefinition } from '$lib/config/entityTypes';
    import { getIconComponent } from '$lib/utils/icons';
    import { ArrowLeft } from 'lucide-svelte';
    import PlayerEntityDetail from '$lib/components/player/PlayerEntityDetail.svelte';
    import { PlayerBreadcrumbs } from '$lib/components/player';

    const entityId = $derived($page.params.id ?? '');
    const entity = $derived(playerDataStore.getEntityById(entityId));
    const typeDef = $derived(entity ? getEntityTypeDefinition(entity.type) : undefined);
    const Icon = $derived(getIconComponent(typeDef?.icon ?? 'package'));

    // Breadcrumb items
    const breadcrumbs = $derived.by(() => {
        if (!entity) return [{ label: 'Home', href: '/player' }];
        return [
            { label: 'Home', href: '/player' },
            { label: typeDef?.labelPlural ?? 'Entities', href: `/player/${entity.type}` },
            { label: entity.name }
        ];
    });
</script>

<svelte:head>
    <title>{entity?.name ?? 'Entity'} - {playerDataStore.campaignName || 'Player View'}</title>
</svelte:head>

{#if entity}
    <div class="max-w-4xl mx-auto">
        <!-- Breadcrumbs -->
        <PlayerBreadcrumbs items={breadcrumbs} />

        <a
            href="/player/{entity.type}"
            class="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-4 transition-colors"
        >
            <ArrowLeft class="w-4 h-4" />
            Back to {typeDef?.labelPlural ?? 'Entities'}
        </a>

        <!-- Entity Header -->
        <div class="flex items-start gap-4 mb-6">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                <Icon class="w-6 h-6" style="color: var(--color-{typeDef?.color ?? 'slate'}, currentColor)" />
            </div>
            <div>
                <h1 class="text-3xl font-bold text-slate-900 dark:text-white">
                    {entity.name}
                </h1>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {typeDef?.label ?? entity.type}
                </p>
            </div>
        </div>

        <!-- Entity Detail Component -->
        <PlayerEntityDetail {entity} />
    </div>
{:else}
    <div class="text-center py-12">
        <p class="text-slate-500 dark:text-slate-400 mb-4">Entity not found.</p>
        <a href="/player" class="text-blue-600 dark:text-blue-400 hover:underline">
            Return to overview
        </a>
    </div>
{/if}
