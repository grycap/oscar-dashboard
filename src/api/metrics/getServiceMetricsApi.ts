import axios from "axios";
import {
  MetricKey,
  MetricsTimeRangeParams,
  ServiceMetricsResponse,
} from "@/models/systemMetrics";

type GetServiceMetricsApiParams = MetricsTimeRangeParams & {
  serviceName: string;
  metric?: MetricKey;
};

async function getServiceMetricsApi({
  serviceName,
  metric,
  start,
  end,
}: GetServiceMetricsApiParams): Promise<ServiceMetricsResponse> {
  const response = await axios.get(`/system/metrics/${encodeURIComponent(serviceName)}`, {
    params: {
      metric,
      start,
      end,
    },
  });

  return response.data as ServiceMetricsResponse;
}

export default getServiceMetricsApi;
