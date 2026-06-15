import type { Config } from "tailwindcss";
import nativewindPreset from "nativewind/preset";

import { colors } from "./theme/colors";

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
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [nativewindPreset],
  theme: {
    extend: {
      colors,
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
      },
      fontSize: typography,
    },
  },
} satisfies Config;
