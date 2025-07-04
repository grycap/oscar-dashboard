import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import useServicesContext from "../services/context/ServicesContext";
import FlowsFormPopover from "./components/FlowsFormPopover";
import IntegratedApp from "@/components/IntegratedApp";

function FlowsView() {
  const { authData } = useAuth();
  const { services } = useServicesContext();

  const ownerName = authData?.egiSession?.sub ?? authData?.token ?? (authData?.user === "oscar" ? "cluster_admin" : authData?.user);
  const flowsService = services.filter((service) => service.owner === ownerName && service.labels["node_red"] === "true");

  useEffect(() => {
    document.title ="OSCAR - Flows"
  });

  return (
    <>
      <IntegratedApp appName="Node-RED" endpoint={authData.endpoint} filteredServices={flowsService} DeployInstancePopover={FlowsFormPopover} />
    </>
  );
}

export default FlowsView;
