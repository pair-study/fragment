import { router } from "expo-router";
import { SafeAreaView, StatusBar, Text, View } from "react-native";
import { Ionicons as IoniconsBase } from "@expo/vector-icons";

import { MOCK_LINKED_ORGANIZATION } from "@/components/features/mock-organization-link";
import { AppButton, AppCard } from "@/components/ui/ui";
import { colors } from "@/theme/colors";
import { shadows } from "@/theme/shadows";

const Ionicons = IoniconsBase as unknown as React.ComponentType<{
  name: string;
  size: number;
  color: string;
}>;

export default function JoinOrganizationSuccessScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surfaceSecondary">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 justify-between px-screenX pb-bottomCta pt-section">
        <View className="flex-1 justify-center">
          <View className="items-center">
            <View className="h-[72px] w-[72px] items-center justify-center rounded-pill bg-confirmed">
              <Ionicons name="checkmark" size={40} color={colors.textInverse} />
            </View>
            <Text className="mt-xl text-center text-h1 text-textPrimary">
              조직 연결이 완료됐어요
            </Text>
            <Text className="mt-xs text-center text-base text-textMuted">
              이제 연결된 조직의 근무 일정을 확인할 수 있어요
            </Text>
          </View>

          <AppCard className="mt-xxl p-xl" shadowStyle={shadows.card}>
            <Text className="text-sm text-textMuted">연결된 조직</Text>
            <Text className="mt-xs text-h3 text-textPrimary">{MOCK_LINKED_ORGANIZATION.name}</Text>

            <View className="mt-md flex-row rounded-lg bg-surfaceSecondary p-md">
              <View className="flex-1">
                <Text className="text-xs text-textMuted">이름</Text>
                <Text className="mt-xs text-sm text-textPrimary">
                  {MOCK_LINKED_ORGANIZATION.workerName}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs text-textMuted">사번</Text>
                <Text className="mt-xs text-sm text-textPrimary">
                  {MOCK_LINKED_ORGANIZATION.employeeNumber}
                </Text>
              </View>
            </View>
          </AppCard>
        </View>

        <AppButton
          onPress={() => router.replace("/organizations/empty")}
          accessibilityLabel="시작하기"
        >
          시작하기
        </AppButton>
      </View>
    </SafeAreaView>
  );
}
