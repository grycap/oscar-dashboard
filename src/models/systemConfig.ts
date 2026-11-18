import { MinioStorageProvider } from "@/pages/ui/services/models/service";

export type SystemConfig = {
  minio_provider: MinioStorageProvider;
  name: string;
  namespace: string;
  gpu_available: boolean;
  serverless_backend: string;
  yunikorn_enable: boolean;
  interLink_available: boolean;
  oidc_groups: string[];
  exposed_services_use_subdomain_route?: boolean;
};

export type ClusterConfig = {
  config: SystemConfig;
  minio_provider?: MinioStorageProvider;
  allowed_image_repositories?: string[];
};

export type ClusterConfigUpdate = Partial<ClusterConfig>;
