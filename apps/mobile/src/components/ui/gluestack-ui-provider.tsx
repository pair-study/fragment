import { useEffect, type ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { OverlayProvider } from "@gluestack-ui/overlay";
import { ToastProvider } from "@gluestack-ui/toast";
import { useColorScheme, vars } from "nativewind";

import { gluestackColorTokens } from "@/theme/gluestack";

export type GluestackUIMode = "light" | "dark" | "system";

const config = {
  light: vars(gluestackColorTokens.light),
  dark: vars(gluestackColorTokens.dark),
};

type GluestackUIProviderProps = {
  children: ReactNode;
  mode?: GluestackUIMode;
  style?: ViewProps["style"];
};

export function GluestackUIProvider({ children, mode = "light", style }: GluestackUIProviderProps) {
  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(mode);
  }, [mode, setColorScheme]);

  const resolvedMode = colorScheme === "dark" ? "dark" : "light";

  return (
    <View style={[config[resolvedMode], { flex: 1, height: "100%", width: "100%" }, style]}>
      <OverlayProvider>
        <ToastProvider>{children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
