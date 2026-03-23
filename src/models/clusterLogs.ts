export interface ClusterLog {
  timestamp: string;
  status: number;
  latency: string;
  client_ip: string;
  method: string;
  path: string;
  user: string;
  raw: string;
}