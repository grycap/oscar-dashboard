// src/pages/cluster_info/index.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Cpu,
  Gpu,
  MemoryStick,
  LoaderPinwheel,
  Database,
  Files,
  Box,
  ShieldCheck,
  Layers,
  Server,
  Boxes,
} from "lucide-react";
import GenericTopbar from "@/components/Topbar";
import { useLocation } from "react-router-dom";
import getStatusApi from "@/api/status/getStatusApi";
import { ClusterStatus } from "@/models/clusterStatus";
import { useAuth } from "@/contexts/AuthContext";
import ExpandCard from "@/components/ExpandCard";
import ClusterUseGraph from "./components/ClusterUseGraph";
import { MetricCard } from "@/components/MetricCard";
import OscarColors from "@/styles";

// convert to bytes
const formatBytes = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(1)} GB`;

// convert to Cores
const formatCores = (millicores: number) => `${(millicores / 1000).toFixed(2)} Cores`;

const Cluster = () => {
  const { authData } = useAuth();
  const location = useLocation();

  const [clusterStatusData, setClusterStatusData] = useState<ClusterStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "OSCAR - Cluster Status";
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setClusterStatusData(await getStatusApi());
      setLoading(false);
    } catch (err) {
      console.error("Error fetching status:", err);
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  let nodeCount = 0;
  try {
    nodeCount = clusterStatusData?.cluster.nodes_count ?? 0;
  } catch {
    nodeCount = -1;
  }

  const hasNodes = clusterStatusData && nodeCount > 0;
  const cpuTotal = hasNodes
    ? clusterStatusData.cluster.nodes.reduce((acc, node) => acc + node.cpu.capacity_cores, 0)
    : 0;
  const memTotal = hasNodes
    ? clusterStatusData.cluster.nodes.reduce((acc, node) => acc + node.memory.capacity_bytes, 0)
    : 0;

  const freeCpuCores = clusterStatusData ? clusterStatusData.cluster.metrics.cpu.total_free_cores : 0;
  const totalCpuCores = cpuTotal;
  const cpuUsedPct = totalCpuCores > 0 ? Math.round(((totalCpuCores - freeCpuCores) / totalCpuCores) * 100).toFixed(1) : 0;

  const freeMemBytes = clusterStatusData?.cluster.metrics.memory.total_free_bytes ?? 0;
  const memUsedPct = memTotal > 0 ? Math.round(((memTotal - freeMemBytes) / memTotal) * 100).toFixed(1) : 0;

  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
      <GenericTopbar
        defaultHeader={{ title: "Cluster Status", linkTo: location.pathname }}
        refresher={fetchData}
      />

      {loading || !clusterStatusData || nodeCount < 0 ? (
        <div className="flex items-center justify-center flex-1 min-h-0 px-4 py-16">
          {nodeCount < 0 ? (
            <div className="max-w-md w-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-center mb-4">
                <XCircle className="text-amber-500" size={52} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                Version Not Supported
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                The current OSCAR cluster daemon version does not expose the metrics telemetry endpoint required for this dashboard.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Please upgrade your OSCAR cluster to release 3.x or verify cluster connectivity.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className={`w-full h-full ${/*max-w-[1500px] mx-auto*/ ""} px-4 sm:px-6 py-6 pb-16 space-y-6`}>
            {/* Header Banner 
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60 dark:border-emerald-800/60">
                  <Activity size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Cluster Telemetry & Health Status
                    </h1>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Operational</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Live operational telemetry, worker node utilization gauges, and Kubernetes orchestration state.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-sm text-slate-500 dark:text-slate-400">
                <span>Deployment: <strong className="font-mono text-slate-800 dark:text-slate-200">{clusterStatusData.oscar.deployment_name}</strong></span>
              </div>
            </div>*/}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Boxes size={18} className="text-emerald-600 dark:text-emerald-400" />
                  Cluster General Information
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Overview of the OSCAR cluster deployment, worker node count, and resource allocation metrics
                </p>
              </div>
            </div>
            {/* KPI Metrics Grid */}
            <div className="flex flex-wrap gap-4 ">
              <div className="flex flex-col gap-4 w-full sm:w-auto">
                <MetricCard
                  title="Active Nodes"
                  value={clusterStatusData.cluster.nodes_count}
                  subtitle={`${clusterStatusData.cluster.nodes?.length ?? 0} worker nodes registered`}
                  icon={<Server size={18} />}
                  colorScheme="emerald"
                  size="sm"
                />
                <MetricCard
                  title="GPU Accelerators"
                  value={clusterStatusData.cluster.metrics.gpu.total_gpu}
                  subtitle={clusterStatusData.cluster.metrics.gpu.total_gpu > 0 ? "Hardware passthrough ready" : "No accelerators detected"}
                  icon={<Gpu size={18} />}
                  colorScheme="purple"
                  size="sm"
                />
              </div>

              <MetricCard
                className="w-full sm:w-auto"
                title="Total CPU"
                value={formatCores(totalCpuCores)}
                percentage={Number((cpuUsedPct))}
                percentageLabel={`${cpuUsedPct}% used`}
                subtitle={<span>
                            <span>{`In use: ${formatCores((totalCpuCores - freeCpuCores))}`}</span>
                            <br />
                            <span>{`Total Reserved: ${formatCores(totalCpuCores - clusterStatusData.cluster.metrics.cpu.total_schedulable_cores)}`}</span>
                            <br />
                            <span>{`Total Free to reserve: ${formatCores(clusterStatusData.cluster.metrics.cpu.total_schedulable_cores)}`}</span>
                            <br />
                            <span><strong>{`Max Free to reserve on one node: ${formatCores(clusterStatusData.cluster.metrics.cpu.total_schedulable_on_node_cores)}`}</strong></span>
                          </span>}
                icon={<Cpu size={18} />}
                colorScheme="blue"
              />

              <MetricCard
                className="w-full sm:w-auto"
                title="Total RAM Memory"
                value={formatBytes(memTotal)}
                percentage={Number(memUsedPct)}
                percentageLabel={`${memUsedPct}% used`}
                subtitle={
                  <span>
                    <span>{`In use: ${formatBytes((memTotal - freeMemBytes))}`}</span>
                    <br />
                    <span>{`Total Reserved: ${formatBytes(memTotal - clusterStatusData.cluster.metrics.memory.total_schedulable_bytes)}`}</span>
                    <br />
                    <span>{`Total Free to reserve: ${formatBytes(clusterStatusData.cluster.metrics.memory.total_schedulable_bytes)}`}</span>
                    <br />
                    <span><strong>{`Max Free to reserve on one node: ${formatBytes(clusterStatusData.cluster.metrics.memory.max_schedulable_on_node_bytes)}`}</strong></span>
                  </span>
                }
                icon={<MemoryStick size={18} />}
                colorScheme="indigo"
              />

              
            </div>

            {/* Deployment Details & Identity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* OSCAR Deployment Specifications */}
              <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/50">
                      <Layers size={16} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        OSCAR Deployment Controller
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-400 dark:text-slate-500">
                        Kubernetes deployment specs and replica status
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 p-4">
                  <div className="p-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Deployment
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {clusterStatusData.oscar.deployment_name}
                    </span>
                  </div>

                  <div className="p-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Created
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                      {new Date(clusterStatusData.oscar.deployment.creation_timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="p-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Strategy
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 block">
                      {clusterStatusData.oscar.deployment.strategy}
                    </span>
                  </div>

                  <div className="p-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                      Replicas
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
                      {clusterStatusData.oscar.deployment.ready_replicas} / {clusterStatusData.oscar.deployment.replicas} Ready
                    </span>
                  </div>
                </div>
              </Card>

              {/* OIDC & Federation */}
              <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-800/50">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        OIDC & Identity Federation
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-400 dark:text-slate-500">
                        Configured token issuers and authorized user groups
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="font-medium text-slate-500 dark:text-slate-400">Authentication State</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      clusterStatusData.oscar.oidc.enabled
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}>
                      {clusterStatusData.oscar.oidc.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-slate-400 block mb-1 text-[11px] uppercase tracking-wider">
                        Trusted Issuers
                      </span>
                      <ul className="space-y-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {clusterStatusData.oscar.oidc.issuers.length > 0 ? (
                          clusterStatusData.oscar.oidc.issuers.map((iss, i) => (
                            <li key={i} className="truncate" title={iss}>{iss}</li>
                          ))
                        ) : (
                          <li className="text-slate-400">None configured</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-400 block mb-1 text-[11px] uppercase tracking-wider">
                        Authorized Groups (VOs)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {clusterStatusData.oscar.oidc.groups.length > 0 ? (
                          clusterStatusData.oscar.oidc.groups.map((group, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 font-mono text-slate-700 dark:text-slate-300"
                            >
                              {group}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Cluster Usage History Chart (admin) */}
            {authData.user && authData.user === "oscar" && (
              <div className="">
                <ClusterUseGraph />
              </div>
            )}

            {/* Admin-only Pods and Jobs Execution Status */}
            {authData.user && authData.user === "oscar" && (
              <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/20">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
                      <Box size={16} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Kubernetes Pods & Workload Lifecycle
                      </CardTitle>
                      <CardDescription className="text-[11px] text-slate-400 dark:text-slate-500">
                        Cluster workload queue states across synchronous and asynchronous jobs
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60 text-center">
                      <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider block mb-1">
                        Pending
                      </span>
                      <span className="text-2xl font-bold font-mono text-blue-900 dark:text-blue-100">
                        {clusterStatusData.oscar.pods.states.Pending}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 text-center">
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider block mb-1">
                        Running
                      </span>
                      <span className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-100">
                        {clusterStatusData.oscar.pods.states.Running}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/60 text-center">
                      <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider block mb-1">
                        Failed
                      </span>
                      <span className="text-2xl font-bold font-mono text-rose-900 dark:text-rose-100">
                        {clusterStatusData.oscar.pods.states.Failed}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 text-center">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                        Succeeded
                      </span>
                      <span className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-100">
                        {clusterStatusData.oscar.pods.states.Succeeded}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Total Active Pods</span>
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{clusterStatusData.oscar.pods.total}</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Batch Job Records</span>
                      <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">{clusterStatusData.oscar.jobs_count}</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Nodes Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Server size={18} className="text-emerald-600 dark:text-emerald-400" />
                    Cluster Worker Nodes ({clusterStatusData.cluster.nodes?.length ?? 0})
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Individual node compute allocation, utilization gauges, and Kubernetes conditions
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {clusterStatusData.cluster.nodes &&
                  clusterStatusData.cluster.nodes.map((node, index) => {
                    const cpuPct = Math.round((node.cpu.usage_cores / node.cpu.capacity_cores) * 100);
                    const memPct = Math.round((node.memory.usage_bytes / node.memory.capacity_bytes) * 100);
                    const isReady = node.conditions.some((c) => c.type === "Ready" && c.status);

                    return (
                      <ExpandCard
                        key={index}
                        title={node.name}
                        subtitle={`${formatCores(node.cpu.capacity_cores)} · ${formatBytes(node.memory.capacity_bytes)} RAM`}
                        defaultExpanded={index === 0}
                        badge={
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* 1. Node Health Ready Badge */}
                            <span
                              className={`inline-flex items-center gap-1.5 text-sm font-semibold px-2.5 py-0.5 rounded-full ${
                                isReady
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isReady ? "bg-emerald-500" : "bg-rose-500"}`} />
                              {isReady ? "Ready" : "Not Ready"}
                            </span>

                            {/* 2. GPU Status Badge (Separado) */}
                            {node.gpu > 0 ? (
                              <span className="inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                                <Gpu size={13} className="text-purple-600 dark:text-purple-400" />
                                <span>{node.gpu} GPU{node.gpu > 1 ? "s" : ""}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-sm font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                                <Gpu size={13} className="text-slate-400" />
                                <span>No GPU</span>
                              </span>
                            )}

                            {/* 3. InterLink Status Badge (Separado) */}
                            {node.is_interlink && (
                              <span className="inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                                <Layers size={13} className="text-cyan-600 dark:text-cyan-400" />
                                <span>InterLink Node</span>
                              </span>
                            )}
                          </div>
                        }
                      >
                        <div className="p-5 space-y-4 bg-slate-50/20 dark:bg-slate-900">
                          {/* Node Key Metric Cards (CPU Capacity, RAM Memory, GPU Status, InterLink) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                            {/* 1. CPU Capacity MetricCard */}
                            <MetricCard
                              title="CPU Capacity"
                              size="sm"
                              value={`${formatCores(node.cpu.capacity_cores)}`}
                              percentage={cpuPct}
                              percentageLabel={`${cpuPct}% in use`}
                              subtitle={
                                <span>
                                  In use: {formatCores(node.cpu.usage_cores)}
                                  <br />
                                  Reserved: {formatCores(node.cpu.request_cores)}
                                  <br />
                                  <strong>Free to reserve: {formatCores(node.cpu.capacity_cores - node.cpu.request_cores)}</strong>
                                </span>
                              }
                              icon={<Cpu size={15} />}
                              colorScheme={cpuPct >= 85 ? "rose" : cpuPct >= 70 ? "amber" : "blue"}
                            />

                            {/* 2. RAM Memory MetricCard */}
                            <MetricCard
                              title="RAM Memory"
                              size="sm"
                              value={`${formatBytes(node.memory.capacity_bytes)}`}
                              percentage={memPct}
                              percentageLabel={`${memPct}% in use`}
                              subtitle={
                                <span>
                                  In use: {formatBytes(node.memory.usage_bytes)}
                                  <br />
                                  Reserved: {formatBytes(node.memory.request_bytes)}
                                  <br />
                                  <strong>Free to reserve: {formatBytes(node.memory.capacity_bytes - node.memory.request_bytes)}</strong>
                                </span>
                              }
                              icon={<MemoryStick size={15} />}
                              colorScheme={memPct >= 85 ? "rose" : memPct >= 70 ? "amber" : "indigo"}
                            />

                            {/* 3. GPU Status MetricCard */}
                            <MetricCard
                              title="GPU Accelerators"
                              size="sm"
                              value={node.gpu > 0 ? `${node.gpu} GPU${node.gpu > 1 ? "s" : ""}` : "No GPU"}
                              subtitle={node.gpu > 0 ? "Hardware Passthrough Enabled" : "CPU compute only"}
                              icon={<Gpu size={15} />}
                              colorScheme={node.gpu > 0 ? "purple" : "slate"}
                            />

                            {/* 4. InterLink Node MetricCard */}
                            <MetricCard
                              title="InterLink Node"
                              size="sm"
                              value={node.is_interlink ? "Yes" : "No"}
                              subtitle={node.is_interlink ? "Virtual Kubelet (HPC)" : "Native K8s Worker"}
                              icon={<Layers size={15} />}
                              colorScheme={node.is_interlink ? "emerald" : "slate"}
                            />
                          </div>

                          {/* Node Conditions List */}
                          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
                              Kubernetes Node Conditions
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {node.conditions.map((condition, i) => {
                                const isConditionBad = condition.type === "Ready" ? !condition.status : condition.status;
                                return (
                                  <div
                                    key={i}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium border ${
                                      isConditionBad
                                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                                        : "bg-slate-50 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                    }`}
                                  >
                                    {isConditionBad ? (
                                      <XCircle size={13} className="text-rose-600 dark:text-rose-400" />
                                    ) : (
                                      <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                                    )}
                                    <span>
                                      {condition.type === "Ready" ? <strong>Ready</strong> : condition.type}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </ExpandCard>
                    );
                  })}
              </div>
            </div>

            {/* MinIO Object Storage Statistics */}
            
            {authData.user && authData.user === "oscar" && clusterStatusData.minio && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Database size={18} className="text-amber-600 dark:text-amber-400" />
                      MinIO Object Storage
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Aggregated storage buckets and object counts across the cluster's MinIO deployment
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MetricCard
                    title="MinIO Total Buckets"
                    value={clusterStatusData.minio.buckets_count}
                    subtitle="Buckets managed across active storage providers"
                    icon={<Database size={18} />}
                    colorScheme="amber"
                  />

                  <MetricCard
                    title="MinIO Total Objects"
                    value={clusterStatusData.minio.total_objects}
                    subtitle="Aggregated files and artifacts in storage"
                    icon={<Files size={18} />}
                    colorScheme="blue"
                  />
                </div>
              </div>
            )}
            <div className="h-4" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Cluster;
