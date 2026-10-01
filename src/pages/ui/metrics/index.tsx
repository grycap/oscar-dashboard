import getMetricsBreakdownApi from "@/api/metrics/getMetricsBreakdownApi";
import getMetricsSummaryApi from "@/api/metrics/getMetricsSummaryApi";
import getMetricsOwnersApi from "@/api/metrics/getMetricsOwnersApi";
import getServiceMetricsApi from "@/api/metrics/getServiceMetricsApi";
import GenericTopbar from "@/components/Topbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  MetricsOwner,
  MetricsSummaryResponse,
  ServiceMetricValue,
  ServiceMetricsResponse,
} from "@/models/systemMetrics";
import { AxiosError } from "axios";
import {
  AlertCircle,
  Boxes,
  Check,
  ChevronsUpDown,
  Cpu,
  Gpu,
  Globe2,
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

type ServiceAxisTickProps = {
  x?: number;
  y?: number;
  payload?: { value?: string };
  onSelect: (serviceName: string) => void;
};

type AxisTickProps = Omit<ServiceAxisTickProps, "onSelect">;

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
    <Card className="h-full">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-950">{value}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="text-slate-900">{icon}</div>
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
    <div>
      <div className="mb-4">
        <h4 className="font-semibold text-slate-950">{title}</h4>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {hasData ? children : <EmptyPanel title={emptyTitle} description={emptyDescription} />}
    </div>
  );
}

function ServiceAxisTick({ x = 0, y = 0, payload, onSelect }: ServiceAxisTickProps) {
  const serviceName = payload?.value ?? "";

  function selectService() {
    if (serviceName) onSelect(serviceName);
  }

  return (
    <text
      aria-label={`Show details for ${serviceName}`}
      className="cursor-pointer fill-slate-700 hover:fill-slate-950 hover:underline"
      dominantBaseline="central"
      onClick={selectService}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectService();
        }
      }}
      role="button"
      tabIndex={0}
      textAnchor="end"
      x={x}
      y={y}
    >
      {serviceName}
    </text>
  );
}

function FullAxisTick({ x = 0, y = 0, payload }: AxisTickProps) {
  const value = payload?.value ?? "";

  return (
    <text
      className="fill-slate-700"
      dominantBaseline="central"
      textAnchor="end"
      x={x}
      y={y}
    >
      {value}
    </text>
  );
}

