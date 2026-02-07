<script lang="ts">
	import type { NPCMotivation, NPCPitfall, MotivationType } from '$lib/types/negotiation';
	import {
		Heart,
		Search,
		Bird,
		DollarSign,
		Users,
		Scale,
		Trophy,
		Handshake,
		Zap,
		Shield,
		PartyPopper,
		Swords,
		Eye,
		HelpCircle,
		AlertTriangle
	} from 'lucide-svelte';

	interface Props {
		motivations: NPCMotivation[];
		pitfalls: NPCPitfall[];
		readonly?: boolean;
		onRevealMotivation?: (type: MotivationType) => void;
		onRevealPitfall?: (type: MotivationType) => void;
	}

	let {
		motivations,
		pitfalls,
		readonly = false,
		onRevealMotivation,
		onRevealPitfall
	}: Props = $props();

	const motivationIcons: Record<MotivationType, any> = {
		benevolence: Heart,
		discovery: Search,
		freedom: Bird,
		greed: DollarSign,
		higher_authority: Users,
		justice: Scale,
		legacy: Trophy,
		peace: Handshake,
		power: Zap,
		protection: Shield,
		reputation: Trophy,
		revelry: PartyPopper,
		vengeance: Swords,
		wealth: DollarSign
	};

	function formatMotivationType(type: MotivationType): string {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function handleRevealMotivation(type: MotivationType) {
		if (onRevealMotivation) {
			onRevealMotivation(type);
		}
	}

	function handleRevealPitfall(type: MotivationType) {
		if (onRevealPitfall) {
			onRevealPitfall(type);
		}
	}

	let revealingMotivations = $state<MotivationType[]>([]);
	let revealingPitfalls = $state<MotivationType[]>([]);

	function revealMotivation(type: MotivationType) {
		revealingMotivations = [...revealingMotivations, type];
		handleRevealMotivation(type);
	}

	function revealPitfall(type: MotivationType) {
		revealingPitfalls = [...revealingPitfalls, type];
		handleRevealPitfall(type);
	}
</script>

<div class="flex flex-col gap-6">
	<!-- Motivations Section -->
	<section data-testid="motivations-section" class="space-y-3">
		<h2 class="text-lg font-semibold">Motivations ({motivations.length})</h2>
		{#if motivations.length === 0}
			<p class="text-sm text-gray-500">No motivations configured</p>
		{:else}
			<ul role="list" class="space-y-2">
				{#each motivations as motivation}
					{@const IconComponent = motivation.isKnown
						? motivationIcons[motivation.type]
						: HelpCircle}
					<li
						data-testid="motivation-{motivation.type}"
						class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 {motivation.used
							? 'opacity-50 line-through'
							: ''}"
						aria-label={motivation.used
							? `${formatMotivationType(motivation.type)} (used)`
							: formatMotivationType(motivation.type)}
					>
						<div class="flex-shrink-0" data-icon={motivation.isKnown ? motivation.type : 'question'}>
							{#if IconComponent}
								<IconComponent class="h-5 w-5 text-gray-600" />
							{/if}
						</div>
						<div class="flex-1">
							{#if motivation.isKnown}
								<span class="font-medium">{formatMotivationType(motivation.type)}</span>
								{#if motivation.used}
									<span class="ml-2 text-xs text-gray-500">(Used)</span>
								{/if}
							{:else}
								<span class="text-gray-400">Unknown Motivation</span>
							{/if}
						</div>
						{#if !motivation.isKnown && !readonly}
							<button
								class="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
								onclick={() => revealMotivation(motivation.type)}
								disabled={revealingMotivations.includes(motivation.type)}
								aria-label="Reveal motivation"
							>
								<Eye class="inline h-4 w-4" /> Reveal
							</button>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Pitfalls Section -->
	<section data-testid="pitfalls-section" class="space-y-3">
		<h2 class="text-lg font-semibold">Pitfalls ({pitfalls.length})</h2>
		{#if pitfalls.length === 0}
			<p class="text-sm text-gray-500">No pitfalls configured</p>
		{:else}
			<ul role="list" class="space-y-2">
				{#each pitfalls as pitfall}
					{@const IconComponent = pitfall.isKnown ? AlertTriangle : HelpCircle}
					<li
						data-testid="pitfall-{pitfall.type}"
						class="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
					>
						<div
							class="flex-shrink-0"
							data-icon={pitfall.isKnown ? pitfall.type : 'unknown'}
						>
							{#if IconComponent}
								<IconComponent
									class="h-5 w-5 {pitfall.isKnown ? 'text-red-600 alert' : 'text-gray-400'}"
								/>
							{/if}
						</div>
						<div class="flex-1">
							{#if pitfall.isKnown}
								<span class="font-medium text-red-900">{formatMotivationType(pitfall.type)}</span
								>
							{:else}
								<span class="text-gray-400">Unknown Pitfall</span>
							{/if}
						</div>
						{#if !pitfall.isKnown && !readonly}
							<button
								class="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
								onclick={() => revealPitfall(pitfall.type)}
								disabled={revealingPitfalls.includes(pitfall.type)}
								aria-label="Reveal pitfall"
							>
								<Eye class="inline h-4 w-4" /> Reveal
							</button>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
