import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#030303', container: '#1d1d1d' },
        secondary: { DEFAULT: '#6b38d4', container: '#8455ef', fixed: '#e9ddff' },
        surface: {
          DEFAULT: '#f8f9fa',
          dim: '#d9dadb',
          'container-low': '#f3f4f5',
          'container-lowest': '#ffffff',
          'container-high': '#e7e8e9',
        },
        'on-surface': { DEFAULT: '#191c1d', variant: '#46464c' },
        'on-primary': '#ffffff',
        'on-secondary': '#ffffff',
        error: { DEFAULT: '#ba1a1a', container: '#ffdad6' },
        outline: { DEFAULT: '#77767d', variant: '#c7c5cd' },
        success: { DEFAULT: '#2e7d32', light: '#e8f5e9' },
        warning: { DEFAULT: '#ed6c02', light: '#fff3e0' },
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.25rem',
      },
      boxShadow: {
        ambient: '0px 24px 48px rgba(25, 28, 29, 0.06)',
        'ambient-lg': '0px 32px 64px rgba(25, 28, 29, 0.08)',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
