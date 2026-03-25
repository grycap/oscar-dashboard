import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { Trash2, Upload } from "lucide-react";
import useSelectedBucket from "../../hooks/useSelectedBucket";
import { Input } from "@/components/ui/input";
import { useMediaQuery } from "react-responsive";

interface Props {
  disabled?: boolean;
}

export default function AddFileButton({ disabled = false }: Props) {
  const { uploadFiles } = useMinio();
  const { name: bucketName, path } = useSelectedBucket();
  const [files, setFiles] = useState<File[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSmallScreen = useMediaQuery({ maxWidth: 799 });

  const resetSelection = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadFiles = async () => {
    if (!bucketName || files.length === 0) return;

    await uploadFiles(bucketName, path, files);
    resetSelection();
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      if (e.key === "Enter" && files.length > 0) {
        handleUploadFiles();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [files.length, handleUploadFiles, isOpen]);

  const appendFiles = (newFiles: FileList | File[]) => {
    const incomingFiles = Array.from(newFiles);

    setFiles((currentFiles) => {
      const nextFiles = [...currentFiles];

      for (const file of incomingFiles) {
        const alreadyAdded = nextFiles.some(
          (currentFile) =>
            currentFile.name === file.name &&
            currentFile.size === file.size &&
            currentFile.lastModified === file.lastModified
        );

        if (!alreadyAdded) {
          nextFiles.push(file);
        }
      }

      return nextFiles;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      appendFiles(event.dataTransfer.files);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setFiles((currentFiles) =>
      currentFiles.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      )
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const singleImageFile =
    files.length === 1 && files[0].type.startsWith("image/") ? files[0] : null;

  useEffect(() => {
    if (!singleImageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(singleImageFile);
    setImagePreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [singleImageFile]);

  const renderUploadView = () => (
    <div className="grid gap-2 w-[100%]">
      <Label htmlFor="file">{singleImageFile ? "Preview" : "Select files"}</Label>
      <Input
        id="file"
        type="file"
        multiple
        ref={fileInputRef}
        onChange={(e) =>
          e.target.files && appendFiles(e.target.files)
        }
        className="hidden"
      />
      {files.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed cursor-pointer border-gray-300 rounded-lg p-4 text-center flex flex-col items-center justify-center gap-2"
        >
          <Upload className="h-8 w-8" />
          Drag and drop your files here or click to open file explorer
          <Button>Select files</Button>
        </div>
      ) : (
        <div className="bg-muted rounded-lg w-[100%] p-3">
          {singleImageFile && (
            <div className="mb-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed cursor-pointer border-gray-300 rounded-lg text-center flex flex-col items-center justify-center"
              >
                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="Uploaded file"
                    className="max-w-full h-auto max-h-[200px] rounded"
                  />
                )}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-sm text-muted-foreground">
              {files.length} selected
            </span>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Add more
            </Button>
          </div>
          <div className="grid gap-2 max-h-52 overflow-y-auto">
            {files.map((file) => (
              <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center justify-between gap-3 rounded border bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{file.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file)}
                  aria-label={`Remove ${file.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          resetSelection();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" style={{gap: 8}} disabled={disabled}>
          <Upload size={20} className="h-5 w-5" />
          {!isSmallScreen && "Upload Files"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Upload Files</h4>
          </div>
          {renderUploadView()}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                resetSelection();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadFiles} disabled={files.length === 0}>
              Upload
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
