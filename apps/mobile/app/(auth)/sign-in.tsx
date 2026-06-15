import { router } from "expo-router";
import { Image, SafeAreaView, StatusBar, View } from "react-native";

import ilgamLogo from "@/assets/ilgam-logo.png";
import { SocialButton } from "@/components/features/social-button";

export default function SignInScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surfaceSecondary">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 justify-between px-screenX pb-bottomCta pt-authTop">
        <View className="flex-1 items-center justify-center pb-authLogoGap">
          <Image source={ilgamLogo} className="h-logo w-logo" resizeMode="contain" />
        </View>

        <View className="gap-md">
          <SocialButton provider="kakao" onPress={() => router.push("/organizations/empty")} />
          <SocialButton provider="naver" onPress={() => router.push("/organizations/empty")} />
        </View>
      </View>
    </SafeAreaView>
  );
}
