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
import { CheckIcon, CopyIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alert } from "@/lib/alert";
import Divider from "@/components/ui/divider";
import { Label } from "@/components/ui/label";
import { ServiceViewMode } from "../../../Topbar";
import InputOutputEditor from "../InputOutputTab";

function ServiceGeneralTab() {
  const { formService, setFormService, formMode } = useServicesContext();

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof Service
  ) {
    setFormService((service: Service) => {
      return {
        ...service,
        [key]: e.target.value,
      };
    });
  }

  const [memoryUnits, setMemoryUnits] = useState("Mi" as "Mi" | "Gi");

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
            }}
          >
            <Input
              flex={1}
              value={formService?.name}
              onChange={(e) => {
                handleChange(e, "name");
              }}
              label="Service name"
            />
            <Input
              flex={2}
              value={formService?.image}
              label="Docker image"
              onChange={(e) => {
                handleChange(e, "image");
              }}
            />
          </section>
          <div className="flex flex-row w-full items-end gap-5">
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
                  value={formService?.token}
                  readOnly
                  label="Token"
                  type="password"
                  width="600px"
                />
                <Button
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
                <SelectTrigger className="w-[250px]">
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
              value={formService?.cpu}
              onChange={(e) => {
                handleChange(e, "cpu");
              }}
              label="CPU cores"
            />
            <Input
              value={formService?.memory?.replace("Mi", "")?.replace("Gi", "")}
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
            />
            <Select
              value={memoryUnits}
              onValueChange={(value) => {
                setMemoryUnits(value as "Mi" | "Gi");
              }}
            >
              <SelectTrigger className="w-[75px]">
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
      <Divider />
      <InputOutputEditor />
    </div>
  );
}

export default ServiceGeneralTab;
