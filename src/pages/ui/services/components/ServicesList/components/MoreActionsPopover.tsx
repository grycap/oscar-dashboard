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
import { MoreVertical, Activity, Play, Key, Edit, Trash } from "lucide-react";
import OscarColors from "@/styles";

interface Props {
  service: Service;
  handleDeleteService: () => void;
  handleEditService: () => void;
  handleInvokeService: () => void;
  handleLogs: () => void;
}

export default function MoreActionsPopover({
  service,
  handleDeleteService,
  handleEditService,
  handleInvokeService,
  handleLogs,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild title="More actions">
        <Button variant={"link"} size="icon" tooltipLabel="Edit">
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
            <span className="text-xs text-muted-foreground">
              Manage service jobs
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleInvokeService}>
          <Play className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Invoke</span>
            <span className="text-xs text-muted-foreground">
              Select files and run the function
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Key className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>Token</span>
            <span className="text-xs text-muted-foreground">Copy token</span>
          </div>
          <kbd className="ml-auto text-xs text-muted-foreground">⌘C</kbd>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEditService}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit service</span>
          <kbd className="ml-auto text-xs text-muted-foreground">⌘E</kbd>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          style={{ color: OscarColors.Red }}
          onClick={handleDeleteService}
        >
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete service</span>
          <kbd className="ml-auto text-xs text-muted-foreground">⌘D</kbd>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
