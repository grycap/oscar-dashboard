import { Service } from "@/pages/ui/services/models/service";
import GenericTable from "../Table";
import { Link, useNavigate } from "react-router-dom";
import { Edit, ExternalLink, MoreVertical, RefreshCcwIcon, Trash2 } from "lucide-react";
import OscarColors from "@/styles";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { useState } from "react";
import getServicesApi from "@/api/services/getServicesApi";
import deleteServiceApi from "@/api/services/deleteServiceApi";
import { alert } from "@/lib/alert";
import DeleteDialog from "../DeleteDialog";
import updateServiceApi from "@/api/services/updateServiceApi";

interface IntegratedAppProps {
    appName: string;
    endpoint: string;
    filteredServices: Service[];
    DeployInstancePopover: React.ComponentType;
    additionalExposedPathArgs?: string;
}


function IntegratedApp({ appName, endpoint, filteredServices, additionalExposedPathArgs, DeployInstancePopover}: IntegratedAppProps) {
  const { setFormService } = useServicesContext();
  const [servicesToDelete, setServicesToDelete] = useState<Service[]>([]);
  const { setServices } = useServicesContext();

  
  const navigate = useNavigate();
   
  /**
   * Interpolate variables in the additionalExposedPathArgs string.
   * This function replaces variables in the format {{ variableName }} with their corresponding values from the
   * service's environment variables.
   */
  function interpolateVariables(service: Service, additionalExposedPathArgs?: string) {
    if (!additionalExposedPathArgs) return "";

    return additionalExposedPathArgs.replace(/{{\s*([^}]+)\s*}}/g, (_, variableName) => {
      return service.environment.variables[variableName] ?? "";
    });
    
  }

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
      const response = await getServicesApi();
      setServices(response);
    } catch (error) {
      alert.error("Error getting services");
      console.error(error);
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
    <div className="grid grid-cols-1 gap-6 w-[95%] sm:w-[90%] lg:w-[80%] mx-auto mt-[40px] min-w-[300px] max-w-[700px] content-start">
    <h1 className="text-center sm:text-left" style={{ fontSize: "24px", fontWeight: "500" }}>
      {appName}
    </h1>
    <Card>
      <CardHeader>
      <CardTitle className="flex flex-row items-center justify-between gap-2">
          <div>Deployed {appName} Instances</div>
          <DeployInstancePopover />
      </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col max-h-[65vh]">
        <GenericTable<Service>
          data={filteredServices}
          idKey="name"
          columns={[
          { header: "Name", accessor: "name", sortBy: "name" },
          { header: "CPU", accessor: "cpu", sortBy: "cpu" },
          { header: "Memory", accessor: "memory", sortBy: "memory" },
          ]}
          actions={[
          {
            button: (service) => (
              <DropdownMenu>
                <DropdownMenuTrigger asChild title="More actions">
                  <Button variant={"link"} size="icon" tooltipLabel="More Actions">
                    <MoreVertical size={20}/>
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
              <Link
                to={`${
                  endpoint
                }/system/services/${service.name}/exposed/${
                  interpolateVariables(service, additionalExposedPathArgs)
                }`}
                target="_blank"
              >
                <ExternalLink size={20} />
              </Link>
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
                <Trash2 color={OscarColors.Red} size={20} />
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
      </CardContent>
      <CardFooter className="grid grid-cols-1 hidden">
      
      </CardFooter>
    </Card>
    <DeleteDialog
      isOpen={servicesToDelete.length > 0}
      onClose={() => setServicesToDelete([])}
      onDelete={handleDeleteService}
      itemNames={servicesToDelete.map((service) => service.name)}
    />
    </div>
  );
}

export default IntegratedApp;