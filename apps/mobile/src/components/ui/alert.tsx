import { type ReactNode } from "react";
import { Text, View, type TextProps, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";

type AlertAction = "success" | "info" | "error" | "warning" | "muted";
type AlertVariant = "solid" | "outline";

type AlertProps = ViewProps & {
  children: ReactNode;
  action?: AlertAction;
  variant?: AlertVariant;
  className?: string;
};

export function Alert({
  children,
  action = "info",
  variant = "solid",
  className,
  ...props
}: AlertProps) {
  return (
    <View
      accessibilityRole="alert"
      className={cn(
        "w-full flex-row items-start gap-sm rounded-md border p-md",
        alertVariantStyles[variant][action],
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function AlertIcon({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("mt-0.5 items-center justify-center", className)} {...props} />;
}

type AlertTextProps = TextProps & {
  children: ReactNode;
  action?: AlertAction;
  variant?: AlertVariant;
  className?: string;
};

export function AlertText({
  children,
  action = "info",
  variant = "solid",
  className,
  ...props
}: AlertTextProps) {
  return (
    <Text className={cn("flex-1 text-sm", alertTextStyles[variant][action], className)} {...props}>
      {children}
    </Text>
  );
}

const solidAlertStyles = {
  success: "border-confirmed bg-confirmedSubtle",
  info: "border-primary bg-primarySubtle",
  error: "border-cancelled bg-cancelledSubtle",
  warning: "border-pending bg-pendingSubtle",
  muted: "border-border bg-surfaceSecondary",
} satisfies Record<AlertAction, string>;

const outlineAlertStyles = {
  success: "border-confirmed bg-surfaceCanvas",
  info: "border-primary bg-surfaceCanvas",
  error: "border-cancelled bg-surfaceCanvas",
  warning: "border-pending bg-surfaceCanvas",
  muted: "border-border bg-surfaceCanvas",
} satisfies Record<AlertAction, string>;

const alertVariantStyles = {
  solid: solidAlertStyles,
  outline: outlineAlertStyles,
} satisfies Record<AlertVariant, Record<AlertAction, string>>;

const alertTextStyles = {
  solid: {
    success: "text-confirmed",
    info: "text-primary",
    error: "text-cancelled",
    warning: "text-pending",
    muted: "text-textSecondary",
  },
  outline: {
    success: "text-confirmed",
    info: "text-primary",
    error: "text-cancelled",
    warning: "text-pending",
    muted: "text-textSecondary",
  },
} satisfies Record<AlertVariant, Record<AlertAction, string>>;
