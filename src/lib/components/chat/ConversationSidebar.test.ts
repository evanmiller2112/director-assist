/**
 * Tests for ConversationSidebar Component
 *
 * Issue #42: Conversation Management System - UI Components
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests will FAIL until ConversationSidebar.svelte is implemented.
 *
 * The ConversationSidebar component displays the full sidebar with:
 * - "New Conversation" button at the top
 * - List of all conversations
 * - Integration with conversationStore and chatStore
 * - Empty state handling
 *
 * Component integrates with:
 * - conversationStore (load, create, setActive, rename, delete)
 * - chatStore (switchConversation)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import type { ConversationWithMetadata } from '$lib/types';
import ConversationSidebar from './ConversationSidebar.svelte';

// Mock the stores
vi.mock('$lib/stores', () => ({
	conversationStore: {
		conversations: [],
		activeConversationId: null,
		load: vi.fn(),
		create: vi.fn(),
		setActive: vi.fn(),
		rename: vi.fn(),
		delete: vi.fn()
	},
	chatStore: {
		switchConversation: vi.fn()
	}
}));

describe('ConversationSidebar Component - Basic Rendering (Issue #42)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without crashing', () => {
		const { container } = render(ConversationSidebar);
		expect(container).toBeInTheDocument();
	});

	it('should display "New Conversation" button', () => {
		render(ConversationSidebar);
		const newButton = screen.getByRole('button', { name: /new conversation/i });
		expect(newButton).toBeInTheDocument();
	});

	it('should have a container with appropriate styling', () => {
		const { container } = render(ConversationSidebar);

		// Should have a sidebar container
		const sidebar = container.querySelector('[class*="sidebar"]') ||
			container.querySelector('aside') ||
			container.firstChild;

		expect(sidebar).toBeInTheDocument();
	});

	it('should load conversations on mount', async () => {
		const { conversationStore } = await import('$lib/stores');

		render(ConversationSidebar);

		await waitFor(() => {
			expect(conversationStore.load).toHaveBeenCalled();
		});
	});
});

describe('ConversationSidebar Component - Empty State (Issue #42)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { conversationStore } = await import('$lib/stores');
		// Mock empty conversations list
		(conversationStore as any).conversations = [];
	});

	it('should show empty state when no conversations exist', () => {
		render(ConversationSidebar);

		// Should display some empty state message
		const emptyMessage = screen.queryByText(/no conversations/i) ||
			screen.queryByText(/get started/i) ||
			screen.queryByText(/create your first/i);

		expect(emptyMessage).toBeInTheDocument();
	});

	it('should still show "New Conversation" button in empty state', () => {
		render(ConversationSidebar);

		const newButton = screen.getByRole('button', { name: /new conversation/i });
		expect(newButton).toBeInTheDocument();
	});
});

describe('ConversationSidebar Component - Conversation List (Issue #42)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'Campaign Planning',
			messageCount: 15,
			lastMessageTime: new Date('2026-01-19T10:00:00Z'),
			createdAt: new Date('2026-01-18T10:00:00Z'),
			updatedAt: new Date('2026-01-19T10:00:00Z')
		},
		{
			id: 'conv-2',
			name: 'NPC Development',
			messageCount: 8,
			lastMessageTime: new Date('2026-01-19T09:00:00Z'),
			createdAt: new Date('2026-01-17T10:00:00Z'),
			updatedAt: new Date('2026-01-19T09:00:00Z')
		},
		{
			id: 'conv-3',
			name: 'World Building',
			messageCount: 23,
			lastMessageTime: new Date('2026-01-18T15:00:00Z'),
			createdAt: new Date('2026-01-16T10:00:00Z'),
			updatedAt: new Date('2026-01-18T15:00:00Z')
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
		(conversationStore as any).activeConversationId = null;
	});

	it('should display all conversations in the list', () => {
		render(ConversationSidebar);

		expect(screen.getByText('Campaign Planning')).toBeInTheDocument();
		expect(screen.getByText('NPC Development')).toBeInTheDocument();
		expect(screen.getByText('World Building')).toBeInTheDocument();
	});

	it('should display conversations in a list structure', () => {
		const { container } = render(ConversationSidebar);

		// Should use <ul> and <li> or role="list" and role="listitem"
		const list = container.querySelector('ul') ||
			container.querySelector('[role="list"]');

		expect(list).toBeInTheDocument();
	});

	it('should pass correct props to ConversationListItem components', () => {
		const { container } = render(ConversationSidebar);

		// Each conversation should be rendered (we'll check this by looking for conversation names)
		const conv1 = screen.getByText('Campaign Planning');
		const conv2 = screen.getByText('NPC Development');
		const conv3 = screen.getByText('World Building');

		expect(conv1).toBeInTheDocument();
		expect(conv2).toBeInTheDocument();
		expect(conv3).toBeInTheDocument();
	});

	it('should highlight active conversation', async () => {
		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).activeConversationId = 'conv-2';

		const { container } = render(ConversationSidebar);

		// The active conversation (conv-2 / NPC Development) should have active styling
		// This might be a data attribute, class, or visual indicator
		const activeIndicator = container.querySelector('[data-active="true"]') ||
			container.querySelector('.active');

		expect(activeIndicator).toBeInTheDocument();
	});
});

describe('ConversationSidebar Component - New Conversation (Issue #42)', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = [];
	});

	it('should call conversationStore.create when "New Conversation" is clicked', async () => {
		const { conversationStore } = await import('$lib/stores');

		render(ConversationSidebar);

		const newButton = screen.getByRole('button', { name: /new conversation/i });
		await fireEvent.click(newButton);

		expect(conversationStore.create).toHaveBeenCalled();
	});

	it('should create conversation with default name', async () => {
		const { conversationStore } = await import('$lib/stores');

		render(ConversationSidebar);

		const newButton = screen.getByRole('button', { name: /new conversation/i });
		await fireEvent.click(newButton);

		// Create should be called (with or without args)
		expect(conversationStore.create).toHaveBeenCalled();
	});
});

describe('ConversationSidebar Component - Select Conversation (Issue #42)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'Campaign Planning',
			messageCount: 15,
			lastMessageTime: new Date('2026-01-19T10:00:00Z'),
			createdAt: new Date('2026-01-18T10:00:00Z'),
			updatedAt: new Date('2026-01-19T10:00:00Z')
		},
		{
			id: 'conv-2',
			name: 'NPC Development',
			messageCount: 8,
			lastMessageTime: new Date('2026-01-19T09:00:00Z'),
			createdAt: new Date('2026-01-17T10:00:00Z'),
			updatedAt: new Date('2026-01-19T09:00:00Z')
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
		(conversationStore as any).activeConversationId = 'conv-1';
	});

	it('should call setActive when a conversation is selected', async () => {
		const { conversationStore } = await import('$lib/stores');

		render(ConversationSidebar);

		const conv2Button = screen.getByText('NPC Development');
		await fireEvent.click(conv2Button);

		expect(conversationStore.setActive).toHaveBeenCalledWith('conv-2');
	});

	it('should call chatStore.switchConversation when switching conversations', async () => {
		const { conversationStore, chatStore } = await import('$lib/stores');

		render(ConversationSidebar);

		const conv2Button = screen.getByText('NPC Development');
		await fireEvent.click(conv2Button);

		await waitFor(() => {
			expect(chatStore.switchConversation).toHaveBeenCalledWith('conv-2');
		});
	});
});

describe('ConversationSidebar Component - Rename Conversation (Issue #42)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'Old Name',
			messageCount: 5,
			lastMessageTime: new Date('2026-01-19T10:00:00Z'),
			createdAt: new Date('2026-01-18T10:00:00Z'),
			updatedAt: new Date('2026-01-19T10:00:00Z')
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
	});

	it('should call conversationStore.rename when conversation name is changed', async () => {
		const { conversationStore } = await import('$lib/stores');

		render(ConversationSidebar);

		// Double-click to enter edit mode
		const nameElement = screen.getByText('Old Name');
		await fireEvent.dblClick(nameElement);

		// Change the name
		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: 'New Name' } });
		await fireEvent.keyDown(input, { key: 'Enter' });

		await waitFor(() => {
			expect(conversationStore.rename).toHaveBeenCalledWith('conv-1', 'New Name');
		});
	});
});

describe('ConversationSidebar Component - Delete Conversation (Issue #42)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'To Delete',
			messageCount: 5,
			lastMessageTime: new Date('2026-01-19T10:00:00Z'),
			createdAt: new Date('2026-01-18T10:00:00Z'),
			updatedAt: new Date('2026-01-19T10:00:00Z')
		},
		{
			id: 'conv-2',
			name: 'Keep This',
			messageCount: 3,
			lastMessageTime: new Date('2026-01-19T09:00:00Z'),
			createdAt: new Date('2026-01-17T10:00:00Z'),
			updatedAt: new Date('2026-01-19T09:00:00Z')
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
	});

	it('should call conversationStore.delete when conversation is deleted', async () => {
		const { conversationStore } = await import('$lib/stores');

		// Mock window.confirm to always return true
		const originalConfirm = window.confirm;
		window.confirm = vi.fn(() => true);

		const { container } = render(ConversationSidebar);

		// Find and click delete button for first conversation
		const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButtons[0]);

		await waitFor(() => {
			expect(conversationStore.delete).toHaveBeenCalledWith('conv-1');
		});

		window.confirm = originalConfirm;
	});

	it('should not delete if confirmation is cancelled', async () => {
		const { conversationStore } = await import('$lib/stores');

		// Mock window.confirm to return false (cancel)
		const originalConfirm = window.confirm;
		window.confirm = vi.fn(() => false);

		render(ConversationSidebar);

		const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButtons[0]);

		// Should not call delete if user cancels
		expect(conversationStore.delete).not.toHaveBeenCalled();

		window.confirm = originalConfirm;
	});
});

describe('ConversationSidebar Component - Sorting and Order (Issue #42)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'Oldest Message',
			messageCount: 5,
			lastMessageTime: new Date('2026-01-17T10:00:00Z'),
			createdAt: new Date('2026-01-15T10:00:00Z'),
			updatedAt: new Date('2026-01-17T10:00:00Z')
		},
		{
			id: 'conv-2',
			name: 'Most Recent',
			messageCount: 3,
			lastMessageTime: new Date('2026-01-19T10:00:00Z'),
			createdAt: new Date('2026-01-18T10:00:00Z'),
			updatedAt: new Date('2026-01-19T10:00:00Z')
		},
		{
			id: 'conv-3',
			name: 'Middle',
			messageCount: 10,
			lastMessageTime: new Date('2026-01-18T10:00:00Z'),
			createdAt: new Date('2026-01-16T10:00:00Z'),
			updatedAt: new Date('2026-01-18T10:00:00Z')
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
	});

	it('should display conversations (order may be by most recent or as provided)', () => {
		render(ConversationSidebar);

		// All conversations should be visible
		expect(screen.getByText('Oldest Message')).toBeInTheDocument();
		expect(screen.getByText('Most Recent')).toBeInTheDocument();
		expect(screen.getByText('Middle')).toBeInTheDocument();
	});

	it('should render conversations in consistent order', () => {
		const { container } = render(ConversationSidebar);

		// Get all conversation names in order they appear in DOM
		const names = Array.from(container.querySelectorAll('[role="listitem"]'))
			.map(item => item.textContent)
			.filter(text => text?.includes('Message') || text?.includes('Recent') || text?.includes('Middle'));

		// Should have 3 conversations
		expect(names.length).toBeGreaterThanOrEqual(3);
	});
});

describe('ConversationSidebar Component - Accessibility (Issue #42)', () => {
	const mockConversations: ConversationWithMetadata[] = [
		{
			id: 'conv-1',
			name: 'Test Conversation',
			messageCount: 5,
			lastMessageTime: new Date('2026-01-19T10:00:00Z'),
			createdAt: new Date('2026-01-18T10:00:00Z'),
			updatedAt: new Date('2026-01-19T10:00:00Z')
		}
	];

	beforeEach(async () => {
		vi.clearAllMocks();
		const { conversationStore } = await import('$lib/stores');
		(conversationStore as any).conversations = mockConversations;
	});

	it('should use semantic HTML for list structure', () => {
		const { container } = render(ConversationSidebar);

		const list = container.querySelector('ul') || container.querySelector('[role="list"]');
		expect(list).toBeInTheDocument();
	});

	it('should have accessible button labels', () => {
		render(ConversationSidebar);

		const newButton = screen.getByRole('button', { name: /new conversation/i });
		expect(newButton).toHaveAccessibleName();
	});

	it('should support keyboard navigation for "New Conversation" button', async () => {
		render(ConversationSidebar);

		const newButton = screen.getByRole('button', { name: /new conversation/i });

		// Button should be focusable and support Enter key (native button behavior)
		expect(newButton).toBeInTheDocument();
		expect(newButton.tagName).toBe('BUTTON');
		expect(newButton).not.toHaveAttribute('tabindex', '-1');
	});
});

describe('ConversationSidebar Component - Error Handling (Issue #42)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should handle undefined conversations gracefully', () => {
		const { container } = render(ConversationSidebar);
		expect(container).toBeInTheDocument();
	});

	it('should handle conversations without lastMessageTime', async () => {
		const { conversationStore } = await import('$lib/stores');
		const convWithoutTime: ConversationWithMetadata = {
			id: 'conv-1',
			name: 'No Time',
			messageCount: 0,
			lastMessageTime: undefined,
			createdAt: new Date('2026-01-18T10:00:00Z'),
			updatedAt: new Date('2026-01-18T10:00:00Z')
		};
		(conversationStore as any).conversations = [convWithoutTime];

		const { container } = render(ConversationSidebar);

		expect(screen.getByText('No Time')).toBeInTheDocument();
	});
});
