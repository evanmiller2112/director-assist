<script lang="ts">
/**
 * SceneStatusBadge Component
 *
 * Displays a visual indicator of scene status with appropriate color coding:
 * - 'planned' (blue badge)
 * - 'active' (yellow/amber badge)
 * - 'completed' (green badge)
 */

interface Props {
	status?: 'planned' | 'active' | 'completed';
}

let { status = 'planned' }: Props = $props();

// Derive display values
const displayText = $derived(() => {
	const statusValue = status ?? 'planned';
	return statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
});

const badgeClasses = $derived(() => {
	const statusValue = status ?? 'planned';
	const baseClasses = 'badge px-2 py-1 rounded text-sm font-medium';

	switch (statusValue) {
		case 'active':
			return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
		case 'completed':
			return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
		case 'planned':
		default:
			return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
	}
});
</script>

<span
	class={badgeClasses()}
	data-testid="scene-status-badge"
	role="status"
	aria-label={`Scene status: ${displayText()}`}
>
	{displayText()}
</span>
