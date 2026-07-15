import createServiceApi from "@/api/services/createServiceApi";
import CustomSwitch from "@/components/CustomSwitch";
import InputOutputStorageForm, { InputOutputStorageFormRef } from "@/components/InputOutputBucketForm";
import RequestButton from "@/components/RequestButton";
import StorageSelectForm, { StorageSelectFormRef } from "@/components/StorageSelectForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { errorMessage } from "@/lib/error";
import { fetchFromGitHubOptions, generateReadableName, genRandomString, getAllowedVOs, isVersionLower } from "@/lib/utils";
import yamlToServices from "@/pages/ui/services/components/FDL/utils/yamlToService";
import { defaultService } from "@/pages/ui/services/components/ServiceForm/utils/initialData";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { Service } from "@/pages/ui/services/models/service";
import OscarColors from "@/styles";
import { Plus, RefreshCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AgentsModelForm, { AgentsModelFormRef, agentType } from "../AgentsModelForm";

const HERMES_FDL_URL = "https://raw.githubusercontent.com/grycap/oscar-agents/refs/heads/main/agents/hermes-dashboard/fdl.yml";
const HERMES_SCRIPT_URL = "https://raw.githubusercontent.com/grycap/oscar-agents/refs/heads/main/agents/hermes-dashboard/script.sh";

async function fetchTemplateText(url: string, label: string) {
  const response = await fetch(url, fetchFromGitHubOptions);

  if (!response.ok) {
    throw Error(`Unable to fetch Hermes ${label}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function AgentFormPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const { systemConfig, authData, clusterInfo } = useAuth();
  const { refreshServices } = useServicesContext();
  const oidcGroups = getAllowedVOs(systemConfig, authData);
  const [withStorage, setWithStorage] = useState(false);
  const storageFormRef = useRef<StorageSelectFormRef | null>(null);
  const inputOutputBucketFormRef = useRef<InputOutputStorageFormRef>(null);
  const agentsModelFormRef = useRef<AgentsModelFormRef>(null);
  const [customDockerImage, setCustomDockerImage] = useState(false);

  function nameService() {
    return `hermes-${generateReadableName(6)}-${genRandomString(8).toLowerCase()}`;
  }

  const [formData, setFormData] = useState({
    name: "",
    cpuCores: "2.0",
    memoryRam: "2",
    memoryUnit: "Gi",
    vo: "",
    agentType: "exposed" as agentType,
    image: "",
  });

  const [errors, setErrors] = useState({
    name: false,
    cpuCores: false,
    memoryRam: false,
    vo: false,
    image: false,
    agentType: false,
  });

  useEffect(() => {
    if (oidcGroups.length > 0 && !formData.vo) {
      setFormData((prev) => ({ ...prev, vo: oidcGroups[0] }));
    }
  }, [oidcGroups, formData.vo]);

  useEffect(() => {
    if (!isOpen) return;
    setCustomDockerImage(false);
    setFormData((prev) => ({
      ...prev,
      name: nameService(),
      cpuCores: "1",
      memoryRam: "1",
      memoryUnit: "Gi",
      vo: oidcGroups[0] ?? "",
      agentType: "exposed" as agentType,
      image: "",
    }));
    setErrors({
      name: false,
      cpuCores: false,
      memoryRam: false,
      vo: false,
      image: false,
      agentType: false,
    });
    setWithStorage(false);
  }, [isOpen]);

  const handleDeploy = async () => {
    const newErrors = {
      name: !formData.name,
      cpuCores: !formData.cpuCores,
      memoryRam: !formData.memoryRam,
      vo: !formData.vo,
      image: customDockerImage && !formData.image.trim(),
      agentType: !formData.agentType,
    };

    setErrors(newErrors);

    const storageValid = storageFormRef.current ? storageFormRef.current.validate() : true;
    const inputOutputStorageValid = inputOutputBucketFormRef.current ? inputOutputBucketFormRef.current.validate() : formData.agentType !== "on-demand";
    const agentsModelFormValid = agentsModelFormRef.current ? agentsModelFormRef.current.validate() : false;
    if (Object.values(newErrors).some(Boolean) || !storageValid || !inputOutputStorageValid || !agentsModelFormValid) {
      console.error("Form validation failed", { newErrors, storageValid, inputOutputStorageValid, agentsModelFormValid });
      alert.error("Please fill in all required fields");
      return;
    }
    const storageConfig = storageFormRef.current?.getStorageConfig() ?? undefined;
    const inputOutputStorageConfig = inputOutputBucketFormRef.current?.getInputOutputStorageConfig() ?? undefined;
    const agentsModelConfig = agentsModelFormRef.current!.getAgentsModelConfig() ?? undefined;

    try {
      const [fdlText, scriptText] = await Promise.all([
        fetchTemplateText(HERMES_FDL_URL, "FDL"),
        fetchTemplateText(HERMES_SCRIPT_URL, "script"),
      ]);

      const services = yamlToServices(
        fdlText,
        scriptText,
        !!clusterInfo && !isVersionLower(clusterInfo.version, "v4.1.0")
      );
      if (!services?.length) throw Error("No services found");

      const service = services[0];
      const secrets = { ...service.environment.secrets };
      if (agentsModelConfig.apiKey.trim()) {
        secrets.OPENAI_API_KEY = agentsModelConfig.apiKey.trim();
      } else {
        delete secrets.OPENAI_API_KEY;
      }
      const serviceName = formData.name || nameService();
      const workspaceDir = withStorage && formData.agentType === "exposed" && storageConfig
        ? `/mnt/volumes/${storageConfig.volume}`
          : `/tmp/${serviceName}`;

      const modifiedService: Service = {
        ...service,
        name: formData.name,
        vo: formData.vo,
        cpu: formData.cpuCores,
        memory: `${formData.memoryRam}${formData.memoryUnit}`,
        image: customDockerImage && formData.image ? formData.image : service.image,
        environment: {
          variables: {
            ...service.environment.variables,
            HERMES_DATA_DIR: workspaceDir,
            HERMES_DASHBOARD_TUI: formData.agentType === "exposed" ? "true" : "",
            HERMES_DASHBOARD_INSECURE: formData.agentType === "exposed" ? "true" : "",
            LLM_PROVIDER_NAME: agentsModelConfig.providerName,
            OPENAI_BASE_URL: agentsModelConfig.baseUrl,
            OPENAI_MODEL: agentsModelConfig.model,
            AGENT_SOUL: agentsModelConfig.agentSoul,
            AGENT_SKILLS: agentsModelConfig.agentSkills.map((skill) => skill.content).join("\n\n"),
          },
          secrets,
        },
        labels: {
          ...service.labels,
          oscar_agent: "true",
          oscar_agent_type: formData.agentType,
        },
        expose: defaultService.expose,
        ...(formData.agentType === "exposed" ? {
        expose: {
          ...service.expose,
          min_scale: 1,
          max_scale: 1,
          api_port: [9119],
          cpu_threshold: 90,
          rewrite_target: false,
          set_auth: true,
          auth_type: "forward",
          health_path: "/api/status",
          probe_mode: "direct",
        }} : {}),
        volume: undefined,
        ...(storageConfig && formData.agentType === "exposed" ? { 
          volume: {
            name: storageConfig.volume,
            size: storageConfig.volumeSize ? `${storageConfig.volumeSize.trim()}Gi` : undefined,
            mount_path: `/mnt/volumes/${storageConfig.volume}`,
          }
        } : {}),
        input: [],
        output: [],
        ...(inputOutputStorageConfig && formData.agentType === "on-demand" ? {
          input: inputOutputStorageConfig.input,
          output: inputOutputStorageConfig.output,
        } : {}),
      };



      await createServiceApi(modifiedService);
      refreshServices();

      alert.success("Hermes Agent deployed");
      setIsOpen(false);
    } catch (error) {
      alert.error(`Error deploying Hermes Agent: ${errorMessage(error)}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="mainGreen"
          tooltipLabel="New Agent Instance"
          onClick={() => { setIsOpen(false); }}
        >
          <Plus size={20} className="mr-2" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[620px] max-h-[90%] gap-4 flex flex-col">
        <DialogHeader>
          <DialogTitle>
            <span style={{ color: OscarColors.DarkGrayText }}>
              Hermes Agent Configuration
            </span>
          </DialogTitle>
        </DialogHeader>
        <hr />
        <div className="grid grid-cols-1 gap-y-3 sm:gap-x-2 overflow-y-auto pr-1">
          <div>
            <div className="flex flex-row items-center">
              <Label htmlFor="name">Service name</Label>
              <Button variant="link" size="icon" onClick={() => setFormData({ ...formData, name: nameService() })}>
                <RefreshCcwIcon size={16}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "rotate(90deg)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "rotate(0deg)"; }}
                />
              </Button>
            </div>
            <Input
              id="name"
              placeholder="Enter service name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: false });
              }}
              error={errors.name ? "Service name is required" : undefined}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
            <div>
              <Label htmlFor="cpu-cores">CPU Cores</Label>
              <Input
                id="cpu-cores"
                type="number"
                step={0.1}
                value={formData.cpuCores}
                error={errors.cpuCores ? "CPU Cores is required" : undefined}
                onChange={(e) => {
                  setFormData({ ...formData, cpuCores: e.target.value });
                  if (errors.cpuCores) setErrors({ ...errors, cpuCores: false });
                }}
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <div>
                <Label htmlFor="memory-ram">RAM</Label>
                <Input
                  id="memory-ram"
                  type="number"
                  step={formData.memoryUnit === "Gi" ? 1 : 256}
                  value={formData.memoryRam}
                  onChange={(e) => {
                    setFormData({ ...formData, memoryRam: e.target.value });
                    if (errors.memoryRam) setErrors({ ...errors, memoryRam: false });
                  }}
                  error={errors.memoryRam ? "RAM is required" : undefined}
                />
              </div>
              <Select
                value={formData.memoryUnit}
                onValueChange={(value) => setFormData({ ...formData, memoryUnit: value })}
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
          </div>
          <div>
            <CustomSwitch checked={customDockerImage} onChange={() => setCustomDockerImage(!customDockerImage)} title="Use custom Docker image" />
            {customDockerImage && (
              <div className="mt-2">
                <Label htmlFor="custom-docker-image">Custom Docker Image</Label>
                <Input
                  id="custom-docker-image"
                  placeholder="Enter custom Docker image"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value });
                    if (errors.image) setErrors({ ...errors, image: false });
                  }}
                  error={errors.image ? "Custom Docker image is required" : undefined}
                />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="agent-type">Agent Type</Label>
            <Select
              value={formData.agentType}
              onValueChange={(value) => {
                setFormData({ ...formData, agentType: value as agentType });
                if (errors.agentType) setErrors({ ...errors, agentType: false });
              }}
            >
              <SelectTrigger id="agent-type" className={errors.agentType ? "border-red-500 focus:border-red-500" : ""}>
                <SelectValue placeholder="Select an agent type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exposed">Hermes Dashboard</SelectItem>
                <SelectItem value="on-demand">Hermes Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AgentsModelForm agentServiceType={formData.agentType} ref={agentsModelFormRef} />
          {formData.agentType === "on-demand" ?
          <>
            <div>
              <Label>Input/Output Storage</Label>
              <InputOutputStorageForm ref={inputOutputBucketFormRef} />
            </div>
          </>
          :
          <>
            <Label>Persistent Storage</Label>
            <CustomSwitch checked={withStorage} onChange={() => setWithStorage(!withStorage)} title="Add storage" />
            {withStorage && (
              <StorageSelectForm ref={storageFormRef} manageBucket={false} />
            )}
          </>
          }
        </div>
        <DialogFooter>
          <RequestButton className="grid grid-cols-[auto] sm:grid-cols-1 gap-2" variant="mainGreen" request={handleDeploy}>
            Deploy
          </RequestButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AgentFormPopover;