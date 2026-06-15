import { SafeAreaView, StatusBar } from "react-native";
import { EmptyOrganizationsContent } from "@/components/features/empty-organizations-content";

export default function EmptyOrganizationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surfaceSecondary">
      <StatusBar barStyle="dark-content" />
      <EmptyOrganizationsContent />
    </SafeAreaView>
  );
}
