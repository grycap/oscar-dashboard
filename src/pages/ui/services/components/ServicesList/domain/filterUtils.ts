import {
  Service,
  ServiceFilter,
  ServiceFilterByKey,
} from "../../../models/service";

interface Props {
  services: Service[];
  filter: ServiceFilter;
  user: string;
}

function handleFilterServices({ services, filter, user }: Props) {
  return services.filter((service) => {
    if (filter.onlyOwned && service.owner !== user) return false;

    const param = service[ServiceFilterByKey[filter.type]] as string;

    return param.toLowerCase().includes(filter.value.toLowerCase());
  });
}

export { handleFilterServices };
