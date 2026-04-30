import { useEffect, useState } from "react";
import { ClusterUserQuota, QuotaUpdateRequest } from "@/models/clusterUserQuota";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { alert } from "@/lib/alert";
import putUserQuotaApi from "@/api/quotas/putQuotaApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorMessage } from "@/lib/error";

const splitQuantity = (value?: string, fallbackUnit = "Gi") => {
  const match = value?.match(/^([0-9.]+)\s*([A-Za-z]+)$/);
  return {
    value: match?.[1] ?? "",
    unit: match?.[2] ?? fallbackUnit,
  };
};

const bytesToEditableQuantity = (bytes?: number) => {
  if (bytes === undefined || Number.isNaN(bytes)) {
    return { value: "", unit: "Gi" };
  }

  const gib = bytes / 1024 ** 3;
  if (gib >= 1 || bytes % 1024 ** 3 === 0) {
    return { value: Number(gib.toFixed(2)).toString(), unit: "Gi" };
  }

  return { value: Number((bytes / 1024 ** 2).toFixed(2)).toString(), unit: "Mi" };
};

const isValidNumber = (value: string) => {
  if (value.trim() === "") return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
};

interface EditPopoverProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: ClusterUserQuota;
  onSaved?: () => Promise<void> | void;
}

function EditPopover({ isOpen, setIsOpen, user, onSaved }: EditPopoverProps) {
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

  const [validationMessage, setValidationMessage] = useState("");
  const [saving, setSaving] = useState(false);

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

    const memory = bytesToEditableQuantity(user.resources?.memory.max);
    const volumeDisk = splitQuantity(user.volumes?.disk.max);
    const maxDiskPerVolume = splitQuantity(user.volumes?.max_disk_per_volume);
    const minDiskPerVolume = splitQuantity(user.volumes?.min_disk_per_volume, "Mi");

    setFormData({
      uid: user.user_id ?? "",
      cpuMax: user.resources ? (user.resources.cpu.max / 1000).toString() : "",
      memoryMax: memory.value,
      memoryUnit: memory.unit,
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
    setValidationMessage("");
  }, [isOpen, user]);

  const handleSave = async () => {
    const newErrors = {
      cpuMax: Boolean(user.resources && !isValidNumber(formData.cpuMax)),
      memoryMax: Boolean(user.resources && !isValidNumber(formData.memoryMax)),
      memoryUnit: Boolean(user.resources && !formData.memoryUnit),
      volumeDiskMax: Boolean(user.volumes && !isValidNumber(formData.volumeDiskMax)),
      volumeDiskUnit: Boolean(user.volumes && !formData.volumeDiskUnit),
      volumesMax: Boolean(user.volumes && !isValidNumber(formData.volumesMax)),
      maxDiskPerVolume: Boolean(user.volumes && !isValidNumber(formData.maxDiskPerVolume)),
      maxDiskPerVolumeUnit: Boolean(user.volumes && !formData.maxDiskPerVolumeUnit),
      minDiskPerVolume: Boolean(user.volumes && !isValidNumber(formData.minDiskPerVolume)),
      minDiskPerVolumeUnit: Boolean(user.volumes && !formData.minDiskPerVolumeUnit),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      setValidationMessage("Review the highlighted fields before saving.");
      return;
    }
    setValidationMessage("");

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
    setSaving(true);
    try {
      await putUserQuotaApi(user.user_id!, quotaUpdateRequest);
      await onSaved?.();
      alert.success(`Quota updated for user ${user.user_id}`);
      setIsOpen(false);
    } catch (error) {
      alert.error(`Error updating quota for user ${user.user_id}: ${errorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[720px] max-h-[90%] gap-4 flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit user quota</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3">
          {validationMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {validationMessage}
            </div>
          )}

          <div>
            <Label>UID</Label>
            <Input value={formData.uid} disabled />
          </div>

          {user.resources && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
            <div>
              <Label>CPU Max (cores)</Label>
              <Input
                type="number"
                step={0.1}
                min={0}
                value={formData.cpuMax}
                className={errors.cpuMax ? "border-red-500 focus:border-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, cpuMax: e.target.value });
                  if (errors.cpuMax) setErrors({ ...errors, cpuMax: false });
                  if (validationMessage) setValidationMessage("");
                }}
                placeholder="Enter max CPU cores"
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <Label>Max RAM</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.memoryMax}
                  className={errors.memoryMax ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                    setFormData({ ...formData, memoryMax: e.target.value });
                    if (errors.memoryMax) setErrors({ ...errors, memoryMax: false });
                    if (validationMessage) setValidationMessage("");
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
                  <SelectItem value="Gi">GiB</SelectItem>
                  <SelectItem value="Mi">MiB</SelectItem>
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
                  min={0}
                  value={formData.volumeDiskMax}
                  className={errors.volumeDiskMax ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                    setFormData({ ...formData, volumeDiskMax: e.target.value });
                    if (errors.volumeDiskMax) setErrors({ ...errors, volumeDiskMax: false });
                    if (validationMessage) setValidationMessage("");
                  }}
                  placeholder="Enter max volume disk quota"
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
                  <SelectItem value="Gi">GiB</SelectItem>
                  <SelectItem value="Mi">MiB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Volumes Max</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={formData.volumesMax}
                className={errors.volumesMax ? "border-red-500 focus:border-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, volumesMax: e.target.value });
                  if (errors.volumesMax) setErrors({ ...errors, volumesMax: false });
                  if (validationMessage) setValidationMessage("");
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
                    min={0}
                    value={formData.maxDiskPerVolume}
                    className={errors.maxDiskPerVolume ? "border-red-500 focus:border-red-500" : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, maxDiskPerVolume: e.target.value });
                      if (errors.maxDiskPerVolume) setErrors({ ...errors, maxDiskPerVolume: false });
                      if (validationMessage) setValidationMessage("");
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
                    <SelectItem value="Gi">GiB</SelectItem>
                    <SelectItem value="Mi">MiB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                  <Label>Min Disk Per Volume</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.minDiskPerVolume}
                    className={errors.minDiskPerVolume ? "border-red-500 focus:border-red-500" : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, minDiskPerVolume: e.target.value });
                      if (errors.minDiskPerVolume) setErrors({ ...errors, minDiskPerVolume: false });
                      if (validationMessage) setValidationMessage("");
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
                    <SelectItem value="Gi">GiB</SelectItem>
                    <SelectItem value="Mi">MiB</SelectItem>
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
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving" : "Save changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditPopover;
