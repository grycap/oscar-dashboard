import YAML from "yaml";
import { Service, ServiceVisibility, TmpService } from "../../../models/service";
import { alert } from "@/lib/alert";
import { errorMessage } from "@/lib/error";

const  getScriptIndex = (scriptname: unknown): number => {
  const normalized = typeof scriptname === "string" ? scriptname : String(scriptname ?? "");
  const trimmed = normalized.trim();

  const match = trimmed.match(/script\s*(\d+)/i);
  if (match && match[1]) {
    const index = Number.parseInt(match[1], 10);
    return Number.isNaN(index) ? 0 : Math.max(0, index - 1);
  }

  if (/^\d+$/.test(trimmed)) {
    const index = Number.parseInt(trimmed, 10);
    return Number.isNaN(index) ? 0 : Math.max(0, index - 1);
  }

  return 0;
};

class ScriptIndexError extends Error {
  constructor(scriptname: string) {
    super(`Script ${scriptname} not found or empty.`);
    this.name = "ScriptIndexError";
  }
}

export function safeScriptExtractor(scriptname: string, scripts: string[]): string {
  if (scripts.length === 1) {
    return scripts[0] ?? " ";
  }

  const index = getScriptIndex(scriptname);
  const script = scripts[index];

  if (!script) {
    throw new ScriptIndexError(scriptname);
  }

  return script;
}

export const yamlToServicesOnly = (fdlString: string, exposePortsToArray = false): Service[] => {
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
    if (obj.functions && obj.functions.oscar) {
      obj.functions.oscar.forEach((service: Record<string, TmpService>) => {
        const serviceKey = Object.keys(service)[0];
        const serviceParams = service[serviceKey];
        //serviceParams.script = safeScriptExtractor(serviceParams.script.toString(), scripts);
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
    alert.error(`Error: ${errorMessage(error)}`);
    return [];
  }

};

const yamlToServices = (fdlString: string, scriptString: string, exposePortsToArray = false, exposedDNSRoutesSupport = false) => {
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
        if (serviceParams.expose && exposedDNSRoutesSupport) {
          if (serviceParams.expose.rewrite_target) {
            serviceParams.expose.rewrite_target = false;
          }
        }
        services.push(serviceParams as Service);
      });
    }

  return services;
  } catch (error) {
    alert.error(`Error: ${errorMessage(error)}`);
    return [];
  }

};
export default yamlToServices;
