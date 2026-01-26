import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OscarColors from "@/styles";
import { useState, useEffect } from "react";

export default function UploadFileDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (isUploading: boolean) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen && !isUploading) {
      // Reset progress when dialog opens
      setProgress(0);
      setIsUploading(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isUploading) return;

    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        
        if (isUploading && !isOpen) {
          clearInterval(interval);
          // Close dialog after a brief delay when complete
          setTimeout(() => {
            setIsUploading(false);
          }, 500);
          return 100;
        }
        if (prev >= 92) {
          return prev;
        }
        return prev + 2;
      });
    }, 46);

    return () => clearInterval(interval);
  }, [isUploading, isOpen]);

  return (
    <Dialog open={isUploading} onOpenChange={() => { setIsUploading(false); setIsOpen(false); }} >
      <DialogContent className="sm:max-w-[425px] data" >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Uploading File
          </DialogTitle>
          <DialogDescription>
            <span className="block mt-2 font-medium text-foreground">
              Please wait while your file is being uploaded...
            </span>
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Bar Container */}
        <div className="w-full">
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className=" h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%`, backgroundColor: OscarColors.Green4 }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {progress}%
          </p>
        </div>

        <DialogFooter className="sm:justify-start">
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
