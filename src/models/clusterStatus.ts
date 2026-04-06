/**
 * ClusterStatus represents the overall status of the cluster, including resource metrics,
 * node details, MinIO storage statistics, and Oscar deployment information.
 */
export type ClusterStatus = {
  cluster: ClusterData;
  minio: MinioData;
  oscar: OscarData;
};

/**
 * ClusterData represents the resource metrics and node details of the cluster.
 */
type ClusterData = {
  metrics: ClusterMetrics;
  nodes: Node[];
  nodes_count: number;
};

/**
 * ClusterMetrics represents the overall resource metrics of the cluster.
 */
type ClusterMetrics = {
  cpu: {
    total_free_cores: number;
    max_free_on_node_cores: number;
  };
  memory: {
    total_free_bytes: number;
    max_free_on_node_bytes: number;
  };
  gpu: {
    total_gpu: number;
  };
};

/**
 * Node represents a single node in the cluster with its resource usage and status.
 */
type Node = {
  name: string;
  cpu: {
    capacity_cores: number;
    usage_cores: number;
  };
  memory: {
    capacity_bytes: number;
    usage_bytes: number;
  };
  gpu: number;
  is_interlink: boolean;
  status: string;
  conditions: {
    type: string;
    status: boolean;
  }[];
};

/**
 * OscarData represents the status and configuration of the Oscar deployment within the cluster.
 */
type OscarData = {
  deployment_name: string;
  ready: boolean;
  deployment: {
    available_replicas: number;
    ready_replicas: number;
    replicas: number;
    creation_timestamp: string;
    strategy: string;
    labels: {
      app: string;
      "app.kubernetes.io/managed-by": string;
    }
  };
  jobs_count: number;
  pods: {
    total: number;
    states: {
      Failed: number;
      Pending: number;
      Running: number;
      Succeeded: number;
      Unknown: number;
    };
  };
  oidc: {
    enabled: boolean;
    issuers: string[];
    groups: string[];
  }
};

/**
 * MinioData represents the status and statistics of the MinIO storage system within the cluster.
 */
type MinioData = {
  buckets_count: number;
  total_objects: number;
};