/**
 * Tests for FieldReorderInline Component
 *
 * This component provides inline field reordering controls.
 * It renders up/down buttons for a single field at a specific index.
 *
 * Props:
 * - entityType: string - The entity type being edited
 * - fieldDefinitions: FieldDefinition[] - All field definitions (for determining order)
 * - fieldIndex: number - The index of this field in the list
 * - totalFields: number - Total number of fields
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import FieldReorderInline from './FieldReorderInline.svelte';
import type { FieldDefinition } from '$lib/types';

// Mock the stores
vi.mock('$lib/stores', () => ({
	campaignStore: {
		getEntityTypeOverride: vi.fn(),
		setEntityTypeOverride: vi.fn()
	},
	notificationStore: {
		success: vi.fn(),
		error: vi.fn()
	}
}));

const mockFields: FieldDefinition[] = [
	{ key: 'name', label: 'Name', type: 'text', required: true, order: 1 },
	{ key: 'description', label: 'Description', type: 'textarea', required: false, order: 2 },
	{ key: 'alignment', label: 'Alignment', type: 'select', required: false, order: 3 }
];

describe('FieldReorderInline Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render up and down buttons', () => {
			const { container } = render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: mockFields,
					fieldIndex: 1,
					totalFields: 3
				}
			});

			const buttons = container.querySelectorAll('button');
			expect(buttons.length).toBe(2); // up and down buttons
		});

		it('should have proper aria labels', () => {
			render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: mockFields,
					fieldIndex: 1,
					totalFields: 3
				}
			});

			expect(screen.getByLabelText('Move field up')).toBeInTheDocument();
			expect(screen.getByLabelText('Move field down')).toBeInTheDocument();
		});
	});

	describe('Button States', () => {
		it('should disable up button for first field', () => {
			render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: mockFields,
					fieldIndex: 0,
					totalFields: 3
				}
			});

			const upButton = screen.getByLabelText('Move field up');
			expect(upButton).toBeDisabled();
		});

		it('should disable down button for last field', () => {
			render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: mockFields,
					fieldIndex: 2,
					totalFields: 3
				}
			});

			const downButton = screen.getByLabelText('Move field down');
			expect(downButton).toBeDisabled();
		});

		it('should enable both buttons for middle field', () => {
			render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: mockFields,
					fieldIndex: 1,
					totalFields: 3
				}
			});

			const upButton = screen.getByLabelText('Move field up');
			const downButton = screen.getByLabelText('Move field down');
			expect(upButton).not.toBeDisabled();
			expect(downButton).not.toBeDisabled();
		});

		it('should disable both buttons when there is only one field', () => {
			render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: [mockFields[0]],
					fieldIndex: 0,
					totalFields: 1
				}
			});

			const upButton = screen.getByLabelText('Move field up');
			const downButton = screen.getByLabelText('Move field down');
			expect(upButton).toBeDisabled();
			expect(downButton).toBeDisabled();
		});
	});

	describe('Move Field Up', () => {
		it('should call setEntityTypeOverride when moving field up', async () => {
			const { campaignStore } = await import('$lib/stores');
			vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
			vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

			render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: mockFields,
					fieldIndex: 1,
					totalFields: 3
				}
			});

			const upButton = screen.getByLabelText('Move field up');
			await fireEvent.click(upButton);

			await waitFor(() => {
				expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
					expect.objectContaining({
						type: 'npc',
						fieldOrder: ['description', 'name', 'alignment']
					})
				);
			});
		});

		it('should preserve existing override properties when moving', async () => {
			const { campaignStore } = await import('$lib/stores');
			vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue({
				type: 'npc',
				hiddenFields: ['secret'],
				fieldOrder: ['name', 'description', 'alignment']
			});
			vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

			render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: mockFields,
					fieldIndex: 1,
					totalFields: 3
				}
			});

			const upButton = screen.getByLabelText('Move field up');
			await fireEvent.click(upButton);

			await waitFor(() => {
				expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
					expect.objectContaining({
						type: 'npc',
						hiddenFields: ['secret'],
						fieldOrder: ['description', 'name', 'alignment']
					})
				);
			});
		});
	});

	describe('Move Field Down', () => {
		it('should call setEntityTypeOverride when moving field down', async () => {
			const { campaignStore } = await import('$lib/stores');
			vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
			vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

			render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: mockFields,
					fieldIndex: 0,
					totalFields: 3
				}
			});

			const downButton = screen.getByLabelText('Move field down');
			await fireEvent.click(downButton);

			await waitFor(() => {
				expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
					expect.objectContaining({
						type: 'npc',
						fieldOrder: ['description', 'name', 'alignment']
					})
				);
			});
		});
	});

	describe('Error Handling', () => {
		it('should show error notification on save failure', async () => {
			const { campaignStore, notificationStore } = await import('$lib/stores');
			vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
			vi.mocked(campaignStore.setEntityTypeOverride).mockRejectedValue(new Error('Save failed'));

			render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: mockFields,
					fieldIndex: 1,
					totalFields: 3
				}
			});

			const upButton = screen.getByLabelText('Move field up');
			await fireEvent.click(upButton);

			await waitFor(() => {
				expect(notificationStore.error).toHaveBeenCalledWith('Failed to update field order');
			});
		});
	});

	describe('Field Order Calculation', () => {
		it('should use fieldDefinitions array order directly', async () => {
			const { campaignStore } = await import('$lib/stores');
			vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
			vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

			// Pass fields in a custom order (as if parent already applied an override)
			const customOrderFields: FieldDefinition[] = [
				{ key: 'alignment', label: 'Alignment', type: 'select', required: false, order: 3 },
				{ key: 'description', label: 'Description', type: 'textarea', required: false, order: 2 },
				{ key: 'name', label: 'Name', type: 'text', required: true, order: 1 }
			];

			render(FieldReorderInline, {
				props: {
					entityType: 'npc',
					fieldDefinitions: customOrderFields,
					fieldIndex: 1, // This is 'description' in the passed array
					totalFields: 3
				}
			});

			const upButton = screen.getByLabelText('Move field up');
			await fireEvent.click(upButton);

			await waitFor(() => {
				// Moving 'description' up should swap with 'alignment'
				expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
					expect.objectContaining({
						fieldOrder: ['description', 'alignment', 'name']
					})
				);
			});
		});
	});
});
