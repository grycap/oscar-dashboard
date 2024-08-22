import { useLastUriParam } from "@/hooks/useLastUriParam";
import { useMemo, useState } from "react";
import ServiceFormTabs from "./components/ServiceFormTabs";
import { ServiceFormTab } from "../../models/service";
import ServiceGeneralTab from "./components/GeneralTab";
import useServicesContext from "../../context/ServicesContext";
import { ServiceViewMode } from "../Topbar";
import { defaultService } from "./utils/initialData";

function ServiceForm() {
  const { formService, setFormService } = useServicesContext();

  const path = useLastUriParam();

  //will be used by submit function
  const formMode = useMemo(() => {
    const isInCreateMode = path === "create";

    if (isInCreateMode) {
      setFormService(defaultService);
      return ServiceViewMode.Create;
    }

    return ServiceViewMode.Update;
  }, [path]);

  const [formTab, setFormTab] = useState(ServiceFormTab.General);

  if (!formService) return null;

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
