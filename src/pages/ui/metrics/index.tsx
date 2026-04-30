import getMetricsBreakdownApi from "@/api/metrics/getMetricsBreakdownApi";
import getMetricsSummaryApi from "@/api/metrics/getMetricsSummaryApi";
import getServiceMetricsApi from "@/api/metrics/getServiceMetricsApi";
import GenericTopbar from "@/components/Topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { alert } from "@/lib/alert";
import { errorMessage } from "@/lib/error";
import { shortenFullname } from "@/lib/utils";
import {
  BreakdownItem,
  MetricKey,
  MetricsBreakdownResponse,
  MetricsSummaryResponse,
  ServiceMetricValue,
  ServiceMetricsResponse,
} from "@/models/systemMetrics";
import OscarColors from "@/styles";
import { AxiosError } from "axios";
import {
  AlertCircle,
  Boxes,
  CalendarRange,
  Cpu,
  Globe2,
  LoaderPinwheel,
  Sparkles,
  Users,
  Waypoints,
} from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";
import useServicesContext from "@/pages/ui/services/context/ServicesContext";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocation } from "react-router-dom";

type RangePreset = "1m" | "1h" | "24h" | "7d" | "30d" | "custom";

type TimeRangeInput = {
  start: string;
  end: string;
};

type QueryRange = {
  start: Date;
  end: Date;
};

type KpiCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
};

type BreakdownChartCardProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
  hasData: boolean;
};

const SERVICE_BAR_COLORS = ["#009688", "#1F5FA6", "#D97706"];
const RANKING_BAR_COLOR = "#0F766E";
const COUNTRY_BAR_COLORS = ["#1F5FA6", "#009688", "#B8CEB8", "#D97706", "#0F172A"];

function buildPresetRange(preset: Exclude<RangePreset, "custom">): QueryRange {
  const end = new Date();
  const start = new Date(end);

  if (preset === "1m") start.setMinutes(start.getMinutes() - 1);
  if (preset === "1h") start.setHours(start.getHours() - 1);
  if (preset === "24h") start.setHours(start.getHours() - 24);
  if (preset === "7d") start.setDate(start.getDate() - 7);
  if (preset === "30d") start.setDate(start.getDate() - 30);

  return { start, end };
}

function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function queryRangeToInput(range: QueryRange): TimeRangeInput {
  return {
    start: toDateTimeLocalValue(range.start),
    end: toDateTimeLocalValue(range.end),
  };
}

function parseInputDate(value: string, boundary: "start" | "end"): Date {
  const date = new Date(value);

  if (boundary === "start") {
    date.setSeconds(0, 0);
  } else {
    date.setSeconds(59, 999);
  }

  return date;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatHours(value: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: value > 0 && value < 10 ? 1 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatUsers(value: string[]): string {
  if (value.length === 0) return "No users detected";
  if (value.length <= 4) return value.join(", ");
  return `${value.slice(0, 4).join(", ")} +${value.length - 4} more`;
}

function getSourceBadgeVariant(status: string) {
  if (status === "ok") return "success" as const;
  if (status === "missing") return "destructive" as const;
  return "secondary" as const;
}

function truncateLabel(label: string, maxLength = 24): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}

function sortByExecutions(items: BreakdownItem[]): BreakdownItem[] {
  return [...items].sort(
    (left, right) => (right.executions_count ?? 0) - (left.executions_count ?? 0),
  );
}

function sortByRequests(items: BreakdownItem[]): BreakdownItem[] {
  return [...items].sort(
    (left, right) =>
      (right.requests_count_total ?? right.executions_count ?? 0) -
      (left.requests_count_total ?? left.executions_count ?? 0),
  );
}

function getMetricValue(metrics: ServiceMetricValue[], key: MetricKey): number {
  return metrics.find((metric) => metric.metric === key)?.value ?? 0;
}

function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
      <AlertCircle className="mb-3 text-slate-400" size={32} />
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}

