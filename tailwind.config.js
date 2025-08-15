/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Apple Minimal Color System
        'mingcare-blue': '#3B82F6',
        'mingcare-blue-hover': '#2563EB',
        'mingcare-blue-light': '#EBF5FF',
        'mingcare-green': '#22C55E',
        'mingcare-gray': '#6B7280',
        
        // Background Colors
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F5F5F7',
        'bg-tertiary': '#F9FAFB',
        
        // Semantic Colors
        'success': '#22C55E',
        'success-light': '#DCFCE7',
        'warning': '#F59E0B',
        'warning-light': '#FEF3C7',
        'error': '#EF4444',
        'error-light': '#FEE2E2',
        
        // Text Colors
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',
        
        // Border Colors
        'border-light': '#E5E7EB',
        'border-medium': '#D1D5DB',
        'border-focus': '#3B82F6',
      },
      fontFamily: {
        'apple': ['Inter', 'SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '4xl': ['36px', { lineHeight: '1.1', letterSpacing: '-0.015em' }],
        '3xl': ['30px', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        '2xl': ['24px', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        'xl': ['20px', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        'lg': ['18px', { lineHeight: '1.4' }],
        'base': ['16px', { lineHeight: '1.5' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'xs': ['12px', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'apple': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.1)',
        'apple-hover': '0 2px 4px rgba(59, 130, 246, 0.3)',
        'apple-focus': '0 0 0 3px rgba(59, 130, 246, 0.1)',
        'apple-card': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      },
      borderRadius: {
        'apple': '12px',
        'apple-sm': '8px',
        'apple-xs': '6px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      scale: {
        '98': '0.98',
      },
    },
  },
  plugins: [],
}
