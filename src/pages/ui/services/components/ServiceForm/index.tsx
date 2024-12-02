import { useState } from "react";
import ServiceFormTabs from "./components/ServiceFormTabs";
import { ServiceFormTab } from "../../models/service";
import ServiceGeneralTab from "./components/GeneralTab";
import useServicesContext from "../../context/ServicesContext";
import ServicesStorageTab from "./components/StorageTab";

function ServiceForm() {
  const { formService } = useServicesContext();

  const [formTab, setFormTab] = useState(ServiceFormTab.General);

  if (Object.keys(formService).length === 0) return null;

  return (
    <>
      <ServiceFormTabs tab={formTab} setTab={setFormTab} />
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          flexBasis: 0,
          overflow: "auto",
        }}
      >
        {formTab === ServiceFormTab.General && <ServiceGeneralTab />}
        {formTab === ServiceFormTab.Storage && <ServicesStorageTab />}
      </div>
    </>
  );
}

export default ServiceForm;
