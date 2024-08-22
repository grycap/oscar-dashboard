import { useEffect } from "react";
import useServicesContext from "../../context/ServicesContext";
import getServicesApi from "@/api/services/getServicesApi";
import { alert } from "@/lib/alert";

import Table from "@/components/Table";
import { Service, ServiceOrderBy } from "../../models/service";
import { Button } from "@/components/ui/button";
import { Code, Ellipsis, Pencil, Terminal, Trash2 } from "lucide-react";
import OscarColors from "@/styles";
import useUpdate from "@/hooks/useUpdate";
import { Link } from "react-router-dom";

function ServicesList() {
  const { services, setServices, orderBy, filter } = useServicesContext();

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

  useEffect(() => {
    handleGetServices();
  }, []);

  useUpdate(() => {
    const orderedServices = handleOrderBy(services);
    setServices(orderedServices);
  }, [orderBy]);

  return (
    <Table<Service>
      data={services}
      columns={[
        { title: "Name", key: "name" },
        { title: "Image", key: "image" },
        { title: "CPU", key: "cpu" },
        { title: "Memory", key: "memory" },
        {
          title: "Actions",
          renderCell: (value, row, index) => {
            return (
              <>
                <Button variant={"link"} size="icon">
                  <Ellipsis />
                </Button>
                <Button variant={"link"} size="icon">
                  <Terminal />
                </Button>
                <Link to={`/ui/services/${row.name}/settings`}>
                  <Button variant={"link"} size="icon">
                    <Pencil />
                  </Button>
                </Link>
                <Button variant={"link"} size="icon">
                  <Trash2 color={OscarColors.Red} />
                </Button>
              </>
            );
          },
        },
      ]}
      checkbox
    />
  );
}

export default ServicesList;
