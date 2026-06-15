import { type ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";
import { shadows } from "@/theme/shadows";

type CardSize = "sm" | "md" | "lg";
type CardVariant = "elevated" | "outline" | "ghost" | "filled";

type CardProps = ViewProps & {
  children?: ReactNode;
  size?: CardSize;
  variant?: CardVariant;
  className?: string;
};

export function Card({
  children,
  size = "md",
  variant = "elevated",
  className,
  style,
  ...props
}: CardProps) {
  return (
    <View
      className={cn("rounded-lg", cardSizeStyles[size], cardVariantStyles[variant], className)}
      style={[variant === "elevated" ? shadows.card : undefined, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const cardSizeStyles = {
  sm: "p-md",
  md: "p-xl",
  lg: "p-xxl",
} satisfies Record<CardSize, string>;

const cardVariantStyles = {
  elevated: "bg-surfaceCanvas",
  outline: "border border-border bg-surfaceCanvas",
  ghost: "bg-transparent",
  filled: "bg-surfaceSecondary",
} satisfies Record<CardVariant, string>;
