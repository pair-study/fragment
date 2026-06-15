import { colors } from "@/theme/colors";

function hexToRgbValue(hex: string) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
}

export const gluestackColorTokens = {
  light: {
    "--color-primary-500": hexToRgbValue(colors.primary),
    "--color-primary-600": hexToRgbValue(colors.primaryHover),
    "--color-primary-100": hexToRgbValue(colors.primarySubtle),
    "--color-background-0": hexToRgbValue(colors.surfaceCanvas),
    "--color-background-50": hexToRgbValue(colors.surfaceSecondary),
    "--color-background-100": hexToRgbValue(colors.surfaceTertiary),
    "--color-background-error": hexToRgbValue(colors.cancelledSubtle),
    "--color-background-success": hexToRgbValue(colors.confirmedSubtle),
    "--color-background-warning": hexToRgbValue(colors.pendingSubtle),
    "--color-background-info": hexToRgbValue(colors.primarySubtle),
    "--color-typography-950": hexToRgbValue(colors.textPrimary),
    "--color-typography-700": hexToRgbValue(colors.textSecondary),
    "--color-typography-500": hexToRgbValue(colors.textMuted),
    "--color-typography-0": hexToRgbValue(colors.textInverse),
    "--color-outline-200": hexToRgbValue(colors.border),
    "--color-outline-300": hexToRgbValue(colors.focusRing),
    "--color-error-500": hexToRgbValue(colors.cancelled),
    "--color-success-500": hexToRgbValue(colors.confirmed),
    "--color-warning-500": hexToRgbValue(colors.pending),
    "--color-info-500": hexToRgbValue(colors.primary),
  },
  dark: {
    "--color-primary-500": hexToRgbValue(colors.primary),
    "--color-primary-600": hexToRgbValue(colors.primaryHover),
    "--color-primary-100": hexToRgbValue(colors.primaryDisabled),
    "--color-background-0": hexToRgbValue(colors.surfaceDark),
    "--color-background-50": hexToRgbValue(colors.surfaceDarkControl),
    "--color-background-100": hexToRgbValue(colors.surfaceDarkPressed),
    "--color-background-error": hexToRgbValue("#451A1A"),
    "--color-background-success": hexToRgbValue("#14532D"),
    "--color-background-warning": hexToRgbValue("#451A03"),
    "--color-background-info": hexToRgbValue(colors.primaryDisabled),
    "--color-typography-950": hexToRgbValue(colors.textInverse),
    "--color-typography-700": hexToRgbValue(colors.textOnDarkMuted),
    "--color-typography-500": hexToRgbValue(colors.textMuted),
    "--color-typography-0": hexToRgbValue(colors.textPrimary),
    "--color-outline-200": hexToRgbValue(colors.surfaceDarkControl),
    "--color-outline-300": hexToRgbValue(colors.primary),
    "--color-error-500": hexToRgbValue(colors.cancelled),
    "--color-success-500": hexToRgbValue(colors.confirmed),
    "--color-warning-500": hexToRgbValue(colors.pending),
    "--color-info-500": hexToRgbValue(colors.primary),
  },
} as const;
