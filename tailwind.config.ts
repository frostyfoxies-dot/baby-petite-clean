import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        white: {
          DEFAULT: '#FFFFFF',
          pure: '#FFFFFF',
        },
        yellow: {
          DEFAULT: '#FFD700',
          50: '#FFF9C4',
          100: '#FFF59D',
          200: '#FFF176',
          300: '#FFEE58',
          400: '#FFD700',
          500: '#FFD700',
          600: '#E6C200',
          700: '#C9A800',
          800: '#A68600',
          900: '#836600',
        },
        'off-white': '#FAFAFA',
        'light-gray': '#F5F5F5',
        
        // Neutral Colors
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2': ['28px', { lineHeight: '36px', fontWeight: '600' }],
        'h3': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h4': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'h5': ['18px', { lineHeight: '24px', fontWeight: '500' }],
        'h6': ['16px', { lineHeight: '20px', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '16px', fontWeight: '400' }],
      },
      spacing: {
        'grid-gap-mobile': '8px',
        'grid-gap-tablet': '12px',
        'grid-gap-desktop': '12px',
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'button': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'button-hover': '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'card': '4px',
        'button': '4px',
        'input': '4px',
      },
      borderWidth: {
        'thin': '1px',
      },
    },
  },
  plugins: [],
};

export default config;
