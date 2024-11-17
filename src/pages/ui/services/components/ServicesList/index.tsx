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
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

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
                onClick={() => setServiceToDelete(item)}
                tooltipLabel="Delete"
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
