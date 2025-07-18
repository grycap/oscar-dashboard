import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import useServicesContext from "../services/context/ServicesContext";
import IntegratedApp from "@/components/IntegratedApp";
import JunoFormPopover from "./components/JunoFormPopover";

function JunoView() {
  
  const { authData } = useAuth();

  useEffect(() => {
      document.title ="OSCAR - Notebooks"
  });

  const { services } = useServicesContext();

  const ownerName = authData?.egiSession?.sub ?? authData?.token ?? (authData?.user === "oscar" ? "cluster_admin" : authData?.user);
  const junoService = services.filter((service) => service.owner === ownerName && service.labels["jupyter_notebook"] === "true");

  useEffect(() => {
    document.title ="OSCAR - Notebooks"
  });

  return (
    <>
      <IntegratedApp 
        appName="Jupyter Notebook" 
        endpoint={authData.endpoint} 
        filteredServices={junoService} 
        DeployInstancePopover={JunoFormPopover}
        additionalExposedPathArgs="?token={{JUPYTER_TOKEN}}" 
      />
    </>
  );
}

export default JunoView;
