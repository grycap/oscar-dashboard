import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import useServicesContext from "../services/context/ServicesContext";
import IntegratedApp from "@/components/IntegratedApp";
import TerminalFormPopover from "./components/TerminalFormPopover";

function TerminalView() {
  const { authData } = useAuth();
  const { services } = useServicesContext();

  const ownerName =
    authData?.egiSession?.sub ??
    authData?.token ??
    (authData?.user === "oscar" ? "cluster_admin" : authData?.user);
  const terminalServices = services.filter(
    (service) =>
      (service.owner === ownerName || ownerName === "cluster_admin") &&
      service.labels["terminal"] === "true"
  );

  useEffect(() => {
    document.title = "OSCAR - Terminals";
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <IntegratedApp
        appName="Terminals"
        deployedServiceEndpoint={authData.endpoint}
        filteredServices={terminalServices}
        DeployInstancePopover={TerminalFormPopover}
        additionalExposedPathArgs="?token={{token}}"
        healthcheckPath="/healthz"
      />
    </div>
  );
}

export default TerminalView;
