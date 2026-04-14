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
  const isOpen = progress !== null;
  const isUploading = !!progress && progress.completed < progress.results.length;
  const progressPercent = progress
    ? progress.results.length === 0
      ? 0
      : Math.round((progress.completed / progress.results.length) * 100)
    : 0;

  const failedResults = progress?.results.filter((result) => !result.success) ?? [];


  useEffect(() => {
    if (isOpen && progressPercent >= 100 && failedResults.length === 0) {
      const timer = setTimeout(() => {
        onClose();
      }, 900); // Auto-close after 2 seconds

      return () => clearTimeout(timer); // Cleanup timer 
    }
  }, [isOpen, progressPercent, failedResults, onClose]);


  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-[425px]" >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUploading ? "Uploading Files" : "Upload Summary"}
          </DialogTitle>
          <DialogDescription>
            <span className="block mt-2 font-medium text-foreground">
              {isUploading
                ? "Please wait while your files are being uploaded."
                : `Completed ${progress?.completed ?? 0} of ${progress?.results.length ?? 0} uploads.`}
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
            {progressPercent}% ({progress?.completed ?? 0}/{progress?.results.length ?? 0})
          </p>
        </div>

        {progress?.currentFileName && (
          <div className="text-sm text-center text-gray-600">
            Uploading: <span className="font-medium text-gray-900">{progress.currentFileName}</span>
          </div>
        )}

        {!isUploading && !progress?.currentFileName && (
          <div className="grid gap-2 text-center">
            <div className="text-sm text-gray-700">
              Successful: {((progress?.completed ?? 0) - (progress?.failed ?? 0))} | Failed: {progress?.failed ?? 0}
            </div>
            {failedResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded border bg-gray-50 p-3 text-left">
                {failedResults.map((result) => (
                  <div key={result.key} className="text-sm text-red-700">
                    <span className="font-medium text-sm text-gray-700">{result.fileName}</span>: {result.error ?? "Upload failed"}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          <Button className="w-full" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
