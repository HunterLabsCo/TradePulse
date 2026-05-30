import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        mist: {
          bg: '#0e1311',
          'bg-raised': '#161c19',
          'bg-sunk': '#0a0e0c',
          border: '#222a25',
          'border-bright': '#36413a',
          primary: '#8ec2dd',
          'primary-dim': '#5a7e95',
          text: '#d8e0d2',
          'text-dim': '#7a8a75',
          win: '#a8d4ad',
          loss: '#e89a8a',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        "green-primary": "hsl(var(--green-primary))",
        "blue-accent": "hsl(var(--blue-accent))",
        "red-action": "hsl(var(--red-action))",
        "red-destroy": "hsl(var(--red-destroy))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'mist-sm': '3px',
        'mist': '4px',
        'mist-md': '6px',
        'mist-lg': '8px',
      },
      keyframes: {
        termblink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        termpulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 16px hsl(var(--green-primary) / 0.3)" },
          "50%": { boxShadow: "0 0 28px hsl(var(--green-primary) / 0.5)" },
        },
        "pulse-red-glow": {
          "0%, 100%": { boxShadow: "0 0 16px hsl(var(--red-action) / 0.3)" },
          "50%": { boxShadow: "0 0 28px hsl(var(--red-action) / 0.5)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-red-glow": "pulse-red-glow 1.5s ease-in-out infinite",
        termblink: 'termblink 1s infinite',
        termpulse: 'termpulse 2s infinite ease-in-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
