import { ClusterLog } from "@/models/clusterLogs";
import axios from "axios";

export async function getClusterServiceLogsApi() {
  const response = await axios.get(`/system/logs`);

  return response.data.logs as Array<ClusterLog>;
}
