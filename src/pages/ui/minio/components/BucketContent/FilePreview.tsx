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

const imageExtensions = new Set([
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
]);

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
  const [fileType, setFileType] = useState<"image" | "text" | "other">();
  const isText = fileType === "text";
  const isImage = fileType === "image";
  const fileExtension = bucketItem.Name.split(".").pop()?.toLowerCase();

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

      const blob = await getFileBlob(bucketItem.BucketName, bucketItem.Key.Key!);
      if (!blob) return;

      const nextFileType =
        blob.type.startsWith("image/") || (fileExtension && imageExtensions.has(fileExtension))
          ? "image"
          : "text";
      const nextUrl = URL.createObjectURL(blob);

      if (!isMounted) {
        URL.revokeObjectURL(nextUrl);
        return;
      }

      objectUrl = nextUrl;
      setUrl(nextUrl);
      setFileType(nextFileType);

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
  }, [bucketItem.BucketName, bucketItem.Key, bucketItem.Type, fileExtension, getFileBlob]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        style={{
          maxWidth: "80vw",
          width: "80vw",
        }}
      >
        <DialogHeader>
          <DialogTitle>{bucketItem.Name}</DialogTitle>
        </DialogHeader>
        <div style={{ height: "70vh", overflow: "hidden" }}>
          {isText && (
            <Editor
              width="100%"
              height="100%"
              language={
                fileExtensionToLanguage[
                  bucketItem.Name.split(
                    "."
                  ).pop()! as keyof typeof fileExtensionToLanguage
                ]
              }
              value={fileContent}
              options={{ readOnly: true }}
            />
          )}
          {isImage && url && (
            <div
              style={{
                height: "100%",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <img
                src={url}
                alt={bucketItem.Name}
                style={{ height: "100%", width: "auto" }}
              />
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
