import { useEffect, useState } from "react";
import HubCard from "./components/HubCard/index";
import parseROCrateDataJS, { RoCrateServiceDefinition } from "@/lib/roCrate";


function HubView() {
  const [roCrateServices, setServices] = useState<RoCrateServiceDefinition[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const roCrateServices = await parseROCrateDataJS("grycap", "oscar-hub", "main");
      setServices(roCrateServices);
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 w-[95%] sm:w-[90%] lg:w-[80%] mx-auto mt-[40px] min-w-[300px] content-start">
        <div className="text-center sm:text-left" >
          <h1 className="" style={{ fontSize: "24px", fontWeight: "500" }}>OSCAR Hub</h1>
          <p className="text-gray-600">
            Here you can find a collection of services and applications that can be deployed on the OSCAR platform.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-1 justify-center sm:justify-start gap-6">
          {roCrateServices.map((service, index) => (
            <HubCard key={index} roCrateServiceDef={service} />
          ))}
        </div>
      </div>
    </>
  );
}

export default HubView;
