import { useEffect, useMemo, useState } from "react";
import useServicesContext from "../../context/ServicesContext";
import Log from "../../models/log";
import { getServiceLogsApi } from "@/api/logs/getServiceLogs";
import GenericTable from "@/components/Table";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Eye, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogDetailsPopover from "./components/LogDetailsPopover";

export type LogWithName = Log & { name: string };

export default function ServiceLogs() {
  const { formService } = useServicesContext();
  const [logs, setLogs] = useState<Record<string, Log>>({});
  const logsWithName = useMemo(
    () =>
      Object.entries(logs).map(([name, log]) => ({
        name,
        ...log,
      })) as LogWithName[],
    [logs]
  );

  const [selectedLog, setSelectedLog] = useState<LogWithName | null>(null);

  useEffect(() => {
    if (!formService?.name) return;

    getServiceLogsApi(formService.name).then(setLogs);
  }, [formService?.name]);

  function renderStatus(status: Log["status"]) {
    const variant: Record<Log["status"], BadgeProps["variant"]> = {
      Succeeded: "success",
      Failed: "destructive",
      Running: "default",
      Pending: "secondary",
    };
    return (
      <Badge variant={variant[status]}>
        {status === "Running" && (
          <Loader className="animate-spin h-3 w-3 mr-2" />
        )}
        {status}
      </Badge>
    );
  }

  function formatTimestamp(timestamp: string) {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const label = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);

    return (
      <span
        style={{
          fontFamily: "Geist Mono, sans-serif",
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <div className="flex flex-grow">
      <LogDetailsPopover
        log={selectedLog}
        serviceName={formService?.name}
        onClose={() => setSelectedLog(null)}
      />
      <GenericTable<LogWithName>
        data={logsWithName}
        columns={[
          { accessor: "name", header: "Name" },
          {
            header: "Status",
            accessor(item) {
              return renderStatus(item.status);
            },
          },
          {
            header: "Creation Time",
            accessor(item) {
              return formatTimestamp(item.creation_time);
            },
          },
          {
            header: "Start Time",
            accessor(item) {
              return formatTimestamp(item.start_time);
            },
          },
          {
            header: "Finish Time",
            accessor(item) {
              return formatTimestamp(item.finish_time);
            },
          },
        ]}
        idKey="name"
        actions={[
          {
            button(item) {
              return (
                <Button
                  variant="link"
                  size="sm"
                  tooltipLabel="View"
                  onClick={() => setSelectedLog(item)}
                >
                  <Eye />
                </Button>
              );
            },
          },
        ]}
      />
    </div>
  );
}
