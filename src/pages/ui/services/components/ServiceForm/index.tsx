import { useLastUriParam } from "@/hooks/useLastUriParam";
import { useMemo, useState } from "react";
import { ServiceViewMode } from "../Topbar";
import ServiceFormTabs from "./components/ServiceFormTabs";
import { ServiceFormTab } from "../../models/service";
import ServiceGeneralTab from "./components/GeneralTab";
import { defaultService } from "./utils/initialData";
import useServicesContext from "../../context/ServicesContext";
import { useParams } from "react-router-dom";

function ServiceForm() {
  const path = useLastUriParam();
  const { serviceId } = useParams();
  const { services } = useServicesContext();

  const formMode = useMemo(() => {
    const isInCreateMode = path === "create";

    if (isInCreateMode) return ServiceViewMode.Create;

    return ServiceViewMode.Update;
  }, [path]);

  const initialData = useMemo(() => {
    if (formMode === ServiceViewMode.Create) {
      return defaultService;
    }

    return services.find((s) => s.name === serviceId);
  }, [formMode]);

  const [service, setService] = useState(initialData);

  const [formTab, setFormTab] = useState(ServiceFormTab.General);

  return (
    <>
      <ServiceFormTabs tab={formTab} setTab={setFormTab} />
      {formTab === ServiceFormTab.General && <ServiceGeneralTab />}
      {formTab === ServiceFormTab.Storage && <h1>St.Storage</h1>}
      {formTab === ServiceFormTab["Input - Output"] && (
        <h1>["Input - Output"]</h1>
      )}
    </>
  );
}

export default ServiceForm;
