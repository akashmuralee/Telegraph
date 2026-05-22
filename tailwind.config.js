/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        shell: '#0e0e0d',
        surface: {
          DEFAULT: '#1a1a18',
          2: '#222220',
        },
        line: {
          DEFAULT: '#2e2e2b',
          2: '#3a3a37',
        },
        accent: {
          DEFAULT: '#e8a825',
          glow: 'rgba(232, 168, 37, 0.18)',
          dim: 'rgba(232, 168, 37, 0.08)',
        },
        ink: {
          DEFAULT: '#f0efe8',
          2: '#a0a099',
          3: '#555550',
        },
        correct: '#f0efe8',
        incorrect: '#ca4754',
        pending: '#4a4a45',
      },
      fontFamily: {
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pip-in': {
          from: { opacity: '0', transform: 'scale(0.4)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        blink: 'blink 1.1s step-end infinite',
        'pip-in': 'pip-in 0.07s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
