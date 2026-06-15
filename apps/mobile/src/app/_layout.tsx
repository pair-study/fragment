import { Stack } from "expo-router";
import { GluestackUIProvider } from "@/components/ui";
import { colors } from "@/theme/colors";
import "../global.css";

export default function RootLayout() {
  return (
    <GluestackUIProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.surfaceCanvas,
          },
        }}
      />
    </GluestackUIProvider>
  );
}
