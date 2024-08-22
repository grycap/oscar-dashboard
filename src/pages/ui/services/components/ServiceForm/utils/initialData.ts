import { Service } from "../../../models/service";

export const defaultService: Service = {
  name: "",
  cluster_id: "",
  memory: "256Mi",
  cpu: "0",
  enable_gpu: false,
  total_memory: "0",
  total_cpu: "0",
  synchronous: {
    min_scale: 0,
    max_scale: 0,
  },
  replicas: [],
  rescheduler_threshold: "",
  token: "",
  log_level: "",
  image: "",
  alpine: false,
  script: "",
  image_pull_secrets: [],
  environment: {
    Variables: {},
  },
  annotations: {},
  labels: {},
  input: [],
  output: [],
  storage_providers: {
    s3: undefined,
    minio: undefined,
    onedata: undefined,
    webdav: undefined,
  },
  clusters: {
    id: {
      endpoint: "",
      auth_user: "",
      auth_password: "",
      ssl_verify: false,
    },
  },
};