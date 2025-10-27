import Log from "@/pages/ui/services/models/log";
import axios from "axios";

export async function getServiceLogsApi(serviceName: string, page?: string) {
  const response = await axios.get(`/system/logs/${serviceName}`, {
    params: {
      page,
    },
  });

  return response.data as Record<string, Record<string, Log>>;
}
