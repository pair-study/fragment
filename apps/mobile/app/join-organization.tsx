import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { EmployeeNumberInput } from "@/components/features/employee-number-input";
import { AppCard, SubmitIconButton } from "@/components/ui/ui";
import { EmptyOrganizationsContent } from "@/components/features/empty-organizations-content";
import { MOCK_LINKED_ORGANIZATION } from "@/components/features/mock-organization-link";
import { shadows } from "@/theme/shadows";

export default function JoinOrganizationScreen() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);
  const normalizedEmployeeNumber = employeeNumber.trim();
  const canSubmit = normalizedEmployeeNumber.length >= 4;

  function changeEmployeeNumber(value: string) {
    setEmployeeNumber(value);
    if (isNotFound) {
      setIsNotFound(false);
    }
  }

  function submitEmployeeNumber() {
    if (!canSubmit) return;

    const isMockMatch =
      normalizedEmployeeNumber.toUpperCase() ===
      MOCK_LINKED_ORGANIZATION.employeeNumber;

    if (isMockMatch) {
      router.push("/join-organization/success");
      return;
    }

    setIsNotFound(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-surfaceSecondary">
      <StatusBar barStyle="light-content" />
      <EmptyOrganizationsContent dimmed />
      <View className="absolute inset-0 bg-black/70" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="absolute inset-0"
      >
        <View className="flex-1 justify-center px-screenX pb-joinBottom">
          <View>
            <AppCard
              className="bg-surfaceDark px-screenX py-xxl"
              shadowStyle={shadows.modal}
            >
              <Text className="text-h2 text-textInverse">조직 참여하기</Text>
              <Text className="mt-xs text-base text-textInverse">
                관리자에게 받은 사번을 입력하면 조직에 연결돼요
              </Text>
            </AppCard>

            <AppCard
              className="mt-xxl flex-row gap-sm p-xl"
              shadowStyle={shadows.card}
            >
              <EmployeeNumberInput
                value={employeeNumber}
                onChangeText={changeEmployeeNumber}
                placeholder="GN-0042"
                returnKeyType="done"
                onSubmitEditing={submitEmployeeNumber}
                accessibilityLabel="사번"
              />
              <SubmitIconButton
                label="사번 제출"
                disabled={!canSubmit}
                onPress={submitEmployeeNumber}
              />
            </AppCard>

            {isNotFound ? (
              <AppCard
                className="mt-sm border border-cancelled p-xl"
                accessibilityRole="alert"
              >
                <Text className="text-h4 text-cancelled">
                  일치하는 조직을 찾을 수 없어요
                </Text>
                <Text className="mt-xs text-sm text-textMuted">
                  사번을 다시 확인하거나 조직 관리자에게 문의해주세요
                </Text>
              </AppCard>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
