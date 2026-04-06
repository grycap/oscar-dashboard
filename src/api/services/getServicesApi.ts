import { Service } from "@/pages/ui/services/models/service";
import axios from "axios";

interface GetServicesApiOptions {
  includeDeployment?: boolean;
}

async function getServicesApi(options: GetServicesApiOptions = {}) {
  const response = await axios.get("/system/services", {
    params: options.includeDeployment ? { include: "deployment" } : undefined,
  });

  return response.data as Service[];
}

export default getServicesApi;
