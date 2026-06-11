import { Service } from "../../../models/service";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { alert } from "@/lib/alert";
import { MoreVertical, Activity, Play, Key, Edit, Trash, RefreshCw, Square } from "lucide-react";
import OscarColors from "@/styles";
import { ServiceLifecycleAction } from "@/api/services/lifecycleServiceApi";

interface Props {
  service: Service;
  handleDeleteService: () => void;
  handleEditService: () => void;
  handleInvokeService: () => void;
  handleLogs: () => void;
  handleLifecycleService: (action: ServiceLifecycleAction) => void;
  lifecycleIsLoading?: boolean;
}

export default function MoreActionsPopover({
  service,
  handleDeleteService,
  handleEditService,
  handleInvokeService,
  handleLogs,
  handleLifecycleService,
  lifecycleIsLoading = false,
}: Props) {
  const isExposedService = service.expose?.api_port?.length > 0 || service.expose?.nodePort?.length > 0;
  const isStopped = service.deployment?.state === "stopped";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild title="More actions">
        <Button variant={"link"} size="icon" tooltipLabel="More Actions">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-normal text-muted-foreground">
              {service.name}
            </span>
            <span className="font-semibold">Service options</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogs}>
          <Activity className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Logs</span>            
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleInvokeService}>
          <Play className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Invoke</span>            
          </div>
        </DropdownMenuItem>
        {isExposedService && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={lifecycleIsLoading}
              onClick={() => handleLifecycleService(isStopped ? "start" : "stop")}
            >
              {isStopped ? (
                <Play className="mr-2 h-4 w-4" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              <span>{isStopped ? "Start" : "Stop"}</span>
            </DropdownMenuItem>
            {!isStopped && 
              <DropdownMenuItem
                disabled={lifecycleIsLoading}
                onClick={() => handleLifecycleService("restart")}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Restart</span>
              </DropdownMenuItem>
            }
          </>
        )}
        <DropdownMenuItem 
          onClick={() => {
            navigator.clipboard.writeText(service?.token || "");
            alert.success("Token copied to clipboard");
          }}
        >
          <Key className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Copy Token</span>          
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEditService}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          style={{ color: OscarColors.Red }}
          onClick={handleDeleteService}
        >
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
