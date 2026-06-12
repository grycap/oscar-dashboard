import ResponsiveOwnerField from "@/components/ResponsiveOwnerField";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClusterUserQuota } from "@/models/clusterUserQuota";
import { Box, Cpu, Database, GpuIcon, HardDrive, Layers, MemoryStick, Pencil } from "lucide-react";
import QuotaMetricCard from "../QuotaMetricCard";
import {
  formatBytes,
  formatCores,
  formatQuota,
  usagePercentage,
  usagePercentageFromCount,
  usagePercentageFromQuantity,
} from "../../utils/quotaFormatters";

type QuotaSummaryProps = {
  quota: ClusterUserQuota;
  userId: string;
  adminMode: boolean;
  onEdit: () => void;
};

function QuotaSummary({ quota, userId, adminMode, onEdit }: QuotaSummaryProps) {
  const cpuUsed = quota.resources?.cpu.used;
  const cpuMax = quota.resources?.cpu.max;
  const gpuUsed = quota.resources?.gpu?.used ?? 0;
  const gpuMax = quota.resources?.gpu?.max ?? 0;
  const memoryUsed = quota.resources?.memory.used;
  const memoryMax = quota.resources?.memory.max;
  const ephemeralStorageUsed = quota.resources?.ephemeralStorage.used;
  const ephemeralStorageMax = quota.resources?.ephemeralStorage.max;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <CardDescription>{adminMode ? "User quota" : "My quota"}</CardDescription>
            <CardTitle className="mt-1 text-xl">
              <ResponsiveOwnerField owner={userId} copy />
            </CardTitle>
            {adminMode && quota.cluster_queue && (
              <CardDescription className="mt-2 min-w-0 truncate">
                ClusterQueue: <span className=" font-medium text-slate-700 dark:text-slate-200">{quota.cluster_queue}</span>
              </CardDescription>
            )}
          </div>

          {adminMode && (
            <div className="flex flex-wrap gap-2 md:justify-end">
              <Button onClick={onEdit}>
                <Pencil size={16} className="mr-2" />
                Edit quota
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-4">
        {quota.resources && (
          <>
            <QuotaMetricCard
              icon={<Cpu size={18} />}
              label="CPU limit"
              max={`${formatCores(cpuMax)} cores`}
              used={`${formatCores(cpuUsed)} cores`}
              percentage={usagePercentage(cpuUsed, cpuMax)}
            />
            <QuotaMetricCard
              icon={<MemoryStick size={18} />}
              label="Memory limit"
              max={formatBytes(memoryMax)}
              used={formatBytes(memoryUsed)}
              percentage={usagePercentage(memoryUsed, memoryMax)}
            />
            <QuotaMetricCard
              icon={<GpuIcon size={18} />}
              label="GPU limit"
              max={`${gpuMax}`}
              used={`${gpuUsed}`}
              percentage={usagePercentage(gpuUsed, gpuMax)}
            />
            <QuotaMetricCard
              icon={<Box size={18} />}
              label="Ephemeral Storage limit"
              max={formatBytes(ephemeralStorageMax)}
              used={formatBytes(ephemeralStorageUsed)}
              percentage={usagePercentage(ephemeralStorageUsed, ephemeralStorageMax)}
            />
          </>
        )}

        {quota.volumes && (
          <>
            <QuotaMetricCard
              icon={<HardDrive size={18} />}
              label="Volume disk limit"
              max={formatQuota(quota.volumes.disk.max)}
              used={formatQuota(quota.volumes.disk.used)}
              percentage={usagePercentageFromQuantity(quota.volumes.disk.used, quota.volumes.disk.max)}
            />
            <QuotaMetricCard
              icon={<Layers size={18} />}
              label="Managed volumes limit"
              max={formatQuota(quota.volumes.volumes.max)}
              used={formatQuota(quota.volumes.volumes.used)}
              percentage={usagePercentageFromCount(quota.volumes.volumes.used, quota.volumes.volumes.max)}
            />
            <QuotaMetricCard
              icon={<HardDrive size={18} />}
              label="Max disk per volume"
              max={formatQuota(quota.volumes.max_disk_per_volume)}
            />
            <QuotaMetricCard
              icon={<HardDrive size={18} />}
              label="Min disk per volume"
              max={formatQuota(quota.volumes.min_disk_per_volume)}
            />
          </>
        )}
        {quota.minio && (
          <>
            <QuotaMetricCard
              icon={<Database size={18} />}
              label="MinIO bucket limit"
              max={quota.minio.buckets.max.toString()}
              used={quota.minio.buckets.used.toString()}
              percentage={usagePercentage(quota.minio.buckets.used, quota.minio.buckets.max)}
            />
            <QuotaMetricCard
              icon={<Database size={18} />}
              label="MinIO storage size limit per bucket"
              max={formatQuota(quota.minio.storage_per_bucket.max)}
            />
            <QuotaMetricCard
              icon={<Database size={18} />}
              label="MinIO total storage used"
              max={formatQuota(quota.minio.storage_total.used)}
            />
            
          </>
        )}
      </div>
    </div>
  );
}

export default QuotaSummary;
