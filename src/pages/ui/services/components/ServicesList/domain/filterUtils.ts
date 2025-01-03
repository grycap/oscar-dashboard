import { AuthData } from "@/contexts/AuthContext";
import {
  Service,
  ServiceFilter,
  ServiceFilterByKey,
} from "../../../models/service";

interface Props {
  services: Service[];
  filter: ServiceFilter;
  authData: AuthData;
}

function handleFilterServices({ services, filter, authData }: Props) {
  return services.filter((service) => {
    if (filter.onlyOwned) {
      const token = authData.token;

      if (!token) {
        return (
          service.allowed_users.includes(authData.user) ||
          service.owner === authData.user
        );
      }

      if (token && !service.allowed_users.includes(token)) {
        return false;
      }
    }

    const param = service[ServiceFilterByKey[filter.type]] as string;

    return param.toLowerCase().includes(filter.value.toLowerCase());
  });
}

export { handleFilterServices };
