import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Cash Sans", "sans-serif"],
        mono: ["Cash Sans Mono", "monospace"],
        serif: ["serif"],
        display: ["Cash Sans Wide", "Cash Sans", "sans-serif"],
      },
      borderRadius: {
        xs: "calc(var(--radius) - 6px)",
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        full: "9999px",
        pill: "999px",
        button: "999px",
        input: "999px",
        card: "12px",
        "card-lg": "16px",
        "card-sm": "10px",
        dropdown: "10px",
        modal: "16px",
      },
      boxShadow: {
        mini: "var(--shadow-mini)",
        "mini-inset": "var(--shadow-mini-inset)",
        btn: "var(--shadow-btn)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        popover: "var(--shadow-popover)",
        modal: "var(--shadow-modal)",
        kbd: "var(--shadow-kbd)",
        "date-field-focus": "var(--shadow-date-field-focus)",
      },
      colors: {
        /* ── Boss-UI semantic: backgrounds ── */
        background: {
          DEFAULT: "var(--background-default)",
          default: "var(--background-default)",
          alt: "var(--background-alt)",
          medium: "var(--background-medium)",
          muted: "var(--background-muted)",
          inverse: "var(--background-inverse)",
          accent: "var(--background-accent)",
          danger: "var(--background-danger)",
          success: "var(--background-success)",
          info: "var(--background-info)",
          warning: "var(--background-warning)",
        },
        /* ── Boss-UI semantic: text ── */
        text: {
          DEFAULT: "var(--text-default)",
          default: "var(--text-default)",
          muted: "var(--text-muted)",
          alt: "var(--text-alt)",
          inverse: "var(--text-inverse)",
          accent: "var(--text-accent)",
          danger: "var(--text-danger)",
          success: "var(--text-success)",
          info: "var(--text-info)",
          warning: "var(--text-warning)",
        },
        /* ── Foreground (shadcn compat) ── */
        foreground: {
          DEFAULT: "var(--text-default)",
        },
        /* ── Boss-UI semantic: borders ── */
        border: {
          DEFAULT: "var(--border-default)",
          default: "var(--border-default)",
          input: "var(--border-input)",
          "input-hover": "var(--border-input-hover)",
          strong: "var(--border-strong)",
          card: "var(--border-card)",
          inverse: "var(--border-inverse)",
          accent: "var(--border-accent)",
          danger: "var(--border-danger)",
          success: "var(--border-success)",
          info: "var(--border-info)",
          warning: "var(--border-warning)",
        },
        /* ── Ring ── */
        ring: {
          DEFAULT: "var(--ring)",
        },
        /* ── Standard shadcn tokens ── */
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        input: {
          DEFAULT: "var(--input)",
        },
        /* ── Sidebar ── */
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        /* ── Charts ── */
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        /* ── Alpha / surface ── */
        dark: {
          10: "var(--dark-10)",
          40: "var(--dark-40)",
          "04": "var(--dark-04)",
        },
        surface: {
          dark: "var(--surface-dark)",
          "dark-text": "var(--surface-dark-text)",
          "dark-muted": "var(--surface-dark-muted)",
          "dark-border": "var(--surface-dark-border)",
        },
        /* ── Boss-UI gray palette ── */
        gray: {
          50: "var(--color-gray-50)",
          100: "var(--color-gray-100)",
          200: "var(--color-gray-200)",
          300: "var(--color-gray-300)",
          400: "var(--color-gray-400)",
          500: "var(--color-gray-500)",
          600: "var(--color-gray-600)",
          700: "var(--color-gray-700)",
          800: "var(--color-gray-800)",
          900: "var(--color-gray-900)",
        },
        /* ── Utility colors ── */
        green: { 500: "#91cb80" },
        red: { 500: "#f94b4b" },
        yellow: { 500: "#fbcd44" },
      },
      spacing: {
        input: "3.25rem",
        "input-sm": "2.75rem",
        button: "2.75rem",
        "button-sm": "2rem",
      },
      fontSize: {
        xxs: "10px",
      },
      transitionDuration: {
        400: "400ms",
        600: "600ms",
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
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "rotateX(-10deg) scale(0.9)" },
          to: { opacity: "1", transform: "rotateX(0deg) scale(1)" },
        },
        "scale-out": {
          from: { opacity: "1", transform: "rotateX(0deg) scale(1)" },
          to: { opacity: "0", transform: "rotateX(-10deg) scale(0.95)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "enter-from-right": {
          from: { opacity: "0", transform: "translateX(200px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "enter-from-left": {
          from: { opacity: "0", transform: "translateX(-200px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "exit-to-right": {
          from: { opacity: "1", transform: "translateX(0)" },
          to: { opacity: "0", transform: "translateX(200px)" },
        },
        "exit-to-left": {
          from: { opacity: "1", transform: "translateX(0)" },
          to: { opacity: "0", transform: "translateX(-200px)" },
        },
        "word-reveal": {
          from: {
            opacity: "0",
            filter: "blur(8px)",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            filter: "blur(0)",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1s ease-out infinite",
        "scale-in": "scale-in 0.2s ease",
        "scale-out": "scale-out 0.15s ease",
        "fade-in": "fade-in 0.2s ease",
        "fade-out": "fade-out 0.15s ease",
        "enter-from-left": "enter-from-left 0.2s ease",
        "enter-from-right": "enter-from-right 0.2s ease",
        "exit-to-left": "exit-to-left 0.2s ease",
        "exit-to-right": "exit-to-right 0.2s ease",
        "word-reveal": "word-reveal 0.4s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate, tailwindcssTypography],
};
