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
  healthcheckPath,
}: {
  service: Service;
  endpoint: string;
  additionalExposedPathArgs?: string;
  healthcheckPath?: string;
}) {
  const [isAlive, setIsAlive] = useState<boolean | null>(null);
  const { clusterInfo } = useAuth();

  /**
   * Interpolate variables in the additionalExposedPathArgs string.
   * This function replaces variables in the format {{ variableName }} with their corresponding values from the
   * service's environment variables.
   */
  function interpolateVariables(service: Service, additionalExposedPathArgs?: string) {
    if (!additionalExposedPathArgs) return "";

    return additionalExposedPathArgs.replace(/{{\s*([^}]+)\s*}}/g, (_, variableName) => {
      const envValue = service.environment.variables[variableName];
      if (envValue !== undefined) return envValue;

      const serviceValue = service[variableName as keyof Service];
      return typeof serviceValue === "string" ? serviceValue : "";
    });
    
  }

  function buildExposedServiceUrl(service: Service, suffix?: string) {
    const baseUrl = `${endpoint}/system/services/${service.name}/exposed/`;

    if (!suffix) return baseUrl;
    if (suffix.startsWith("?")) return `${baseUrl}${suffix}`;

    return `${baseUrl}${suffix.replace(/^\/+/, "")}`;
  }

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      if (clusterInfo && isVersionLower(clusterInfo.version, "3.6.4")) {
        if (isMounted) setIsAlive(true);
        return;
      }
      try {
        const healthUrl = buildExposedServiceUrl(
          service,
          interpolateVariables(service, healthcheckPath)
        );
        const status = await exposedServiceIsAlive(healthUrl, 10000, 20);
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
      to={buildExposedServiceUrl(
        service,
        interpolateVariables(service, additionalExposedPathArgs)
      )}
      target="_blank"
    >
      <ExternalLink />
    </Link>
  ) : (
    <Loader2 className="animate-spin" color={OscarColors.DarkGrayText} />
  );
}

export default ServiceRedirectButton;
