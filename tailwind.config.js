/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        background: "var(--blog-background)",
        foreground: "var(--blog-foreground)",
        card: {
          DEFAULT: "var(--blog-card)",
          foreground: "var(--blog-card-foreground)",
        },
        popover: {
          DEFAULT: "var(--blog-popover)",
          foreground: "var(--blog-popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--blog-primary)",
          foreground: "var(--blog-primary-foreground)",
        },
        muted: {
          DEFAULT: "var(--blog-muted)",
          foreground: "var(--blog-muted-foreground)",
        },
        border: "var(--blog-border)",
        input: "var(--blog-input)",
        ring: "var(--blog-ring)",
      },
      fontFamily: {
        display: ['"Playfair Display"', '"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Serif SC"', '"Noto Sans SC"', '"Songti SC"', "Georgia", '"Times New Roman"', "serif"],
        mono: ['"JetBrains Mono"', '"Fira Code"', "monospace"],
        sansOrig: ['"Inter"', '"Noto Sans SC"', "-apple-system", '"Segoe UI"', "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      maxWidth: {
        editorial: "1152px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
