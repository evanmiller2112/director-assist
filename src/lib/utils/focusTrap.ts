const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function trapFocus(container: HTMLElement): () => void {
	const previouslyFocused = document.activeElement as HTMLElement;

	function handleKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;

		const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	container.addEventListener('keydown', handleKeydown);

	// Focus first focusable element
	const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
	if (firstFocusable) firstFocusable.focus();

	return () => {
		container.removeEventListener('keydown', handleKeydown);
		if (previouslyFocused && previouslyFocused.focus) {
			previouslyFocused.focus();
		}
	};
}
