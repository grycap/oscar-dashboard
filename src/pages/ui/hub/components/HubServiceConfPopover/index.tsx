import createServiceApi from "@/api/services/createServiceApi";
import getVolumesApi from "@/api/volumes/getVolumesApi";
import RequestButton from "@/components/RequestButton";
import { Button, ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { generateReadableName, genRandomString, getAllowedVOs, usesDNSRoutes, parseFdlCpu, parseFdlMemory, getModelServingNamespace, getModelServingSuffix, isModelServingEndpoint, replaceModelServingEndpoints } from "@/lib/utils";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import {
  ManagedVolume,
  Service,
} from "@/pages/ui/services/models/service";
import { PlusIcon, RefreshCcwIcon, Trash2Icon } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoCrateServiceDefinition } from "@/lib/roCrate";
import HubCardHeader from "../HubCardHeader";
import useGetPrivateBuckets from "@/hooks/useGetPrivateBuckets";
import { errorMessage } from "@/lib/error";

interface HubServiceConfPopoverProps {
    roCrateServiceDef: RoCrateServiceDefinition;
    services: Service[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
		className?: ButtonProps["className"];
		variant?: ButtonProps["variant"];
		title?: string;
}

interface ServiceDeployFormHandle {
  buildService: () => Promise<Service | null>;
}

interface ServiceDeployFormProps {
  roCrateServiceDef: RoCrateServiceDefinition;
  service: Service;
  isOpen: boolean;
  modelServingName?: string;
  modelServingSuffix?: string;
  onNameChange?: (name: string) => void;
}

const ServiceDeployForm = forwardRef<ServiceDeployFormHandle, ServiceDeployFormProps>(function ServiceDeployForm({ roCrateServiceDef, service, isOpen, modelServingName, modelServingSuffix, onNameChange }, ref) {
  const {systemConfig, authData } = useAuth();
  const [newBucket, setNewBucket] = useState(false);
  const isModelServingService = !!service.model_serving;
  const oidcGroups = getAllowedVOs(systemConfig, authData);
	const asyncService = !isModelServingService && roCrateServiceDef.type.some(t => t.toLowerCase() === "asynchronous");
  const mountBucket = isModelServingService ? undefined : service.mount;
  const serviceVolume = isModelServingService ? undefined : service.volume;
  const buckets = useGetPrivateBuckets(isOpen && !!mountBucket);
  const canCreateManagedVolume = !!serviceVolume;


  function parseVolumeSize(size?: string): string {
    if (!size) {
      return "1";
    }

    const parsedSize = size.trim().match(/^(\d+(?:\.\d+)?)(Mi|Gi)$/);

    if (!parsedSize) {
      return "1";
    }

    const numericSize = Number(parsedSize[1]);
    const unit = parsedSize[2];

    if (unit === "Mi") {
      return String(numericSize / 1024);
    }

    return parsedSize[1];
  }

  function isValidVolumeSize(value: string): boolean {
    const trimmedValue = value.trim();

    if (!/^\d+(\.\d+)?$/.test(trimmedValue)) {
      return false;
    }

    return Number(trimmedValue) > 0;
  }

  function nameService() {
    return `hub-${generateReadableName(6)}-${genRandomString(8).toLowerCase()}`;
  }

  const [formData, setFormData] = useState({
    name: "",
    cpuCores: "1.0",
    memoryRam: "2",
    memoryUnit: "Gi",
    kserveArgs: [] as string[],
    bucket: "",
    volume: "",
    volumeSize: "1",
    vo: "",
    token: "",
    enviromentVars: {} as Record<string, string>,
    enviromentSecrets: {} as Record<string, string>,
    nodePort: [] as number[],
  });
  const [newVolume, setNewVolume] = useState(false);
  const [volumes, setVolumes] = useState<ManagedVolume[]>([]);

  function ifEndpointService(key: string, value: string, serviceName: string): string {
    const newValue = value.replace(
      /\/services\/([^/]+)\/exposed/,
      `/services/${serviceName}/exposed`
    );
    if (newValue.includes(`/services/${serviceName}/exposed`)) {
      const dnsRoutesEnabled = usesDNSRoutes(systemConfig?.config);
      if (dnsRoutesEnabled) {
        formData.enviromentVars = {
          ...formData.enviromentVars,
          [key]: "/",
        };
      } else {
        formData.enviromentVars = {
          ...formData.enviromentVars,
          [key]: newValue,
        };
      }
    }
    return newValue;
  }

  const [errors, setErrors] = useState({
    name: false,
    cpuCores: false,
    memoryRam: false,
    bucket: false,
    volume: false,
    volumeSize: false,
    vo: false,
    token: false,
    enviromentVars: {} as Record<string, boolean>,
    enviromentSecrets: {} as Record<string, boolean>,
    nodePort: false,
  });

  useEffect(() => {
    if (oidcGroups.length > 0 && !formData.vo) {
      setFormData((prev) => ({ ...prev, vo: oidcGroups[0] }));
    }
  }, [oidcGroups]);

  useEffect(() => {
    onNameChange?.(formData.name);
  }, [formData.name]);

  useEffect(() => {
    if (!isOpen) return;
    const serviceName = nameService();
    const initialVolume = serviceVolume?.name || "";
    const hasCpu = service.cpu != null && String(service.cpu).trim() !== "";
    const hasMemory = service.memory != null && String(service.memory).trim() !== "";
    const cpu = hasCpu ? parseFdlCpu(service.cpu) : roCrateServiceDef.cpuRequirements;
    const memory = hasMemory
      ? parseFdlMemory(service.memory)
      : { amount: roCrateServiceDef.memoryRequirements, unit: roCrateServiceDef.memoryUnits };
    if (cpu === null || memory === null) {
      alert.error(`Invalid FDL resources for ${service.name || roCrateServiceDef.name}. Please enter valid values.`);
    }
    setFormData((prev) => ({
      ...prev, 
      name: serviceName,
      cpuCores: cpu ?? "",
      memoryRam: memory?.amount ?? "",
      memoryUnit: memory?.unit ?? "Gi",
      kserveArgs: service.model_serving?.inference?.args || service.model_serving?.llm_inference?.args || [],
      bucket: serviceName,
      volume: serviceName,
      volumeSize: parseVolumeSize(serviceVolume?.size),
      token: genRandomString(128),
      enviromentVars: service.environment?.variables || {},
      enviromentSecrets: service.environment?.secrets || {},
      nodePort: service.expose?.nodePort?.length > 0 ? service.expose.nodePort : [],
    }));
    setNewBucket(false);
    setVolumes([]);
    setNewVolume(false);
    setErrors({
      name: false,
      cpuCores: false,
      memoryRam: false,
      bucket: false,
      volume: false,
      volumeSize: false,
      vo: false,
      token: false,
      enviromentVars: {} as Record<string, boolean>,
      enviromentSecrets: {} as Record<string, boolean>,
      nodePort: false,
    });

    let cancelled = false;

    const loadVolumes = async () => {
      if (!serviceVolume) return;

      try {
        const nextVolumes = await getVolumesApi();
        if (cancelled) return;

        const volumeExists = nextVolumes.some(
          (volume) => volume.name === initialVolume
        );

        setVolumes(nextVolumes);
        setNewVolume(nextVolumes.length === 0);
        setFormData((prev) => ({
          ...prev,
          volume:
            nextVolumes.length === 0
              ? initialVolume
              : volumeExists
                ? initialVolume
                : "",
        }));
      } catch (error) {
        if (cancelled) return;
        console.log(error);
        setVolumes([]);
        setNewVolume(true);
        setFormData((prev) => ({
          ...prev,
          volume: initialVolume,
        }));
        alert.error("Error loading volumes");
      }
    };

    void loadVolumes();

    return () => {
      cancelled = true;
    };
  }, [isOpen, roCrateServiceDef, service, serviceVolume]);

  useImperativeHandle(ref, () => ({ buildService }));

  const buildService = async (): Promise<Service | null> => {
    const newErrors = {
      name: !formData.name,
      cpuCores: !formData.cpuCores,
      memoryRam: !formData.memoryRam,
      bucket: !formData.bucket && (asyncService || !!mountBucket),
      volume: !formData.volume && !!serviceVolume,
      volumeSize:
        !!serviceVolume &&
        newVolume &&
        !isValidVolumeSize(formData.volumeSize),
      vo: !formData.vo,
      token: !formData.token,
      enviromentVars: Object.fromEntries(Object.entries(formData.enviromentVars).map(([key, value]) => [key, !value || value.length === 0])),
      enviromentSecrets: Object.fromEntries(Object.entries(formData.enviromentSecrets).map(([key, value]) => [key, !value || value.length === 0])),
      nodePort: !!service?.expose?.nodePort && !formData.nodePort,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => {
      if (error && typeof error === "object") {
        return Object.values(error).some(value => value);
      }
      return error;
    })) {
      alert.error(`Please fill in all fields of ${service.name || roCrateServiceDef.name}`);
      return null;
    }

    {
      let scriptText = "";
      if (!isModelServingService) {
        const scriptResponse = await fetch(roCrateServiceDef.scriptUrl);
        scriptText = await scriptResponse.text();
      }

      const serviceName = formData.name || nameService();

      const serviceVolumeConfig = serviceVolume
        ? newVolume
          ? {
              ...serviceVolume,
              name: formData.volume,
              size: `${formData.volumeSize.trim()}Gi`,
            }
          : {
              name: formData.volume,
              mount_path: serviceVolume.mount_path,
            }
        : undefined;

      const modifiedService: Service = {
        ...service,
        name: serviceName,
        script: scriptText,
        vo: formData.vo,
        memory: `${formData.memoryRam}${formData.memoryUnit === "bytes" ? "" : formData.memoryUnit}`,
        cpu: formData.cpuCores.toString(),
        input: asyncService ? 
					[{
						storage_provider: "minio.default",
						path: `${formData.bucket}/input`,
						suffix: [],
						prefix: []
					}] : [],
				output: asyncService ? 
					[{
						storage_provider: "minio.default",
						path: `${formData.bucket}/output`,
						suffix: [],
						prefix: []
					}] : [],
        mount: mountBucket ? {
          storage_provider: "minio.default",
          path: formData.bucket,
        } : undefined,
        volume: serviceVolumeConfig,
        environment: {
          ...service.environment,
          variables: replaceModelServingEndpoints(formData.enviromentVars, modelServingName, modelServingSuffix, getModelServingNamespace(authData?.egiSession?.sub)),
          secrets: {
            ...formData.enviromentSecrets,
          },
        },
        labels: {
          ...service.labels,
          oscar_hub: "true",
        },
        expose: {
          ...service.expose,
          nodePort: formData.nodePort,
        },
        model_serving: isModelServingService && service.model_serving ? {
          ...service.model_serving,
          inference: service.model_serving.inference ? {
            ...service.model_serving.inference,
            args: formData.kserveArgs.length > 0 ? formData.kserveArgs : service.model_serving.inference?.args,
          } : undefined,
          llm_inference: service.model_serving.llm_inference ? {
            ...service.model_serving.llm_inference,
            args: formData.kserveArgs.length > 0 ? formData.kserveArgs : service.model_serving.llm_inference?.args,
          } : undefined,
        } : undefined,
      };
      return modifiedService;
    }
  };

const visibleEnvVars = Object.entries(formData?.enviromentVars ?? {}).filter(
    ([, value]) => !(modelServingName && isModelServingEndpoint(value))
  );

return (
          <div className="grid grid-cols-1 gap-y-2 sm:gap-x-2 overflow-y-auto">
            <div>
              <div className="flex flex-row items-center">
                <Label>
                  Service name
                </Label>
                <Button variant={"link"} size={"icon"}
                  onClick={() => setFormData({ ...formData, name: nameService()})}
                >
                  <RefreshCcwIcon size={16} 
                    onMouseEnter={(e) => {e.currentTarget.style.transform = 'rotate(90deg)'}}
                    onMouseLeave={(e) => {e.currentTarget.style.transform = 'rotate(0deg)'}}
                  />
                </Button>
              </div>
              <Input
                id="name"
                placeholder="Enter service name"
                value={formData.name}
                className={errors.name ? "border-red-500 focus:border-red-500" : ""}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: false });
                }}
              ></Input>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
              <div>
                <Label htmlFor="cpu-cores">CPU Cores</Label>
                <Input
                  id="cpu-cores"
                  type="number"
                  step="any"
                  placeholder="Enter CPU Cores"
                  value={formData.cpuCores}
                  className={errors.cpuCores ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                    setFormData({ ...formData, cpuCores: e.target.value });
                    if (errors.cpuCores) setErrors({ ...errors, cpuCores: false });
                  }}
                ></Input>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <div>
                    <Label htmlFor="memory-ram">RAM</Label>
                    <Input
                      id="memory-ram"
                      type="number"
                      step="any"
                      placeholder="Enter RAM"
                      value={formData.memoryRam}
                      className={errors.memoryRam ? "border-red-500 focus:border-red-500" : ""}
                      onChange={(e) => {
                        setFormData({ ...formData, memoryRam: e.target.value });
                        if (errors.memoryRam) setErrors({ ...errors, memoryRam: false });
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
                      {formData.memoryUnit !== "Gi" && formData.memoryUnit !== "Mi" && (
                        <SelectItem value={formData.memoryUnit}>
                          {formData.memoryUnit === "bytes" ? "Bytes" : formData.memoryUnit}
                        </SelectItem>
                      )}
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
                      if (errors.vo) setErrors({ ...errors, vo: false });
                  }}
                >
                  <SelectTrigger id="vo" className={errors.vo ? "border-red-500 focus:border-red-500" : ""}>
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
            {service?.expose?.nodePort?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.nodePort.map((port, index) => (
                <div key={index} className="w-full sm:w-[173px]">
                  <Label htmlFor={`nodePort-${index}`}>{"Node Port to " + (service?.expose?.api_port[index] ?? "Unknown")}</Label>
                  <Input
                    id={`nodePort-${index}`}
                    type="number"
                    placeholder="Enter Node Port"
                    value={port}
                    className={errors.nodePort ? "border-red-500 focus:border-red-500" : ""}
                    onChange={(e) => {
                      const newNodePort = [...formData.nodePort];
                      newNodePort[index] = Number(e.target.value);
                      setFormData({ ...formData, nodePort: newNodePort });
                      if (errors.nodePort) setErrors({ ...errors, nodePort: false });
                    }}
                  />
                </div>))}
              </div>
            )}
						{(asyncService || mountBucket) && 
            <div>
              <Label>Bucket</Label>
              <hr className="mb-2"/>
              <div>
                <Label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    value=""
                    className="sr-only peer"
                    checked={newBucket || asyncService}
                    disabled={asyncService}
                    onChange={() => {
                      setNewBucket((prev) => !prev);
                      setFormData((prev) => ({
                        ...prev,
                        bucket: "",
                      }));
                    }}
                  />
                  <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600 peer-disabled:opacity-60 peer-disabled:cursor-not-allowed"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 peer-disabled:cursor-default">New Bucket</span>
                </Label>
                {newBucket || !mountBucket ? 
                <Input
                  type="input"
                  onFocus={(e) => (e.target.type = "text")}
                  style={{ width: "100%",
                    fontWeight: "normal",
                    }}
                  value={formData.bucket}
                  className={errors.bucket ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                    setFormData({ ...formData, bucket: e.target?.value });
                    if (errors.bucket) {
                      setErrors({ ...errors, bucket: false });
                    }
                  }}
                  placeholder="Enter new bucket name"
                />
                :
                  <Select
                    value={formData.bucket}
                    onValueChange={(value) => {
                      setFormData({ ...formData, bucket: value });
                      if (errors.bucket) {
                        setErrors({ ...errors, bucket: false });
                      }
                    }}
                  >
                    <SelectTrigger className={errors.bucket ? "border-red-500 focus:border-red-500" : ""}>
                      <SelectValue
                        placeholder="Select a bucket"
                      />
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
                }
              </div>
            </div>
						}
            {serviceVolume &&
            <div>
              <Label>Volume</Label>
              <hr className="mb-2"/>
              <div>
                {canCreateManagedVolume && (
                  <Label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value=""
                      className="sr-only peer"
                      checked={newVolume}
                      onChange={() => {
                        setNewVolume((prev) => !prev);
                        setFormData((prev) => ({
                          ...prev,
                          volume: "",
                          volumeSize: parseVolumeSize(serviceVolume.size),
                        }));
                      }}
                    />
                    <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">New Volume</span>
                  </Label>
                )}
                {newVolume ? 
                <div className="grid gap-2">
                  <Input
                    type="input"
                    onFocus={(e) => (e.target.type = "text")}
                    style={{ width: "100%",
                      fontWeight: "normal",
                      }}
                    value={formData.volume}
                    className={errors.volume ? "border-red-500 focus:border-red-500" : ""}
                    onChange={(e) => {
                      setFormData({ ...formData, volume: e.target?.value });
                      if (errors.volume) {
                        setErrors({ ...errors, volume: false });
                      }
                    }}
                    placeholder="Enter new volume name"
                  />
                  <div className="grid gap-1">
                    <Label htmlFor="volumeSize">Volume size (Gi)</Label>
                    <Input
                      id="volumeSize"
                      type="number"
                      min="0.1"
                      step="any"
                      inputMode="decimal"
                      value={formData.volumeSize}
                      className={`max-w-[180px] ${
                        errors.volumeSize
                          ? "border-red-500 focus:border-red-500"
                          : ""
                      }`}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          volumeSize: e.target.value,
                        });
                        if (errors.volumeSize) {
                          setErrors({ ...errors, volumeSize: false });
                        }
                      }}
                      placeholder="1"
                    />
                  </div>
                </div>
                :
                  <Select
                    value={formData.volume}
                    onValueChange={(value) => {
                      setFormData({ ...formData, volume: value });
                      if (errors.volume) {
                        setErrors({ ...errors, volume: false });
                      }
                    }}
                  >
                    <SelectTrigger className={errors.volume ? "border-red-500 focus:border-red-500" : ""}>
                      <SelectValue
                        placeholder="Select a volume"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {volumes.map((volume) => (
                        <SelectItem key={volume.name} value={volume.name}>
                          {volume.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              </div>
            </div>
            }
            {visibleEnvVars.length > 0 && (
            <div>
              <Label>Environment Variables</Label>
              <hr className="mb-2"/>

              {visibleEnvVars.map(([key, value]) => (
              <div key={`var-${key}`}>
                <Label>{key}</Label>
                <Input
                  disabled={ifEndpointService(key, value, formData.name) !== value}
                  type="input"
                  value={ifEndpointService(key, value, formData.name)}
                  style={{ width: "100%",
                    fontWeight: "normal",
                  }}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      enviromentVars: {
                        ...prev.enviromentVars,
                        [key]: e.target.value,
                      },
                    }));
                    if (errors.enviromentVars && errors.enviromentVars[key]) setErrors({ ...errors, enviromentVars: { ...errors.enviromentVars, [key]: false } });
                  }}
                  placeholder={`Enter ${key}`}
                  className={errors.enviromentVars[key] ? "border-red-500 focus:border-red-500" : ""}
                />
              </div>
              ))}
            </div>
            )}
            {Object.keys(formData?.enviromentSecrets ?? {}).length > 0 && (
            <div>
              <Label>Environment Secrets</Label>
              <hr className="mb-2"/>
              
              {Object.entries(formData.enviromentSecrets).map(([key, value]) => (
              <div key={`secret-${key}`}>
                <Label>{key}</Label>
                <Input
                  type="password"
                  value={value}
                  style={{ width: "100%",
                    fontWeight: "normal",
                    }}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      enviromentSecrets: {
                        ...prev.enviromentSecrets,
                        [key]: e.target.value,
                      },
                    }));
                    if (errors.enviromentSecrets && errors.enviromentSecrets[key]) setErrors({ ...errors, enviromentSecrets: { ...errors.enviromentSecrets, [key]: false } });
                  }}
                  placeholder={`Enter ${key}`}
                  className={errors.enviromentSecrets[key] ? "border-red-500 focus:border-red-500" : ""}
                />
              </div>
              ))}
            </div>
            )}
            
            {isModelServingService && (
            <div>
              <div className="flex items-center justify-between gap-2">
                <Label>Model Serving Arguments</Label>
                <Button
                  variant="lightGreen"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      kserveArgs: [...prev.kserveArgs, ""],
                    }));
                  }}
                >
                  <PlusIcon size={16} className="mr-1" />
                  Add
                </Button>
              </div>
              <hr className="mb-2"/>
              {formData.kserveArgs.map((arg, index) => (
              <div key={`arg-${index}`} className="flex items-start gap-2">
                <div className="flex-1">
                  <Label>{`Argument ${index + 1}`}</Label>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <Input
                      type="text"
                      value={arg}
                      onChange={(e) => {
                        const nextArgs = [...formData.kserveArgs];
                        nextArgs[index] = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          kserveArgs: nextArgs,
                        }));
                      }}
                      placeholder={`Enter argument ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          kserveArgs: prev.kserveArgs.filter((_, argIndex) => argIndex !== index),
                        }));
                      }}
                    >
                      <Trash2Icon size={16} color="red" />
                    </Button>
                  </div>
                </div>
              </div>
              ))}
            </div>
            )}
            
          </div>
  );
});

function HubServiceConfPopover({ roCrateServiceDef, services, isOpen = false, setIsOpen, className = "", variant = "default", title = "Deploy Service" }: HubServiceConfPopoverProps) {
  const { refreshServices } = useServicesContext();
  const formRefs = useRef<(ServiceDeployFormHandle | null)[]>([]);
  const isMulti = services.length > 1;
  const [activeTab, setActiveTab] = useState("0");
  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const modelServingIndex = services.findIndex((svc) => !!svc.model_serving);
  const modelServingName = modelServingIndex >= 0 ? serviceNames[modelServingIndex] || undefined : undefined;
  const modelServingSuffix = modelServingIndex >= 0 ? getModelServingSuffix(services[modelServingIndex].model_serving) : "";

  const handleNameChange = (index: number, name: string) => {
    setServiceNames((prev) => {
      if (prev[index] === name) return prev;
      const next = [...prev];
      next[index] = name;
      return next;
    });
  };

  useEffect(() => {
    if (isOpen) setActiveTab("0");
  }, [isOpen]);

  const handleDeploy = async () => {
    try {
      const built: Service[] = [];
      for (let i = 0; i < services.length; i++) {
        const built_i = await formRefs.current[i]?.buildService();
        if (!built_i) {
          setActiveTab(String(i));
          return;
        }
        built.push(built_i);
      }
      for (const svc of built) {
        await createServiceApi(svc);
      }
      refreshServices();
      alert.success(`Service ${roCrateServiceDef.name} instance deployed`);
      setIsOpen(false);
    } catch (error) {
      console.log(error)
      alert.error(`Error deploying ${roCrateServiceDef.name} instance: ${errorMessage(error)}`);
    }
  };

  const deployButton = (
    <RequestButton className="grid grid-cols-[auto] sm:grid-cols-1 gap-2 w-full sm:w-auto" variant={"mainGreen"} request={handleDeploy}>
      Deploy
    </RequestButton>
  );

  const lastIndex = services.length - 1;

  const renderAction = (index: number) =>
    index < lastIndex ? (
      <Button variant="outline" className="w-full sm:w-auto" onClick={() => setActiveTab(String(index + 1))}>
        Next
      </Button>
    ) : (
      deployButton
    );

  const renderForm = (index: number) => (
    <ServiceDeployForm
      ref={(handle) => { formRefs.current[index] = handle; }}
      roCrateServiceDef={roCrateServiceDef}
      service={services[index]}
      isOpen={isOpen}
      modelServingName={modelServingName}
      modelServingSuffix={modelServingSuffix}
      onNameChange={(name) => handleNameChange(index, name)}
    />
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
					className={className}
          variant={variant}
          tooltipLabel={title}
          onClick={() => {setIsOpen(false)}}
        >
          Deploy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] max-h-[90%] gap-4 flex flex-col">
        <DialogHeader>
        <DialogTitle>
          <HubCardHeader roCrateServiceDef={roCrateServiceDef} card="deploy" />
        </DialogTitle>
        </DialogHeader>
        <hr></hr>
        {isMulti ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-0 overflow-hidden">
            <TabsList className="flex-wrap h-auto justify-start">
              {services.map((svc, index) => (
                <TabsTrigger key={index} value={String(index)}>
                  {svc.name || `Service ${index + 1}`}
                </TabsTrigger>
              ))}
            </TabsList>
            {services.map((_, index) => (
              <TabsContent key={index} value={String(index)} forceMount className="overflow-y-auto data-[state=inactive]:hidden">
                {renderForm(index)}
                <div className="mt-4 flex justify-end">{renderAction(index)}</div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <>
            {renderForm(0)}
            <DialogFooter>{deployButton}</DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default HubServiceConfPopover;
