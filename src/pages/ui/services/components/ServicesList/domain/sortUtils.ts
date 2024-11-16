import { Service, ServiceOrderBy } from "../../../models/service";

function handleOrderBy(services: Service[], orderBy: ServiceOrderBy) {
  switch (orderBy) {
    case ServiceOrderBy.NameAsc:
      return services.sort((a, b) => a.name.localeCompare(b.name));
    case ServiceOrderBy.NameDesc:
      return services.sort((a, b) => b.name.localeCompare(a.name));
    case ServiceOrderBy.CPUAsc:
      return services.sort((a, b) => Number(b.cpu) - Number(a.cpu));
    case ServiceOrderBy.CPUDesc:
      return services.sort((a, b) => Number(a.cpu) - Number(b.cpu));
    case ServiceOrderBy.MemoryAsc:
      return services.sort((a, b) => Number(b.memory) - Number(a.memory));
    case ServiceOrderBy.MemoryDesc:
      return services.sort((a, b) => Number(a.memory) - Number(b.memory));
    case ServiceOrderBy.ImageAsc:
      return services.sort((a, b) => a.image.localeCompare(b.image));
    case ServiceOrderBy.ImageDesc:
      return services.sort((a, b) => b.image.localeCompare(a.image));
    default:
      return services;
  }
}

export { handleOrderBy };
