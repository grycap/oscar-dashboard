import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentsDeployedlist from "./components/AgentsDeployedList";
import AgentsCatalog from "./components/AgentsCatalog";
import GenericTopbar from "@/components/Topbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import useServicesContext from "../services/context/ServicesContext";
import getServicesApi from "@/api/services/getServicesApi";
import { errorMessage } from "@/lib/error";
import { alert } from "@/lib/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Filter, LoaderPinwheel, Search } from "lucide-react";
import { SelectIcon } from "@radix-ui/react-select";
import AgentFormPopover from "./components/AgentsFormPopover";
import OscarColors from "@/styles";
import { parseAgentsROCrateDataJS, RoCrateAgentServiceDefinition } from "@/lib/roCrate";
import { Service } from "../services/models/service";
import yamlToServices from "../services/components/FDL/utils/yamlToService";

/*interface GitAgentsSource {
  repository: string;
  branch: string;
}*/

const DEFAULT_SOURCES = [
  { repository: "grycap/oscar-agents", branch: "main" },
];

function AgentsView() {
  const { authData } = useAuth();
  const { services, setServices } = useServicesContext();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceDefinitions, setServiceDefinitions] = useState<Record<string, [RoCrateAgentServiceDefinition, Service]>>({});
  const [filteredServices, setFilteredServices] = useState<Record<string, [RoCrateAgentServiceDefinition, Service]>>({});
  //const [selectedSource, setSelectedSource] = useState<GitAgentsSource>(DEFAULT_SOURCES[0]);
  const selectedSource = DEFAULT_SOURCES[0];
  const [activeTab, setActiveTab] = useState<"agents-deployed-list" | "agents-catalog">("agents-deployed-list");

  const ownerName = authData?.egiSession?.sub ?? authData?.token ?? (authData?.user === "oscar" ? "cluster_admin" : authData?.user);
  const agentsService = services.filter((service) => (service.owner === ownerName ||  ownerName === "cluster_admin") && service.labels["oscar_agent"] === "true");
  const filteredAgentsService = useMemo(
    () => agentsService.filter((service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [agentsService, searchQuery]
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredServices(serviceDefinitions);
      return;
    }

    const filtered = Object.entries(serviceDefinitions).filter(([
      ,
      [roCrateServiceDef],
    ]) => roCrateServiceDef.name.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredServices(Object.fromEntries(filtered));
  }, [searchQuery, serviceDefinitions]);

  useEffect(() => {
    document.title ="OSCAR - Agents"
  }, []);

  async function refreshAgentsServicesList() {
    try {
      setIsLoading(true);
      const response = await getServicesApi();
      setServices(response);
    } catch (error) {
      alert.error(`Error getting services: ${errorMessage(error)}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  const fetchService = useCallback(
    async (
      roCrateServiceDef: RoCrateAgentServiceDefinition
    ): Promise<Service | undefined> => {
      const response = await fetch(roCrateServiceDef.fdlUrl);
      if (response.ok) {
        const service = yamlToServices(await response.text(), "", true)![0];
        const services: Service = {
          ...service,
          environment: {
            ...service.environment,
            secrets: Object.fromEntries(
              Object.entries(service.environment?.secrets || {}).map(
                ([key]) => {
                  return [key, ""];
                }
              )
            ),
          },
        };
        return services;
      }
      return undefined;
    },
    []
  );

  const refreshAgentsCatalog = useCallback(async () => {
    setIsLoading(true);
    const repoOwner = selectedSource.repository.split("/")[0];
    const repoName = selectedSource.repository.split("/")[1];
    const roCrateServices = await parseAgentsROCrateDataJS(
      repoOwner,
      repoName,
      selectedSource.branch
    );
    let i = 0;
    const services: Record<string, [RoCrateAgentServiceDefinition, Service]> = {};
    for (const roCrateServiceDef of roCrateServices) {
      const service = await fetchService(roCrateServiceDef);
      service && (services[i.toString()] = [roCrateServiceDef, service]);
      i++;
    }
    setServiceDefinitions(services);
    setFilteredServices(services);
    setIsLoading(false);
  }, [fetchService, selectedSource]);


  return (
    <div className="w-full h-full flex flex-col">
    <GenericTopbar defaultHeader={{ title: "Agents", linkTo: "/ui/agents" }}  refresher={activeTab === "agents-catalog" ? refreshAgentsCatalog : refreshAgentsServicesList}
      secondaryRow={
        <div className="grid grid-cols-[auto_1fr] w-full px-2 py-1 gap-2">
          <Select defaultValue="name">
            <SelectTrigger className="w-max">
              <SelectIcon>
                <Filter size={16} className="mr-2" />
              </SelectIcon>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="name">By name</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search services by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            endIcon={<Search size={16} />}
          />
        </div>
      }
    >
      <div className="flex flex-row items-center w-full justify-end gap-2">
        <AgentFormPopover  />
      </div>
    </GenericTopbar>
    <Tabs
      id="agents-tabs"
      className="w-full h-full min-w-[300px]"
      defaultValue="agents-deployed-list"
      onValueChange={(value) => {
        setActiveTab(value as "agents-deployed-list" | "agents-catalog");
        if (value === "agents-catalog") {
          void refreshAgentsCatalog();
        } else if (value === "agents-deployed-list") {
          void refreshAgentsServicesList();
        }
      }}
    >
      <TabsList className="w-[calc(100%-1rem)] mb-2 mx-2 px-1 py-0 grid grid-cols-2 gap-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-sm">
        <TabsTrigger value="agents-deployed-list" className="w-full py-1 rounded-xl uppercase">Deployed</TabsTrigger>
        <TabsTrigger value="agents-catalog" className="w-full py-1 rounded-xl uppercase">Catalog</TabsTrigger>
      </TabsList>
      <TabsContent value="agents-deployed-list" className="w-full h-[calc(100%-3.5rem)]">
        {isLoading === true ?
          <div className="flex items-center justify-center h-full">
            <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
          </div>
          :
          <AgentsDeployedlist services={filteredAgentsService} />
        }
      </TabsContent>
      <TabsContent value="agents-catalog" className="w-full h-[calc(100%-3.5rem)]">
        {isLoading === true ?
          <div className="flex items-center justify-center h-full">
            <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
          </div>
          :
          <AgentsCatalog filteredServices={filteredServices}/>
        }
      </TabsContent>
    </Tabs>
    </div>
  )
}

export default AgentsView;