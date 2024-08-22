import { useLastUriParam } from "@/hooks/useLastUriParam";
import { useParams } from "react-router-dom";
import useServicesContext from "../../../context/ServicesContext";
import { useMemo } from "react";
import { ServiceViewMode } from "../../Topbar";
import { defaultService } from "../utils/initialData";
import { Service } from "../../../models/service";

export function useFormService(services: Service[], setFormService: any) {
  const path = useLastUriParam();
  const { serviceId } = useParams();

  const formMode = useMemo(() => {
    const isInCreateMode = path === "create";

    if (isInCreateMode) return ServiceViewMode.Create;

    return ServiceViewMode.Update;
  }, [path]);

  const initialData = useMemo(() => {
    if (formMode === ServiceViewMode.Create) {
      return defaultService;
    }

    if (!services) return;

    console.log("131313 SERVICES", services, serviceId);
    return services.find((s) => s.name === serviceId);
  }, [formMode, services]);

  if (initialData) setFormService(initialData);
}