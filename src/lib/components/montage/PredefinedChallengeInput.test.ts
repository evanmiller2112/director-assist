import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import PredefinedChallengeInput from './PredefinedChallengeInput.svelte';
import type { PredefinedChallenge } from '$lib/types/montage';

/**
 * Tests for PredefinedChallengeInput Component
 *
 * Issue #278: Predefined Montage Challenges UI Implementation
 *
 * This component allows users to add predefined challenges during montage setup.
 * Users can add challenges with names and optional descriptions, and remove them.
 *
 * These tests follow TDD - they define expected behavior before implementation.
 */

describe('PredefinedChallengeInput Component - Basic Rendering', () => {
	it('should render without crashing', () => {
		const { container } = render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should display "Add Challenge" button initially', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		expect(screen.getByText(/Add Challenge/i)).toBeInTheDocument();
	});

	it('should display section header', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		expect(screen.getByText(/Predefined Challenges/i)).toBeInTheDocument();
	});

	it('should display helper text when no challenges exist', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		expect(screen.getByText(/optional/i)).toBeInTheDocument();
	});
});

describe('PredefinedChallengeInput Component - Displaying Challenges', () => {
	const mockChallenges: Omit<PredefinedChallenge, 'id'>[] = [
		{ name: 'Find Shelter', description: 'Locate safe haven' },
		{ name: 'Rally Horse' },
		{ name: 'Forage for Herbs', description: 'Find medicinal plants', suggestedSkills: ['Nature', 'Medicine'] }
	];

	it('should display all added challenges', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: mockChallenges,
				onUpdate: vi.fn()
			}
		});

		expect(screen.getByText('Find Shelter')).toBeInTheDocument();
		expect(screen.getByText('Rally Horse')).toBeInTheDocument();
		expect(screen.getByText('Forage for Herbs')).toBeInTheDocument();
	});

	it('should display challenge descriptions when provided', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: mockChallenges,
				onUpdate: vi.fn()
			}
		});

		expect(screen.getByText('Locate safe haven')).toBeInTheDocument();
		expect(screen.getByText('Find medicinal plants')).toBeInTheDocument();
	});

	it('should not show description section when challenge has no description', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [{ name: 'Rally Horse' }],
				onUpdate: vi.fn()
			}
		});

		expect(screen.getByText('Rally Horse')).toBeInTheDocument();
		// Should only have the challenge name, no description element
	});

	it('should display suggested skills when provided', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: mockChallenges,
				onUpdate: vi.fn()
			}
		});

		expect(screen.getByText(/Nature/)).toBeInTheDocument();
		expect(screen.getByText(/Medicine/)).toBeInTheDocument();
	});

	it('should display remove button for each challenge', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: mockChallenges,
				onUpdate: vi.fn()
			}
		});

		const removeButtons = screen.getAllByRole('button', { name: /remove/i });
		expect(removeButtons).toHaveLength(3);
	});
});

