import { IconButton } from "@moyeorak/design-system";
import { Pencil, Trash2 } from "lucide-react";

type RowActionsProps = {
  editLabel?: string;
  deleteLabel?: string;
  onEdit: () => void;
  onDelete: () => void;
};

export function RowActions({
  editLabel = "수정",
  deleteLabel = "삭제",
  onEdit,
  onDelete,
}: RowActionsProps) {
  return (
    <div className="flex justify-end gap-0 sm:gap-1">
      <IconButton
        size="sm"
        aria-label={editLabel}
        className="rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        onClick={onEdit}
      >
        <Pencil className="size-4" />
      </IconButton>
      <IconButton
        size="sm"
        aria-label={deleteLabel}
        className="rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  );
}