function ServiceSearchSelect({
  items,
  value,
  onValueChange,
}: {
  items: BreakdownItem[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filteredItems = items.filter((item) =>
    item.key.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setSearch("");
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-full justify-between font-normal"
          role="combobox"
          variant="outline"
        >
          <span className="truncate">{value || "Select service"}</span>
          <ChevronsUpDown className="ml-2 shrink-0 opacity-50" size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
        <Input
          aria-label="Search services"
          autoFocus
          placeholder="Search service..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="mt-2 max-h-64 overflow-y-auto" role="listbox">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <button
                aria-selected={item.key === value}
                className="flex w-full items-center rounded-sm px-2 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                key={item.key}
                onClick={() => {
                  onValueChange(item.key);
                  handleOpenChange(false);
                }}
                role="option"
                type="button"
              >
                <Check
                  className={item.key === value ? "mr-2 opacity-100" : "mr-2 opacity-0"}
                  size={16}
                />
                <span className="truncate">{item.key}</span>
              </button>
            ))
          ) : (
            <p className="px-2 py-4 text-center text-sm text-slate-500">
              No services found.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function OwnerSearchSelect({
  owners,
  value,
  onValueChange,
}: {
  owners: MetricsOwner[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedOwner = owners.find((owner) => owner.id === value);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredOwners = owners.filter((owner) =>
    `${owner.name} ${owner.id}`.toLocaleLowerCase().includes(normalizedSearch),
  );

  function selectOwner(owner: string) {
    onValueChange(owner);
    setOpen(false);
    setSearch("");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="h-auto min-h-10 w-full justify-between whitespace-normal text-left font-normal"
          role="combobox"
          variant="outline"
        >
          <span className="break-all">{selectedOwner?.name ?? "All owners"}</span>
          <ChevronsUpDown className="ml-2 shrink-0 opacity-50" size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[360px] max-w-[90vw] p-2">
        <Input
          aria-label="Search owners"
          autoFocus
          placeholder="Search owner..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="mt-2 max-h-64 overflow-y-auto" role="listbox">
          {!normalizedSearch && (
            <button
              aria-selected={!value}
              className="flex w-full items-center rounded-sm px-2 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              onClick={() => selectOwner("")}
              role="option"
              type="button"
            >
              <Check className={!value ? "mr-2 opacity-100" : "mr-2 opacity-0"} size={16} />
              All owners
            </button>
          )}
          {filteredOwners.map((owner) => (
            <button
              aria-selected={owner.id === value}
              className="flex w-full items-center rounded-sm px-2 py-2 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              key={owner.id}
              onClick={() => selectOwner(owner.id)}
              role="option"
              type="button"
            >
              <Check
                className={owner.id === value ? "mr-2 opacity-100" : "mr-2 opacity-0"}
                size={16}
              />
              <span className="min-w-0">
                <span className="block break-all">{owner.name}</span>
                {owner.name !== owner.id && (
                  <span className="block break-all text-xs text-slate-500">{owner.id}</span>
                )}
              </span>
            </button>
          ))}
          {filteredOwners.length === 0 && normalizedSearch && (
            <p className="px-2 py-4 text-center text-sm text-slate-500">No owners found.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MetricsView() {
  const location = useLocation();
  const { authData } = useAuth();
  const { services } = useServicesContext();
  const initialRange = buildPresetRange("24h");

  const [selectedPreset, setSelectedPreset] = useState<RangePreset>("24h");
  const [filters, setFilters] = useState<TimeRangeInput>(queryRangeToInput(initialRange));
  const [appliedRange, setAppliedRange] = useState<QueryRange>(initialRange);

  const [summary, setSummary] = useState<MetricsSummaryResponse | null>(null);
  const [serviceBreakdown, setServiceBreakdown] = useState<MetricsBreakdownResponse | null>(null);
  const [countryBreakdown, setCountryBreakdown] = useState<MetricsBreakdownResponse | null>(null);
  const [userBreakdown, setUserBreakdown] = useState<MetricsBreakdownResponse | null>(null);
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetricsResponse | null>(null);

  const [selectedService, setSelectedService] = useState("");
  const [owners, setOwners] = useState<MetricsOwner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState("");
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
    getMetricsOwnersApi()
      .then((response) => {
        if (!cancelled) setOwners(response.owners);
      })
      .catch(() => {
        if (!cancelled) setOwners([]);
      });
    return () => {
      cancelled = true;
    };
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
          owner: selectedOwner || undefined,
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
  }, [appliedRange.end.getTime(), appliedRange.start.getTime(), refreshNonce, selectedOwner]);

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
          owner: selectedOwner || undefined,
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
  }, [appliedRange.end.getTime(), appliedRange.start.getTime(), metricsUnsupported, refreshNonce, selectedOwner, selectedService]);

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
  const serviceAxisWidth = Math.max(
    220,
    ...serviceItems.map((item) => item.key.length * 8 + 16),
  );
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

  const userChartItems = userItems.map((item) => ({
    name: getUserDisplayName(item.key),
    executions: item.executions_count ?? 0,
  }));
  const userAxisWidth = Math.max(
    220,
    ...userChartItems.map((item) => item.name.length * 9 + 24),
  );

  const sourceStatuses = summary?.sources ?? [];
  const sourceNotes = sourceStatuses.filter((source) => source.notes);

  const timeRangeControls = (
    <div
      className={`grid w-full gap-2 px-3 py-2 md:items-end ${
        owners.length > 0
          ? "md:grid-cols-[360px_170px_minmax(0,220px)_minmax(0,220px)_auto]"
          : "md:grid-cols-[170px_minmax(0,220px)_minmax(0,220px)_auto]"
      }`}
    >
      {owners.length > 0 && (
        <OwnerSearchSelect owners={owners} value={selectedOwner} onValueChange={setSelectedOwner} />
      )}
      <Select value={selectedPreset} onValueChange={(value: RangePreset) => applyPreset(value)}>
        <SelectTrigger>
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

      {selectedPreset === "custom" && (
        <>
          <Input
            aria-label="Start date"
            label="Start"
            type="datetime-local"
            value={filters.start}
            onChange={(event) =>
              setFilters((current) => ({ ...current, start: event.target.value }))
            }
          />
          <Input
            aria-label="End date"
            label="End"
            type="datetime-local"
            value={filters.end}
            onChange={(event) =>
              setFilters((current) => ({ ...current, end: event.target.value }))
            }
          />
          <Button variant="mainGreen" onClick={applyFilters}>
            Apply
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col">
      <GenericTopbar
        defaultHeader={{ title: "Metrics", linkTo: location.pathname }}
        refresher={() => {
          void refreshAll();
        }}
        secondaryRow={timeRangeControls}
        triggerRefresherAtLoad={false}
      />

      <div className="w-full space-y-6 px-4 pb-6 pt-6">

        {metricsUnsupported && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle />
            <AlertTitle>Metrics unavailable</AlertTitle>
            <AlertDescription>
              This cluster does not provide service activity metrics.
            </AlertDescription>
          </Alert>
        )}

        {!metricsUnsupported && overviewError && !summary && (
          <Alert variant="destructive" className="bg-red-50">
            <AlertCircle />
            <AlertTitle>Failed to load metrics</AlertTitle>
            <AlertDescription>{overviewError}</AlertDescription>
          </Alert>
        )}

        {!metricsUnsupported && overviewError && summary && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle />
            <AlertTitle>Refresh failed</AlertTitle>
            <AlertDescription>
              Showing the last available data. {overviewError}
            </AlertDescription>
          </Alert>
        )}

        {!metricsUnsupported && sourceNotes.length > 0 && summary && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertCircle />
            <AlertTitle>Some metric sources reported warnings</AlertTitle>
            <AlertDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                {sourceNotes.map((source) => (
                  <Badge
                    key={`${source.name}-${source.status}-${source.notes ?? ""}`}
                    variant={getSourceBadgeVariant(source.status)}
                  >
                    {source.name}: {source.status}
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <KpiCard
                title="Active services"
                value={formatNumber(summary.totals.services_count_active)}
                subtitle={`${formatNumber(summary.totals.services_count_total)} services with recorded activity`}
                icon={<Boxes size={18} />}
              />
              <KpiCard
                title="CPU hours"
                value={formatHours(summary.totals.cpu_hours_total)}
                subtitle="Selected period"
                icon={<Cpu size={18} />}
              />
              <KpiCard
                title="GPU hours"
                value={formatHours(summary.totals.gpu_hours_total)}
                subtitle="Selected period"
                icon={<Gpu size={18} />}
              />
              <KpiCard
                title="Total requests"
                value={formatNumber(summary.totals.requests_count_total)}
                subtitle={`${formatNumber(summary.totals.requests_count_sync)} sync · ${formatNumber(summary.totals.requests_count_async)} async`}
                icon={<Waypoints size={18} />}
              />
              <KpiCard
                title="Exposed requests"
                value={formatNumber(summary.totals.requests_count_exposed)}
                subtitle="Requests received through ingress"
                icon={<Globe2 size={18} />}
              />
              <KpiCard
                title="Distinct users"
                value={formatNumber(summary.totals.users_count)}
                subtitle={`From ${formatNumber(summary.totals.countries_count)} countries`}
                icon={<Users size={18} />}
              />
            </div>

            <div className="grid gap-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Activity breakdown</CardTitle>
                    <CardDescription>
                      Requests grouped by service, country or user.
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
                          description="Requests by service and invocation type."
                          emptyTitle="No service activity in this range"
                          emptyDescription="Choose a longer period or check the metrics configuration."
                          hasData={serviceItems.length > 0}
                        >
                          <div className="h-[360px] overflow-x-auto">
                            <div className="h-full w-full" style={{ minWidth: serviceAxisWidth + 520 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={serviceItems.map((item) => ({
                                  name: item.key,
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
                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  tick={<ServiceAxisTick onSelect={setSelectedService} />}
                                  width={serviceAxisWidth}
                                />
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
                          </div>
                        </BreakdownChartCard>
                      </TabsContent>

                      <TabsContent value="countries">
                        <BreakdownChartCard
                          title="Country reach"
                          description="Requests by country."
                          emptyTitle="No country-level activity available"
                          emptyDescription="Country data is unavailable for this period."
                          hasData={countryItems.length > 0}
                        >
                          <div className="h-[360px]">
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
                          description="Requests by user."
                          emptyTitle="No user activity found"
                          emptyDescription="User data is unavailable for this period."
                          hasData={userItems.length > 0}
                        >
                          <div className="h-[360px] overflow-x-auto">
                            <div className="h-full w-full" style={{ minWidth: userAxisWidth + 520 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={userChartItems}
                                  layout="vertical"
                                  margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                  <XAxis type="number" allowDecimals={false} />
                                  <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={<FullAxisTick />}
                                    width={userAxisWidth}
                                  />
                                  <Tooltip
                                    formatter={(value: number, name: string) => [formatNumber(value), name]}
                                    labelFormatter={(label) => `User: ${label}`}
                                  />
                                  <Bar dataKey="executions" fill={RANKING_BAR_COLOR} radius={[0, 4, 4, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </BreakdownChartCard>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">Service details</CardTitle>
                    <CardDescription>
                      Metrics for one service in the selected period.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    {serviceBreakdown && serviceBreakdown.items.length > 0 ? (
                      <>
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Service
                          </p>
                          <ServiceSearchSelect
                            items={sortByRequests(serviceBreakdown.items)}
                            value={selectedService}
                            onValueChange={setSelectedService}
                          />
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

      </div>
    </div>
  );
}

export default MetricsView;
