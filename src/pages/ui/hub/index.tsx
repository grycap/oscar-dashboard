import { useEffect, useState } from "react";
import HubCard from "./components/HubCard/index";
import parseROCrateDataJS, { RoCrateServiceDefinition } from "@/lib/roCrate";
import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { Input } from "@/components/ui/input";
import { Copy, Filter, Search } from "lucide-react";
import { Select, SelectContent, SelectTrigger } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectIcon } from "@radix-ui/react-select";

function HubView() {
  const [roCrateServices, setServices] = useState<RoCrateServiceDefinition[]>([]);
  const [filteredServices, setFilteredServices] = useState<RoCrateServiceDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const authContext = useAuth();
  const [filter, setFilter] = useState<{serviceType: string}>({serviceType: "" });


  useEffect(() => {
    const fetchData = async () => {
      const roCrateServices = await parseROCrateDataJS("grycap", "oscar-hub", "main");
      setServices(roCrateServices);
      setFilteredServices(roCrateServices);
    };
    fetchData();
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
    <>
      <div className="grid grid-cols-1 gap-6 w-[95%] sm:w-[90%] lg:w-[80%] mx-auto mt-[40px] min-w-[300px] max-w-[1600px] content-start">
        <div className="text-center sm:text-left" >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h1 className="" style={{ fontSize: "24px", fontWeight: "500" }}>OSCAR Hub</h1>
            <div className="grid grid-cols-1 xl:grid-cols-[auto_auto] text-md text-decoration-underline-hover"
                onClick={() => {
                        navigator.clipboard.writeText(authContext.authData.endpoint);
                        alert.success("Endpoint copied to clipboard");
                      }}
                style={{
                  cursor: "pointer",
                }}
            >
              <div className="truncate">
                {`${authContext.authData.user} -\u00A0`}
              </div>
              <div className="flex flex-row items-center justify-center gap-2 truncate">
                {`${authContext.authData.endpoint}`}
                <Copy className="h-4 w-4" />
              </div>
            </div>
          </div>
          <p className="text-gray-600">
            A collection of services ready to be deployed in OSCAR.
          </p>
        </div>

        <div className="grid grid-cols-[auto_1fr] w-full -mb-3 gap-2">
          <Select
          >
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
        
        <div className="flex flex-wrap gap-1 justify-center sm:justify-start gap-6">
          {filteredServices.length > 0 ? (
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
          )}
        </div>
      </div>
    </>
  );
}

export default HubView;
