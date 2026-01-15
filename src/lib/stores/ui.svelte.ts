// UI state store using Svelte 5 runes
function createUIStore() {
	let sidebarCollapsed = $state(false);
	let chatPanelOpen = $state(false);
	let activeModal = $state<string | null>(null);
	let selectedEntityId = $state<string | null>(null);
	let theme = $state<'light' | 'dark' | 'system'>('system');

	// Computed: actual theme based on system preference
	const resolvedTheme = $derived(() => {
		if (theme === 'system') {
			if (typeof window !== 'undefined') {
				return window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'dark'
					: 'light';
			}
			return 'light';
		}
		return theme;
	});

	return {
		get sidebarCollapsed() {
			return sidebarCollapsed;
		},
		get chatPanelOpen() {
			return chatPanelOpen;
		},
		get activeModal() {
			return activeModal;
		},
		get selectedEntityId() {
			return selectedEntityId;
		},
		get theme() {
			return theme;
		},
		get resolvedTheme() {
			return resolvedTheme;
		},

		toggleSidebar() {
			sidebarCollapsed = !sidebarCollapsed;
		},

		toggleChatPanel() {
			chatPanelOpen = !chatPanelOpen;
		},

		openChatPanel() {
			chatPanelOpen = true;
		},

		closeChatPanel() {
			chatPanelOpen = false;
		},

		openModal(modalId: string) {
			activeModal = modalId;
		},

		closeModal() {
			activeModal = null;
		},

		selectEntity(id: string | null) {
			selectedEntityId = id;
		},

		setTheme(newTheme: 'light' | 'dark' | 'system') {
			theme = newTheme;
			if (typeof window !== 'undefined') {
				localStorage.setItem('theme', newTheme);
				this.applyTheme();
			}
		},

		loadTheme() {
			if (typeof window !== 'undefined') {
				const stored = localStorage.getItem('theme') as
					| 'light'
					| 'dark'
					| 'system'
					| null;
				if (stored) {
					theme = stored;
				}
				this.applyTheme();
			}
		},

		applyTheme() {
			if (typeof document !== 'undefined') {
				const resolved =
					theme === 'system'
						? window.matchMedia('(prefers-color-scheme: dark)').matches
							? 'dark'
							: 'light'
						: theme;

				document.documentElement.classList.toggle('dark', resolved === 'dark');
			}
		}
	};
}

export const uiStore = createUIStore();
