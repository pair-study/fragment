import { Image, View } from 'react-native'

import emptyGui from '@/assets/empty-gui.png'

export function EmptyOrganizationIllustration() {
  return (
    <View className="w-[132px] h-[132px] items-center justify-center">
      <Image source={emptyGui} className="w-[120px] h-[120px]" resizeMode="contain" />
    </View>
  )
}
