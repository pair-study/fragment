import React from "react";
import { View } from "react-native";
import { tva, isWeb, type VariantProps } from "@gluestack-ui/utils/nativewind-utils";

const baseStyle = isWeb ? "flex flex-col relative z-0" : "";

const cardStyle = tva({
  base: `${baseStyle} flex-col bg-card border border-border rounded-xl shadow-sm`,
  variants: {
    size: {
      default: "p-4 gap-6",
      sm: "p-3 gap-3",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

type ICardProps = React.ComponentPropsWithoutRef<typeof View> &
  VariantProps<typeof cardStyle> & {
    className?: string;
    size?: "default" | "sm";
  };

const Card = React.forwardRef<React.ComponentRef<typeof View>, ICardProps>(
  function Card({ className, size = "default", ...props }, ref) {
    return <View className={cardStyle({ size, class: className })} {...props} ref={ref} />;
  },
);

Card.displayName = "Card";

export { Card };
