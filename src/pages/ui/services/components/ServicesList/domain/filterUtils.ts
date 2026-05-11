import { AuthData } from "@/contexts/AuthContext";
import {
  Service,
  ServiceFilter,
  ServiceFilterByKey,
  ServiceVisibility,
} from "../../../models/service";

interface Props {
  services: Service[];
  filter: ServiceFilter;
  authData: AuthData;
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

      if (!service.owner.includes(egiUserId)) {
        return false;
      }
    }

    const key = ServiceFilterByKey[filter.type];
    const param =
      key === "visibility"
        ? service.visibility ?? ServiceVisibility.private
        : service[key] as string;

    return param.toLowerCase().includes(filter.value.toLowerCase());
  });
}

export { handleFilterServices };
