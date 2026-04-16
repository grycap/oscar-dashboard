import { useEffect, useMemo, useRef, useState } from "react";
import useServicesContext from "../../context/ServicesContext";
import getServicesApi from "@/api/services/getServicesApi";
import deleteServiceApi from "@/api/services/deleteServiceApi";
import { alert } from "@/lib/alert";
import DeleteDialog from "@/components/DeleteDialog";
import { Service } from "../../models/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoaderPinwheel, Pencil, RefreshCw, Terminal, Trash2 } from "lucide-react";
import OscarColors from "@/styles";
import { Link, useNavigate } from "react-router-dom";
import GenericTable from "@/components/Table";
import { InvokePopover } from "../InvokePopover";
import { handleFilterServices } from "./domain/filterUtils";
import { useAuth } from "@/contexts/AuthContext";
import MoreActionsPopover from "./components/MoreActionsPopover";
import ResponsiveOwnerField from "@/components/ResponsiveOwnerField";
import { errorMessage } from "@/lib/error";
import DeploymentStatusBadge from "../DeploymentStatusBadge";
import getDeploymentStatusApi from "@/api/deployment/getDeploymentStatusApi";
import { DeploymentStatus } from "../../models/deployment";
import ServiceRedirectButton from "@/components/ServiceRedirectButton";
import { shortenFullname } from "@/lib/utils";

interface DeploymentStatusCellProps {
  initialDeployment?: DeploymentStatus;
  serviceName: string;
  onNavigate: () => void;
  eagerLoad?: boolean;
}

function DeploymentStatusCell({ initialDeployment, serviceName, onNavigate, eagerLoad }: DeploymentStatusCellProps) {
  const [deployment, setDeployment] = useState<DeploymentStatus | undefined>(initialDeployment);
  const [loading, setLoading] = useState(false);

  async function fetchDeployment() {
    setLoading(true);
    try {
      const result = await getDeploymentStatusApi(serviceName);
      setDeployment(result);
    } catch {
      // leave existing state on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (eagerLoad && !initialDeployment) {
      fetchDeployment();
    }
  }, [eagerLoad]);

  return (
    <div
      className="flex items-center gap-1 cursor-pointer"
      onClick={() => {
        fetchDeployment();
      }}
    >
      {deployment && !loading ? (
        <>
        <div onClick={() => {
          onNavigate();
        }}>
          <DeploymentStatusBadge deployment={deployment} showTooltip className="cursor-pointer" />
        </div>
          <RefreshCw className="h-3 w-3 opacity-40 hover:opacity-100" />
        </>
      ) : (
        <Badge variant="default" className="cursor-pointer">
          <RefreshCw className={`${loading ? "animate-spin" : ""} h-3 w-3 mr-1`} />
          Fetch
        </Badge>
      )}
    </div>
  );
}

function ServicesList() {
  const { services, servicesAreLoading, setServices, setFormService, filter, eagerLoadDeployment } =
    useServicesContext();
  const { authData } = useAuth();
  const [servicesToDelete, setServicesToDelete] = useState<Service[]>([]);
  const navigate = useNavigate();
  const buttonRef = useRef<Map<string, HTMLButtonElement>>(new Map())

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
        .map((result) => (result as {
          status: string;
          service: Service;
          error: unknown;
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

  const filteredServices = useMemo(() => {
    const filteredServices = handleFilterServices({
      filter,
      services,
      authData,
    });
    return filteredServices;
  }, [services, filter, authData?.user]);

  useEffect(() => {
    if (services.length === 0 || services.some((service) => !service.deployment)) {
      handleGetServices();
    }
  }, []);

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
      {servicesAreLoading === true ?
        <div className="flex items-center justify-center h-screen">
            <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
        </div>
      :
        <>
          <GenericTable<Service>
            data={filteredServices}
            idKey="name"
            columns={[
              { header: "Name", accessor: (row) => (<Link to={`/ui/services/${row.name}/settings`}>{row.name}</Link>), sortBy: "name" },
              {
                header: "Deployment",
                accessor: (row) => (
                  <DeploymentStatusCell
                    initialDeployment={row.deployment as DeploymentStatus}
                    serviceName={row.name}
                    eagerLoad={eagerLoadDeployment}
                    onNavigate={() => {
                      setFormService(row);
                      navigate(`/ui/services/${row.name}/deployment`);
                    }}
                  />
                ),
                sortBy: "deployment",
              },
              { header: "Owner", accessor: (row) => (<ResponsiveOwnerField owner={row.labels["owner_name"] ? shortenFullname(row.labels["owner_name"].replace("_", " ")) : row.owner} sub={row.owner} />), sortBy: "owner" },
              { header: "Image", accessor: "image", sortBy: "image" },
              { header: "CPU", accessor: "cpu", sortBy: "cpu" },
              { header: "Memory", accessor: "memory", sortBy: "memory" },
            ]}
            actions={[
              {
                button: (item) => (
                  <MoreActionsPopover
                    service={item}
                    handleDeleteService={() => setServicesToDelete([item])}
                    handleEditService={() => {
                      setFormService(item);
                      navigate(`/ui/services/${item.name}/settings`);
                    }}
                    handleInvokeService={() => {
                      setFormService(item);
                      buttonRef.current?.get(item.name)?.click();
                    }}
                    handleLogs={() => {
                      setFormService(item);
                      navigate(`/ui/services/${item.name}/logs`);
                    }}
                  />
                ),
              },
              {
                button: (item) => (
                  <>
                  {item.expose.max_scale != "0" ?
                    <ServiceRedirectButton 
                      className="flex items-center justify-center ml-2 mr-2 "
                      service={item}
                      endpoint={authData.endpoint}
                      healthcheckPath={item.expose.health_path}
                    />
                    :
                    <InvokePopover
                      service={item}
                      triggerRenderer={
                        <Button variant={"link"} ref={(elem) => {buttonRef.current?.set(item.name, elem!)}} size="icon" tooltipLabel="Invoke">
                          <Terminal />
                        </Button>
                      }
                    />
                  }
                  </>
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
        </>
      }
    </div>
  );
}

export default ServicesList;
