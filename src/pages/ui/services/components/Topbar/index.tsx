import { OscarStyles } from "@/styles";
import UserInfo from "./components/UserInfo";
import ServiceBreadcrumb from "./components/Breadcrumbs";
import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import ServicesFilterBy from "./components/FilterBy";
import ServicesOrderBy from "./components/OrderBy";
import CreateServiceButton from "./components/CreateServiceButton";
import CreateUpdateServiceTabs from "./components/CreateUpdateServiceTabs";

export enum ServiceTopbarMode {
  List = "List",
  Create = "Create",
  Update = "Update",
}

function ServicesTopbar() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x && x !== "ui");
  const [_, serviceId] = pathnames;

  const mode = useMemo(() => {
    if (!serviceId) {
      return ServiceTopbarMode.List;
    }

    console.log(serviceId);
    if (serviceId === "create") {
      return ServiceTopbarMode.Create;
    }

    return ServiceTopbarMode.Update;
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
        }}
      >
        <ServiceBreadcrumb />
        {mode === ServiceTopbarMode.List ? (
          <>
            <ServicesFilterBy />
            <ServicesOrderBy />
            <CreateServiceButton />
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
