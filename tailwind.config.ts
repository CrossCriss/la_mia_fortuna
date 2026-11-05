import type { Config } from "tailwindcss";

// Дизайн-токени зберігаються в globals.css як "сирі" канали OKLCH (без oklch()),
// щоб tailwind міг підставляти opacity-модифікатор (напр. bg-accent/50).
function withOpacity(variable: string) {
  return ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue !== undefined
      ? `oklch(var(${variable}) / ${opacityValue})`
      : `oklch(var(${variable}))`;
}

// withOpacity повертає функцію (для opacity-модифікаторів), а тип Config
// офіційно очікує лише string — тому конфіг типізуємо через `satisfies`-каст нижче.
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      colors: {
        brand: {
          50: "#fdf2f6",
          100: "#fce7ee",
          200: "#f9cfdf",
          300: "#f4a8c4",
          400: "#ed76a3",
          500: "#e14b81",
          600: "#cc2e64",
          700: "#ab2050",
          800: "#8d1d44",
          900: "#761c3c",
        },
        background: withOpacity("--color-background"),
        surface: withOpacity("--color-surface"),
        "surface-dark": withOpacity("--color-surface-dark"),
        ink: {
          DEFAULT: withOpacity("--color-ink"),
          soft: withOpacity("--color-ink-soft"),
        },
        accent: {
          DEFAULT: withOpacity("--color-accent"),
          dark: withOpacity("--color-accent-dark"),
        },
        secondary: withOpacity("--color-secondary"),
        tertiary: withOpacity("--color-tertiary"),
        sale: withOpacity("--color-sale"),
        border: withOpacity("--color-border"),
      },
      borderRadius: {
        card: "0px",
        photo: "0px",
      },
      screens: {
        xs: "375px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "cart-bump": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "fade-in-up": "fade-in-up 250ms ease-out",
        "cart-bump": "cart-bump 350ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config as unknown as Config;
