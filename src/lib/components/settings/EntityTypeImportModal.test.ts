/**
 * Tests for EntityTypeImportModal Component
 *
 * GitHub Issue #210: Add clone and template library for custom entities
 *
 * This component provides a modal for importing entity types from JSON files.
 * It includes file validation, conflict detection, error/warning display,
 * and preview before import.
 *
 * RED Phase (TDD): These tests define expected behavior BEFORE implementation.
 * All tests should FAIL until the component is implemented.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import EntityTypeImportModal from './EntityTypeImportModal.svelte';
import type { EntityTypeDefinition } from '$lib/types';

// Mock the campaign store for conflict detection
vi.mock('$lib/stores/campaign.svelte', () => ({
	campaignStore: {
		customEntityTypes: [
			{
				type: 'existing_quest',
				label: 'Existing Quest',
				labelPlural: 'Existing Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			}
		]
	}
}));

describe('EntityTypeImportModal - Basic Rendering (Issue #210)', () => {
	it('should render without crashing', () => {
		const { container } = render(EntityTypeImportModal, {
			props: {
				open: false,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should not be visible when open is false', () => {
		render(EntityTypeImportModal, {
			props: {
				open: false,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.queryByRole('dialog');
		expect(dialog).not.toBeInTheDocument();
	});

	it('should be visible when open is true', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toBeInTheDocument();
	});

	it('should have appropriate modal title', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		expect(screen.getByText(/import.*entity type/i)).toBeInTheDocument();
	});

	it('should have dialog role for accessibility', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});
});

describe('EntityTypeImportModal - File Picker (Issue #210)', () => {
	it('should have file input field', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		expect(fileInput).toBeInTheDocument();
		expect(fileInput.getAttribute('type')).toBe('file');
	});

	it('should accept only JSON files', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		expect(fileInput.getAttribute('accept')).toMatch(/\.json|application\/json/i);
	});

	it('should allow selecting a file', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const validExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(validExport)], 'quest-entity-type.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		// Should show file name or indication that file was selected
		await waitFor(() => {
			expect(screen.getByText(/quest-entity-type\.json|selected/i)).toBeInTheDocument();
		});
	});
});

describe('EntityTypeImportModal - File Validation (Issue #210)', () => {
	it('should validate JSON format', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const invalidFile = new File(['not valid json{'], 'invalid.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [invalidFile] } });

		await waitFor(() => {
			expect(screen.getAllByText(/invalid.*json|parse.*error/i).length).toBeGreaterThan(0);
		});
	});

	it('should validate required fields', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const invalidExport = {
			version: '1.0.0'
			// Missing required fields
		};

		const file = new File([JSON.stringify(invalidExport)], 'invalid.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			expect(screen.getAllByText(/missing.*required|invalid.*format/i).length).toBeGreaterThan(0);
		});
	});

	it('should validate version format', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const oldVersionExport = {
			version: '0.5.0', // Old version
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.1.0' },
			type: 'entity-type',
			data: {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(oldVersionExport)], 'old-version.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			// Should show error about unsupported version
			expect(screen.getByText(/unsupported.*version|only.*version.*1\.0\.0/i)).toBeInTheDocument();
		});
	});

	it('should validate entity type structure', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const invalidEntityTypeExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				// Missing required fields like type, label, etc.
				icon: 'scroll'
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(invalidEntityTypeExport)], 'invalid-entity.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			// Should have validation errors (check for Import button being disabled as indicator)
			const importButton = screen.getByRole('button', { name: /^import$/i });
			expect(importButton).toBeDisabled();
		});
	});
});

describe('EntityTypeImportModal - Validation Display (Issue #210)', () => {
	it('should display validation errors in red', async () => {
		const { container } = render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const invalidFile = new File(['invalid json'], 'invalid.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [invalidFile] } });

		await waitFor(() => {
			// Check for red error container
			const errorContainer = container.querySelector('.bg-red-50, .dark\\:bg-red-900\\/10');
			expect(errorContainer).toBeInTheDocument();
		});
	});

	it('should display validation warnings in yellow/amber', async () => {
		const { container } = render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Create export with warnings (e.g., conflicting type that shows yellow warning)
		const conflictExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'existing_quest', // Conflicts with existing type
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(conflictExport)], 'conflict.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			// Check for yellow warning container
			const warningContainer = container.querySelector('.bg-yellow-50, .dark\\:bg-yellow-900\\/10');
			expect(warningContainer).toBeInTheDocument();
		});
	});

	it('should show multiple errors when present', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const multiErrorExport = {
			version: '999.0.0', // Invalid version
			// Missing other required fields
			type: 'entity-type'
		};

		const file = new File([JSON.stringify(multiErrorExport)], 'multi-error.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			const errors = screen.getAllByText(/error|invalid|missing|required/i);
			expect(errors.length).toBeGreaterThan(1);
		});
	});
});

describe('EntityTypeImportModal - Preview Display (Issue #210)', () => {
	it('should show preview when valid file is uploaded', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const validExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [
					{ key: 'objective', label: 'Objective', type: 'text', required: true, order: 0 }
				],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(validExport)], 'quest.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			expect(screen.getByText(/preview/i)).toBeInTheDocument();
			expect(screen.getByText('Quest')).toBeInTheDocument();
		});
	});

	it('should display entity type name in preview', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const validExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'spell',
				label: 'Spell',
				labelPlural: 'Spells',
				icon: 'wand',
				color: 'purple',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(validExport)], 'spell.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			expect(screen.getByText('Spell')).toBeInTheDocument();
		});
	});

	it('should display field count in preview', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const validExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [
					{ key: 'field1', label: 'Field 1', type: 'text', required: false, order: 0 },
					{ key: 'field2', label: 'Field 2', type: 'text', required: false, order: 1 },
					{ key: 'field3', label: 'Field 3', type: 'text', required: false, order: 2 }
				],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(validExport)], 'quest.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			expect(screen.getByText('Fields:')).toBeInTheDocument();
			expect(screen.getByText('3')).toBeInTheDocument();
		});
	});
});

describe('EntityTypeImportModal - Conflict Detection (Issue #210)', () => {
	it('should detect conflicts with existing entity types', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Import type with same key as existing type
		const conflictingExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'existing_quest', // Conflicts with mock store
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(conflictingExport)], 'conflict.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			expect(screen.getAllByText(/already exists/i).length).toBeGreaterThan(0);
		});
	});

	it('should show input for new type key when conflict detected', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const conflictingExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'existing_quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(conflictingExport)], 'conflict.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			expect(screen.getByLabelText(/new.*type key|rename/i)).toBeInTheDocument();
		});
	});

	it('should allow entering new type key for conflicted import', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const conflictingExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'existing_quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(conflictingExport)], 'conflict.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			const newTypeKeyInput = screen.getByLabelText(/new.*type key|rename/i);
			expect(newTypeKeyInput).toBeInTheDocument();
		});

		const newTypeKeyInput = screen.getByLabelText(/new.*type key|rename/i);
		await fireEvent.input(newTypeKeyInput, { target: { value: 'imported_quest' } });

		expect((newTypeKeyInput as HTMLInputElement).value).toBe('imported_quest');
	});
});

describe('EntityTypeImportModal - Import Action (Issue #210)', () => {
	it('should have Import button', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const importButton = screen.getByRole('button', { name: /^import$/i });
		expect(importButton).toBeInTheDocument();
	});

	it('should disable Import button when no file selected', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const importButton = screen.getByRole('button', { name: /^import$/i });
		expect(importButton).toBeDisabled();
	});

	it('should disable Import button when validation errors exist', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const invalidFile = new File(['invalid'], 'invalid.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [invalidFile] } });

		await waitFor(() => {
			const importButton = screen.getByRole('button', { name: /^import$/i });
			expect(importButton).toBeDisabled();
		});
	});

	it('should enable Import button when file is valid', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const validExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'new_quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(validExport)], 'quest.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			const importButton = screen.getByRole('button', { name: /^import$/i });
			expect(importButton).not.toBeDisabled();
		});
	});

	it('should call onimport with entity type data when Import is clicked', async () => {
		const onimport = vi.fn();
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport,
				oncancel: vi.fn()
			}
		});

		const validExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'new_quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [
					{ key: 'objective', label: 'Objective', type: 'text', required: true, order: 0 }
				],
				defaultRelationships: ['involves']
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(validExport)], 'quest.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			const importButton = screen.getByRole('button', { name: /^import$/i });
			expect(importButton).not.toBeDisabled();
		});

		const importButton = screen.getByRole('button', { name: /^import$/i });
		await fireEvent.click(importButton);

		expect(onimport).toHaveBeenCalledTimes(1);

		const importedEntityType: EntityTypeDefinition = onimport.mock.calls[0][0];
		expect(importedEntityType.type).toBe('new_quest');
		expect(importedEntityType.label).toBe('Quest');
		expect(importedEntityType.fieldDefinitions).toHaveLength(1);
	});

	it('should use new type key when conflict was resolved', async () => {
		const onimport = vi.fn();
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport,
				oncancel: vi.fn()
			}
		});

		const conflictingExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'existing_quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(conflictingExport)], 'conflict.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			const newTypeKeyInput = screen.getByLabelText(/new.*type key|rename/i);
			expect(newTypeKeyInput).toBeInTheDocument();
		});

		const newTypeKeyInput = screen.getByLabelText(/new.*type key|rename/i);
		await fireEvent.input(newTypeKeyInput, { target: { value: 'imported_quest' } });

		const importButton = screen.getByRole('button', { name: /^import$/i });
		await fireEvent.click(importButton);

		expect(onimport).toHaveBeenCalled();
		const importedEntityType: EntityTypeDefinition = onimport.mock.calls[0][0];
		expect(importedEntityType.type).toBe('imported_quest');
	});
});

describe('EntityTypeImportModal - Cancel Action (Issue #210)', () => {
	it('should have Cancel button', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
		expect(cancelButton).toBeInTheDocument();
	});

	it('should call oncancel when Cancel is clicked', async () => {
		const oncancel = vi.fn();
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
		await fireEvent.click(cancelButton);

		expect(oncancel).toHaveBeenCalledTimes(1);
	});

	it('should call oncancel when Escape key is pressed', async () => {
		const oncancel = vi.fn();
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel
			}
		});

		const dialog = screen.getByRole('dialog');
		await fireEvent.keyDown(dialog, { key: 'Escape' });

		expect(oncancel).toHaveBeenCalledTimes(1);
	});

	it('should not call onimport when Cancel is clicked', async () => {
		const onimport = vi.fn();
		const oncancel = vi.fn();
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport,
				oncancel
			}
		});

		const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
		await fireEvent.click(cancelButton);

		expect(onimport).not.toHaveBeenCalled();
	});
});

describe('EntityTypeImportModal - Accessibility (Issue #210)', () => {
	it('should have aria-modal attribute', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
	});

	it('should have aria-labelledby connecting title to dialog', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const dialog = screen.getByRole('dialog');
		const title = screen.getByText(/import.*entity type/i);

		const titleId = title.getAttribute('id');
		expect(titleId).toBeTruthy();
		expect(dialog).toHaveAttribute('aria-labelledby', titleId);
	});

	it('should have proper label for file input', () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		expect(fileInput).toBeInTheDocument();
	});

	it('should use aria-live for validation messages', async () => {
		const { container } = render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const invalidFile = new File(['invalid'], 'invalid.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [invalidFile] } });

		await waitFor(() => {
			const errorContainer = container.querySelector('[aria-live="polite"], [aria-live="assertive"]');
			expect(errorContainer).toBeInTheDocument();
		});
	});
});

describe('EntityTypeImportModal - Edge Cases (Issue #210)', () => {
	it('should handle empty file', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const emptyFile = new File([''], 'empty.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [emptyFile] } });

		await waitFor(() => {
			expect(screen.getAllByText(/invalid|empty|parse.*error/i).length).toBeGreaterThan(0);
		});
	});

	it('should handle very large file', async () => {
		render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		// Create a large but valid export
		const largeExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'large_type',
				label: 'Large Type',
				labelPlural: 'Large Types',
				icon: 'box',
				color: 'gray',
				isBuiltIn: false,
				fieldDefinitions: Array.from({ length: 100 }, (_, i) => ({
					key: `field${i}`,
					label: `Field ${i}`,
					type: 'text',
					required: false,
					order: i
				})),
				defaultRelationships: []
			},
			metadata: {}
		};

		const largeFile = new File([JSON.stringify(largeExport)], 'large.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [largeFile] } });

		await waitFor(() => {
			expect(screen.getByText('Fields:')).toBeInTheDocument();
			expect(screen.getByText('100')).toBeInTheDocument();
		});
	});

	it('should reset state when modal is closed and reopened', async () => {
		const { rerender } = render(EntityTypeImportModal, {
			props: {
				open: true,
				onimport: vi.fn(),
				oncancel: vi.fn()
			}
		});

		const validExport = {
			version: '1.0.0',
			exportedAt: new Date().toISOString(),
			generator: { name: 'Director Assist', version: '0.8.0' },
			type: 'entity-type',
			data: {
				type: 'quest',
				label: 'Quest',
				labelPlural: 'Quests',
				icon: 'scroll',
				color: 'yellow',
				isBuiltIn: false,
				fieldDefinitions: [],
				defaultRelationships: []
			},
			metadata: {}
		};

		const file = new File([JSON.stringify(validExport)], 'quest.json', {
			type: 'application/json'
		});

		const fileInput = screen.getByLabelText(/select.*file|choose.*file|upload/i);
		await fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			expect(screen.getByText('Quest')).toBeInTheDocument();
		});

		// Close modal
		rerender({ open: false, onimport: vi.fn(), oncancel: vi.fn() });

		// Reopen modal
		rerender({ open: true, onimport: vi.fn(), oncancel: vi.fn() });

		// Should not show previous file/preview
		expect(screen.queryByText('Quest')).not.toBeInTheDocument();
		const importButton = screen.getByRole('button', { name: /^import$/i });
		expect(importButton).toBeDisabled();
	});
});
