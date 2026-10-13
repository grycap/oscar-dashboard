import ResponsiveOwnerField from "@/components/ResponsiveOwnerField";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ClusterUserQuota } from "@/models/clusterUserQuota";
import { Box, Cpu, Database, Gpu, HardDrive, Layers, MemoryStick, Pencil } from "lucide-react";
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

export function QuotaSummary({ quota, userId, adminMode, onEdit }: QuotaSummaryProps) {
  const cpuUsed = quota.resources?.cpu.used;
  const cpuMax = quota.resources?.cpu.max;
  const gpuUsed = quota.resources?.gpu?.used ?? 0;
  const gpuMax = quota.resources?.gpu?.max ?? 0;
  const memoryUsed = quota.resources?.memory.used;
  const memoryMax = quota.resources?.memory.max;
  const ephemeralStorageUsed = quota.resources?.ephemeralStorage.used;
  const ephemeralStorageMax = quota.resources?.ephemeralStorage.max;

  return (
    <div className="space-y-6 pb-6">
      {/* User Header Profile Card */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                {adminMode ? "Managed User Quota" : "My quota"}
              </span>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                <ResponsiveOwnerField owner={userId} copy />
              </div>
              {quota.cluster_queue && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                  <span>Assigned ClusterQueue:</span>
                  <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate min-w-[100px]">
                    {quota.cluster_queue}
                  </span>
                </div>
              )}
            </div>
          </div>

          {adminMode && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="mainGreen"
                size="sm"
                onClick={onEdit}
                className="gap-2 rounded-xl text-xs font-semibold shadow-xs"
              >
                <Pencil size={14} />
                <span>Edit User Quota</span>
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* 1. Compute & Compute Resources Section */}
      {quota.resources && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Cpu size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Compute & Hardware Limits
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuotaMetricCard
              icon={<Cpu size={18} />}
              label="CPU Allocation"
              max={`${formatCores(cpuMax)} cores`}
              used={`${formatCores(cpuUsed)} cores`}
              percentage={usagePercentage(cpuUsed, cpuMax)}
            />
            <QuotaMetricCard
              icon={<MemoryStick size={18} />}
              label="Memory Allocation"
              max={formatBytes(memoryMax)}
              used={formatBytes(memoryUsed)}
              percentage={usagePercentage(memoryUsed, memoryMax)}
            />
            <QuotaMetricCard
              icon={<Gpu size={18} />}
              label="GPU Limit"
              max={`${gpuMax}`}
              used={`${gpuUsed}`}
              percentage={usagePercentage(gpuUsed, gpuMax)}
            />
            <QuotaMetricCard
              icon={<Box size={18} />}
              label="Ephemeral Storage"
              max={formatBytes(ephemeralStorageMax)}
              used={formatBytes(ephemeralStorageUsed)}
              percentage={usagePercentage(ephemeralStorageUsed, ephemeralStorageMax)}
            />
          </div>
        </div>
      )}

      {/* 2. Persistent Storage Volumes Section */}
      {quota.volumes && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <HardDrive size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Persistent Volume Storage Limits
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuotaMetricCard
              icon={<HardDrive size={18} />}
              label="Total Disk Capacity"
              max={formatQuota(quota.volumes.disk.max)}
              used={formatQuota(quota.volumes.disk.used)}
              percentage={usagePercentageFromQuantity(quota.volumes.disk.used, quota.volumes.disk.max)}
            //  colorScheme="indigo"
            />
            <QuotaMetricCard
              icon={<Layers size={18} />}
              label="Managed Volumes"
              max={formatQuota(quota.volumes.volumes.max)}
              used={formatQuota(quota.volumes.volumes.used)}
              percentage={usagePercentageFromCount(quota.volumes.volumes.used, quota.volumes.volumes.max)}
            />
            <QuotaMetricCard
              icon={<HardDrive size={18} />}
              label="Max Disk / Volume"
              max={formatQuota(quota.volumes.max_disk_per_volume)}
            />
            <QuotaMetricCard
              icon={<HardDrive size={18} />}
              label="Min Disk / Volume"
              max={formatQuota(quota.volumes.min_disk_per_volume)}
            />
          </div>
        </div>
      )}

      {/* 3. MinIO Object Storage Quotas */}
      {quota.minio && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 px-1">
            <Database size={16} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              MinIO Object Storage Allocation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuotaMetricCard
              icon={<Database size={18} />}
              label="Bucket Count Limit"
              max={quota.minio.buckets.max.toString()}
              used={quota.minio.buckets.used.toString()}
              percentage={usagePercentage(quota.minio.buckets.used, quota.minio.buckets.max)}
            />
            <QuotaMetricCard
              icon={<Database size={18} />}
              label="Max Size Per Bucket"
              max={formatQuota(quota.minio.storage_per_bucket.max)}
            />
            <QuotaMetricCard
              icon={<Database size={18} />}
              label="Total Storage Used"
              max={formatQuota(quota.minio.storage_total.used)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default QuotaSummary;
