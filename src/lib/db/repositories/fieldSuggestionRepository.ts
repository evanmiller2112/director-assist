import { db } from '../index';
import type { FieldSuggestion } from '$lib/types/ai';
import { nanoid } from 'nanoid';

export const fieldSuggestionRepository = {
	// Create a new field suggestion
	async create(params: {
		entityId?: string;
		entityType: string;
		fieldKey: string;
		suggestedValue: string;
	}): Promise<FieldSuggestion> {
		const suggestion: FieldSuggestion = {
			id: nanoid(),
			entityId: params.entityId,
			entityType: params.entityType,
			fieldKey: params.fieldKey,
			suggestedValue: params.suggestedValue,
			status: 'pending',
			createdAt: new Date()
		};

		await db.fieldSuggestions.add(suggestion);
		return suggestion;
	},

	// Get a suggestion by ID
	async getById(id: string): Promise<FieldSuggestion | undefined> {
		return await db.fieldSuggestions.get(id);
	},

	// Get all suggestions for a specific entity ID
	async getByEntityId(entityId: string): Promise<FieldSuggestion[]> {
		return await db.fieldSuggestions.where('entityId').equals(entityId).toArray();
	},

	// Get all suggestions for a specific entity type
	async getByEntityType(entityType: string): Promise<FieldSuggestion[]> {
		return await db.fieldSuggestions.where('entityType').equals(entityType).toArray();
	},

	// Get pending suggestions for a specific entity
	async getPendingForEntity(entityId: string, entityType: string): Promise<FieldSuggestion[]> {
		return await db.fieldSuggestions
			.where('entityId')
			.equals(entityId)
			.filter((suggestion) => suggestion.entityType === entityType && suggestion.status === 'pending')
			.toArray();
	},

	// Update the status of a suggestion
	async updateStatus(
		id: string,
		status: 'pending' | 'accepted' | 'dismissed'
	): Promise<void> {
		const suggestion = await db.fieldSuggestions.get(id);
		if (!suggestion) {
			throw new Error(`Field suggestion with id ${id} not found`);
		}

		await db.fieldSuggestions.update(id, { status });
	},

	// Delete a suggestion by ID
	async deleteById(id: string): Promise<void> {
		await db.fieldSuggestions.delete(id);
	},

	// Delete all suggestions for a specific entity ID
	async deleteByEntityId(entityId: string): Promise<void> {
		await db.fieldSuggestions.where('entityId').equals(entityId).delete();
	}
};
