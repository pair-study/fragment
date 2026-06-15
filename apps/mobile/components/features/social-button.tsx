import { Image, Text, View } from "react-native";

import kakaoLogo from "@/assets/kakao-logo.png";
import naverLogo from "@/assets/naver-logo.png";
import { colors } from "@/theme/colors";
import { AppButton } from "@/components/ui/ui";

type SocialButtonProps = {
  provider: "kakao" | "naver";
  onPress?: () => void;
};

export function SocialButton({ provider, onPress }: SocialButtonProps) {
  const isKakao = provider === "kakao";

  return (
    <AppButton
      variant={provider}
      onPress={onPress}
      accessibilityLabel={`${isKakao ? "카카오" : "네이버"}로 시작하기`}
    >
      <View className="w-[26px] h-[26px] items-center justify-center">
        <Image
          source={isKakao ? kakaoLogo : naverLogo}
          className={isKakao ? "w-[22px] h-[22px]" : "w-[20px] h-[20px]"}
          resizeMode="contain"
        />
      </View>
      <Text
        className="text-[17px] leading-[24px] font-bold"
        style={{ color: isKakao ? colors.kakaoText : colors.textInverse }}
      >
        {isKakao ? "카카오로 시작하기" : "네이버로 시작하기"}
      </Text>
    </AppButton>
  );
}
