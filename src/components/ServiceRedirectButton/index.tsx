import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { exposedServiceIsAlive, isVersionLower } from "@/lib/utils";
import { Service } from "@/pages/ui/services/models/service";
import { Link } from "react-router-dom";
import OscarColors from "@/styles";
import { useAuth } from "@/contexts/AuthContext";


function ServiceRedirectButton({
  service,
  endpoint,
  additionalExposedPathArgs,
  healthcheckPath = "",
}: {
  service: Service;
  endpoint: string;
  additionalExposedPathArgs?: string;
  healthcheckPath?: string;
}) {
  const [isAlive, setIsAlive] = useState<boolean | null>(null);
  const { clusterInfo } = useAuth();
  const redirectLink = `${endpoint}/system/services/${service.name}/exposed/${interpolateVariables(service, additionalExposedPathArgs)}`

  const safeHealthcheckPath = healthcheckPath.startsWith("/") ? healthcheckPath.slice(1).trim() : healthcheckPath
  const healthcheckLink = `${endpoint}/system/services/${service.name}/exposed/${safeHealthcheckPath}`;
      
  /**
   * Interpolate variables in the additionalExposedPathArgs string.
   * This function replaces variables in the format {{ variableName }} with their corresponding values from the
   * service's environment variables or service properties. It supports variables prefixed with "env." for environment variables and "service."
   * example: evn.MY_VAR or service.token
   */
  function interpolateVariables(service: Service, additionalExposedPathArgs?: string) {
    if (!additionalExposedPathArgs) return "";

    return additionalExposedPathArgs.replace(/{{\s*([^}]+)\s*}}/g, (_, variableName) => {
      const splitVariable = variableName.split(".");
      const prefix = splitVariable[0];
      const variableKey = splitVariable[1];
      switch (prefix) {
        case "env":
          return service.environment.variables[variableKey] ?? "";
        case "service":
          const serviceValue = (service[variableKey as keyof Service]);
          return typeof serviceValue === "string" ? serviceValue : "";
        default:
          return "";
      }
    });
  }

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      if (clusterInfo && isVersionLower(clusterInfo.version, "3.6.4")) {
        if (isMounted) setIsAlive(true);
        return;
      }
      try {
        const status = await exposedServiceIsAlive(healthcheckLink, 10000, 20);
        if (isMounted) { 
          setIsAlive(status);
        }
      } catch (error) {
        if (isMounted) {
          setIsAlive(false);
        }
      }
    };
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [clusterInfo, endpoint, healthcheckPath, service]);

  return isAlive ? (
    <Link
      to={redirectLink}
      target="_blank"
    >
      <ExternalLink />
    </Link>
  ) : (
    <Loader2 className="animate-spin" color={OscarColors.DarkGrayText} />
  );
}

export default ServiceRedirectButton;
