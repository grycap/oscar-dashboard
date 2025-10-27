import ServiceBreadcrumb from "./components/Breadcrumbs";
import { useEffect } from "react";
import ServicesFilterBy from "./components/FilterBy";
import AddServiceButton from "./components/CreateServiceButton";
import CreateUpdateServiceTabs from "./components/CreateUpdateServiceTabs";
import useServicesContext from "../../context/ServicesContext";
import GenericTopbar from "@/components/Topbar";

export enum ServiceViewMode {
  List = "List",
  Create = "Create",
  Update = "Update",
}

function ServicesTopbar() {
  const { formMode, refreshServices } = useServicesContext();

  useEffect(() => {
    document.title = "OSCAR - Services";
  }, []);

  return (
    <GenericTopbar defaultHeader={{title: "Services", linkTo: "/ui/services"}} refresher={refreshServices}
      secondaryRow={
        formMode === ServiceViewMode.List ? 
        <div className="w-full p-2 pt-1">
          <ServicesFilterBy />
        </div>
        : null
      }
    >
      <div
        className={"grid items-center justify-between " + (formMode === ServiceViewMode.List ? "grid-cols-[auto_1fr_auto]" : "grid-cols-[auto_1fr]")}
      >
        <ServiceBreadcrumb />

        {formMode === ServiceViewMode.List ? (
          <div className="justify-self-end">
            <AddServiceButton />
          </div>
        ) : (
          <CreateUpdateServiceTabs mode={formMode} />
        )}
      </div>
    </GenericTopbar>
  );
}

export default ServicesTopbar;
