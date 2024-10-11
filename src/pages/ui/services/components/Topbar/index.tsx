import { OscarStyles } from "@/styles";
import ServiceBreadcrumb from "./components/Breadcrumbs";
import { useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import ServicesFilterBy from "./components/FilterBy";
import ServicesOrderBy from "./components/OrderBy";
import AddServiceButton from "./components/CreateServiceButton";
import CreateUpdateServiceTabs from "./components/CreateUpdateServiceTabs";
import UserInfo from "@/components/UserInfo";

export enum ServiceViewMode {
  List = "List",
  Create = "Create",
  Update = "Update",
}

function ServicesTopbar() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x && x !== "ui");
  const [_, serviceId] = pathnames;

  useEffect(() => {
    document.title = "OSCAR - Services";
  }, []);

  const mode = useMemo(() => {
    if (!serviceId) {
      return ServiceViewMode.List;
    }

    if (serviceId === "create") {
      return ServiceViewMode.Create;
    }

    return ServiceViewMode.Update;
  }, [pathnames]);

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

        {mode === ServiceViewMode.List ? (
          <>
            <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>
              <ServicesFilterBy />
              <ServicesOrderBy />
            </div>
            <AddServiceButton />
          </>
        ) : (
          <CreateUpdateServiceTabs mode={mode} />
        )}
      </div>
      <UserInfo />
    </div>
  );
}

export default ServicesTopbar;
