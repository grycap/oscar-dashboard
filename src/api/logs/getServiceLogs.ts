import Log from "@/pages/ui/services/models/log";
import axios from "axios";

export async function getServiceLogsApi(serviceName: string, page?: string) {
  const response = await axios.get(`/system/logs/${serviceName}`, {
    params: {
      page,
    },
  });

  return response.data as {jobs: Record<string, Log>, next_page: string | null};
}
