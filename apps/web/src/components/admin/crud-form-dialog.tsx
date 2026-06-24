import type { ReactNode } from "react";

import { Button } from "@moyeorak/design-system";
import { X } from "lucide-react";

type CrudFormDialogProps = {
  open: boolean;
  title: string;
  description: string;
  titleId: string;
  children: ReactNode;
  onClose: () => void;
  onSave: () => void;
};

export function CrudFormDialog({
  open,
  title,
  description,
  titleId,
  children,
  onClose,
  onSave,
}: CrudFormDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-modal"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="닫기"
            onClick={onClose}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 space-y-5">{children}</div>

        <div className="mt-8 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onSave}>
            저장
          </Button>
        </div>
      </section>
    </div>
  );
}
