import { useEffect, useState } from "react";
import HubCard from "./components/HubCard/index";
import parseROCrateDataJS, { RoCrateServiceDefinition } from "@/lib/roCrate";
import { Input } from "@/components/ui/input";
import { Filter, LoaderPinwheel, Search } from "lucide-react";
import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectIcon } from "@radix-ui/react-select";
import GenericTopbar from "@/components/Topbar";
import OscarColors from "@/styles";
import yamlToServices from "../services/components/FDL/utils/yamlToService";
import { Service } from "../services/models/service";
import GenericTable from "@/components/Table";
import HubTableActions from "./components/HubTableActions";
import LayoutSelect from "@/components/LayoutSelect";
import { getHubServiceTypeTagColor } from "@/lib/utils";

function HubView() {
  const [filteredServices, setFilteredServices] = useState<Record<string, [RoCrateServiceDefinition, Service]>>({});
  const [serviceDefinitions, setServiceDefinitions] = useState<Record<string, [RoCrateServiceDefinition, Service]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<{serviceType: string}>({serviceType: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isGridView, setIsGridView] = useState(true);

  async function fetchData() {
    setIsLoading(true);
    const roCrateServices = await parseROCrateDataJS("grycap", "oscar-hub", "main");
    let i = 0;
    let services: Record<string, [RoCrateServiceDefinition, Service]> = {};
    for (const roCrateServiceDef of roCrateServices) {
      const service = await fetchService(roCrateServiceDef);
      service && (services[i.toString()] = [roCrateServiceDef, service]);
      i++;
    }
    setServiceDefinitions(services);
    setFilteredServices(services);
    setIsLoading(false);
  }

  async function fetchService(roCrateServiceDef: RoCrateServiceDefinition): Promise<Service | undefined> {
    const response = await fetch(roCrateServiceDef.fdlUrl);
    if (response.ok) {
      const service = yamlToServices(await response.text(), "")![0];
      const services: Service = {
        ...service,
        environment: {
          ...service.environment,
          secrets: Object.fromEntries(Object.entries(service.environment?.secrets || {}).map(([key, _]) => {
            return [key, ''];
          })),
        },
      };
      return services;
    }
    return undefined;
  }

  useEffect(() => {
    document.title ="OSCAR - Hub"
  }, []);

  // Filter services based on search query
  useEffect(() => {
    if (!searchQuery.trim() && !filter.serviceType) {
      setFilteredServices(serviceDefinitions);
    } else {
      const filtered = Object.entries(serviceDefinitions).filter(([, [roCrateServiceDef, _]]) => {
        const query = searchQuery.toLowerCase();
        return (
          roCrateServiceDef.name.toLowerCase().includes(query) && 
          (!filter.serviceType || roCrateServiceDef.type.some(type => type === filter.serviceType))
        );
      });
      setFilteredServices(Object.fromEntries(filtered));
    }
  }, [searchQuery, serviceDefinitions, filter]);

  return (
    <div className="w-full h-full overflow-auto">
      <GenericTopbar defaultHeader={{title: "Hub", linkTo: "/ui/hub"}} refresher={fetchData} 
      secondaryRow={
        <div className="grid grid-cols-[auto_auto_1fr] w-full px-2 py-1 gap-2">
          <LayoutSelect isGridView={isGridView} setIsGridView={setIsGridView} />
          <Select>
            <SelectTrigger className="w-max">
              <SelectIcon>
                <Filter size={16} className="mr-2" />
              </SelectIcon>
            </SelectTrigger>

            <SelectContent>
              <div className="flex flex-row gap-2 items-center p-2">
                <Checkbox
                  id="asyncServices"
                  checked={filter.serviceType === "asynchronous"}
                  onCheckedChange={(checked) => {
                    setFilter((prev) => ({
                      ...prev,
                      serviceType: checked ? "asynchronous" : "",
                    }));
                  }}
                  style={{ fontSize: 16 }}
                />
                <label
                  htmlFor="asyncServices"
                  style={{ fontSize: 14}}
                >Asynchronous services</label>
              </div>
              <div className="flex flex-row gap-2 items-center p-2">
                <Checkbox
                  id="syncServices"
                  checked={filter.serviceType === "synchronous"}
                  onCheckedChange={(checked) => {
                    setFilter((prev) => ({
                      ...prev,
                      serviceType: checked ? "synchronous" : "",
                    }));
                  }}
                  style={{ fontSize: 16 }}
                />
                <label
                  htmlFor="syncServices"
                  style={{ fontSize: 14}}
                >Synchronous services</label>
              </div>
              <div className="flex flex-row gap-2 items-center p-2">
                <Checkbox
                  id="exposedServices"
                  checked={filter.serviceType === "exposed"}
                  onCheckedChange={(checked) => {
                    setFilter((prev) => ({
                      ...prev,
                      serviceType: checked ? "exposed" : "",
                    }));
                  }}
                  style={{ fontSize: 16 }}
                />
                <label
                  htmlFor="syncServices"
                  style={{ fontSize: 14}}
                >Esposed services</label>
              </div>
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
      />
      <div className={`grid grid-cols-1 gap-6 ${isGridView ? `w-[95%] max-w-[1600px]` : 'w-full'} mx-auto mt-4 min-w-[300px] content-start`}>
        {isLoading ? (
        <div className="flex items-center justify-center h-[80vh]">
            <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
        </div>) : (
        <div className="flex flex-wrap gap-1 justify-center sm:justify-start gap-6">
          {
            Object.keys(filteredServices).length > 0 ? (
              isGridView ? 
                (Object.entries(filteredServices).map(([key, [roCrateServiceDef, service]]) => (
                  <HubCard key={key} roCrateServiceDef={roCrateServiceDef} service={service} />
                ))) 
                : (
                <GenericTable
                  data={Object.entries(filteredServices).map(([key, [roCrateServiceDef, service]]) => ({
                    Name: roCrateServiceDef.name,
                    Type: roCrateServiceDef.type,
                    Key: key,
                    DockerImage: service.image,
                    RoCrate: roCrateServiceDef,
                    FDL: service,
                  }))}
                  idKey={"Key"}
                  columns={
                    [
                      {
                        header: "Name",
                        accessor: "Name",
                        sortBy: "Name",
                      },
                      {
                        header: "Type",
                        accessor: (row) => (
                          <div className="flex flex-wrap font-medium gap-2">
                            {row.Type.map((type, index) => (
                              <span key={index} className={`text-sm ${getHubServiceTypeTagColor(type)} rounded-xl py-1 px-2`}>
                                {type !== "" ? type : 'Not specified'}
                              </span>
                            ))}
                          </div>
                        ),
                        sortBy: "Type",
                      },
                      {
                        header: "Image",
                        accessor: "DockerImage",
                        sortBy: "DockerImage",
                      },
                    ]
                  }
                  actions={[
                    {
                      button: (item) => {
                        return (
                          <>
                            <HubTableActions 
                              roCrateServiceDef={item.RoCrate} 
                              service={item.FDL} 
                            />
                          </>
                        );
                      },
                    },
                  ]}
                />
              )
            ) : (
            <div className="w-full text-center py-8">
              <p className="text-gray-500 text-lg">
                {searchQuery.trim() 
                  ? `No services found matching "${searchQuery}"`
                  : "No services available"
                }
              </p>
              {searchQuery.trim() && (
                <p className="text-gray-400 text-sm mt-2">
                  Try searching with different keywords or clear the search to see all services.
                </p>
              )}
            </div>
            )
          }
        </div>
        )}
      </div>
    </div>
  );
}

export default HubView;