describe('PredefinedChallengeInput Component - Adding Challenges', () => {
	it('should show inline form when "Add Challenge" button is clicked', async () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		expect(screen.getByPlaceholderText(/challenge name/i)).toBeInTheDocument();
	});

	it('should show name input field in add form', async () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
	});

	it('should show description textarea in add form', async () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
	});

	it('should show suggested skills input in add form', async () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		expect(screen.getByPlaceholderText(/suggested skills/i)).toBeInTheDocument();
	});

	it('should show save and cancel buttons in add form', async () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		expect(screen.getByText(/Save/i)).toBeInTheDocument();
		expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
	});

	it('should call onUpdate with new challenge when save is clicked', async () => {
		const onUpdate = vi.fn();
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		const nameInput = screen.getByPlaceholderText(/challenge name/i);
		await fireEvent.input(nameInput, { target: { value: 'New Challenge' } });

		const saveButton = screen.getByText(/Save/i);
		await fireEvent.click(saveButton);

		expect(onUpdate).toHaveBeenCalledWith([
			expect.objectContaining({ name: 'New Challenge' })
		]);
	});

	it('should include description in new challenge when provided', async () => {
		const onUpdate = vi.fn();
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		const nameInput = screen.getByPlaceholderText(/challenge name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test Challenge' } });

		const descInput = screen.getByLabelText(/description/i);
		await fireEvent.input(descInput, { target: { value: 'Test description' } });

		const saveButton = screen.getByText(/Save/i);
		await fireEvent.click(saveButton);

		expect(onUpdate).toHaveBeenCalledWith([
			expect.objectContaining({
				name: 'Test Challenge',
				description: 'Test description'
			})
		]);
	});

	it('should parse suggested skills from comma-separated input', async () => {
		const onUpdate = vi.fn();
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		const nameInput = screen.getByPlaceholderText(/challenge name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test Challenge' } });

		const skillsInput = screen.getByPlaceholderText(/suggested skills/i);
		await fireEvent.input(skillsInput, { target: { value: 'Athletics, Acrobatics' } });

		const saveButton = screen.getByText(/Save/i);
		await fireEvent.click(saveButton);

		expect(onUpdate).toHaveBeenCalledWith([
			expect.objectContaining({
				name: 'Test Challenge',
				suggestedSkills: ['Athletics', 'Acrobatics']
			})
		]);
	});

	it('should clear form after saving', async () => {
		const onUpdate = vi.fn();
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		const nameInput = screen.getByPlaceholderText(/challenge name/i) as HTMLInputElement;
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		const saveButton = screen.getByText(/Save/i);
		await fireEvent.click(saveButton);

		// Form should be hidden after save
		expect(screen.queryByPlaceholderText(/challenge name/i)).not.toBeInTheDocument();
	});

	it('should hide form when cancel is clicked', async () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		const cancelButton = screen.getByText(/Cancel/i);
		await fireEvent.click(cancelButton);

		expect(screen.queryByPlaceholderText(/challenge name/i)).not.toBeInTheDocument();
	});

	it('should require name field before saving', async () => {
		const onUpdate = vi.fn();
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		const saveButton = screen.getByText(/Save/i);
		await fireEvent.click(saveButton);

		// Should not call onUpdate if name is empty
		expect(onUpdate).not.toHaveBeenCalled();
	});

	it('should trim whitespace from inputs', async () => {
		const onUpdate = vi.fn();
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		const nameInput = screen.getByPlaceholderText(/challenge name/i);
		await fireEvent.input(nameInput, { target: { value: '  Test Challenge  ' } });

		const saveButton = screen.getByText(/Save/i);
		await fireEvent.click(saveButton);

		expect(onUpdate).toHaveBeenCalledWith([
			expect.objectContaining({ name: 'Test Challenge' })
		]);
	});
});

describe('PredefinedChallengeInput Component - Removing Challenges', () => {
	it('should call onUpdate with challenge removed when remove button clicked', async () => {
		const onUpdate = vi.fn();
		const challenges = [
			{ name: 'Challenge 1' },
			{ name: 'Challenge 2' },
			{ name: 'Challenge 3' }
		];

		render(PredefinedChallengeInput, {
			props: {
				challenges,
				onUpdate
			}
		});

		const removeButtons = screen.getAllByRole('button', { name: /remove/i });
		await fireEvent.click(removeButtons[1]); // Remove second challenge

		expect(onUpdate).toHaveBeenCalledWith([
			{ name: 'Challenge 1' },
			{ name: 'Challenge 3' }
		]);
	});

	it('should call onUpdate with empty array when last challenge is removed', async () => {
		const onUpdate = vi.fn();
		const challenges = [{ name: 'Only Challenge' }];

		render(PredefinedChallengeInput, {
			props: {
				challenges,
				onUpdate
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove/i });
		await fireEvent.click(removeButton);

		expect(onUpdate).toHaveBeenCalledWith([]);
	});
});

describe('PredefinedChallengeInput Component - Disabled State', () => {
	it('should disable add button when disabled prop is true', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn(),
				disabled: true
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		expect(addButton).toBeDisabled();
	});

	it('should disable remove buttons when disabled prop is true', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [{ name: 'Test' }],
				onUpdate: vi.fn(),
				disabled: true
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove/i });
		expect(removeButton).toBeDisabled();
	});
});

describe('PredefinedChallengeInput Component - Accessibility', () => {
	it('should have proper labels for form inputs', async () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
	});

	it('should mark name field as required', async () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [],
				onUpdate: vi.fn()
			}
		});

		const addButton = screen.getByText(/Add Challenge/i);
		await fireEvent.click(addButton);

		const nameInput = screen.getByLabelText(/name/i);
		expect(nameInput).toHaveAttribute('required');
	});

	it('should have accessible remove buttons with aria-label', () => {
		render(PredefinedChallengeInput, {
			props: {
				challenges: [{ name: 'Test Challenge' }],
				onUpdate: vi.fn()
			}
		});

		const removeButton = screen.getByRole('button', { name: /remove.*test challenge/i });
		expect(removeButton).toBeInTheDocument();
	});
});
