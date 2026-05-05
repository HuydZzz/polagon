import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Polagon palette — electric purple on near-black, with portal-blue accent.
        bg: {
          DEFAULT: "#0A0A0F",
          subtle: "#13131C",
          card: "#1A1A26",
          elev: "#22222F",
        },
        border: {
          DEFAULT: "#2A2A38",
          strong: "#3A3A4C",
        },
        text: {
          DEFAULT: "#F5F5F7",
          muted: "#9999A8",
          dim: "#6B6B7B",
        },
        brand: {
          DEFAULT: "#7C3AED", // electric purple
          50: "#F3EEFE",
          100: "#E5DAFC",
          200: "#CCB5FA",
          300: "#B190F7",
          400: "#956BF3",
          500: "#7C3AED",
          600: "#6322D6",
          700: "#4C1AA8",
          800: "#36127A",
          900: "#1F0B4D",
        },
        accent: {
          // Portal blue — used sparingly, as the second voice.
          DEFAULT: "#3B82F6",
        },
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
        display: ["'Instrument Serif'", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "28px",
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(124, 58, 237, 0.45)",
        card: "0 8px 24px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at top, rgba(124,58,237,0.12), transparent 60%), radial-gradient(circle at bottom right, rgba(59,130,246,0.08), transparent 50%)",
        "hex-pattern":
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 52'><polygon points='30,1 59,17.5 59,34.5 30,51 1,34.5 1,17.5' fill='none' stroke='rgba(124,58,237,0.08)' stroke-width='1'/></svg>\")",
      },
      animation: {
        "score-up": "scoreUp 800ms cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fadeIn 400ms ease-out both",
        pulse_glow: "pulseGlow 2.4s ease-in-out infinite",
      },
      keyframes: {
        scoreUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(124,58,237,0.4)" },
          "50%": { boxShadow: "0 0 0 12px rgba(124,58,237,0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
