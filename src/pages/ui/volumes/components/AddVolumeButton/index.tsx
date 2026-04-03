import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useVolumes } from "@/contexts/Volumes/VolumesContext";
import { ManagedVolumeCreateRequest } from "@/pages/ui/services/models/service";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_VOLUME_SIZE = "1";

const emptyVolume: ManagedVolumeCreateRequest = {
  name: "",
  size: "1Gi",
};

function isValidVolumeSize(value: string): boolean {
  const trimmedValue = value.trim();

  if (!/^\d+(\.\d+)?$/.test(trimmedValue)) {
    return false;
  }

  return Number(trimmedValue) > 0;
}

export default function AddVolumeButton() {
  const [formVolume, setFormVolume] =
    useState<ManagedVolumeCreateRequest>(emptyVolume);
  const [volumeSizeInput, setVolumeSizeInput] = useState(DEFAULT_VOLUME_SIZE);
  const [isOpen, setIsOpen] = useState(false);
  const { createVolume } = useVolumes();
  const volumeNameIsValid = formVolume.name.trim().length > 0;
  const volumeSizeIsValid = isValidVolumeSize(volumeSizeInput);
  const formIsValid = volumeNameIsValid && volumeSizeIsValid;

  const handleCreateVolume = async () => {
    if (!formIsValid) {
      return;
    }

    await createVolume(formVolume);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setFormVolume(emptyVolume);
      setVolumeSizeInput(DEFAULT_VOLUME_SIZE);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      if (e.key === "Enter") {
        void handleCreateVolume();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formIsValid, isOpen, formVolume]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="mainGreen" style={{ gap: 8 }}>
          <Plus size={20} />
          New
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">New Volume</h4>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="volumeName">Volume Name:</Label>
            <Input
              id="volumeName"
              value={formVolume.name}
              onChange={(e) => {
                setFormVolume((prev) => ({
                  ...prev,
                  name: e.target.value,
                }));
              }}
              placeholder="Enter volume name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="volumeSize">Size (Gi):</Label>
            <div className="grid gap-1">
              <Input
                id="volumeSize"
                type="number"
                min="0.1"
                step="any"
                inputMode="decimal"
                value={volumeSizeInput}
                onChange={(e) => {
                  const nextValue = e.target.value;

                  setVolumeSizeInput(nextValue);
                  setFormVolume((prev) => ({
                    ...prev,
                    size: `${nextValue.trim()}Gi`,
                  }));
                }}
                placeholder="1"
              />
              {!volumeSizeIsValid && (
                <span className="text-xs text-red-500">
                  Enter a positive integer or decimal value.
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateVolume()}
              disabled={!formIsValid}
            >
              Create
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
