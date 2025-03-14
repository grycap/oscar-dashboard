import { OscarStyles } from "@/styles";
import ServiceBreadcrumb from "./components/Breadcrumbs";
import { useEffect } from "react";
import ServicesFilterBy from "./components/FilterBy";
import AddServiceButton from "./components/CreateServiceButton";
import CreateUpdateServiceTabs from "./components/CreateUpdateServiceTabs";
import UserInfo from "@/components/UserInfo";
import useServicesContext from "../../context/ServicesContext";

export enum ServiceViewMode {
  List = "List",
  Create = "Create",
  Update = "Update",
}

function ServicesTopbar() {
  const { formMode } = useServicesContext();

  useEffect(() => {
    document.title = "OSCAR - Services";
  }, []);

  return (
    <div
      style={{
        height: "64px",
        borderBottom: OscarStyles.border,
        display: "flex",
        flexDirection: "row",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          gap: 10,
        }}
      >
        <ServiceBreadcrumb />

        {formMode === ServiceViewMode.List ? (
          <>
            <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>
              <ServicesFilterBy />
            </div>
            <AddServiceButton />
          </>
        ) : (
          <CreateUpdateServiceTabs mode={formMode} />
        )}
      </div>
      <UserInfo />
    </div>
  );
}

export default ServicesTopbar;
