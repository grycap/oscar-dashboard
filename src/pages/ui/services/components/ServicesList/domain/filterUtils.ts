import {
  Service,
  ServiceFilter,
  ServiceFilterByKey,
} from "../../../models/service";

function handleFilterServices(services: Service[], filter: ServiceFilter) {
  return services.filter((service) => {
    const param = service[ServiceFilterByKey[filter.type]] as string;

    return param.toLowerCase().includes(filter.value.toLowerCase());
  });
}

export { handleFilterServices };
