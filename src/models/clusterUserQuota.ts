export type ClusterUserQuota = {
  user_id?: string;
  cluster_queue?: string;
  resources?: Resources;
  volumes?: VolumeQuota;
};

type Resources = {
  cpu: ResourceDetail;
  memory: ResourceDetail;
};

type ResourceDetail = {
  max: number;
  used: number;
};

export type VolumeQuota = {
  disk: VolumeQuotaDetail;
  volumes: VolumeQuotaDetail;
  max_disk_per_volume: string;
  min_disk_per_volume: string;
};

type VolumeQuotaDetail = {
  max: string;
  used: string;
};

export type QuotaUpdateRequest = {
  cpu?: string;
  memory?: string;
  volumes?: VolumeQuotaUpdate;
};

type VolumeQuotaUpdate = {
  disk?: string;
  volumes?: string;
  max_disk_per_volume?: string;
  min_disk_per_volume?: string;
};
