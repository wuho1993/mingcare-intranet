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
        // 2026 High-Tech Color System
        'mingcare-blue': '#3B82F6',
        'mingcare-blue-hover': '#2563EB',
        'mingcare-blue-light': '#EBF5FF',
        'mingcare-green': '#10B981',
        'mingcare-purple': '#8B5CF6',
        'mingcare-orange': '#F97316',
        'mingcare-cyan': '#06B6D4',
        'mingcare-pink': '#EC4899',
        'mingcare-gray': '#64748B',
        
        // Primary Colors
        'primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#3B82F6',
        },
        
        // Background Colors
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F8FAFC',
        'bg-tertiary': '#F1F5F9',
        
        // Semantic Colors - 2026 Vibrant
        'success': '#10B981',
        'success-light': '#D1FAE5',
        'warning': '#F59E0B',
        'warning-light': '#FEF3C7',
        'error': '#EF4444',
        'error-light': '#FEE2E2',
        'danger': '#EF4444',
        'danger-light': '#FEE2E2',
        'info': '#06B6D4',
        'info-light': '#CFFAFE',
        
        // Text Colors
        'text-primary': '#0F172A',
        'text-secondary': '#475569',
        'text-tertiary': '#94A3B8',
        
        // Border Colors
        'border-light': '#E2E8F0',
        'border-medium': '#CBD5E1',
        'border-focus': '#3B82F6',
      },
      fontFamily: {
        'apple': ['Inter', 'SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '5xl': ['48px', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        '4xl': ['36px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '3xl': ['30px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        '2xl': ['24px', { lineHeight: '1.25', letterSpacing: '-0.015em' }],
        'xl': ['20px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'lg': ['18px', { lineHeight: '1.4' }],
        'base': ['16px', { lineHeight: '1.5' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'xs': ['12px', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'apple': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'apple-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'apple-focus': '0 0 0 4px rgba(59, 130, 246, 0.15)',
        'apple-card': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.4)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.3)',
        'colored': '0 10px 40px -10px rgba(59, 130, 246, 0.4)',
        '2026': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        '2026-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        '2026-xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'apple': '16px',
        'apple-sm': '10px',
        'apple-xs': '8px',
        'apple-lg': '20px',
        'apple-xl': '24px',
        '2026': '12px',
        '2026-lg': '16px',
        '2026-xl': '20px',
        '2026-2xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      scale: {
        '98': '0.98',
        '102': '1.02',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '20px',
      },
    },
  },
  plugins: [],
}
