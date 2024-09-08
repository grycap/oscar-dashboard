import { useState } from "react";
import useServicesContext from "../../context/ServicesContext";
import getServicesApi from "@/api/services/getServicesApi";
import deleteServiceApi from "@/api/services/deleteServiceApi";
import { alert } from "@/lib/alert";
import DeleteDialog from "@/components/DeleteDialog";

import { Service, ServiceOrderBy } from "../../models/service";
import { Button } from "@/components/ui/button";
import { Ellipsis, Pencil, Terminal, Trash2 } from "lucide-react";
import OscarColors from "@/styles";
import useUpdate from "@/hooks/useUpdate";
import { Link } from "react-router-dom";
import GenericTable from "@/components/Table";

function ServicesList() {
  const { services, setServices, orderBy, setFormService } =
    useServicesContext();
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  async function handleGetServices() {
    try {
      const response = await getServicesApi();
      const orderedResponse = handleOrderBy(response);
      setServices(orderedResponse);
    } catch (error) {
      alert.error("Error getting services");
      console.error(error);
    }
  }

  async function handleDeleteService() {
    if (serviceToDelete) {
      try {
        await deleteServiceApi(serviceToDelete);
        await handleGetServices();
        alert.success(`Service ${serviceToDelete.name} deleted successfully`);
      } catch (error) {
        alert.error("Error deleting service");
        console.error(error);
      } finally {
        setServiceToDelete(null);
      }
    }
  }

  function handleOrderBy(services: Service[]) {
    switch (orderBy) {
      case ServiceOrderBy.NameAsc:
        return services.sort((a, b) => a.name.localeCompare(b.name));
      case ServiceOrderBy.NameDesc:
        return services.sort((a, b) => b.name.localeCompare(a.name));
      case ServiceOrderBy.CPUAsc:
        return services.sort((a, b) => Number(b.cpu) - Number(a.cpu));
      case ServiceOrderBy.CPUDesc:
        return services.sort((a, b) => Number(a.cpu) - Number(b.cpu));
      case ServiceOrderBy.MemoryAsc:
        return services.sort((a, b) => Number(b.memory) - Number(a.memory));
      case ServiceOrderBy.MemoryDesc:
        return services.sort((a, b) => Number(a.memory) - Number(b.memory));
    }

    return services;
  }

  useUpdate(() => {
    const orderedServices = handleOrderBy(services);
    setServices(orderedServices);
  }, [orderBy, services]);

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
        data={services}
        idKey="name"
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Image", accessor: "image" },
          { header: "CPU", accessor: "cpu" },
          { header: "Memory", accessor: "memory" },
        ]}
        actions={[
          {
            button: (_) => (
              <Button variant={"link"} size="icon">
                <Ellipsis />
              </Button>
            ),
          },
          {
            button: (_) => (
              <Button variant={"link"} size="icon">
                <Terminal />
              </Button>
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
                <Button variant={"link"} size="icon">
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
                onClick={() => setServiceToDelete(item)}
              >
                <Trash2 color={OscarColors.Red} />
              </Button>
            ),
          },
        ]}
      />
      <DeleteDialog
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onDelete={handleDeleteService}
        itemNames={serviceToDelete?.name || ""}
      />
    </div>
  );
}

export default ServicesList;
