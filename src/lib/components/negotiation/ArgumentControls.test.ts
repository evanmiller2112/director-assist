/**
 * Tests for ArgumentControls Component
 *
 * Issue #382: Write tests for Negotiation UI components (TDD - RED phase)
 *
 * This component provides controls for recording negotiation arguments:
 * - Argument type selector (motivation, no_motivation, pitfall)
 * - Motivation type dropdown with 12 options
 * - Disables already-used motivations
 * - Tier buttons (1, 2, 3)
 * - Optional player name input
 * - Optional notes input
 * - Shows outcome preview before recording
 * - Validates required fields
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ArgumentControls from './ArgumentControls.svelte';

describe('ArgumentControls Component - Basic Rendering (Issue #382)', () => {
	it('should render without crashing', () => {
		const { container } = render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should render argument type selector', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		expect(screen.getByLabelText(/argument.*type/i)).toBeInTheDocument();
	});

	it('should render tier buttons', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		expect(screen.getByRole('button', { name: /tier.*1|^1$/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /tier.*2|^2$/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /tier.*3|^3$/i })).toBeInTheDocument();
	});

	it('should render player name input', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		expect(screen.getByLabelText(/player.*name|hero.*name/i)).toBeInTheDocument();
	});

	it('should render notes input', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
	});

	it('should render record button', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		expect(screen.getByRole('button', { name: /record.*argument/i })).toBeInTheDocument();
	});
});

describe('ArgumentControls Component - Argument Type Selector', () => {
	it('should have motivation option', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const select = screen.getByLabelText(/argument.*type/i);
		expect(select).toBeInTheDocument();

		// Check for motivation option
		const motivationOption = screen.getByRole('option', { name: /motivation/i });
		expect(motivationOption).toBeInTheDocument();
	});

	it('should have no_motivation option', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const noMotivationOption = screen.getByRole('option', { name: /no.*motivation/i });
		expect(noMotivationOption).toBeInTheDocument();
	});

	it('should have pitfall option', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const pitfallOption = screen.getByRole('option', { name: /pitfall/i });
		expect(pitfallOption).toBeInTheDocument();
	});

	it('should default to motivation type', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const select = screen.getByLabelText(/argument.*type/i) as HTMLSelectElement;
		expect(select.value).toBe('motivation');
	});

	it('should allow changing argument type', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const select = screen.getByLabelText(/argument.*type/i);
		await fireEvent.change(select, { target: { value: 'no_motivation' } });

		expect((select as HTMLSelectElement).value).toBe('no_motivation');
	});
});

describe('ArgumentControls Component - Motivation Type Dropdown', () => {
	it('should show motivation dropdown when argument type is motivation', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const motivationSelect = screen.getByLabelText(/motivation.*type/i);
		expect(motivationSelect).toBeInTheDocument();
	});

	it('should have all 12 motivation options', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		// All 12 Draw Steel motivations
		expect(screen.getByRole('option', { name: /benevolence/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /discovery/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /freedom/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /greed/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /higher.*authority/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /justice/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /legacy/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /peace/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /power/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /protection/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /revelry/i })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: /vengeance/i })).toBeInTheDocument();
	});

	it('should hide motivation dropdown when argument type is no_motivation', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const typeSelect = screen.getByLabelText(/argument.*type/i);
		await fireEvent.change(typeSelect, { target: { value: 'no_motivation' } });

		expect(screen.queryByLabelText(/motivation.*type/i)).not.toBeInTheDocument();
	});

	it('should show motivation dropdown when argument type is pitfall', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const typeSelect = screen.getByLabelText(/argument.*type/i);
		await fireEvent.change(typeSelect, { target: { value: 'pitfall' } });

		// Pitfalls also use motivation types
		expect(screen.getByLabelText(/motivation.*type|pitfall.*type/i)).toBeInTheDocument();
	});

	it('should disable already-used motivations', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: ['benevolence', 'greed']
			}
		});

		const benevolenceOption = screen.getByRole('option', { name: /benevolence/i }) as HTMLOptionElement;
		const greedOption = screen.getByRole('option', { name: /greed/i }) as HTMLOptionElement;
		const justiceOption = screen.getByRole('option', { name: /justice/i }) as HTMLOptionElement;

		expect(benevolenceOption.disabled).toBe(true);
		expect(greedOption.disabled).toBe(true);
		expect(justiceOption.disabled).toBe(false);
	});

	it('should mark disabled motivations visually', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: ['power']
			}
		});

		const powerOption = screen.getByRole('option', { name: /power/i });
		expect(powerOption).toBeDisabled();
	});

	it('should allow selecting unused motivations', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: ['benevolence']
			}
		});

		const motivationSelect = screen.getByLabelText(/motivation.*type/i);
		await fireEvent.change(motivationSelect, { target: { value: 'justice' } });

		expect((motivationSelect as HTMLSelectElement).value).toBe('justice');
	});
});

describe('ArgumentControls Component - Tier Buttons', () => {
	it('should have tier 1 button', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		expect(screen.getByRole('button', { name: /tier.*1|^1$/i })).toBeInTheDocument();
	});

	it('should have tier 2 button', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		expect(screen.getByRole('button', { name: /tier.*2|^2$/i })).toBeInTheDocument();
	});

	it('should have tier 3 button', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		expect(screen.getByRole('button', { name: /tier.*3|^3$/i })).toBeInTheDocument();
	});

	it('should default to tier 1 selected', () => {
		const { container } = render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const tier1Button = screen.getByRole('button', { name: /tier.*1|^1$/i });
		expect(tier1Button).toHaveClass(/selected|active|primary/);
	});

	it('should highlight selected tier', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const tier2Button = screen.getByRole('button', { name: /tier.*2|^2$/i });
		await fireEvent.click(tier2Button);

		expect(tier2Button).toHaveClass(/selected|active|primary/);
	});

	it('should allow selecting tier 3', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const tier3Button = screen.getByRole('button', { name: /tier.*3|^3$/i });
		await fireEvent.click(tier3Button);

		expect(tier3Button).toHaveClass(/selected|active|primary/);
	});

	it('should only have one tier selected at a time', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const tier1Button = screen.getByRole('button', { name: /tier.*1|^1$/i });
		const tier2Button = screen.getByRole('button', { name: /tier.*2|^2$/i });

		// Click tier 2
		await fireEvent.click(tier2Button);

		expect(tier2Button).toHaveClass(/selected|active|primary/);
		expect(tier1Button).not.toHaveClass(/selected|active|primary/);
	});
});

describe('ArgumentControls Component - Player Name Input', () => {
	it('should accept player name input', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const input = screen.getByLabelText(/player.*name|hero.*name/i) as HTMLInputElement;
		await fireEvent.input(input, { target: { value: 'Aragorn' } });

		expect(input.value).toBe('Aragorn');
	});

	it('should be optional (empty by default)', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const input = screen.getByLabelText(/player.*name|hero.*name/i) as HTMLInputElement;
		expect(input.value).toBe('');
		expect(input).not.toBeRequired();
	});

	it('should accept long names', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const input = screen.getByLabelText(/player.*name|hero.*name/i) as HTMLInputElement;
		await fireEvent.input(input, { target: { value: 'Sir Reginald von Bartholomew III' } });

		expect(input.value).toBe('Sir Reginald von Bartholomew III');
	});
});

describe('ArgumentControls Component - Notes Input', () => {
	it('should accept notes input', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const input = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		await fireEvent.input(input, { target: { value: 'Great argument about justice' } });

		expect(input.value).toBe('Great argument about justice');
	});

	it('should be optional (empty by default)', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const input = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		expect(input.value).toBe('');
		expect(input).not.toBeRequired();
	});

	it('should accept multi-line notes', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const notes = 'First line\nSecond line\nThird line';
		const input = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
		await fireEvent.input(input, { target: { value: notes } });

		expect(input.value).toBe(notes);
	});

	it('should use textarea element for multi-line input', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const input = screen.getByLabelText(/notes/i);
		expect(input.tagName.toLowerCase()).toBe('textarea');
	});
});

describe('ArgumentControls Component - Outcome Preview', () => {
	it('should show preview for tier 1 motivation', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		// Tier 1 motivation: +1 interest, 0 patience
		expect(screen.getByText(/\+1.*interest/i)).toBeInTheDocument();
	});

	it('should show preview for tier 2 motivation', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const tier2Button = screen.getByRole('button', { name: /tier.*2|^2$/i });
		await fireEvent.click(tier2Button);

		// Tier 2 motivation: +2 interest, 0 patience
		expect(screen.getByText(/\+2.*interest/i)).toBeInTheDocument();
	});

	it('should show preview for tier 3 motivation', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const tier3Button = screen.getByRole('button', { name: /tier.*3|^3$/i });
		await fireEvent.click(tier3Button);

		// Tier 3 motivation: +2 interest, +1 patience
		expect(screen.getByText(/\+2.*interest/i)).toBeInTheDocument();
		expect(screen.getByText(/\+1.*patience/i)).toBeInTheDocument();
	});

	it('should show preview for tier 1 no_motivation', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const typeSelect = screen.getByLabelText(/argument.*type/i);
		await fireEvent.change(typeSelect, { target: { value: 'no_motivation' } });

		// Tier 1 no_motivation: +0 interest, -1 patience
		expect(screen.getByText(/-1.*patience/i)).toBeInTheDocument();
	});

	it('should show preview for tier 2 no_motivation', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const typeSelect = screen.getByLabelText(/argument.*type/i);
		await fireEvent.change(typeSelect, { target: { value: 'no_motivation' } });

		const tier2Button = screen.getByRole('button', { name: /tier.*2|^2$/i });
		await fireEvent.click(tier2Button);

		// Tier 2 no_motivation: +1 interest, -1 patience
		expect(screen.getByText(/\+1.*interest/i)).toBeInTheDocument();
		expect(screen.getByText(/-1.*patience/i)).toBeInTheDocument();
	});

	it('should show preview for tier 1 pitfall', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const typeSelect = screen.getByLabelText(/argument.*type/i);
		await fireEvent.change(typeSelect, { target: { value: 'pitfall' } });

		// Tier 1 pitfall: -1 interest, -1 patience
		expect(screen.getByText(/-1.*interest/i)).toBeInTheDocument();
		expect(screen.getByText(/-1.*patience/i)).toBeInTheDocument();
	});

	it('should update preview when tier changes', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		// Start with tier 1
		expect(screen.getByText(/\+1.*interest/i)).toBeInTheDocument();

		// Change to tier 2
		const tier2Button = screen.getByRole('button', { name: /tier.*2|^2$/i });
		await fireEvent.click(tier2Button);

		expect(screen.getByText(/\+2.*interest/i)).toBeInTheDocument();
	});

	it('should update preview when argument type changes', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		// Start with motivation
		expect(screen.getByText(/\+1.*interest/i)).toBeInTheDocument();

		// Change to pitfall
		const typeSelect = screen.getByLabelText(/argument.*type/i);
		await fireEvent.change(typeSelect, { target: { value: 'pitfall' } });

		expect(screen.getByText(/-1.*interest/i)).toBeInTheDocument();
	});
});

describe('ArgumentControls Component - Record Button', () => {
	it('should emit recordArgument event when clicked', async () => {
		const onRecord = vi.fn();

		render(ArgumentControls, {
			props: {
				usedMotivations: [],
				onRecord
			}
		});

		const recordButton = screen.getByRole('button', { name: /record.*argument/i });
		await fireEvent.click(recordButton);

		expect(onRecord).toHaveBeenCalled();
	});

	it('should include argument type in event data', async () => {
		const onRecord = vi.fn();

		render(ArgumentControls, {
			props: {
				usedMotivations: [],
				onRecord
			}
		});

		const recordButton = screen.getByRole('button', { name: /record.*argument/i });
		await fireEvent.click(recordButton);

		expect(onRecord).toHaveBeenCalledWith(
			expect.objectContaining({
				argumentType: 'motivation'
			})
		);
	});

	it('should include selected tier in event data', async () => {
		const onRecord = vi.fn();

		render(ArgumentControls, {
			props: {
				usedMotivations: [],
				onRecord
			}
		});

		const tier2Button = screen.getByRole('button', { name: /tier.*2|^2$/i });
		await fireEvent.click(tier2Button);

		const recordButton = screen.getByRole('button', { name: /record.*argument/i });
		await fireEvent.click(recordButton);

		expect(onRecord).toHaveBeenCalledWith(
			expect.objectContaining({
				tier: 2
			})
		);
	});

	it('should include motivation type when argument type is motivation', async () => {
		const onRecord = vi.fn();

		render(ArgumentControls, {
			props: {
				usedMotivations: [],
				onRecord
			}
		});

		const motivationSelect = screen.getByLabelText(/motivation.*type/i);
		await fireEvent.change(motivationSelect, { target: { value: 'justice' } });

		const recordButton = screen.getByRole('button', { name: /record.*argument/i });
		await fireEvent.click(recordButton);

		expect(onRecord).toHaveBeenCalledWith(
			expect.objectContaining({
				motivationType: 'justice'
			})
		);
	});

	it('should include player name if provided', async () => {
		const onRecord = vi.fn();

		render(ArgumentControls, {
			props: {
				usedMotivations: [],
				onRecord
			}
		});

		const nameInput = screen.getByLabelText(/player.*name|hero.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Gandalf' } });

		const recordButton = screen.getByRole('button', { name: /record.*argument/i });
		await fireEvent.click(recordButton);

		expect(onRecord).toHaveBeenCalledWith(
			expect.objectContaining({
				playerName: 'Gandalf'
			})
		);
	});

	it('should include notes if provided', async () => {
		const onRecord = vi.fn();

		render(ArgumentControls, {
			props: {
				usedMotivations: [],
				onRecord
			}
		});

		const notesInput = screen.getByLabelText(/notes/i);
		await fireEvent.input(notesInput, { target: { value: 'Excellent argument!' } });

		const recordButton = screen.getByRole('button', { name: /record.*argument/i });
		await fireEvent.click(recordButton);

		expect(onRecord).toHaveBeenCalledWith(
			expect.objectContaining({
				notes: 'Excellent argument!'
			})
		);
	});

	it('should not include motivationType for no_motivation arguments', async () => {
		const onRecord = vi.fn();

		render(ArgumentControls, {
			props: {
				usedMotivations: [],
				onRecord
			}
		});

		const typeSelect = screen.getByLabelText(/argument.*type/i);
		await fireEvent.change(typeSelect, { target: { value: 'no_motivation' } });

		const recordButton = screen.getByRole('button', { name: /record.*argument/i });
		await fireEvent.click(recordButton);

		expect(onRecord).toHaveBeenCalledWith(
			expect.not.objectContaining({
				motivationType: expect.anything()
			})
		);
	});
});

describe('ArgumentControls Component - Validation', () => {
	it('should require motivation type selection for motivation arguments', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const motivationSelect = screen.getByLabelText(/motivation.*type/i);
		expect(motivationSelect).toBeRequired();
	});

	it('should disable record button when motivation type not selected', () => {
		const { container } = render(ArgumentControls, {
			props: {
				usedMotivations: ['benevolence', 'discovery', 'freedom', 'greed',
					'higher_authority', 'justice', 'legacy', 'peace', 'power',
					'protection', 'revelry', 'vengeance']
			}
		});

		// All motivations used
		const recordButton = screen.getByRole('button', { name: /record.*argument/i });
		expect(recordButton).toBeDisabled();
	});

	it('should enable record button for no_motivation arguments without motivation type', async () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const typeSelect = screen.getByLabelText(/argument.*type/i);
		await fireEvent.change(typeSelect, { target: { value: 'no_motivation' } });

		const recordButton = screen.getByRole('button', { name: /record.*argument/i });
		expect(recordButton).not.toBeDisabled();
	});

	it('should show validation error when trying to use all motivations', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: ['benevolence', 'discovery', 'freedom', 'greed',
					'higher_authority', 'justice', 'legacy', 'peace', 'power',
					'protection', 'revelry', 'vengeance']
			}
		});

		expect(screen.getByText(/all.*motivations.*used/i)).toBeInTheDocument();
	});
});

describe('ArgumentControls Component - Accessibility', () => {
	it('should have proper labels for all inputs', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		expect(screen.getByLabelText(/argument.*type/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/motivation.*type/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/player.*name|hero.*name/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/notes/i)).toHaveAccessibleName();
	});

	it('should have accessible tier button group', () => {
		const { container } = render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const tierGroup = container.querySelector('[role="group"][aria-label*="Tier"]');
		expect(tierGroup).toBeInTheDocument();
	});

	it('should indicate selected tier to screen readers', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: []
			}
		});

		const tier1Button = screen.getByRole('button', { name: /tier.*1|^1$/i });
		expect(tier1Button).toHaveAttribute('aria-pressed', 'true');
	});

	it('should indicate disabled motivations to screen readers', () => {
		render(ArgumentControls, {
			props: {
				usedMotivations: ['benevolence']
			}
		});

		const benevolenceOption = screen.getByRole('option', { name: /benevolence/i });
		expect(benevolenceOption).toHaveAttribute('disabled');
		expect(benevolenceOption).toHaveAttribute('aria-disabled', 'true');
	});
});
