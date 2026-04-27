import createServiceApi from "@/api/services/createServiceApi";
import getVolumesApi from "@/api/volumes/getVolumesApi";
import RequestButton from "@/components/RequestButton";
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
import useGetPrivateBuckets from "@/hooks/useGetPrivateBuckets";
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
import { ManagedVolume, Service } from "@/pages/ui/services/models/service";
import OscarColors from "@/styles";
import { Plus, RefreshCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";

const FILEBROWSER_FDL_URL =
  "https://raw.githubusercontent.com/grycap/oscar-hub/refs/heads/feat-add-filebrowser/crates/filebrowser-quantum/fdl.yml";
const FILEBROWSER_SCRIPT_URL =
  "https://raw.githubusercontent.com/grycap/oscar-hub/refs/heads/feat-add-filebrowser/crates/filebrowser-quantum/script.sh";

type StorageMode = "volume" | "bucket";

function FileBrowserFormPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [newBucket, setNewBucket] = useState(false);
  const [volumes, setVolumes] = useState<ManagedVolume[]>([]);
  const { systemConfig, authData, clusterInfo } = useAuth();
  const { refreshServices } = useServicesContext();
  const buckets = useGetPrivateBuckets();
  const oidcGroups = getAllowedVOs(systemConfig, authData);
  const volumeSupportEnabled =
    clusterInfo && !isVersionLower(clusterInfo.version, "v3.8.0");

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
    bucket: "",
    volume: "",
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
      storageMode: volumeSupportEnabled ? "volume" : "bucket",
      bucket: "",
      volume: "",
      token: genRandomString(128),
    }));
    setNewBucket(false);
    setVolumes([]);
    setErrors({
      name: false,
      cpuCores: false,
      memoryRam: false,
      storage: false,
      vo: false,
    });
  }, [isOpen, volumeSupportEnabled]);

  useEffect(() => {
    if (!isOpen || !volumeSupportEnabled) {
      return;
    }

    let cancelled = false;

    const loadVolumes = async () => {
      try {
        const nextVolumes = await getVolumesApi();

        if (!cancelled) {
          setVolumes(nextVolumes);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setVolumes([]);
        }
      }
    };

    void loadVolumes();

    return () => {
      cancelled = true;
    };
  }, [isOpen, volumeSupportEnabled]);

  const handleDeploy = async () => {
    const selectedBucket = formData.bucket.trim();
    const selectedVolume = formData.volume.trim();
    const usesVolume = formData.storageMode === "volume";
    const usesBucket = formData.storageMode === "bucket";
    const newErrors = {
      name: !formData.name,
      cpuCores: !formData.cpuCores,
      memoryRam: !formData.memoryRam,
      storage: usesVolume ? !selectedVolume : !selectedBucket,
      vo: !formData.vo,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      alert.error("Please fill in all fields");
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
      const services = yamlToServices(fdlText, scriptText);

      if (!services?.length) {
        throw new Error("No services found");
      }

      const service = services[0];
      const serviceName = formData.name || nameService();
      const sourcePath = usesVolume ? "/data" : `/mnt/${selectedBucket}`;

      const modifiedService: Service = {
        ...service,
        name: serviceName,
        vo: formData.vo,
        token: formData.token,
        memory: `${formData.memoryRam}${formData.memoryUnit}`,
        cpu: formData.cpuCores,
        mount: usesBucket
          ? {
              path: selectedBucket,
              storage_provider: service.mount?.storage_provider ?? "minio.default",
            }
          : undefined,
        volume: usesVolume
          ? {
              name: selectedVolume,
              mount_path: "/data",
            }
          : undefined,
        environment: {
          variables: {
            ...service.environment.variables,
            FILEBROWSER_SOURCE_PATH: sourcePath,
            FILEBROWSER_JWT_SUB: "oscar-dashboard",
          },
          secrets: {
            ...service.environment.secrets,
          },
        },
        labels: {
          ...service.labels,
          filebrowser: "true",
        },
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
                  bucket: "",
                  volume: "",
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
                {volumeSupportEnabled && (
                  <SelectItem value="volume">Existing volume</SelectItem>
                )}
                <SelectItem value="bucket">MinIO bucket</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.storageMode === "volume" ? (
            <div>
              <Label htmlFor="volume">Volume</Label>
              <Select
                value={formData.volume}
                onValueChange={(value) => {
                  setFormData({ ...formData, volume: value });
                  if (errors.storage) {
                    setErrors({ ...errors, storage: false });
                  }
                }}
              >
                <SelectTrigger
                  id="volume"
                  className={errors.storage ? "border-red-500 focus:border-red-500" : ""}
                >
                  <SelectValue placeholder="Select a volume" />
                </SelectTrigger>
                <SelectContent>
                  {volumes.map((volume) => (
                    <SelectItem key={volume.name} value={volume.name}>
                      {volume.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label>Bucket</Label>
              <div>
                <Label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newBucket}
                    className="sr-only peer"
                    onChange={() => {
                      setNewBucket(!newBucket);
                      setFormData({ ...formData, bucket: "" });
                    }}
                  />
                  <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    New Bucket
                  </span>
                </Label>
                {newBucket ? (
                  <Input
                    value={formData.bucket}
                    className={errors.storage ? "border-red-500 focus:border-red-500" : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, bucket: e.target.value });
                      if (errors.storage) {
                        setErrors({ ...errors, storage: false });
                      }
                    }}
                    placeholder="Enter bucket name"
                  />
                ) : (
                  <Select
                    value={formData.bucket}
                    onValueChange={(value) => {
                      setFormData({ ...formData, bucket: value });
                      if (errors.storage) {
                        setErrors({ ...errors, storage: false });
                      }
                    }}
                  >
                    <SelectTrigger
                      className={errors.storage ? "border-red-500 focus:border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select a bucket" />
                    </SelectTrigger>
                    <SelectContent>
                      {buckets.map((bucket) => (
                        <SelectItem
                          key={bucket.bucket_name}
                          value={bucket.bucket_name}
                        >
                          {bucket.bucket_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
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
