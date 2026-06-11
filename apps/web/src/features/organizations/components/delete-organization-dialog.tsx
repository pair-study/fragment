"use client";

import { AlertTriangle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DeleteOrganizationDialogProps = {
  activeWorkerCount: number;
};

export function DeleteOrganizationDialog({
  activeWorkerCount,
}: DeleteOrganizationDialogProps) {
  const blocked = activeWorkerCount > 0;

  if (blocked) {
    return (
      <Button type="button" variant="destructive" disabled>
        조직 삭제
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive">
          조직 삭제
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex size-10 items-center justify-center rounded-full bg-status-cancelled-subtle text-status-cancelled">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <AlertDialogTitle>조직을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            조직을 삭제하면 복구할 수 없습니다. 삭제하시겠습니까? 삭제된
            조직의 근태·급여 데이터는 3년 동안 보존됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction>조직 삭제</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
