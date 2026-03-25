import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadBatchProgress } from "@/contexts/Minio/MinioContext";
import OscarColors from "@/styles";
import { useEffect } from "react";

export default function UploadFileDialog({
  progress,
  onClose,
}: {
  progress: UploadBatchProgress | null;
  onClose: () => void;
}) {
  const isOpen = !!progress;
  const isUploading = !!progress && progress.completed < progress.total;
  const progressPercent = progress
    ? progress.total === 0
      ? 0
      : Math.round((progress.completed / progress.total) * 100)
    : 0;

  useEffect(() => {
    if (!progress || isUploading || progress.failed > 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onClose();
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [isUploading, onClose, progress]);

  const failedResults = progress?.results.filter((result) => !result.success) ?? [];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isUploading) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px] data">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUploading ? "Uploading Files" : "Upload Summary"}
          </DialogTitle>
          <DialogDescription>
            <span className="block mt-2 font-medium text-foreground">
              {isUploading
                ? "Please wait while your files are being uploaded."
                : `Completed ${progress?.completed ?? 0} of ${progress?.total ?? 0} uploads.`}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="w-full">
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className=" h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: failedResults.length > 0 ? OscarColors.Red : OscarColors.Green4,
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {progressPercent}% ({progress?.completed ?? 0}/{progress?.total ?? 0})
          </p>
        </div>

        {progress?.currentFileName && (
          <div className="text-sm text-center text-gray-600">
            Uploading: <span className="font-medium text-gray-900">{progress.currentFileName}</span>
          </div>
        )}

        {!isUploading && (
          <div className="grid gap-2">
            <div className="text-sm text-gray-700">
              Successful: {((progress?.completed ?? 0) - (progress?.failed ?? 0))} | Failed: {progress?.failed ?? 0}
            </div>
            {failedResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded border bg-gray-50 p-3">
                {failedResults.map((result) => (
                  <div key={result.key} className="text-sm text-gray-700">
                    <span className="font-medium">{result.fileName}</span>: {result.error ?? "Upload failed"}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          {!isUploading && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
