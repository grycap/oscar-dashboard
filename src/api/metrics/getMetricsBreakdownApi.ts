import axios from "axios";
import {
  MetricsBreakdownGroupBy,
  MetricsBreakdownResponse,
  MetricsTimeRangeParams,
} from "@/models/systemMetrics";

type GetMetricsBreakdownApiParams = MetricsTimeRangeParams & {
  groupBy: MetricsBreakdownGroupBy;
  includeUsers?: boolean;
};

async function getMetricsBreakdownApi({
  groupBy,
  includeUsers,
  start,
  end,
}: GetMetricsBreakdownApiParams): Promise<MetricsBreakdownResponse> {
  const response = await axios.get("/system/metrics/breakdown", {
    params: {
      group_by: groupBy,
      include_users: includeUsers ? "true" : undefined,
      start,
      end,
    },
  });

  return response.data as MetricsBreakdownResponse;
}

export default getMetricsBreakdownApi;
