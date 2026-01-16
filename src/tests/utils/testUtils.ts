import type { BaseEntity, EntityType } from '$lib/types';

/**
 * Creates a mock entity for testing
 */
export function createMockEntity(
	overrides: Partial<BaseEntity> = {}
): BaseEntity {
	const now = new Date();
	return {
		id: `test-${Math.random().toString(36).substring(7)}`,
		type: 'character',
		name: 'Test Entity',
		description: 'Test description',
		tags: [],
		fields: {},
		links: [],
		notes: '',
		createdAt: now,
		updatedAt: now,
		metadata: {},
		...overrides
	};
}

/**
 * Creates multiple mock entities for testing
 */
export function createMockEntities(count: number, overrides: Partial<BaseEntity>[] = []): BaseEntity[] {
	return Array.from({ length: count }, (_, i) =>
		createMockEntity({
			id: `entity-${i}`,
			name: `Entity ${i}`,
			...overrides[i]
		})
	);
}

/**
 * Waits for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulates user typing with debounce delay
 */
export async function typeWithDebounce(
	element: HTMLInputElement,
	text: string,
	debounceMs: number = 150
): Promise<void> {
	element.value = text;
	element.dispatchEvent(new Event('input', { bubbles: true }));
	await wait(debounceMs + 10); // Wait for debounce + small buffer
}

/**
 * Creates a keyboard event
 */
export function createKeyboardEvent(
	key: string,
	options: Partial<KeyboardEventInit> = {}
): KeyboardEvent {
	return new KeyboardEvent('keydown', {
		key,
		bubbles: true,
		cancelable: true,
		...options
	});
}
