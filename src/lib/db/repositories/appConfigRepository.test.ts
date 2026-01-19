/**
 * Tests for App Config Repository
 *
 * This repository manages application-wide configuration stored in IndexedDB.
 * It provides a simple key-value store for application settings.
 *
 * Covers:
 * - Basic CRUD operations (get, set, delete)
 * - Different value types (string, number, boolean, object, array)
 * - Special methods for active campaign ID management
 * - Bulk operations (clear all config)
 * - Edge cases (missing keys, overwrites, empty values)
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { appConfigRepository, APP_CONFIG_KEYS } from './appConfigRepository';
import { db } from '../index';

describe('AppConfigRepository', () => {
	beforeAll(async () => {
		// Open the database for tests
		await db.open();
	});

	afterAll(async () => {
		// Close database after all tests
		await db.close();
	});

	beforeEach(async () => {
		// Clear config table before each test
		await db.appConfig.clear();
	});

	afterEach(async () => {
		// Clean up after each test
		await db.appConfig.clear();
	});

	describe('get', () => {
		it('should return undefined for non-existent key', async () => {
			const result = await appConfigRepository.get('non-existent-key');
			expect(result).toBeUndefined();
		});

		it('should return stored string value', async () => {
			await appConfigRepository.set('testKey', 'testValue');
			const result = await appConfigRepository.get<string>('testKey');
			expect(result).toBe('testValue');
		});

		it('should return stored number value', async () => {
			await appConfigRepository.set('numberKey', 42);
			const result = await appConfigRepository.get<number>('numberKey');
			expect(result).toBe(42);
		});

		it('should return stored boolean true value', async () => {
			await appConfigRepository.set('boolKey', true);
			const result = await appConfigRepository.get<boolean>('boolKey');
			expect(result).toBe(true);
		});

		it('should return stored boolean false value', async () => {
			await appConfigRepository.set('boolKey', false);
			const result = await appConfigRepository.get<boolean>('boolKey');
			expect(result).toBe(false);
		});

		it('should return stored object value', async () => {
			const testObject = { name: 'Test', count: 5, active: true };
			await appConfigRepository.set('objectKey', testObject);
			const result = await appConfigRepository.get<typeof testObject>('objectKey');
			expect(result).toEqual(testObject);
		});

		it('should return stored array value', async () => {
			const testArray = ['one', 'two', 'three'];
			await appConfigRepository.set('arrayKey', testArray);
			const result = await appConfigRepository.get<string[]>('arrayKey');
			expect(result).toEqual(testArray);
		});

		it('should return stored null value', async () => {
			await appConfigRepository.set('nullKey', null);
			const result = await appConfigRepository.get('nullKey');
			expect(result).toBeNull();
		});

		it('should return empty string when stored', async () => {
			await appConfigRepository.set('emptyKey', '');
			const result = await appConfigRepository.get<string>('emptyKey');
			expect(result).toBe('');
		});

		it('should return zero when stored', async () => {
			await appConfigRepository.set('zeroKey', 0);
			const result = await appConfigRepository.get<number>('zeroKey');
			expect(result).toBe(0);
		});

		it('should handle keys with special characters', async () => {
			const specialKey = 'key:with-special_characters.test';
			await appConfigRepository.set(specialKey, 'value');
			const result = await appConfigRepository.get<string>(specialKey);
			expect(result).toBe('value');
		});

		it('should return correct value when multiple keys exist', async () => {
			await appConfigRepository.set('key1', 'value1');
			await appConfigRepository.set('key2', 'value2');
			await appConfigRepository.set('key3', 'value3');

			const result = await appConfigRepository.get<string>('key2');
			expect(result).toBe('value2');
		});
	});

	describe('set', () => {
		it('should store string value', async () => {
			await appConfigRepository.set('testKey', 'testValue');
			const result = await db.appConfig.get('testKey');
			expect(result).toBeDefined();
			expect(result?.value).toBe('testValue');
		});

		it('should store number value', async () => {
			await appConfigRepository.set('numberKey', 123);
			const result = await db.appConfig.get('numberKey');
			expect(result?.value).toBe(123);
		});

		it('should store boolean value', async () => {
			await appConfigRepository.set('boolKey', true);
			const result = await db.appConfig.get('boolKey');
			expect(result?.value).toBe(true);
		});

		it('should store object value', async () => {
			const obj = { test: 'data', nested: { value: 42 } };
			await appConfigRepository.set('objKey', obj);
			const result = await db.appConfig.get('objKey');
			expect(result?.value).toEqual(obj);
		});

		it('should store array value', async () => {
			const arr = [1, 2, 3, 4, 5];
			await appConfigRepository.set('arrKey', arr);
			const result = await db.appConfig.get('arrKey');
			expect(result?.value).toEqual(arr);
		});

		it('should overwrite existing value with same key', async () => {
			await appConfigRepository.set('key', 'original');
			await appConfigRepository.set('key', 'updated');

			const count = await db.appConfig.count();
			expect(count).toBe(1);

			const result = await appConfigRepository.get<string>('key');
			expect(result).toBe('updated');
		});

		it('should overwrite existing value with different type', async () => {
			await appConfigRepository.set('key', 'string value');
			await appConfigRepository.set('key', 42);

			const result = await appConfigRepository.get<number>('key');
			expect(result).toBe(42);
		});

		it('should handle empty string value', async () => {
			await appConfigRepository.set('emptyKey', '');
			const result = await appConfigRepository.get<string>('emptyKey');
			expect(result).toBe('');
		});

		it('should handle null value', async () => {
			await appConfigRepository.set('nullKey', null);
			const result = await appConfigRepository.get('nullKey');
			expect(result).toBeNull();
		});

		it('should handle very long string value', async () => {
			const longString = 'x'.repeat(10000);
			await appConfigRepository.set('longKey', longString);
			const result = await appConfigRepository.get<string>('longKey');
			expect(result).toBe(longString);
		});

		it('should handle complex nested object', async () => {
			const complexObj = {
				name: 'Test',
				settings: {
					theme: 'dark',
					features: ['feature1', 'feature2'],
					metadata: {
						version: '1.0',
						enabled: true
					}
				},
				tags: ['tag1', 'tag2']
			};
			await appConfigRepository.set('complex', complexObj);
			const result = await appConfigRepository.get<typeof complexObj>('complex');
			expect(result).toEqual(complexObj);
		});

		it('should handle unicode characters in value', async () => {
			const unicodeValue = '测试 Test ñ ü é';
			await appConfigRepository.set('unicode', unicodeValue);
			const result = await appConfigRepository.get<string>('unicode');
			expect(result).toBe(unicodeValue);
		});

		it('should not affect other keys when setting', async () => {
			await appConfigRepository.set('key1', 'value1');
			await appConfigRepository.set('key2', 'value2');

			const result1 = await appConfigRepository.get<string>('key1');
			expect(result1).toBe('value1');
		});
	});

	describe('delete', () => {
		it('should delete existing key', async () => {
			await appConfigRepository.set('testKey', 'testValue');
			await appConfigRepository.delete('testKey');

			const result = await appConfigRepository.get('testKey');
			expect(result).toBeUndefined();
		});

		it('should not throw error when deleting non-existent key', async () => {
			await expect(appConfigRepository.delete('non-existent')).resolves.not.toThrow();
		});

		it('should only delete specified key, leaving others intact', async () => {
			await appConfigRepository.set('key1', 'value1');
			await appConfigRepository.set('key2', 'value2');
			await appConfigRepository.set('key3', 'value3');

			await appConfigRepository.delete('key2');

			const result1 = await appConfigRepository.get<string>('key1');
			const result2 = await appConfigRepository.get<string>('key2');
			const result3 = await appConfigRepository.get<string>('key3');

			expect(result1).toBe('value1');
			expect(result2).toBeUndefined();
			expect(result3).toBe('value3');
		});

		it('should handle multiple deletes of same key', async () => {
			await appConfigRepository.set('key', 'value');
			await appConfigRepository.delete('key');
			await appConfigRepository.delete('key');

			const result = await appConfigRepository.get('key');
			expect(result).toBeUndefined();
		});

		it('should reduce count after deletion', async () => {
			await appConfigRepository.set('key1', 'value1');
			await appConfigRepository.set('key2', 'value2');

			let count = await db.appConfig.count();
			expect(count).toBe(2);

			await appConfigRepository.delete('key1');

			count = await db.appConfig.count();
			expect(count).toBe(1);
		});
	});

	describe('getActiveCampaignId', () => {
		it('should return null when active campaign ID is not set', async () => {
			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBeNull();
		});

		it('should return stored campaign ID', async () => {
			await appConfigRepository.setActiveCampaignId('campaign-123');
			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBe('campaign-123');
		});

		it('should return null after campaign ID is cleared', async () => {
			await appConfigRepository.setActiveCampaignId('campaign-123');
			await appConfigRepository.clearActiveCampaignId();
			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBeNull();
		});

		it('should use correct config key constant', async () => {
			await appConfigRepository.set(APP_CONFIG_KEYS.ACTIVE_CAMPAIGN_ID, 'campaign-456');
			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBe('campaign-456');
		});

		it('should handle UUID format campaign IDs', async () => {
			const uuid = '550e8400-e29b-41d4-a716-446655440000';
			await appConfigRepository.setActiveCampaignId(uuid);
			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBe(uuid);
		});
	});

	describe('setActiveCampaignId', () => {
		it('should store campaign ID', async () => {
			await appConfigRepository.setActiveCampaignId('campaign-123');
			const result = await db.appConfig.get(APP_CONFIG_KEYS.ACTIVE_CAMPAIGN_ID);
			expect(result).toBeDefined();
			expect(result?.value).toBe('campaign-123');
		});

		it('should overwrite existing campaign ID', async () => {
			await appConfigRepository.setActiveCampaignId('campaign-old');
			await appConfigRepository.setActiveCampaignId('campaign-new');

			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBe('campaign-new');
		});

		it('should use correct config key constant', async () => {
			await appConfigRepository.setActiveCampaignId('campaign-789');
			const stored = await appConfigRepository.get<string>(APP_CONFIG_KEYS.ACTIVE_CAMPAIGN_ID);
			expect(stored).toBe('campaign-789');
		});

		it('should handle empty string campaign ID', async () => {
			await appConfigRepository.setActiveCampaignId('');
			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBe('');
		});

		it('should handle campaign IDs with special characters', async () => {
			const specialId = 'campaign-with-dashes_and_underscores.123';
			await appConfigRepository.setActiveCampaignId(specialId);
			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBe(specialId);
		});
	});

	describe('clearActiveCampaignId', () => {
		it('should remove active campaign ID', async () => {
			await appConfigRepository.setActiveCampaignId('campaign-123');
			await appConfigRepository.clearActiveCampaignId();

			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBeNull();
		});

		it('should not throw error when clearing non-existent campaign ID', async () => {
			await expect(appConfigRepository.clearActiveCampaignId()).resolves.not.toThrow();
		});

		it('should not affect other config keys', async () => {
			await appConfigRepository.setActiveCampaignId('campaign-123');
			await appConfigRepository.set('otherKey', 'otherValue');

			await appConfigRepository.clearActiveCampaignId();

			const campaignId = await appConfigRepository.getActiveCampaignId();
			const otherValue = await appConfigRepository.get<string>('otherKey');

			expect(campaignId).toBeNull();
			expect(otherValue).toBe('otherValue');
		});

		it('should be idempotent - multiple clears should not error', async () => {
			await appConfigRepository.setActiveCampaignId('campaign-123');
			await appConfigRepository.clearActiveCampaignId();
			await appConfigRepository.clearActiveCampaignId();
			await appConfigRepository.clearActiveCampaignId();

			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBeNull();
		});
	});

	describe('clear', () => {
		it('should remove all config entries', async () => {
			await appConfigRepository.set('key1', 'value1');
			await appConfigRepository.set('key2', 'value2');
			await appConfigRepository.setActiveCampaignId('campaign-123');

			await appConfigRepository.clear();

			const count = await db.appConfig.count();
			expect(count).toBe(0);
		});

		it('should remove active campaign ID', async () => {
			await appConfigRepository.setActiveCampaignId('campaign-123');
			await appConfigRepository.clear();

			const result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBeNull();
		});

		it('should not throw error when clearing empty config', async () => {
			await expect(appConfigRepository.clear()).resolves.not.toThrow();
		});

		it('should not affect other database tables', async () => {
			// Store config data
			await appConfigRepository.set('testKey', 'testValue');

			// Clear config
			await appConfigRepository.clear();

			// Verify config is cleared
			const configCount = await db.appConfig.count();
			expect(configCount).toBe(0);

			// Other tables should be unaffected (they should still be accessible)
			// This is a safety check to ensure clear() is scoped correctly
			expect(db.entities).toBeDefined();
			expect(db.campaign).toBeDefined();
		});

		it('should allow setting new values after clear', async () => {
			await appConfigRepository.set('key1', 'value1');
			await appConfigRepository.clear();
			await appConfigRepository.set('key2', 'value2');

			const result = await appConfigRepository.get<string>('key2');
			expect(result).toBe('value2');

			const count = await db.appConfig.count();
			expect(count).toBe(1);
		});
	});

	describe('Edge Cases and Concurrency', () => {
		it('should handle rapid successive writes to same key', async () => {
			await appConfigRepository.set('key', 'value1');
			await appConfigRepository.set('key', 'value2');
			await appConfigRepository.set('key', 'value3');

			const result = await appConfigRepository.get<string>('key');
			expect(result).toBe('value3');

			const count = await db.appConfig.count();
			expect(count).toBe(1);
		});

		it('should handle very long key names', async () => {
			const longKey = 'key-' + 'x'.repeat(1000);
			await appConfigRepository.set(longKey, 'value');
			const result = await appConfigRepository.get<string>(longKey);
			expect(result).toBe('value');
		});

		it('should handle unicode characters in keys', async () => {
			const unicodeKey = 'key-测试-ñ-ü-é';
			await appConfigRepository.set(unicodeKey, 'value');
			const result = await appConfigRepository.get<string>(unicodeKey);
			expect(result).toBe('value');
		});

		it('should handle mixed type operations on same key', async () => {
			await appConfigRepository.set('key', 'string');
			await appConfigRepository.set('key', 42);
			await appConfigRepository.set('key', { obj: true });
			await appConfigRepository.set('key', ['array']);

			const result = await appConfigRepository.get<string[]>('key');
			expect(result).toEqual(['array']);
		});

		it('should handle undefined value by treating as missing', async () => {
			// Setting undefined should behave similar to not setting at all
			await appConfigRepository.set('key', undefined);
			const result = await appConfigRepository.get('key');

			// IndexedDB will store undefined as-is
			expect(result).toBeUndefined();
		});

		it('should preserve data types through storage and retrieval', async () => {
			const testData = {
				string: 'text',
				number: 42,
				boolean: true,
				null: null,
				array: [1, 2, 3],
				object: { nested: true }
			};

			await appConfigRepository.set('testData', testData);
			const result = await appConfigRepository.get<typeof testData>('testData');

			expect(result).toEqual(testData);
			expect(typeof result?.string).toBe('string');
			expect(typeof result?.number).toBe('number');
			expect(typeof result?.boolean).toBe('boolean');
			expect(result?.null).toBeNull();
			expect(Array.isArray(result?.array)).toBe(true);
			expect(typeof result?.object).toBe('object');
		});

		it('should handle campaign ID switching scenarios', async () => {
			// Set initial campaign
			await appConfigRepository.setActiveCampaignId('campaign-1');
			let result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBe('campaign-1');

			// Switch to new campaign
			await appConfigRepository.setActiveCampaignId('campaign-2');
			result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBe('campaign-2');

			// Clear (user logs out or closes campaign)
			await appConfigRepository.clearActiveCampaignId();
			result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBeNull();

			// Set new campaign again
			await appConfigRepository.setActiveCampaignId('campaign-3');
			result = await appConfigRepository.getActiveCampaignId();
			expect(result).toBe('campaign-3');
		});
	});
});
