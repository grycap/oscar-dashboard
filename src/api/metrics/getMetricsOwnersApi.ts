import axios from "axios";
import { MetricsOwnersResponse } from "@/models/systemMetrics";

async function getMetricsOwnersApi(): Promise<MetricsOwnersResponse> {
  const response = await axios.get("/system/metrics/owners");
  return response.data as MetricsOwnersResponse;
}

export default getMetricsOwnersApi;
