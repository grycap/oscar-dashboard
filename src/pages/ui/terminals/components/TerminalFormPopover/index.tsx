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
import {
  ManagedVolume,
  Service,
} from "@/pages/ui/services/models/service";
import OscarColors from "@/styles";
import { Plus, RefreshCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";

const TERMINAL_FDL_URL =
  "https://raw.githubusercontent.com/grycap/oscar-hub/refs/heads/main/crates/ghostty-web/fdl.yml";
const TERMINAL_SCRIPT_URL =
  "https://raw.githubusercontent.com/grycap/oscar-hub/refs/heads/main/crates/ghostty-web/script.sh";

function isValidVolumeSize(value: string): boolean {
  const trimmedValue = value.trim();

  if (!/^\d+(\.\d+)?$/.test(trimmedValue)) {
    return false;
  }

  return Number(trimmedValue) > 0;
}

function TerminalFormPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [newBucket, setNewBucket] = useState(false);
  const [newVolume, setNewVolume] = useState(false);
  const [volumes, setVolumes] = useState<ManagedVolume[]>([]);
  const { systemConfig, authData, clusterInfo } = useAuth();
  const { refreshServices } = useServicesContext();
  const buckets = useGetPrivateBuckets();

  const oidcGroups = getAllowedVOs(systemConfig, authData);

  function nameService() {
    return (
      `terminal-${generateReadableName(6)}-` +
      `${genRandomString(8).toLowerCase()}`
    );
  }

  const [formData, setFormData] = useState({
    name: "",
    cpuCores: "0.5",
    memoryRam: "256",
    memoryUnit: "Mi",
    bucket: "",
    volume: "",
    volumeSize: "1",
    refreshToken: "",
    vo: "",
    token: "",
  });
  const bucketName = formData.bucket.trim();
  const volumeName = formData.volume.trim();
  const mountBucket = bucketName.length > 0;
  const mountVolume = volumeName.length > 0;

  const [errors, setErrors] = useState({
    name: false,
    cpuCores: false,
    memoryRam: false,
    volumeSize: false,
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
      memoryRam: "256",
      memoryUnit: "Mi",
      bucket: "",
      volume: "",
      volumeSize: "1",
      refreshToken: "",
      token: genRandomString(128),
    }));
    setNewBucket(false);
    setNewVolume(false);
    setVolumes([]);
    setErrors({
      name: false,
      cpuCores: false,
      memoryRam: false,
      volumeSize: false,
      vo: false,
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadVolumes = async () => {
      try {
        const nextVolumes = await getVolumesApi();

        if (cancelled) {
          return;
        }

        setVolumes(nextVolumes.managed_volume ?? []);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(error);
        setVolumes([]);
      }
    };

    void loadVolumes();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleDeploy = async () => {
    const newErrors = {
      name: !formData.name,
      cpuCores: !formData.cpuCores,
      memoryRam: !formData.memoryRam,
      volumeSize:
        mountVolume && newVolume && !isValidVolumeSize(formData.volumeSize),
      vo: !formData.vo,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      alert.error("Please fill in all fields");
      return;
    }

    try {
      const fdlResponse = await fetch(TERMINAL_FDL_URL, fetchFromGitHubOptions);
      const fdlText = await fdlResponse.text();

      const scriptResponse = await fetch(
        TERMINAL_SCRIPT_URL,
        fetchFromGitHubOptions
      );
      const scriptText = await scriptResponse.text();

      const services = yamlToServices(fdlText, scriptText);

      if (!services?.length) {
        throw new Error("No services found");
      }

      const service = services[0];
      const serviceName = formData.name || nameService();
      const workspaceDir = mountVolume
        ? `/mnt/volumes/${volumeName}`
        : mountBucket
          ? `/mnt/${bucketName}`
          : `/tmp/${serviceName}`;
      const baseSecrets = Object.fromEntries(
        Object.entries(service.environment.secrets || {}).filter(
          ([key]) => key !== "OSCAR_OIDC_REFRESH_TOKEN"
        )
      );
      const volumeConfig = mountVolume
        ? {
            name: volumeName,
            mount_path: `/mnt/volumes/${volumeName}`,
            ...(newVolume
              ? { size: `${formData.volumeSize.trim()}Gi` }
              : {}),
          }
        : undefined;

      const modifiedService: Service = {
        ...service,
        name: serviceName,
        vo: formData.vo,
        token: formData.token,
        memory: `${formData.memoryRam}${formData.memoryUnit}`,
        cpu: formData.cpuCores,
        mount: mountBucket
          ? {
              ...service.mount,
              path: bucketName,
              storage_provider:
                service.mount?.storage_provider ?? "minio.default",
            }
          : undefined,
        volume: volumeConfig,
        environment: {
          variables: {
            ...service.environment.variables,
            SERVICE_NAME: serviceName,
            BASE_PATH: `/system/services/${serviceName}/exposed`,
            WORKSPACE_DIR: workspaceDir,
          },
          secrets: formData.refreshToken
            ? {
                ...baseSecrets,
                OSCAR_OIDC_REFRESH_TOKEN: formData.refreshToken,
              }
            : baseSecrets,
        },
        labels: {
          ...service.labels,
          terminal: "true",
        },
      };

      await createServiceApi(modifiedService);
      refreshServices();

      alert.success("Terminal instance deployed");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert.error(
        `Error deploying terminal instance: ${errorMessage(error)}`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="mainGreen"
          tooltipLabel="New Terminal Instance"
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
              Terminal Instance Configuration
            </span>
          </DialogTitle>
        </DialogHeader>
        <hr></hr>
        <div className="grid grid-cols-1 gap-y-2 sm:gap-x-2 overflow-y-auto">
          <div>
            <div className="flex flex-row items-center">
              <Label>Service name</Label>
              <Button
                variant={"link"}
                size={"icon"}
                onClick={() => setFormData({ ...formData, name: nameService() })}
              >
                <RefreshCcwIcon
                  size={16}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "rotate(90deg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "rotate(0deg)";
                  }}
                />
              </Button>
            </div>
            <Input
              id="name"
              placeholder="Enter service name"
              value={formData.name}
              className={
                errors.name ? "border-red-500 focus:border-red-500" : ""
              }
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) {
                  setErrors({ ...errors, name: false });
                }
              }}
            ></Input>
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
                className={
                  errors.cpuCores ? "border-red-500 focus:border-red-500" : ""
                }
                onChange={(e) => {
                  setFormData({ ...formData, cpuCores: e.target.value });
                  if (errors.cpuCores) {
                    setErrors({ ...errors, cpuCores: false });
                  }
                }}
              ></Input>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <Label htmlFor="memory-ram">RAM</Label>
                <Input
                  id="memory-ram"
                  type="number"
                  step={formData.memoryUnit === "Gi" ? 1 : 256}
                  placeholder="Enter RAM"
                  value={formData.memoryRam}
                  className={
                    errors.memoryRam
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }
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
            <Label htmlFor="refresh-token">Refresh token</Label>
            <Input
              id="refresh-token"
              type="password"
              placeholder="Enter OSCAR OIDC refresh token"
              value={formData.refreshToken}
              onChange={(e) => {
                setFormData({ ...formData, refreshToken: e.target.value });
              }}
            />
          </div>
          <div>
            <Label>Bucket</Label>
            <hr className="mb-2" />
            <div>
              <Label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value=""
                  checked={newBucket}
                  className="sr-only peer"
                  onClick={() => {
                    setNewBucket(!newBucket);
                    setFormData({ ...formData, bucket: "" });
                  }}
                >
                </input>
                <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                  New Bucket
                </span>
              </Label>
              {newBucket ? (
                <Input
                  type="input"
                  onFocus={(e) => (e.target.type = "text")}
                  style={{ width: "100%", fontWeight: "normal" }}
                  value={formData.bucket}
                  onChange={(e) => {
                    setFormData({ ...formData, bucket: e.target.value });
                  }}
                  placeholder="Enter new bucket name"
                />
              ) : (
                <Select
                  value={formData.bucket}
                  onValueChange={(value) => {
                    setFormData({ ...formData, bucket: value });
                  }}
                >
                  <SelectTrigger>
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
          { // CHANGE ON NEW RELEASE
          clusterInfo && !isVersionLower(clusterInfo.version, "v3.8.0") && (
          <div>
            <Label>Volume</Label>
            <hr className="mb-2" />
            <div>
              <Label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value=""
                  checked={newVolume}
                  className="sr-only peer"
                  onClick={() => {
                    setNewVolume(!newVolume);
                    setFormData({
                      ...formData,
                      volume: "",
                      volumeSize: "1",
                    });
                    if (errors.volumeSize) {
                      setErrors({
                        ...errors,
                        volumeSize: false,
                      });
                    }
                  }}
                >
                </input>
                <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                  New Volume
                </span>
              </Label>
              {newVolume ? (
                <Input
                  type="input"
                  onFocus={(e) => (e.target.type = "text")}
                  style={{ width: "100%", fontWeight: "normal" }}
                  value={formData.volume}
                  onChange={(e) => {
                    setFormData({ ...formData, volume: e.target.value });
                  }}
                  placeholder="Enter new volume name"
                />
              ) : (
                <Select
                  value={formData.volume}
                  onValueChange={(value) => {
                    setFormData({ ...formData, volume: value });
                  }}
                >
                  <SelectTrigger>
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
              )}
              {newVolume ? (
                <div className="grid gap-1 mt-2">
                  <Label htmlFor="volumeSize">Volume size (Gi)</Label>
                  <Input
                    id="volumeSize"
                    type="text"
                    inputMode="decimal"
                    placeholder="1"
                    value={formData.volumeSize}
                    className={
                      errors.volumeSize
                        ? "max-w-[180px] border-red-500 " +
                          "focus:border-red-500"
                        : "max-w-[180px]"
                    }
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        volumeSize: e.target.value,
                      });
                      if (errors.volumeSize) {
                        setErrors({ ...errors, volumeSize: false });
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
          )}
        </div>
        <DialogFooter>
          <RequestButton
            className="grid grid-cols-[auto] sm:grid-cols-1 gap-2"
            variant={"mainGreen"}
            request={handleDeploy}
          >
            Deploy
          </RequestButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TerminalFormPopover;
