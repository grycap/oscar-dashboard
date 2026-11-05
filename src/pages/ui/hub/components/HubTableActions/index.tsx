import { useState } from "react";
import HubDialogInfo from "../HubDialogInfo";
import HubServiceConfPopover from "../HubServiceConfPopover";
import { Service } from "@/pages/ui/services/models/service";
import { RoCrateServiceDefinition } from "@/lib/roCrate";

interface HubTableActionsProps {
	roCrateServiceDef: RoCrateServiceDefinition;
	service: Service;
}

function HubTableActions( { roCrateServiceDef, service }: HubTableActionsProps ) {
	const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
	const [isInfoOpen, setIsInfoOpen] = useState(false);
	return (
    <div className="flex flex-row gap-2">
      <HubServiceConfPopover 
        variant={"mainGreen"}
        roCrateServiceDef={roCrateServiceDef} service={service!} isOpen={isDeployDialogOpen} setIsOpen={setIsDeployDialogOpen}
      />
      <HubDialogInfo 
        isInfoOpen={isInfoOpen} 
        roCrateServiceDef={roCrateServiceDef} 
        service={service} 
        setIsDeployDialogOpen={setIsDeployDialogOpen} 
        setIsInfoOpen={setIsInfoOpen} 
      />
		</div>
	);
}

export default HubTableActions;
