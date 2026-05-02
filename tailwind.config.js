import tailwindAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  prefix: "erix-",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--erix-border))",
        input: "hsl(var(--erix-input))",
        ring: "hsl(var(--erix-ring))",
        background: "hsl(var(--erix-background))",
        foreground: "hsl(var(--erix-foreground))",
        primary: {
          DEFAULT: "hsl(var(--erix-primary))",
          foreground: "hsl(var(--erix-primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--erix-secondary))",
          foreground: "hsl(var(--erix-secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--erix-destructive))",
          foreground: "hsl(var(--erix-destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--erix-muted))",
          foreground: "hsl(var(--erix-muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--erix-accent))",
          foreground: "hsl(var(--erix-accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--erix-popover))",
          foreground: "hsl(var(--erix-popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--erix-card))",
          foreground: "hsl(var(--erix-card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--erix-radius)",
        md: "calc(var(--erix-radius) - 2px)",
        sm: "calc(var(--erix-radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindAnimate],
};
