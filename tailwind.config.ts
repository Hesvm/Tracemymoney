import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#fbfaf7",
        ink: "#2f333b",
        muted: "#8c90a0"
      },
      fontFamily: {
        sans: ["var(--font-ui)"],
        serif: ["var(--font-serif)"],
        mono: ["SF Mono", "Roboto Mono", "ui-monospace", "SFMono-Regular"]
      },
      boxShadow: {
        soft: "0 18px 50px rgba(20, 20, 20, 0.06), 0 2px 8px rgba(20, 20, 20, 0.04)",
        dock: "0 20px 60px rgba(76, 74, 68, 0.12), 0 1px 0 rgba(255,255,255,0.9) inset"
      }
    }
  },
  plugins: []
};

export default config;
