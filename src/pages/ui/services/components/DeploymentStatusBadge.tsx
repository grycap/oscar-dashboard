import { Badge, BadgeProps } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  OctagonAlert,
  XCircle,
} from "lucide-react";
import {
  DeploymentResourceKind,
  DeploymentState,
  DeploymentSummary,
} from "../models/deployment";

type DeploymentWithSummary = Partial<DeploymentSummary> | null | undefined;

const DEPLOYMENT_STATE_ORDER: Record<DeploymentState, number> = {
  failed: 0,
  degraded: 1,
  pending: 2,
  unavailable: 3,
  ready: 4,
};

export function getDeploymentStatusMeta(
  state: DeploymentState
): { label: string; variant: BadgeProps["variant"]; icon: JSX.Element } {
  switch (state) {
    case "ready":
      return {
        label: "Ready",
        variant: "success",
        icon: <CheckCircle2 className="mr-1 h-3.5 w-3.5" />,
      };
    case "pending":
      return {
        label: "Pending",
        variant: "secondary",
        icon: <Clock3 className="mr-1 h-3.5 w-3.5" />,
      };
    case "degraded":
      return {
        label: "Degraded",
        variant: "default",
        icon: <AlertCircle className="mr-1 h-3.5 w-3.5" />,
      };
    case "failed":
      return {
        label: "Failed",
        variant: "destructive",
        icon: <XCircle className="mr-1 h-3.5 w-3.5" />,
      };
    case "unavailable":
    default:
      return {
        label: "Unavailable",
        variant: "outline",
        icon: <OctagonAlert className="mr-1 h-3.5 w-3.5" />,
      };
  }
}

export function formatDeploymentResourceKind(kind?: DeploymentResourceKind) {
  switch (kind) {
    case "exposed_service":
      return "Exposed service";
    case "knative_service":
      return "Knative service";
    case "unavailable":
    default:
      return "Unavailable";
  }
}

function getTooltipContent(deployment?: DeploymentWithSummary) {
  if (!deployment) {
    return "Deployment status not available.";
  }

  const reason = deployment.reason || "No additional reason provided.";
  const instances = `${deployment.active_instances ?? 0} active, ${deployment.affected_instances ?? 0} affected`;
  const runtime = formatDeploymentResourceKind(deployment.resource_kind);

  return (
    <div className="max-w-xs space-y-1">
      <p>{reason}</p>
      <p>{instances}</p>
      <p>{runtime}</p>
    </div>
  );
}

interface Props {
  deployment?: DeploymentWithSummary;
  className?: string;
  showTooltip?: boolean;
}

export default function DeploymentStatusBadge({
  deployment,
  className,
  showTooltip = false,
}: Props) {
  const meta = getDeploymentStatusMeta(deployment?.state ?? "unavailable");

  const badge = (
    <Badge variant={meta.variant} className={className}>
      {meta.icon}
      {meta.label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">{badge}</div>
        </TooltipTrigger>
        <TooltipContent>{getTooltipContent(deployment)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
