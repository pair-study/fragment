import { router } from "expo-router";
import { Text, View } from "react-native";
import { EmptyOrganizationIllustration } from "./empty-organization-illustration";
import { AppButton } from "@/components/ui/ui";

type EmptyOrganizationsContentProps = {
  dimmed?: boolean;
};

export function EmptyOrganizationsContent({ dimmed = false }: EmptyOrganizationsContentProps) {
  return (
    <View className="flex-1 justify-between px-screenX pb-bottomCta pt-section">
      <View className="flex-1 items-center justify-center">
        <EmptyOrganizationIllustration />
        <Text className="mt-xl text-center text-h2 text-textPrimary">
          아직 소속된 조직이 없어요
        </Text>
        <Text className="mt-xs text-center text-base text-textMuted">
          조직 관리자에게 받은 사번을 입력해주세요
        </Text>
      </View>

      <AppButton
        disabled={dimmed}
        onPress={() => router.push("/join-organization")}
        accessibilityLabel="사번 입력하기"
      >
        사번 입력하기
      </AppButton>
    </View>
  );
}
