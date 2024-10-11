import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMinio } from "@/contexts/Minio/MinioContext";
import { Plus } from "lucide-react";
import useSelectedBucket from "../../hooks/useSelectedBucket";

export default function AddFolderButton() {
  const { name: bucketName, path } = useSelectedBucket();
  const [folderName, setFolderName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { createFolder } = useMinio();

  const handleCreateFolder = async () => {
    await createFolder(bucketName as string, path + folderName);
    setFolderName("");
    setIsOpen(false);
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      if (e.key === "Enter") {
        handleCreateFolder();
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCreateFolder]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="mainGreen">
          <Plus size={20} className="mr-2" />
          Crear Carpeta
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Crear Carpeta</h4>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="folderName">Nombre de la Carpeta</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Ingrese el nombre de la carpeta"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder} disabled={!folderName.trim()}>
              Crear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
