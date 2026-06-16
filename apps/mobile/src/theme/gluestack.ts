import { vars } from "nativewind";

export const gluestackColorTokens = {
  light: {
    "--primary": "37 99 235",
    "--primary-foreground": "255 255 255",
    "--background": "255 255 255",
    "--foreground": "17 24 39",
    "--card": "255 255 255",
    "--card-foreground": "17 24 39",
    "--popover": "255 255 255",
    "--popover-foreground": "17 24 39",
    "--secondary": "249 250 251",
    "--secondary-foreground": "17 24 39",
    "--muted": "243 244 246",
    "--muted-foreground": "107 114 128",
    "--destructive": "220 38 38",
    "--border": "229 231 235",
    "--input": "229 231 235",
    "--ring": "191 219 254",
    "--accent": "249 250 251",
    "--accent-foreground": "17 24 39",
  },
  dark: {
    "--primary": "37 99 235",
    "--primary-foreground": "255 255 255",
    "--background": "21 24 30",
    "--foreground": "255 255 255",
    "--card": "21 24 30",
    "--card-foreground": "255 255 255",
    "--popover": "21 24 30",
    "--popover-foreground": "255 255 255",
    "--secondary": "47 48 51",
    "--secondary-foreground": "255 255 255",
    "--muted": "47 48 51",
    "--muted-foreground": "199 205 216",
    "--destructive": "220 38 38",
    "--border": "47 48 51",
    "--input": "47 48 51",
    "--ring": "37 99 235",
    "--accent": "31 32 35",
    "--accent-foreground": "255 255 255",
  },
};

export const config = {
  light: vars(gluestackColorTokens.light),
  dark: vars(gluestackColorTokens.dark),
};
