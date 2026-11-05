import { useState } from "react";
import { Service } from "@/pages/ui/services/models/service";
import { RoCrateAgentServiceDefinition } from "@/lib/roCrate";
import AgentsServiceConfPopover from "../../../hub/components/AgentsServiceConfPopover";
import AgentsDialogInfo from "../../../hub/components/AgentsDialogInfo";

interface AgentsTableActionsProps {
	roCrateServiceDef: RoCrateAgentServiceDefinition;
	service: Service;
}

function AgentsTableActions( { roCrateServiceDef, service }: AgentsTableActionsProps ) {
	const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
	const [isInfoOpen, setIsInfoOpen] = useState(false);
	return (
    <div className="flex flex-row gap-2">
      <AgentsServiceConfPopover 
        variant={"mainGreen"}
        roCrateServiceDef={roCrateServiceDef} service={service!} isOpen={isDeployDialogOpen} setIsOpen={setIsDeployDialogOpen}
      />
      <AgentsDialogInfo 
        isInfoOpen={isInfoOpen} 
        roCrateServiceDef={roCrateServiceDef} 
        service={service} 
        setIsDeployDialogOpen={setIsDeployDialogOpen} 
        setIsInfoOpen={setIsInfoOpen} 
      />
		</div>
	);
}

export default AgentsTableActions;
