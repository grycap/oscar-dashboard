import AgentsCard from "./components/AgentsCard";
import { RoCrateAgentServiceDefinition } from "@/lib/roCrate";
import { Service } from "@/pages/ui/services/models/service";

function AgentsCatalog({filteredServices}: {filteredServices: Record<string, [RoCrateAgentServiceDefinition, Service]>}) {
/*
  useEffect(() => {
    void fetchData();
  }, [fetchData]);*/

  return (
    <div className="flex flex-wrap gap-1 w-[95%] max-w-[1600px] mx-auto mt-4 justify-center sm:justify-start gap-6">
      {
        (Object.entries(filteredServices).map(([key, [roCrateServiceDef, service]]) => (
          <AgentsCard key={key} roCrateServiceDef={roCrateServiceDef} service={service} />
        ))) 
      }
    </div>
  );
}

export default AgentsCatalog;