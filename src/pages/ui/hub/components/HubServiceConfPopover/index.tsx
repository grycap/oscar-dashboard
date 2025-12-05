import createServiceApi from "@/api/services/createServiceApi";
import RequestButton from "@/components/RequestButton";
import { Button, ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { generateReadableName, genRandomString, getAllowedVOs } from "@/lib/utils";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { Service } from "@/pages/ui/services/models/service";
import { RefreshCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { RoCrateServiceDefinition } from "@/lib/roCrate";
import HubCardHeader from "../HubCardHeader";

interface HubServiceConfPopoverProps {
    roCrateServiceDef: RoCrateServiceDefinition;
    service: Service;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
		className?: ButtonProps["className"];
		variant?: ButtonProps["variant"];
		title?: string;
}

function HubServiceConfPopover({ roCrateServiceDef, service, isOpen = false, setIsOpen, className = "", variant = "default", title = "Deploy Service" }: HubServiceConfPopoverProps) {
  const {systemConfig, authData } = useAuth();
  const { refreshServices } = useServicesContext();

  const oidcGroups = getAllowedVOs(systemConfig, authData);
	const asyncService = roCrateServiceDef.type.some(t => t.toLowerCase() === "asynchronous");
	const mountBucket = service?.mount;

  function nameService() {
    return `hub-${generateReadableName(6)}-${genRandomString(8).toLowerCase()}`;
  }

  const [formData, setFormData] = useState({
    name: "",
    cpuCores: "1.0",
    memoryRam: "2",
    memoryUnit: "Gi",
    bucket: "",
    vo: "",
    token: "",
    enviromentVars: {} as Record<string, string>,
    enviromentSecrets: {} as Record<string, string>,
  });

  function ifEndpointService(key: string, value: string, serviceName: string): string {
    const newValue = value.replace(/\/services\/([^\/]+)\/exposed/, `/services/${serviceName}/exposed`);
    if (newValue.includes(`/services/${serviceName}/exposed`)) {
      formData.enviromentVars = {
        ...formData.enviromentVars,
        [key]: newValue,
      };
    }
    return newValue;
  }

  const [errors, setErrors] = useState({
    name: false,
    cpuCores: false,
    memoryRam: false,
    bucket: false,
    vo: false,
    token: false,
    enviromentVars: {} as Record<string, boolean>,
    enviromentSecrets: {} as Record<string, boolean>,
  });

  useEffect(() => {
    if (oidcGroups.length > 0 && !formData.vo) {
      setFormData((prev) => ({ ...prev, vo: oidcGroups[0] }));
    }
  }, [oidcGroups]);

  useEffect(() => {
    if (!isOpen) return;

    setFormData((prev) => ({
      ...prev, 
      name: nameService(),
      cpuCores: roCrateServiceDef.cpuRequirements,
      memoryRam: roCrateServiceDef.memoryRequirements,
      memoryUnit: roCrateServiceDef.memoryUnits,
      bucket: "",
      token: genRandomString(128),
      enviromentVars: service.environment?.variables || {},
      enviromentSecrets: service.environment?.secrets || {},
    }));
    setErrors({
      name: false,
      cpuCores: false,
      memoryRam: false,
      bucket: false,
      vo: false,
      token: false,
      enviromentVars: {} as Record<string, boolean>,
      enviromentSecrets: {} as Record<string, boolean>,
    });
  }, [isOpen]);

  const handleDeploy = async () => {
    const newErrors = {
      name: !formData.name,
      cpuCores: !formData.cpuCores,
      memoryRam: !formData.memoryRam,
      bucket: !formData.bucket && asyncService,
      vo: !formData.vo,
      token: !formData.token,
      enviromentVars: Object.fromEntries(Object.entries(formData.enviromentVars).map(([key, value]) => [key, !value || value.length === 0])),
      enviromentSecrets: Object.fromEntries(Object.entries(formData.enviromentSecrets).map(([key, value]) => [key, !value || value.length === 0])),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(error => {
      if (error && typeof error === "object") {
        return Object.values(error).some(value => value);
      }
      return error;
    })) {
      alert.error("Please fill in all fields");
      return;
    }

    try {
      const scriptResponse = await fetch(roCrateServiceDef.scriptUrl);
      const scriptText = await scriptResponse.text();

      service.script = scriptText
      const serviceName = formData.name || nameService();

      const modifiedService: Service = {
        ...service,
        name: serviceName,
        vo: formData.vo,
        memory: `${formData.memoryRam}${formData.memoryUnit}`,
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
        environment: {
          ...service.environment,
          variables: {
            ...formData.enviromentVars,
          },
          secrets: {
            ...formData.enviromentSecrets,
          },
        },
        labels: {
          ...service.labels,
          oscar_hub: "true",
        },
      };
      await createServiceApi(modifiedService);
      refreshServices();
			
      alert.success(`Service ${roCrateServiceDef.name} instance deployed`);
      setIsOpen(false);
    } catch (error) {
      console.log(error)
      alert.error(`Error deploying ${roCrateServiceDef.name} instance`);
    }
  };

  useEffect(() => {
    if (oidcGroups.length) {
      setFormData({ ...formData, vo: oidcGroups[0] });
    }
  }, [oidcGroups.length]);  

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
                  step={0.1}
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
                      step={formData.memoryUnit === "Gi" ? 1 : 256}
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
						{(asyncService || mountBucket) && 
            <div>
              <Label>New Bucket</Label>
              <Input
                  type="input"
                  onFocus={(e) => (e.target.type = "text")}
                  style={{ width: "100%",
                    fontWeight: "normal",
                    }}
                  className={errors.bucket ? "border-red-500 focus:border-red-500" : ""}
                  onChange={(e) => {
                      setFormData({ ...formData, bucket: e.target?.value });
                      if (errors.bucket) setErrors({ ...errors, bucket: false });
                  }}
                  placeholder="Enter new bucket name"
                />
            </div>
						}
            {formData?.enviromentVars && Object.entries(formData.enviromentVars).map(([key, value]) => (
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
            {formData?.enviromentSecrets && Object.entries(formData.enviromentSecrets).map(([key, value]) => (
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
        <DialogFooter>
          <RequestButton className="grid grid-cols-[auto] sm:grid-cols-1 gap-2" variant={"mainGreen"} request={handleDeploy}>
            Deploy
          </RequestButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default HubServiceConfPopover;
