import { Input } from "@/components/ui/input";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { LOG_LEVEL, Service } from "@/pages/ui/services/models/service";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EnviromentVariables from "./components/EnviromentVariables";
import ServiceFormCell from "../FormCell";
import ScriptButton from "./components/ScriptButton";
import { CheckIcon, CopyIcon, XIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alert } from "@/lib/alert";
import Divider from "@/components/ui/divider";
import { Label } from "@/components/ui/label";
import { ServiceViewMode } from "../../../Topbar";
import InputOutputEditor from "../InputOutputTab";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import EnviromentSecrets from "./components/EnviromentSecrets";

function ServiceGeneralTab() {
  const { formService, setFormService, formMode, formFunctions } =
    useServicesContext();

  const { handleChange, onBlur, errors } = formFunctions;
  const { systemConfig, authData } = useAuth();
  const voGroups = systemConfig?.config.oidc_groups;

  const [memoryUnits, setMemoryUnits] = useState<"Mi" | "Gi">(formService?.memory?.replace(/[0-9]/g, "") as "Mi" | "Gi");
  const [memory, setMemory] = useState<string>(formService?.memory?.replace(/[a-zA-Z]/g, ""));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <ServiceFormCell title="General Settings">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 10,
          }}
        >
          <section
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              gap: 10,
              alignItems: "top",
            }}
          >
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
          </section>
          <div className="flex flex-row w-full items-end gap-5">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.375rem",
                minWidth: "200px",
              }}
            >
              <Label>VO</Label>
              <Select
                value={formService?.vo}
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
            </div>

            <div
              style={{
                width: "50%",
                display: "flex",
                flexDirection: "column",
                gap: "0.375rem",
              }}
            >
              <Label>Log level</Label>
              <Select
                value={formService?.log_level}
                onValueChange={(value) => {
                  setFormService((service: Service) => {
                    return {
                      ...service,
                      log_level: value as LOG_LEVEL,
                    };
                  });
                }}
              >
                <SelectTrigger
                  className="w-[250px]"
                  id="log-level-select-trigger"
                >
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
            {formService.token && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "end",

                  gap: 10,
                }}
              >
                <Input
                  id="token-input"
                  value={formService?.token}
                  readOnly
                  label="Token"
                  type="password"
                  width="600px"
                />
                <Button
                  id="copy-token-button"
                  variant="ghost"
                  style={{
                    height: "39px",
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(formService?.token || "");
                    alert.success("Token copied to clipboard");
                  }}
                >
                  <CopyIcon />
                </Button>
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
                {formService.expose?.api_port ? (
                  <Link
                    to={`${
                      authData.endpoint
                    }/system/services/${formService.name}/exposed/`}
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

              <div className="flex flex-row gap-2 items-center">
                <strong>Allowed users:</strong>
                {formService.allowed_users?.length ? (
                  formService.allowed_users.join(", ")
                ) : (
                  <XIcon size={16} className="pt-[2px]" />
                )}
              </div>
            </div>
          )}
        </div>
      </ServiceFormCell>
      <Divider />
      <ServiceFormCell title="Service specifications">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 10,
          }}
        >
          <ScriptButton />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              alignItems: "end",
              gap: 10,
            }}
          >
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
                setMemory(e.target.value);
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
                setMemoryUnits(value as "Mi" | "Gi");
                setFormService((service: Service) => {
                  return {
                    ...service,
                    memory: memory + value,
                  };
                });
              }}
            >
              <SelectTrigger id="memory-units-select" className="w-[75px]">
                <SelectValue placeholder="Order by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mi">Mi</SelectItem>
                <SelectItem value="Gi">Gi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ServiceFormCell>
      <Divider />
      <ServiceFormCell title="Enviroment variables">
        <EnviromentVariables />
      </ServiceFormCell>
      <ServiceFormCell title="Enviroment secrets">
        <EnviromentSecrets />
      </ServiceFormCell>
      <Divider />
      <InputOutputEditor />
    </div>
  );
}

export default ServiceGeneralTab;
