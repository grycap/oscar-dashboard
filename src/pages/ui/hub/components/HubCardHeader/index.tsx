import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { RoCrateServiceDefinition } from "@/lib/roCrate";
import OscarColors from "@/styles";
import { AlertTriangle, Info } from "lucide-react";



function HubCardHeader( { roCrateServiceDef, card } : { roCrateServiceDef: RoCrateServiceDefinition, card: 'info' | 'deploy' } ) {
  const {systemConfig } = useAuth();
  

  function gpuWarning(): boolean {
    return (
      roCrateServiceDef.gpuRequirements !== "" && 
      parseInt(roCrateServiceDef.gpuRequirements) > 0 && 
      systemConfig?.config.gpu_available === false
    ) 
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex flex-row items-center gap-2" style={{ color: gpuWarning() ? "red" : OscarColors.DarkGrayText }} >
            {gpuWarning() ? <AlertTriangle color="red" /> : card === 'info' ? <Info size={20} /> : null}
            {`${roCrateServiceDef.name}`}
          </span>
        </TooltipTrigger>
        {gpuWarning() && (
          <TooltipContent>
            <p>Warning: This service requires GPU but GPU is not available on this cluster</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

export default HubCardHeader;