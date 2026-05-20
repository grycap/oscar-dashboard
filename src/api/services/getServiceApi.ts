import { Service } from "@/pages/ui/services/models/service";
import axios from "axios";

async function getServiceApi(serviceName:string): Promise<Service> {
  const response = await axios.get("/system/services/"+serviceName);

  return response.data as Service;
}

export default getServiceApi;
