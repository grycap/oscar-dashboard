import YAML from "yaml";
import { Service } from "../../../models/service";
import { alert } from "@/lib/alert";

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
        services.push(serviceParams);
      });
    }

  return services;
  } catch (error) {
    alert.error(`Error creating service ${error}`);
    return 
  }

};
export default yamlToServices;
