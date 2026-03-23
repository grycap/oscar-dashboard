
import { ClusterUserQuota, QuotaUpdateRequest } from "@/models/clusterUserQuota";
import axios from "axios";

async function putUserQuotaApi(uid: string, userQuota: QuotaUpdateRequest): Promise<ClusterUserQuota> {
  const response = await axios.put(`/system/quotas/user/${uid}`, userQuota);
  return response.data as ClusterUserQuota;
}

export default putUserQuotaApi;