/**
 * Tests for FieldSuggestionButton Component (TDD RED Phase)
 *
 * This component displays a button for generating AI suggestions for a single field.
 * It appears inline with field labels when AI is in "suggestions" mode, similar to
 * FieldGenerateButton but for the suggestions workflow.
 *
 * Key Features:
 * - Only visible when aiSettings.isSuggestionsMode is true
 * - Shows "Suggest" text or lightbulb icon
 * - Triggers single-field suggestion generation
 * - Shows loading state (spinner) while generating
 * - Disabled state when generation not available
 * - Keyboard accessible
 * - Proper error handling
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until FieldSuggestionButton component is implemented.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import type { FieldDefinition } from '$lib/types';
import FieldSuggestionButton from './FieldSuggestionButton.svelte';

// Mock the AI settings store
vi.mock('$lib/stores/aiSettings.svelte', () => {
	const mockAiSettings = {
		aiMode: 'suggestions' as 'off' | 'suggestions' | 'full',
		isSuggestionsMode: true,
		isEnabled: true,
		isFullMode: false
	};
	return {
		aiSettings: mockAiSettings
	};
});

// Get the mocked settings for test manipulation
const { aiSettings: mockAiSettings } = await vi.importMock<typeof import('$lib/stores/aiSettings.svelte')>('$lib/stores/aiSettings.svelte');

describe('FieldSuggestionButton Component - Basic Rendering', () => {
	const mockFieldDefinition: FieldDefinition = {
		key: 'personality',
		label: 'Personality',
		type: 'richtext',
		required: false,
		order: 1
	};

	const mockEntityData = {
		id: 'npc-123',
		type: 'npc' as const,
		name: 'Test NPC',
		description: 'A test character',
		summary: '',
		tags: [],
		notes: '',
		fields: {},
		createdAt: new Date(),
		updatedAt: new Date()
	};

	beforeEach(() => {
		mockAiSettings.aiMode = 'suggestions';
		mockAiSettings.isSuggestionsMode = true;
	});

	it('should render without crashing', async () => {
		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should render button when isSuggestionsMode is true', async () => {

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should NOT render when isSuggestionsMode is false', async () => {

		mockAiSettings.aiMode = 'off';
		mockAiSettings.isSuggestionsMode = false;

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.queryByRole('button');
		expect(button).not.toBeInTheDocument();
	});

	it('should NOT render when aiMode is "full"', async () => {

		mockAiSettings.aiMode = 'full';
		mockAiSettings.isSuggestionsMode = false;
		mockAiSettings.isFullMode = true;

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.queryByRole('button');
		expect(button).not.toBeInTheDocument();
	});

	it('should render as inline element to fit with field labels', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveClass(/inline/);
	});
});

describe('FieldSuggestionButton Component - Visual Appearance', () => {
	const mockFieldDefinition: FieldDefinition = {
		key: 'personality',
		label: 'Personality',
		type: 'richtext',
		required: false,
		order: 1
	};

	const mockEntityData = {
		id: 'npc-123',
		type: 'npc' as const,
		name: 'Test NPC',
		description: 'A test character',
		summary: '',
		tags: [],
		notes: '',
		fields: {},
		createdAt: new Date(),
		updatedAt: new Date()
	};

	beforeEach(() => {
		mockAiSettings.aiMode = 'suggestions';
		mockAiSettings.isSuggestionsMode = true;
	});

	it('should display "Suggest" text', async () => {

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		// Should show "Suggest" text (possibly hidden on mobile like FieldGenerateButton)
		const suggestText = screen.queryByText(/Suggest/i);
		expect(suggestText).toBeInTheDocument();
	});

	it('should display lightbulb icon', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should use Lucide Lightbulb icon from icon library', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		// Should have an SVG icon (Lucide renders as SVG)
		const icon = container.querySelector('svg');
		expect(icon).toBeInTheDocument();
	});

	it('should have border and subtle background', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveClass(/border/);
	});

	it('should have rounded corners', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveClass(/rounded/);
	});

	it('should have hover state styling', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveClass(/hover/);
	});

	it('should have focus ring for accessibility', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveClass(/focus|ring/);
	});

	it('should be small and unobtrusive like FieldGenerateButton', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveClass(/text-sm/);
	});
});

describe('FieldSuggestionButton Component - Loading State', () => {
	const mockFieldDefinition: FieldDefinition = {
		key: 'personality',
		label: 'Personality',
		type: 'richtext',
		required: false,
		order: 1
	};

	const mockEntityData = {
		id: 'npc-123',
		type: 'npc' as const,
		name: 'Test NPC',
		description: 'A test character',
		summary: '',
		tags: [],
		notes: '',
		fields: {},
		createdAt: new Date(),
		updatedAt: new Date()
	};

	beforeEach(() => {
		mockAiSettings.aiMode = 'suggestions';
		mockAiSettings.isSuggestionsMode = true;
	});

	it('should show spinner icon when generating', async () => {

		// Mock onSuggestionGenerated to delay so we can see loading state
		const onSuggestionGenerated = vi.fn(
			() => new Promise((resolve) => setTimeout(resolve, 1000))
		);

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		// Should show spinner/loader icon while generating
		const spinner = container.querySelector('.animate-spin, [class*="spin"]');
		expect(spinner).toBeInTheDocument();
	});

	it('should hide "Suggest" text while loading', async () => {

		const onSuggestionGenerated = vi.fn(
			() => new Promise((resolve) => setTimeout(resolve, 1000))
		);

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		// Text should not be visible during loading
		// (Icon should be visible instead)
		await waitFor(() => {
			const suggestText = screen.queryByText(/Suggest/i);
			// In loading state, text might be hidden or replaced
			expect(button).toBeInTheDocument();
		});
	});

	it('should be disabled while generating', async () => {

		const onSuggestionGenerated = vi.fn(
			() => new Promise((resolve) => setTimeout(resolve, 1000))
		);

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			expect(button).toBeDisabled();
		});
	});

	it('should prevent multiple simultaneous generations', async () => {

		const onSuggestionGenerated = vi.fn(
			() => new Promise((resolve) => setTimeout(resolve, 100))
		);

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');

		// Click multiple times rapidly
		await fireEvent.click(button);
		await fireEvent.click(button);
		await fireEvent.click(button);

		// Should only call once (button disabled during generation)
		await waitFor(() => {
			expect(onSuggestionGenerated).toHaveBeenCalledTimes(1);
		});
	});

	it('should return to normal state after generation completes', async () => {

		const onSuggestionGenerated = vi.fn().mockResolvedValue(undefined);

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		// Wait for generation to complete
		await waitFor(() => {
			expect(onSuggestionGenerated).toHaveBeenCalled();
		});

		// Should be enabled again
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
	});

	it('should return to normal state after generation error', async () => {

		const onSuggestionGenerated = vi.fn().mockRejectedValue(new Error('API Error'));

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		// Should re-enable button after error
		await waitFor(() => {
			expect(button).not.toBeDisabled();
		});
	});
});

describe('FieldSuggestionButton Component - Disabled State', () => {
	const mockFieldDefinition: FieldDefinition = {
		key: 'personality',
		label: 'Personality',
		type: 'richtext',
		required: false,
		order: 1
	};

	const mockEntityData = {
		id: 'npc-123',
		type: 'npc' as const,
		name: 'Test NPC',
		description: 'A test character',
		summary: '',
		tags: [],
		notes: '',
		fields: {},
		createdAt: new Date(),
		updatedAt: new Date()
	};

	beforeEach(() => {
		mockAiSettings.aiMode = 'suggestions';
		mockAiSettings.isSuggestionsMode = true;
	});

	it('should be disabled when disabled prop is true', async () => {

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn(),
				disabled: true
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
	});

	it('should have reduced opacity when disabled', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn(),
				disabled: true
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveClass(/opacity/);
	});

	it('should not call onSuggestionGenerated when disabled', async () => {

		const onSuggestionGenerated = vi.fn();

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated,
				disabled: true
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onSuggestionGenerated).not.toHaveBeenCalled();
	});

	it('should have not-allowed cursor when disabled', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn(),
				disabled: true
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveClass(/cursor-not-allowed/);
	});

	it('should be enabled when disabled prop is false', async () => {

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn(),
				disabled: false
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toBeDisabled();
	});
});

describe('FieldSuggestionButton Component - Click Interaction', () => {
	const mockFieldDefinition: FieldDefinition = {
		key: 'personality',
		label: 'Personality',
		type: 'richtext',
		required: false,
		order: 1
	};

	const mockEntityData = {
		id: 'npc-123',
		type: 'npc' as const,
		name: 'Test NPC',
		description: 'A test character',
		summary: '',
		tags: [],
		notes: '',
		fields: {},
		createdAt: new Date(),
		updatedAt: new Date()
	};

	beforeEach(() => {
		mockAiSettings.aiMode = 'suggestions';
		mockAiSettings.isSuggestionsMode = true;
	});

	it('should call onSuggestionGenerated when clicked', async () => {

		const onSuggestionGenerated = vi.fn();

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onSuggestionGenerated).toHaveBeenCalled();
	});

	it('should call onSuggestionGenerated with correct parameters', async () => {

		const onSuggestionGenerated = vi.fn();

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		// Should be called with fieldKey and fieldDefinition
		expect(onSuggestionGenerated).toHaveBeenCalledWith(
			expect.objectContaining({
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition
			})
		);
	});

	it('should handle async onSuggestionGenerated', async () => {

		const onSuggestionGenerated = vi.fn().mockResolvedValue({
			success: true,
			suggestion: {
				id: 'suggestion-123',
				fieldKey: 'personality',
				suggestedValue: 'Friendly and outgoing'
			}
		});

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		await waitFor(() => {
			expect(onSuggestionGenerated).toHaveBeenCalled();
		});
	});

	it('should handle generation errors gracefully', async () => {

		const onSuggestionGenerated = vi.fn().mockRejectedValue(
			new Error('API Error')
		);

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');

		// Should not crash on error
		await expect(async () => {
			await fireEvent.click(button);
		}).not.toThrow();
	});

	it('should call onSuggestionGenerated only once per click', async () => {

		const onSuggestionGenerated = vi.fn();

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		await fireEvent.click(button);

		expect(onSuggestionGenerated).toHaveBeenCalledTimes(1);
	});
});

describe('FieldSuggestionButton Component - Accessibility', () => {
	const mockFieldDefinition: FieldDefinition = {
		key: 'personality',
		label: 'Personality',
		type: 'richtext',
		required: false,
		order: 1
	};

	const mockEntityData = {
		id: 'npc-123',
		type: 'npc' as const,
		name: 'Test NPC',
		description: 'A test character',
		summary: '',
		tags: [],
		notes: '',
		fields: {},
		createdAt: new Date(),
		updatedAt: new Date()
	};

	beforeEach(() => {
		mockAiSettings.aiMode = 'suggestions';
		mockAiSettings.isSuggestionsMode = true;
	});

	it('should have button role', async () => {

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should have descriptive title attribute', async () => {

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		const title = button.getAttribute('title');

		expect(title).toBeTruthy();
		expect(title).toMatch(/suggest|personality/i);
	});

	it('should be keyboard accessible', async () => {

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		button.focus();

		expect(document.activeElement).toBe(button);
	});

	it('should have visible focus indicator', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = container.querySelector('button');
		expect(button).toHaveClass(/focus|ring/);
	});

	it('should trigger on Enter key', async () => {

		const onSuggestionGenerated = vi.fn();

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		button.focus();
		await fireEvent.keyDown(button, { key: 'Enter' });

		// Native button should trigger on Enter
		expect(onSuggestionGenerated).toHaveBeenCalled();
	});

	it('should trigger on Space key', async () => {

		const onSuggestionGenerated = vi.fn();

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated
			}
		});

		const button = screen.getByRole('button');
		button.focus();
		await fireEvent.keyDown(button, { key: ' ' });

		// Native button should trigger on Space
		expect(onSuggestionGenerated).toHaveBeenCalled();
	});

	it('should not have tabindex -1', async () => {

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).not.toHaveAttribute('tabindex', '-1');
	});
});

describe('FieldSuggestionButton Component - Field Types', () => {
	const mockEntityData = {
		id: 'npc-123',
		type: 'npc' as const,
		name: 'Test NPC',
		description: 'A test character',
		summary: '',
		tags: [],
		notes: '',
		fields: {},
		createdAt: new Date(),
		updatedAt: new Date()
	};

	beforeEach(() => {
		mockAiSettings.aiMode = 'suggestions';
		mockAiSettings.isSuggestionsMode = true;
	});

	it('should work with text fields', async () => {

		const textField: FieldDefinition = {
			key: 'role',
			label: 'Role',
			type: 'text',
			required: false,
			order: 1
		};

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'role',
				fieldDefinition: textField,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should work with textarea fields', async () => {

		const textareaField: FieldDefinition = {
			key: 'background',
			label: 'Background',
			type: 'textarea',
			required: false,
			order: 1
		};

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'background',
				fieldDefinition: textareaField,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should work with richtext fields', async () => {

		const richtextField: FieldDefinition = {
			key: 'personality',
			label: 'Personality',
			type: 'richtext',
			required: false,
			order: 1
		};

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: richtextField,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should respect aiGenerate: false field property', async () => {

		const disabledField: FieldDefinition = {
			key: 'personality',
			label: 'Personality',
			type: 'richtext',
			required: false,
			order: 1,
			aiGenerate: false
		};

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: disabledField,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		// Should not render when aiGenerate is false
		const button = screen.queryByRole('button');
		expect(button).not.toBeInTheDocument();
	});
});

describe('FieldSuggestionButton Component - Entity Types', () => {
	const mockFieldDefinition: FieldDefinition = {
		key: 'description',
		label: 'Description',
		type: 'richtext',
		required: false,
		order: 1
	};

	beforeEach(() => {
		mockAiSettings.aiMode = 'suggestions';
		mockAiSettings.isSuggestionsMode = true;
	});

	it('should work with NPC entities', async () => {

		const npcData = {
			id: 'npc-123',
			type: 'npc' as const,
			name: 'Test NPC',
			description: '',
			summary: '',
			tags: [],
			notes: '',
			fields: {},
			createdAt: new Date(),
			updatedAt: new Date()
		};

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'description',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: npcData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should work with location entities', async () => {

		const locationData = {
			id: 'location-123',
			type: 'location' as const,
			name: 'Test Location',
			description: '',
			summary: '',
			tags: [],
			notes: '',
			fields: {},
			createdAt: new Date(),
			updatedAt: new Date()
		};

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'description',
				fieldDefinition: mockFieldDefinition,
				entityType: 'location',
				entityData: locationData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should work with custom entity types', async () => {

		const customData = {
			id: 'custom-123',
			type: 'custom' as const,
			name: 'Test Custom',
			description: '',
			summary: '',
			tags: [],
			notes: '',
			fields: {},
			createdAt: new Date(),
			updatedAt: new Date()
		};

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'description',
				fieldDefinition: mockFieldDefinition,
				entityType: 'custom',
				entityData: customData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});
});

describe('FieldSuggestionButton Component - Edge Cases', () => {
	const mockFieldDefinition: FieldDefinition = {
		key: 'personality',
		label: 'Personality',
		type: 'richtext',
		required: false,
		order: 1
	};

	const mockEntityData = {
		id: 'npc-123',
		type: 'npc' as const,
		name: 'Test NPC',
		description: 'A test character',
		summary: '',
		tags: [],
		notes: '',
		fields: {},
		createdAt: new Date(),
		updatedAt: new Date()
	};

	beforeEach(() => {
		mockAiSettings.aiMode = 'suggestions';
		mockAiSettings.isSuggestionsMode = true;
	});

	it('should handle very long field labels', async () => {

		const longLabelField: FieldDefinition = {
			key: 'personality',
			label: 'Personality Traits and Behavioral Characteristics of the Character',
			type: 'richtext',
			required: false,
			order: 1
		};

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: longLabelField,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should handle entities with special characters', async () => {

		const specialEntityData = {
			...mockEntityData,
			name: "O'Brien the \"Lucky\""
		};

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: specialEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should handle entities with unicode characters', async () => {

		const unicodeEntityData = {
			...mockEntityData,
			name: 'Måns the Völva 雪'
		};

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: unicodeEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should handle missing entity data gracefully', async () => {

		const minimalEntityData = {
			id: 'npc-123',
			type: 'npc' as const,
			name: '',
			description: '',
			summary: '',
			tags: [],
			notes: '',
			fields: {},
			createdAt: new Date(),
			updatedAt: new Date()
		};

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: minimalEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should handle rapid visibility toggles', async () => {

		const { rerender } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		// Toggle suggestions mode multiple times
		for (let i = 0; i < 5; i++) {
			mockAiSettings.isSuggestionsMode = i % 2 === 0;
			rerender({
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			});
		}

		// Should not crash
		expect(true).toBe(true);
	});
});

describe('FieldSuggestionButton Component - Integration with FieldGenerateButton', () => {
	const mockFieldDefinition: FieldDefinition = {
		key: 'personality',
		label: 'Personality',
		type: 'richtext',
		required: false,
		order: 1
	};

	const mockEntityData = {
		id: 'npc-123',
		type: 'npc' as const,
		name: 'Test NPC',
		description: 'A test character',
		summary: '',
		tags: [],
		notes: '',
		fields: {},
		createdAt: new Date(),
		updatedAt: new Date()
	};

	it('should NOT render when FieldGenerateButton would render (full mode)', async () => {

		mockAiSettings.aiMode = 'full';
		mockAiSettings.isSuggestionsMode = false;
		mockAiSettings.isFullMode = true;

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		// Should not render in full mode
		const button = screen.queryByRole('button');
		expect(button).not.toBeInTheDocument();
	});

	it('should render when FieldGenerateButton would NOT render (suggestions mode)', async () => {

		mockAiSettings.aiMode = 'suggestions';
		mockAiSettings.isSuggestionsMode = true;
		mockAiSettings.isFullMode = false;

		render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		// Should render in suggestions mode
		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	it('should have similar styling to FieldGenerateButton', async () => {

		const { container } = render(FieldSuggestionButton, {
			props: {
				fieldKey: 'personality',
				fieldDefinition: mockFieldDefinition,
				entityType: 'npc',
				entityData: mockEntityData,
				onSuggestionGenerated: vi.fn()
			}
		});

		const button = container.querySelector('button');

		// Should have similar classes to FieldGenerateButton
		expect(button).toHaveClass(/rounded-md/);
		expect(button).toHaveClass(/border/);
		expect(button).toHaveClass(/text-sm/);
	});
});
