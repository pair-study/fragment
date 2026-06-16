import type { Config } from "tailwindcss/types/config";
import nativewindPreset from "nativewind/preset";

import { colors } from "./src/theme/colors";

type FontSizeEntry = [string, { lineHeight: string; fontWeight: string }];

const typography: Record<string, FontSizeEntry> = {
  display: ["32px", { lineHeight: "38px", fontWeight: "700" }],
  h1: ["26px", { lineHeight: "32px", fontWeight: "700" }],
  h2: ["21px", { lineHeight: "27px", fontWeight: "600" }],
  h3: ["18px", { lineHeight: "24px", fontWeight: "600" }],
  h4: ["16px", { lineHeight: "22px", fontWeight: "600" }],
  lg: ["16px", { lineHeight: "26px", fontWeight: "400" }],
  base: ["15px", { lineHeight: "24px", fontWeight: "400" }],
  sm: ["13px", { lineHeight: "20px", fontWeight: "400" }],
  xs: ["12px", { lineHeight: "17px", fontWeight: "400" }],
  "2xs": ["11px", { lineHeight: "15px", fontWeight: "500" }],
};

export default {
  darkMode: "class",
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [nativewindPreset],
  // tva()로 런타임 조합되는 v3 시맨틱 토큰 클래스를 빌드에서 제외되지 않도록 보호
  safelist: [
    {
      pattern:
        /(bg|border|text|stroke|fill)-(foreground|card|popover|muted|destructive|border|input|ring|primary|secondary|background|accent)(\/\d+)?$/,
    },
    {
      pattern:
        /(bg|border|text|stroke|fill)-(card|popover|muted|destructive|primary|secondary|accent)-(foreground)(\/\d+)?$/,
    },
  ],
  theme: {
    extend: {
      colors: {
        // 프로젝트 정적 디자인 토큰 (feature 컴포넌트에서 직접 사용)
        ...colors,
        // Gluestack UI v3 CSS 변수 시맨틱 토큰 (CSS var로 런타임 주입)
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        background: {
          DEFAULT: "rgb(var(--background) / <alpha-value>)",
        },
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        pill: "9999px",
      },
      spacing: {
        xs: "8px",
        sm: "12px",
        md: "16px",
        xl: "24px",
        xxl: "32px",
        section: "40px",
        screenX: "24px",
        bottomCta: "72px",
        authTop: "120px",
        authLogoGap: "96px",
        joinBottom: "88px",
        logo: "256px",
        controlXl: "58px",
      },
      fontSize: typography,
    },
  },
} satisfies Config;
