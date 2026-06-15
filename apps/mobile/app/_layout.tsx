import { Stack } from 'expo-router'
import { colors } from '@/theme/colors'
import '../global.css'

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.surfaceCanvas,
        },
      }}
    />
  )
}
