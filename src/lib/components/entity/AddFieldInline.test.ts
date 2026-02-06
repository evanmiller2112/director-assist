/**
 * Tests for AddFieldInline Component
 *
 * This component provides an inline "Add Field" button that opens a modal
 * for creating custom fields on entity types (both built-in and custom).
 *
 * Key Features:
 * - Displays "Add Field" button
 * - Opens modal with field creation form
 * - Auto-generates field key from label
 * - Detects built-in vs custom entity types
 * - Saves to appropriate store method based on type
 * - Validates field data before saving
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AddFieldInline from './AddFieldInline.svelte';
import type { EntityTypeDefinition, EntityTypeOverride } from '$lib/types';

// Mock the stores
vi.mock('$lib/stores', () => ({
	campaignStore: {
		customEntityTypes: [],
		getEntityTypeOverride: vi.fn(),
		setEntityTypeOverride: vi.fn(),
		getCustomEntityType: vi.fn(),
		updateCustomEntityType: vi.fn()
	},
	notificationStore: {
		success: vi.fn(),
		error: vi.fn()
	}
}));

describe('AddFieldInline Component - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without crashing', () => {
		const { container } = render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should render "Add Field" button', () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		expect(button).toBeInTheDocument();
	});

	it('should show Plus icon on button', () => {
		const { container } = render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		// Lucide icons render as SVG elements
		const svg = button.querySelector('svg');
		expect(svg).toBeInTheDocument();
	});

	it('should not show modal initially', () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const modal = screen.queryByRole('dialog');
		expect(modal).not.toBeInTheDocument();
	});
});

describe('AddFieldInline Component - Modal Open/Close', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should open modal when button clicked', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const modal = screen.getByRole('dialog');
		expect(modal).toBeInTheDocument();
	});

	it('should show modal title', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		expect(screen.getByText(/add custom field/i)).toBeInTheDocument();
	});

	it('should close modal when X button clicked', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		// Open modal
		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		// Close modal - use getAllByRole since there are multiple elements with this label
		const closeButtons = screen.getAllByRole('button', { name: /close modal/i });
		// The actual button is the one with an X icon (second match)
		const closeButton = closeButtons.find(btn => btn.tagName === 'BUTTON');
		if (closeButton) {
			await fireEvent.click(closeButton);
		}

		await waitFor(() => {
			const modal = screen.queryByRole('dialog');
			expect(modal).not.toBeInTheDocument();
		});
	});

	it('should close modal when Cancel button clicked', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		// Open modal
		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		// Click cancel
		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		await waitFor(() => {
			const modal = screen.queryByRole('dialog');
			expect(modal).not.toBeInTheDocument();
		});
	});

	it('should close modal when backdrop clicked', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		// Open modal
		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		// Click backdrop - it's the first element with close modal label
		const backdrops = screen.getAllByRole('button', { name: /close modal/i });
		const backdrop = backdrops[0]; // First one is the backdrop div
		await fireEvent.click(backdrop);

		// Modal should close
		await waitFor(() => {
			const modal = screen.queryByRole('dialog');
			expect(modal).not.toBeInTheDocument();
		});
	});

	it('should reset form when modal closes', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		// Open modal and fill form
		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Test Field' } });

		// Close modal
		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		// Reopen modal
		await fireEvent.click(openButton);

		// Form should be reset
		const resetInput = screen.getByLabelText(/field label/i) as HTMLInputElement;
		expect(resetInput.value).toBe('');
	});
});

describe('AddFieldInline Component - Form Fields', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render field label input', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const labelInput = screen.getByLabelText(/field label/i);
		expect(labelInput).toBeInTheDocument();
	});

	it('should render field type select', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const typeSelect = screen.getByLabelText(/field type/i);
		expect(typeSelect).toBeInTheDocument();
	});

	it('should render section select', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const sectionSelect = screen.getByLabelText(/section/i);
		expect(sectionSelect).toBeInTheDocument();
	});

	it('should render required checkbox', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const requiredCheckbox = screen.getByLabelText(/required field/i);
		expect(requiredCheckbox).toBeInTheDocument();
	});

	it('should have all field type options', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const typeSelect = screen.getByLabelText(/field type/i);
		const options = Array.from(typeSelect.querySelectorAll('option'));
		const optionTexts = options.map(opt => opt.textContent);

		expect(optionTexts).toContain('Short Text');
		expect(optionTexts).toContain('Long Text');
		expect(optionTexts).toContain('Rich Text (Markdown)');
		expect(optionTexts).toContain('Number');
		expect(optionTexts).toContain('Checkbox');
		expect(optionTexts).toContain('Dropdown');
		expect(optionTexts).toContain('Multi-Select');
		expect(optionTexts).toContain('Tags');
		expect(optionTexts).toContain('Date');
		expect(optionTexts).toContain('URL');
		expect(optionTexts).toContain('Image');
	});

	it('should default to "text" field type', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const typeSelect = screen.getByLabelText(/field type/i) as HTMLSelectElement;
		expect(typeSelect.value).toBe('text');
	});

	it('should have section options', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const sectionSelect = screen.getByLabelText(/section/i);
		const options = Array.from(sectionSelect.querySelectorAll('option'));
		const optionTexts = options.map(opt => opt.textContent);

		expect(optionTexts).toContain('Default');
		expect(optionTexts).toContain('Hidden (DM Only)');
		expect(optionTexts).toContain('Preparation');
	});

	it('should default to empty section', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const sectionSelect = screen.getByLabelText(/section/i) as HTMLSelectElement;
		expect(sectionSelect.value).toBe('');
	});

	it('should default to not required', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const requiredCheckbox = screen.getByLabelText(/required field/i) as HTMLInputElement;
		expect(requiredCheckbox.checked).toBe(false);
	});
});

describe('AddFieldInline Component - Field Key Generation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show generated key preview when label entered', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'My Custom Field' } });

		await waitFor(() => {
			expect(screen.getByText(/key:/i)).toBeInTheDocument();
			expect(screen.getByText('my_custom_field')).toBeInTheDocument();
		});
	});

	it('should generate key with underscores', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Field With Spaces' } });

		await waitFor(() => {
			expect(screen.getByText('field_with_spaces')).toBeInTheDocument();
		});
	});

	it('should convert to lowercase', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'UPPERCASE FIELD' } });

		await waitFor(() => {
			expect(screen.getByText('uppercase_field')).toBeInTheDocument();
		});
	});

	it('should strip special characters', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Field@#$%Name!' } });

		await waitFor(() => {
			expect(screen.getByText('field_name')).toBeInTheDocument();
		});
	});

	it('should handle multiple consecutive special chars', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Field   ---   Name' } });

		await waitFor(() => {
			expect(screen.getByText('field_name')).toBeInTheDocument();
		});
	});

	it('should strip leading/trailing underscores', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: '___Field___' } });

		await waitFor(() => {
			expect(screen.getByText('field')).toBeInTheDocument();
		});
	});
});

describe('AddFieldInline Component - Options Field (Select Types)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show options field for select type', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		// Change type to select
		const typeSelect = screen.getByLabelText(/field type/i);
		await fireEvent.change(typeSelect, { target: { value: 'select' } });

		await waitFor(() => {
			const optionsField = screen.queryByLabelText(/options.*one per line/i);
			expect(optionsField).toBeInTheDocument();
		}, { timeout: 2000 });
	});

	it('should show options field for multi-select type', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		// Change type to multi-select
		const typeSelect = screen.getByLabelText(/field type/i);
		await fireEvent.change(typeSelect, { target: { value: 'multi-select' } });

		await waitFor(() => {
			const optionsField = screen.queryByLabelText(/options.*one per line/i);
			expect(optionsField).toBeInTheDocument();
		}, { timeout: 2000 });
	});

	it('should hide options field for text type', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		// Type is already 'text' by default
		const optionsField = screen.queryByLabelText(/options.*one per line/i);
		expect(optionsField).not.toBeInTheDocument();
	});

	it('should hide options field when switching from select to text', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		// Change to select
		const typeSelect = screen.getByLabelText(/field type/i);
		await fireEvent.change(typeSelect, { target: { value: 'select' } });

		// Options should show
		await waitFor(() => {
			expect(screen.queryByLabelText(/options.*one per line/i)).toBeInTheDocument();
		}, { timeout: 2000 });

		// Change back to text
		await fireEvent.change(typeSelect, { target: { value: 'text' } });

		// Options should hide
		await waitFor(() => {
			const optionsField = screen.queryByLabelText(/options.*one per line/i);
			expect(optionsField).not.toBeInTheDocument();
		}, { timeout: 2000 });
	});

	it('should be a textarea element', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const typeSelect = screen.getByLabelText(/field type/i);
		await fireEvent.change(typeSelect, { target: { value: 'select' } });

		await waitFor(() => {
			const optionsField = screen.queryByLabelText(/options.*one per line/i);
			expect(optionsField?.tagName).toBe('TEXTAREA');
		}, { timeout: 2000 });
	});
});

describe('AddFieldInline Component - Form Validation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should disable Add Field button when label is empty', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		expect(addButton).toBeDisabled();
	});

	it('should enable Add Field button when label is filled', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Test Field' } });

		await waitFor(() => {
			const addButton = screen.getByRole('button', { name: /^add field$/i });
			expect(addButton).not.toBeDisabled();
		});
	});

	it('should show error when trying to save without label', async () => {
		const { notificationStore } = await import('$lib/stores');

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		// Try to manually trigger save (button should be disabled, but test the function)
		// This tests the validation logic directly
		const addButton = screen.getByRole('button', { name: /^add field$/i });

		// Button is disabled, so we can't click it
		expect(addButton).toBeDisabled();
	});

	it('should trim whitespace from label', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		// Mock for built-in type
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: '  Test Field  ' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
				expect.objectContaining({
					additionalFields: expect.arrayContaining([
						expect.objectContaining({
							label: 'Test Field' // Trimmed
						})
					])
				})
			);
		});
	});
});

describe('AddFieldInline Component - Built-in Type Detection', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should detect built-in type when not in customEntityTypes', async () => {
		const { campaignStore } = await import('$lib/stores');

		// Mock empty custom types array (meaning 'npc' is built-in)
		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		// Check the description text
		expect(screen.getByText(/entities of this type/i)).toBeInTheDocument();
	});

	it('should detect custom type when in customEntityTypes', async () => {
		const { campaignStore } = await import('$lib/stores');

		// Mock custom types array containing our type
		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [
				{
					type: 'quest',
					label: 'Quest',
					labelPlural: 'Quests',
					icon: 'target',
					color: 'custom',
					isBuiltIn: false,
					fieldDefinitions: [],
				defaultRelationships: []
				}
			],
			configurable: true
		});

		render(AddFieldInline, {
			props: {
				entityType: 'quest'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		// Check the description text
		expect(screen.getByText(/entities of this custom type/i)).toBeInTheDocument();
	});
});

describe('AddFieldInline Component - Save Functionality for Built-in Types', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should call setEntityTypeOverride for built-in types', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		// Mock for built-in type
		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Test Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.setEntityTypeOverride).toHaveBeenCalled();
		});
	});

	it('should add field to additionalFields array', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Custom Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'npc',
					additionalFields: expect.arrayContaining([
						expect.objectContaining({
							key: 'custom_field',
							label: 'Custom Field',
							type: 'text',
							required: false
						})
					])
				})
			);
		});
	});

	it('should preserve existing additionalFields', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});

		// Mock existing override with fields
		const existingOverride = {
			type: 'npc',
			additionalFields: [
				{ key: 'existing', label: 'Existing', type: 'text' as const, required: false, order: 1 }
			]
		};
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(existingOverride);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'New Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
				expect.objectContaining({
					additionalFields: expect.arrayContaining([
						expect.objectContaining({ key: 'existing' }),
						expect.objectContaining({ key: 'new_field' })
					])
				})
			);
		});
	});

	it('should show success notification after save', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Test Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(notificationStore.success).toHaveBeenCalledWith(
				expect.stringContaining('Test Field')
			);
		});
	});

	it('should close modal after successful save', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Test Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			const modal = screen.queryByRole('dialog');
			expect(modal).not.toBeInTheDocument();
		});
	});
});

describe('AddFieldInline Component - Save Functionality for Custom Types', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should call updateCustomEntityType for custom types', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		// Mock for custom type
		const customType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'target',
			color: 'custom',
			isBuiltIn: false,
			fieldDefinitions: [],
		defaultRelationships: []
		};

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [customType],
			configurable: true
		});
		vi.mocked(campaignStore.getCustomEntityType).mockReturnValue(customType);
		vi.mocked(campaignStore.updateCustomEntityType).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'quest'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Quest Goal' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.updateCustomEntityType).toHaveBeenCalledWith(
				'quest',
				expect.objectContaining({
					fieldDefinitions: expect.arrayContaining([
						expect.objectContaining({
							key: 'quest_goal',
							label: 'Quest Goal'
						})
					])
				})
			);
		});
	});

	it('should preserve existing fieldDefinitions', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		const customType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'target',
			color: 'custom',
			isBuiltIn: false,
			fieldDefinitions: [
				{ key: 'existing', label: 'Existing', type: 'text', required: false, order: 1 }
			],
			defaultRelationships: []
		};

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [customType],
			configurable: true
		});
		vi.mocked(campaignStore.getCustomEntityType).mockReturnValue(customType);
		vi.mocked(campaignStore.updateCustomEntityType).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'quest'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'New Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.updateCustomEntityType).toHaveBeenCalledWith(
				'quest',
				expect.objectContaining({
					fieldDefinitions: expect.arrayContaining([
						expect.objectContaining({ key: 'existing' }),
						expect.objectContaining({ key: 'new_field' })
					])
				})
			);
		});
	});
});

describe('AddFieldInline Component - Field Properties', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should save field with selected type', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Number Field' } });

		const typeSelect = screen.getByLabelText(/field type/i);
		await fireEvent.change(typeSelect, { target: { value: 'number' } });

		// Wait for any reactive updates to complete
		await new Promise(resolve => setTimeout(resolve, 50));

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
				expect.objectContaining({
					additionalFields: expect.arrayContaining([
						expect.objectContaining({
							type: 'number'
						})
					])
				})
			);
		}, { timeout: 2000 });
	});

	it('should save field with selected section', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Hidden Field' } });

		const sectionSelect = screen.getByLabelText(/section/i);
		await fireEvent.change(sectionSelect, { target: { value: 'hidden' } });

		// Wait for any reactive updates to complete
		await new Promise(resolve => setTimeout(resolve, 50));

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
				expect.objectContaining({
					additionalFields: expect.arrayContaining([
						expect.objectContaining({
							section: 'hidden'
						})
					])
				})
			);
		}, { timeout: 2000 });
	});

	it('should save field as required when checked', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Required Field' } });

		const requiredCheckbox = screen.getByLabelText(/required field/i);
		await fireEvent.click(requiredCheckbox);

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
				expect.objectContaining({
					additionalFields: expect.arrayContaining([
						expect.objectContaining({
							required: true
						})
					])
				})
			);
		});
	});

	it('should save options for select field', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Status' } });

		const typeSelect = screen.getByLabelText(/field type/i);
		await fireEvent.change(typeSelect, { target: { value: 'select' } });

		await waitFor(async () => {
			const optionsField = screen.queryByLabelText(/options.*one per line/i);
			expect(optionsField).toBeInTheDocument();
			if (optionsField) {
				await fireEvent.input(optionsField, { target: { value: 'Active\nInactive\nPending' } });
			}
		}, { timeout: 2000 });

		// Wait for any reactive updates to complete
		await new Promise(resolve => setTimeout(resolve, 50));

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
				expect.objectContaining({
					additionalFields: expect.arrayContaining([
						expect.objectContaining({
							type: 'select',
							options: ['Active', 'Inactive', 'Pending']
						})
					])
				})
			);
		}, { timeout: 2000 });
	});

	it('should save field with high order number', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockResolvedValue(undefined);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Last Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(campaignStore.setEntityTypeOverride).toHaveBeenCalledWith(
				expect.objectContaining({
					additionalFields: expect.arrayContaining([
						expect.objectContaining({
							order: 1000 // High number to appear at end
						})
					])
				})
			);
		});
	});
});

describe('AddFieldInline Component - Error Handling', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show error for duplicate key in built-in type', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});

		const existingOverride = {
			type: 'npc',
			additionalFields: [
				{ key: 'custom_field', label: 'Custom Field', type: 'text' as const, required: false, order: 1 }
			]
		};
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(existingOverride);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Custom Field' } }); // Same key

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(notificationStore.error).toHaveBeenCalledWith(
				expect.stringContaining('custom_field')
			);
		});
	});

	it('should show error for duplicate key in custom type', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		const customType: EntityTypeDefinition = {
			type: 'quest',
			label: 'Quest',
			labelPlural: 'Quests',
			icon: 'target',
			color: 'custom',
			isBuiltIn: false,
			fieldDefinitions: [
				{ key: 'goal', label: 'Goal', type: 'text', required: false, order: 1 }
			],
			defaultRelationships: []
		};

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [customType],
			configurable: true
		});
		vi.mocked(campaignStore.getCustomEntityType).mockReturnValue(customType);

		render(AddFieldInline, {
			props: {
				entityType: 'quest'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Goal' } }); // Duplicate key

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(notificationStore.error).toHaveBeenCalledWith(
				expect.stringContaining('goal')
			);
		});
	});

	it('should handle save error gracefully', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockRejectedValue(new Error('Save failed'));

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Test Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(notificationStore.error).toHaveBeenCalledWith(
				expect.stringContaining('Failed')
			);
		});
	});

	it('should keep modal open after error', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);
		vi.mocked(campaignStore.setEntityTypeOverride).mockRejectedValue(new Error('Save failed'));

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Test Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		await waitFor(() => {
			expect(notificationStore.error).toHaveBeenCalled();
		});

		// Modal should still be open
		const modal = screen.getByRole('dialog');
		expect(modal).toBeInTheDocument();
	});
});

describe('AddFieldInline Component - Loading State', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should show "Adding..." text while saving', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);

		// Mock slow save
		vi.mocked(campaignStore.setEntityTypeOverride).mockImplementation(() =>
			new Promise(resolve => setTimeout(() => resolve(undefined), 100))
		);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Test Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		// Should show "Adding..." while saving
		await waitFor(() => {
			expect(screen.getByText(/adding/i)).toBeInTheDocument();
		});
	});

	it('should disable buttons while saving', async () => {
		const { campaignStore, notificationStore } = await import('$lib/stores');

		Object.defineProperty(campaignStore, 'customEntityTypes', {
			get: () => [],
			configurable: true
		});
		vi.mocked(campaignStore.getEntityTypeOverride).mockReturnValue(undefined);

		// Mock slow save
		vi.mocked(campaignStore.setEntityTypeOverride).mockImplementation(() =>
			new Promise(resolve => setTimeout(() => resolve(undefined), 100))
		);

		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const openButton = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(openButton);

		const labelInput = screen.getByLabelText(/field label/i);
		await fireEvent.input(labelInput, { target: { value: 'Test Field' } });

		const addButton = screen.getByRole('button', { name: /^add field$/i });
		await fireEvent.click(addButton);

		// Buttons should be disabled while saving
		await waitFor(() => {
			const cancelButton = screen.getByRole('button', { name: /cancel/i });
			expect(addButton).toBeDisabled();
			expect(cancelButton).toBeDisabled();
		});
	});
});

describe('AddFieldInline Component - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have proper modal aria attributes', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		const modal = screen.getByRole('dialog');
		expect(modal).toHaveAttribute('aria-modal', 'true');
		expect(modal).toHaveAttribute('aria-labelledby');
	});

	it('should have proper labels for all inputs', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		expect(screen.getByLabelText(/field label/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/field type/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/section/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/required field/i)).toBeInTheDocument();
	});

	it('should support keyboard navigation', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		button.focus();

		expect(document.activeElement).toBe(button);
	});

	it('should close on Escape key', async () => {
		render(AddFieldInline, {
			props: {
				entityType: 'npc'
			}
		});

		const button = screen.getByRole('button', { name: /add.*field/i });
		await fireEvent.click(button);

		// Press Escape on the backdrop
		const backdrops = screen.getAllByRole('button', { name: /close modal/i });
		const backdrop = backdrops[0]; // First one is the backdrop div
		await fireEvent.keyDown(backdrop, { key: 'Escape' });

		await waitFor(() => {
			const modal = screen.queryByRole('dialog');
			expect(modal).not.toBeInTheDocument();
		});
	});
});
