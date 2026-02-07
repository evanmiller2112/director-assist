/**
 * Tests for SceneNoteCapture Component
 *
 * TDD RED PHASE - Tests for Issue #292: Scene Runner Mode
 *
 * SceneNoteCapture allows the DM to record "what happened" during the scene
 * with auto-save functionality (debounced).
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SceneNoteCapture from './SceneNoteCapture.svelte';

// Mock auto-save function
const mockOnSave = vi.fn();

describe('SceneNoteCapture Component - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without crashing', () => {
		const { container } = render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should display textarea for note input', () => {
		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toBeInTheDocument();
	});

	it('should display "What Happened" label', () => {
		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		expect(screen.getByText(/what happened/i)).toBeInTheDocument();
	});

	it('should show initial notes if provided', () => {
		const initialNotes = 'Players defeated the bandits and rescued the villagers.';

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes,
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
		expect(textarea.value).toBe(initialNotes);
	});

	it('should have placeholder text', () => {
		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByPlaceholderText(/record.*happened|what.*occurred/i);
		expect(textarea).toBeInTheDocument();
	});
});

describe('SceneNoteCapture Component - User Input', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should allow typing in the textarea', async () => {
		const user = userEvent.setup({ delay: null });

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
		await user.type(textarea, 'The heroes negotiated a truce.');

		expect(textarea.value).toBe('The heroes negotiated a truce.');
	});

	it('should update value as user types', async () => {
		const user = userEvent.setup({ delay: null });

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: 'Initial notes.',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
		await user.clear(textarea);
		await user.type(textarea, 'New notes after clearing.');

		expect(textarea.value).toBe('New notes after clearing.');
	});

	it('should support multiline input', async () => {
		const user = userEvent.setup({ delay: null });

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
		await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');

		expect(textarea.value).toContain('Line 1');
		expect(textarea.value).toContain('Line 2');
		expect(textarea.value).toContain('Line 3');
	});
});

describe('SceneNoteCapture Component - Auto-Save', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should debounce save calls when typing', async () => {
		const user = userEvent.setup({ delay: null });

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');

		// Type multiple characters quickly
		await user.type(textarea, 'Quick typing');

		// Should not save immediately
		expect(mockOnSave).not.toHaveBeenCalled();

		// Advance timers past debounce period (typically 1000ms)
		vi.advanceTimersByTime(1500);

		// Should save once after debounce
		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledTimes(1);
			expect(mockOnSave).toHaveBeenCalledWith('scene-1', 'Quick typing');
		});
	});

	it('should reset debounce timer on each keystroke', async () => {
		const user = userEvent.setup({ delay: null });

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');

		// Type first character
		await user.type(textarea, 'A');
		vi.advanceTimersByTime(500);

		// Type another character before debounce completes
		await user.type(textarea, 'B');
		vi.advanceTimersByTime(500);

		// Type another character
		await user.type(textarea, 'C');

		// Should not have saved yet (timer keeps resetting)
		expect(mockOnSave).not.toHaveBeenCalled();

		// Now wait full debounce period
		vi.advanceTimersByTime(1500);

		// Should save once with final value
		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledTimes(1);
			expect(mockOnSave).toHaveBeenCalledWith('scene-1', 'ABC');
		});
	});

	it('should call onSave with scene ID and notes', async () => {
		const user = userEvent.setup({ delay: null });

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-123',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');
		await user.type(textarea, 'Test notes content');

		vi.advanceTimersByTime(1500);

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledWith('scene-123', 'Test notes content');
		});
	});

	it('should not save if notes are empty', async () => {
		const user = userEvent.setup({ delay: null });

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');

		// Click in textarea but don't type
		await user.click(textarea);

		vi.advanceTimersByTime(1500);

		// Should not save empty notes
		expect(mockOnSave).not.toHaveBeenCalled();
	});

	it('should not save if notes unchanged from initial', async () => {
		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: 'Initial content',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');

		// Trigger input event without changing value
		await fireEvent.input(textarea);

		vi.advanceTimersByTime(1500);

		// Should not save if value hasn't changed
		expect(mockOnSave).not.toHaveBeenCalled();
	});
});

describe('SceneNoteCapture Component - Save Indicator', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should not show indicator before first save completes', () => {
		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		// No save indicator initially
		expect(screen.queryByTestId('save-indicator')).not.toBeInTheDocument();
	});

	it('should show saved indicator after successful save', async () => {
		const user = userEvent.setup({ delay: null });

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');
		await user.type(textarea, 'Content');

		vi.advanceTimersByTime(1500);

		await waitFor(() => {
			expect(screen.getByText(/saved/i)).toBeInTheDocument();
		});
	});

	it('should show last saved time after save completes', async () => {
		const user = userEvent.setup({ delay: null });

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');
		await user.type(textarea, 'First');

		vi.advanceTimersByTime(1500);

		await waitFor(() => {
			expect(screen.getByText(/saved at/i)).toBeInTheDocument();
		});
	});
});

describe('SceneNoteCapture Component - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have proper label for textarea', () => {
		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAccessibleName(/what happened/i);
	});

	it('should have proper placeholder text', () => {
		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveAttribute('placeholder');
	});

	it('should show save indicator with testid', async () => {
		const user = userEvent.setup({ delay: null });
		vi.useFakeTimers();

		render(SceneNoteCapture, {
			props: {
				sceneId: 'scene-1',
				initialNotes: '',
				onSave: mockOnSave
			}
		});

		const textarea = screen.getByRole('textbox');
		await user.type(textarea, 'Content');

		vi.advanceTimersByTime(1500);

		await waitFor(() => {
			const indicator = screen.getByTestId('save-indicator');
			expect(indicator).toBeInTheDocument();
		});

		vi.useRealTimers();
	});
});
