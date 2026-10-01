import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, FileCode2, Info, FileTerminal } from "lucide-react";
import HubCardHeader from "../HubCardHeader";
import { downloadString, getHubServiceTypeTagColor, githubRawToTreeUrl } from "@/lib/utils";
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
  
  const isKserveService = roCrateServiceDef.type.includes('kserve');

  const handleOpenSource = () => {
    if (roCrateServiceDef.fdlUrl) {
      window.open(githubRawToTreeUrl(roCrateServiceDef.fdlUrl), "_blank", "noopener,noreferrer");
    }
  };

  const handleDownloadDefinition = async (type: "fdl" | "script") => {
    const url = type === "fdl" ? roCrateServiceDef.fdlUrl : roCrateServiceDef.scriptUrl;
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type.toUpperCase()} file`);
      }
      const content = await response.text();
      downloadString(
        content,
        type === "fdl" ? `${roCrateServiceDef.name}.yaml` : `${roCrateServiceDef.name}-script.sh`,
        type === "fdl" ? "application/yaml" : "text/plain"
      );
    } catch (error) {
      console.error(`Error downloading ${type}:`, error);
    }
  };

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
      <DialogContent className="max-w-xl ">
        <DialogHeader>
          <DialogTitle className="flex items-center flex-wrap gap-2 mr-4 justify-between">
            <HubCardHeader roCrateServiceDef={roCrateServiceDef} card="info" />
            <div className="flex gap-2 ">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2 text-[11px] gap-1.5"
                onClick={handleOpenSource}
                disabled={!roCrateServiceDef.fdlUrl}
              >
                <ExternalLink size={14} />
                Source
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2 text-[11px] gap-1.5"
                onClick={() => void handleDownloadDefinition("fdl")}
                disabled={!roCrateServiceDef.fdlUrl}
              >
                <FileCode2 size={14} />
                FDL
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2 text-[11px] gap-1.5"
                onClick={() => void handleDownloadDefinition("script")}
                disabled={!roCrateServiceDef.scriptUrl}
              >
                <FileTerminal size={14} />
                Script
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 max-h-[80vh]">
          <div className="overflow-y-auto max-h-full">
          <div>
            <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-1">
              Service Details
            </h4>
          </div>
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
              <div className="flex flex-wrap gap-2">
                {roCrateServiceDef.type.map((type, index) => (
                  <span key={index} className={`text-sm ${getHubServiceTypeTagColor(type)} rounded-xl py-1 px-2`}>
                    {type !== "" ? type : 'Not specified'}
                  </span>
                ))}
              </div>
            </div>
            {service?.image &&
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
            }
            {isKserveService &&
            <>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide">
                KServe Type
                </h4>
              <div>
                <code className="text-xs rounded-xl font-mono py-1 px-2 bg-blue-100 text-blue-700">
                  {service?.kserve?.inference ? 'Inference' : service?.kserve?.llm_inference ? 'LLM Inference' : 'Not specified'}
                </code>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide">
                KServe Runtime Image
              </h4>
              <div>
                <code className="text-xs bg-gray-100 text-gray-700 rounded-xl font-mono py-1 px-2">
                  {service?.kserve?.inference?.runtime ?? service?.kserve?.llm_inference?.runtime_image ?? 'Not specified'}
                </code>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide">
                KServe Model Storage URI
              </h4>
              <div>
                <code className="text-xs bg-gray-100 text-gray-700 rounded-xl font-mono py-1 px-2">
                  {service?.kserve?.storage_uri ?? 'Not specified'}
                </code>
              </div>
            </div>
            </>
            }
          </div>
          {(service?.image) &&
          <>
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
          </>
          }
          {isKserveService &&
          <>
          <div className="mt-4">
            <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">
              Kserve System Requirements
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
                  {roCrateServiceDef.kserveCpuRequirements || 'Not specified'}
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
                  {(Number(roCrateServiceDef.kserveGpuRequirements) > 0 ? roCrateServiceDef.kserveGpuRequirements : 'Not required')}
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
                  {roCrateServiceDef.kserveMemoryRequirements && roCrateServiceDef.kserveMemoryUnits 
                    ? `${roCrateServiceDef.kserveMemoryRequirements} ${roCrateServiceDef.kserveMemoryUnits}`
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
          </>
          }
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