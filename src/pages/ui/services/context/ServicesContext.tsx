import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Service,
  ServiceFilter,
  ServiceFilterBy,
  ServiceTab,
  ServiceVisibility,
} from "../models/service";
import getServicesApi from "@/api/services/getServicesApi";
import getServiceApi from "@/api/services/getServiceApi";
import { useLocation } from "react-router-dom";
import { defaultService } from "../components/ServiceForm/utils/initialData";
import getSystemConfigApi from "@/api/config/getSystemConfig";
import { ServiceViewMode } from "../components/Topbar";
import { z } from "zod";
import Log from "../models/log";
import { getServiceLogsApi } from "@/api/logs/getServiceLogs";
import { delay } from "@/lib/utils";
import { alert } from "@/lib/alert";
import { errorMessage } from "@/lib/error";

interface ServiceContextType {
  filter: ServiceFilter;
  setFilter: Dispatch<SetStateAction<ServiceFilter>>;

  services: Service[];
  setServices: Dispatch<SetStateAction<Service[]>>;

  formTab: ServiceTab;
  setFormTab: Dispatch<SetStateAction<ServiceTab>>;

  formService: Service;
  setFormService: Dispatch<SetStateAction<Service>>;

  showFDLModal: boolean;
  setShowFDLModal: Dispatch<SetStateAction<boolean>>;

  refreshServices: () => void;
  formMode: ServiceViewMode;

  eagerLoadDeployment: boolean;
  setEagerLoadDeployment: Dispatch<SetStateAction<boolean>>;

  refreshServiceLogs: () => void;
  serviceLogs: {next_page: string | null, jobs: Record<string, Log>};
  formFunctions: FormFunctions;
  servicesAreLoading: boolean;
  logsAreLoading: boolean;
}

type FormFunctions = {
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    key: SchemaKeys
  ) => void;
  onBlur: (key: SchemaKeys) => void;
  errors: Partial<Record<keyof Service, string>>;
  setErrors: Dispatch<SetStateAction<Partial<Record<keyof Service, string>>>>;
};

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  image: z.string().min(1, "Docker image is required"),
  cpu: z.string().min(1, "CPU cores is required"),
  memory: z.string().min(1, "Memory is required"),
  script: z.string().min(1, "Script is required"),
  visibility: z.nativeEnum(ServiceVisibility).optional(),
});

type SchemaKeys = keyof typeof serviceSchema.shape;

export const ServicesContext = createContext({
  services: [] as Service[],
} as ServiceContextType);

export const ServicesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [services, setServices] = useState([] as Service[]);
  const [servicesAreLoading, setServicesAreLoading] = useState(false);
  const [eagerLoadDeployment, setEagerLoadDeployment] = useState(() => {
    const savedValue = localStorage.getItem("eagerLoadDeployment");
    if (savedValue === null) return true;
    return savedValue === "true";
  });
  const [serviceLogs, setServiceLogs] = useState<{next_page: string | null, jobs: Record<string, Log>}>({next_page: null, jobs: {}});
  const [logsAreLoading, setLogsAreLoading] = useState(true);
  const [showFDLModal, setShowFDLModal] = useState(false);
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x && x !== "ui");
  const [section, serviceId] = pathnames;

  // Filter and order TABLE rows
  const [filter, setFilter] = useState({
    value: "",
    type: ServiceFilterBy.Name,
    onlyOwned: false,
    onlyPrivate: false,
    onlyPublic: false,
    onlyRestricted: false,
  } as ServiceFilter);

  //Active tab in create/update mode
  const [formTab, setFormTab] = useState(ServiceTab.Settings);

  const formMode = useMemo(() => {
    if (!serviceId) {
      return ServiceViewMode.List;
    }

    if (serviceId === "create") {
      return ServiceViewMode.Create;
    }

    return ServiceViewMode.Update;
  }, [pathnames]);

  const [formService, setFormService] = useState({} as Service);

  const [errors, setErrors] = useState<Partial<Record<keyof Service, string>>>(
    {}
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>,
    key: SchemaKeys
  ) {
    setFormService((service: Service) => {
      return {
        ...service,
        [key]: e.target.value,
      };
    });

    // Validate the specific field
    try {
      serviceSchema.shape[key].parse(e.target.value);
      setErrors((prevErrors) => ({ ...prevErrors, [key]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [key]: error.errors[0].message,
        }));
      }
    }
  }

  function onBlur(key: SchemaKeys) {
    try {
      serviceSchema.shape[key].parse(formService[key]);
      setErrors((prevErrors) => ({ ...prevErrors, [key]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [key]: error.errors[0].message,
        }));
      }
    }
  }

  async function handleGetServiceLogs() {
    if (!formService.name) return;
    setLogsAreLoading(true);
    try {
      const response =  await getServiceLogsApi(formService.name)
      // Simulate loading delay for better UX
      await delay(700);
      setServiceLogs(response);
    } catch (error) {
      console.error("Failed to fetch service logs:", error);
      alert.error(`Failed to fetch service logs: ${errorMessage(error)}`);
      setServiceLogs({jobs: {}, next_page: null});
    } finally {
      setLogsAreLoading(false);
    }
  }

  async function handleGetServices(options?: { syncSelectedService?: boolean }) {
    const shouldSyncSelectedService = options?.syncSelectedService ?? true;
    setServicesAreLoading(true);
    try {
      const response = await getServicesApi();
      setServices(response);
      if (shouldSyncSelectedService && serviceId && serviceId !== "create") {
        await handleFormService();
      }
    } finally {
      setServicesAreLoading(false);
    }
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

  async function handleFormService() {
    if (section !== "services") {
      return;
    }

    setErrors({});

    if (!serviceId || serviceId === "create") {
      const defaultService = await getDefaultService();
      setFormService(defaultService);
      setErrors({});
      return;
    }

    try {
      const selectedService = await getServiceApi(serviceId);
      setFormService(selectedService);
      setErrors({});
    } catch (error) {
      alert.error(`Error getting service: ${errorMessage(error)}`);
    }
  }

  useEffect(() => {
    handleGetServices({ syncSelectedService: false });
  }, []);

  useEffect(() => {
    handleFormService();
  }, [section, serviceId]);

  useEffect(() => {
    localStorage.setItem("eagerLoadDeployment", String(eagerLoadDeployment));
  }, [eagerLoadDeployment]);

  return (
    <ServicesContext.Provider
      value={{
        formMode,
        servicesAreLoading,
        logsAreLoading,
        filter,
        setFilter,
        services,
        setServices,
        formTab,
        setFormTab,
        formService,
        setFormService,
        showFDLModal,
        setShowFDLModal,
        refreshServices: handleGetServices,
        eagerLoadDeployment,
        setEagerLoadDeployment,
        serviceLogs,
        refreshServiceLogs: handleGetServiceLogs,
        formFunctions: {
          handleChange,
          onBlur,
          errors,
          setErrors,
        },
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