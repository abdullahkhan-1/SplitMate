/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Page & surface backgrounds
        base:    '#0A0A0A',
        surface: '#141414',
        raised:  '#1C1C1C',
        overlay: '#242424',

        // Borders
        line:  '#262626',
        'line-strong': '#404040',

        // Text
        'text-1': '#FAFAFA',
        'text-2': '#A1A1A1',
        'text-3': '#525252',

        // Brand green
        brand: {
          DEFAULT: '#22C55E',
          dim:  '#22C55E1A',
          text: '#86EFAC',
          strong: '#16A34A',
        },

        // Danger red
        danger: {
          DEFAULT: '#F87171',
          dim:  '#F871711A',
          text: '#FCA5A5',
        },

        // Warning amber
        warn: {
          DEFAULT: '#FBBF24',
          dim:  '#FBBF241A',
          text: '#FDE68A',
        },

        // Info blue
        info: {
          DEFAULT: '#60A5FA',
          dim:  '#60A5FA1A',
          text: '#BAE6FD',
        },
      },
    },
  },
  plugins: [],
}