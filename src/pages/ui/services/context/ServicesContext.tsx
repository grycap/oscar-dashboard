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
  ServiceOrderBy,
} from "../models/service";

interface ServiceContextType {
  filter: ServiceFilter;
  setFilter: Dispatch<SetStateAction<ServiceFilter>>;

  services: Service[];
  setServices: Dispatch<SetStateAction<Service[]>>;

  orderBy: ServiceOrderBy;
  setOrderBy: Dispatch<SetStateAction<ServiceOrderBy>>;
}

export const ServicesContext = createContext({} as ServiceContextType);

export const ServicesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [services, setServices] = useState([] as Service[]);
  const [filter, setFilter] = useState({
    value: "",
    type: ServiceFilterBy.Name,
  } as ServiceFilter);

  const [orderBy, setOrderBy] = useState(ServiceOrderBy.NameDesc);

  return (
    <ServicesContext.Provider
      value={{ filter, setFilter, services, setServices, orderBy, setOrderBy }}
    >
      {children}
    </ServicesContext.Provider>
  );
};

function useServicesContext() {
  return useContext(ServicesContext);
}

export default useServicesContext;
