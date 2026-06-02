import YAML from "yaml";
import { Service, ServiceVisibility, TmpService } from "../../../models/service";
import { alert } from "@/lib/alert";
import { errorMessage } from "@/lib/error";

const yamlToServices = (fdlString: string, scriptString: string, exposePortsToArray = false) => {
  try {
    const normalizePortList = (value: unknown): number[] | undefined => {
      if (typeof value === "string" || typeof value === "number") {
        return [Number(value)];
      }

      if (Array.isArray(value)) {
        return value
          .filter((port) => typeof port === "string" || typeof port === "number")
          .map((port) => Number(port));
      }

      return undefined;
    };

    const obj = YAML.parse(fdlString);
    const services: Service[] = [];
    const scriptContent = scriptString;
    if (obj.functions && obj.functions.oscar) {
      obj.functions.oscar.forEach((service: Record<string, TmpService>) => {
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
        if (serviceParams.expose && exposePortsToArray) {
          if (serviceParams.expose.nodePort != null) {
            const normalizedNodePort = normalizePortList(serviceParams.expose.nodePort);
            if (normalizedNodePort) {
              serviceParams.expose.nodePort = normalizedNodePort;
            }
          }
          if (serviceParams.expose.api_port != null) {
            const normalizedApiPort = normalizePortList(serviceParams.expose.api_port);
            if (normalizedApiPort) {
              serviceParams.expose.api_port = normalizedApiPort;
            }
          }
        }
        services.push(serviceParams as Service);
      });
    }

  return services;
  } catch (error) {
    alert.error(`Error creating service: ${errorMessage(error)}`);
    return [];
  }

};
export default yamlToServices;
