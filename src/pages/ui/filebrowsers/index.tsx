import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import useServicesContext from "../services/context/ServicesContext";
import IntegratedApp from "@/components/IntegratedApp";
import FileBrowserFormPopover from "./components/FileBrowserFormPopover";

function FileBrowsersView() {
  const { authData } = useAuth();
  const { services } = useServicesContext();

  const ownerName =
    authData?.egiSession?.sub ??
    authData?.token ??
    (authData?.user === "oscar" ? "cluster_admin" : authData?.user);
  const fileBrowserServices = services.filter(
    (service) =>
      (service.owner === ownerName || ownerName === "cluster_admin") &&
      service.labels["filebrowser"] === "true"
  );

  useEffect(() => {
    document.title = "OSCAR - File Browsers";
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <IntegratedApp
        appName="File Browsers"
        deployedServiceEndpoint={authData.endpoint}
        filteredServices={fileBrowserServices}
        DeployInstancePopover={FileBrowserFormPopover}
        authActionPathArgs="api/auth/renew?jwt={{jwt.service.token}}"
        targetExposedPath="files/"
      />
    </div>
  );
}

export default FileBrowsersView;
