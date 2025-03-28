import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { Upload } from "lucide-react";
import useSelectedBucket from "../../hooks/useSelectedBucket";

export default function AddFileButton() {

  const { name: bucketName, path } = useSelectedBucket();
  const [file, setFile] = useState<File>();
  const [isOpen, setIsOpen] = useState(false);
  const { uploadFile } = useMinio();

  const handleUploadFile = async () => {  
    await uploadFile(bucketName!, path, file!);
    setFile(undefined);
    setIsOpen(false);
  };
  
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      if (e.key === "Enter") {
        handleUploadFile();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleUploadFile]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="mainGreen">
          <Upload size={20} className="mr-2" />
          Upload File
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Select File</h4>
          </div>
          <div className="grid gap-2">
            <Input
              type="file"
              id="folderName"
              onChange={(e) => setFile(e.target.files?.[0])}
              placeholder="Enter the folder name"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {setIsOpen(false); setFile(undefined);}}>
              Cancel
            </Button>
            <Button onClick={handleUploadFile}  disabled={!file}>
              Upload
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
