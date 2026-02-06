<script lang="ts">
	import { Heart, Shield, User, Skull, Zap } from 'lucide-svelte';
	import type { Combatant } from '$lib/types/combat';
	import { isHeroCombatant, isCreatureCombatant } from '$lib/types/combat';
	import ConditionBadge from './ConditionBadge.svelte';

	interface Props {
		combatant: Combatant;
		isCurrent?: boolean;
		onClick?: (combatant: Combatant) => void;
		compact?: boolean;
	}

	let { combatant, isCurrent = false, onClick, compact = false }: Props = $props();

	const isHero = $derived(isHeroCombatant(combatant));
	const isCreature = $derived(isCreatureCombatant(combatant));
	const isBloodied = $derived(combatant.maxHp ? combatant.hp <= combatant.maxHp / 2 : false);
	const isDefeated = $derived(combatant.hp <= 0);
	const isCritical = $derived(combatant.maxHp ? combatant.hp <= combatant.maxHp * 0.25 : false);
	const hpPercentage = $derived(
		combatant.maxHp && combatant.maxHp > 0 ? (Math.max(0, combatant.hp) / combatant.maxHp) * 100 : 0
	);
	const isClickable = $derived(onClick !== undefined);

	function getCardClasses(): string {
		const classes = ['combatant-card'];

		if (isCurrent) classes.push('current', 'active');
		if (isBloodied && !isDefeated) classes.push('bloodied');
		if (isDefeated) classes.push('defeated', 'unconscious');
		if (isClickable) classes.push('clickable', 'cursor-pointer', 'hover:shadow-lg');
		if (compact) classes.push('compact');

		// Type-specific styling
		if (isHero) classes.push('hero-card', 'border-l-4', 'border-l-blue-500');
		if (isCreature) classes.push('creature-card', 'border-l-4', 'border-l-red-500');

		return classes.join(' ');
	}

	function getHpBarClass(): string {
		if (isDefeated) return 'bg-slate-400 dark:bg-slate-600';
		if (isCritical) return 'bg-red-500 dark:bg-red-600 critical danger red';
		if (isBloodied) return 'bg-yellow-500 dark:bg-yellow-600 bloodied warning yellow';
		return 'bg-green-500 dark:bg-green-600 healthy green';
	}

	function getThreatLabel(threat: number): string {
		if (threat === 1) return 'Threat 1 - Standard';
		if (threat === 2) return 'Threat 2 - Elite';
		if (threat === 3) return 'Threat 3 - Boss';
		return `Threat ${threat}`;
	}

	function getThreatClass(threat: number): string {
		if (threat === 1) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
		if (threat === 2) return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
		if (threat === 3) return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
		return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200';
	}

	function handleClick() {
		if (onClick) {
			onClick(combatant);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (onClick && (event.key === 'Enter' || event.key === ' ')) {
			event.preventDefault();
			onClick(combatant);
		}
	}
</script>

<article
	class={`${getCardClasses()} p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-200`}
	data-testid="combatant-card"
	role="article"
	aria-label={`${combatant.name}, ${isHero ? 'Hero' : 'Creature'}, ${combatant.hp} out of ${combatant.maxHp} stamina`}
	aria-current={isCurrent ? 'true' : undefined}
	tabindex={isClickable ? 0 : undefined}
	onclick={handleClick}
	onkeydown={handleKeydown}
>
	<!-- Header: Name and Initiative -->
	<div class="flex items-start justify-between gap-2 mb-3">
		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2">
				<h3
					class="font-semibold text-slate-900 dark:text-white truncate ellipsis"
					data-testid="combatant-name"
				>
					{combatant.name}
				</h3>
				{#if isCurrent}
					<span
						class="text-blue-600 dark:text-blue-400"
						data-testid="current-turn-indicator"
						aria-label="Current turn"
					>
						<Zap class="w-4 h-4" />
					</span>
				{/if}
			</div>

			<!-- Type Indicator -->
			{#if isHero}
				<div
					class="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-1"
					data-testid="hero-indicator"
					role="img"
					aria-label="Hero character"
				>
					<User class="w-3 h-3" aria-label="Hero" />
					<span>Hero</span>
				</div>
			{/if}
		</div>

		<div class="flex flex-col items-end gap-1">
			<!-- Initiative -->
			<div class="text-lg font-bold text-slate-700 dark:text-slate-300">
				{combatant.initiative}
			</div>

			<!-- AC -->
			{#if combatant.ac !== undefined}
				<div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
					<Shield class="w-3 h-3" />
					<span>AC {combatant.ac}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- HP Section -->
	<div
		class="hp-section mb-3"
		data-testid="hp-section"
		aria-label={`${Math.max(0, combatant.hp)} out of ${combatant.maxHp} stamina`}
	>
		<div class="flex items-center justify-between mb-1">
			<div class="text-sm font-medium text-slate-700 dark:text-slate-300">
				<Heart class="inline-block w-3 h-3 mr-1" aria-hidden="true" />
				{Math.max(0, combatant.hp)} / {combatant.maxHp}
			</div>
			{#if combatant.tempHp > 0}
				<div class="text-xs text-blue-600 dark:text-blue-400">
					Temp Stamina: {combatant.tempHp}
				</div>
			{/if}
		</div>

		<!-- HP Bar -->
		<div class="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
			<div
				data-testid="hp-bar"
				class={`h-full transition-all duration-300 ${getHpBarClass()}`}
				style={`width: ${hpPercentage}%`}
			></div>
		</div>
	</div>

	<!-- Type-Specific Info -->
	{#if isHero && isHeroCombatant(combatant) && combatant.heroicResource}
		<div class="hero-resource mb-3 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
			<div class="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
				{combatant.heroicResource.name}
			</div>
			<div class="text-sm text-blue-700 dark:text-blue-300">
				{combatant.heroicResource.current} / {combatant.heroicResource.max}
			</div>
		</div>
	{/if}

	{#if isCreature && isCreatureCombatant(combatant)}
		<div class="mb-3">
			<span
				class={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getThreatClass(combatant.threat)}`}
				data-testid="threat-badge"
				role="img"
				aria-label={`Creature - ${getThreatLabel(combatant.threat)}`}
			>
				<Skull class="w-3 h-3" aria-label="Enemy" />
				{getThreatLabel(combatant.threat)}
			</span>
		</div>
	{/if}

	<!-- Conditions -->
	{#if combatant.conditions.length > 0}
		<div
			class={`conditions-section ${compact ? 'compact' : ''}`}
			data-testid="conditions-list"
		>
			<div class="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
				Conditions:
			</div>
			<div class="flex flex-wrap gap-1">
				{#each combatant.conditions as condition}
					<ConditionBadge {condition} />
				{/each}
			</div>
		</div>
	{/if}
</article>

<style>
	.combatant-card.current,
	.combatant-card.active {
		@apply ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg;
	}

	.combatant-card.bloodied {
		@apply bg-yellow-50 dark:bg-yellow-900/10;
	}

	.combatant-card.defeated,
	.combatant-card.unconscious {
		@apply opacity-75 bg-slate-100 dark:bg-slate-900;
	}

	.combatant-card.clickable {
		@apply transition-shadow;
	}

	.combatant-card.clickable:hover {
		@apply shadow-md;
	}

	.combatant-card.compact {
		@apply p-2;
	}

	.truncate,
	.ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
