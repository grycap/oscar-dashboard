import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import HubCardHeader from "../HubCardHeader";
import { getHubServiceTypeTagColor } from "@/lib/utils";
import { RoCrateServiceDefinition } from "@/lib/roCrate";
import { Service } from "@/pages/ui/services/models/service";


interface HubDialogInfoProps {
  roCrateServiceDef: RoCrateServiceDefinition;
  service: Service | undefined;
  setIsDeployDialogOpen: (open: boolean) => void;
  isInfoOpen: boolean;
  setIsInfoOpen: (open: boolean) => void;
}

function HubDialogInfo( { roCrateServiceDef, service, setIsDeployDialogOpen, isInfoOpen, setIsInfoOpen }: HubDialogInfoProps ) {
  
  return (
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
            <HubCardHeader roCrateServiceDef={roCrateServiceDef} card="info" />
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
                {roCrateServiceDef.type.map((type, index) => (
                  <span key={index} className={`text-sm ${getHubServiceTypeTagColor(type)} rounded-xl py-1 px-2`}>
                    {type !== "" ? type : 'Not specified'}
                  </span>
                ))}
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
              onClick={() => {setIsDeployDialogOpen(true); setIsInfoOpen(false);}}
            >
              Deploy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default HubDialogInfo;