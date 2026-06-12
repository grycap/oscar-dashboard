export type DeploymentState =
  | "pending"
  | "ready"
  | "degraded"
  | "failed"
  | "unavailable";

export type DeploymentResourceKind =
  | "exposed_service"
  | "knative_service"
  | "unavailable";

export interface DeploymentSummary {
  state: DeploymentState;
  reason?: string;
  last_transition_time?: string;
  active_instances: number;
  affected_instances: number;
  resource_kind: DeploymentResourceKind;
}

export interface DeploymentStatus extends DeploymentSummary {
  service_name: string;
  namespace?: string;
}

export interface DeploymentLogEntry {
  timestamp?: string;
  message: string;
}

export interface DeploymentLogStream {
  service_name: string;
  available: boolean;
  message?: string;
  entries: DeploymentLogEntry[];
}
