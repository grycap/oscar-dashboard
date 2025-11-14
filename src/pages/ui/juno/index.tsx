import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import useServicesContext from "../services/context/ServicesContext";
import IntegratedApp from "@/components/IntegratedApp";
import JunoFormPopover from "./components/JunoFormPopover";

function JunoView() {
  
  const { authData } = useAuth();
  const { services } = useServicesContext();

  const ownerName = authData?.egiSession?.sub ?? authData?.token ?? (authData?.user === "oscar" ? "cluster_admin" : authData?.user);
  const junoService = services.filter((service) => (service.owner === ownerName ||  ownerName === "cluster_admin") && service.labels["jupyter_notebook"] === "true");

  useEffect(() => {
    document.title ="OSCAR - Notebooks"
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <IntegratedApp 
        appName="Notebooks" 
        deployedServiceEndpoint={authData.endpoint} 
        filteredServices={junoService} 
        DeployInstancePopover={JunoFormPopover}
        additionalExposedPathArgs="?token={{JUPYTER_TOKEN}}" 
      />
    </div>
  );
}

export default JunoView;
