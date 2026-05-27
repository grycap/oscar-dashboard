import YAML from "yaml";
import { Service, ServiceVisibility } from "../../../models/service";
import { alert } from "@/lib/alert";
import { errorMessage } from "@/lib/error";

const yamlToServices = (fdlString: string, scriptString: string) => {
  try {
    const obj = YAML.parse(fdlString);
    const services: Service[] = [];
    const scriptContent = scriptString;
    if (obj.functions && obj.functions.oscar) {
      obj.functions.oscar.forEach((service: Record<string, Service>) => {
        const serviceKey = Object.keys(service)[0];
        const serviceParams = service[serviceKey];
        serviceParams.script = scriptContent;
        serviceParams.storage_providers = obj.storage_providers || {};
        serviceParams.clusters = obj.clusters || {};
        serviceParams.visibility = serviceParams.visibility ?? ServiceVisibility.private;
        serviceParams.allowed_users =
          serviceParams.visibility === ServiceVisibility.restricted
            ? serviceParams.allowed_users ?? []
            : [];
        services.push(serviceParams);
      });
    }

  return services;
  } catch (error) {
    alert.error(`Error creating service: ${errorMessage(error)}`);
    return [];
  }

};
export default yamlToServices;
