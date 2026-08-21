/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#0A0D14',        // Ultra-deep charcoal base
          surface: '#121722',   // Slightly elevated slate
          panel: '#1A202C',     // Panel fill
          border: 'rgba(255, 255, 255, 0.08)',
          subtle: '#94A3B8',
        },
        brand: {
          primary: '#10B981',   // Neon Emerald Spotify-like vibrant accent
          secondary: '#06B6D4', // Vibrant Cyan accent
          accent: '#8B5CF6',    // Electric Purple accent
          gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 50%, #8B5CF6 100%)',
        }
      },
      backdropBlur: {
        glass: '16px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        neon: '0 0 20px rgba(16, 185, 129, 0.35)',
        'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.35)',
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'equalizer-1': 'equalizer 0.8s ease-in-out infinite alternate',
        'equalizer-2': 'equalizer 1.1s ease-in-out 0.2s infinite alternate',
        'equalizer-3': 'equalizer 0.6s ease-in-out 0.4s infinite alternate',
      },
      keyframes: {
        equalizer: {
          '0%': { height: '20%' },
          '100%': { height: '100%' },
        }
      }
    },
  },
  plugins: [],
}
