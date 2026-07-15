import createServiceApi from "@/api/services/createServiceApi";
import RequestButton from "@/components/RequestButton";
import { Button, ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { fetchFromGitHubOptions, generateReadableName, genRandomString, getAllowedVOs } from "@/lib/utils";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import {
  Service,
} from "@/pages/ui/services/models/service";
import { RefreshCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RoCrateAgentServiceDefinition } from "@/lib/roCrate";
import { errorMessage } from "@/lib/error";
import AgentsCardHeader from "../AgentsCardHeader";
import InputOutputStorageForm, { InputOutputStorageFormRef } from "@/components/InputOutputBucketForm";
import StorageSelectForm, { StorageSelectFormRef } from "@/components/StorageSelectForm";
import AgentsModelForm, { AgentsModelFormRef } from "../../../AgentsModelForm";

interface AgentsServiceConfPopoverProps {
    roCrateServiceDef: RoCrateAgentServiceDefinition;
    service: Service;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
		className?: ButtonProps["className"];
		variant?: ButtonProps["variant"];
		title?: string;
}

const RESERVED_ENV_VARS = [
  "LLM_PROVIDER_NAME",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "AGENT_SOUL",
  "AGENT_SKILLS",
  "HERMES_PORT",
  "HERMES_HOST",
  "HERMES_DATA_DIR",
  "HERMES_DASHBOARD_TUI",
  "HERMES_DASHBOARD_INSECURE"
];

const RESERVED_SECRETS_VARS = [
  "OPENAI_API_KEY"
];

function AgentsServiceConfPopover({ roCrateServiceDef, service, isOpen = false, setIsOpen, className = "", variant = "default", title = "Deploy Service" }: AgentsServiceConfPopoverProps) {
  const {systemConfig, authData } = useAuth();
  const { refreshServices } = useServicesContext();

  const inputOutputBucketFormRef = useRef<InputOutputStorageFormRef>(null);
  const storageFormRef = useRef<StorageSelectFormRef>(null);
  const agentsModelFormRef = useRef<AgentsModelFormRef>(null);

  const oidcGroups = getAllowedVOs(systemConfig, authData);
	const asyncService = roCrateServiceDef.type.some(t => t.toLowerCase() === "asynchronous");
  const agentServiceMode = roCrateServiceDef.agentType;
  const mountBucket = service?.mount;
  const serviceVolume = service?.volume;

  function nameService() {
    return `hermes-${generateReadableName(6)}-${genRandomString(8).toLowerCase()}`;
  }

  const filterReservedEnvVars = (envVars?: Record<string, string>): Record<string, string> =>
    Object.fromEntries(
      Object.entries(envVars ?? {}).filter(
        ([key]) => !RESERVED_ENV_VARS.includes(key)
      )
    );
  
  const filterReservedSecretsVars = (secrets?: Record<string, string>): Record<string, string> =>
    Object.fromEntries(
      Object.entries(secrets ?? {}).filter(
        ([key]) => !RESERVED_SECRETS_VARS.includes(key)
      )
    );

  const [formData, setFormData] = useState({
    name: "",
    cpuCores: "1.0",
    memoryRam: "2",
    memoryUnit: "Gi",
    vo: "",
    enviromentVars: {} as Record<string, string>,
    enviromentSecrets: {} as Record<string, string>,
    nodePort: [] as number[],
  });
  const [agentSoul, setAgentSoul] = useState("");
  const [agentSkills, setAgentSkills] = useState<Array<{ name: string; content: string }>>([]);

  function ifEndpointService(key: string, value: string, serviceName: string): string {
    const newValue = value.replace(
      /\/services\/([^/]+)\/exposed/,
      `/services/${serviceName}/exposed`
    );
    if (newValue.includes(`/services/${serviceName}/exposed`)) {
      formData.enviromentVars = {
        ...formData.enviromentVars,
        [key]: newValue,
      };
    }
    return newValue;
  }

  async function fetchTemplateText(url: string) {
    const response = await fetch(url, fetchFromGitHubOptions);
  
    return response.text();
  }

  const [errors, setErrors] = useState({
    name: false,
    cpuCores: false,
    memoryRam: false,
    vo: false,
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
    if (!isOpen) return;

    setFormData((prev) => ({
      ...prev, 
      name: nameService(),
      cpuCores: roCrateServiceDef.cpuRequirements,
      memoryRam: roCrateServiceDef.memoryRequirements,
      memoryUnit: roCrateServiceDef.memoryUnits,
      vo: oidcGroups[0] ?? "",
      enviromentVars: filterReservedEnvVars(service.environment?.variables),
      enviromentSecrets: filterReservedSecretsVars(service.environment?.secrets),
      nodePort: service.expose?.nodePort?.length > 0 ? service.expose.nodePort : [],
    }));
    setAgentSoul("");
    setAgentSkills([]);
    setErrors({
      name: false,
      cpuCores: false,
      memoryRam: false,
      vo: false,
      enviromentVars: {} as Record<string, boolean>,
      enviromentSecrets: {} as Record<string, boolean>,
      nodePort: false,
    });

    let cancelled = false;

    if (roCrateServiceDef.agentSoulUrl) {
      fetchTemplateText(roCrateServiceDef.agentSoulUrl)
        .then((text) => {
          if (!cancelled) {
            setAgentSoul(text);
          }
        })
        .catch((error) => {
          console.error(`Error fetching agent soul: ${error}`);
        });
    }

    if (roCrateServiceDef.agentSkillUrl) {
      Promise.all(
        roCrateServiceDef.agentSkillUrl.map(async (url, index) => ({
          name: `Skill ${index + 1}`,
          content: await fetchTemplateText(url),
        }))
      )
        .then((skills) => {
          if (!cancelled) {
            setAgentSkills(skills);
          }
        })
        .catch((error) => {
          console.error(`Error fetching agent skills: ${error}`);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, roCrateServiceDef, service, serviceVolume]);

  const handleDeploy = async () => {
    const newErrors = {
      name: !formData.name,
      cpuCores: !formData.cpuCores,
      memoryRam: !formData.memoryRam,
      vo: !formData.vo,
      enviromentVars: Object.fromEntries(Object.entries(formData.enviromentVars).map(([key, value]) => [key, !value || value.length === 0])),
      enviromentSecrets: Object.fromEntries(Object.entries(formData.enviromentSecrets).map(([key, value]) => [key, !value || value.length === 0])),
      nodePort: !!service?.expose?.nodePort && !formData.nodePort,
    };

    setErrors(newErrors);
    
    const storageValid = storageFormRef.current ? storageFormRef.current.validate() : (!serviceVolume && !mountBucket && roCrateServiceDef.agentType !== "exposed");
    const inputOutputStorageValid = inputOutputBucketFormRef.current ? inputOutputBucketFormRef.current.validate() : roCrateServiceDef.agentType !== "on-demand";
    const agentsModelFormValid = agentsModelFormRef.current ? agentsModelFormRef.current.validate() : false;
    const hasValidationErrors = Object.values(newErrors).some((error) => {
      if (error && typeof error === "object") {
        return Object.values(error).some(Boolean);
      }
      return Boolean(error);
    });

    if (hasValidationErrors || !storageValid || !inputOutputStorageValid || !agentsModelFormValid) {
      console.log("Validation failed", newErrors, "storageValid:", storageValid, "inputOutputStorageValid:", inputOutputStorageValid, "agentsModelFormValid:", agentsModelFormValid);
      alert.error("Please fill in all required fields");
      return;
    }
    const storageConfig = storageFormRef.current?.getStorageConfig() ?? undefined;
    const inputOutputStorageConfig = inputOutputBucketFormRef.current?.getInputOutputStorageConfig() ?? undefined;
    const agentsModelConfig = agentsModelFormRef.current!.getAgentsModelConfig() ?? undefined;

      const secrets = { ...service.environment.secrets };
      if (agentsModelConfig.apiKey.trim()) {
        secrets.OPENAI_API_KEY = agentsModelConfig.apiKey.trim();
      } else {
        delete secrets.OPENAI_API_KEY;
      }

    const workspaceDir = agentServiceMode === "exposed" && storageConfig
        ? `/mnt/volumes/${storageConfig.volume}`
          : `/tmp/${formData.name}`;

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
        environment: {
          ...service.environment,
          variables: {
            ...formData.enviromentVars,
            HERMES_DATA_DIR: workspaceDir,
            HERMES_DASHBOARD_TUI: agentServiceMode === "exposed" ? "true" : "",
            HERMES_DASHBOARD_INSECURE: agentServiceMode === "exposed" ? "true" : "",
            LLM_PROVIDER_NAME: agentsModelConfig.providerName,
            OPENAI_BASE_URL: agentsModelConfig.baseUrl,
            OPENAI_MODEL: agentsModelConfig.model,
            AGENT_SOUL: agentSoul,
            AGENT_SKILLS: agentSkills.map((skill) => skill.content).join("\n\n"),
          },
          secrets: {
            ...formData.enviromentSecrets,
          },
        },
        labels: {
          ...service.labels,
          oscar_agent: "true",
          oscar_agent_type: agentServiceMode,
        },
        expose: {
          ...service.expose,
          nodePort: formData.nodePort,
        },
        volume: undefined,
        ...(storageConfig && agentServiceMode === "exposed" ? { 
          volume: {
            name: storageConfig.volume,
            size: storageConfig.volumeSize ? `${storageConfig.volumeSize.trim()}Gi` : undefined,
            mount_path: `/mnt/volumes/${storageConfig.volume}`,
          }
        } : {}),
        input: [],
        output: [],
        ...(inputOutputStorageConfig && agentServiceMode === "on-demand" ? {
          input: inputOutputStorageConfig.input,
          output: inputOutputStorageConfig.output,
        } : {}),
      };
      await createServiceApi(modifiedService);
      refreshServices();
			
      alert.success(`Service ${roCrateServiceDef.name} instance deployed`);
      setIsOpen(false);
    } catch (error) {
      console.log(error)
      alert.error(`Error deploying ${roCrateServiceDef.name} instance: ${errorMessage(error)}`);
    }
  };

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
          <AgentsCardHeader roCrateServiceDef={roCrateServiceDef} card="deploy" />
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
            <div>
              <AgentsModelForm agentServiceType={agentServiceMode} 
              noCustomSoulFile={true} 
              noCustomSkillFiles={true} 
              preloadAgentSkills={agentSkills ?? []}
              preloadAgentSoul={agentSoul ?? ""}
              ref={agentsModelFormRef} />
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
              <Label>Input/Output Bucket</Label>
              <InputOutputStorageForm ref={inputOutputBucketFormRef} />
            </div>
						}
            {(serviceVolume || mountBucket) &&
            <div>
              <Label>Storage Configuration</Label>
              <StorageSelectForm ref={storageFormRef} manageBucket={!!mountBucket} manageVolume={!!serviceVolume} />
            </div>
            }
            {Object.keys(formData?.enviromentVars ?? {}).length > 0 && (
            <div>
              <Label>Environment Variables</Label>
              <hr className="mb-2"/>

              {Object.entries(formData.enviromentVars).map(([key, value]) => (
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

export default AgentsServiceConfPopover;
