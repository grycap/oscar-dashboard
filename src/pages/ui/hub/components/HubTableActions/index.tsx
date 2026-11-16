import { useState } from "react";
import HubDialogInfo from "../HubDialogInfo";
import HubServiceConfPopover from "../HubServiceConfPopover";
import { Service } from "@/pages/ui/services/models/service";
import { RoCrateServiceDefinition } from "@/lib/roCrate";

interface HubTableActionsProps {
	roCrateServiceDef: RoCrateServiceDefinition;
	services: Service[];
}

function HubTableActions( { roCrateServiceDef, services }: HubTableActionsProps ) {
	const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
	const [isInfoOpen, setIsInfoOpen] = useState(false);
	return (
    <div className="flex flex-row gap-2">
      <HubServiceConfPopover 
        variant={"mainGreen"}
        roCrateServiceDef={roCrateServiceDef} services={services} isOpen={isDeployDialogOpen} setIsOpen={setIsDeployDialogOpen}
      />
      <HubDialogInfo 
        isInfoOpen={isInfoOpen} 
        roCrateServiceDef={roCrateServiceDef} 
        services={services}
        setIsDeployDialogOpen={setIsDeployDialogOpen} 
        setIsInfoOpen={setIsInfoOpen} 
      />
		</div>
	);
}

export default HubTableActions;
