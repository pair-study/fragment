import React from "react";
import { createAlert } from "@gluestack-ui/core/alert/creator";
import { View, Text } from "react-native";
import {
  tva,
  withStyleContext,
  useStyleContext,
  type VariantProps,
} from "@gluestack-ui/utils/nativewind-utils";
import { cssInterop } from "nativewind";
import { UIIcon } from "@gluestack-ui/core/icon/creator";

const SCOPE = "ALERT";

const alertStyle = tva({
  base: "rounded-lg border px-2.5 py-2 flex-row gap-2 items-start",
  variants: {
    variant: {
      default: "bg-card border-border",
      destructive: "bg-card border-destructive",
    },
  },
});

const alertTextStyle = tva({
  base: "font-medium tracking-tight text-sm flex-1",
  parentVariants: {
    variant: {
      default: "text-card-foreground",
      destructive: "text-destructive",
    },
  },
});

const alertIconStyle = tva({
  base: "fill-none w-4 h-4 mt-0.5",
  parentVariants: {
    variant: {
      default: "text-card-foreground",
      destructive: "text-destructive",
    },
  },
});

// @gluestack-ui/utils는 @types/react@18 기준이라 React 19와 타입 경계에서 불일치 발생
// 팩토리 반환값을 any로 캐스트하여 억제한다 (외부 export 타입은 forwardRef에서 별도 보장)
export const UIAlert = createAlert({
  Root: withStyleContext(View as any, SCOPE) as any,
  Text: Text as any,
  Icon: UIIcon as any,
}) as any;

cssInterop(UIIcon as any, {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: "classNameColor",
      stroke: true,
    } as any,
  },
});

type IAlertProps = Omit<React.ComponentPropsWithoutRef<typeof UIAlert>, "context"> &
  VariantProps<typeof alertStyle>;

const Alert = React.forwardRef<React.ComponentRef<typeof UIAlert>, IAlertProps>(function Alert(
  { className, variant = "default", ...props },
  ref,
) {
  return (
    <UIAlert
      className={alertStyle({ variant, class: className })}
      context={{ variant }}
      ref={ref}
      {...props}
    />
  );
});

type IAlertTextProps = React.ComponentPropsWithoutRef<typeof UIAlert.Text> &
  VariantProps<typeof alertTextStyle>;

const AlertText = React.forwardRef<React.ComponentRef<typeof UIAlert.Text>, IAlertTextProps>(
  function AlertText({ className, ...props }, ref) {
    const { variant: parentVariant } = useStyleContext(SCOPE);
    return (
      <UIAlert.Text
        className={alertTextStyle({
          class: className,
          parentVariants: { variant: parentVariant },
        })}
        {...props}
        ref={ref}
      />
    );
  },
);

type IAlertIconProps = React.ComponentPropsWithoutRef<typeof UIAlert.Icon> &
  VariantProps<typeof alertIconStyle> & {
    height?: number;
    width?: number;
  };

const AlertIcon = React.forwardRef<React.ComponentRef<typeof UIAlert.Icon>, IAlertIconProps>(
  function AlertIcon({ className, size = "sm", ...props }, ref) {
    const { variant: parentVariant } = useStyleContext(SCOPE);
    if (typeof size === "number") {
      return (
        <UIAlert.Icon
          ref={ref}
          {...props}
          className={alertIconStyle({ class: className })}
          size={size}
        />
      );
    } else if ((props.height !== undefined || props.width !== undefined) && size === undefined) {
      return <UIAlert.Icon ref={ref} {...props} className={alertIconStyle({ class: className })} />;
    }
    return (
      <UIAlert.Icon
        className={alertIconStyle({
          parentVariants: { variant: parentVariant },
          class: className,
        })}
        size={size}
        {...props}
        ref={ref}
      />
    );
  },
);

Alert.displayName = "Alert";
AlertText.displayName = "AlertText";
AlertIcon.displayName = "AlertIcon";

export { Alert, AlertText, AlertIcon };
