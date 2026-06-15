import { useState, type ReactNode } from "react";
import {
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { Ionicons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { colors } from "@/theme/colors";

type AppButtonProps = {
  children: ReactNode;
  variant?: "primary" | "kakao" | "naver" | "dark";
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function AppButton({
  children,
  variant = "primary",
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
}: AppButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const backgroundColor = getButtonColor(variant, disabled);
  const textColor = getButtonTextColor(variant, disabled);
  const resolvedBackgroundColor =
    isPressed && !disabled ? getPressedButtonColor(variant) : backgroundColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      className="w-full min-h-[58px] rounded-lg items-center justify-center flex-row gap-[10px]"
      style={[
        { backgroundColor: resolvedBackgroundColor, opacity: isPressed && !disabled ? 0.88 : 1 },
        style,
      ]}
    >
      {renderButtonContent(children, { color: textColor })}
    </Pressable>
  );
}

type AppCardProps = ViewProps & {
  children: ReactNode;
  className?: string;
  shadowStyle?: StyleProp<ViewStyle>;
};

export function AppCard({ children, className = "", shadowStyle, style, ...props }: AppCardProps) {
  return (
    <View
      className={cn("rounded-xl bg-surfaceCanvas", className)}
      style={[shadowStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
}

type SubmitIconButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function SubmitIconButton({ disabled, label, style, ...props }: SubmitIconButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const isActive = isPressed && !disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      className="w-[58px] min-h-[58px] rounded-[10px] items-center justify-center"
      style={[
        {
          backgroundColor: isActive ? colors.surfaceDarkPressed : colors.surfaceDarkControl,
          opacity: isActive ? 0.88 : 1,
        },
        style,
      ]}
      {...props}
    >
      <Ionicons name="arrow-forward" size={28} color={colors.textInverse} />
    </Pressable>
  );
}

function getButtonColor(variant: NonNullable<AppButtonProps["variant"]>, disabled: boolean) {
  if (disabled) return colors.primaryDisabled;
  if (variant === "kakao") return colors.kakao;
  if (variant === "naver") return colors.naver;
  if (variant === "dark") return colors.surfaceDarkControl;
  return colors.primary;
}

function getButtonTextColor(variant: NonNullable<AppButtonProps["variant"]>, disabled: boolean) {
  if (disabled) return colors.textDisabled;
  if (variant === "kakao") return colors.kakaoText;
  return colors.textInverse;
}

function getPressedButtonColor(variant: NonNullable<AppButtonProps["variant"]>) {
  if (variant === "kakao") return colors.kakaoPressed;
  if (variant === "naver") return colors.naverPressed;
  if (variant === "dark") return colors.surfaceDarkPressed;
  return colors.primaryHover;
}

function renderButtonContent(children: ReactNode, textStyle: StyleProp<TextStyle>) {
  if (typeof children === "string" || typeof children === "number") {
    return (
      <Text className="text-[17px] leading-[24px] font-bold" style={textStyle}>
        {children}
      </Text>
    );
  }

  return children;
}
