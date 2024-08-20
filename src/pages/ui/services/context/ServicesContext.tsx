import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import {
  Service,
  ServiceFilter,
  ServiceFilterBy,
  ServiceTab,
  ServiceOrderBy,
} from "../models/service";

interface ServiceContextType {
  filter: ServiceFilter;
  setFilter: Dispatch<SetStateAction<ServiceFilter>>;

  services: Service[];
  setServices: Dispatch<SetStateAction<Service[]>>;
  orderBy: ServiceOrderBy;
  setOrderBy: Dispatch<SetStateAction<ServiceOrderBy>>;

  formTab: ServiceTab;
  setFormTab: Dispatch<SetStateAction<ServiceTab>>;
}

export const ServicesContext = createContext({} as ServiceContextType);

export const ServicesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [services, setServices] = useState([] as Service[]);

  // Filter and order TABLE rows
  const [filter, setFilter] = useState({
    value: "",
    type: ServiceFilterBy.Name,
  } as ServiceFilter);
  const [orderBy, setOrderBy] = useState(ServiceOrderBy.NameDesc);

  //Active tab in create/update mode
  const [formTab, setFormTab] = useState(ServiceTab.Settings);

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
