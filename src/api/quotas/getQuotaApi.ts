
import { parseCpuToMillicores, parseMemoryToBytes } from "@/lib/utils";
import { ClusterUserQuota } from "@/models/clusterUserQuota";
import axios from "axios";

function parseQuotaResources(data: ClusterUserQuota): ClusterUserQuota {
  const { cpu, memory } = data.resources;
  return {
    ...data,
    resources: {
      cpu: {
        max: typeof cpu.max === "string" ? parseCpuToMillicores(cpu.max) : cpu.max,
        used: typeof cpu.used === "string" ? parseCpuToMillicores(cpu.used) : cpu.used,
      },
      memory: {
        max: typeof memory.max === "string" ? parseMemoryToBytes(memory.max) : memory.max,
        used: typeof memory.used === "string" ? parseMemoryToBytes(memory.used) : memory.used,
      },
    },
  };
}

async function getUserQuotaApi(user?: string): Promise<ClusterUserQuota> {
  const response = await axios.get(`/system/quotas/user${user ? "/" + user : ""}`);
  return parseQuotaResources(response.data);
}

export default getUserQuotaApi;