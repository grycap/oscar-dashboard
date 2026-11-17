import { useEffect, useId, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import updateSystemConfigApi from "@/api/config/updateSystemConfig";
import { useAuth } from "@/contexts/AuthContext";
import RequestButton from "@/components/RequestButton";
import { errorMessage } from "@/lib/error";
import { alert } from "@/lib/alert";
import { isAxiosError } from "axios";

interface Props {
  repositories?: string[];
}

export function AllowedImageRepositoriesEditDialog({ repositories = [] }: Props) {
  const { systemConfig, refreshSystemConfig } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<string[]>(repositories);
  const confirmationDescriptionId = useId();

  useEffect(() => {
    if (!isOpen) return;
    setItems(repositories);
    setInputValue("");
  }, [isOpen, repositories]);

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setItems((prev) => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setInputValue("");
  };

  const deleteItem = (repository: string) => {
    setItems((prev) => prev.filter((item) => item !== repository));
  };

  async function handleSave(updatedRepositories: string[]) {
    if (!systemConfig) return false;

    try {
      await updateSystemConfigApi({
        allowed_image_repositories: updatedRepositories,
      });
      return true;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        alert.error("You are not authorized to update the system configuration.");
      } else {
        alert.error(`Error updating allowed image repositories: ${errorMessage(error)}`);
      }
      return false;
    }
  }

  async function saveRepositories(updatedRepositories: string[]) {
    const saved = await handleSave(updatedRepositories);
    if (!saved) return;

    await refreshSystemConfig();
    setIsConfirmationOpen(false);
    setIsOpen(false);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setIsConfirmationOpen(false);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          tooltipLabel="Edit Allowed Image Repositories"
          className="h-8 w-8 p-0 rounded-md border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Pencil size={15} />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Allowed Image Repositories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-2 w-full">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder="registry.com/project (e.g., docker.io/myproject)"
            />
            <Button type="button" variant="mainGreen" onClick={addItem} className="shrink-0">
              <Plus size={16} className="mr-1" />
              Add
            </Button>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
                No repositories configured.
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {items.map((repository) => (
                  <li
                    key={repository}
                    className="flex items-center justify-between gap-3 p-3 text-sm text-slate-700 dark:text-slate-200"
                  >
                    <span className="truncate font-mono">{repository}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      tooltipLabel="Delete repository"
                      onClick={() => deleteItem(repository)}
                      className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <RequestButton
            type="button"
            variant="mainGreen"
            request={async () => {
              if (items.length === 0) {
                setIsConfirmationOpen(true);
                return;
              }
              await saveRepositories(items);
            }}
          >
            Save
          </RequestButton>
        </div>

        <Dialog open={isConfirmationOpen} onOpenChange={setIsConfirmationOpen}>
          <DialogContent className="sm:max-w-[425px]" aria-describedby={confirmationDescriptionId}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Disable Repository Restriction?
              </DialogTitle>
              <DialogDescription id={confirmationDescriptionId}>
                Saving an empty list will disable the image repository restriction,
                allowing images from any registry. Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsConfirmationOpen(false)}>
                Cancel
              </Button>
              <RequestButton
                type="button"
                variant="destructive"
                request={() => saveRepositories([])}
              >
                Disable Restriction
              </RequestButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
