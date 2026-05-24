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
      },
      colors: {
        nerve: {
          bg: '#080810',
          panel: '#0c0c18',
          border: '#181830',
          accent: '#00d4ff',
          accentDim: '#0099bb',
          critical: '#ff2a2a',
          criticalDim: '#cc1111',
          warn: '#f59e0b',
          danger: '#ef4444',
          success: '#10b981',
          muted: '#3d3d55',
          text: '#e2e8f0',
          textDim: '#8888aa',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in both',
        'slide-up': 'slideUp 0.3s ease-out both',
        'glow-in': 'glowIn 0.8s ease-out both',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)', boxShadow: 'none' },
          '35%':  { opacity: '1', transform: 'translateY(0)',   boxShadow: 'inset 3px 0 24px rgba(255,42,42,0.55), 0 0 28px rgba(255,42,42,0.28)' },
          '100%': { opacity: '1', transform: 'translateY(0)',   boxShadow: 'inset 3px 0 12px rgba(255,42,42,0.08), 0 0 0 1px rgba(255,42,42,0.08)' },
        },
      },
    },
  },
  plugins: [],
}
