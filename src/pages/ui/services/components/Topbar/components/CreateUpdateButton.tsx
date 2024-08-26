import { Button } from "@/components/ui/button";
import useServicesContext from "../../../context/ServicesContext";
import createServiceApi from "@/api/services/createServiceApi";
import { alert } from "@/lib/alert";
import updateServiceApi from "@/api/services/updateServiceApi";
import { useMemo } from "react";
import { Service } from "../../../models/service";

interface Props {
  isInCreateMode: boolean;
}

export function CreateUpdateButton({ isInCreateMode }: Props) {
  const { formService, setFormService } = useServicesContext();

  const createServiceModel = useMemo(() => {
    return {
      cpu: formService.cpu,
      image: formService.image,
      imageRules: [null],
      imagePullSecrets: [],
      input: formService.input,
      limitsMemory: formService.memory?.replace("Mi", "").replace("Gi", ""),
      log_level: "INFO",
      memory: formService.memory,
      name: formService.name,
      output: formService.output,
      script: formService.script,
      valid: true,
    };
  }, [formService]);

  async function handleAction() {
    if (isInCreateMode) {
      try {
        await createServiceApi(createServiceModel as unknown as Service);
        alert.success("Service created successfully");
      } catch (error) {
        alert.error("Failed to create service");
      }
    } else {
      try {
        await updateServiceApi(formService);
        alert.success("Service updated successfully");
      } catch (error) {
        alert.error("Failed to update service");
      }
    }
  }

  return (
    <Button
      style={{ marginLeft: "auto" }}
      variant="mainGreen"
      onClick={handleAction}
    >
      {isInCreateMode ? "Create" : "Update"}
    </Button>
  );
}
