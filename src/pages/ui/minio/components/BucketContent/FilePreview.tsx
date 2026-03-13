import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BucketItem } from ".";
import { useMinio } from "@/contexts/Minio/MinioContext";
import Editor from "@monaco-editor/react";
import fileExtensionToLanguage from "./fileExtensionToLanguage.json";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { getMimeTypeFromPath } from "@/lib/mimeType";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: BucketItem;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file: bucketItem,
}) => {
  const { getFileBlob } = useMinio();

  const [url, setUrl] = useState<string>();
  const [fileContent, setFileContent] = useState<string>();
  const [fileType, setFileType] = useState<"image" | "pdf" | "text" | "other">();
  const isText = fileType === "text";
  const isImage = fileType === "image";
  const isPdf = fileType === "pdf";

  function handleDownload() {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = bucketItem.Name;
    a.click();
  }

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | undefined;

    async function loadPreview() {
      if (bucketItem.Type !== "file") return;

      const mimeByExtension = getMimeTypeFromPath(bucketItem.Name);
      const isImageFile = mimeByExtension?.startsWith("image/");
      const isPdfFile = mimeByExtension === "application/pdf";
      const isTextFile = mimeByExtension?.startsWith("text/") || !!fileExtensionToLanguage[bucketItem.Name.split(".").pop()! as keyof typeof fileExtensionToLanguage];
      console.log("Determined file type:", { mimeByExtension, isImageFile, isPdfFile, isTextFile });
      const nextFileType = isImageFile
        ? "image"
        : isPdfFile
          ? "pdf"
          : isTextFile
            ? "text"
            : "other";

      setFileType(nextFileType);
      if (nextFileType === "other") return;
      const blob = await getFileBlob(bucketItem.BucketName, bucketItem.Key.Key!);
      if (!blob) return;
      
      const nextUrl = URL.createObjectURL(blob);

      if (!isMounted) {
        URL.revokeObjectURL(nextUrl);
        return;
      }

      objectUrl = nextUrl;
      setUrl(nextUrl);

      if (nextFileType === "text") {
        setFileContent(await blob.text());
      } else {
        setFileContent(undefined);
      }
    }

    loadPreview();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [bucketItem.BucketName, bucketItem.Key, bucketItem.Type, getFileBlob]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[80%] sm:w-[80%] w-full max-w-[1600px] max-h-[1000px] flex flex-col "
      >
        <DialogHeader>
          <DialogTitle>{bucketItem.Name}</DialogTitle>
        </DialogHeader>
        <div 
         className="flex-1 min-h-0 overflow-hidden">
          {isText && (
            <Editor
              width="100%"
              height="100%"
              language={
                fileExtensionToLanguage[
                  bucketItem.Name.split(
                    "."
                  ).pop()! as keyof typeof fileExtensionToLanguage
                ] ?? "plaintext"
              }
              value={fileContent}
              options={{ readOnly: true }}
            />
          )}
          {isImage && url && (
            <div className="h-full w-full flex justify-center items-center">
              <img
                src={url}
                alt={bucketItem.Name}
                className="h-full w-auto"
              />
            </div>
          )}
          {isPdf && url && (
            <iframe
              src={url}
              title={bucketItem.Name}
              className="w-full h-full border-0"
            />
          )}
          {fileType === "other" && (
            <div className="h-full flex items-center justify-center text-center px-6">
              Preview is not available for this file type.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleDownload}>
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
