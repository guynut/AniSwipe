import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(240 12% 8%)",
        foreground: "hsl(210 40% 98%)",
        card: "hsl(240 10% 12%)",
        muted: "hsl(240 8% 18%)",
        border: "hsl(240 10% 20%)",
        primary: "hsl(330 91% 60%)",
        secondary: "hsl(265 80% 66%)",
        success: "hsl(142 76% 36%)",
        danger: "hsl(0 84% 60%)",
      },
      boxShadow: {
        glow: "0 0 30px rgba(236, 72, 153, 0.3)",
      },
    },
  },
  plugins: [],
} satisfies Config;
