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
    memoryUnit: "Gi"
  });

  const [errors, setErrors] = useState({
    cpuMax: false,
    memoryMax: false,
    memoryUnit: false
  });

  useEffect(() => {
    if (!isOpen || !user) return;

    setFormData({
      uid: user.user_id ?? "",
      cpuMax: (user.resources.cpu.max / 1000).toString(), // Convert millicores to cores
      memoryMax: bytesSizeToHumanReadable(user.resources.memory.max ?? 0).replace(/([0-9.]+)\s*(\w+)/, '$1'), // Extract the numeric part
      memoryUnit: bytesSizeToHumanReadable(user.resources.memory.max ?? 0).replace(/([0-9.]+)\s*(\w+)/, '$2') === "GB" ? "Gi" : "Mi" // Extract the unit part
    });
    setErrors({
      cpuMax: false,
      memoryMax: false,
      memoryUnit: false
    });
  }, [isOpen, user]);

  const handleSave = async () => {
    const newErrors = {
      cpuMax: !formData.cpuMax,
      memoryMax: !formData.memoryMax,
      memoryUnit: !formData.memoryUnit
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    const cpuMax = Number(formData.cpuMax).toPrecision(3); // Convert cores to millicores
    const memoryMax = `${formData.memoryMax}${formData.memoryUnit}`;
    
    console.log("Saving quota with values:", {
      uid: formData.uid,
      cpuMax,
      memoryMax
    });
    const quotaUpdateRequest: QuotaUpdateRequest = {
      cpu: cpuMax,
      memory: memoryMax
    };

    try {
      await putUserQuotaApi(user.user_id!, quotaUpdateRequest);
      alert.success(`Quota updated for user ${user.user_id}`);
      setIsOpen(false);
    } catch (error) {
      console.log(error)
      alert.error(`Error updating quota for user ${user.user_id}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-[500px] max-h-[90%] gap-4 flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit user quota</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label>UID</Label>
            <Input value={formData.uid} disabled />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
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
          </div>
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