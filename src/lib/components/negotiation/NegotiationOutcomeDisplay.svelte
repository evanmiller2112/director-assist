<script lang="ts">
	import type { NegotiationOutcome } from '$lib/types/negotiation';
	import { CheckCircle2, AlertCircle, Info, X, ShieldAlert } from 'lucide-svelte';

	interface Props {
		outcome: NegotiationOutcome;
	}

	let { outcome }: Props = $props();

	const outcomeConfig: Record<
		NegotiationOutcome,
		{
			title: string;
			description: string;
			interestRange: string;
			icon: any;
			colorClass: string;
			bgClass: string;
			borderClass: string;
		}
	> = {
		alliance: {
			title: 'Alliance Formed!',
			description: 'Full request secured with ongoing partnership and bonus benefits.',
			interestRange: '5',
			icon: CheckCircle2,
			colorClass: 'text-green-900',
			bgClass: 'bg-green-100',
			borderClass: 'border-green-300'
		},
		major_favor: {
			title: 'Major Favor Granted',
			description: 'Strong result obtained by the party.',
			interestRange: '3-4',
			icon: CheckCircle2,
			colorClass: 'text-green-800',
			bgClass: 'bg-green-50',
			borderClass: 'border-green-200'
		},
		minor_favor: {
			title: 'Minor Favor',
			description: 'Partial concession achieved by the party.',
			interestRange: '2',
			icon: Info,
			colorClass: 'text-amber-800',
			bgClass: 'bg-amber-100',
			borderClass: 'border-amber-300'
		},
		failure: {
			title: 'Negotiation Failed',
			description: 'No agreement reached.',
			interestRange: '0-1',
			icon: X,
			colorClass: 'text-red-900',
			bgClass: 'bg-red-100',
			borderClass: 'border-red-300'
		}
	};

	const config = $derived(outcomeConfig[outcome]);
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-lg border-2 p-6 text-center {config.bgClass} {config.borderClass}"
	role="status"
	aria-label="Negotiation outcome: {config.title}"
>
	<div class="flex items-center gap-3">
		<svelte:component this={config.icon} class="h-8 w-8 {config.colorClass}" />
		<h2 class="text-xl font-bold {config.colorClass}">{config.title}</h2>
	</div>

	<p class="text-sm {config.colorClass}">{config.description}</p>

	<div class="mt-2 rounded-md bg-white/50 px-4 py-2">
		<p class="text-xs font-semibold uppercase tracking-wide text-gray-600">Interest Level</p>
		<p class="text-2xl font-bold {config.colorClass}">{config.interestRange}</p>
	</div>
</div>
