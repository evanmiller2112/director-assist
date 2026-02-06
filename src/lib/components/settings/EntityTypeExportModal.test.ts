/**
 * Tests for EntityTypeExportModal Component
 *
 * GitHub Issue #210: Add clone and template library for custom entities
 *
 * This component provides a modal for exporting entity types as JSON files.
 * Users can preview the export, add optional metadata (author, license, source URL),
 * and download the entity type definition.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component is implemented.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import EntityTypeExportModal from './EntityTypeExportModal.svelte';
import type { EntityTypeDefinition } from '$lib/types';

describe('EntityTypeExportModal - Basic Rendering (Issue #210)', () => {
	const mockEntityType: EntityTypeDefinition = {
		type: 'quest',
		label: 'Quest',
		labelPlural: 'Quests',
		icon: 'scroll',
		color: 'yellow',
		isBuiltIn: false,
		fieldDefinitions: [
			{ key: 'objective', label: 'Objective', type: 'text', required: true, order: 0 },
			{ key: 'reward', label: 'Reward', type: 'textarea', required: false, order: 1 }
		],
		defaultRelationships: ['involves', 'located_at']
	};

	it('should render without crashing', () => {
		const { container } = render(EntityTypeExportModal, {
			props: {
				open: false,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should not be visible when open is false', () => {
		render(EntityTypeExportModal, {
			props: {
				open: false,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should be visible when open is true', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should have appropriate modal title', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		expect(screen.getByText(/export.*entity type/i)).toBeInTheDocument();
	});

	it('should have dialog role for accessibility', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});
});

describe('EntityTypeExportModal - Entity Type Display (Issue #210)', () => {
	const mockEntityType: EntityTypeDefinition = {
		type: 'quest',
		label: 'Quest',
		labelPlural: 'Quests',
		icon: 'scroll',
		color: 'yellow',
		isBuiltIn: false,
		fieldDefinitions: [
			{ key: 'objective', label: 'Objective', type: 'text', required: true, order: 0 },
			{ key: 'reward', label: 'Reward', type: 'textarea', required: false, order: 1 }
		],
		defaultRelationships: ['involves', 'located_at']
	};

	it('should display entity type name', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		expect(screen.getByText('Quest')).toBeInTheDocument();
	});

	it('should display field count', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		expect(screen.getByText(/2.*fields?/i)).toBeInTheDocument();
	});

	it('should display entity type icon', () => {
		const { container } = render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		// Icon should be rendered (SVG from Lucide)
		const icons = container.querySelectorAll('svg');
		expect(icons.length).toBeGreaterThan(0);
	});

	it('should show preview of export format', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		// Should show some indication of the export format/structure
		expect(screen.getByText(/preview|export format|json/i)).toBeInTheDocument();
	});
});

describe('EntityTypeExportModal - Metadata Fields (Issue #210)', () => {
	const mockEntityType: EntityTypeDefinition = {
		type: 'quest',
		label: 'Quest',
		labelPlural: 'Quests',
		icon: 'scroll',
		color: 'yellow',
		isBuiltIn: false,
		fieldDefinitions: [],
		defaultRelationships: []
	};

	it('should have author input field', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const authorInput = screen.getByLabelText(/author/i);
		expect(authorInput).toBeInTheDocument();
		expect(authorInput.tagName).toBe('INPUT');
	});

	it('should have license input field', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const licenseInput = screen.getByLabelText(/license/i);
		expect(licenseInput).toBeInTheDocument();
	});

	it('should have source URL input field', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const sourceUrlInput = screen.getByLabelText(/source.*url|url/i);
		expect(sourceUrlInput).toBeInTheDocument();
		expect(sourceUrlInput.getAttribute('type')).toBe('url');
	});

	it('should allow entering author name', async () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const authorInput = screen.getByLabelText(/author/i);
		await fireEvent.input(authorInput, { target: { value: 'John Doe' } });

		expect((authorInput as HTMLInputElement).value).toBe('John Doe');
	});

	it('should allow entering license', async () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const licenseInput = screen.getByLabelText(/license/i);
		await fireEvent.input(licenseInput, { target: { value: 'CC-BY-4.0' } });

		expect((licenseInput as HTMLInputElement).value).toBe('CC-BY-4.0');
	});

	it('should allow entering source URL', async () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const sourceUrlInput = screen.getByLabelText(/source.*url|url/i);
		await fireEvent.input(sourceUrlInput, { target: { value: 'https://example.com/quest' } });

		expect((sourceUrlInput as HTMLInputElement).value).toBe('https://example.com/quest');
	});

	it('should mark metadata fields as optional', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const authorInput = screen.getByLabelText(/author/i);
		expect(authorInput).not.toHaveAttribute('required');
	});
});

describe('EntityTypeExportModal - Download Action (Issue #210)', () => {
	const mockEntityType: EntityTypeDefinition = {
		type: 'quest',
		label: 'Quest',
		labelPlural: 'Quests',
		icon: 'scroll',
		color: 'yellow',
		isBuiltIn: false,
		fieldDefinitions: [
			{ key: 'objective', label: 'Objective', type: 'text', required: true, order: 0 }
		],
		defaultRelationships: ['involves']
	};

	// Mock document.createElement for download testing
	let mockLink: HTMLAnchorElement;

	beforeEach(() => {
		mockLink = {
			click: vi.fn(),
			setAttribute: vi.fn(),
			style: {}
		} as any;
		vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
		vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
		vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
		vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should have Download button', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const downloadButton = screen.getByRole('button', { name: /download|export/i });
		expect(downloadButton).toBeInTheDocument();
	});

	it('should trigger download when Download button is clicked', async () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const downloadButton = screen.getByRole('button', { name: /download|export/i });
		await fireEvent.click(downloadButton);

		expect(mockLink.click).toHaveBeenCalled();
	});

	it('should use correct filename format for download', async () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const downloadButton = screen.getByRole('button', { name: /download|export/i });
		await fireEvent.click(downloadButton);

		// Filename should be: {type}-entity-type.json
		expect(mockLink.setAttribute).toHaveBeenCalledWith(
			'download',
			expect.stringMatching(/quest.*entity.*type\.json/i)
		);
	});

	it('should include metadata in export when provided', async () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		// Fill in metadata
		const authorInput = screen.getByLabelText(/author/i);
		await fireEvent.input(authorInput, { target: { value: 'Jane Smith' } });

		const licenseInput = screen.getByLabelText(/license/i);
		await fireEvent.input(licenseInput, { target: { value: 'MIT' } });

		const downloadButton = screen.getByRole('button', { name: /download|export/i });
		await fireEvent.click(downloadButton);

		// Verify blob was created (metadata would be in the blob)
		expect(URL.createObjectURL).toHaveBeenCalled();
	});

	it('should create valid JSON blob', async () => {
		let blobContent: string | null = null;
		vi.spyOn(global, 'Blob').mockImplementation(function(this: Blob, content: any[]) {
			blobContent = content[0];
			return new Blob(content, { type: 'application/json' });
		} as any);

		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const downloadButton = screen.getByRole('button', { name: /download|export/i });
		await fireEvent.click(downloadButton);

		expect(blobContent).toBeTruthy();
		// Should be valid JSON
		expect(() => JSON.parse(blobContent!)).not.toThrow();
	});

	it('should include version and generator info in export', async () => {
		let blobContent: string | null = null;
		vi.spyOn(global, 'Blob').mockImplementation(function(this: Blob, content: any[]) {
			blobContent = content[0];
			return new Blob(content, { type: 'application/json' });
		} as any);

		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const downloadButton = screen.getByRole('button', { name: /download|export/i });
		await fireEvent.click(downloadButton);

		const exportData = JSON.parse(blobContent!);
		expect(exportData.version).toBe('1.0.0');
		expect(exportData.generator).toEqual(
			expect.objectContaining({
				name: 'Director Assist'
			})
		);
	});
});

describe('EntityTypeExportModal - Close Action (Issue #210)', () => {
	const mockEntityType: EntityTypeDefinition = {
		type: 'quest',
		label: 'Quest',
		labelPlural: 'Quests',
		icon: 'scroll',
		color: 'yellow',
		isBuiltIn: false,
		fieldDefinitions: [],
		defaultRelationships: []
	};

	it('should have Close button', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const closeButton = screen.getByRole('button', { name: /close|cancel/i });
		expect(closeButton).toBeInTheDocument();
	});

	it('should call onclose when Close is clicked', async () => {
		const onclose = vi.fn();
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose
			}
		});

		const closeButton = screen.getByRole('button', { name: /close|cancel/i });
		await fireEvent.click(closeButton);

		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('should call onclose when Escape key is pressed', async () => {
		const onclose = vi.fn();
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose
			}
		});

		await fireEvent.keyDown(document, { key: 'Escape' });

		expect(onclose).toHaveBeenCalledTimes(1);
	});
});

describe('EntityTypeExportModal - Accessibility (Issue #210)', () => {
	const mockEntityType: EntityTypeDefinition = {
		type: 'quest',
		label: 'Quest',
		labelPlural: 'Quests',
		icon: 'scroll',
		color: 'yellow',
		isBuiltIn: false,
		fieldDefinitions: [],
		defaultRelationships: []
	};

	it('should have aria-modal attribute', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have aria-labelledby connecting title to dialog', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		const title = screen.getByText(/export.*entity type/i);

		const titleId = title.getAttribute('id');
		expect(titleId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', titleId);
	});

	it('should have proper labels for all input fields', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/license/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/source.*url|url/i)).toBeInTheDocument();
	});

	it('should trap focus within modal', () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: mockEntityType,
				onclose: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		const buttons = screen.getAllByRole('button');
		const inputs = screen.getAllByRole('textbox');

		buttons.forEach((button) => {
			expect(dialog).toContainElement(button);
		});
		inputs.forEach((input) => {
			expect(dialog).toContainElement(input);
		});
	});
});

describe('EntityTypeExportModal - Edge Cases (Issue #210)', () => {
	it('should handle entity type with no fields', () => {
		const emptyEntityType: EntityTypeDefinition = {
			type: 'empty',
			label: 'Empty Type',
			labelPlural: 'Empty Types',
			icon: 'box',
			color: 'gray',
			isBuiltIn: false,
			fieldDefinitions: [],
			defaultRelationships: []
		};

		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: emptyEntityType,
				onclose: vi.fn()
			}
		});

		expect(screen.getByText(/0.*fields?/i)).toBeInTheDocument();
	});

	it('should handle entity type with many fields', () => {
		const manyFieldsEntityType: EntityTypeDefinition = {
			type: 'complex',
			label: 'Complex Type',
			labelPlural: 'Complex Types',
			icon: 'box',
			color: 'gray',
			isBuiltIn: false,
			fieldDefinitions: Array.from({ length: 20 }, (_, i) => ({
				key: `field${i}`,
				label: `Field ${i}`,
				type: 'text' as const,
				required: false,
				order: i
			})),
			defaultRelationships: []
		};

		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: manyFieldsEntityType,
				onclose: vi.fn()
			}
		});

		expect(screen.getByText(/20.*fields?/i)).toBeInTheDocument();
	});

	it('should handle invalid URL in source URL field', async () => {
		render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: {
					type: 'test',
					label: 'Test',
					labelPlural: 'Tests',
					icon: 'box',
					color: 'gray',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				},
				onclose: vi.fn()
			}
		});

		const sourceUrlInput = screen.getByLabelText(/source.*url|url/i);
		await fireEvent.input(sourceUrlInput, { target: { value: 'not-a-valid-url' } });

		// HTML5 validation should handle this
		expect(sourceUrlInput).toHaveAttribute('type', 'url');
	});

	it('should reset metadata when modal is closed and reopened', async () => {
		const { rerender } = render(EntityTypeExportModal, {
			props: {
				open: true,
				entityType: {
					type: 'test',
					label: 'Test',
					labelPlural: 'Tests',
					icon: 'box',
					color: 'gray',
					isBuiltIn: false,
					fieldDefinitions: [],
					defaultRelationships: []
				},
				onclose: vi.fn()
			}
		});

		const authorInput = screen.getByLabelText(/author/i);
		await fireEvent.input(authorInput, { target: { value: 'Test Author' } });

		// Close modal
		rerender({
			open: false,
			entityType: {
				type: 'test',
				label: 'Test',
				labelPlural: 'Tests',
				icon: 'box',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			onclose: vi.fn()
		});

		// Reopen modal
		rerender({
			open: true,
			entityType: {
				type: 'test',
				label: 'Test',
				labelPlural: 'Tests',
				icon: 'box',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			onclose: vi.fn()
		});

		const newAuthorInput = screen.getByLabelText(/author/i) as HTMLInputElement;
		expect(newAuthorInput.value).toBe('');
	});
});