function KpiCard({ title, value, subtitle, icon }: KpiCardProps) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </CardContent>
    </Card>
  );
}

function BreakdownChartCard({
  title,
  description,
  emptyTitle,
  emptyDescription,
  children,
  hasData,
}: BreakdownChartCardProps) {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? children : <EmptyPanel title={emptyTitle} description={emptyDescription} />}
      </CardContent>
    </Card>
  );
}

function MetricsView() {
  const location = useLocation();
  const { authData } = useAuth();
  const { services } = useServicesContext();
  const initialRange = buildPresetRange("24h");

  const [selectedPreset, setSelectedPreset] = useState<RangePreset>("24h");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [filters, setFilters] = useState<TimeRangeInput>(queryRangeToInput(initialRange));
  const [appliedRange, setAppliedRange] = useState<QueryRange>(initialRange);

  const [summary, setSummary] = useState<MetricsSummaryResponse | null>(null);
  const [serviceBreakdown, setServiceBreakdown] = useState<MetricsBreakdownResponse | null>(null);
  const [countryBreakdown, setCountryBreakdown] = useState<MetricsBreakdownResponse | null>(null);
  const [userBreakdown, setUserBreakdown] = useState<MetricsBreakdownResponse | null>(null);
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetricsResponse | null>(null);

  const [selectedService, setSelectedService] = useState("");
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [metricsUnsupported, setMetricsUnsupported] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    document.title = "OSCAR - Metrics";
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setOverviewLoading(true);
      setOverviewError("");
      setMetricsUnsupported(false);

      try {
        const range = {
          start: appliedRange.start.toISOString(),
          end: appliedRange.end.toISOString(),
        };

        const [summaryResponse, serviceResponse, countryResponse, userResponse] =
          await Promise.all([
            getMetricsSummaryApi(range),
            getMetricsBreakdownApi({
              ...range,
              groupBy: "service",
              includeUsers: true,
            }),
            getMetricsBreakdownApi({
              ...range,
              groupBy: "country",
            }),
            getMetricsBreakdownApi({
              ...range,
              groupBy: "user",
            }),
          ]);

        if (cancelled) return;

        setSummary(summaryResponse);
        setServiceBreakdown(serviceResponse);
        setCountryBreakdown(countryResponse);
        setUserBreakdown(userResponse);

        setSelectedService((current) => {
          const nextService = serviceResponse.items.some((item) => item.key === current)
            ? current
            : serviceResponse.items[0]?.key ?? "";

          if (!nextService) {
            setServiceMetrics(null);
            setServiceError("");
          }

          return nextService;
        });
      } catch (error) {
        if (cancelled) return;

        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 404) {
          setMetricsUnsupported(true);
          setSummary(null);
          setServiceBreakdown(null);
          setCountryBreakdown(null);
          setUserBreakdown(null);
          setServiceMetrics(null);
          setSelectedService("");
        } else {
          setOverviewError(errorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setOverviewLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [appliedRange.end.getTime(), appliedRange.start.getTime(), refreshNonce]);

  useEffect(() => {
    if (!selectedService || metricsUnsupported) {
      setServiceMetrics(null);
      setServiceError("");
      return;
    }

    let cancelled = false;

    async function loadServiceMetrics() {
      setServiceLoading(true);
      setServiceError("");

      try {
        const response = await getServiceMetricsApi({
          serviceName: selectedService,
          start: appliedRange.start.toISOString(),
          end: appliedRange.end.toISOString(),
        });

        if (cancelled) return;
        setServiceMetrics(response);
      } catch (error) {
        if (cancelled) return;
        setServiceError(errorMessage(error));
      } finally {
        if (!cancelled) {
          setServiceLoading(false);
        }
      }
    }

    void loadServiceMetrics();

    return () => {
      cancelled = true;
    };
  }, [appliedRange.end.getTime(), appliedRange.start.getTime(), metricsUnsupported, refreshNonce, selectedService]);

  function refreshAll() {
    if (selectedPreset !== "custom") {
      const nextRange = buildPresetRange(selectedPreset);
      setAppliedRange(nextRange);
      setFilters(queryRangeToInput(nextRange));
      return;
    }

    setRefreshNonce((current) => current + 1);
  }

  function applyPreset(preset: RangePreset) {
    setSelectedPreset(preset);
    if (preset === "custom") {
      setShowCustomRange(true);
      return;
    }

    const nextRange = buildPresetRange(preset);
    setFilters(queryRangeToInput(nextRange));
    setAppliedRange(nextRange);
  }

  function applyFilters() {
    if (!filters.start || !filters.end) {
      alert.error("Start and end dates are required.");
      return;
    }

    const start = parseInputDate(filters.start, "start");
    const end = parseInputDate(filters.end, "end");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      alert.error("The selected date range is invalid.");
      return;
    }
    if (end <= start) {
      alert.error("The end date must be after the start date.");
      return;
    }

    if (
      appliedRange.start.getTime() === start.getTime() &&
      appliedRange.end.getTime() === end.getTime()
    ) {
      void refreshAll();
      return;
    }

    setAppliedRange({ start, end });
  }

  const serviceItems = serviceBreakdown ? sortByRequests(serviceBreakdown.items).slice(0, 8) : [];
  const countryItems = countryBreakdown ? sortByExecutions(countryBreakdown.items).slice(0, 8) : [];
  const userItems = userBreakdown ? sortByExecutions(userBreakdown.items).slice(0, 8) : [];
  const selectedServiceBreakdown = serviceBreakdown?.items.find((item) => item.key === selectedService) ?? null;

  const selectedServiceMetrics = serviceMetrics?.metrics ?? [];
  const userDisplayNamesBySub = useMemo(() => {
    const names = new Map<string, string>();

    if (authData.egiSession?.sub && authData.egiSession.name) {
      names.set(authData.egiSession.sub, shortenFullname(authData.egiSession.name));
    }

    services.forEach((service) => {
      const ownerName = service.labels?.owner_name;

      if (service.owner && ownerName) {
        names.set(service.owner, shortenFullname(ownerName.replace(/_/g, " ")));
      }
    });

    return names;
  }, [authData.egiSession?.name, authData.egiSession?.sub, services]);

  function getUserDisplayName(userId: string): string {
    if (!userId || userId === "unknown") return "Unknown";
    return userDisplayNamesBySub.get(userId) ?? userId;
  }

  const sourceStatuses = summary?.sources ?? [];
  const sourceNotes = sourceStatuses.filter((source) => source.notes);

  return (
    <div className="h-full w-full">
      <GenericTopbar
        defaultHeader={{ title: "Metrics", linkTo: location.pathname }}
        refresher={() => {
          void refreshAll();
        }}
        triggerRefresherAtLoad={false}
      />

      <div className="grid gap-6 px-6 pb-8 pt-6">
        <Card
          className="overflow-hidden border-none shadow-sm"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,150,136,0.12) 0%, rgba(31,95,166,0.10) 52%, rgba(255,255,255,1) 100%)",
          }}
        >
          <CardContent className="grid gap-6 p-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/90 text-slate-700" variant="secondary">
                  Observability
                </Badge>
                {(overviewLoading || serviceLoading) && (
                  <Badge variant="outline" className="border-slate-300 bg-white/70 text-slate-600">
                    Refreshing
                  </Badge>
                )}
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/85 p-3 text-slate-700 shadow-sm">
                  <Sparkles size={22} />
                </div>
                <div className="max-w-2xl space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    Metrics of your services
                  </h1>
                  <p className="text-sm leading-6 text-slate-600">
                    Aggregated CPU/GPU usage, request traffic and geographic reach for your active services.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/82 p-5 backdrop-blur">
              <div className="grid gap-4 md:grid-cols-[minmax(0,360px)_auto] md:items-end">
                <div className="flex max-w-[420px] items-end gap-2">
                  <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Preset
                  </p>
                  <Select value={selectedPreset} onValueChange={(value: RangePreset) => applyPreset(value)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">Last minute</SelectItem>
                      <SelectItem value="1h">Last hour</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  <div className="flex shrink-0 items-end">
                    <Button
                      className={`h-10 w-10 rounded-xl border transition-all ${
                        showCustomRange
                          ? "border-[#009688] bg-[#009688]/10 text-[#0f766e] hover:bg-[#009688]/15"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowCustomRange((current) => !current)}
                      tooltipLabel={showCustomRange ? "Hide custom range" : "Show custom range"}
                    >
                      <CalendarRange size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              {showCustomRange && (
                <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-[auto_auto_220px] xl:grid-cols-[auto_auto_220px_1fr] xl:items-end">
                  <Input
                    label="Start"
                    type="datetime-local"
                    value={filters.start}
                    onChange={(event) => {
                      setSelectedPreset("custom");
                      setFilters((current) => ({ ...current, start: event.target.value }));
                    }}
                  />

                  <Input
                    label="End"
                    type="datetime-local"
                    value={filters.end}
                    onChange={(event) => {
                      setSelectedPreset("custom");
                      setFilters((current) => ({ ...current, end: event.target.value }));
                    }}
                  />

                  <div className="grid gap-1">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-transparent select-none">
                      Action
                    </p>
                    <Button className="w-full" variant="mainGreen" onClick={applyFilters}>
                      Apply custom range
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>

        {metricsUnsupported && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="flex items-start gap-4 p-6">
              <AlertCircle className="mt-0.5 text-amber-600" size={24} />
              <div className="space-y-1">
                <p className="font-semibold text-amber-900">Metrics unavailable</p>
                <p className="text-sm text-amber-800">
                  This OSCAR cluster does not expose service activity metrics. The rest of the dashboard remains available.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!metricsUnsupported && overviewError && !summary && (
          <Card className="border-red-200 bg-red-50 shadow-sm">
            <CardContent className="flex items-start gap-4 p-6">
              <AlertCircle className="mt-0.5 text-red-600" size={24} />
              <div className="space-y-1">
                <p className="font-semibold text-red-900">Failed to load metrics</p>
                <p className="text-sm text-red-800">{overviewError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!metricsUnsupported && overviewError && summary && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="flex items-start gap-4 p-6">
              <AlertCircle className="mt-0.5 text-amber-600" size={24} />
              <div className="space-y-1">
                <p className="font-semibold text-amber-900">Latest refresh reported an issue</p>
                <p className="text-sm text-amber-800">
                  Showing the most recent successful dataset. Refresh error: {overviewError}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!metricsUnsupported && sourceNotes.length > 0 && summary && (
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="flex items-start gap-4 p-6">
              <AlertCircle className="mt-0.5 text-amber-600" size={24} />
              <div className="space-y-2">
                <p className="font-semibold text-amber-900">Some telemetry sources reported warnings</p>
                <div className="flex flex-wrap gap-2">
                  {sourceNotes.map((source) => (
                    <Badge
                      key={`${source.name}-${source.status}-${source.notes ?? ""}`}
                      variant={getSourceBadgeVariant(source.status)}
                    >
                      {source.name}: {source.status}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!metricsUnsupported && overviewLoading && !summary && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-xl" />
            ))}
          </div>
        )}

        {!metricsUnsupported && summary && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <KpiCard
                title="Active services"
                value={formatNumber(summary.totals.services_count_active)}
                subtitle={`${formatNumber(summary.totals.services_count_total)} of your services with recorded activity`}
                icon={<Boxes size={20} />}
              />
              <KpiCard
                title="CPU hours"
                value={formatHours(summary.totals.cpu_hours_total)}
                subtitle="Prometheus aggregated usage"
                icon={<Cpu size={20} />}
              />
              <KpiCard
                title="GPU hours"
                value={formatHours(summary.totals.gpu_hours_total)}
                subtitle="GPU time consumed in range"
                icon={<Sparkles size={20} />}
              />
              <KpiCard
                title="Total requests"
                value={formatNumber(summary.totals.requests_count_total)}
                subtitle={`${formatNumber(summary.totals.requests_count_sync)} sync · ${formatNumber(summary.totals.requests_count_async)} async against your services`}
                icon={<Waypoints size={20} />}
              />
              <KpiCard
                title="Exposed requests"
                value={formatNumber(summary.totals.requests_count_exposed)}
                subtitle="Ingress traffic reaching your exposed services"
                icon={<Globe2 size={20} />}
              />
              <KpiCard
                title="Distinct users"
                value={formatNumber(summary.totals.users_count)}
                subtitle={`${formatNumber(summary.totals.countries_count)} countries interacting with your services`}
                icon={<Users size={20} />}
              />
            </div>

            <div className="grid gap-6">
              <div className="grid gap-6">
                <Card className="border-slate-200/80 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Breakdowns</CardTitle>
                    <CardDescription>
                      Compare where traffic is going, who is calling your services and how activity is distributed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="services" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="services">Services</TabsTrigger>
                        <TabsTrigger value="countries">Countries</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                      </TabsList>

                      <TabsContent value="services">
                        <BreakdownChartCard
                          title="Service activity"
                          description="Your most active services ranked by request volume, split into sync, async and exposed traffic."
                          emptyTitle="No service activity in this range"
                          emptyDescription="Try expanding the time window or checking whether request logs are configured."
                          hasData={serviceItems.length > 0}
                        >
                          <div className="h-[420px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={serviceItems.map((item) => ({
                                  name: truncateLabel(item.key, 44),
                                  sync: item.requests_count_sync ?? 0,
                                  async: item.requests_count_async ?? 0,
                                  exposed: item.requests_count_exposed ?? 0,
                                  users: item.unique_users_count,
                                }))}
                                layout="vertical"
                                margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={300} />
                                <Tooltip
                                  formatter={(value: number, name: string) => [formatNumber(value), name]}
                                  labelFormatter={(label) => `Service: ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="sync" stackId="requests" name="Sync" fill={SERVICE_BAR_COLORS[0]} radius={[0, 4, 4, 0]} />
                                <Bar dataKey="async" stackId="requests" name="Async" fill={SERVICE_BAR_COLORS[1]} radius={[0, 4, 4, 0]} />
                                <Bar dataKey="exposed" stackId="requests" name="Exposed" fill={SERVICE_BAR_COLORS[2]} radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </BreakdownChartCard>
                      </TabsContent>

                      <TabsContent value="countries">
                        <BreakdownChartCard
                          title="Country reach"
                          description="Countries sorted by execution count, highlighting how broadly your services are being used."
                          emptyTitle="No country-level activity available"
                          emptyDescription="Country attribution depends on the request log source. Missing data usually means the source is not configured."
                          hasData={countryItems.length > 0}
                        >
                          <div className="h-[420px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={countryItems.map((item) => ({
                                  name: item.key === "unknown" ? "Unknown" : item.key,
                                  executions: item.executions_count ?? 0,
                                  users: item.unique_users_count,
                                }))}
                                layout="vertical"
                                margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={140} />
                                <Tooltip
                                  formatter={(value: number, name: string) => [formatNumber(value), name]}
                                  labelFormatter={(label) => `Country: ${label}`}
                                />
                                <Bar dataKey="executions" radius={[0, 4, 4, 0]}>
                                  {countryItems.map((item, index) => (
                                    <Cell
                                      key={`${item.key}-${index}`}
                                      fill={COUNTRY_BAR_COLORS[index % COUNTRY_BAR_COLORS.length]}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </BreakdownChartCard>
                      </TabsContent>

                      <TabsContent value="users">
                        <BreakdownChartCard
                          title="Most active users"
                          description="Users ordered by total executions against your services over the selected window."
                          emptyTitle="No user activity found"
                          emptyDescription="If there were requests in the selected range, verify the request logs include user identity."
                          hasData={userItems.length > 0}
                        >
                          <div className="h-[420px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={userItems.map((item) => ({
                                  name: truncateLabel(getUserDisplayName(item.key), 44),
                                  executions: item.executions_count ?? 0,
                                }))}
                                layout="vertical"
                                margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={300} />
                                <Tooltip
                                  formatter={(value: number, name: string) => [formatNumber(value), name]}
                                  labelFormatter={(label) => `User: ${label}`}
                                />
                                <Bar dataKey="executions" fill={RANKING_BAR_COLOR} radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </BreakdownChartCard>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6">
                <Card className="border-slate-200/80 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Selected service</CardTitle>
                    <CardDescription>
                      Drill into one of your services.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {serviceBreakdown && serviceBreakdown.items.length > 0 ? (
                      <>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Service
                          </p>
                          <Select value={selectedService} onValueChange={setSelectedService}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent>
                              {sortByRequests(serviceBreakdown.items).map((item) => (
                                <SelectItem key={item.key} value={item.key}>
                                  {item.key}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {serviceError && (
                          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                            {serviceError}
                          </div>
                        )}

                        {serviceLoading && !serviceMetrics ? (
                          <div className="grid gap-3">
                            {Array.from({ length: 4 }).map((_, index) => (
                              <Skeleton key={index} className="h-20 rounded-xl" />
                            ))}
                          </div>
                        ) : (
                          <>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">CPU hours</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">
                                  {formatHours(getMetricValue(selectedServiceMetrics, "cpu-hours"))}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">GPU hours</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">
                                  {formatHours(getMetricValue(selectedServiceMetrics, "gpu-hours"))}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Sync requests</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">
                                  {formatNumber(
                                    getMetricValue(
                                      selectedServiceMetrics,
                                      "requests-sync-per-service",
                                    ),
                                  )}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Async requests</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">
                                  {formatNumber(
                                    getMetricValue(
                                      selectedServiceMetrics,
                                      "requests-async-per-service",
                                    ),
                                  )}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Exposed requests</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">
                                  {formatNumber(
                                    getMetricValue(
                                      selectedServiceMetrics,
                                      "requests-exposed-per-service",
                                    ),
                                  )}
                                </p>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Distinct users</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">
                                  {formatNumber(
                                    getMetricValue(selectedServiceMetrics, "users-per-service"),
                                  )}
                                </p>
                              </div>
                            </div>

                            {selectedServiceBreakdown && (
                              <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-medium text-slate-900">
                                  Known users
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {formatUsers(
                                    (selectedServiceBreakdown.users ?? []).map(getUserDisplayName),
                                  )}
                                </p>

                                <div className="mt-4 grid gap-2">
                                  <p className="text-sm font-medium text-slate-900">
                                    Top countries
                                  </p>
                                  {selectedServiceBreakdown.countries.length > 0 ? (
                                    selectedServiceBreakdown.countries.slice(0, 4).map((country) => (
                                      <div
                                        key={`${selectedServiceBreakdown.key}-${country.country}`}
                                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                                      >
                                        <span className="text-slate-700">
                                          {country.country === "unknown" ? "Unknown" : country.country}
                                        </span>
                                        <span className="font-medium text-slate-900">
                                          {formatNumber(country.request_count)}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-slate-500">
                                      No country attribution for this service in the selected range.
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                          </>
                        )}
                      </>
                    ) : (
                      <EmptyPanel
                        title="No service activity in this range"
                        description="Service details appear once there is service-level activity in the selected time window."
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {!metricsUnsupported && (overviewLoading || serviceLoading) && summary && (
          <div className="fixed bottom-6 right-6 z-20 flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-lg">
            <LoaderPinwheel className="animate-spin" color={OscarColors.Green4} size={18} />
            <span className="text-sm text-slate-700">Refreshing metrics</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsView;
