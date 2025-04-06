const config = {
  plugins: ["@tailwindcss/postcss"],
  container: {
    padding: {
      DEFAULT: '1rem',
      sm: '2rem',
      lg: '4rem',
      xl: '5rem',
      '2xl': '6rem',
    },
  },
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // blue-500
        accent: '#8B5CF6', // violet-500
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  }
};

export default config;
