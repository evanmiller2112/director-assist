<script lang="ts">
	import { campaignStore, entitiesStore } from '$lib/stores';
	import { BUILT_IN_ENTITY_TYPES } from '$lib/config/entityTypes';
	import {
		User,
		Users,
		MapPin,
		Flag,
		Package,
		Swords,
		Calendar,
		Sun,
		Clock,
		BookOpen,
		UserCircle,
		Activity,
		Plus
	} from 'lucide-svelte';

	// Map icon names to components
	const iconMap: Record<string, typeof User> = {
		user: User,
		users: Users,
		'map-pin': MapPin,
		flag: Flag,
		package: Package,
		swords: Swords,
		calendar: Calendar,
		sun: Sun,
		clock: Clock,
		book: BookOpen,
		'user-circle': UserCircle
	};

	function getEntityCount(type: string): number {
		const byType = entitiesStore.entitiesByType;
		return byType[type]?.length ?? 0;
	}

	const totalEntities = $derived(entitiesStore.entities.length);
</script>

<svelte:head>
	<title>Dashboard - Director Assist</title>
</svelte:head>

<div class="max-w-6xl mx-auto">
	<!-- Campaign Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">
			{campaignStore.campaign?.name ?? 'Welcome'}
		</h1>
		{#if campaignStore.campaign?.description}
			<p class="text-slate-600 dark:text-slate-400">
				{campaignStore.campaign.description}
			</p>
		{/if}
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
		{#each BUILT_IN_ENTITY_TYPES.slice(0, 8) as entityType}
			{@const Icon = iconMap[entityType.icon] ?? User}
			{@const count = getEntityCount(entityType.type)}
			<a
				href="/entities/{entityType.type}"
				class="entity-card hover:scale-[1.02] transition-transform"
				data-type={entityType.type}
			>
				<div class="flex items-center gap-3">
					<div
						class="w-10 h-10 rounded-lg flex items-center justify-center"
						style="background-color: var(--color-{entityType.color}, #3b82f6)20"
					>
						<Icon
							class="w-5 h-5"
							style="color: var(--color-{entityType.color}, #3b82f6)"
						/>
					</div>
					<div>
						<div class="text-2xl font-bold text-slate-900 dark:text-white">
							{count}
						</div>
						<div class="text-sm text-slate-500 dark:text-slate-400">
							{entityType.labelPlural}
						</div>
					</div>
				</div>
			</a>
		{/each}
	</div>

	<!-- Quick Actions -->
	<div class="mb-8">
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
		<div class="flex flex-wrap gap-2">
			<a href="/entities/npc" class="btn btn-secondary">
				<Plus class="w-4 h-4" />
				Add NPC
			</a>
			<a href="/entities/location" class="btn btn-secondary">
				<Plus class="w-4 h-4" />
				Add Location
			</a>
			<a href="/entities/session" class="btn btn-secondary">
				<Plus class="w-4 h-4" />
				New Session
			</a>
			<a href="/settings" class="btn btn-secondary"> Configure Campaign </a>
		</div>
	</div>

	<!-- Recent Activity -->
	<div>
		<h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
			<Activity class="w-5 h-5" />
			Recent Entities
		</h2>

		{#if entitiesStore.entities.length === 0}
			<div class="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
				<p class="text-slate-500 dark:text-slate-400 mb-4">
					No entities yet. Start building your campaign!
				</p>
				<button class="btn btn-primary">
					<Plus class="w-4 h-4" />
					Create Your First Entity
				</button>
			</div>
		{:else}
			<div class="grid gap-3">
				{#each [...entitiesStore.entities]
					.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
					.slice(0, 5) as entity}
					{@const typeInfo = BUILT_IN_ENTITY_TYPES.find((t) => t.type === entity.type)}
					<a
						href="/entities/{entity.type}/{entity.id}"
						class="entity-card flex items-center gap-4"
						data-type={entity.type}
					>
						<div class="flex-1">
							<div class="font-medium text-slate-900 dark:text-white">
								{entity.name}
							</div>
							<div class="text-sm text-slate-500 dark:text-slate-400">
								{typeInfo?.label ?? entity.type}
								{#if entity.description}
									<span class="mx-1">-</span>
									{entity.description.slice(0, 60)}{entity.description.length > 60
										? '...'
										: ''}
								{/if}
							</div>
						</div>
						<div class="text-xs text-slate-400">
							{new Date(entity.updatedAt).toLocaleDateString()}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
