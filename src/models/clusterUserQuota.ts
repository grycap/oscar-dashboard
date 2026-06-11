export type ClusterUserQuota = {
  user_id?: string;
  cluster_queue?: string;
  resources?: Resources;
  volumes?: VolumeQuota;
  minio?: MinioQuota;
};


type Resources = {
  cpu: ResourceDetail;
  memory: ResourceDetail;
  gpu: ResourceDetail;
  ephemeralStorage: ResourceDetail;
};

type ResourceDetail = {
  max: number;
  used: number;
};

export type MinioQuota = {
  buckets: MinioQuotaDetail;
  storage_per_bucket: MinioQuotaStorageDetail;
  storage_total: MinioQuotaStorageUsed;
};

type MinioQuotaDetail = {
  max: number;
  used: number;
};

type MinioQuotaStorageDetail = {
  max: string;
};

type MinioQuotaStorageUsed = {
  used: string;
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
  gpu?: string;
  ephemeralStorage?: string;
  volumes?: VolumeQuotaUpdate;
  minio?: MinioQuotaUpdate;
};

type VolumeQuotaUpdate = {
  disk?: string;
  volumes?: string;
  max_disk_per_volume?: string;
  min_disk_per_volume?: string;
};

type MinioQuotaUpdate = {
  buckets?: string;
  storage_per_bucket?: string;
};
