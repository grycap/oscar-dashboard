import createServiceApi from "@/api/services/createServiceApi";
import RequestButton from "@/components/RequestButton";
import StorageSelectForm, { StorageSelectFormRef } from "@/components/StorageSelectForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { errorMessage } from "@/lib/error";
import {
  fetchFromGitHubOptions,
  generateReadableName,
  genRandomString,
  getAllowedVOs,
  isVersionLower,
} from "@/lib/utils";
import yamlToServices from "@/pages/ui/services/components/FDL/utils/yamlToService";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { Service } from "@/pages/ui/services/models/service";
import OscarColors from "@/styles";
import { Plus, RefreshCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FILEBROWSER_FDL_URL =
  "https://raw.githubusercontent.com/grycap/oscar-filebrowser/refs/heads/main/fdl.yml";
const FILEBROWSER_SCRIPT_URL =
  "https://raw.githubusercontent.com/grycap/oscar-filebrowser/refs/heads/main/script.sh";

type StorageMode = "volume" | "bucket";

function FileBrowserFormPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const { systemConfig, authData, clusterInfo } = useAuth();
  const { refreshServices } = useServicesContext();
  const oidcGroups = getAllowedVOs(systemConfig, authData);
  const storageFormRef = useRef<StorageSelectFormRef | null>(null);

  function nameService() {
    return (
      `filebrowser-${generateReadableName(6)}-` +
      `${genRandomString(8).toLowerCase()}`
    );
  }

  const [formData, setFormData] = useState({
    name: "",
    cpuCores: "0.5",
    memoryRam: "512",
    memoryUnit: "Mi",
    storageMode: "volume" as StorageMode,
    vo: "",
    token: "",
  });

  const [errors, setErrors] = useState({
    name: false,
    cpuCores: false,
    memoryRam: false,
    storage: false,
    vo: false,
  });

  useEffect(() => {
    if (oidcGroups.length > 0 && !formData.vo) {
      setFormData((prev) => ({ ...prev, vo: oidcGroups[0] }));
    }
  }, [formData.vo, oidcGroups]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      name: nameService(),
      cpuCores: "0.5",
      memoryRam: "512",
      memoryUnit: "Mi",
      storageMode: "volume",
      token: genRandomString(128),
    }));
    setErrors({
      name: false,
      cpuCores: false,
      memoryRam: false,
      storage: false,
      vo: false,
    });
  }, [isOpen]);

  const handleDeploy = async () => {

    

    const storageValid = storageFormRef.current ? storageFormRef.current.validate() : false;
    const storageConfig = storageFormRef.current ? storageFormRef.current!.getStorageConfig() : { mainStorage: "none", bucket: "", volume: "", volumeSize: "" };
    const selectedBucket = storageConfig.bucket.trim();
    const selectedVolume = storageConfig.volume.trim();

    const newErrors = {
      name: !formData.name,
      cpuCores: !formData.cpuCores,
      memoryRam: !formData.memoryRam,
      storage: formData.storageMode === "volume" ? !selectedVolume : !selectedBucket,
      vo: !formData.vo,
      volume: formData.storageMode === "volume" && !storageConfig.volume,
      bucket: formData.storageMode === "bucket" && !storageConfig.bucket,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean) || !storageValid) {
      alert.error("Please fill in all required fields");
      return;
    }
    

    try {
      const fdlResponse = await fetch(FILEBROWSER_FDL_URL, fetchFromGitHubOptions);
      const fdlText = await fdlResponse.text();
      const scriptResponse = await fetch(
        FILEBROWSER_SCRIPT_URL,
        fetchFromGitHubOptions
      );
      const scriptText = await scriptResponse.text();
      const services = yamlToServices(fdlText, scriptText, (!!clusterInfo && !isVersionLower(clusterInfo.version, "v4.1.0")));

      if (!services?.length) {
        throw new Error("No services found");
      }

      const service = services[0];
      const serviceName = formData.name || nameService();
      const sourcePath = formData.storageMode === "volume" ? `/mnt/volumes/${storageConfig.volume}` : `/mnt/${selectedBucket}`;

      const modifiedService: Service = {
        ...service,
        name: serviceName,
        vo: formData.vo,
        token: formData.token,
        memory: `${formData.memoryRam}${formData.memoryUnit}`,
        cpu: formData.cpuCores,
        environment: {
          variables: {
            ...service.environment.variables,
            FILEBROWSER_SOURCE_PATH: sourcePath,
            FILEBROWSER_JWT_SUB: "user",
          },
          secrets: {
            ...service.environment.secrets,
          },
        },
        labels: {
          ...service.labels,
          filebrowser: "true",
        },
        mount: undefined,
        ...(storageConfig.bucket ? {
          mount: {
            ...service.mount,
            path: storageConfig.bucket ?? "/notebook",
            storage_provider: service.mount?.storage_provider ?? "minio.default",
          },
        } : {}),
        volume: undefined,
        ...(storageConfig.volume ? { 
          volume: {
            name: storageConfig.volume,
            size: storageConfig.volumeSize ? `${storageConfig.volumeSize.trim()}Gi` : undefined,
            mount_path: `/mnt/volumes/${storageConfig.volume}`,
          }
        } : {}),
      };

      await createServiceApi(modifiedService);
      refreshServices();

      alert.success("File Browser instance deployed");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert.error(`Error deploying File Browser instance: ${errorMessage(error)}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="mainGreen"
          tooltipLabel="New File Browser Instance"
          onClick={() => {
            setIsOpen(false);
          }}
        >
          <Plus size={20} className="mr-2" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90%] max-w-[600px] gap-4 flex flex-col">
        <DialogHeader>
          <DialogTitle>
            <span style={{ color: OscarColors.DarkGrayText }}>
              File Browser Instance Configuration
            </span>
          </DialogTitle>
        </DialogHeader>
        <hr />
        <div className="grid grid-cols-1 gap-y-2 sm:gap-x-2 overflow-y-auto">
          <div>
            <div className="flex flex-row items-center">
              <Label>Service name</Label>
              <Button
                variant="link"
                size="icon"
                onClick={() => setFormData({ ...formData, name: nameService() })}
              >
                <RefreshCcwIcon size={16} />
              </Button>
            </div>
            <Input
              id="name"
              placeholder="Enter service name"
              value={formData.name}
              className={errors.name ? "border-red-500 focus:border-red-500" : ""}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) {
                  setErrors({ ...errors, name: false });
                }
              }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
            <div>
              <Label htmlFor="cpu-cores">CPU Cores</Label>
              <Input
                id="cpu-cores"
                type="number"
                step={0.1}
                placeholder="Enter CPU Cores"
                value={formData.cpuCores}
                className={errors.cpuCores ? "border-red-500 focus:border-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, cpuCores: e.target.value });
                  if (errors.cpuCores) {
                    setErrors({ ...errors, cpuCores: false });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <Label htmlFor="memory-ram">RAM</Label>
                <Input
                  id="memory-ram"
                  type="number"
                  step={formData.memoryUnit === "Gi" ? 1 : 128}
                  placeholder="Enter RAM"
                  value={formData.memoryRam}
                  className={errors.memoryRam ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                    setFormData({ ...formData, memoryRam: e.target.value });
                    if (errors.memoryRam) {
                      setErrors({ ...errors, memoryRam: false });
                    }
                  }}
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
                  <SelectItem value="Gi">Gi</SelectItem>
                  <SelectItem value="Mi">Mi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="vo">VO</Label>
            <Select
              value={formData.vo}
              onValueChange={(value) => {
                setFormData({ ...formData, vo: value });
                if (errors.vo) {
                  setErrors({ ...errors, vo: false });
                }
              }}
            >
              <SelectTrigger
                id="vo"
                className={errors.vo ? "border-red-500 focus:border-red-500" : ""}
              >
                <SelectValue placeholder="Select a VO" />
              </SelectTrigger>
              <SelectContent>
                {oidcGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="storage-mode">Storage</Label>
            <Select
              value={formData.storageMode}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  storageMode: value as StorageMode,
                });
                if (errors.storage) {
                  setErrors({ ...errors, storage: false });
                }
              }}
            >
              <SelectTrigger id="storage-mode">
                <SelectValue placeholder="Select storage type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="bucket">MinIO bucket</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <StorageSelectForm 
            ref={storageFormRef}
            manageBucket={formData.storageMode === "bucket"}
            manageVolume={formData.storageMode === "volume"}
          />
        </div>
        <DialogFooter>
          <RequestButton
            className="grid grid-cols-[auto] sm:grid-cols-1 gap-2"
            variant="mainGreen"
            request={handleDeploy}
          >
            Deploy
          </RequestButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FileBrowserFormPopover;
