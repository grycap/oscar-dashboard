import axios from "axios";
import {
  MetricsSummaryResponse,
  MetricsTimeRangeParams,
} from "@/models/systemMetrics";

async function getMetricsSummaryApi(
  params: MetricsTimeRangeParams = {},
): Promise<MetricsSummaryResponse> {
  const response = await axios.get("/system/metrics", {
    params,
  });

  return response.data as MetricsSummaryResponse;
}

export default getMetricsSummaryApi;
