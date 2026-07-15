import ResponsiveOwnerField from "@/components/ResponsiveOwnerField";
import GenericTable from "@/components/Table";
import { Service } from "@/pages/ui/services/models/service";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical, RefreshCcwIcon, Trash2 } from "lucide-react";
import OscarColors from "@/styles";
import { useAuth } from "@/contexts/AuthContext";
import SimpleServiceRedirectButton from "@/components/SimpleServiceRedirectButton";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import { useNavigate } from "react-router-dom";
import lifecycleServiceApi from "@/api/services/lifecycleServiceApi";
import { errorMessage } from "@/lib/error";
import { alert } from "@/lib/alert";
import { useState } from "react";
import deleteServiceApi from "@/api/services/deleteServiceApi";
import getServicesApi from "@/api/services/getServicesApi";
import DeleteDialog from "@/components/DeleteDialog";


interface AgentsDeployedListProps {
  services: Service[];
}

function AgentsDeployedlist({ services }: AgentsDeployedListProps) {
  const { authData } = useAuth();
  const { setFormService, setServices } = useServicesContext();
  const [servicesToDelete, setServicesToDelete] = useState<Service[]>([]);
  

  const navigate = useNavigate();

  async function handleRestartService(service: Service) {
    try {
      await lifecycleServiceApi(service.name, "restart");
      alert.success("Service restarted successfully");
    } catch (error) {
      alert.error(`Error restarting service: ${errorMessage(error)}`);
      console.error(error);
    }
  }

  async function handleGetServices() {
    try {
      const response = await getServicesApi();
      setServices(response);
    } catch (error) {
      alert.error(`Error getting services: ${errorMessage(error)}`);
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
        .map((result) => {
          const rejectedResult = result as {
          status: string;
          service: Service;
          error: unknown;
          };

          return {
            service: rejectedResult.service,
            message: errorMessage(rejectedResult.error),
          };
        });
      
      await handleGetServices();

      if (succeededServices.length > 0) {
        alert.success("Services deleted successfully");
      }

      if (failedServices.length > 0) {
        alert.error(
          failedServices.length === 1
            ? failedServices[0].message
            : failedServices
              .map(({ service, message }) => `${service.name}: ${message}`)
              .join("\n")
        );
      }

      if (succeededServices.length === 0 && failedServices.length > 1) {
        alert.error("Error deleting all services");
      }

      setServicesToDelete([]);
    }
  }

  
  return (
    <div className="mt-4">
      <GenericTable<Service>
          data={services}
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
                  {service.labels["oscar_agent_type"] === "exposed" && 
                  <DropdownMenuItem 
                    onClick={() => {
                      handleRestartService(service);
                    }}
                  >
                    <RefreshCcwIcon className="mr-2 h-4 w-4" />
                    <span>Restart</span>
                  </DropdownMenuItem>
                  }
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
            button: (service) => {
              if (service.labels["oscar_agent_type"] === "exposed") {
              return <div className="p-2">
                <SimpleServiceRedirectButton 
                  service={service}
                  endpoint={authData.endpoint}
                  additionalExposedPathArgs={"?token={{service.token}}"}
                  healthcheckPath={service.expose.health_path}
                  axios={true}
                />
              </div>
              }
            },
          },
          {
            button: (item) => (
                <Button
                  variant={"link"}
                  size="icon"
                  onClick={() => setServicesToDelete([item])}
                  tooltipLabel="Delete"
                >
                  <Trash2 color={OscarColors.Red} />
                </Button>
              ),
            },
          ]}
          bulkActions={[
           {
              button: (items) => {
                return (
                  <div>
                    <Button
                      variant={"destructive"}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 8,
                      }}
                      onClick={() => setServicesToDelete(items)}
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
    </div>
  );
}

export default AgentsDeployedlist;