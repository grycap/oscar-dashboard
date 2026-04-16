import ServiceBreadcrumb from "./components/Breadcrumbs";
import { useEffect } from "react";
import ServicesFilterBy from "./components/FilterBy";
import AddServiceButton from "./components/CreateServiceButton";
import CreateUpdateServiceTabs from "./components/CreateUpdateServiceTabs";
import useServicesContext from "../../context/ServicesContext";
import GenericTopbar from "@/components/Topbar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";

export enum ServiceViewMode {
  List = "List",
  Create = "Create",
  Update = "Update",
}

function ServicesTopbar() {
  const { formMode, refreshServices, refreshServiceLogs, eagerLoadDeployment, setEagerLoadDeployment } = useServicesContext();

  function getCurrentSubview() {
    const location = window.location.hash.split("/");
    return location[location.length - 1];
  }

  function getDefaultHeader(formMode: ServiceViewMode) {
    switch (formMode) {
      case ServiceViewMode.List:
        return { title: "Services", linkTo: "/ui/services" };
      case ServiceViewMode.Update: {
        const header = getCurrentSubview();
        const linkTo = window.location.hash.replace("#", "");

        if (header === "logs") {
          return { title: "Logs", linkTo: linkTo };
        }
        if (header === "deployment") {
          return { title: "Deployment", linkTo: linkTo };
        }
        return { title: "Services", linkTo: "/ui/services" };
      }
      default:
        return { title: "Services", linkTo: "/ui/services" };
    }
  }

  function getRefresher() {
    if (formMode === ServiceViewMode.List) {
      return refreshServices;
    }

    const header = getCurrentSubview();
    if (header === "logs") {
      return refreshServiceLogs;
    }
    if (header === "settings") {
      return refreshServices;
    }

    return undefined;
  }

  useEffect(() => {
    document.title = "OSCAR - Services";
  }, []);

  return (
    <GenericTopbar
      defaultHeader={getDefaultHeader(formMode)}
      refresher={getRefresher()}
      secondaryRow={
        formMode === ServiceViewMode.List ? 
        <div className="w-full p-2 pt-1 flex items-center gap-2">
          <ServicesFilterBy />
          {/* Options dropdown for services */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" tooltipLabel="Options">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Display options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-2 py-1.5">
                <Label htmlFor="eager-load-deployment" className="text-sm cursor-pointer">
                  Auto-load deployment status
                </Label>
                <Switch
                  id="eager-load-deployment"
                  checked={eagerLoadDeployment}
                  onCheckedChange={setEagerLoadDeployment}
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
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
