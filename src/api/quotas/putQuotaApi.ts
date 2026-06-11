
import { ClusterUserQuota, QuotaUpdateRequest } from "@/models/clusterUserQuota";
import axios from "axios";

function normalizeQuotaUpdateRequest(userQuota: QuotaUpdateRequest): any {
  if (userQuota.ephemeralStorage === undefined) {
    return userQuota;
  }

  const normalized = { ...userQuota } as Record<string, unknown>;
  normalized["ephemeral-storage"] = userQuota.ephemeralStorage;
  delete normalized.ephemeralStorage;

  return normalized as any;
}

async function putUserQuotaApi(uid: string, userQuota: QuotaUpdateRequest): Promise<ClusterUserQuota> {
  const response = await axios.put(`/system/quotas/user/${uid}`, normalizeQuotaUpdateRequest(userQuota));
  return response.data as ClusterUserQuota;
}

export default putUserQuotaApi;