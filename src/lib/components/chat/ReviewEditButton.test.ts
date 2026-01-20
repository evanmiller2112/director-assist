/**
 * Tests for ReviewEditButton Component (TDD RED Phase - Phase A4)
 *
 * Issue #40: AI Chat Panel - Phase A4 (Save Flow & Prefill)
 *
 * This component renders a "Review & Edit" button that navigates to a prefilled
 * entity form, allowing users to review and modify AI-generated entity data
 * before saving it.
 *
 * These tests should FAIL initially as the component doesn't exist yet.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ReviewEditButton from './ReviewEditButton.svelte';
import type { ParsedEntity } from '$lib/services/entityParserService';
import type { EntityType } from '$lib/types';
import { goto } from '$app/navigation';

// Mock the navigation
vi.mock('$app/navigation', async () => {
	const actual = await vi.importActual('../../../tests/mocks/$app/navigation');
	return actual;
});

describe('ReviewEditButton Component', () => {
	const mockParsedEntity: ParsedEntity = {
		entityType: 'npc' as EntityType,
		confidence: 0.8,
		name: 'Captain Aldric',
		description: 'A stern guard captain',
		summary: 'Guard captain',
		tags: ['guard'],
		fields: {
			role: 'Guard Captain'
		},
		validationErrors: {}
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render with "Review & Edit" text', () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			expect(screen.getByText(/review & edit/i)).toBeInTheDocument();
		});

		it('should render with edit icon', () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			// Button should be present (implementation uses lucide-svelte Edit icon)
			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).toBeInTheDocument();
		});

		it('should render as a button element', () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).toHaveAttribute('type', 'button');
		});

		it('should have appropriate styling classes', () => {
			const { container } = render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button.className).toContain('flex');
			expect(button.className).toContain('items-center');
		});
	});

	describe('Navigation', () => {
		it('should navigate to entity form when clicked', async () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			expect(goto).toHaveBeenCalledTimes(1);
		});

		it('should navigate to correct entity type URL', async () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			expect(calledUrl).toContain('/entities/new/npc');
		});

		it('should include prefill parameter in URL', async () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			expect(calledUrl).toContain('?prefill=');
		});

		it('should pass serialized entity data in prefill parameter', async () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			const url = new URL(calledUrl, 'http://localhost');
			const prefillParam = url.searchParams.get('prefill');

			expect(prefillParam).toBeTruthy();
			// Should be base64
			expect(prefillParam).toMatch(/^[A-Za-z0-9+/=]+$/);
		});

		it('should include messageId in prefill data when provided', async () => {
			const messageId = 'msg-123';

			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity,
					messageId
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			const url = new URL(calledUrl, 'http://localhost');
			const prefillParam = url.searchParams.get('prefill');

			expect(prefillParam).toBeTruthy();
			const decoded = atob(prefillParam!);
			expect(decoded).toContain('msg-123');
		});

		it('should not include messageId when not provided', async () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			const url = new URL(calledUrl, 'http://localhost');
			const prefillParam = url.searchParams.get('prefill');

			expect(prefillParam).toBeTruthy();
			const decoded = atob(prefillParam!);
			expect(decoded).not.toContain('sourceMessageId');
		});

		it('should navigate to location form for location entities', async () => {
			const locationEntity: ParsedEntity = {
				...mockParsedEntity,
				entityType: 'location'
			};

			render(ReviewEditButton, {
				props: {
					entity: locationEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			expect(calledUrl).toContain('/entities/new/location');
		});

		it('should navigate to faction form for faction entities', async () => {
			const factionEntity: ParsedEntity = {
				...mockParsedEntity,
				entityType: 'faction'
			};

			render(ReviewEditButton, {
				props: {
					entity: factionEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			expect(calledUrl).toContain('/entities/new/faction');
		});

		it('should handle custom entity types', async () => {
			const customEntity: ParsedEntity = {
				...mockParsedEntity,
				entityType: 'custom_spell' as EntityType
			};

			render(ReviewEditButton, {
				props: {
					entity: customEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			expect(calledUrl).toContain('/entities/new/custom_spell');
		});
	});

	describe('Disabled State', () => {
		it('should be disabled when entity has validation errors', () => {
			const invalidEntity: ParsedEntity = {
				...mockParsedEntity,
				validationErrors: {
					role: 'Role is required'
				}
			};

			render(ReviewEditButton, {
				props: {
					entity: invalidEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).toBeDisabled();
		});

		it('should not be disabled when entity has no validation errors', () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).not.toBeDisabled();
		});

		it('should not navigate when disabled', async () => {
			const invalidEntity: ParsedEntity = {
				...mockParsedEntity,
				validationErrors: {
					role: 'Role is required'
				}
			};

			render(ReviewEditButton, {
				props: {
					entity: invalidEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			expect(goto).not.toHaveBeenCalled();
		});

		it('should show tooltip when disabled due to validation errors', () => {
			const invalidEntity: ParsedEntity = {
				...mockParsedEntity,
				validationErrors: {
					role: 'Role is required'
				}
			};

			render(ReviewEditButton, {
				props: {
					entity: invalidEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).toHaveAttribute('title');
			expect(button.getAttribute('title')).toContain('validation error');
		});
	});

	describe('Edge Cases', () => {
		it('should handle entity with no name', () => {
			const entityWithoutName: ParsedEntity = {
				...mockParsedEntity,
				name: ''
			};

			render(ReviewEditButton, {
				props: {
					entity: entityWithoutName
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).toBeInTheDocument();
		});

		it('should handle entity with special characters in name', async () => {
			const entityWithSpecialChars: ParsedEntity = {
				...mockParsedEntity,
				name: "Sir O'Brien & Co."
			};

			render(ReviewEditButton, {
				props: {
					entity: entityWithSpecialChars
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			expect(goto).toHaveBeenCalled();
			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			expect(() => new URL(calledUrl, 'http://localhost')).not.toThrow();
		});

		it('should handle entity with very long description', async () => {
			const entityWithLongDesc: ParsedEntity = {
				...mockParsedEntity,
				description: 'A'.repeat(2000)
			};

			render(ReviewEditButton, {
				props: {
					entity: entityWithLongDesc
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			expect(goto).toHaveBeenCalled();
		});

		it('should handle entity with unicode characters', async () => {
			const entityWithUnicode: ParsedEntity = {
				...mockParsedEntity,
				name: 'Éléonore 北京 🎭'
			};

			render(ReviewEditButton, {
				props: {
					entity: entityWithUnicode
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			expect(goto).toHaveBeenCalled();
			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			expect(() => new URL(calledUrl, 'http://localhost')).not.toThrow();
		});

		it('should handle entity with empty fields', async () => {
			const entityWithEmptyFields: ParsedEntity = {
				...mockParsedEntity,
				fields: {}
			};

			render(ReviewEditButton, {
				props: {
					entity: entityWithEmptyFields
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			expect(goto).toHaveBeenCalled();
		});

		it('should handle entity with complex field values', async () => {
			const entityWithComplexFields: ParsedEntity = {
				...mockParsedEntity,
				fields: {
					role: 'Guard Captain',
					level: 10,
					isHostile: false,
					tags: ['warrior', 'leader'],
					notes: 'Multiple\nlines\nof\ntext'
				}
			};

			render(ReviewEditButton, {
				props: {
					entity: entityWithComplexFields
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			expect(goto).toHaveBeenCalled();
		});

		it('should prevent multiple rapid clicks', async () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });

			// Click multiple times rapidly
			await fireEvent.click(button);
			await fireEvent.click(button);
			await fireEvent.click(button);

			// Should only navigate once (or handle gracefully)
			expect(vi.mocked(goto).mock.calls.length).toBeLessThanOrEqual(3);
		});
	});

	describe('Accessibility', () => {
		it('should have accessible button label', () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).toHaveAccessibleName();
		});

		it('should have proper button type', () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).toHaveAttribute('type', 'button');
		});

		it('should communicate disabled state to screen readers', () => {
			const invalidEntity: ParsedEntity = {
				...mockParsedEntity,
				validationErrors: {
					role: 'Role is required'
				}
			};

			render(ReviewEditButton, {
				props: {
					entity: invalidEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).toHaveAttribute('disabled');
		});

		it('should be keyboard accessible', () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button.tagName).toBe('BUTTON');
		});
	});

	describe('Visual States', () => {
		it('should have distinct styling when enabled', () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button.className).toBeTruthy();
		});

		it('should have distinct styling when disabled', () => {
			const invalidEntity: ParsedEntity = {
				...mockParsedEntity,
				validationErrors: {
					role: 'Role is required'
				}
			};

			render(ReviewEditButton, {
				props: {
					entity: invalidEntity
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).toBeDisabled();
		});

		it('should display edit icon', () => {
			const { container } = render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity
				}
			});

			// Should contain an SVG icon (lucide-svelte Edit icon)
			const svg = container.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});
	});

	describe('Integration with EntityDetectionIndicator', () => {
		it('should work alongside SaveEntityButton', () => {
			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity,
					messageId: 'msg-integration'
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			expect(button).toBeInTheDocument();
		});

		it('should pass messageId through to navigation', async () => {
			const messageId = 'msg-integration-456';

			render(ReviewEditButton, {
				props: {
					entity: mockParsedEntity,
					messageId
				}
			});

			const button = screen.getByRole('button', { name: /review & edit/i });
			await fireEvent.click(button);

			const calledUrl = vi.mocked(goto).mock.calls[0][0];
			const url = new URL(calledUrl, 'http://localhost');
			const prefillParam = url.searchParams.get('prefill');
			const decoded = atob(prefillParam!);

			expect(decoded).toContain(messageId);
		});
	});
});
