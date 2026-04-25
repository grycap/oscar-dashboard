import { useEffect, useState } from "react";
import { ClusterUserQuota, QuotaUpdateRequest } from "@/models/clusterUserQuota";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { alert } from "@/lib/alert";
import putUserQuotaApi from "@/api/quotas/putQuotaApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bytesSizeToHumanReadable } from "@/lib/utils";
import { errorMessage } from "@/lib/error";

const splitQuantity = (value?: string, fallbackUnit = "Gi") => {
  const match = value?.match(/^([0-9.]+)\s*([A-Za-z]+)$/);
  return {
    value: match?.[1] ?? "",
    unit: match?.[2] ?? fallbackUnit,
  };
};

interface EditPopoverProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: ClusterUserQuota;
}

function EditPopover({ isOpen, setIsOpen, user }: EditPopoverProps) {
  const [formData, setFormData] = useState({
    uid: user.user_id ?? "",
    cpuMax: "",
    memoryMax: "",
    memoryUnit: "Gi",
    volumeDiskMax: "",
    volumeDiskUnit: "Gi",
    volumesMax: "",
    maxDiskPerVolume: "",
    maxDiskPerVolumeUnit: "Gi",
    minDiskPerVolume: "",
    minDiskPerVolumeUnit: "Mi",
  });

  const [errors, setErrors] = useState({
    cpuMax: false,
    memoryMax: false,
    memoryUnit: false,
    volumeDiskMax: false,
    volumeDiskUnit: false,
    volumesMax: false,
    maxDiskPerVolume: false,
    maxDiskPerVolumeUnit: false,
    minDiskPerVolume: false,
    minDiskPerVolumeUnit: false,
  });

  useEffect(() => {
    if (!isOpen || !user) return;

    const memory = bytesSizeToHumanReadable(user.resources?.memory.max ?? 0);
    const volumeDisk = splitQuantity(user.volumes?.disk.max);
    const maxDiskPerVolume = splitQuantity(user.volumes?.max_disk_per_volume);
    const minDiskPerVolume = splitQuantity(user.volumes?.min_disk_per_volume, "Mi");

    setFormData({
      uid: user.user_id ?? "",
      cpuMax: user.resources ? (user.resources.cpu.max / 1000).toString() : "",
      memoryMax: user.resources ? memory.replace(/([0-9.]+)\s*(\w+)/, "$1") : "",
      memoryUnit: memory.replace(/([0-9.]+)\s*(\w+)/, "$2") === "GB" ? "Gi" : "Mi",
      volumeDiskMax: volumeDisk.value,
      volumeDiskUnit: volumeDisk.unit,
      volumesMax: user.volumes?.volumes.max ?? "",
      maxDiskPerVolume: maxDiskPerVolume.value,
      maxDiskPerVolumeUnit: maxDiskPerVolume.unit,
      minDiskPerVolume: minDiskPerVolume.value,
      minDiskPerVolumeUnit: minDiskPerVolume.unit,
    });
    setErrors({
      cpuMax: false,
      memoryMax: false,
      memoryUnit: false,
      volumeDiskMax: false,
      volumeDiskUnit: false,
      volumesMax: false,
      maxDiskPerVolume: false,
      maxDiskPerVolumeUnit: false,
      minDiskPerVolume: false,
      minDiskPerVolumeUnit: false,
    });
  }, [isOpen, user]);

  const handleSave = async () => {
    const newErrors = {
      cpuMax: Boolean(user.resources && !formData.cpuMax),
      memoryMax: Boolean(user.resources && !formData.memoryMax),
      memoryUnit: Boolean(user.resources && !formData.memoryUnit),
      volumeDiskMax: Boolean(user.volumes && !formData.volumeDiskMax),
      volumeDiskUnit: Boolean(user.volumes && !formData.volumeDiskUnit),
      volumesMax: Boolean(user.volumes && !formData.volumesMax),
      maxDiskPerVolume: Boolean(user.volumes && !formData.maxDiskPerVolume),
      maxDiskPerVolumeUnit: Boolean(user.volumes && !formData.maxDiskPerVolumeUnit),
      minDiskPerVolume: Boolean(user.volumes && !formData.minDiskPerVolume),
      minDiskPerVolumeUnit: Boolean(user.volumes && !formData.minDiskPerVolumeUnit),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    const quotaUpdateRequest: QuotaUpdateRequest = {};
    if (user.resources) {
      quotaUpdateRequest.cpu = Number(formData.cpuMax).toString();
      quotaUpdateRequest.memory = `${formData.memoryMax}${formData.memoryUnit}`;
    }
    if (user.volumes) {
      quotaUpdateRequest.volumes = {
        disk: `${formData.volumeDiskMax}${formData.volumeDiskUnit}`,
        volumes: formData.volumesMax,
        max_disk_per_volume: `${formData.maxDiskPerVolume}${formData.maxDiskPerVolumeUnit}`,
        min_disk_per_volume: `${formData.minDiskPerVolume}${formData.minDiskPerVolumeUnit}`,
      };
    }
    try {
      await putUserQuotaApi(user.user_id!, quotaUpdateRequest);
      alert.success(`Quota updated for user ${user.user_id}`);
      setIsOpen(false);
    } catch (error) {
      console.log(error)
      alert.error(`Error updating quota for user ${user.user_id}: ${errorMessage(error)}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[720px] max-h-[90%] gap-4 flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit user quota</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label>UID</Label>
            <Input value={formData.uid} disabled />
          </div>

          {user.resources && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
            <div>
              <Label>CPU Max</Label>
              <Input
                type="number"
                step={0.1}
                value={formData.cpuMax}
                className={errors.cpuMax ? "border-red-500 focus:border-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, cpuMax: e.target.value });
                  if (errors.cpuMax) setErrors({ ...errors, cpuMax: false });
                }}
                placeholder="Enter max CPU cores"
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <Label>Max RAM</Label>
                <Input
                  type="number"
                  value={formData.memoryMax}
                  className={errors.memoryMax ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                    setFormData({ ...formData, memoryMax: e.target.value });
                    if (errors.memoryMax) setErrors({ ...errors, memoryMax: false });
                  }}
                  placeholder="Enter max memory RAM"
                />
              </div>
              <Select
                value={formData.memoryUnit}
                onValueChange={(value) =>
                  setFormData({ ...formData, memoryUnit: value })
                }
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue id="memory-unit" placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gi">GB</SelectItem>
                  <SelectItem value="Mi">MB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>}

          {user.volumes && <div className="grid grid-cols-1 gap-3 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <Label>Volume Disk Max</Label>
                <Input
                  type="number"
                  value={formData.volumeDiskMax}
                  className={errors.volumeDiskMax ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                    setFormData({ ...formData, volumeDiskMax: e.target.value });
                    if (errors.volumeDiskMax) setErrors({ ...errors, volumeDiskMax: false });
                  }}
                  placeholder="Enter visible volume disk quota"
                />
              </div>
              <Select
                value={formData.volumeDiskUnit}
                onValueChange={(value) =>
                  setFormData({ ...formData, volumeDiskUnit: value })
                }
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue id="volume-disk-unit" placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gi">GB</SelectItem>
                  <SelectItem value="Mi">MB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Volumes Max</Label>
              <Input
                type="number"
                value={formData.volumesMax}
                className={errors.volumesMax ? "border-red-500 focus:border-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, volumesMax: e.target.value });
                  if (errors.volumesMax) setErrors({ ...errors, volumesMax: false });
                }}
                placeholder="Enter max number of managed volumes"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                  <Label>Max Disk Per Volume</Label>
                  <Input
                    type="number"
                    value={formData.maxDiskPerVolume}
                    className={errors.maxDiskPerVolume ? "border-red-500 focus:border-red-500" : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, maxDiskPerVolume: e.target.value });
                      if (errors.maxDiskPerVolume) setErrors({ ...errors, maxDiskPerVolume: false });
                    }}
                    placeholder="Enter max volume size"
                  />
                </div>
                <Select
                  value={formData.maxDiskPerVolumeUnit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, maxDiskPerVolumeUnit: value })
                  }
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue id="max-volume-disk-unit" placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gi">GB</SelectItem>
                    <SelectItem value="Mi">MB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                  <Label>Min Disk Per Volume</Label>
                  <Input
                    type="number"
                    value={formData.minDiskPerVolume}
                    className={errors.minDiskPerVolume ? "border-red-500 focus:border-red-500" : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, minDiskPerVolume: e.target.value });
                      if (errors.minDiskPerVolume) setErrors({ ...errors, minDiskPerVolume: false });
                    }}
                    placeholder="Enter min volume size"
                  />
                </div>
                <Select
                  value={formData.minDiskPerVolumeUnit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, minDiskPerVolumeUnit: value })
                  }
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue id="min-volume-disk-unit" placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gi">GB</SelectItem>
                    <SelectItem value="Mi">MB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>}
        </div>

        <DialogFooter>
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditPopover;
