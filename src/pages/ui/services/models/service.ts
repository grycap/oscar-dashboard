export type ServiceFilter = {
  value: string;
  type: ServiceFilterBy;
};

export enum ServiceFilterBy {
  Name = "Name",
  Type = "Type",
  Image = "Image",
  Owner = "Owner",
}

export enum ServiceOrderBy {
  NameAsc = "Name (asc)",
  NameDesc = "Name (desc)",
  CPUAsc = "CPU (asc)",
  CPUDesc = "CPU (desc)",
  MemoryAsc = "Memory (asc)",
  MemoryDesc = "Memory (desc)",
  ImageAsc = "Image (asc)",
  ImageDesc = "Image (desc)",
}

interface StorageProvider {
  id: {
    access_key: string;
    secret_key: string;
    region: string;
  };
}

interface MinioStorageProvider extends StorageProvider {
  id: {
    endpoint: string;
    region: string;
    secret_key: string;
    access_key: string;
    verify: boolean;
  };
}

interface OnedataStorageProvider {
  id: {
    oneprovider_host: string;
    token: string;
    space: string;
  };
}

interface WebdavStorageProvider {
  id: {
    hostname: string;
    login: string;
    password: string;
  };
}

interface Clusters {
  id: {
    endpoint: string;
    auth_user: string;
    auth_password: string;
    ssl_verify: boolean;
  };
}

interface StoragePath {
  storage_provider: string;
  path: string;
  suffix: string[];
  prefix: string[];
}

interface Replica {
  type: string;
  cluster_id: string;
  service_name: string;
  url: string;
  ssl_verify: boolean;
  priority: number;
  headers: Record<string, string>;
}

interface Synchronous {
  min_scale: number;
  max_scale: number;
}

interface StorageProviders {
  s3?: StorageProvider;
  minio?: MinioStorageProvider;
  onedata?: OnedataStorageProvider;
  webdav?: WebdavStorageProvider;
}

export interface Service {
  name: string;
  cluster_id: string;
  memory: string;
  cpu: string;
  enable_gpu: boolean;
  total_memory: string;
  total_cpu: string;
  synchronous: Synchronous;
  replicas: Replica[];
  rescheduler_threshold: string;
  token: string;
  log_level: string;
  image: string;
  alpine: boolean;
  script: string;
  image_pull_secrets: string[];
  environment: {
    Variables: Record<string, string>;
  };
  annotations: Record<string, string>;
  labels: Record<string, string>;
  input: StoragePath[];
  output: StoragePath[];
  storage_providers: StorageProviders;
  clusters: Clusters;
}

export enum ServiceTab {
  Settings = 0,
  Logs = 1,
}

export enum ServiceFormTab {
  General,
  Storage,
  "Input - Output",
}
