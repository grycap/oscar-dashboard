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

function HubView() {
  const [roCrateServices, setServices] = useState<RoCrateServiceDefinition[]>([]);
  const [filteredServices, setFilteredServices] = useState<RoCrateServiceDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<{serviceType: string}>({serviceType: "" });
  const [isLoading, setIsLoading] = useState(false);

  async function fetchData() {
    setIsLoading(true);
    const roCrateServices = await parseROCrateDataJS("grycap", "oscar-hub", "main");
    setServices(roCrateServices);
    setFilteredServices(roCrateServices);
    setIsLoading(false);
  }

  useEffect(() => {
    document.title ="OSCAR - Hub"
  }, []);

  // Filter services based on search query
  useEffect(() => {
    if (!searchQuery.trim() && !filter.serviceType) {
      setFilteredServices(roCrateServices);
    } else {
      const filtered = roCrateServices.filter((service) => {
        const query = searchQuery.toLowerCase();
        return (
          service.name.toLowerCase().includes(query) && 
          (!filter.serviceType || service.type === filter.serviceType)
        );
      });
      setFilteredServices(filtered);
    }
  }, [searchQuery, roCrateServices, filter]);

  return (
    <div className="w-full h-full overflow-auto">
      <GenericTopbar defaultHeader={{title: "Hub", linkTo: "/ui/hub"}} refresher={fetchData} 
      secondaryRow={
        <div className="grid grid-cols-[auto_1fr] w-full px-2 py-1 gap-2">
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
                >Async. Services</label>
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
                >Sync. Services</label>
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
      
      <div className="grid grid-cols-1 gap-6 w-[95%] mx-auto mt-4 min-w-[300px] max-w-[1600px] content-start">
        {isLoading ? (
        <div className="flex items-center justify-center h-[80vh]">
            <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
        </div>) : (
        <div className="flex flex-wrap gap-1 justify-center sm:justify-start gap-6">
          {
            filteredServices.length > 0 ? (
              filteredServices.map((service, index) => (
                <HubCard key={index} roCrateServiceDef={service} />
              ))
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
