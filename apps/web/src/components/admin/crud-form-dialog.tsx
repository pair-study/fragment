import type { ReactNode } from "react";

import { Button } from "@moyeorak/design-system";
import { X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CrudFormDialogProps = {
  open: boolean;
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  onSave: () => void;
};

export function CrudFormDialog({
  open,
  title,
  description,
  children,
  onClose,
  onSave,
}: CrudFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <div className="flex items-start justify-between gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogClose className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <span className="sr-only">닫기</span>
            <X className="size-5" aria-hidden="true" />
          </DialogClose>
        </div>

        <div className="mt-6 space-y-5">{children}</div>

        <DialogFooter className="mt-8">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="button" variant="brand" onClick={onSave}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
