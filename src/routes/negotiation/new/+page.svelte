<script lang="ts">
	import { goto } from '$app/navigation';
	import { negotiationStore } from '$lib/stores';
	import { NegotiationSetup } from '$lib/components/negotiation';
	import { ArrowLeft } from 'lucide-svelte';
	import { entityRepository } from '$lib/db/repositories/entityRepository';

	interface NegotiationSetupOutput {
		name: string;
		npcName: string;
		npcEntityId?: string;
		description?: string;
		interest: number;
		patience: number;
		impression: number;
		motivations: Array<{ type: string; isKnown: boolean }>;
		pitfalls: Array<{ type: string; isKnown: boolean }>;
	}

	async function handleCreate(data: NegotiationSetupOutput) {
		// Transform the data to match CreateNegotiationInput
		const input = {
			name: data.name,
			npcName: data.npcName,
			npcEntityId: data.npcEntityId,
			description: data.description,
			interest: data.interest,
			patience: data.patience,
			impression: data.impression,
			motivations: data.motivations.map((m) => ({
				type: m.type,
				description: formatMotivationType(m.type)
			})),
			pitfalls: data.pitfalls.map((p) => ({
				description: formatMotivationType(p.type)
			}))
		};

		const negotiation = await negotiationStore.createNegotiation(input);

		// Create relationship if npcEntityId is provided (non-blocking)
		if (data.npcEntityId) {
			try {
				await entityRepository.addLink(
					data.npcEntityId,
					negotiation.id,
					'negotiated_with',
					false,
					`Negotiation: ${negotiation.name}`,
					undefined,
					{ negotiationId: negotiation.id }
				);
			} catch (error) {
				console.error('Failed to create entity relationship for negotiation:', error);
				// Don't block navigation if relationship creation fails
			}
		}

		// Redirect to negotiation detail page
		goto(`/negotiation/${negotiation.id}`);
	}

	function handleCancel() {
		goto('/negotiation');
	}

	function formatMotivationType(type: string): string {
		return type
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<div class="new-negotiation-page p-6 max-w-2xl mx-auto">
	<!-- Back Button -->
	<button class="btn btn-secondary mb-6" onclick={handleCancel} aria-label="Back to negotiation list">
		<ArrowLeft class="w-4 h-4" />
		Back
	</button>

	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">New Negotiation</h1>
		<p class="text-slate-600 dark:text-slate-400">
			Set up a new Draw Steel negotiation with an NPC.
		</p>
	</div>

	<!-- Setup Form -->
	<div
		class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
	>
		<NegotiationSetup onCreate={handleCreate} onCancel={handleCancel} />
	</div>
</div>
