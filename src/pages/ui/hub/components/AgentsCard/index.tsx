import { Service } from "../../../services/models/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { RoCrateAgentServiceDefinition } from "@/lib/roCrate";
import AgentsServiceConfPopover from "../AgentsServiceConfPopover";
import AgentsDialogInfo from "../AgentsDialogInfo";


interface AgentsCardProps {
	roCrateServiceDef: RoCrateAgentServiceDefinition;
	service: Service;
}

function AgentsCard( { roCrateServiceDef, service }: AgentsCardProps ) {
	const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
	const [isInfoOpen, setIsInfoOpen] = useState(false);

	return (
		<Card className="w-60 h-70 flex flex-col hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
			<CardHeader className="pl-4 pr-1 pb-1 pt-2 border-b border-gray-200 dark:border-slate-700">
				<CardTitle className="text-md text-left text-gray-800 dark:text-slate-100">
					<div className="flex flex-row items-center justify-between ">
						{roCrateServiceDef.name}
						<AgentsDialogInfo isInfoOpen={isInfoOpen} roCrateServiceDef={roCrateServiceDef} service={service} setIsDeployDialogOpen={setIsDeployDialogOpen} setIsInfoOpen={setIsInfoOpen} />
					</div>
				</CardTitle>
			</CardHeader>
			
			<CardContent className="flex-1 flex flex-col items-center justify-between p-0 relative group bg-muted">
				
				<div className="w-32 h-32 mb-4 flex items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-lg overflow-hidden group-hover:opacity-30 transition-opacity duration-300"
				>
					<img
						src={roCrateServiceDef.iconUrl}
						className="max-w-full max-h-full object-contain"
						onError={(e) => {
							const target = e.target as HTMLImageElement;
							target.src = "https://oscar.grycap.net/images/oscar3-logo-trans.png";
						}}
					/>
				</div>

				<div className="flex flex-col items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute h-full w-full bg-black bg-opacity-10">
					<AgentsServiceConfPopover 
						className="hover:opacity-90 text-white rounded-sm w-full h-8"
						variant={"mainGreen"}
						roCrateServiceDef={roCrateServiceDef} service={service} isOpen={isDeployDialogOpen} setIsOpen={setIsDeployDialogOpen}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

export default AgentsCard;
