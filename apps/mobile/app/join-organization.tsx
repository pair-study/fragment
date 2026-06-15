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
import { EmployeeNumberInput } from '@/components/features/employee-number-input'
import { AppCard, SubmitIconButton } from '@/components/ui/ui'
import { EmptyOrganizationsContent } from '@/components/features/empty-organizations-content'
import { shadows } from '@/theme/shadows'

export default function JoinOrganizationScreen() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const normalizedEmployeeNumber = employeeNumber.trim();
  const canSubmit = normalizedEmployeeNumber.length >= 4;

  function submitEmployeeNumber() {
    if (!canSubmit) return;
    router.replace("/organizations/empty");
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
                onChangeText={setEmployeeNumber}
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
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
