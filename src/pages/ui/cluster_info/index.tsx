// src/pages/cluster_info/index.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Cpu,
  Gpu,
  MemoryStick,
  ChevronDown, ChevronRight,
  LoaderPinwheel,
  Database,
  Files,
  Box,
  ClipboardList,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import GenericTopbar from "@/components/Topbar";
import OscarColors from "@/styles";
import { useLocation } from "react-router-dom";
import getStatusApi from "@/api/status/getStatusApi";
import { ClusterStatus } from "@/models/clusterStatus";
import { useAuth } from "@/contexts/AuthContext";


function DonutChart({ percentage, dangerThreshold }: { percentage: number; dangerThreshold: number }) {
  const isDanger = percentage >= dangerThreshold;
  const COLORS = [isDanger ? "#ef4444" : "#10b981", "#e5e7eb"]; // red or green

  const data = [
    { name: "Used", value: percentage },
    { name: "Free", value: 100 - percentage },
  ];

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

// function to color in red if the free percentage is low
const getColorByPercentage = (free: number, total: number, thresholdPercent: number) =>
  (free / total) <= (thresholdPercent / 100) ? "text-red-500" : "text-green-500";

// convert to bytes
const formatBytes = (bytes: number) =>
  `${(bytes / 1024 ** 3).toFixed(1)} GB`;

// convert to Cores
const formatCores = (millicores: number) =>
  `${(millicores / 1000).toFixed(2)} Cores`;

// convert to kilobytes
/*const formatKilobytes = (bytes: number) =>
  `${(bytes / 1024).toFixed(1)} KB`;*/

const Cluster = () => {
  const { authData } = useAuth();
  const location = useLocation();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    deployment: false,
    jobs: false,
    pods: false,
    oidc: false,
    minio: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const toggleNode = (nodeName: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeName]: !prev[nodeName]
    }));
  };

  // access the authentication context
  const [data, setData] = useState<ClusterStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title ="OSCAR - Status"
  }, []);

  async function fetchData() {
    try {
    setLoading(true);
    setData(await getStatusApi());
    setLoading(false);
    } catch(err) {
      console.error("Error fetching status:", err);
      setLoading(false);
    }
  }

  const hasNodes = data && data.cluster.nodes_count > 0;
  // calculate real total by summing capacities per node
  const cpuTotal = hasNodes ? data.cluster.nodes.reduce((acc, node) => acc + node.cpu.capacity_cores, 0) : 0;
  const memTotal = hasNodes ? data.cluster.nodes.reduce((acc, node) => acc + node.memory.capacity_bytes, 0) : 0;

  return (
    <div className="w-full h-full"> 
      <GenericTopbar defaultHeader={{title: "Status", linkTo: location.pathname}} refresher={fetchData} />
      {loading || !data ?
      <div className="flex items-center justify-center h-[80vh]">
        <LoaderPinwheel className="animate-spin" size={60} color={OscarColors.Green3} />
      </div>
      :
      <div className="w-full max-w-full mx-auto px-4 pt-6 pb-6 space-y-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Cluster</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Summary of the general status of the cluster.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Number of nodes */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-lg font-semibold">
                        Number of nodes:{" "}
                        <span className="text-xl font-bold">{data.cluster.nodes_count}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Total free CPU */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mt-2">
                      <Cpu className={getColorByPercentage(data.cluster.metrics.cpu.total_free_cores, cpuTotal, 30)} />
                      <p className="text-lg font-semibold">
                        Total free CPU:{" "}
                        <span className={`text-xl font-bold ${getColorByPercentage(data.cluster.metrics.cpu.total_free_cores, cpuTotal, 30)}`}>
                            {formatCores(data.cluster.metrics.cpu.total_free_cores)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Max free CPU */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mt-2">
                      <Cpu className={getColorByPercentage(data.cluster.metrics.cpu.max_free_on_node_cores, cpuTotal, 30)} />
                      <p className="text-lg font-semibold">
                        Node maximum free CPU:{" "}
                        <span className={`text-xl font-bold ${getColorByPercentage(data.cluster.metrics.cpu.max_free_on_node_cores, cpuTotal, 30)}`}>
                          {formatCores(data.cluster.metrics.cpu.max_free_on_node_cores)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Total GPUs */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-lg font-semibold">
                        Total GPUs:{" "}
                        <span className="text-xl font-bold">{data.cluster.metrics.gpu.total_gpu}</span>
                      </p>
                      {data.cluster.metrics.gpu.total_gpu === 0 ? (
                        <XCircle className="text-red-500" size={28} />
                      ) : (
                        <CheckCircle className="text-green-500" size={28} />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Total free memory */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mt-2">
                      <MemoryStick className={getColorByPercentage(data.cluster.metrics.memory.total_free_bytes, memTotal, 40)} />
                      <p className="text-lg font-semibold">
                        Total free memory:{" "}
                        <span className={`text-xl font-bold ${getColorByPercentage(data.cluster.metrics.memory.total_free_bytes, memTotal, 40)}`}>
                          {formatBytes(data.cluster.metrics.memory.total_free_bytes)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Max free memory */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mt-2">
                      <MemoryStick className={getColorByPercentage(data.cluster.metrics.memory.max_free_on_node_bytes, memTotal, 40)} />
                      <p className="text-lg font-semibold">
                        Node maximum free memory:{" "}
                        <span className={`text-xl font-bold ${getColorByPercentage(data.cluster.metrics.memory.max_free_on_node_bytes, memTotal, 40)}`}>
                          {formatBytes(data.cluster.metrics.memory.max_free_on_node_bytes)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Deployment collapsible block */}
            <Card className="w-full mt-6">
              <div
                onClick={() => toggleSection("deployment")}
                className="cursor-pointer hover:bg-gray-100 transition px-4 py-3 rounded-md flex justify-between items-center"
              >
                <CardTitle className="text-lg font-semibold">Deployment</CardTitle>
                {expandedSections.deployment ? <ChevronDown /> : <ChevronRight />}
              </div>

              {expandedSections.deployment && (
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-base font-medium text-gray-800 flex gap-1">
                        Deployment name: <span>{data.oscar.deployment_name}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-base font-medium text-gray-800 flex gap-1">
                        Created on:{" "}
                        <span>
                          {new Date(data.oscar.deployment.creation_timestamp).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-base font-medium text-gray-800 flex gap-1">
                        Strategy: <span>{data.oscar.deployment.strategy}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div
                        className={`text-base font-medium flex gap-1 ${
                          data.oscar.deployment.ready_replicas === data.oscar.deployment.replicas
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Available replicas:{" "}
                        <span>
                          {data.oscar.deployment.ready_replicas} / {data.oscar.deployment.replicas}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div
                        className={`text-base font-medium flex gap-1 ${
                          data.oscar.deployment.replicas - data.oscar.deployment.available_replicas === 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Not available:{" "}
                        <span>{data.oscar.deployment.replicas - data.oscar.deployment.available_replicas}</span>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              )}
            </Card>

            {/* Pods and Jobs collapsible */}
            {authData.user && authData.user === "oscar" && (
            <Card className="w-full mt-6">
              <div
                onClick={() => toggleSection("pods")}
                className="cursor-pointer hover:bg-gray-100 transition px-4 py-3 rounded-md flex justify-between items-center"
              >
                <CardTitle className="text-lg font-semibold">Pods and Jobs</CardTitle>
                {expandedSections.pods ? <ChevronDown /> : <ChevronRight />}
              </div>
              
              {expandedSections.pods && (
                <CardContent className="grid grid-rows-[auto_1fr] gap-4 mt-5">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Total pods */}
                    <Card>
                      <CardContent className="p-4 h-full">
                        <div className="flex flex-row justify-center items-center gap-2 h-full">
                          <Box className="text-blue-600" size={24} />
                          <p className="text-lg font-semibold text-center">
                            Total Pods:{" "}
                            <span className="text-xl font-bold">{data.oscar.pods.total}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total jobs */}
                    <Card>
                      <CardContent className="p-4 h-full">
                        <div className="flex flex-row justify-center items-center gap-2 h-full">
                          <ClipboardList className="text-purple-600" size={24} />
                          <p className="text-lg font-semibold text-center">
                            Total Jobs:{" "}
                            <span className="text-xl font-bold ">{data.oscar.jobs_count}</span>
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex flex-wrap md:flex-nowrap gap-4">
                    {/* Active - Blue */}
                    <Card className="flex-1 bg-blue-50 border border-blue-200">
                      <CardContent className="p-4 text-center text-blue-800 font-semibold text-lg">
                        Pending{" "}
                        <span className="font-bold ml-1">
                          {data.oscar.pods.states.Pending}
                        </span>
                      </CardContent>
                    </Card>

                    {/* Running - Orange */}
                    <Card className="flex-1 bg-orange-50 border border-orange-200">
                      <CardContent className="p-4 text-center text-orange-800 font-semibold text-lg">
                        Running{" "}
                        <span className="font-bold ml-1">
                          {data.oscar.pods.states.Running}
                        </span>
                      </CardContent>
                    </Card>

                    {/* Failed - Red */}
                    <Card className="flex-1 bg-rose-50 border border-rose-200">
                      <CardContent className="p-4 text-center text-rose-800 font-semibold text-lg">
                        Failed{" "}
                        <span className="font-bold ml-1">
                          {data.oscar.pods.states.Failed}
                        </span>
                      </CardContent>
                    </Card>

                    {/* Succeeded - Green */}
                    <Card className="flex-1 bg-emerald-50 border border-emerald-200">
                      <CardContent className="p-4 text-center text-emerald-800 font-semibold text-lg">
                        Succeeded{" "}
                        <span className="font-bold ml-1">
                          {data.oscar.pods.states.Succeeded}
                        </span>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              )}
            </Card>
            )}
            
          {/* OIDC collapsible block */}
          <Card className="w-full mt-6">
            <div
              onClick={() => toggleSection("oidc")}
              className="cursor-pointer hover:bg-gray-100 transition px-4 py-3 rounded-md flex justify-between items-center"
            >
              <CardTitle className="text-lg font-semibold">OIDC</CardTitle>
              {expandedSections.oidc ? <ChevronDown /> : <ChevronRight />}
            </div>

            {expandedSections.oidc && (
              <CardContent className="flex flex-col gap-4">
                {/* First row: OIDC Enabled */}
                <div className="flex mt-5">
                  <Card className="w-full">
                    <CardContent className="p-4">
                      <div className={`text-base font-medium flex gap-1 ${
                        data.oscar.oidc.enabled ? "text-green-600" : "text-red-600"
                      }`}>
                        OIDC enabled:{" "}
                        <span>{data.oscar.oidc.enabled ? "true" : "false"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Second row: Issuer + Authorized groups */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Issuer */}
                  <Card className="w-full md:w-1/2">
                    <CardContent className="p-4">
                      <div className="text-base font-medium text-gray-800">
                        Issuer:
                        <ul className="list-disc list-inside mt-1 text-sm font-normal">
                          {data.oscar.oidc.issuers.length > 0
                            ? data.oscar.oidc.issuers.map((issuer, idx) => (
                                <li key={idx}>{issuer}</li>
                              ))
                            : <li>N/A</li>}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Authorized groups */}
                  <Card className="w-full md:w-1/2">
                    <CardContent className="p-4">
                      <div className="text-base font-medium text-gray-800">
                        Authorized groups:
                        <ul className="list-disc list-inside mt-1 text-sm font-normal">
                          {data.oscar.oidc.groups.length > 0
                            ? data.oscar.oidc.groups.map((group, idx) => (
                                <li key={idx}>{group}</li>
                              ))
                            : <li>N/A</li>}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
              
            )}
          </Card>
          </CardContent>
        </Card> 

        {/* Nodes block */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Nodes</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Detailed information about the nodes. Currently  {data.cluster.nodes?.length ?? 0} active node(s).
            </CardDescription>
          </CardHeader>
          
          {/* Info detallada de los nodos*/}
          <CardContent>
            <div className="w-full space-y-4">
              {data.cluster.nodes && data.cluster.nodes.map((node, index) => {
                const memoryCapacityGB = (node.memory.capacity_bytes / (1024 ** 3)).toFixed(2);
                const isExpanded = expandedNodes[node.name] || false;

                const isConditionError = (condition: { type: string; status: boolean }) => {
                  if (condition.type === "Ready") {
                    return !condition.status;
                  } else {
                    return condition.status;
                  }
                };

                return (
                  <Card key={index} className="space-y-2">
                    <div
                      onClick={() => toggleNode(node.name)}
                      className="cursor-pointer hover:bg-gray-100 transition px-4 py-3 rounded-md flex justify-between items-center"
                    >
                      <CardTitle className="text-lg font-semibold">{node.name}</CardTitle>
                      {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    </div>

                    {isExpanded && (
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                        <div className="flex flex-col gap-4 justify-between h-full">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="border rounded-lg p-4 shadow-sm">
                              <h2 className="text-lg font-semibold">CPU capacity</h2>
                              <div className="flex items-center gap-2 mt-2">
                                <Cpu className="text-black" size={24} />
                                <p className="text-xl font-bold">{node.cpu.capacity_cores}</p>
                              </div>
                            </div>
                            <div className="border rounded-lg p-4 shadow-sm">
                              <h2 className="text-lg font-semibold">Memory Capacity</h2>
                              <div className="flex items-center gap-2 mt-2">
                                <MemoryStick className="text-black" size={24} />
                                <p className="text-xl font-bold">{memoryCapacityGB} GB</p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="border rounded-lg p-4 shadow-sm">
                              <h2 className="text-lg font-semibold">GPU capacity</h2>
                              <div className="flex items-center gap-2 mt-2">
                                <Gpu className="text-black" size={24} />
                                <p className="text-xl font-bold">{node.gpu}</p>
                              </div>
                            </div>
                            <div className="border rounded-lg p-4 shadow-sm">
                              <h2 className="text-lg font-semibold">InterLink</h2>
                              <div className="flex items-center gap-2 mt-2">
                                {!node.is_interlink ? (
                                  <XCircle className="text-red-500" size={28} />
                                ) : (
                                  <CheckCircle className="text-green-500" size={28} />
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4 shadow-sm">
                            <h2 className="text-lg font-semibold pb-3">Node Conditions</h2>
                            <div className="flex flex-wrap gap-2">
                              {node.conditions.map((condition, i) => {
                                const isError = isConditionError(condition);
                                return (
                                  <span
                                    key={i}
                                    className={`text-sm px-3 py-1.5 rounded-full font-semibold ${
                                      isError
                                        ? 'bg-red-100 text-red-800 border border-red-300'
                                        : 'bg-green-100 text-green-800 border border-green-300'
                                    }`}
                                  >
                                    {condition.type}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4 shadow-sm flex flex-col justify-start">
                            <h2 className="text-lg font-semibold">CPU usage</h2>
                            <div className="flex flex-col h-full justify-center">
                              <DonutChart percentage={Math.round(node.cpu.usage_cores / node.cpu.capacity_cores * 100)} dangerThreshold={70} />
                              <p className="text-center font-bold text-sm mt-2">
                                {Number((node.cpu.usage_cores / node.cpu.capacity_cores * 100).toFixed(1))}% Used
                              </p>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4 shadow-sm flex flex-col justify-start">
                            <h2 className="text-lg font-semibold">Memory usage</h2>
                            <div className="flex flex-col h-full justify-center">
                              <DonutChart percentage={Math.round(node.memory.usage_bytes * 100 / node.memory.capacity_bytes)} dangerThreshold={60} />
                              <p className="text-center font-bold text-sm mt-2">
                                {Number((node.memory.usage_bytes / node.memory.capacity_bytes * 100).toFixed(1))}% Used
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      
        {/* MinIO section */}
        {authData.user && authData.user === "oscar" && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>MinIO</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Detailed information about buckets.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Total buckets */}
              <Card>
                <CardContent className="p-4 h-full">
                  <div className="flex flex-row justify-center items-center h-full gap-2">
                    <Database className="text-black" size={24} />
                    <p className="text-lg font-semibold text-center">
                      Total Buckets:{" "}
                      <span className="text-xl font-bold">{data.minio.buckets_count}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Total objects in minio */}
              <Card>
                <CardContent className="p-4 h-full">
                  <div className="flex flex-row justify-center items-center h-full gap-2">
                    <Files className="text-black" size={24} />
                    <p className="text-lg font-semibold text-center">
                      Total Objects:{" "}
                      <span className="text-xl font-bold ">{data.minio.total_objects}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        )}
      <div className="h-2" />
      </div>
      }
    </div>
  );
};

export default Cluster;
