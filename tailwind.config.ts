import type { Config } from "tailwindcss"

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#F8F8F2",
        card: "#FFFFFF",
        primary: {
          DEFAULT: "#198C45",
          hover: "#14733A",
          active: "#E5F2D9",
          soft: "#F1F6E9",
          muted: "#EDF5E6",
        },
        ink: {
          dark: "#073D2E",
          DEFAULT: "#103C2F",
          secondary: "#62676F",
        },
        border: {
          DEFAULT: "#E3E7DD",
        },
        neutral: {
          soft: "#F8FAFC",
        },
        progress: {
          track: "#DDE6D5",
        },
        mission: {
          orange: "#F5A623",
          orangeBg: "#FFF3D5",
          blue: "#4D76E8",
          blueBg: "#E8EDFF",
          purple: "#8B5DE8",
          purpleBg: "#F0E9FF",
        },
        success: {
          DEFAULT: "#1D9B50",
        },
      },
      fontFamily: {
        sans: [
          "Noto Sans Thai",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 4px 12px rgba(35, 60, 42, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config
