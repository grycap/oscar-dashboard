import axios from "axios";
import { DeploymentStatus } from "@/pages/ui/services/models/deployment";

async function getDeploymentStatusApi(serviceName: string) {
  const response = await axios.get(`/system/services/${serviceName}/deployment`);

  return response.data as DeploymentStatus;
}

export default getDeploymentStatusApi;
