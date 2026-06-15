import { Ionicons as IoniconsBase } from "@expo/vector-icons";

type IoniconsProps = ConstructorParameters<typeof IoniconsBase>[0];

// @expo/vector-icons가 React 19 타입을 아직 지원하지 않아 cast로 우회
export const Ionicons = IoniconsBase as unknown as React.ComponentType<IoniconsProps>;
