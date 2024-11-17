import { useMemo, useState } from "react";
import useServicesContext from "../../context/ServicesContext";
import getServicesApi from "@/api/services/getServicesApi";
import deleteServiceApi from "@/api/services/deleteServiceApi";
import { alert } from "@/lib/alert";
import DeleteDialog from "@/components/DeleteDialog";
import { Service } from "../../models/service";
import { Button } from "@/components/ui/button";
import { Ellipsis, Pencil, Terminal, Trash2 } from "lucide-react";
import OscarColors from "@/styles";
import { Link } from "react-router-dom";
import GenericTable from "@/components/Table";
import { InvokePopover } from "../InvokePopover";
import { handleFilterServices } from "./domain/filterUtils";
import { useAuth } from "@/contexts/AuthContext";

function ServicesList() {
  const { services, setServices, setFormService, filter } =
    useServicesContext();
  const { authData } = useAuth();
  const [servicesToDelete, setServicesToDelete] = useState<Service[]>([]);

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

      const results = await Promise.allSettled(deletePromises);

      const succeededServices = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value.service);

      const failedServices = results
        .filter((result) => result.status === "rejected")
        .map((result) => (result as PromiseRejectedResult).reason.service);

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

      if (succeededServices.length === 0) {
        alert.error("Error deleting all services");
      }

      setServicesToDelete([]);
    }
  }

  const filteredServices = useMemo(() => {
    const filteredServices = handleFilterServices({
      filter,
      services,
      user: authData.user,
    });
    return filteredServices;
  }, [services, filter, authData?.user]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexBasis: 0,
        overflow: "hidden",
      }}
    >
      <GenericTable<Service>
        data={filteredServices}
        idKey="name"
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Image", accessor: "image" },
          { header: "CPU", accessor: "cpu" },
          { header: "Memory", accessor: "memory" },
        ]}
        actions={[
          {
            button: () => (
              <Button variant={"link"} size="icon" tooltipLabel="More actions">
                <Ellipsis />
              </Button>
            ),
          },
          {
            button: (item) => (
              <InvokePopover
                service={item}
                triggerRenderer={
                  <Button variant={"link"} size="icon" tooltipLabel="Invoke">
                    <Terminal />
                  </Button>
                }
              />
            ),
          },
          {
            button: (item) => (
              <Link
                to={`/ui/services/${item.name}/settings`}
                replace
                onClick={() => {
                  setFormService(item);
                }}
              >
                <Button variant={"link"} size="icon" tooltipLabel="Edit">
                  <Pencil />
                </Button>
              </Link>
            ),
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

export default ServicesList;
