import { Service } from "@/pages/ui/services/models/service";
import GenericTable from "../Table";
import { useLocation, useNavigate } from "react-router-dom";
import { Edit, LoaderPinwheel, MoreVertical, RefreshCcwIcon, Trash2 } from "lucide-react";
import OscarColors from "@/styles";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useState } from "react";
import getServicesApi from "@/api/services/getServicesApi";
import deleteServiceApi from "@/api/services/deleteServiceApi";
import { alert } from "@/lib/alert";
import updateServiceApi from "@/api/services/updateServiceApi";
import ServiceRedirectButton from "../ServiceRedirectButton";
import DeleteDialog from "../DeleteDialog";
import GenericTopbar from "../Topbar";
import ResponsiveOwnerField from "../ResponsiveOwnerField";

interface IntegratedAppProps {
    appName: string;
    deployedServiceEndpoint: string;
    filteredServices: Service[];
    DeployInstancePopover: React.ComponentType;
    additionalExposedPathArgs?: string;
}

function IntegratedApp({ appName, deployedServiceEndpoint, filteredServices, additionalExposedPathArgs, DeployInstancePopover}: IntegratedAppProps) {
  const { setFormService } = useServicesContext();
  const [servicesToDelete, setServicesToDelete] = useState<Service[]>([]);
  const { setServices } = useServicesContext();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  
  async function handleRestartService(service: Service) {
    try {
      await updateServiceApi(service);
      alert.success("Service restarted successfully");
    } catch (error) {
      alert.error("Error restarting service");
      console.error(error);
    }
  }

  async function handleGetServices() {
    try {
      setIsLoading(true);
      const response = await getServicesApi();
      setServices(response);
    } catch (error) {
      alert.error("Error getting services");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteService() {
    if (servicesToDelete.length > 0) {
      const deletePromises = servicesToDelete.map((service) =>
        deleteServiceApi(service).then(
          () => ({ status: "fulfilled", service }),
          (error) => ({ status: "rejected", service, error })
        )
      );
      
      const results = await Promise.all(deletePromises);

      const succeededServices = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.service);

      const failedServices = results
        .filter((result) => result.status === "rejected")
        .map((result) => (result as {
          status: string;
          service: Service;
          error: any;
        }).service);
      
      await handleGetServices();

      if (succeededServices.length > 0) {
        alert.success("Services deleted successfully");
      }

      if (failedServices.length > 0) {
        alert.error(
          `Error deleting the following services: ${failedServices
            .map((service) => service.name)
            .join(", ")}`
        );
      }

      if (succeededServices.length === 0 && failedServices.length > 1) {
        alert.error("Error deleting all services");
      }

      setServicesToDelete([]);
    }
  }

  return (
    <div style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexBasis: 0,
        overflow: "hidden",
      }}>
      <GenericTopbar defaultHeader={{title: appName, linkTo: location.pathname}} refresher={handleGetServices}>
        <div className="flex w-full justify-end">
          <DeployInstancePopover />
        </div>
      </GenericTopbar>
      {isLoading === true ?
      <div className="flex items-center justify-center h-screen">
        <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
      </div>
      :
      <>
        <GenericTable<Service>
          data={filteredServices}
          idKey="name"
          columns={[
          { header: "Name", accessor: "name", sortBy: "name" },
          { header: "Owner", accessor: (row) => (<ResponsiveOwnerField owner={row.owner} />), sortBy: "owner" },
          { header: "Image", accessor: "image", sortBy: "image" },
          { header: "CPU", accessor: "cpu", sortBy: "cpu" },
          { header: "Memory", accessor: "memory", sortBy: "memory" },
          ]}
          actions={[
          {
            button: (service) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild title="More actions">
                  <Button variant={"link"} size="icon" tooltipLabel="More Actions">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[220px]">
                  <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">Service options</span>
                  </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      handleRestartService(service);
                    }}
                  >
                    <RefreshCcwIcon className="mr-2 h-4 w-4" />
                    <span>Restart</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                        setFormService(service);
                        navigate(`/ui/services/${service.name}/settings`);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ),
          },
          {
            button: (service) => (
              <div className="p-2">
                <ServiceRedirectButton 
                  service={service}
                  endpoint={deployedServiceEndpoint}
                  additionalExposedPathArgs={additionalExposedPathArgs}
                />
              </div>
            ),
          },
          {
            button: (service) => (
              <Button
                variant={"link"}
                size="icon"
                onClick={() => setServicesToDelete([service])}
                tooltipLabel="Delete"
              >
                <Trash2 color={OscarColors.Red} />
              </Button>
            ),
          },
          ]}
          bulkActions={[
            {
              button: (service) => {
                return (
                  <div>
                    <Button
                      variant={"destructive"}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 8,
                      }}
                      onClick={() => setServicesToDelete(service)}
                    >
                      <Trash2 className="h-5 w-5" />
                      Delete services
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
        <DeleteDialog
          isOpen={servicesToDelete.length > 0}
          onClose={() => setServicesToDelete([])}
          onDelete={handleDeleteService}
          itemNames={servicesToDelete.map((service) => service.name)}
        />
      </>
      }
    </div>
  );
}

export default IntegratedApp;