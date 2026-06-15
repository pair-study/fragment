import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
  type TextProps,
} from "react-native";

import { cn } from "@/lib/utils";
import { colors } from "@/theme/colors";

type ButtonAction = "primary" | "secondary" | "positive" | "negative" | "default";
type ButtonVariant = "solid" | "outline" | "link";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

type ButtonProps = Omit<PressableProps, "children"> & {
  children: ReactNode;
  action?: ButtonAction;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isDisabled?: boolean;
  isPressed?: boolean;
  isLoading?: boolean;
  className?: string;
};

export function Button({
  children,
  action = "primary",
  variant = "solid",
  size = "md",
  isDisabled = false,
  isPressed = false,
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const resolvedDisabled = disabled || isDisabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: resolvedDisabled, busy: isLoading }}
      disabled={resolvedDisabled}
      className={cn(
        "items-center justify-center flex-row gap-xs rounded-md border",
        buttonSizeStyles[size],
        buttonVariantStyles[variant][action],
        isPressed && !resolvedDisabled && buttonPressedStyles[variant][action],
        resolvedDisabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {isLoading ? <ActivityIndicator color={buttonSpinnerColors[variant][action]} /> : children}
    </Pressable>
  );
}

type ButtonTextProps = TextProps & {
  children: ReactNode;
  action?: ButtonAction;
  variant?: ButtonVariant;
  className?: string;
};

export function ButtonText({
  children,
  action = "primary",
  variant = "solid",
  className,
  ...props
}: ButtonTextProps) {
  return (
    <Text
      className={cn("text-base font-semibold", buttonTextStyles[variant][action], className)}
      {...props}
    >
      {children}
    </Text>
  );
}

const buttonSizeStyles = {
  xs: "min-h-9 px-sm",
  sm: "min-h-10 px-md",
  md: "min-h-12 px-xl",
  lg: "min-h-14 px-xl",
  xl: "min-h-controlXl px-xxl",
} satisfies Record<ButtonSize, string>;

const actionBackgroundStyles = {
  primary: "bg-primary border-primary active:bg-primaryHover",
  secondary: "bg-surfaceTertiary border-border active:bg-border",
  positive: "bg-confirmed border-confirmed active:opacity-80",
  negative: "bg-cancelled border-cancelled active:opacity-80",
  default: "bg-surfaceDarkControl border-surfaceDarkControl active:bg-surfaceDarkPressed",
} satisfies Record<ButtonAction, string>;

const actionOutlineStyles = {
  primary: "bg-surfaceCanvas border-primary active:bg-primarySubtle",
  secondary: "bg-surfaceCanvas border-border active:bg-surfaceSecondary",
  positive: "bg-surfaceCanvas border-confirmed active:bg-surfaceSecondary",
  negative: "bg-surfaceCanvas border-cancelled active:bg-surfaceSecondary",
  default: "bg-surfaceCanvas border-border active:bg-surfaceSecondary",
} satisfies Record<ButtonAction, string>;

const buttonVariantStyles = {
  solid: actionBackgroundStyles,
  outline: actionOutlineStyles,
  link: {
    primary: "bg-transparent border-transparent active:bg-primarySubtle",
    secondary: "bg-transparent border-transparent active:bg-surfaceSecondary",
    positive: "bg-transparent border-transparent active:bg-surfaceSecondary",
    negative: "bg-transparent border-transparent active:bg-surfaceSecondary",
    default: "bg-transparent border-transparent active:bg-surfaceSecondary",
  },
} satisfies Record<ButtonVariant, Record<ButtonAction, string>>;

const buttonPressedStyles = {
  solid: {
    primary: "bg-primaryHover",
    secondary: "bg-border",
    positive: "opacity-80",
    negative: "opacity-80",
    default: "bg-surfaceDarkPressed",
  },
  outline: {
    primary: "bg-primarySubtle",
    secondary: "bg-surfaceSecondary",
    positive: "bg-surfaceSecondary",
    negative: "bg-surfaceSecondary",
    default: "bg-surfaceSecondary",
  },
  link: {
    primary: "bg-primarySubtle",
    secondary: "bg-surfaceSecondary",
    positive: "bg-surfaceSecondary",
    negative: "bg-surfaceSecondary",
    default: "bg-surfaceSecondary",
  },
} satisfies Record<ButtonVariant, Record<ButtonAction, string>>;

const solidTextStyles = {
  primary: "text-textInverse",
  secondary: "text-textPrimary",
  positive: "text-textInverse",
  negative: "text-textInverse",
  default: "text-textInverse",
} satisfies Record<ButtonAction, string>;

const actionTextStyles = {
  primary: "text-primary",
  secondary: "text-textPrimary",
  positive: "text-confirmed",
  negative: "text-cancelled",
  default: "text-textPrimary",
} satisfies Record<ButtonAction, string>;

const buttonTextStyles = {
  solid: solidTextStyles,
  outline: actionTextStyles,
  link: actionTextStyles,
} satisfies Record<ButtonVariant, Record<ButtonAction, string>>;

const buttonSpinnerColors = {
  solid: {
    primary: colors.textInverse,
    secondary: colors.textPrimary,
    positive: colors.textInverse,
    negative: colors.textInverse,
    default: colors.textInverse,
  },
  outline: {
    primary: colors.primary,
    secondary: colors.textPrimary,
    positive: colors.confirmed,
    negative: colors.cancelled,
    default: colors.textPrimary,
  },
  link: {
    primary: colors.primary,
    secondary: colors.textPrimary,
    positive: colors.confirmed,
    negative: colors.cancelled,
    default: colors.textPrimary,
  },
} satisfies Record<ButtonVariant, Record<ButtonAction, string>>;
