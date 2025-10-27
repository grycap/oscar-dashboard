import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import useServicesContext from "../services/context/ServicesContext";
import FlowsFormPopover from "./components/FlowsFormPopover";
import IntegratedApp from "@/components/IntegratedApp";

function FlowsView() {
  const { authData } = useAuth();
  const { services } = useServicesContext();

  const ownerName = authData?.egiSession?.sub ?? authData?.token ?? (authData?.user === "oscar" ? "cluster_admin" : authData?.user);
  const flowsService = services.filter((service) => (service.owner === ownerName ||  ownerName === "cluster_admin") && service.labels["node_red"] === "true");
  
  useEffect(() => {
    document.title ="OSCAR - Flows"
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <IntegratedApp 
        appName="Flows" 
        deployedServiceEndpoint={authData.endpoint} 
        filteredServices={flowsService} 
        DeployInstancePopover={FlowsFormPopover} 
      />
    </div>
  );
}

export default FlowsView;
