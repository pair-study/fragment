import { createContext, useContext, type ReactNode } from "react";
import { TextInput, View, type TextInputProps, type ViewProps } from "react-native";

import { cn } from "@/lib/utils";
import { colors } from "@/theme/colors";

type InputSize = "sm" | "md" | "lg" | "xl";
type InputVariant = "outline" | "rounded" | "underlined";

type InputState = {
  isDisabled: boolean;
  isInvalid: boolean;
  isReadOnly: boolean;
};

const InputContext = createContext<InputState>({
  isDisabled: false,
  isInvalid: false,
  isReadOnly: false,
});

type InputProps = ViewProps & {
  children: ReactNode;
  size?: InputSize;
  variant?: InputVariant;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isReadOnly?: boolean;
  className?: string;
};

export function Input({
  children,
  size = "md",
  variant = "outline",
  isDisabled = false,
  isInvalid = false,
  isReadOnly = false,
  className,
  ...props
}: InputProps) {
  return (
    <InputContext.Provider value={{ isDisabled, isInvalid, isReadOnly }}>
      <View
        accessibilityState={{ disabled: isDisabled }}
        className={cn(
          "w-full flex-row items-center bg-surfaceCanvas",
          inputSizeStyles[size],
          inputVariantStyles[variant],
          isInvalid && "border-cancelled",
          isDisabled && "bg-surfaceTertiary opacity-60",
          className,
        )}
        {...props}
      >
        {children}
      </View>
    </InputContext.Provider>
  );
}

type InputFieldProps = TextInputProps & {
  className?: string;
};

export function InputField({ className, editable, ...props }: InputFieldProps) {
  const { isDisabled, isReadOnly } = useContext(InputContext);

  return (
    <TextInput
      editable={editable ?? (!isDisabled && !isReadOnly)}
      placeholderTextColor={colors.placeholder}
      className={cn("min-w-0 flex-1 text-base text-textPrimary", className)}
      {...props}
    />
  );
}

export function InputSlot({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("items-center justify-center", className)} {...props} />;
}

export function InputIcon({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("items-center justify-center", className)} {...props} />;
}

const inputSizeStyles = {
  sm: "min-h-10 px-sm",
  md: "min-h-12 px-md",
  lg: "min-h-14 px-md",
  xl: "min-h-controlXl px-xl",
} satisfies Record<InputSize, string>;

const inputVariantStyles = {
  outline: "rounded-md border border-border",
  rounded: "rounded-pill border border-border",
  underlined: "border-b border-border",
} satisfies Record<InputVariant, string>;
