import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 900: '#05080e', 800: '#0a1018', 700: '#111a26', 600: '#1b2735' },
        water: { DEFAULT: '#22d3ee', deep: '#0891b2', glow: '#67e8f9' },
        surveyed: '#4ade80',
        documented: '#22d3ee',
        inferred: '#fbbf24',
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
