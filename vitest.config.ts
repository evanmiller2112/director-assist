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
			]
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
