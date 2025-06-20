import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import useServicesContext from "../services/context/ServicesContext";
import FlowsFormPopover from "./components/FlowsFormPopover";
import IntegratedApp from "@/components/IntegratedApp";

function FlowsView() {
  const { authData } = useAuth();
  const { services } = useServicesContext();

  const namePrefix = authData?.egiSession?.sub ?? authData?.token ?? authData?.user;
  const flowsService = services.filter((service) => service.owner === namePrefix && service.labels["node_red"] === "true");

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
