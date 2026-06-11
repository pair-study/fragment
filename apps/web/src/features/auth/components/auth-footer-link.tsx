import Link from "next/link";

import { cn } from "@/lib/utils";

type AuthFooterLinkProps = {
  label: string;
  href: string;
  linkText: string;
  className?: string;
};

export function AuthFooterLink({
  label,
  href,
  linkText,
  className,
}: AuthFooterLinkProps) {
  return (
    <p
      className={cn(
        "text-center text-sm font-medium text-muted-foreground",
        className,
      )}
    >
      {label}{" "}
      <Link href={href} className="font-semibold text-primary hover:underline">
        {linkText}
      </Link>
    </p>
  );
}
