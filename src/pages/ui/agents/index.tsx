import AgentsDeployedlist from "./components/AgentsDeployedList";
import GenericTopbar from "@/components/Topbar";
import { useEffect, useMemo, useState } from "react";
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

/*interface GitAgentsSource {
  repository: string;
  branch: string;
}*/
/*
const DEFAULT_SOURCES = [
  { repository: "grycap/oscar-agents", branch: "main" },
];*/

function AgentsView() {
  const { authData } = useAuth();
  const { services, setServices } = useServicesContext();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const ownerName = authData?.egiSession?.sub ?? authData?.token ?? (authData?.user === "oscar" ? "cluster_admin" : authData?.user);
  const agentsService = services.filter((service) => (service.owner === ownerName ||  ownerName === "cluster_admin") && service.labels["oscar_agent"] === "true");
  const filteredAgentsService = useMemo(
    () => agentsService.filter((service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [agentsService, searchQuery]
  );


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


  return (
    <div className="w-full h-full flex flex-col">
    <GenericTopbar defaultHeader={{ title: "Agents", linkTo: "/ui/agents" }}  refresher={refreshAgentsServicesList}
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
      {isLoading === true ?
        <div className="flex items-center justify-center h-full">
          <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
        </div>
        :
        <AgentsDeployedlist services={filteredAgentsService} />
      }
    </div>
  )
}

export default AgentsView;