import { Input } from "@/components/ui/input";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { Service } from "@/pages/ui/services/models/service";
import { OscarStyles } from "@/styles";
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
import { CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alert } from "@/lib/alert";

function ServiceGeneralTab() {
  const { formService, setFormService } = useServicesContext();
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

  const Divider = () => {
    return (
      <div
        style={{
          width: "100%",
          height: "1px",
          borderTop: OscarStyles.border,
        }}
      ></div>
    );
  };

  const [memoryUnits, setMemoryUnits] = useState("Mi" as "Mi" | "Gi");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        justifyContent: "flex-start",
      }}
    >
      <ServiceFormCell
        title="General Settings"
        subtitle="Configure the service name and a container image to use"
      >
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
          {formService.token && (
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
                value={formService?.token}
                readOnly
                label="Token"
                type="password"
                width="60%"
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
        </div>
      </ServiceFormCell>
      <Divider />
      <ServiceFormCell
        title="Service specifications"
        subtitle="Adjust container resources and provide a script for the processing of files"
      >
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
      <ServiceFormCell
        title="Enviroment variables"
        subtitle="Provide environment variables to the service adding them here"
      >
        <EnviromentVariables />
      </ServiceFormCell>
    </div>
  );
}

export default ServiceGeneralTab;
