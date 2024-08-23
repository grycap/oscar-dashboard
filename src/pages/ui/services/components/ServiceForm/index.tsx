import { useLastUriParam } from "@/hooks/useLastUriParam";
import { useMemo, useState } from "react";
import ServiceFormTabs from "./components/ServiceFormTabs";
import { ServiceFormTab } from "../../models/service";
import ServiceGeneralTab from "./components/GeneralTab";
import useServicesContext from "../../context/ServicesContext";
import { ServiceViewMode } from "../Topbar";
import { defaultService } from "./utils/initialData";
import ServicesStorageTab from "./components/StorageTab";

function ServiceForm() {
  const { formService, setFormService } = useServicesContext();

  const path = useLastUriParam();

  //will be used by submit function
  const formMode = useMemo(() => {
    const isInCreateMode = path === "create";

    if (isInCreateMode) {
      //setFormService(defaultService);
      return ServiceViewMode.Create;
    }

    return ServiceViewMode.Update;
  }, [path]);

  const [formTab, setFormTab] = useState(ServiceFormTab.General);

  if (!formService) return null;

  return (
    <>
      <ServiceFormTabs tab={formTab} setTab={setFormTab} />
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          flexBasis: 0,
          overflow: "scroll",
        }}
      >
        {formTab === ServiceFormTab.General && <ServiceGeneralTab />}
        {formTab === ServiceFormTab.Storage && <ServicesStorageTab />}
        {formTab === ServiceFormTab["Input - Output"] && (
          <h1>["Input - Output"]</h1>
        )}
      </div>
    </>
  );
}

export default ServiceForm;
