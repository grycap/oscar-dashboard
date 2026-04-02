
import { ClusterUserQuota } from "@/models/clusterUserQuota";
import axios from "axios";

async function getUserQuotaApi(user?: string): Promise<ClusterUserQuota> {
  const response = await axios.get(`/system/quotas/user${user ? "/" + user : ""}`);
  return response.data as ClusterUserQuota;
}

export default getUserQuotaApi;