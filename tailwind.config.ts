import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Entity type colors
				character: { DEFAULT: '#3b82f6', dark: '#1d4ed8' },
				npc: { DEFAULT: '#22c55e', dark: '#15803d' },
				location: { DEFAULT: '#f59e0b', dark: '#b45309' },
				faction: { DEFAULT: '#a855f7', dark: '#7c3aed' },
				item: { DEFAULT: '#f97316', dark: '#c2410c' },
				encounter: { DEFAULT: '#ef4444', dark: '#b91c1c' },
				session: { DEFAULT: '#06b6d4', dark: '#0891b2' },
				deity: { DEFAULT: '#eab308', dark: '#a16207' },
				timeline: { DEFAULT: '#64748b', dark: '#475569' },
				rule: { DEFAULT: '#6366f1', dark: '#4f46e5' },
				player: { DEFAULT: '#ec4899', dark: '#be185d' },
				campaign: { DEFAULT: '#8b5cf6', dark: '#6d28d9' },

				// Dashboard surfaces
				surface: {
					DEFAULT: '#ffffff',
					secondary: '#f8fafc',
					tertiary: '#f1f5f9'
				},
				'surface-dark': {
					DEFAULT: '#0f172a',
					secondary: '#1e293b',
					tertiary: '#334155'
				}
			},
			spacing: {
				sidebar: '280px',
				'panel-min': '320px',
				'panel-default': '400px'
			}
		}
	},
	plugins: []
} satisfies Config;
