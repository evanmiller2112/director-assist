/**
 * Toast notification store
 * Provides methods to show success, error, and info notifications
 */

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration: number;
}

class NotificationStore {
	toasts = $state<Toast[]>([]);
	private counter = 0;

	/**
	 * Add a new toast notification
	 */
	private add(type: ToastType, message: string, duration = 4000): string {
		const id = `toast-${++this.counter}-${Date.now()}`;

		this.toasts.push({
			id,
			type,
			message,
			duration
		});

		// Auto-dismiss after duration
		if (duration > 0) {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}

		return id;
	}

	/**
	 * Show a success notification
	 */
	success(message: string, duration?: number): string {
		return this.add('success', message, duration);
	}

	/**
	 * Show an error notification
	 */
	error(message: string, duration?: number): string {
		return this.add('error', message, duration);
	}

	/**
	 * Show an info notification
	 */
	info(message: string, duration?: number): string {
		return this.add('info', message, duration);
	}

	/**
	 * Dismiss a specific toast by ID
	 */
	dismiss(id: string): void {
		const index = this.toasts.findIndex((t) => t.id === id);
		if (index !== -1) {
			this.toasts.splice(index, 1);
		}
	}

	/**
	 * Clear all toasts
	 */
	clear(): void {
		this.toasts = [];
	}
}

export const notificationStore = new NotificationStore();
