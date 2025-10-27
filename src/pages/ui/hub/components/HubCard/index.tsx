import { Button } from "@/components/ui/button";
import { Service } from "../../../services/models/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { RoCrateServiceDefinition } from "@/lib/roCrate";
import yamlToServices from "@/pages/ui/services/components/FDL/utils/yamlToService";
import HubServiceConfPopover from "../HubServiceConfPopover";


interface HubCardProps {
	roCrateServiceDef: RoCrateServiceDefinition;
}

function HubCard( { roCrateServiceDef }: HubCardProps ) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isInfoOpen, setIsInfoOpen] = useState(false);
	const [service, setService] = useState<Service>();
	const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
		try {
			const response = await fetch(roCrateServiceDef.fdlUrl);
			if (response.ok) {
				const service = yamlToServices(await response.text(), "")![0];
				setService(service);
			} else {
				setError(true);
			}
		} catch (error) {
			setError(true);
		}
    };
    fetchData();
  }, []);


	return (
		<>
		{!error && (
		<Card className="w-60 h-70 flex flex-col hover:shadow-lg transition-shadow duration-300 bg-white border border-gray-200">
			<CardHeader className="pl-4 pr-1 pb-1 pt-2 border-b border-gray-200">
				<CardTitle className="text-md text-left text-gray-800">
					<div className="flex flex-row items-center justify-between ">
						{roCrateServiceDef.name}
						<Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
							<DialogTrigger asChild className="self-start">
								<Button
									variant="ghost"
									size="sm"
									tooltipLabel="Service Info"
									className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 "
								>
									<Info size={16} />
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-xl">
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<Info size={20} />
										{roCrateServiceDef.name}
									</DialogTitle>
								</DialogHeader>
								<div className="mt-2">
									<h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-1">
										Service Details
									</h4>
									<div className="flex flex-wrap font-medium gap-x-8 gap-y-2 items-start">
										<div className="flex flex-col gap-1">
											<h4 className="text-xs text-gray-500 uppercase tracking-wide">
												Author
											</h4>
											<div>
												<span className="text-sm text-gray-700  py-1">
													{roCrateServiceDef.author || 'Unknown'}
												</span>
											</div>
										</div>
										<div className="flex flex-col gap-1">
											<h4 className="text-xs text-gray-500 uppercase tracking-wide">
												Type
											</h4>
											<div>
												<span className={`text-sm ${roCrateServiceDef.type !== "" ? (roCrateServiceDef.type === "asynchronous" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700") : "bg-red-100 text-red-700"} rounded-xl py-1 px-2`}>
													{roCrateServiceDef.type !== "" ? roCrateServiceDef.type : 'Not specified'}
												</span>
											</div>
										</div>
										<div className="flex flex-col gap-1">
											<h4 className="text-xs text-gray-500 uppercase tracking-wide">
												Docker Image
												</h4>
											<div>
												<code className="text-xs bg-gray-100 text-gray-700 rounded-xl font-mono py-1 px-2">
													{service?.image}
												</code>
											</div>
										</div>
									</div>

									<div className="mt-4">
										<h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">
											System Requirements
										</h4>
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
											<div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
												<div className="flex items-center justify-between mb-2">
													<h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
														CPU
													</h5>
													<span className="text-xs text-gray-400">⚡</span>
												</div>
												<div className="text-sm text-gray-700 font-medium">
													{roCrateServiceDef.cpuRequirements || 'Not specified'}
												</div>
											</div>
											
											<div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
												<div className="flex items-center justify-between mb-2">
													<h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
														GPU
													</h5>
													<span className="text-xs text-gray-400">🖥️</span>
												</div>
												<div className="text-sm text-gray-700 font-medium">
													{(Number(roCrateServiceDef.gpuRequirements) > 0 ? roCrateServiceDef.gpuRequirements : 'Not required')}
												</div>
											</div>
											
											<div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
												<div className="flex items-center justify-between mb-2">
													<h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
														RAM
													</h5>
													<span className="text-xs text-gray-400">💾</span>
												</div>
												<div className="text-sm text-gray-700 font-medium mb-2">
													{roCrateServiceDef.memoryRequirements && roCrateServiceDef.memoryUnits 
														? `${roCrateServiceDef.memoryRequirements} ${roCrateServiceDef.memoryUnits}`
														: 'Not specified'
													}
												</div>
											</div>
										</div>
									</div>

									<div className="mt-4">
										<h4 className="font-semibold text-gray-800 uppercase">
											Description
										</h4>
										<p className="text-gray-600">
											{roCrateServiceDef.description || 'Not specified'}
										</p>
									</div>

									<div className="flex mt-6">
										<Button 
											className="hover:opacity-90 text-white rounded w-full h-8"
											variant={"mainGreen"}
											onClick={() => {setIsDialogOpen(true); setIsInfoOpen(false);}}
										>
											Deploy
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</CardTitle>
			</CardHeader>
			
			<CardContent className="flex-1 flex flex-col items-center justify-between p-0 relative group" 
				style={{
					/*backgroundImage: "url('/src/assets/oscar-big.png')",
					backgroundSize: "cover",
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
					height: "100%",
					width: "100%"*/
					backgroundColor: "#f8f9fa",
					display: "flex",
				}}
				>
				
				<div className="w-32 h-32 mb-4 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden group-hover:opacity-30 transition-opacity duration-300"
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
					<div className="flex flex-col text-white mb-4 px-4">

					</div>
					<HubServiceConfPopover 
						className="hover:opacity-90 text-white rounded-sm w-full h-8"
						variant={"mainGreen"}
						roCrateServiceDef={roCrateServiceDef} service={service!} isOpen={isDialogOpen} setIsOpen={setIsDialogOpen}
					/>
				</div>
			</CardContent>
		</Card>
		)}
		</>
	);
}

export default HubCard;
