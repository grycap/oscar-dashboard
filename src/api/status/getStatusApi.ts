import { ClusterStatus } from "@/models/clusterStatus";
import axios from "axios";

async function getStatusApi(): Promise<ClusterStatus> {
  const response = await axios.get("/system/status");
  return response.data as ClusterStatus;
}

export default getStatusApi;