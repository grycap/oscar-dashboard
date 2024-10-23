import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Service,
  ServiceFilter,
  ServiceFilterBy,
  ServiceTab,
  ServiceOrderBy,
} from "../models/service";
import getServicesApi from "@/api/services/getServicesApi";
import { useParams } from "react-router-dom";
import { defaultService } from "../components/ServiceForm/utils/initialData";
import useUpdate from "@/hooks/useUpdate";
import getSystemConfigApi from "@/api/config/getSystemConfig";

interface ServiceContextType {
  filter: ServiceFilter;
  setFilter: Dispatch<SetStateAction<ServiceFilter>>;

  services: Service[];
  setServices: Dispatch<SetStateAction<Service[]>>;
  orderBy: ServiceOrderBy;
  setOrderBy: Dispatch<SetStateAction<ServiceOrderBy>>;

  formTab: ServiceTab;
  setFormTab: Dispatch<SetStateAction<ServiceTab>>;

  formService: Service;
  setFormService: Dispatch<SetStateAction<Service>>;

  showFDLModal: boolean;
  setShowFDLModal: Dispatch<SetStateAction<boolean>>;

  refreshServices: () => void;
}

export const ServicesContext = createContext({
  services: [] as Service[],
} as ServiceContextType);

export const ServicesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [services, setServices] = useState([] as Service[]);
  const [showFDLModal, setShowFDLModal] = useState(false);
  const { serviceId } = useParams();

  // Filter and order TABLE rows
  const [filter, setFilter] = useState({
    value: "",
    type: ServiceFilterBy.Name,
  } as ServiceFilter);
  const [orderBy, setOrderBy] = useState(ServiceOrderBy.NameDesc);

  //Active tab in create/update mode
  const [formTab, setFormTab] = useState(ServiceTab.Settings);

  const [formService, setFormService] = useState({} as Service);

  async function handleGetServices() {
    const response = await getServicesApi();
    setServices(response);

    handleFormService(response);
  }

  async function getDefaultService() {
    const config = await getSystemConfigApi();
    if (!config) return defaultService;

    return {
      ...defaultService,
      storage_providers: {
        minio: {
          default: config.minio_provider,
        },
      },
    } as Service;
  }

  async function handleFormService(services: Service[]) {
    if (!serviceId || serviceId === "create") {
      const defaultService = await getDefaultService();
      setFormService(defaultService);
      return;
    }

    if (!services) return;
    const selectedService = services.find((s) => s.name === serviceId);
    if (!selectedService) return;
    setFormService(selectedService);
  }

  useEffect(() => {
    handleGetServices();
  }, []);

  useUpdate(() => {
    handleFormService(services);
  }, [serviceId]);

  return (
    <ServicesContext.Provider
      value={{
        filter,
        setFilter,
        services,
        setServices,
        orderBy,
        setOrderBy,
        formTab,
        setFormTab,
        formService,
        setFormService,
        showFDLModal,
        setShowFDLModal,
        refreshServices: handleGetServices,
      }}
    >
      {children}
    </ServicesContext.Provider>
  );
};

function useServicesContext() {
  return useContext(ServicesContext);
}

export default useServicesContext;
