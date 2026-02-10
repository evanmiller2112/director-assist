<script lang="ts">
	/**
	 * NegotiationProgress Component
	 *
	 * Issue #381: Implement Negotiation UI components (TDD - GREEN phase)
	 *
	 * Displays the current state of a negotiation with:
	 * - Interest level (0-5) with color-coded progress bar
	 * - Patience level (0-5) with countdown-style progress bar
	 * - NPC response preview based on interest level
	 * - Accessible progress bar markup
	 */

	interface Props {
		interest: number;
		patience: number;
	}

	let { interest, patience }: Props = $props();

	// Calculate progress percentages
	const interestPercent = $derived((interest / 5) * 100);
	const patiencePercent = $derived((patience / 5) * 100);

	// Get interest bar color classes
	const interestBarColor = $derived(() => {
		if (interest === 0) return 'bg-red-600';
		if (interest === 1) return 'bg-red-500';
		if (interest === 2) return 'bg-orange-500';
		if (interest === 3) return 'bg-yellow-500';
		if (interest === 4) return 'bg-green-500';
		return 'bg-green-600';
	});

	// Get patience bar color classes
	const patienceBarColor = $derived(() => {
		if (patience === 0) return 'bg-red-600';
		if (patience === 1) return 'bg-orange-600';
		if (patience === 2) return 'bg-yellow-600';
		return 'bg-blue-500';
	});

	// Get NPC response preview text
	const responsePreview = $derived(() => {
		if (interest === 0) return 'Failure - negotiation will fail';
		if (interest === 1) return 'Failure - negotiation will fail';
		if (interest === 2) return 'Minor favor possible';
		if (interest === 3) return 'Major favor possible';
		if (interest === 4) return 'Major favor likely';
		return 'Alliance possible';
	});
</script>

<div class="space-y-4">
	<!-- Interest Section -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium">Interest: {interest}/5</span>
		</div>
		<div class="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-700">
			<div
				data-testid="interest-bar"
				data-value={interest}
				role="progressbar"
				aria-label="Interest level"
				aria-valuenow={interest}
				aria-valuemin={0}
				aria-valuemax={5}
				class="{interestBarColor()} h-4 rounded-full transition-all duration-300"
				style="width: {interestPercent}%"
			></div>
		</div>
	</div>

	<!-- Patience Section -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium">Patience: {patience}/5</span>
		</div>
		<div class="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-700">
			<div
				data-testid="patience-bar"
				role="progressbar"
				aria-label="Patience level"
				aria-valuenow={patience}
				aria-valuemin={0}
				aria-valuemax={5}
				class="{patienceBarColor()} h-4 rounded-full transition-all duration-300"
				style="width: {patiencePercent}%"
			></div>
		</div>
	</div>

	<!-- NPC Response Preview -->
	<div class="rounded-lg border border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
		<p class="text-sm text-gray-700 dark:text-gray-300">
			{responsePreview()}
		</p>
	</div>
</div>
