import Image from "next/image";

import { cn } from "@/lib/utils";

type AuthBrandProps = {
  className?: string;
  variant?: "compact" | "hero";
};

export function AuthBrand({ className, variant = "compact" }: AuthBrandProps) {
  if (variant === "hero") {
    return (
      <div className={cn("flex flex-col items-center text-center", className)}>
        <div className="flex size-56 items-center justify-center rounded-full bg-primary-foreground p-12 shadow-card">
          <Image
            src="/favicons/favicon-512.png"
            width={512}
            height={512}
            alt=""
            priority
            className="size-full object-contain"
          />
        </div>
        <div className="mt-16 space-y-5">
          <p className="text-balance text-6xl font-bold text-primary-foreground">Fragment</p>
          <p className="text-pretty text-2xl font-semibold leading-9 text-brand-soft">
            흩어진 조건을 하나의 스케줄로
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg p-2 shadow-sm">
          <Image
            src="/favicons/favicon-64.png"
            width={64}
            height={64}
            alt=""
            className="size-full object-contain"
          />
        </span>
        <span className="text-lg font-bold text-foreground">프래그먼트</span>
      </div>
    </div>
  );
}
