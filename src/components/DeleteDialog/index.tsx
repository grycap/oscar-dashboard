import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  itemNames: string | string[];
}

export default function DeleteDialog({
  isOpen,
  onClose,
  onDelete,
  itemNames,
}: DeleteDialogProps) {
  const itemCount = Array.isArray(itemNames) ? itemNames.length : 1;
  const itemText = itemCount === 1 ? "item" : "items";
  const nameText = Array.isArray(itemNames) ? itemNames.join(", ") : itemNames;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the following {itemText}?
            <span className="block mt-2 font-medium text-foreground">
              {nameText}
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-start">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
