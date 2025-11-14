import { useEffect, useMemo, useState } from "react";
import useServicesContext from "../../context/ServicesContext";
import Log from "../../models/log";
import { getServiceLogsApi } from "@/api/logs/getServiceLogs";
import GenericTable from "@/components/Table";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Eye,  Loader,  Trash2, Plus, LoaderPinwheel } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogDetailsPopover from "./components/LogDetailsPopover";
import DeleteDialog from "@/components/DeleteDialog";
import { deleteLogApi } from "@/api/logs/deleteLog";
import { alert } from "@/lib/alert";
import deleteServiceLogsApi from "@/api/logs/deleteServiceLogs";
import OscarColors from "@/styles";
import { delay } from "@/lib/utils";


export type LogWithName = Log & { name: string };

export default function ServiceLogs() {
  const { formService, serviceLogs, refreshServiceLogs, logsAreLoading } = useServicesContext();
  const [logs, setLogs] = useState<Record<string, Log>>({});
  const [next, setNext] = useState<string | null>(null);
  const [nextExecution, setNextExecution] = useState<boolean>(false);
  const logsWithName = useMemo(
    () =>
      Object.entries(logs).map(([name, log]) => ({
        name,
        ...log,
      })) as LogWithName[],
    [logs]
  );

  const [selectedLog, setSelectedLog] = useState<LogWithName | null>(null);
  const [logsToDelete, setLogsToDelete] = useState<LogWithName[]>([]);

  async function fetchMoreLogs() {
    if (!((next || next === null) && !logsAreLoading && nextExecution === true)) return;
    try {
      const data =  await getServiceLogsApi(formService.name, next as string | "");
      
      const serviceLogs = data.jobs ;
      setLogs(prevLogs => ({ ...prevLogs, ...serviceLogs }));

      // Small delay to show loading spinner
      await delay(200);

      const newNext = data.next_page ? JSON.stringify(data.next_page).replace(/^"|"$/g, "") : "";
      setNext(newNext);
    } catch (error) {
      console.error("Failed to fetch more logs:", error);
      setLogs({});
    } finally {
      setNextExecution(false);
    }
  }

  useEffect(() => {
    fetchMoreLogs();
  }, [next, formService?.name, nextExecution]);

  // Fetch logs when the service name is set/changed
  useEffect(() => {
    refreshServiceLogs();
  }, [formService?.name]);

  // Update logs state when serviceLogs from context is set/changes
  useEffect(() => {
    if (serviceLogs.jobs && Object.keys(serviceLogs.jobs).length > 0) {
      setLogs(serviceLogs.jobs);
    }
    serviceLogs.next_page && setNext(serviceLogs.next_page);
  }, [serviceLogs]);

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

  async function handleDeleteLogs() {
    if (!formService?.name) return;

    const failedLogs: string[] = [];
    const deletedLogs: string[] = [];

    try {
      const promises = logsToDelete.map((log) =>
        deleteLogApi(formService.name, log.name)
          .then(() => deletedLogs.push(log.name))
          .catch(() => failedLogs.push(log.name))
      );

      await Promise.all(promises);

      if (deletedLogs.length === 1) {
        alert.success(`The log "${deletedLogs[0]}" was deleted successfully!`);
      } else if (failedLogs.length === logsToDelete.length) {
        console.error("All logs failed to delete");
        alert.error("Failed to delete all logs. Please try again later.");
      } else if (deletedLogs.length === logsToDelete.length) {
        alert.success("All logs were deleted successfully!");
      } else {
        alert.error(
          `Failed to delete the following logs: ${failedLogs.join(", ")}`
        );
      }

      fetchMoreLogs();
    } catch (error) {
      alert.error("An unexpected error occurred while deleting logs");
    } finally {
      setLogsToDelete([]);
    }
  }

  const [deleteAllLogs, setDeleteAllLogs] = useState(false);

  function handleDeleteAllLogs() {
    deleteServiceLogsApi(formService?.name)
      .then(() => {
        alert.success("Service logs were deleted successfully!");
        refreshServiceLogs();
      })
      .catch(() => {
        alert.error("Failed to delete service logs.");
      })
      .finally(() => {
        setDeleteAllLogs(false);
      });
  }
  return (
    <div className="flex flex-grow relative" style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexBasis: 0,
        overflow: "hidden",
      }}>

      {logsAreLoading ?
        <div className="absolute inset-0 flex items-center justify-center items-center  ">
          <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
        </div>
      :
      <>
      {nextExecution && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50 backdrop-blur-xs">
          <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
        </div>
      )}

      <LogDetailsPopover
        log={selectedLog}
        serviceName={formService?.name}
        onClose={() => setSelectedLog(null)}
      />
      <DeleteDialog
        isOpen={deleteAllLogs}
        onClose={() => setDeleteAllLogs(false)}
        onDelete={handleDeleteAllLogs}
        itemNames={[`All service logs (${logsWithName.length})`]}
      />
      <DeleteDialog
        isOpen={logsToDelete.length > 0}
        onClose={() => setLogsToDelete([])}
        onDelete={handleDeleteLogs}
        itemNames={logsToDelete.map((log) => log.name)}
      />
      
        
      <GenericTable<LogWithName>
        data={logsWithName}
        columns={[
          { accessor: "name", header: "Name", sortBy: "name"},
          {
            header: "Status",
            accessor(item) {
              return item.status,renderStatus(item.status);
            },
            sortBy: "status"

          },
          {
            header: "Creation Time",
            accessor(item) {
              return item.creation_time, formatTimestamp(item.creation_time);
            },
            sortBy: "creation_time"
          },
          {
            header: "Start Time",
            accessor(item) {
              return formatTimestamp(item.start_time);
            },
            sortBy: "start_time"
          },
          {
            header: "Finish Time",
            accessor(item) {
              return formatTimestamp(item.finish_time);
            },
            sortBy: "finish_time"
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
          {
            button(item) {
              return (
                <Button
                  variant="link"
                  size="sm"
                  tooltipLabel="Delete"
                  className="text-red-500"
                  onClick={() => setLogsToDelete([...logsToDelete, item])}
                >
                  <Trash2 />
                </Button>
              );
            },
          },
        ]}
        bulkActions={[
          {
            button: (items) => (
              <Button
                variant="destructive"
                onClick={() => setLogsToDelete(items)}
              >
                <Trash2 className="h-5 w-5 mr-2"></Trash2> Delete selected logs
                ({items.length})
              </Button>
            ),
          },
          {
            button: () => (
              <Button
                variant="destructive"
                onClick={() => setDeleteAllLogs(true)}
              >
                <Trash2 className="h-5 w-5 mr-2"></Trash2> Delete all logs
              </Button>
            ),
          },
        ]}
        globalActions={[
        {
            button: () => (
              <>
              {(next != "" && next !== null) ?
                <Button
                  variant="mainGreen"
                  onClick={() => setNextExecution(true)}
                >
                  <Plus className="h-5 w-5 mr-2"></Plus> More Logs
                </Button>
              :<></>
              }
              </>
            ),
            
          }, 
        ]}
      />
      </>
      }
    </div>
  );
}
