/**
 * Tests for SuggestionFilters Component
 *
 * Issue #43 Phase B3: Suggestions Panel UI
 *
 * This component provides filtering controls for suggestions:
 * - Type filter checkboxes (5 types: relationship, plot_thread, inconsistency, enhancement, recommendation)
 * - Status filter checkboxes (3 statuses: pending, accepted, dismissed)
 * - Relevance slider (0-100)
 * - All/None buttons for types
 * - Reset button
 * - Collapsible sections
 *
 * These tests are written in the RED phase of TDD - they will FAIL until
 * the component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SuggestionFilters from './SuggestionFilters.svelte';
import type { AISuggestionType, AISuggestionStatus } from '$lib/types/ai';

describe('SuggestionFilters Component - Basic Rendering', () => {
	const defaultProps = {
		selectedTypes: [] as AISuggestionType[],
		selectedStatuses: [] as AISuggestionStatus[],
		minRelevance: 0,
		onTypesChange: vi.fn(),
		onStatusesChange: vi.fn(),
		onMinRelevanceChange: vi.fn(),
		onReset: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without crashing', () => {
		const { container } = render(SuggestionFilters, {
			props: defaultProps
		});

		expect(container).toBeInTheDocument();
	});

	it('should render type filter section', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		expect(screen.getByText(/type/i)).toBeInTheDocument();
	});

	it('should render status filter section', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		expect(screen.getByText(/status/i)).toBeInTheDocument();
	});

	it('should render relevance filter section', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		expect(screen.getByText(/relevance/i)).toBeInTheDocument();
	});
});

describe('SuggestionFilters Component - Type Filters', () => {
	const defaultProps = {
		selectedTypes: [] as AISuggestionType[],
		selectedStatuses: [] as AISuggestionStatus[],
		minRelevance: 0,
		onTypesChange: vi.fn(),
		onStatusesChange: vi.fn(),
		onMinRelevanceChange: vi.fn(),
		onReset: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render all 5 type checkboxes', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		expect(screen.getByLabelText(/relationship/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/plot thread|plot_thread/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/inconsistency/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/enhancement/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/recommendation/i)).toBeInTheDocument();
	});

	it('should check selected type checkboxes', () => {
		const props = {
			...defaultProps,
			selectedTypes: ['relationship', 'plot_thread'] as AISuggestionType[]
		};

		render(SuggestionFilters, { props });

		const relationshipCheckbox = screen.getByLabelText(/relationship/i) as HTMLInputElement;
		const plotThreadCheckbox = screen.getByLabelText(/plot thread|plot_thread/i) as HTMLInputElement;

		expect(relationshipCheckbox.checked).toBe(true);
		expect(plotThreadCheckbox.checked).toBe(true);
	});

	it('should leave unselected type checkboxes unchecked', () => {
		const props = {
			...defaultProps,
			selectedTypes: ['relationship'] as AISuggestionType[]
		};

		render(SuggestionFilters, { props });

		const enhancementCheckbox = screen.getByLabelText(/enhancement/i) as HTMLInputElement;
		expect(enhancementCheckbox.checked).toBe(false);
	});

	it('should call onTypesChange when type checkbox is clicked', async () => {
		const onTypesChange = vi.fn();
		const props = { ...defaultProps, onTypesChange };

		render(SuggestionFilters, { props });

		const relationshipCheckbox = screen.getByLabelText(/relationship/i);
		await fireEvent.click(relationshipCheckbox);

		expect(onTypesChange).toHaveBeenCalled();
	});

	it('should add type when unchecked checkbox is clicked', async () => {
		const onTypesChange = vi.fn();
		const props = {
			...defaultProps,
			selectedTypes: [] as AISuggestionType[],
			onTypesChange
		};

		render(SuggestionFilters, { props });

		const relationshipCheckbox = screen.getByLabelText(/relationship/i);
		await fireEvent.click(relationshipCheckbox);

		expect(onTypesChange).toHaveBeenCalledWith(['relationship']);
	});

	it('should remove type when checked checkbox is clicked', async () => {
		const onTypesChange = vi.fn();
		const props = {
			...defaultProps,
			selectedTypes: ['relationship', 'plot_thread'] as AISuggestionType[],
			onTypesChange
		};

		render(SuggestionFilters, { props });

		const relationshipCheckbox = screen.getByLabelText(/relationship/i);
		await fireEvent.click(relationshipCheckbox);

		expect(onTypesChange).toHaveBeenCalledWith(['plot_thread']);
	});

	it('should display type counts when provided', () => {
		const props = {
			...defaultProps,
			typeCounts: {
				relationship: 5,
				plot_thread: 3,
				inconsistency: 1,
				enhancement: 8,
				recommendation: 2
			}
		};

		render(SuggestionFilters, { props });

		expect(screen.getByText(/5/)).toBeInTheDocument();
		expect(screen.getByText(/3/)).toBeInTheDocument();
		expect(screen.getByText(/8/)).toBeInTheDocument();
	});

	it('should not display counts when not provided', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		// Should still render checkboxes
		expect(screen.getByLabelText(/relationship/i)).toBeInTheDocument();
	});
});

describe('SuggestionFilters Component - Type All/None Buttons', () => {
	const defaultProps = {
		selectedTypes: [] as AISuggestionType[],
		selectedStatuses: [] as AISuggestionStatus[],
		minRelevance: 0,
		onTypesChange: vi.fn(),
		onStatusesChange: vi.fn(),
		onMinRelevanceChange: vi.fn(),
		onReset: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render All button for types', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		const allButton = screen.getByRole('button', { name: /all/i });
		expect(allButton).toBeInTheDocument();
	});

	it('should render None button for types', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		const noneButton = screen.getByRole('button', { name: /none/i });
		expect(noneButton).toBeInTheDocument();
	});

	it('should select all types when All button is clicked', async () => {
		const onTypesChange = vi.fn();
		const props = { ...defaultProps, onTypesChange };

		render(SuggestionFilters, { props });

		const allButton = screen.getByRole('button', { name: /all/i });
		await fireEvent.click(allButton);

		expect(onTypesChange).toHaveBeenCalledWith([
			'relationship',
			'plot_thread',
			'inconsistency',
			'enhancement',
			'recommendation'
		]);
	});

	it('should deselect all types when None button is clicked', async () => {
		const onTypesChange = vi.fn();
		const props = {
			...defaultProps,
			selectedTypes: ['relationship', 'plot_thread'] as AISuggestionType[],
			onTypesChange
		};

		render(SuggestionFilters, { props });

		const noneButton = screen.getByRole('button', { name: /none/i });
		await fireEvent.click(noneButton);

		expect(onTypesChange).toHaveBeenCalledWith([]);
	});
});

describe('SuggestionFilters Component - Status Filters', () => {
	const defaultProps = {
		selectedTypes: [] as AISuggestionType[],
		selectedStatuses: [] as AISuggestionStatus[],
		minRelevance: 0,
		onTypesChange: vi.fn(),
		onStatusesChange: vi.fn(),
		onMinRelevanceChange: vi.fn(),
		onReset: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render all 3 status checkboxes', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		expect(screen.getByLabelText(/pending/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/accepted/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/dismissed/i)).toBeInTheDocument();
	});

	it('should check selected status checkboxes', () => {
		const props = {
			...defaultProps,
			selectedStatuses: ['pending', 'accepted'] as AISuggestionStatus[]
		};

		render(SuggestionFilters, { props });

		const pendingCheckbox = screen.getByLabelText(/pending/i) as HTMLInputElement;
		const acceptedCheckbox = screen.getByLabelText(/accepted/i) as HTMLInputElement;

		expect(pendingCheckbox.checked).toBe(true);
		expect(acceptedCheckbox.checked).toBe(true);
	});

	it('should leave unselected status checkboxes unchecked', () => {
		const props = {
			...defaultProps,
			selectedStatuses: ['pending'] as AISuggestionStatus[]
		};

		render(SuggestionFilters, { props });

		const dismissedCheckbox = screen.getByLabelText(/dismissed/i) as HTMLInputElement;
		expect(dismissedCheckbox.checked).toBe(false);
	});

	it('should call onStatusesChange when status checkbox is clicked', async () => {
		const onStatusesChange = vi.fn();
		const props = { ...defaultProps, onStatusesChange };

		render(SuggestionFilters, { props });

		const pendingCheckbox = screen.getByLabelText(/pending/i);
		await fireEvent.click(pendingCheckbox);

		expect(onStatusesChange).toHaveBeenCalled();
	});

	it('should add status when unchecked checkbox is clicked', async () => {
		const onStatusesChange = vi.fn();
		const props = {
			...defaultProps,
			selectedStatuses: [] as AISuggestionStatus[],
			onStatusesChange
		};

		render(SuggestionFilters, { props });

		const pendingCheckbox = screen.getByLabelText(/pending/i);
		await fireEvent.click(pendingCheckbox);

		expect(onStatusesChange).toHaveBeenCalledWith(['pending']);
	});

	it('should remove status when checked checkbox is clicked', async () => {
		const onStatusesChange = vi.fn();
		const props = {
			...defaultProps,
			selectedStatuses: ['pending', 'accepted'] as AISuggestionStatus[],
			onStatusesChange
		};

		render(SuggestionFilters, { props });

		const pendingCheckbox = screen.getByLabelText(/pending/i);
		await fireEvent.click(pendingCheckbox);

		expect(onStatusesChange).toHaveBeenCalledWith(['accepted']);
	});
});

describe('SuggestionFilters Component - Relevance Slider', () => {
	const defaultProps = {
		selectedTypes: [] as AISuggestionType[],
		selectedStatuses: [] as AISuggestionStatus[],
		minRelevance: 0,
		onTypesChange: vi.fn(),
		onStatusesChange: vi.fn(),
		onMinRelevanceChange: vi.fn(),
		onReset: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render relevance slider', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		const slider = screen.getByRole('slider', { name: /relevance/i });
		expect(slider).toBeInTheDocument();
	});

	it('should set slider to current minRelevance value', () => {
		const props = { ...defaultProps, minRelevance: 50 };

		render(SuggestionFilters, { props });

		const slider = screen.getByRole('slider', { name: /relevance/i }) as HTMLInputElement;
		expect(slider.value).toBe('50');
	});

	it('should have min value of 0', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		const slider = screen.getByRole('slider', { name: /relevance/i }) as HTMLInputElement;
		expect(slider.min).toBe('0');
	});

	it('should have max value of 100', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		const slider = screen.getByRole('slider', { name: /relevance/i }) as HTMLInputElement;
		expect(slider.max).toBe('100');
	});

	it('should call onMinRelevanceChange when slider is moved', async () => {
		const onMinRelevanceChange = vi.fn();
		const props = { ...defaultProps, onMinRelevanceChange };

		render(SuggestionFilters, { props });

		const slider = screen.getByRole('slider', { name: /relevance/i });
		await fireEvent.input(slider, { target: { value: '75' } });

		expect(onMinRelevanceChange).toHaveBeenCalledWith(75);
	});

	it('should display current relevance value', () => {
		const props = { ...defaultProps, minRelevance: 65 };

		render(SuggestionFilters, { props });

		expect(screen.getByText(/65/)).toBeInTheDocument();
	});

	it('should handle edge value of 0', async () => {
		const onMinRelevanceChange = vi.fn();
		const props = { ...defaultProps, minRelevance: 50, onMinRelevanceChange };

		render(SuggestionFilters, { props });

		const slider = screen.getByRole('slider', { name: /relevance/i });
		await fireEvent.input(slider, { target: { value: '0' } });

		expect(onMinRelevanceChange).toHaveBeenCalledWith(0);
	});

	it('should handle edge value of 100', async () => {
		const onMinRelevanceChange = vi.fn();
		const props = { ...defaultProps, onMinRelevanceChange };

		render(SuggestionFilters, { props });

		const slider = screen.getByRole('slider', { name: /relevance/i });
		await fireEvent.input(slider, { target: { value: '100' } });

		expect(onMinRelevanceChange).toHaveBeenCalledWith(100);
	});
});

describe('SuggestionFilters Component - Reset Button', () => {
	const defaultProps = {
		selectedTypes: ['relationship'] as AISuggestionType[],
		selectedStatuses: ['pending'] as AISuggestionStatus[],
		minRelevance: 50,
		onTypesChange: vi.fn(),
		onStatusesChange: vi.fn(),
		onMinRelevanceChange: vi.fn(),
		onReset: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render reset button', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		const resetButton = screen.getByRole('button', { name: /reset|clear/i });
		expect(resetButton).toBeInTheDocument();
	});

	it('should call onReset when reset button is clicked', async () => {
		const onReset = vi.fn();
		const props = { ...defaultProps, onReset };

		render(SuggestionFilters, { props });

		const resetButton = screen.getByRole('button', { name: /reset|clear/i });
		await fireEvent.click(resetButton);

		expect(onReset).toHaveBeenCalledTimes(1);
	});

	it('should disable reset button when no filters are active', () => {
		const props = {
			...defaultProps,
			selectedTypes: [] as AISuggestionType[],
			selectedStatuses: [] as AISuggestionStatus[],
			minRelevance: 0
		};

		render(SuggestionFilters, { props });

		const resetButton = screen.getByRole('button', { name: /reset|clear/i });
		expect(resetButton).toBeDisabled();
	});

	it('should enable reset button when types are selected', () => {
		const props = {
			...defaultProps,
			selectedTypes: ['relationship'] as AISuggestionType[],
			selectedStatuses: [] as AISuggestionStatus[],
			minRelevance: 0
		};

		render(SuggestionFilters, { props });

		const resetButton = screen.getByRole('button', { name: /reset|clear/i });
		expect(resetButton).not.toBeDisabled();
	});

	it('should enable reset button when statuses are selected', () => {
		const props = {
			...defaultProps,
			selectedTypes: [] as AISuggestionType[],
			selectedStatuses: ['pending'] as AISuggestionStatus[],
			minRelevance: 0
		};

		render(SuggestionFilters, { props });

		const resetButton = screen.getByRole('button', { name: /reset|clear/i });
		expect(resetButton).not.toBeDisabled();
	});

	it('should enable reset button when minRelevance > 0', () => {
		const props = {
			...defaultProps,
			selectedTypes: [] as AISuggestionType[],
			selectedStatuses: [] as AISuggestionStatus[],
			minRelevance: 25
		};

		render(SuggestionFilters, { props });

		const resetButton = screen.getByRole('button', { name: /reset|clear/i });
		expect(resetButton).not.toBeDisabled();
	});
});

describe('SuggestionFilters Component - Collapsible Sections', () => {
	const defaultProps = {
		selectedTypes: [] as AISuggestionType[],
		selectedStatuses: [] as AISuggestionStatus[],
		minRelevance: 0,
		onTypesChange: vi.fn(),
		onStatusesChange: vi.fn(),
		onMinRelevanceChange: vi.fn(),
		onReset: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render type section as expanded by default', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		// Type checkboxes should be visible
		expect(screen.getByLabelText(/relationship/i)).toBeVisible();
	});

	it('should allow collapsing type section', async () => {
		const { container } = render(SuggestionFilters, {
			props: defaultProps
		});

		const typeHeader = screen.getByText(/type/i);
		await fireEvent.click(typeHeader);

		// Should have collapsed class or hidden content
		const collapsedSection = container.querySelector('[class*="collapsed"], [aria-expanded="false"]');
		expect(collapsedSection).toBeInTheDocument();
	});

	it('should render status section as expanded by default', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		// Status checkboxes should be visible
		expect(screen.getByLabelText(/pending/i)).toBeVisible();
	});

	it('should allow collapsing status section', async () => {
		const { container } = render(SuggestionFilters, {
			props: defaultProps
		});

		const statusHeader = screen.getByText(/status/i);
		await fireEvent.click(statusHeader);

		// Should have collapsed class or hidden content
		const collapsedSection = container.querySelector('[class*="collapsed"], [aria-expanded="false"]');
		expect(collapsedSection).toBeInTheDocument();
	});

	it('should show collapse/expand indicators', () => {
		const { container } = render(SuggestionFilters, {
			props: defaultProps
		});

		// Should have chevron icons or similar indicators
		const indicators = container.querySelectorAll('svg');
		expect(indicators.length).toBeGreaterThan(0);
	});
});

describe('SuggestionFilters Component - Accessibility', () => {
	const defaultProps = {
		selectedTypes: [] as AISuggestionType[],
		selectedStatuses: [] as AISuggestionStatus[],
		minRelevance: 0,
		onTypesChange: vi.fn(),
		onStatusesChange: vi.fn(),
		onMinRelevanceChange: vi.fn(),
		onReset: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have proper labels for all checkboxes', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		const checkboxes = screen.getAllByRole('checkbox');
		checkboxes.forEach((checkbox) => {
			expect(checkbox).toHaveAccessibleName();
		});
	});

	it('should have proper label for slider', () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		const slider = screen.getByRole('slider');
		expect(slider).toHaveAccessibleName();
	});

	it('should support keyboard navigation', async () => {
		render(SuggestionFilters, {
			props: defaultProps
		});

		const firstCheckbox = screen.getByLabelText(/relationship/i);
		firstCheckbox.focus();

		expect(document.activeElement).toBe(firstCheckbox);
	});

	it('should have aria-expanded for collapsible sections', () => {
		const { container } = render(SuggestionFilters, {
			props: defaultProps
		});

		const expandableElements = container.querySelectorAll('[aria-expanded]');
		expect(expandableElements.length).toBeGreaterThan(0);
	});
});

describe('SuggestionFilters Component - Edge Cases', () => {
	const defaultProps = {
		selectedTypes: [] as AISuggestionType[],
		selectedStatuses: [] as AISuggestionStatus[],
		minRelevance: 0,
		onTypesChange: vi.fn(),
		onStatusesChange: vi.fn(),
		onMinRelevanceChange: vi.fn(),
		onReset: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle all types selected', () => {
		const props = {
			...defaultProps,
			selectedTypes: [
				'relationship',
				'plot_thread',
				'inconsistency',
				'enhancement',
				'recommendation'
			] as AISuggestionType[]
		};

		render(SuggestionFilters, { props });

		const checkboxes = screen.getAllByRole('checkbox');
		const typeCheckboxes = checkboxes.slice(0, 5); // First 5 are types

		typeCheckboxes.forEach((checkbox) => {
			expect((checkbox as HTMLInputElement).checked).toBe(true);
		});
	});

	it('should handle all statuses selected', () => {
		const props = {
			...defaultProps,
			selectedStatuses: ['pending', 'accepted', 'dismissed'] as AISuggestionStatus[]
		};

		render(SuggestionFilters, { props });

		const pendingCheckbox = screen.getByLabelText(/pending/i) as HTMLInputElement;
		const acceptedCheckbox = screen.getByLabelText(/accepted/i) as HTMLInputElement;
		const dismissedCheckbox = screen.getByLabelText(/dismissed/i) as HTMLInputElement;

		expect(pendingCheckbox.checked).toBe(true);
		expect(acceptedCheckbox.checked).toBe(true);
		expect(dismissedCheckbox.checked).toBe(true);
	});

	it('should handle type counts of 0', () => {
		const props = {
			...defaultProps,
			typeCounts: {
				relationship: 0,
				plot_thread: 0,
				inconsistency: 0,
				enhancement: 0,
				recommendation: 0
			}
		};

		const { container } = render(SuggestionFilters, { props });
		expect(container).toBeInTheDocument();
	});

	it('should handle very large type counts', () => {
		const props = {
			...defaultProps,
			typeCounts: {
				relationship: 999999,
				plot_thread: 100000,
				inconsistency: 50000,
				enhancement: 75000,
				recommendation: 25000
			}
		};

		render(SuggestionFilters, { props });

		expect(screen.getByText(/999999/)).toBeInTheDocument();
	});

	it('should handle rapid slider changes', async () => {
		const onMinRelevanceChange = vi.fn();
		const props = { ...defaultProps, onMinRelevanceChange };

		render(SuggestionFilters, { props });

		const slider = screen.getByRole('slider', { name: /relevance/i });

		for (let i = 0; i <= 100; i += 10) {
			await fireEvent.input(slider, { target: { value: i.toString() } });
		}

		expect(onMinRelevanceChange).toHaveBeenCalled();
	});

	it('should handle missing callback props gracefully', async () => {
		const props = {
			selectedTypes: [] as AISuggestionType[],
			selectedStatuses: [] as AISuggestionStatus[],
			minRelevance: 0
		};

		render(SuggestionFilters, { props });

		const checkbox = screen.getByLabelText(/relationship/i);

		await expect(async () => {
			await fireEvent.click(checkbox);
		}).not.toThrow();
	});
});
