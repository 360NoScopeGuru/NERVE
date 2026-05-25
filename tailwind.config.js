/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono:    ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        display: ['Chakra Petch', 'sans-serif'],
      },
      colors: {
        nerve: {
          bg:           'rgb(var(--c-bg) / <alpha-value>)',
          panel:        'rgb(var(--c-panel) / <alpha-value>)',
          panelRaised:  'rgb(var(--c-panel-raised) / <alpha-value>)',
          border:       'rgb(var(--c-border) / <alpha-value>)',
          borderBright: 'rgb(var(--c-border-bright) / <alpha-value>)',
          accent:       'rgb(var(--c-accent) / <alpha-value>)',
          accentDim:    'rgb(var(--c-accent-dim) / <alpha-value>)',
          critical:     'rgb(var(--c-critical) / <alpha-value>)',
          criticalDim:  'rgb(var(--c-critical-dim) / <alpha-value>)',
          warn:         'rgb(var(--c-warn) / <alpha-value>)',
          danger:       'rgb(var(--c-danger) / <alpha-value>)',
          success:      'rgb(var(--c-success) / <alpha-value>)',
          muted:        'rgb(var(--c-muted) / <alpha-value>)',
          mutedBright:  'rgb(var(--c-muted-bright) / <alpha-value>)',
          text:         'rgb(var(--c-text) / <alpha-value>)',
          textDim:      'rgb(var(--c-text-dim) / <alpha-value>)',
          phosphor:     'rgb(var(--c-phosphor) / <alpha-value>)',
        }
      },
      animation: {
        'spring-in':   'springIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'spine-draw':  'spineDraw 0.6s ease-out both',
        'shimmer':     'shimmer 1.8s ease-in-out infinite',
        'ripple':      'ripple 0.6s ease-out forwards',
        'flicker':     'flicker 4s ease-in-out infinite',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'sweep':       'sweep 1.8s ease-in-out infinite',
        'fade-in':     'fadeIn 0.3s ease-in both',
        'slide-up':    'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.34, 1.2, 0.64, 1) both',
        'glow-in':     'glowIn 0.8s ease-out both',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan':        'scan 5s linear infinite',
        'float':       'float 6s ease-in-out infinite',
        'intro-in':    'introIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
      keyframes: {
        springIn: {
          '0%':   { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        spineDraw: {
          '0%':   { transform: 'scaleY(0)', transformOrigin: 'top' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'top' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        ripple: {
          '0%':   { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        flicker: {
          '0%, 95%, 100%': { opacity: '1' },
          '96%':            { opacity: '0.6' },
          '98%':            { opacity: '0.4' },
          '99%':            { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: 'inset 3px 0 12px rgba(255,42,42,0.2), 0 0 12px rgba(255,42,42,0.06)' },
          '50%':      { boxShadow: 'inset 3px 0 24px rgba(255,42,42,0.5), 0 0 28px rgba(255,42,42,0.18)' },
        },
        sweep: {
          '0%':   { transform: 'translateX(-100%)' },
          '50%':  { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        glowIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)', boxShadow: 'none' },
          '35%':  { opacity: '1', transform: 'translateY(0)',   boxShadow: 'inset 3px 0 24px rgba(255,42,42,0.55), 0 0 28px rgba(255,42,42,0.28)' },
          '100%': { opacity: '1', transform: 'translateY(0)',   boxShadow: 'inset 3px 0 12px rgba(255,42,42,0.08), 0 0 0 1px rgba(255,42,42,0.08)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        introIn: {
          '0%':   { opacity: '0', transform: 'scale(0.8) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
