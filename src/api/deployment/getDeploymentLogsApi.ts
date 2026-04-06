import axios from "axios";
import { DeploymentLogStream } from "@/pages/ui/services/models/deployment";

interface DeploymentLogsOptions {
  timestamps?: boolean;
  tailLines?: number;
}

async function getDeploymentLogsApi(
  serviceName: string,
  options: DeploymentLogsOptions = {}
) {
  const response = await axios.get(
    `/system/services/${serviceName}/deployment/logs`,
    {
      params: {
        timestamps: options.timestamps ?? false,
        tailLines: options.tailLines ?? 200,
      },
    }
  );

  return response.data as DeploymentLogStream;
}

export default getDeploymentLogsApi;
