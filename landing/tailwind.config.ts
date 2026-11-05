import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2B333B",
        night: "#070A1A",
        azul: "#001AD8",
        vivo: "#3145FF",
        platina: "#DFDCDB",
        nevoa: "#F2F3FF",
        aco: "#5B6472",
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
