import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Editor } from "@monaco-editor/react";
import { AlertCircle, Loader2, RefreshCcw, XCircle } from "lucide-react";
import getDeploymentStatusApi from "@/api/deployment/getDeploymentStatusApi";
import getDeploymentLogsApi from "@/api/deployment/getDeploymentLogsApi";
import { alert } from "@/lib/alert";
import { errorMessage } from "@/lib/error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DeploymentLogStream,
  DeploymentStatus,
} from "../../models/deployment";
import DeploymentStatusBadge, {
  formatDeploymentResourceKind,
} from "../DeploymentStatusBadge";

const TAIL_LINE_OPTIONS = ["100", "200", "500", "1000"];

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm text-slate-900">{value}</p>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function LogsSkeleton() {
  return (
    <Card className="flex min-h-[420px] flex-col">
      <CardHeader>
        <Skeleton className="h-7 w-48" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[320px] w-full" />
      </CardContent>
    </Card>
  );
}

export default function ServiceDeployment() {
  const { serviceId } = useParams();
  const [deploymentStatus, setDeploymentStatus] =
    useState<DeploymentStatus | null>(null);
  const [deploymentLogs, setDeploymentLogs] =
    useState<DeploymentLogStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [tailLines, setTailLines] = useState("200");

  const serviceName = serviceId ?? "";

  async function refreshDeployment() {
    if (!serviceName) return;

    setIsRefreshing(true);
    try {
      const [status, logs] = await Promise.all([
        getDeploymentStatusApi(serviceName),
        getDeploymentLogsApi(serviceName, {
          timestamps: includeTimestamps,
          tailLines: Number(tailLines),
        }),
      ]);

      setDeploymentStatus(status);
      setDeploymentLogs(logs);
    } catch (error) {
      console.error("Failed to fetch deployment visibility:", error);
      alert.error(`Failed to fetch deployment visibility: ${errorMessage(error)}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    refreshDeployment();
  }, [serviceName, includeTimestamps, tailLines]);

  const logsContent = useMemo(() => {
    if (!deploymentLogs?.available) return "";

    return deploymentLogs.entries
      .map((entry) =>
        entry.timestamp ? `${entry.timestamp} ${entry.message}` : entry.message
      )
      .join("\n");
  }, [deploymentLogs]);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Deployment visibility
          </h2>
          <p className="text-sm text-slate-500">
            Inspect the current deployment state and the latest deployment logs
            for this service.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="deployment-timestamps">Timestamps</Label>
            <Switch
              id="deployment-timestamps"
              checked={includeTimestamps}
              onCheckedChange={setIncludeTimestamps}
            />
          </div>

          <div className="flex items-center gap-2">
            <Label>Tail lines</Label>
            <Select value={tailLines} onValueChange={setTailLines}>
              <SelectTrigger className="w-[110px]">
                <SelectValue placeholder="Tail lines" />
              </SelectTrigger>
              <SelectContent>
                {TAIL_LINE_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={refreshDeployment}
            disabled={isRefreshing || !serviceName}
          >
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <>
          <SummarySkeleton />
          <LogsSkeleton />
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Current deployment status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {deploymentStatus ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <DeploymentStatusBadge
                      deployment={deploymentStatus}
                      className="text-sm"
                    />
                    <span className="text-sm text-slate-500">
                      Runtime: {formatDeploymentResourceKind(deploymentStatus.resource_kind)}
                    </span>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Status reason</AlertTitle>
                    <AlertDescription>
                      {deploymentStatus.reason || "No additional reason provided."}
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Field
                      label="Service"
                      value={deploymentStatus.service_name}
                    />
                    <Field
                      label="Namespace"
                      value={deploymentStatus.namespace || "Not available"}
                    />
                    <Field
                      label="Active instances"
                      value={deploymentStatus.active_instances}
                    />
                    <Field
                      label="Affected instances"
                      value={deploymentStatus.affected_instances}
                    />
                    <Field
                      label="Last transition"
                      value={formatTimestamp(
                        deploymentStatus.last_transition_time
                      )}
                    />
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Status unavailable</AlertTitle>
                  <AlertDescription>
                    The deployment status could not be loaded for this service.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="flex min-h-[420px] flex-col">
            <CardHeader>
              <CardTitle>Deployment logs</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              {deploymentLogs?.message && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Log stream message</AlertTitle>
                  <AlertDescription>{deploymentLogs.message}</AlertDescription>
                </Alert>
              )}

              {!deploymentLogs?.available ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  {deploymentLogs?.message ||
                    "Deployment logs are not available for this service."}
                </div>
              ) : (
                <div className="relative flex-1 overflow-hidden rounded-lg border border-slate-200">
                  {isRefreshing && (
                    <div className="absolute right-3 top-3 z-10 rounded-md bg-white/90 px-2 py-1 text-xs text-slate-500 shadow-sm">
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Refreshing
                      </span>
                    </div>
                  )}
                  <Editor
                    height="100%"
                    defaultLanguage="shell"
                    value={logsContent}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                      fontSize: 13,
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
