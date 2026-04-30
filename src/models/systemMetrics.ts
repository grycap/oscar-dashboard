export type MetricKey =
  | "services-count"
  | "cpu-hours"
  | "gpu-hours"
  | "requests-sync-per-service"
  | "requests-async-per-service"
  | "requests-exposed-per-service"
  | "requests-per-user"
  | "users-per-service"
  | "countries-count"
  | "countries-list";

export type MetricsBreakdownGroupBy = "service" | "user" | "country";

export type SourceStatus = {
  name: string;
  status: string;
  last_updated?: string;
  notes?: string;
};

export type MetricValueResponse = {
  service_id: string;
  metric: MetricKey;
  start: string;
  end: string;
  value: number;
  unit?: string;
  sources: SourceStatus[];
};

export type ServiceMetricValue = {
  metric: MetricKey;
  value: number;
  unit?: string;
  sources: SourceStatus[];
};

export type ServiceMetricsResponse = {
  service_name: string;
  start: string;
  end: string;
  metrics: ServiceMetricValue[];
};

export type CountryCount = {
  country: string;
  request_count: number;
};

export type SummaryTotals = {
  services_count_active: number;
  services_count_total: number;
  cpu_hours_total: number;
  gpu_hours_total: number;
  requests_count_total: number;
  requests_count_sync: number;
  requests_count_async: number;
  requests_count_exposed: number;
  countries_count: number;
  countries: CountryCount[];
  users_count: number;
  users: string[];
};

export type MetricsSummaryResponse = {
  start: string;
  end: string;
  totals: SummaryTotals;
  sources: SourceStatus[];
};

export type BreakdownItem = {
  key: string;
  membership?: string;
  executions_count?: number;
  requests_count_total?: number;
  requests_count_sync?: number;
  requests_count_async?: number;
  requests_count_exposed?: number;
  unique_users_count: number;
  users?: string[];
  countries: CountryCount[];
};

export type MetricsBreakdownResponse = {
  start: string;
  end: string;
  group_by: MetricsBreakdownGroupBy;
  items: BreakdownItem[];
};

export type MetricsTimeRangeParams = {
  start?: string;
  end?: string;
};

