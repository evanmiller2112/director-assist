import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['./src/tests/setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}'],
		alias: {
			'$lib': path.resolve('./src/lib'),
			'$app': path.resolve('./src/tests/mocks/$app')
		},
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'src/tests/',
				'**/*.d.ts',
				'**/*.config.*',
				'**/mockData',
				'dist/',
			],
			// Baseline measured 2026-02-19 (vitest 4.0.18, 288 test files, 13617 tests):
			//   Global:       statements 78.44% | branches 67.66% | functions 77.70% | lines 78.84%
			//   src/lib/db:   statements 91.46% | branches 76.66% | functions 100%   | lines 91.13%
			//   src/lib/services: statements 80.35% | branches 71.53% | functions 85.89% | lines 80.73%
			//   src/lib/stores: statements 70.76% | branches 65.92% | functions 71.80% | lines 71.28%
			// Thresholds are set ~3-5% below baseline to give headroom without being toothless.
			thresholds: {
				// Global thresholds
				statements: 75,
				branches: 63,
				functions: 75,
				lines: 75,
				// Critical: database layer — high coverage expected for data integrity
				'src/lib/db/**': {
					statements: 88,
					branches: 72,
					functions: 95,
					lines: 88,
				},
				// Critical: business logic services — strong coverage expected
				'src/lib/services/**': {
					statements: 77,
					branches: 67,
					functions: 82,
					lines: 77,
				},
				// State management stores — moderate coverage
				'src/lib/stores/**': {
					statements: 67,
					branches: 62,
					functions: 68,
					lines: 68,
				},
			}
		}
	},
	resolve: {
		alias: {
			'$lib': path.resolve('./src/lib'),
			'$app': path.resolve('./src/tests/mocks/$app')
		},
		conditions: ['browser']
	}
});
