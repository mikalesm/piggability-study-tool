/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Token-driven graphite palette (see index.css :root).
        ink: 'rgb(var(--ink) / <alpha-value>)',
        panel: {
          DEFAULT: 'rgb(var(--panel) / <alpha-value>)',
          2: 'rgb(var(--panel-2) / <alpha-value>)',
          3: 'rgb(var(--panel-3) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          strong: 'rgb(var(--line-2) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          muted: 'rgb(var(--muted) / <alpha-value>)',
          dim: 'rgb(var(--dim) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: '#fbbf24',
          ink: '#1a1206',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        led: '0 0 6px currentColor',
        panel: '0 1px 0 0 rgb(255 255 255 / 0.02) inset, 0 1px 2px 0 rgb(0 0 0 / 0.4)',
      },
    },
  },
  plugins: [],
}
