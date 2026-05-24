/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
        display: ['Chakra Petch', 'sans-serif'],
      },
      colors: {
        nerve: {
          bg:           '#04040e',
          panel:        '#080818',
          panelRaised:  '#0d0d22',
          border:       '#141428',
          borderBright: '#1e1e40',
          accent:       '#00d4ff',
          accentDim:    '#0099bb',
          critical:     '#ff2a2a',
          criticalDim:  '#cc1111',
          warn:         '#f59e0b',
          danger:       '#ef4444',
          success:      '#00e5a0',
          muted:        '#2e2e50',
          mutedBright:  '#4a4a70',
          text:         '#dde4f0',
          textDim:      '#7070a0',
          phosphor:     '#00ffcc',
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
        'glow-in':     'glowIn 0.8s ease-out both',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan':        'scan 2s linear infinite',
        'dash':        'dash 1s linear infinite',
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
          '97%':            { opacity: '1' },
          '98%':            { opacity: '0.4' },
          '99%':            { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: 'inset 3px 0 12px rgba(255,42,42,0.25), 0 0 12px rgba(255,42,42,0.08)' },
          '50%':      { boxShadow: 'inset 3px 0 24px rgba(255,42,42,0.55), 0 0 28px rgba(255,42,42,0.22)' },
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
        glowIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)', boxShadow: 'none' },
          '35%':  { opacity: '1', transform: 'translateY(0)',   boxShadow: 'inset 3px 0 24px rgba(255,42,42,0.55), 0 0 28px rgba(255,42,42,0.28)' },
          '100%': { opacity: '1', transform: 'translateY(0)',   boxShadow: 'inset 3px 0 12px rgba(255,42,42,0.08), 0 0 0 1px rgba(255,42,42,0.08)' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        dash: {
          '0%':   { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
}
