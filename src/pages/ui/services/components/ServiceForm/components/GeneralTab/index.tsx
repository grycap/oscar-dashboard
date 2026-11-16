import { Input } from "@/components/ui/input";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import {
  LOG_LEVEL,
  Service,
  ServiceVisibility,
} from "@/pages/ui/services/models/service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EnviromentVariables from "./components/EnviromentVariables";
import ServiceFormCell from "../FormCell";
import InlineFDLEditor from "./components/InlineFDLEditor";
import { CheckIcon, CopyIcon, XIcon, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alert } from "@/lib/alert";
import Divider from "@/components/ui/divider";
import { Label } from "@/components/ui/label";
import { ServiceViewMode } from "../../../Topbar";
import InputOutputEditor from "../InputOutputTab";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import EnviromentSecrets from "./components/EnviromentSecrets";
import Annotations from "./components/Annotations";

import { AllowedUsersPopover } from "./components/AllowedUsersPopover";
import { downloadString, getAllowedVOs, getExposedServiceUrl, getFDLAndScriptText } from "@/lib/utils";
import { useEffect } from "react";

function ServiceGeneralTab() {
  const { formService, setFormService, formMode, formFunctions } =
    useServicesContext();

  const { handleChange, onBlur, errors } = formFunctions;
  const { systemConfig, authData } = useAuth();
  const voGroups = getAllowedVOs(systemConfig, authData);
  function voGroupsIsEmpthy(){
    if( voGroups === undefined){ return true}
    else if (JSON.stringify(voGroups) === '[""]'){ return true}
    else {return false}
  } 
  
  const selectedVo = formService?.vo ?? "";
  const selectedLogLevel = formService?.log_level ?? LOG_LEVEL.INFO;
  const modelServingInfo = formService?.model_serving?.inference ?? formService?.model_serving?.llm_inference;
  const modelServingType = formService?.model_serving?.inference
    ? "Inference"
    : formService?.model_serving?.llm_inference
      ? "LLM Inference"
      : undefined;
  const memoryUnits =
    (formService?.memory?.replace(/[0-9]/g, "") as "Mi" | "Gi" | "") ||
    "Mi";
  const memory = formService?.memory?.replace(/[a-zA-Z]/g, "") ?? "";

  const setAllowedUsers = (users: string[]) => {
    setFormService((prev) => ({
      ...prev,
      allowed_users: users
    }));
  };
const serviceToDownload = getFDLAndScriptText(formService)
  

  const visibility = formService?.visibility ?? ServiceVisibility.private;
  const serviceIsRestricted = visibility === ServiceVisibility.restricted;

  useEffect(() => {
    if (!formService) return;
  }, [formService]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <ServiceFormCell title="General Settings">
        <div className="grid grid-cols-1 gap-[10px] w-full max-w-5xl min-w-[720px]">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 items-end w-full">
            <div className="col-span-1">
              <Input
                id="service-name-input"
                flex={1}
                value={formService?.name}
                onChange={(e) => {
                  handleChange(e, "name");
                }}
                label="Service name"
                error={errors.name}
                onBlur={() => onBlur("name")}
                required
                disabled={formMode === ServiceViewMode.Update}
                className="disabled:bg-gray"
              />
            </div>
            <div className="col-span-1 lg:col-span-2">
              {formService?.image &&
              <Input
                id="docker-image-input"
                flex={2}
                value={formService?.image}
                label="Docker image"
                onChange={(e) => {
                  handleChange(e, "image");
                }}
                error={errors.image}
                onBlur={() => onBlur("image")}
                required
              />
              }
            </div>
          </div>
          
          <div className="grid grid-cols-[auto_auto_auto_1fr] gap-5 items-end w-full">
            <div className="min-w-[154px]">
              {voGroupsIsEmpthy() ?
               <></>
                  :
              <>
                <Label>VO</Label>
                <Select
                  value={selectedVo}
                  onValueChange={(value) => {
                    setFormService((service: Service) => {
                      return {
                        ...service,
                        vo: value,
                      };
                    });
                  }}
                >
                  <SelectTrigger id="vo-select-trigger">
                    <SelectValue placeholder="Select a VO" />
                  </SelectTrigger>
                  <SelectContent>
                    {voGroups?.map((vo) => {
                      return (
                        <SelectItem key={vo} value={vo}>
                          {vo}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </>
              }
              
            </div>

            <div className="min-w-[152px]">
              <Label>Log level</Label>
              <Select
                value={selectedLogLevel}
                onValueChange={(value) => {
                  setFormService((service: Service) => {
                    return {
                      ...service,
                      log_level: value as LOG_LEVEL,
                    };
                  });
                }}
              >
                <SelectTrigger id="log-level-select-trigger">
                  <SelectValue placeholder="Log level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LOG_LEVEL).map((value) => {
                    return (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[152px]">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value: ServiceVisibility) => {
                  setFormService((service: Service) => {
                    return {
                      ...service,
                      visibility: value,
                      allowed_users:
                        value === ServiceVisibility.restricted
                          ? service.allowed_users
                          : [],
                    };
                  });
                }}
              >
                <SelectTrigger id="visibility-select-trigger">
                  <SelectValue placeholder="Visibility" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ServiceVisibility).map((value) => {
                    return (
                      <SelectItem key={value} value={value}>
                        {value.toUpperCase()}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {formService.token && (
              <div 
               className="col-span-1"
              >
                <div className="grid grid-cols-[1fr_auto] items-end w-full">
                  <Input
                    id="token-input"
                    value={formService?.token}
                    readOnly
                    label="Token"
                    type="password"
                  />
                  <Button
                    id="copy-token-button"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(formService?.token || "");
                      alert.success("Token copied to clipboard");
                    }}
                  >
                    <CopyIcon size={20}/>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {formMode === ServiceViewMode.Update && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexDirection: "row",
                gap: 50,
              }}
            >
              <div className="flex flex-row gap-2 items-center">
                <strong>Exposed:</strong>
                {formService.expose?.api_port || formService.model_serving ? (
                  <Link
                    to={getExposedServiceUrl(authData.endpoint, formService.name, "", systemConfig?.config)}
                    target="_blank"
                  >
                    <ExternalLink size={18} />
                  </Link>
                ) : (
                  <XIcon size={16} className="pt-[2px]" />
                )}
              </div>
              <div className="flex flex-row gap-2 items-center">
                <strong>Alpine:</strong>
                {formService.alpine ? (
                  <CheckIcon size={16} />
                ) : (
                  <XIcon size={16} className="pt-[2px]" />
                )}
              </div>

              <div className="flex flex-row gap-2 items-center">
                <strong>Interlink:</strong>
                {formService.interlink_node_name ? (
                  formService.interlink_node_name
                ) : (
                  <XIcon size={16} className="pt-[2px]" />
                )}
              </div>
              {serviceIsRestricted && (
                <div className="flex flex-row gap-2 items-center">
                  <strong>Allowed users:</strong>
                  <AllowedUsersPopover
                    allowed_users={formService.allowed_users ?? []}
                    setAllowedUsersInExternalVar={setAllowedUsers}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </ServiceFormCell>
      {modelServingInfo && (
        <>
          <Divider />
          <ServiceFormCell title="Model Serving">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 w-full max-w-6xl min-w-[720px]">
              {modelServingType && (
                <div className="rounded-md border border-sky-200 bg-sky-50 p-3 dark:border-sky-900/60 dark:bg-sky-950/20">
                  <Label>
                    Type
                  </Label>
                  <div className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {modelServingType}
                  </div>
                </div>
              )}
              {formService.model_serving?.inference?.model_format && (
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <Label>
                    Model format
                  </Label>
                  <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                    {formService.model_serving.inference.model_format}
                  </div>
                </div>
              )}
              {formService.model_serving?.inference?.api_version && (
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <Label>
                    API version
                  </Label>
                  <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                    {formService.model_serving.inference.api_version}
                  </div>
                </div>
              )}
              {modelServingInfo.runtime_image && (
                <div className="rounded-md border border-border bg-muted/40 p-3 ">
                  <Label>
                    Runtime image
                  </Label>
                  <div className="mt-1 line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-100 break-all">
                    {modelServingInfo.runtime_image}
                  </div>
                </div>
              )}
              {modelServingInfo.source && (
                <div className="rounded-md border border-border bg-muted/40 p-3">
                  <Label>
                    Model Source
                  </Label>
                  <div className="mt-1 line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-100 break-all">
                    {modelServingInfo.source}
                  </div>
                </div>
              )}
            </div>
          </ServiceFormCell>
        </>
      )}
      <Divider />
      <ServiceFormCell title="Service Resources">
        <div className="grid grid-cols-1 gap-5 w-full max-w-6xl min-w-[720px]">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 w-full max-w-5xl min-w-[720px] ">
            <div className="grid grid-cols-[150px_150px_150px] gap-[10px] items-end">
              <Input
                id="cpu-input"
                value={formService?.cpu}
                onChange={(e) => {
                  handleChange(e, "cpu");
                }}
                label="CPU cores"
                error={errors.cpu}
                type="number"
                step="0.1"
              />
              <Input
                id="memory-input"
                value={memory}
                label="Memory"
                onChange={(e) => {
                  setFormService((service: Service) => {
                    return {
                      ...service,
                      memory: e.target.value + memoryUnits,
                    };
                  });
                }}
                type="number"
                error={errors.memory}
              />
              <Select
                value={memoryUnits}
                onValueChange={(value) => {
                  setFormService((service: Service) => {
                    return {
                      ...service,
                      memory: memory + value,
                    };
                  });
                }}
              >
                <SelectTrigger id="memory-units-select" className="w-[75px]">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mi">Mi</SelectItem>
                  <SelectItem value="Gi">Gi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </ServiceFormCell>
      <Divider />
      <ServiceFormCell title="FDL / Script">
        { (
          <div className="grid gap-5 w-full max-w-6xl min-w-[720px]">
            <InlineFDLEditor mode={formMode === ServiceViewMode.Create ? "inline-edit" : "api"} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Download the service files for review or backup.
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  className="w-full sm:w-auto flex flex-row gap-2 items-center justify-center"
                  variant="secondary"
                  onClick={() => {downloadString(serviceToDownload.fdlText, `${formService.name}.yaml`, "application/yaml")}}
                >
                  <Download size={16} />
                  Download FDL
                </Button>
                <Button
                  className="w-full sm:w-auto flex flex-row gap-2 items-center justify-center"
                  variant="secondary"
                  onClick={() => {downloadString(serviceToDownload.scriptText, `${formService.name}-script.sh`)}}
                >
                  <Download size={16} />
                  Download script
                </Button>
              </div>
            </div>
          </div>
        )}
      </ServiceFormCell>
      <Divider />
      <ServiceFormCell title="Annotations">
        <Annotations />
      </ServiceFormCell>
      <Divider />
      <div className="grid grid-cols-1 2xl:grid-cols-2 w-ful max-w-[1250px] min-w-[720px]">
        <div className="2xl:border-r-2 border-b-2 2xl:border-b-0">
          <ServiceFormCell title="Environment variables">
            <EnviromentVariables />
          </ServiceFormCell>
        </div>
        <ServiceFormCell title="Environment secrets">
          <EnviromentSecrets />
        </ServiceFormCell>
      </div>
      <Divider />
      <InputOutputEditor />
    </div>
  );
}

export default ServiceGeneralTab;
