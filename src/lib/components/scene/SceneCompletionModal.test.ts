/**
 * Tests for SceneCompletionModal Component
 *
 * TDD RED PHASE - Tests for Issue #292: Scene Runner Mode
 *
 * SceneCompletionModal is shown when completing a scene:
 * - Prompts for final notes
 * - Confirms completion action
 * - Cancels without changes
 *
 * These tests will FAIL until the component is implemented in the GREEN phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SceneCompletionModal from './SceneCompletionModal.svelte';

// Mock callbacks
const mockOnConfirm = vi.fn();
const mockOnCancel = vi.fn();

describe('SceneCompletionModal Component - Basic Rendering', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without crashing when open', () => {
		const { container } = render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test Scene',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		expect(container).toBeInTheDocument();
	});

	it('should not render when closed', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: false,
				sceneName: 'Test Scene',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('should display modal dialog when open', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test Scene',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('should display scene name in heading', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'The Dragon Battle',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		expect(screen.getByText(/complete.*the dragon battle/i)).toBeInTheDocument();
	});

	it('should display completion confirmation message', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		expect(screen.getByText(/mark.*scene.*completed|complete.*scene/i)).toBeInTheDocument();
	});
});

describe('SceneCompletionModal Component - Notes Input', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display textarea for final notes', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		expect(screen.getByRole('textbox')).toBeInTheDocument();
	});

	it('should show current notes in textarea', () => {
		const currentNotes = 'Players defeated the boss and found the treasure.';

		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes,
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
		expect(textarea.value).toBe(currentNotes);
	});

	it('should have label for final notes textarea', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		expect(screen.getByLabelText(/final notes|what happened/i)).toBeInTheDocument();
	});

	it('should allow editing notes', async () => {
		const user = userEvent.setup();

		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: 'Initial notes',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
		await user.clear(textarea);
		await user.type(textarea, 'Updated final notes');

		expect(textarea.value).toBe('Updated final notes');
	});

	it('should have placeholder text for notes', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const textarea = screen.getByPlaceholderText(/what happened|final notes|summary/i);
		expect(textarea).toBeInTheDocument();
	});
});

describe('SceneCompletionModal Component - Actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display "Confirm" button', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		expect(screen.getByRole('button', { name: /confirm|complete/i })).toBeInTheDocument();
	});

	it('should display "Cancel" button', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
	});

	it('should call onConfirm with notes when confirm clicked', async () => {
		const user = userEvent.setup();

		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const textarea = screen.getByRole('textbox');
		await user.type(textarea, 'Final summary notes');

		const confirmButton = screen.getByRole('button', { name: /confirm|complete/i });
		await fireEvent.click(confirmButton);

		expect(mockOnConfirm).toHaveBeenCalledWith('Final summary notes');
	});

	it('should call onCancel when cancel clicked', async () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(mockOnCancel).toHaveBeenCalled();
		expect(mockOnConfirm).not.toHaveBeenCalled();
	});

	it('should close modal when cancel clicked', async () => {
		const { component } = render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		await fireEvent.click(cancelButton);

		expect(mockOnCancel).toHaveBeenCalled();
	});

	it('should pass current notes if no edits made', async () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: 'Existing notes',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm|complete/i });
		await fireEvent.click(confirmButton);

		expect(mockOnConfirm).toHaveBeenCalledWith('Existing notes');
	});

	it('should allow confirming with empty notes', async () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm|complete/i });
		await fireEvent.click(confirmButton);

		expect(mockOnConfirm).toHaveBeenCalledWith('');
	});
});

describe('SceneCompletionModal Component - Keyboard Interaction', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should close modal on Escape key', async () => {
		const user = userEvent.setup();

		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const dialog = screen.getByRole('dialog');
		await user.type(dialog, '{Escape}');

		expect(mockOnCancel).toHaveBeenCalled();
	});

	it('should focus textarea when modal opens', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const textarea = screen.getByRole('textbox');
		expect(textarea).toHaveFocus();
	});

	it('should trap focus within modal', async () => {
		const user = userEvent.setup();

		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		// Tab through elements
		await user.tab();
		await user.tab();
		await user.tab();

		// Focus should stay within modal
		const focusedElement = document.activeElement;
		const dialog = screen.getByRole('dialog');
		expect(dialog.contains(focusedElement)).toBe(true);
	});
});

describe('SceneCompletionModal Component - Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have proper dialog role', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('should have aria-labelledby for dialog title', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-labelledby');
	});

	it('should have aria-describedby for dialog description', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-describedby');
	});

	it('should have aria-modal attribute', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});
});

describe('SceneCompletionModal Component - Visual Presentation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have backdrop/overlay', () => {
		const { container } = render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const overlay = container.querySelector('[data-testid="modal-overlay"]');
		expect(overlay).toBeInTheDocument();
	});

	it('should center modal on screen', () => {
		const { container } = render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog.parentElement).toHaveClass(/flex|items-center|justify-center/);
	});

	it('should style confirm button as primary action', () => {
		render(SceneCompletionModal, {
			props: {
				isOpen: true,
				sceneName: 'Test',
				currentNotes: '',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			}
		});

		const confirmButton = screen.getByRole('button', { name: /confirm|complete/i });
		expect(confirmButton).toHaveClass(/primary|bg-blue|bg-indigo/i);
	});
});
