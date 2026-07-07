import createServiceApi from "@/api/services/createServiceApi";
import CustomSwitch from "@/components/CustomSwitch";
import RequestButton from "@/components/RequestButton";
import StorageSelectForm from "@/components/StorageSeceltForm";
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
import {
  Service,
} from "@/pages/ui/services/models/service";
import OscarColors from "@/styles";
import { Plus, RefreshCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";

const TERMINAL_FDL_URL =
  "https://raw.githubusercontent.com/grycap/oscar-terminal/refs/heads/main/fdl.yml";
const TERMINAL_SCRIPT_URL =
  "https://raw.githubusercontent.com/grycap/oscar-terminal/refs/heads/main/script.sh";

function TerminalFormPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const { systemConfig, authData, clusterInfo } = useAuth();
  const { refreshServices } = useServicesContext();
  const [withStorage, setWithStorage] = useState(true);

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
    mainStorage: "bucket",
    addBucket: true,
    addVolume: false,
    newBucket: true,
    newVolume: true,
    refreshToken: "",
    vo: "",
    token: "",
  });

  const [errors, setErrors] = useState({
    name: false,
    cpuCores: false,
    memoryRam: false,
    bucket: false,
    volume: false,
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
      addBucket: true,
      addVolume: false,
      newBucket: true,
      newVolume: true,
      token: genRandomString(128),
    }));
    setErrors({
      name: false,
      cpuCores: false,
      memoryRam: false,
      bucket: false,
      volume: false,
      volumeSize: false,
      vo: false,
    });
  }, [isOpen]);

  const handleDeploy = async () => {
    const newErrors = {
      name: !formData.name,
      cpuCores: !formData.cpuCores,
      memoryRam: !formData.memoryRam,
      bucket: withStorage && formData.addBucket && !formData.bucket,
      volume: withStorage && formData.addVolume && !formData.volume,
      volumeSize: withStorage && formData.addVolume && formData.newVolume && (!formData.volumeSize || parseInt(formData.volumeSize) < 1),
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

      const services = yamlToServices(fdlText, scriptText, (!!clusterInfo && !isVersionLower(clusterInfo.version, "v4.1.0")));

      if (!services?.length) {
        throw new Error("No services found");
      }

      const service = services[0];
      const serviceName = formData.name || nameService();
      const workspaceDir = withStorage && formData.mainStorage === "volume" && formData.volume
        ? `/mnt/volumes/${formData.volume}`
        : withStorage && formData.mainStorage === "bucket" && formData.bucket
          ? `/mnt/${formData.bucket}`
          : `/tmp/${serviceName}`;

      const baseSecrets = Object.fromEntries(
        Object.entries(service.environment.secrets || {}).filter(
          ([key]) => key !== "OSCAR_OIDC_REFRESH_TOKEN"
        )
      );

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
        mount: undefined,
        ...(formData.bucket ? {
          mount: {
            ...service.mount,
            path: formData.bucket ?? "/notebook",
            storage_provider: service.mount?.storage_provider ?? "minio.default",
          },
        } : {}),
        volume: undefined,
        ...(formData.volume ? { 
          volume: {
            name: formData.volume,
            size: formData.volumeSize ? `${formData.volumeSize.trim()}Gi` : undefined,
            mount_path: `/mnt/volumes/${formData.volume}`,
          }
        } : {}),
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
          <div className="flex flex-row items-center pt-2">
            <CustomSwitch checked={withStorage} title="With Storage" onChange={() => setWithStorage(!withStorage)} />
          </div>
          {withStorage && (
          <StorageSelectForm
            formData={formData}
            setFormData={setFormData}
            errors={errors}
          />
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
