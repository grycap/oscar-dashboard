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

function handleServiceVisibilityFilter(services: Service, filter: ServiceFilter) {
  if (filter.onlyPrivate && services.visibility !== "private") {
    return false;
  }
  if (filter.onlyPublic && services.visibility !== "public") {
    return false;
  }
  if (filter.onlyRestricted && services.visibility !== "restricted") {
    return false;
  }
  return true;
}

function handleFilterServices({ services, filter, authData }: Props) {
  return services.filter((service) => {
    if (filter.onlyOwned) {
      const egiUserId = authData.egiSession?.sub;

      if (!egiUserId) {
        return (
          service.allowed_users.includes(authData.user) ||
          service.owner === authData.user
        );
      }

      if (!service.owner.includes(egiUserId) && handleServiceVisibilityFilter(service, filter)) {
        return false;
      }
    }
    if (!handleServiceVisibilityFilter(service, filter)) {
      return false;
    }

    const param = service[ServiceFilterByKey[filter.type]] as string;

    return param.toLowerCase().includes(filter.value.toLowerCase());
  });
}

export { handleFilterServices };
