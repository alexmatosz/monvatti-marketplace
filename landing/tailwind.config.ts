import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        aco: "rgb(var(--aco) / <alpha-value>)",
        platina: "rgb(var(--platina) / <alpha-value>)",
        nevoa: "rgb(var(--nevoa) / <alpha-value>)",
        azul: "rgb(var(--azul) / <alpha-value>)",
        vivo: "rgb(var(--vivo) / <alpha-value>)",
        fundo: "rgb(var(--fundo) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        card2: "rgb(var(--card2) / <alpha-value>)",
        night: "#161B22",
        marca: { DEFAULT: "#3145FF", forte: "#001AD8" },
        ouro: "#FFE600",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        conteudo: "1120px",
      },
    },
  },
  plugins: [],
};

export default config;
