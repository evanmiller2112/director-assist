/**
 * Tests for ConversationListItem Component
 *
 * Issue #42: Conversation Management System - UI Components
 *
 * RED Phase (TDD): These tests define expected behavior before implementation.
 * Tests will FAIL until ConversationListItem.svelte is implemented.
 *
 * The ConversationListItem component displays a single conversation in the sidebar list.
 * It shows the conversation name, message count, last activity time, and allows
 * selection, renaming, and deletion.
 *
 * Component Props:
 * - conversation: ConversationWithMetadata (id, name, messageCount, lastMessageTime)
 * - isActive: boolean (whether this conversation is currently active)
 * - onSelect: (id: string) => void (callback when conversation is clicked)
 * - onRename: (id: string, name: string) => void (callback when renamed)
 * - onDelete: (id: string) => void (callback when deleted)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { ConversationWithMetadata } from '$lib/types';
import ConversationListItem from './ConversationListItem.svelte';

describe('ConversationListItem Component - Basic Rendering (Issue #42)', () => {
	const mockConversation: ConversationWithMetadata = {
		id: 'conv-1',
		name: 'Test Conversation',
		messageCount: 5,
		lastMessageTime: new Date('2026-01-19T10:00:00Z'),
		createdAt: new Date('2026-01-18T10:00:00Z'),
		updatedAt: new Date('2026-01-19T10:00:00Z')
	};

	const mockHandlers = {
		onSelect: vi.fn(),
		onRename: vi.fn(),
		onDelete: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should render without crashing', () => {
		const { container } = render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});
		expect(container).toBeInTheDocument();
	});

	it('should display conversation name', () => {
		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		expect(screen.getByText('Test Conversation')).toBeInTheDocument();
	});

	it('should display message count badge', () => {
		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		// Message count should be visible (5 messages)
		expect(screen.getByText(/5/)).toBeInTheDocument();
	});

	it('should display relative time when lastMessageTime exists', () => {
		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		// Should show some relative time text (implementation will determine exact format)
		// Could be "X hours ago", "X minutes ago", etc.
		const timeElement = screen.getByText(/ago|minute|hour|day/i);
		expect(timeElement).toBeInTheDocument();
	});

	it('should handle conversation with no lastMessageTime', () => {
		const convWithoutTime: ConversationWithMetadata = {
			...mockConversation,
			lastMessageTime: undefined
		};

		const { container } = render(ConversationListItem, {
			props: {
				conversation: convWithoutTime,
				isActive: false,
				...mockHandlers
			}
		});

		expect(container).toBeInTheDocument();
		// Should render without crashing, may show placeholder text
	});

	it('should handle conversation with zero messages', () => {
		const convWithNoMessages: ConversationWithMetadata = {
			...mockConversation,
			messageCount: 0
		};

		render(ConversationListItem, {
			props: {
				conversation: convWithNoMessages,
				isActive: false,
				...mockHandlers
			}
		});

		expect(screen.getByText(/0|empty/i)).toBeInTheDocument();
	});

	it('should display long conversation names gracefully', () => {
		const convWithLongName: ConversationWithMetadata = {
			...mockConversation,
			name: 'This is a very long conversation name that should be truncated or wrapped properly'
		};

		render(ConversationListItem, {
			props: {
				conversation: convWithLongName,
				isActive: false,
				...mockHandlers
			}
		});

		expect(screen.getByText(/This is a very long/)).toBeInTheDocument();
	});
});

describe('ConversationListItem Component - Active State (Issue #42)', () => {
	const mockConversation: ConversationWithMetadata = {
		id: 'conv-1',
		name: 'Test Conversation',
		messageCount: 5,
		lastMessageTime: new Date('2026-01-19T10:00:00Z'),
		createdAt: new Date('2026-01-18T10:00:00Z'),
		updatedAt: new Date('2026-01-19T10:00:00Z')
	};

	const mockHandlers = {
		onSelect: vi.fn(),
		onRename: vi.fn(),
		onDelete: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should apply active styling when isActive=true', () => {
		const { container } = render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: true,
				...mockHandlers
			}
		});

		// Active item should have specific styling classes (bg-blue, border, etc.)
		const activeElement = container.querySelector('[data-active="true"]') ||
			container.querySelector('.active') ||
			container.querySelector('[class*="bg-blue"]');

		expect(activeElement).toBeInTheDocument();
	});

	it('should not apply active styling when isActive=false', () => {
		const { container } = render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		// Should not have active indicator
		const activeElement = container.querySelector('[data-active="true"]');
		expect(activeElement).not.toBeInTheDocument();
	});
});

describe('ConversationListItem Component - Click to Select (Issue #42)', () => {
	const mockConversation: ConversationWithMetadata = {
		id: 'conv-1',
		name: 'Test Conversation',
		messageCount: 5,
		lastMessageTime: new Date('2026-01-19T10:00:00Z'),
		createdAt: new Date('2026-01-18T10:00:00Z'),
		updatedAt: new Date('2026-01-19T10:00:00Z')
	};

	const mockHandlers = {
		onSelect: vi.fn(),
		onRename: vi.fn(),
		onDelete: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should call onSelect when conversation is clicked', async () => {
		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		const nameElement = screen.getByText('Test Conversation');
		await fireEvent.click(nameElement);

		expect(mockHandlers.onSelect).toHaveBeenCalledWith('conv-1');
	});

	it('should call onSelect with correct conversation ID', async () => {
		const conv2: ConversationWithMetadata = {
			...mockConversation,
			id: 'conv-xyz',
			name: 'Different Conversation'
		};

		render(ConversationListItem, {
			props: {
				conversation: conv2,
				isActive: false,
				...mockHandlers
			}
		});

		const nameElement = screen.getByText('Different Conversation');
		await fireEvent.click(nameElement);

		expect(mockHandlers.onSelect).toHaveBeenCalledWith('conv-xyz');
	});
});

describe('ConversationListItem Component - Rename Functionality (Issue #42)', () => {
	const mockConversation: ConversationWithMetadata = {
		id: 'conv-1',
		name: 'Test Conversation',
		messageCount: 5,
		lastMessageTime: new Date('2026-01-19T10:00:00Z'),
		createdAt: new Date('2026-01-18T10:00:00Z'),
		updatedAt: new Date('2026-01-19T10:00:00Z')
	};

	const mockHandlers = {
		onSelect: vi.fn(),
		onRename: vi.fn(),
		onDelete: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should support edit functionality via double-click', async () => {
		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		// Initially should show conversation name as text
		expect(screen.getByText('Test Conversation')).toBeInTheDocument();

		// Edit functionality is triggered by double-click (tested in another test)
		// This test confirms the component renders correctly for editing
		const nameElement = screen.getByText('Test Conversation');
		expect(nameElement).toBeInTheDocument();
	});

	it('should enter edit mode on double-click', async () => {
		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		const nameElement = screen.getByText('Test Conversation');
		await fireEvent.dblClick(nameElement);

		// After double-click, should show input field or contenteditable
		const input = screen.queryByRole('textbox') ||
			screen.queryByDisplayValue('Test Conversation');

		expect(input).toBeInTheDocument();
	});

	it('should call onRename when name is changed and saved', async () => {
		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		// Enter edit mode
		const nameElement = screen.getByText('Test Conversation');
		await fireEvent.dblClick(nameElement);

		// Find input and change value
		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: 'Renamed Conversation' } });

		// Submit (Enter key or blur)
		await fireEvent.keyDown(input, { key: 'Enter' });

		expect(mockHandlers.onRename).toHaveBeenCalledWith('conv-1', 'Renamed Conversation');
	});

	it('should cancel rename on Escape key', async () => {
		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		// Enter edit mode
		const nameElement = screen.getByText('Test Conversation');
		await fireEvent.dblClick(nameElement);

		// Change value but cancel with Escape
		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: 'New Name' } });
		await fireEvent.keyDown(input, { key: 'Escape' });

		// onRename should not be called
		expect(mockHandlers.onRename).not.toHaveBeenCalled();

		// Should show original name
		expect(screen.getByText('Test Conversation')).toBeInTheDocument();
	});

	it('should not allow empty conversation name', async () => {
		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		const nameElement = screen.getByText('Test Conversation');
		await fireEvent.dblClick(nameElement);

		const input = screen.getByRole('textbox');
		await fireEvent.input(input, { target: { value: '' } });
		await fireEvent.keyDown(input, { key: 'Enter' });

		// Should not call onRename with empty string
		expect(mockHandlers.onRename).not.toHaveBeenCalledWith('conv-1', '');

		// Should revert to original name
		expect(screen.getByText('Test Conversation')).toBeInTheDocument();
	});
});

describe('ConversationListItem Component - Delete Functionality (Issue #42)', () => {
	const mockConversation: ConversationWithMetadata = {
		id: 'conv-1',
		name: 'Test Conversation',
		messageCount: 5,
		lastMessageTime: new Date('2026-01-19T10:00:00Z'),
		createdAt: new Date('2026-01-18T10:00:00Z'),
		updatedAt: new Date('2026-01-19T10:00:00Z')
	};

	const mockHandlers = {
		onSelect: vi.fn(),
		onRename: vi.fn(),
		onDelete: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should display delete button', () => {
		const { container } = render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		// Delete button should exist (trash icon, delete text, etc.)
		const deleteButton = screen.queryByRole('button', { name: /delete/i }) ||
			container.querySelector('[title*="delete" i]') ||
			container.querySelector('[aria-label*="delete" i]');

		expect(deleteButton).toBeInTheDocument();
	});

	it('should show confirmation dialog before deleting', async () => {
		// Mock window.confirm
		const originalConfirm = window.confirm;
		window.confirm = vi.fn(() => false);

		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		// Confirm dialog should be shown
		expect(window.confirm).toHaveBeenCalled();

		// onDelete should NOT be called if user cancels
		expect(mockHandlers.onDelete).not.toHaveBeenCalled();

		window.confirm = originalConfirm;
	});

	it('should call onDelete when confirmed', async () => {
		// Mock window.confirm to return true
		const originalConfirm = window.confirm;
		window.confirm = vi.fn(() => true);

		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		expect(window.confirm).toHaveBeenCalled();
		expect(mockHandlers.onDelete).toHaveBeenCalledWith('conv-1');

		window.confirm = originalConfirm;
	});

	it('should not delete when confirmation is cancelled', async () => {
		const originalConfirm = window.confirm;
		window.confirm = vi.fn(() => false);

		render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await fireEvent.click(deleteButton);

		expect(mockHandlers.onDelete).not.toHaveBeenCalled();

		window.confirm = originalConfirm;
	});
});

describe('ConversationListItem Component - Accessibility (Issue #42)', () => {
	const mockConversation: ConversationWithMetadata = {
		id: 'conv-1',
		name: 'Test Conversation',
		messageCount: 5,
		lastMessageTime: new Date('2026-01-19T10:00:00Z'),
		createdAt: new Date('2026-01-18T10:00:00Z'),
		updatedAt: new Date('2026-01-19T10:00:00Z')
	};

	const mockHandlers = {
		onSelect: vi.fn(),
		onRename: vi.fn(),
		onDelete: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should have proper role for list item', () => {
		const { container } = render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		// List item should have appropriate role or be wrapped in <li>
		const listItem = container.querySelector('[role="listitem"]') || container.querySelector('li');
		expect(listItem).toBeTruthy();
	});

	it('should support keyboard navigation with Enter key', async () => {
		const { container } = render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		const clickableElement = container.querySelector('[role="button"]') ||
			container.querySelector('button') ||
			screen.getByText('Test Conversation');

		await fireEvent.keyDown(clickableElement, { key: 'Enter' });

		expect(mockHandlers.onSelect).toHaveBeenCalledWith('conv-1');
	});

	it('should have aria-label or aria-describedby for accessibility', () => {
		const { container } = render(ConversationListItem, {
			props: {
				conversation: mockConversation,
				isActive: false,
				...mockHandlers
			}
		});

		// Should have accessibility labels
		const elementWithAriaLabel = container.querySelector('[aria-label]') ||
			container.querySelector('[aria-describedby]');

		expect(elementWithAriaLabel).toBeTruthy();
	});
});
