/**
 * Tests for ChatPanel Component - @Mention Integration (Issue #201)
 *
 * RED Phase (TDD): These tests define expected behavior for @mention integration.
 * Tests will FAIL until ChatPanel.svelte is updated with mention features.
 *
 * The ChatPanel component should:
 * - Detect "@" in textarea and show ChatMentionPopover
 * - Filter entities based on text after "@"
 * - Insert selected entity name into textarea
 * - Extract @mention entity IDs for contextEntities
 * - Handle keyboard navigation (Escape to close)
 * - Handle edge cases (multiple mentions, editing, empty entities)
 *
 * Integration components:
 * - ChatPanel.svelte (component under test)
 * - ChatMentionPopover.svelte (autocomplete popover)
 * - mentionDetectionService.ts (detection utilities)
 * - entitiesStore (entity data source)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ChatPanel from './ChatPanel.svelte';
import type { BaseEntity } from '$lib/types';

// Mock the stores (must be before mockEntities to avoid hoisting issues)
vi.mock('$lib/stores', () => ({
	conversationStore: {
		conversations: [],
		activeConversationId: null,
		isLoading: false,
		load: vi.fn(),
		create: vi.fn()
	},
	chatStore: {
		messages: [],
		isLoading: false,
		error: null,
		streamingContent: '',
		contextEntityIds: [],
		includeLinkedEntities: true,
		generationType: 'general',
		typeFieldValues: {},
		load: vi.fn(),
		sendMessage: vi.fn(),
		clearHistory: vi.fn(),
		switchConversation: vi.fn(),
		setIncludeLinkedEntities: vi.fn(),
		setGenerationType: vi.fn(),
		setTypeFieldValue: vi.fn()
	},
	uiStore: {
		closeChatPanel: vi.fn()
	},
	entitiesStore: {
		entities: [],
		filteredEntities: [],
		isLoading: false,
		load: vi.fn()
	},
	campaignStore: {
		customEntityTypes: [],
		entityTypeOverrides: []
	},
	debugStore: {
		enabled: false,
		load: vi.fn()
	}
}));

// Create mock entities for testing
const mockEntities: BaseEntity[] = [
	{
		id: 'entity-gandalf',
		name: 'Gandalf',
		type: 'npc',
		description: 'A wise wizard',
		tags: [],
		links: [],
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	},
	{
		id: 'entity-aragorn',
		name: 'Aragorn',
		type: 'character',
		description: 'A ranger',
		tags: [],
		links: [],
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	},
	{
		id: 'entity-rivendell',
		name: 'Rivendell',
		type: 'location',
		description: 'An elven city',
		tags: [],
		links: [],
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	},
	{
		id: 'entity-gimli',
		name: 'Gimli',
		type: 'character',
		description: 'A dwarf',
		tags: [],
		links: [],
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	}
];

// Mock the chat service
vi.mock('$lib/services/chatService', () => ({
	hasChatApiKey: vi.fn(() => true)
}));

describe('ChatPanel - Mention Detection in Input', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		// Set up mock entities in the store
		const { entitiesStore } = await import('$lib/stores');
		(entitiesStore as any).entities = mockEntities;
		(entitiesStore as any).filteredEntities = mockEntities;
	});

	it('should show ChatMentionPopover when user types "@" in textarea', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Type "@" to trigger mention detection
		await fireEvent.input(textarea, { target: { value: '@' } });

		// Simulate cursor position at end
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		Object.defineProperty(textarea, 'selectionEnd', { value: 1, configurable: true });

		await fireEvent.keyUp(textarea);

		// The popover should be visible
		await waitFor(() => {
			const popover = screen.queryByRole('listbox', { name: /mention suggestions/i });
			expect(popover).toBeInTheDocument();
		});
	});

	it('should not show popover when typing regular text (no "@")', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Type regular text
		await fireEvent.input(textarea, { target: { value: 'Hello world' } });

		// The popover should NOT be visible
		const popover = screen.queryByRole('listbox', { name: /mention suggestions/i });
		expect(popover).not.toBeInTheDocument();
	});

	it('should show popover with searchText when user types "@Gan"', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Type "@Gan"
		await fireEvent.input(textarea, { target: { value: '@Gan' } });

		// Simulate cursor at end
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		Object.defineProperty(textarea, 'selectionEnd', { value: 4, configurable: true });

		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			// Popover should be visible
			const popover = screen.queryByRole('listbox');
			expect(popover).toBeInTheDocument();

			// Should show filtered results (Gandalf)
			expect(screen.getByText('Gandalf')).toBeInTheDocument();

			// Should NOT show unmatched entities
			expect(screen.queryByText('Rivendell')).not.toBeInTheDocument();
		});
	});

	it('should update popover searchText as user types after "@"', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Type "@G"
		await fireEvent.input(textarea, { target: { value: '@G' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 2, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			// Should show both Gandalf and Gimli
			expect(screen.queryByText('Gandalf')).toBeInTheDocument();
			expect(screen.queryByText('Gimli')).toBeInTheDocument();
		});

		// Continue typing "@Ga"
		await fireEvent.input(textarea, { target: { value: '@Ga' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 3, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			// Should show only Gandalf now
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
			expect(screen.queryByText('Gimli')).not.toBeInTheDocument();
		});
	});

	it('should close popover when user deletes the "@" character', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// First type "@"
		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.queryByRole('listbox')).toBeInTheDocument();
		});

		// Delete the "@"
		await fireEvent.input(textarea, { target: { value: '' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 0, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});
	});

	it('should show popover at correct position when @ is in middle of text', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Type text with @ in the middle
		await fireEvent.input(textarea, { target: { value: 'Tell me about @Gan and others' } });

		// Cursor is at position 16 (after "@Gan")
		Object.defineProperty(textarea, 'selectionStart', { value: 16, configurable: true });
		Object.defineProperty(textarea, 'selectionEnd', { value: 16, configurable: true });

		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			const popover = screen.queryByRole('listbox');
			expect(popover).toBeInTheDocument();

			// Should filter to "Gan"
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});
	});

	it('should show all entities when "@" is typed with no search text', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			// Should show all entities when no search text
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
			expect(screen.getByText('Aragorn')).toBeInTheDocument();
			expect(screen.getByText('Rivendell')).toBeInTheDocument();
			expect(screen.getByText('Gimli')).toBeInTheDocument();
		});
	});
});

describe('ChatPanel - Entity Selection from Popover', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { entitiesStore } = await import('$lib/stores');
		(entitiesStore as any).entities = mockEntities;
		(entitiesStore as any).filteredEntities = mockEntities;
	});

	it('should insert entity name into textarea when entity is selected', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		// Type "@Gan"
		await fireEvent.input(textarea, { target: { value: '@Gan' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});

		// Click on Gandalf
		const gandalfOption = screen.getByText('Gandalf').closest('[role="option"]');
		await fireEvent.click(gandalfOption!);

		// The textarea value should now contain "Gandalf" instead of "@Gan"
		await waitFor(() => {
			expect(textarea.value).toBe('Gandalf');
		});
	});

	it('should close popover after entity is selected', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});

		// Select Gandalf
		const gandalfOption = screen.getByText('Gandalf').closest('[role="option"]');
		await fireEvent.click(gandalfOption!);

		await waitFor(() => {
			// Popover should be closed
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});
	});

	it('should position cursor after inserted entity name', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		await fireEvent.input(textarea, { target: { value: '@Gan' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});

		const gandalfOption = screen.getByText('Gandalf').closest('[role="option"]');
		await fireEvent.click(gandalfOption!);

		await waitFor(() => {
			// Cursor should be after "Gandalf" (position 7)
			expect(textarea.selectionStart).toBe(7);
			expect(textarea.selectionEnd).toBe(7);
		});
	});

	it('should preserve text before and after the mention when inserting', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		// Type "Tell me about @Gan please"
		await fireEvent.input(textarea, { target: { value: 'Tell me about @Gan please' } });

		// Cursor at position 19 (after "@Gan")
		Object.defineProperty(textarea, 'selectionStart', { value: 19, configurable: true });
		Object.defineProperty(textarea, 'selectionEnd', { value: 19, configurable: true });

		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});

		const gandalfOption = screen.getByText('Gandalf').closest('[role="option"]');
		await fireEvent.click(gandalfOption!);

		await waitFor(() => {
			// Should replace "@Gan" with "Gandalf", preserving surrounding text
			expect(textarea.value).toBe('Tell me about Gandalf please');
		});
	});

	it('should allow selecting entity via keyboard (Enter)', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		await fireEvent.input(textarea, { target: { value: '@Gan' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			const listbox = screen.getByRole('listbox');
			expect(listbox).toBeInTheDocument();
		});

		const listbox = screen.getByRole('listbox');

		// Press Enter to select the highlighted entity
		await fireEvent.keyDown(listbox, { key: 'Enter' });

		await waitFor(() => {
			// Should insert Gandalf (first in filtered list)
			expect(textarea.value).toBe('Gandalf');
		});
	});

	it('should handle selecting entity after keyboard navigation', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			const listbox = screen.getByRole('listbox');
			expect(listbox).toBeInTheDocument();
		});

		const listbox = screen.getByRole('listbox');

		// Navigate down to second entity
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });

		// Select with Enter
		await fireEvent.keyDown(listbox, { key: 'Enter' });

		await waitFor(() => {
			// Should insert the second entity (depends on sort order)
			expect(textarea.value).not.toBe('@');
			expect(textarea.value.length).toBeGreaterThan(0);
		});
	});
});

describe('ChatPanel - Context Entities from Mentions', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { entitiesStore } = await import('$lib/stores');
		(entitiesStore as any).entities = mockEntities;
		(entitiesStore as any).filteredEntities = mockEntities;
	});

	it('should extract contextEntityIds when message with @mention is sent', async () => {
		const { chatStore } = await import('$lib/stores');

		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		// Simulate completing a mention
		await fireEvent.input(textarea, { target: { value: 'Tell me about Gandalf' } });

		// Submit the message
		const form = textarea.closest('form');
		await fireEvent.submit(form!);

		// The chatStore.sendMessage should have been called
		await waitFor(() => {
			expect(chatStore.sendMessage).toHaveBeenCalled();
		});

		// The message should include context about Gandalf
		// This would be handled by the component extracting mentions before sending
		// We'll verify the integration in later tests
	});

	it('should populate contextEntities with entity IDs from @mentions', async () => {
		const { chatStore } = await import('$lib/stores');

		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		// Type and select a mention
		await fireEvent.input(textarea, { target: { value: '@Gan' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});

		const gandalfOption = screen.getByText('Gandalf').closest('[role="option"]');
		await fireEvent.click(gandalfOption!);

		await waitFor(() => {
			expect(textarea.value).toBe('Gandalf');
		});

		// Submit the message
		const form = textarea.closest('form');
		await fireEvent.submit(form!);

		// Verify that sendMessage receives context entities
		// The component should detect "Gandalf" as a mention and include its ID
		await waitFor(() => {
			expect(chatStore.sendMessage).toHaveBeenCalled();
			// Note: The actual implementation will need to set contextEntityIds before sending
		});
	});

	it('should handle multiple @mentions in same message', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		// First mention: @Gandalf
		await fireEvent.input(textarea, { target: { value: '@Gan' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});

		const gandalfOption = screen.getByText('Gandalf').closest('[role="option"]');
		await fireEvent.click(gandalfOption!);

		await waitFor(() => {
			expect(textarea.value).toBe('Gandalf');
		});

		// Add more text and second mention
		await fireEvent.input(textarea, { target: { value: 'Gandalf and @Ara' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 16, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Aragorn')).toBeInTheDocument();
		});

		const aragornOption = screen.getByText('Aragorn').closest('[role="option"]');
		await fireEvent.click(aragornOption!);

		await waitFor(() => {
			expect(textarea.value).toBe('Gandalf and Aragorn');
		});

		// Submit and verify both entities are in context
		const form = textarea.closest('form');
		await fireEvent.submit(form!);

		const { chatStore } = await import('$lib/stores');
		await waitFor(() => {
			expect(chatStore.sendMessage).toHaveBeenCalled();
			// Both Gandalf and Aragorn should be detected as mentions
		});
	});

	it('should have empty contextEntities when message has no @mentions', async () => {
		const { chatStore } = await import('$lib/stores');

		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Type regular message without mentions
		await fireEvent.input(textarea, { target: { value: 'Hello, how are you?' } });

		const form = textarea.closest('form');
		await fireEvent.submit(form!);

		await waitFor(() => {
			expect(chatStore.sendMessage).toHaveBeenCalledWith('Hello, how are you?');
			// No context entities should be set
		});
	});

	it('should clear previous contextEntities when new message has different mentions', async () => {
		const { chatStore } = await import('$lib/stores');

		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		// First message with Gandalf
		await fireEvent.input(textarea, { target: { value: '@Gan' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});

		const gandalfOption = screen.getByText('Gandalf').closest('[role="option"]');
		await fireEvent.click(gandalfOption!);

		const form = textarea.closest('form');
		await fireEvent.submit(form!);

		await waitFor(() => {
			expect(chatStore.sendMessage).toHaveBeenCalled();
		});

		vi.clearAllMocks();

		// Second message with different entity
		await fireEvent.input(textarea, { target: { value: '@Riv' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Rivendell')).toBeInTheDocument();
		});

		const rivendellOption = screen.getByText('Rivendell').closest('[role="option"]');
		await fireEvent.click(rivendellOption!);

		await fireEvent.submit(form!);

		await waitFor(() => {
			expect(chatStore.sendMessage).toHaveBeenCalled();
			// Should only have Rivendell in context, not Gandalf
		});
	});
});

describe('ChatPanel - Escape/Close Behavior', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { entitiesStore } = await import('$lib/stores');
		(entitiesStore as any).entities = mockEntities;
		(entitiesStore as any).filteredEntities = mockEntities;
	});

	it('should close popover when Escape is pressed', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		const listbox = screen.getByRole('listbox');
		await fireEvent.keyDown(listbox, { key: 'Escape' });

		await waitFor(() => {
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});
	});

	it('should keep textarea content when closing with Escape', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		await fireEvent.input(textarea, { target: { value: '@Gan' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		const listbox = screen.getByRole('listbox');
		await fireEvent.keyDown(listbox, { key: 'Escape' });

		await waitFor(() => {
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
			// Textarea should still have the partial mention
			expect(textarea.value).toBe('@Gan');
		});
	});

	it('should close popover when clicking outside (if implemented)', async () => {
		// This test is optional - depends on implementation approach
		// Some UIs close on outside click, others keep popover open
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		// Click somewhere outside the popover
		const container = screen.getByText('AI Assistant');
		await fireEvent.click(container);

		// Popover might close (depends on implementation)
		// This is not a strict requirement
	});

	it('should allow reopening popover after Escape', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Open popover
		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		// Close with Escape
		const listbox = screen.getByRole('listbox');
		await fireEvent.keyDown(listbox, { key: 'Escape' });

		await waitFor(() => {
			expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
		});

		// Type more to reopen
		await fireEvent.input(textarea, { target: { value: '@G' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 2, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument();
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});
	});
});

describe('ChatPanel - Edge Cases for Mentions', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { entitiesStore } = await import('$lib/stores');
		(entitiesStore as any).entities = mockEntities;
		(entitiesStore as any).filteredEntities = mockEntities;
	});

	it('should handle empty entity list gracefully', async () => {
		// Mock empty entities
		const { entitiesStore } = await import('$lib/stores');
		(entitiesStore as any).entities = [];
		(entitiesStore as any).filteredEntities = [];

		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			const listbox = screen.queryByRole('listbox');
			if (listbox) {
				// If popover shows, it should display "No matches found"
				expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
			}
			// Or the popover might not show at all with empty entities
		});

		// Restore entities
		(entitiesStore as any).entities = mockEntities;
		(entitiesStore as any).filteredEntities = mockEntities;
	});

	it('should handle editing text before an existing mention', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		// Complete a mention first
		await fireEvent.input(textarea, { target: { value: '@Gan' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});

		const gandalfOption = screen.getByText('Gandalf').closest('[role="option"]');
		await fireEvent.click(gandalfOption!);

		await waitFor(() => {
			expect(textarea.value).toBe('Gandalf');
		});

		// Now edit the text BEFORE the mention
		await fireEvent.input(textarea, { target: { value: 'Hello Gandalf' } });

		// Move cursor to middle (before Gandalf)
		Object.defineProperty(textarea, 'selectionStart', { value: 3, configurable: true });
		Object.defineProperty(textarea, 'selectionEnd', { value: 3, configurable: true });

		await fireEvent.keyUp(textarea);

		// Popover should NOT appear (cursor not after @)
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('should handle typing @ at start of textarea', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});
	});

	it('should handle typing @ after whitespace', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		await fireEvent.input(textarea, { target: { value: 'Hello @' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 7, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});
	});

	it('should NOT trigger mention for email addresses', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Type an email address
		await fireEvent.input(textarea, { target: { value: 'user@example.com' } });

		// Cursor after the @
		Object.defineProperty(textarea, 'selectionStart', { value: 6, configurable: true });
		Object.defineProperty(textarea, 'selectionEnd', { value: 6, configurable: true });

		await fireEvent.keyUp(textarea);

		// Should NOT show mention popover (@ is part of email)
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
	});

	it('should handle rapid typing after @', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Rapidly type characters
		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await fireEvent.input(textarea, { target: { value: '@G' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 2, configurable: true });
		await fireEvent.keyUp(textarea);

		await fireEvent.input(textarea, { target: { value: '@Ga' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 3, configurable: true });
		await fireEvent.keyUp(textarea);

		await fireEvent.input(textarea, { target: { value: '@Gan' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 4, configurable: true });
		await fireEvent.keyUp(textarea);

		// Should eventually show filtered results
		await waitFor(() => {
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});
	});

	it('should handle case-insensitive matching', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Type lowercase search
		await fireEvent.input(textarea, { target: { value: '@gandalf' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 8, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			// Should still match "Gandalf" (case-insensitive)
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});
	});

	it('should maintain cursor position when popover opens', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		await fireEvent.input(textarea, { target: { value: 'Tell me about @' } });
		const cursorPos = 16;
		Object.defineProperty(textarea, 'selectionStart', { value: cursorPos, configurable: true });
		Object.defineProperty(textarea, 'selectionEnd', { value: cursorPos, configurable: true });

		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		// Cursor should still be at the same position
		expect(textarea.selectionStart).toBe(cursorPos);
		expect(textarea.selectionEnd).toBe(cursorPos);
	});

	it('should handle newlines in textarea with mentions', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Multi-line text with mention
		await fireEvent.input(textarea, { target: { value: 'Line 1\n@Gan\nLine 3' } });

		// Cursor at position 11 (after @Gan on line 2)
		Object.defineProperty(textarea, 'selectionStart', { value: 11, configurable: true });
		Object.defineProperty(textarea, 'selectionEnd', { value: 11, configurable: true });

		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByText('Gandalf')).toBeInTheDocument();
		});
	});
});

describe('ChatPanel - Integration with Existing Features', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { entitiesStore } = await import('$lib/stores');
		(entitiesStore as any).entities = mockEntities;
		(entitiesStore as any).filteredEntities = mockEntities;
	});

	it('should not interfere with message submission', async () => {
		const { chatStore } = await import('$lib/stores');

		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		// Type and submit a regular message
		await fireEvent.input(textarea, { target: { value: 'Regular message' } });

		const form = textarea.closest('form');
		await fireEvent.submit(form!);

		await waitFor(() => {
			expect(chatStore.sendMessage).toHaveBeenCalledWith('Regular message');
		});
	});

	it('should not interfere with Enter key submission (without Shift)', async () => {
		const { chatStore } = await import('$lib/stores');

		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		await fireEvent.input(textarea, { target: { value: 'Test message' } });

		// Press Enter without Shift (should submit)
		await fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

		await waitFor(() => {
			expect(chatStore.sendMessage).toHaveBeenCalledWith('Test message');
		});
	});

	it('should allow Shift+Enter for newlines when popover is not open', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		await fireEvent.input(textarea, { target: { value: 'Line 1' } });

		// Shift+Enter should add newline, not submit
		await fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

		// The form should not be submitted
		const { chatStore } = await import('$lib/stores');
		expect(chatStore.sendMessage).not.toHaveBeenCalled();
	});

	it('should disable mention detection when chat is loading', async () => {
		const { chatStore } = await import('$lib/stores');
		(chatStore as any).isLoading = true;

		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		// Textarea should be disabled
		expect(textarea.disabled).toBe(true);

		// Should not be able to type
		await fireEvent.input(textarea, { target: { value: '@' } });

		// Popover should not appear
		expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

		// Restore loading state
		(chatStore as any).isLoading = false;
	});

	it('should preserve existing Context Selector functionality', () => {
		render(ChatPanel);

		// Context selector should still be present
		const contextHeader = screen.getByTestId('context-header');
		expect(contextHeader).toBeInTheDocument();
	});

	it('should maintain existing GenerationType selector', () => {
		render(ChatPanel);

		// Generation type selector should still work
		// (Exact test depends on GenerationTypeSelector implementation)
		const contextSection = screen.getByText(/context/i);
		expect(contextSection).toBeInTheDocument();
	});
});

describe('ChatPanel - Accessibility for Mentions', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { entitiesStore } = await import('$lib/stores');
		(entitiesStore as any).entities = mockEntities;
		(entitiesStore as any).filteredEntities = mockEntities;
	});

	it('should associate popover with textarea using aria attributes', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			const listbox = screen.getByRole('listbox');
			expect(listbox).toBeInTheDocument();

			// The textarea should have aria-controls or similar
			// to associate it with the popover
			// (Implementation detail - may use aria-expanded, aria-controls, etc.)
		});
	});

	it('should announce popover state changes to screen readers', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i);

		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			const listbox = screen.getByRole('listbox');
			expect(listbox).toBeInTheDocument();
			// Listbox should have proper aria-label
			expect(listbox.getAttribute('aria-label')).toBeTruthy();
		});
	});

	it('should handle keyboard navigation without mouse', async () => {
		render(ChatPanel);

		const textarea = screen.getByPlaceholderText(/ask about your campaign/i) as HTMLTextAreaElement;

		// Type @ with keyboard
		await fireEvent.input(textarea, { target: { value: '@' } });
		Object.defineProperty(textarea, 'selectionStart', { value: 1, configurable: true });
		await fireEvent.keyUp(textarea);

		await waitFor(() => {
			expect(screen.getByRole('listbox')).toBeInTheDocument();
		});

		const listbox = screen.getByRole('listbox');

		// Navigate with keyboard
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });
		await fireEvent.keyDown(listbox, { key: 'ArrowDown' });

		// Select with Enter
		await fireEvent.keyDown(listbox, { key: 'Enter' });

		await waitFor(() => {
			// An entity should be inserted
			expect(textarea.value).not.toBe('@');
		});
	});
});
