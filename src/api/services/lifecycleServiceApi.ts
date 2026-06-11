import { DeploymentStatus } from "@/pages/ui/services/models/deployment";
import axios from "axios";

export type ServiceLifecycleAction = "stop" | "start" | "restart";

async function lifecycleServiceApi(
  serviceName: string,
  action: ServiceLifecycleAction
) {
  const response = await axios.post(
    `/system/services/${encodeURIComponent(serviceName)}/${action}`
  );

  return response.data as DeploymentStatus;
}

export default lifecycleServiceApi;
