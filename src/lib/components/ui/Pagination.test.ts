import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Pagination from './Pagination.svelte';

/**
 * Tests for Pagination Component
 *
 * Issue #20: Add Pagination to Entity Lists
 *
 * This is a reusable pagination component that handles:
 * - Page navigation (Previous/Next)
 * - Per-page selector
 * - Item range display ("Showing X-Y of Z items")
 * - Disabled states for navigation buttons
 *
 * These tests are written in the RED phase of TDD - they will FAIL until the
 * component is implemented.
 */

describe('Pagination Component - Item Range Display', () => {
	it('should display correct item range for first page with 20 items per page', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 156,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		expect(screen.getByText(/showing 1-20 of 156 items/i)).toBeInTheDocument();
	});

	it('should display correct item range for middle page', () => {
		render(Pagination, {
			props: {
				currentPage: 3,
				totalItems: 156,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		// Page 3 with 20 per page = items 41-60
		expect(screen.getByText(/showing 41-60 of 156 items/i)).toBeInTheDocument();
	});

	it('should display correct item range for last page with partial items', () => {
		render(Pagination, {
			props: {
				currentPage: 8,
				totalItems: 156,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		// Page 8 with 20 per page = items 141-156 (only 16 items on last page)
		expect(screen.getByText(/showing 141-156 of 156 items/i)).toBeInTheDocument();
	});

	it('should display correct item range with different perPage values', () => {
		render(Pagination, {
			props: {
				currentPage: 2,
				totalItems: 156,
				perPage: 50,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		// Page 2 with 50 per page = items 51-100
		expect(screen.getByText(/showing 51-100 of 156 items/i)).toBeInTheDocument();
	});

	it('should display single page correctly', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 15,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		expect(screen.getByText(/showing 1-15 of 15 items/i)).toBeInTheDocument();
	});

	it('should display zero items correctly', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 0,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		expect(screen.getByText(/showing 0 items|0-0 of 0 items/i)).toBeInTheDocument();
	});
});

describe('Pagination Component - Previous Button States', () => {
	it('should disable Previous button on first page', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		expect(prevButton).toBeDisabled();
	});

	it('should enable Previous button on second page', () => {
		render(Pagination, {
			props: {
				currentPage: 2,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		expect(prevButton).not.toBeDisabled();
	});

	it('should enable Previous button on middle page', () => {
		render(Pagination, {
			props: {
				currentPage: 3,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		expect(prevButton).not.toBeDisabled();
	});

	it('should enable Previous button on last page', () => {
		render(Pagination, {
			props: {
				currentPage: 5,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		expect(prevButton).not.toBeDisabled();
	});
});

describe('Pagination Component - Next Button States', () => {
	it('should enable Next button on first page when multiple pages exist', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next/i });
		expect(nextButton).not.toBeDisabled();
	});

	it('should enable Next button on middle page', () => {
		render(Pagination, {
			props: {
				currentPage: 3,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next/i });
		expect(nextButton).not.toBeDisabled();
	});

	it('should disable Next button on last page', () => {
		render(Pagination, {
			props: {
				currentPage: 5,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next/i });
		expect(nextButton).toBeDisabled();
	});

	it('should disable Next button when only one page exists', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 15,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next/i });
		expect(nextButton).toBeDisabled();
	});

	it('should disable Next button on last page with partial items', () => {
		render(Pagination, {
			props: {
				currentPage: 8,
				totalItems: 156,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next/i });
		expect(nextButton).toBeDisabled();
	});
});

describe('Pagination Component - Previous Button Clicks', () => {
	it('should call onPageChange with currentPage - 1 when Previous is clicked', async () => {
		const onPageChange = vi.fn();

		render(Pagination, {
			props: {
				currentPage: 3,
				totalItems: 100,
				perPage: 20,
				onPageChange,
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		await fireEvent.click(prevButton);

		expect(onPageChange).toHaveBeenCalledWith(2);
		expect(onPageChange).toHaveBeenCalledTimes(1);
	});

	it('should not call onPageChange when Previous is clicked on first page', async () => {
		const onPageChange = vi.fn();

		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				onPageChange,
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		await fireEvent.click(prevButton);

		expect(onPageChange).not.toHaveBeenCalled();
	});

	it('should call onPageChange with 1 when on page 2 and Previous is clicked', async () => {
		const onPageChange = vi.fn();

		render(Pagination, {
			props: {
				currentPage: 2,
				totalItems: 100,
				perPage: 20,
				onPageChange,
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		await fireEvent.click(prevButton);

		expect(onPageChange).toHaveBeenCalledWith(1);
	});
});

describe('Pagination Component - Next Button Clicks', () => {
	it('should call onPageChange with currentPage + 1 when Next is clicked', async () => {
		const onPageChange = vi.fn();

		render(Pagination, {
			props: {
				currentPage: 2,
				totalItems: 100,
				perPage: 20,
				onPageChange,
				onPerPageChange: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next/i });
		await fireEvent.click(nextButton);

		expect(onPageChange).toHaveBeenCalledWith(3);
		expect(onPageChange).toHaveBeenCalledTimes(1);
	});

	it('should not call onPageChange when Next is clicked on last page', async () => {
		const onPageChange = vi.fn();

		render(Pagination, {
			props: {
				currentPage: 5,
				totalItems: 100,
				perPage: 20,
				onPageChange,
				onPerPageChange: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next/i });
		await fireEvent.click(nextButton);

		expect(onPageChange).not.toHaveBeenCalled();
	});

	it('should call onPageChange with 2 when on page 1 and Next is clicked', async () => {
		const onPageChange = vi.fn();

		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				onPageChange,
				onPerPageChange: vi.fn()
			}
		});

		const nextButton = screen.getByRole('button', { name: /next/i });
		await fireEvent.click(nextButton);

		expect(onPageChange).toHaveBeenCalledWith(2);
	});
});

describe('Pagination Component - Per-Page Selector', () => {
	it('should display per-page selector with current value', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				perPageOptions: [20, 50, 100],
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const select = screen.getByRole('combobox', { name: /per page|items per page/i });
		expect(select).toBeInTheDocument();
		expect(select).toHaveValue('20');
	});

	it('should display all per-page options', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				perPageOptions: [20, 50, 100],
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		expect(screen.getByRole('option', { name: '20' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument();
	});

	it('should call onPerPageChange when selector value changes', async () => {
		const onPerPageChange = vi.fn();

		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				perPageOptions: [20, 50, 100],
				onPageChange: vi.fn(),
				onPerPageChange
			}
		});

		const select = screen.getByRole('combobox', { name: /per page|items per page/i });
		await fireEvent.change(select, { target: { value: '50' } });

		expect(onPerPageChange).toHaveBeenCalledWith(50);
		expect(onPerPageChange).toHaveBeenCalledTimes(1);
	});

	it('should call onPerPageChange with number type', async () => {
		const onPerPageChange = vi.fn();

		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				perPageOptions: [20, 50, 100],
				onPageChange: vi.fn(),
				onPerPageChange
			}
		});

		const select = screen.getByRole('combobox', { name: /per page|items per page/i });
		await fireEvent.change(select, { target: { value: '100' } });

		expect(onPerPageChange).toHaveBeenCalledWith(100);
		expect(typeof onPerPageChange.mock.calls[0][0]).toBe('number');
	});

	it('should use default per-page options when not provided', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		// Should have default options of 20, 50, 100
		expect(screen.getByRole('option', { name: '20' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument();
	});
});

describe('Pagination Component - Edge Cases', () => {
	it('should handle zero items gracefully', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 0,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		const nextButton = screen.getByRole('button', { name: /next/i });

		expect(prevButton).toBeDisabled();
		expect(nextButton).toBeDisabled();
	});

	it('should handle single item correctly', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 1,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		expect(screen.getByText(/showing 1-1 of 1 item/i)).toBeInTheDocument();
	});

	it('should handle exact multiple of perPage items', () => {
		render(Pagination, {
			props: {
				currentPage: 5,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		expect(screen.getByText(/showing 81-100 of 100 items/i)).toBeInTheDocument();

		const nextButton = screen.getByRole('button', { name: /next/i });
		expect(nextButton).toBeDisabled();
	});

	it('should handle very large perPage value', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 156,
				perPage: 1000,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		expect(screen.getByText(/showing 1-156 of 156 items/i)).toBeInTheDocument();

		const nextButton = screen.getByRole('button', { name: /next/i });
		expect(nextButton).toBeDisabled();
	});

	it('should disable both buttons when only one page exists', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 10,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		const nextButton = screen.getByRole('button', { name: /next/i });

		expect(prevButton).toBeDisabled();
		expect(nextButton).toBeDisabled();
	});
});

describe('Pagination Component - Accessibility', () => {
	it('should have accessible button labels', () => {
		render(Pagination, {
			props: {
				currentPage: 2,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		expect(screen.getByRole('button', { name: /previous/i })).toHaveAccessibleName();
		expect(screen.getByRole('button', { name: /next/i })).toHaveAccessibleName();
	});

	it('should have accessible select label', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				perPageOptions: [20, 50, 100],
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const select = screen.getByRole('combobox', { name: /per page|items per page/i });
		expect(select).toHaveAccessibleName();
	});

	it('should support keyboard navigation on buttons', () => {
		render(Pagination, {
			props: {
				currentPage: 2,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		const nextButton = screen.getByRole('button', { name: /next/i });

		expect(prevButton).toHaveAttribute('type', 'button');
		expect(nextButton).toHaveAttribute('type', 'button');
	});

	it('should have semantic HTML structure', () => {
		const { container } = render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		// Should use nav element for pagination
		const nav = container.querySelector('nav');
		expect(nav).toBeInTheDocument();
	});
});

describe('Pagination Component - Visual States', () => {
	it('should apply disabled styling to disabled buttons', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });

		expect(prevButton).toBeDisabled();
		expect(prevButton.className).toMatch(/disabled|opacity/);
	});

	it('should not apply disabled styling to enabled buttons', () => {
		render(Pagination, {
			props: {
				currentPage: 2,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		const prevButton = screen.getByRole('button', { name: /previous/i });
		const nextButton = screen.getByRole('button', { name: /next/i });

		expect(prevButton).not.toBeDisabled();
		expect(nextButton).not.toBeDisabled();
	});
});

describe('Pagination Component - Props Validation', () => {
	it('should render with minimal required props', () => {
		expect(() => {
			render(Pagination, {
				props: {
					currentPage: 1,
					totalItems: 50,
					perPage: 20,
					onPageChange: vi.fn(),
					onPerPageChange: vi.fn()
				}
			});
		}).not.toThrow();
	});

	it('should handle invalid currentPage gracefully', () => {
		render(Pagination, {
			props: {
				currentPage: 0,
				totalItems: 100,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		// Should treat as page 1
		const prevButton = screen.getByRole('button', { name: /previous/i });
		expect(prevButton).toBeDisabled();
	});

	it('should handle negative totalItems gracefully', () => {
		render(Pagination, {
			props: {
				currentPage: 1,
				totalItems: -5,
				perPage: 20,
				onPageChange: vi.fn(),
				onPerPageChange: vi.fn()
			}
		});

		// Should treat as 0 items
		expect(screen.getByText(/0 items|showing 0/i)).toBeInTheDocument();
	});

	it('should handle perPage of 0 gracefully', () => {
		expect(() => {
			render(Pagination, {
				props: {
					currentPage: 1,
					totalItems: 100,
					perPage: 0,
					onPageChange: vi.fn(),
					onPerPageChange: vi.fn()
				}
			});
		}).not.toThrow();
	});
});
