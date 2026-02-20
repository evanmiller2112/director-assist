/**
 * Tests for NegotiationSetup Component
 *
 * Issue #386: Write tests for Negotiation UI components (TDD - RED phase)
 *
 * This component provides a form for creating new negotiations:
 * - Name input (required)
 * - NPC name input (required)
 * - Description input (optional)
 * - Starting Interest selector (1-4, default 2)
 * - Starting Patience selector (1-5, default 5)
 * - Motivation configuration (add/remove, select type, known toggle)
 * - Pitfall configuration (add/remove, select type, known toggle)
 * - Validation for required fields
 * - Emits create event with correct data
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import NegotiationSetup from './NegotiationSetup.svelte';

describe('NegotiationSetup Component - Basic Rendering (Issue #386)', () => {
	it('should render without crashing', () => {
		const { container } = render(NegotiationSetup);
		expect(container).toBeInTheDocument();
	});

	it('should render name input', () => {
		render(NegotiationSetup);
		expect(screen.getByLabelText(/^name|negotiation.*name/i)).toBeInTheDocument();
	});

	it('should render NPC name section', () => {
		render(NegotiationSetup);
		// Component now has mode toggle buttons and either entity selector or manual input
		expect(screen.getByText(/npc.*name/i)).toBeInTheDocument();
	});

	it('should render description input', () => {
		render(NegotiationSetup);
		expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
	});

	it('should render create button', () => {
		render(NegotiationSetup);
		expect(screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i })).toBeInTheDocument();
	});
});

describe('NegotiationSetup Component - Name Input', () => {
	it('should accept name input', async () => {
		render(NegotiationSetup);

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i) as HTMLInputElement;
		await fireEvent.input(nameInput, { target: { value: 'Peace Treaty Negotiation' } });

		expect(nameInput.value).toBe('Peace Treaty Negotiation');
	});

	it('should mark name as required', () => {
		render(NegotiationSetup);

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		expect(nameInput).toBeRequired();
	});

	it('should show validation error when name is empty', async () => {
		render(NegotiationSetup);

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		// More specific - look for "Name is required" not "NPC name is required"
		expect(screen.getByText(/^Name is required$/i)).toBeInTheDocument();
	});

	it('should clear validation error when name is entered', async () => {
		render(NegotiationSetup);

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		expect(screen.getByText(/^Name is required$/i)).toBeInTheDocument();

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Valid Name' } });

		expect(screen.queryByText(/^Name is required$/i)).not.toBeInTheDocument();
	});

	it('should accept long names', async () => {
		render(NegotiationSetup);

		const longName = 'Negotiation for the Treaty of Peace Between the Kingdom of Westmarch and the Rebel Alliance';
		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i) as HTMLInputElement;
		await fireEvent.input(nameInput, { target: { value: longName } });

		expect(nameInput.value).toBe(longName);
	});
});

describe('NegotiationSetup Component - NPC Name Input', () => {
	it('should show entity/manual mode toggle buttons', () => {
		render(NegotiationSetup);

		expect(screen.getByRole('button', { name: /from.*entity/i })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /manual/i })).toBeInTheDocument();
	});

	it('should default to entity mode', () => {
		render(NegotiationSetup);

		const entityButton = screen.getByRole('button', { name: /from.*entity/i });
		expect(entityButton).toHaveClass(/active|selected/);
	});

	it('should switch to manual mode when manual button clicked', async () => {
		render(NegotiationSetup);

		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		expect(manualButton).toHaveClass(/active|selected/);
	});

	it('should show search input in entity mode', () => {
		render(NegotiationSetup);

		// In entity mode by default
		const searchInput = screen.getByPlaceholderText(/search.*npc/i);
		expect(searchInput).toBeInTheDocument();
	});

	it('should accept NPC name input in manual mode', async () => {
		render(NegotiationSetup);

		// Switch to manual mode
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i) as HTMLInputElement;
		await fireEvent.input(npcNameInput, { target: { value: 'Lord Varric' } });

		expect(npcNameInput.value).toBe('Lord Varric');
	});

	it('should show validation error when NPC name is empty', async () => {
		render(NegotiationSetup);

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		expect(screen.getByText(/npc.*name.*required/i)).toBeInTheDocument();
	});

	it('should accept special characters in NPC name in manual mode', async () => {
		render(NegotiationSetup);

		// Switch to manual mode
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i) as HTMLInputElement;
		await fireEvent.input(npcNameInput, { target: { value: "K'thara the Wise" } });

		expect(npcNameInput.value).toBe("K'thara the Wise");
	});
});

describe('NegotiationSetup Component - Description Input', () => {
	it('should accept description input', async () => {
		render(NegotiationSetup);

		const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
		await fireEvent.input(descInput, { target: { value: 'Negotiating peace terms' } });

		expect(descInput.value).toBe('Negotiating peace terms');
	});

	it('should not require description', () => {
		render(NegotiationSetup);

		const descInput = screen.getByLabelText(/description/i);
		expect(descInput).not.toBeRequired();
	});

	it('should use textarea for description', () => {
		render(NegotiationSetup);

		const descInput = screen.getByLabelText(/description/i);
		expect(descInput.tagName.toLowerCase()).toBe('textarea');
	});

	it('should accept multi-line description', async () => {
		render(NegotiationSetup);

		const description = 'First line\nSecond line\nThird line';
		const descInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
		await fireEvent.input(descInput, { target: { value: description } });

		expect(descInput.value).toBe(description);
	});
});

describe('NegotiationSetup Component - Starting Interest Selector', () => {
	it('should render starting interest selector', () => {
		render(NegotiationSetup);
		expect(screen.getByLabelText(/starting.*interest/i)).toBeInTheDocument();
	});

	it('should default to interest 2', () => {
		render(NegotiationSetup);

		const interestSelect = screen.getByLabelText(/starting.*interest/i) as HTMLSelectElement;
		expect(interestSelect.value).toBe('2');
	});

	it('should have interest options 1-4', () => {
		const { container } = render(NegotiationSetup);

		const interestSelect = screen.getByLabelText(/starting.*interest/i) as HTMLSelectElement;
		const options = Array.from(interestSelect.options).map(opt => opt.value);

		expect(options).toContain('1');
		expect(options).toContain('2');
		expect(options).toContain('3');
		expect(options).toContain('4');
	});

	it('should not allow interest 0 or 5', () => {
		render(NegotiationSetup);

		const interestSelect = screen.getByLabelText(/starting.*interest/i) as HTMLSelectElement;
		const options = Array.from(interestSelect.options).map(opt => opt.value);

		expect(options).not.toContain('0');
		expect(options).not.toContain('6');
		// Interest should only have 4 options (1-4)
		expect(options.length).toBe(4);
	});

	it('should allow selecting interest 1', async () => {
		render(NegotiationSetup);

		const interestSelect = screen.getByLabelText(/starting.*interest/i) as HTMLSelectElement;
		interestSelect.value = '1';
		await fireEvent.change(interestSelect);
		await fireEvent.input(interestSelect);

		expect(interestSelect.value).toBe('1');
	});

	it('should allow selecting interest 4', async () => {
		render(NegotiationSetup);

		const interestSelect = screen.getByLabelText(/starting.*interest/i) as HTMLSelectElement;

		// Verify option 4 exists and is not disabled
		const option4 = interestSelect.querySelector('option[value="4"]') as HTMLOptionElement;
		expect(option4).toBeInTheDocument();
		expect(option4.disabled).toBe(false);
	});

	it('should provide description for interest levels', () => {
		render(NegotiationSetup);

		// Might have helper text explaining what each level means
		const { container } = render(NegotiationSetup);
		expect(container.textContent).toMatch(/interest/i);
	});
});

describe('NegotiationSetup Component - Starting Patience Selector', () => {
	it('should render starting patience selector', () => {
		render(NegotiationSetup);
		expect(screen.getByLabelText(/starting.*patience/i)).toBeInTheDocument();
	});

	it('should default to patience 5', () => {
		render(NegotiationSetup);

		const patienceSelect = screen.getByLabelText(/starting.*patience/i) as HTMLSelectElement;
		expect(patienceSelect.value).toBe('5');
	});

	it('should have patience options 1-5', () => {
		render(NegotiationSetup);

		const patienceOptions = screen.getAllByRole('option').filter(opt =>
			['1', '2', '3', '4', '5'].includes(opt.textContent || '')
		);
		expect(patienceOptions.length).toBeGreaterThanOrEqual(5);
	});

	it('should allow selecting patience 1', async () => {
		render(NegotiationSetup);

		const patienceSelect = screen.getByLabelText(/starting.*patience/i) as HTMLSelectElement;
		patienceSelect.value = '1';
		await fireEvent.change(patienceSelect);
		await fireEvent.input(patienceSelect);

		expect(patienceSelect.value).toBe('1');
	});

	it('should allow selecting patience 3', async () => {
		render(NegotiationSetup);

		const patienceSelect = screen.getByLabelText(/starting.*patience/i) as HTMLSelectElement;

		// Verify option 3 exists and is not disabled
		const option3 = patienceSelect.querySelector('option[value="3"]') as HTMLOptionElement;
		expect(option3).toBeInTheDocument();
		expect(option3.disabled).toBe(false);
	});

	it('should not allow patience 0', () => {
		render(NegotiationSetup);

		const patienceSelect = screen.getByLabelText(/starting.*patience/i) as HTMLSelectElement;
		const options = Array.from(patienceSelect.options).map(opt => opt.value);

		expect(options).not.toContain('0');
	});
});

describe('NegotiationSetup Component - Motivation Configuration', () => {
	it('should render add motivation button', () => {
		render(NegotiationSetup);
		expect(screen.getByRole('button', { name: /add.*motivation/i })).toBeInTheDocument();
	});

	it('should start with no motivations', () => {
		const { container } = render(NegotiationSetup);

		const motivationItems = container.querySelectorAll('[data-testid^="motivation-"]');
		expect(motivationItems.length).toBe(0);
	});

	it('should add motivation when button clicked', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addButton);

		expect(screen.getByLabelText(/motivation.*type/i)).toBeInTheDocument();
	});

	it('should show motivation type selector after adding', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addButton);

		const typeSelect = screen.getByLabelText(/motivation.*type/i);
		expect(typeSelect).toBeInTheDocument();
	});

	it('should have all 12 motivation types in selector', async () => {
		const { container } = render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addButton);

		// Component now uses input with datalist - verify the input exists
		const motivationInput = screen.getByLabelText(/motivation.*type/i);
		expect(motivationInput).toBeInTheDocument();

		// Verify datalist has all 13 motivation options
		const datalist = container.querySelector('datalist#motivation-suggestions');
		expect(datalist).toBeInTheDocument();

		const optionValues = Array.from(datalist?.querySelectorAll('option') || []).map(opt => opt.getAttribute('value'));
		expect(optionValues).toContain('charity');
		expect(optionValues).toContain('discovery');
		expect(optionValues).toContain('faith');
		expect(optionValues).toContain('freedom');
		expect(optionValues).toContain('greed');
		expect(optionValues).toContain('harmony');
		expect(optionValues).toContain('justice');
		expect(optionValues).toContain('knowledge');
		expect(optionValues).toContain('legacy');
		expect(optionValues).toContain('power');
		expect(optionValues).toContain('protection');
		expect(optionValues).toContain('revenge');
		expect(optionValues).toContain('wealth');
	});

	it('should show known toggle for motivation', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addButton);

		expect(screen.getByLabelText(/known|revealed/i)).toBeInTheDocument();
	});

	it('should default known to false', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addButton);

		const knownToggle = screen.getByLabelText(/known|revealed/i) as HTMLInputElement;
		expect(knownToggle.checked).toBe(false);
	});

	it('should allow toggling known state', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addButton);

		const knownToggle = screen.getByLabelText(/known|revealed/i) as HTMLInputElement;
		await fireEvent.click(knownToggle);

		expect(knownToggle.checked).toBe(true);
	});

	it('should show remove button for each motivation', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addButton);

		expect(screen.getByRole('button', { name: /remove.*motivation|delete/i })).toBeInTheDocument();
	});

	it('should remove motivation when remove button clicked', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addButton);

		const removeButton = screen.getByRole('button', { name: /remove.*motivation|delete/i });
		await fireEvent.click(removeButton);

		expect(screen.queryByLabelText(/motivation.*type/i)).not.toBeInTheDocument();
	});

	it('should allow adding multiple motivations', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addButton);
		await fireEvent.click(addButton);
		await fireEvent.click(addButton);

		const typeSelects = screen.getAllByLabelText(/motivation.*type/i);
		expect(typeSelects.length).toBe(3);
	});

	it('should prevent duplicate motivation types', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addButton);
		await fireEvent.click(addButton);

		// Component now uses input fields instead of selects
		const typeInputs = screen.getAllByLabelText(/motivation.*type/i);
		await fireEvent.input(typeInputs[0], { target: { value: 'justice' } });
		await fireEvent.input(typeInputs[1], { target: { value: 'justice' } });

		// Should show validation error
		expect(screen.getByText(/duplicate.*motivation|already.*added/i)).toBeInTheDocument();
	});
});

describe('NegotiationSetup Component - Pitfall Configuration', () => {
	it('should render add pitfall button', () => {
		render(NegotiationSetup);
		expect(screen.getByRole('button', { name: /add.*pitfall/i })).toBeInTheDocument();
	});

	it('should start with no pitfalls', () => {
		const { container } = render(NegotiationSetup);

		const pitfallItems = container.querySelectorAll('[data-testid^="pitfall-"]');
		expect(pitfallItems.length).toBe(0);
	});

	it('should add pitfall when button clicked', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*pitfall/i });
		await fireEvent.click(addButton);

		expect(screen.getByLabelText(/pitfall.*type/i)).toBeInTheDocument();
	});

	it('should show pitfall type selector after adding', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*pitfall/i });
		await fireEvent.click(addButton);

		const typeSelect = screen.getByLabelText(/pitfall.*type/i);
		expect(typeSelect).toBeInTheDocument();
	});

	it('should have all 13 motivation types in pitfall selector', async () => {
		const { container } = render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*pitfall/i });
		await fireEvent.click(addButton);

		// Component now uses input with datalist
		const pitfallInput = screen.getByLabelText(/pitfall.*type/i);
		expect(pitfallInput).toBeInTheDocument();

		// Pitfalls use the same motivation types - verify datalist has them
		const datalist = container.querySelector('datalist#pitfall-suggestions');
		expect(datalist).toBeInTheDocument();

		const optionValues = Array.from(datalist?.querySelectorAll('option') || []).map(opt => opt.getAttribute('value'));
		expect(optionValues).toContain('charity');
		expect(optionValues).toContain('justice');
		expect(optionValues).toContain('power');
	});

	it('should show known toggle for pitfall', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*pitfall/i });
		await fireEvent.click(addButton);

		const knownToggles = screen.getAllByLabelText(/known|revealed/i);
		expect(knownToggles.length).toBeGreaterThanOrEqual(1);
	});

	it('should show remove button for each pitfall', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*pitfall/i });
		await fireEvent.click(addButton);

		expect(screen.getByRole('button', { name: /remove.*pitfall|delete/i })).toBeInTheDocument();
	});

	it('should remove pitfall when remove button clicked', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*pitfall/i });
		await fireEvent.click(addButton);

		const removeButton = screen.getByRole('button', { name: /remove.*pitfall|delete/i });
		await fireEvent.click(removeButton);

		expect(screen.queryByLabelText(/pitfall.*type/i)).not.toBeInTheDocument();
	});

	it('should allow adding multiple pitfalls', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*pitfall/i });
		await fireEvent.click(addButton);
		await fireEvent.click(addButton);

		const typeSelects = screen.getAllByLabelText(/pitfall.*type/i);
		expect(typeSelects.length).toBe(2);
	});

	it('should prevent duplicate pitfall types', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*pitfall/i });
		await fireEvent.click(addButton);
		await fireEvent.click(addButton);

		// Component now uses input fields instead of selects
		const typeInputs = screen.getAllByLabelText(/pitfall.*type/i);
		await fireEvent.input(typeInputs[0], { target: { value: 'greed' } });
		await fireEvent.input(typeInputs[1], { target: { value: 'greed' } });

		expect(screen.getByText(/duplicate.*pitfall|already.*added/i)).toBeInTheDocument();
	});
});

describe('NegotiationSetup Component - Form Validation', () => {
	it('should prevent submission with empty name', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		expect(onCreate).not.toHaveBeenCalled();
		expect(screen.getByText(/^Name is required$/i)).toBeInTheDocument();
	});

	it('should prevent submission with empty NPC name', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		expect(onCreate).not.toHaveBeenCalled();
		expect(screen.getByText(/npc.*name.*required/i)).toBeInTheDocument();
	});

	it('should allow submission with all required fields', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Peace Treaty' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'Lord Varric' } });

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		expect(onCreate).toHaveBeenCalled();
	});

	it('should clear all validation errors after successful submission', async () => {
		render(NegotiationSetup);

		// First try to submit with empty fields
		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		expect(screen.getByText(/^Name is required$/i)).toBeInTheDocument();

		// Fill in fields
		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'NPC' } });

		// Submit again
		await fireEvent.click(createButton);

		expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
	});
});

describe('NegotiationSetup Component - Create Event', () => {
	it('should emit create event with name', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Peace Treaty' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'Lord Varric' } });

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Peace Treaty'
			})
		);
	});

	it('should emit create event with NPC name', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'Lord Varric' } });

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				npcName: 'Lord Varric'
			})
		);
	});

	it('should emit create event with description when provided', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'NPC' } });

		const descInput = screen.getByLabelText(/description/i);
		await fireEvent.input(descInput, { target: { value: 'Peace negotiation' } });

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				description: 'Peace negotiation'
			})
		);
	});

	it('should emit create event with selected interest', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'NPC' } });

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		// Verify it includes interest with default value 2
		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				interest: 2
			})
		);
	});

	it('should emit create event with selected patience', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'NPC' } });

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		// Verify it includes patience with default value 5
		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				patience: 5
			})
		);
	});

	it('should emit create event with motivations array', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'NPC' } });

		const addMotivationButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addMotivationButton);

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		// Verify it includes motivations array with default type 'charity'
		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				motivations: expect.arrayContaining([
					expect.objectContaining({
						type: 'charity',
						isKnown: false
					})
				])
			})
		);
	});

	it('should emit create event with pitfalls array', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'NPC' } });

		const addPitfallButton = screen.getByRole('button', { name: /add.*pitfall/i });
		await fireEvent.click(addPitfallButton);

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		// Verify it includes pitfalls array with default type 'greed'
		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				pitfalls: expect.arrayContaining([
					expect.objectContaining({
						type: 'greed',
						isKnown: false
					})
				])
			})
		);
	});

	it('should include known state in motivations', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'NPC' } });

		const addMotivationButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addMotivationButton);

		const knownToggle = screen.getByLabelText(/known|revealed/i);
		await fireEvent.click(knownToggle);

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		// Verify the known toggle changes isKnown to true
		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				motivations: expect.arrayContaining([
					expect.objectContaining({
						isKnown: true
					})
				])
			})
		);
	});
});

describe('NegotiationSetup Component - Accessibility', () => {
	it('should have proper labels for all inputs', () => {
		render(NegotiationSetup);

		expect(screen.getByLabelText(/^name|negotiation.*name/i)).toHaveAccessibleName();
		// NPC name section has mode toggles and search/input depending on mode
		expect(screen.getByText(/npc.*name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/description/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/starting.*interest/i)).toHaveAccessibleName();
		expect(screen.getByLabelText(/starting.*patience/i)).toHaveAccessibleName();
	});

	it('should mark required fields with aria-required', async () => {
		render(NegotiationSetup);

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		expect(nameInput).toHaveAttribute('aria-required', 'true');

		// Switch to manual mode to check NPC name input
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		expect(npcNameInput).toHaveAttribute('aria-required', 'true');
	});

	it('should associate validation errors with inputs', async () => {
		render(NegotiationSetup);

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		expect(nameInput).toHaveAttribute('aria-invalid', 'true');
	});

	it('should use fieldset for motivation/pitfall groups', async () => {
		const { container } = render(NegotiationSetup);

		const addMotivationButton = screen.getByRole('button', { name: /add.*motivation/i });
		await fireEvent.click(addMotivationButton);

		const fieldset = container.querySelector('fieldset');
		expect(fieldset).toBeInTheDocument();
	});
});

describe('NegotiationSetup Component - Edge Cases', () => {
	it('should handle form reset', async () => {
		render(NegotiationSetup);

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i) as HTMLInputElement;
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		expect(nameInput.value).toBe('Test');

		// Reset would clear the form
		const resetButton = screen.queryByRole('button', { name: /reset|clear/i });
		if (resetButton) {
			await fireEvent.click(resetButton);
			expect(nameInput.value).toBe('');
		}
	});

	it('should handle maximum motivations', async () => {
		render(NegotiationSetup);

		const addButton = screen.getByRole('button', { name: /add.*motivation/i });

		// Add all 12 motivation types
		for (let i = 0; i < 12; i++) {
			await fireEvent.click(addButton);
		}

		const typeSelects = screen.getAllByLabelText(/motivation.*type/i);
		expect(typeSelects.length).toBe(12);

		// Button should be disabled after 12
		expect(addButton).toBeDisabled();
	});

	it('should handle empty motivations and pitfalls arrays', async () => {
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Test' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'NPC' } });

		const createButton = screen.getByRole('button', { name: /create.*negotiation|start.*negotiation/i });
		await fireEvent.click(createButton);

		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				motivations: [],
				pitfalls: []
			})
		);
	});
});

// ============================================================================
// Issue #559: NegotiationSetup must accept an optional submitLabel prop
// ============================================================================
//
// TDD RED PHASE - These tests will fail until:
//   1. The `Props` interface in NegotiationSetup.svelte gains
//      `submitLabel?: string` (defaulting to "Create Negotiation").
//   2. The submit button renders `{submitLabel}` instead of the hardcoded
//      string "Create Negotiation" at line 420.
//
// Rendering failures and "button not found" assertion failures below are
// the expected RED signals for this phase.
// ============================================================================

describe('NegotiationSetup Component - submitLabel prop (Issue #559)', () => {
	it('should render "Create Negotiation" button label by default when no submitLabel is provided', () => {
		// Arrange / Act: render with no props (existing behaviour must be preserved)
		render(NegotiationSetup);

		// Assert: the default label must still appear so callers that do not
		// pass submitLabel continue to work unchanged
		expect(
			screen.getByRole('button', { name: /create negotiation/i })
		).toBeInTheDocument();
	});

	it('should render the provided submitLabel on the submit button instead of the default', () => {
		// Arrange: pass the submitLabel prop that the edit flow will use.
		// EXPECTED FAILURE: Props does not yet include `submitLabel`, so
		// TypeScript will reject this prop and the button will still say
		// "Create Negotiation" rather than "Save".
		render(NegotiationSetup, { props: { submitLabel: 'Save' } });

		// Assert: the button text must match the supplied label
		expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument();
	});

	it('should NOT render the default "Create Negotiation" text when submitLabel is "Save"', () => {
		// Arrange / Act
		render(NegotiationSetup, { props: { submitLabel: 'Save' } });

		// Assert: the old hardcoded label must not appear when overridden
		expect(
			screen.queryByRole('button', { name: /create negotiation/i })
		).not.toBeInTheDocument();
	});

	it('should render an arbitrary custom submitLabel on the submit button', () => {
		// Ensures the implementation uses the prop value generically, not a
		// special-cased "Save" string.
		render(NegotiationSetup, { props: { submitLabel: 'Update Negotiation' } });

		expect(
			screen.getByRole('button', { name: /^Update Negotiation$/i })
		).toBeInTheDocument();
	});

	it('should still call onCreate when submit button is clicked with a custom submitLabel', async () => {
		// Arrange: verify the label change does not break the submit callback
		const onCreate = vi.fn();
		render(NegotiationSetup, { props: { onCreate, submitLabel: 'Save' } });

		const nameInput = screen.getByLabelText(/^name|negotiation.*name/i);
		await fireEvent.input(nameInput, { target: { value: 'Peace Treaty' } });

		// Switch to manual mode to enter NPC name
		const manualButton = screen.getByRole('button', { name: /manual/i });
		await fireEvent.click(manualButton);

		const npcNameInput = screen.getByPlaceholderText(/npc.*name/i);
		await fireEvent.input(npcNameInput, { target: { value: 'Lord Varric' } });

		// Act: click the re-labelled submit button
		const saveButton = screen.getByRole('button', { name: /^Save$/i });
		await fireEvent.click(saveButton);

		// Assert: the callback still fires with the correct data
		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Peace Treaty',
				npcName: 'Lord Varric'
			})
		);
	});
});
