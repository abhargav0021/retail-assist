import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#1f6f54", dark: "#155540", light: "#e6f2ec" },
      },
    },
  },
  plugins: [],
};
export default config;
