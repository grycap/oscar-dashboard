import useServicesContext from "../../../context/ServicesContext";
import createServiceApi from "@/api/services/createServiceApi";
import { alert } from "@/lib/alert";
import updateServiceApi from "@/api/services/updateServiceApi";
import { useMemo } from "react";
import { Service } from "../../../models/service";
import getServicesApi from "@/api/services/getServicesApi";
import { useNavigate } from "react-router-dom";
import RequestButton from "@/components/RequestButton";
import { AxiosError } from "axios";

interface Props {
  isInCreateMode: boolean;
}

export function CreateUpdateServiceButton({ isInCreateMode }: Props) {
  const { formService, setServices } = useServicesContext();

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
  const navigate = useNavigate();

  async function handleAction() {
    try {
      if (isInCreateMode) {
        await createServiceApi(createServiceModel as unknown as Service);
        alert.success("Service created successfully");
        navigate(`/ui/services/${createServiceModel.name}/settings`);
      } else {
        await updateServiceApi(formService);
        alert.success("Service updated successfully");
      }

      const newServices = await getServicesApi();
      setServices(newServices);
    } catch (error) {
      const message = (error as AxiosError).response?.data;
      if (isInCreateMode) {
        alert.error(
          "Failed to create service" + (message ? ": " + message : "")
        );
      } else {
        alert.error(
          "Failed to update service" + (message ? ": " + message : "")
        );
      }
    }
  }

  return (
    <RequestButton
      style={{ marginLeft: "auto" }}
      variant="mainGreen"
      request={handleAction}
    >
      {isInCreateMode ? "Create" : "Update"}
    </RequestButton>
  );
}
