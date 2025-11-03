// src/pages/cluster_info/index.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Cpu,
  MemoryStick,
  ChevronDown, ChevronRight,
  LoaderPinwheel,
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

type Condition = {
  type: string;
  status: string;
};

type NodeDetail = {
  nodeName: string;
  cpuCapacity: string;
  cpuUsage: string;
  cpuPercentage: string;
  memoryCapacity: string;
  memoryUsage: string;
  memoryPercentage: string;
  conditions: Condition[];
};

type PodSummary = {
  name: string;
  state: string;
};
type PodInfo = {
  pods: PodSummary[];
  total: number;
  states: Record<string, number>;
};

type StatusData = {
  numberNodes: number;
  cpuFreeTotal: number;
  cpuMaxFree: number;
  memoryFreeTotal: number;
  memoryMaxFree: number;
  hasGPU: boolean;
  gpusTotal: number;
  detail: NodeDetail[] | undefined;
  OSCAR: {
    deploymentName: string;
    deploymentReady: boolean;
    deploymentInfo: {
      availableReplicas: number;
      creationTimestamp: string;
      labels: Record<string, string>;
      readyReplicas: number;
      replicas: number;
      strategy: string;
      unavailableReplicas: number;
      };
    jobsCount: {
      active: number;
      failed: number;
      succeeded: number;
    };
    podsInfo: PodInfo;
    OIDC: {
      enabled: boolean;
      issuers: string[];
      groups: string[];
    };
  };
  MinIO: {
  buckets: {
    name: string;
    policy_type?: string;
    policy_json?: string;
    owner?: string;
    members?: string[];
    creation_date: string;
    size: number;
    num_objects: number;
  }[];
};
};



function DonutChart({ percentage, dangerThreshold }: { percentage: number; dangerThreshold: number }) {
  const isDanger = percentage >= dangerThreshold;
  const COLORS = [isDanger ? "#ef4444" : "#10b981", "#e5e7eb"]; // red or green

  const data = [
    { name: "Used", value: percentage },
    { name: "Free", value: 100 - percentage },
  ];

  return (
    <ResponsiveContainer width="100%" height={150}>
      <PieChart>
        <Pie
          data={data}
          innerRadius={40}
          outerRadius={60}
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
const formatKilobytes = (bytes: number) =>
  `${(bytes / 1024).toFixed(1)} KB`;

const Cluster = () => {
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

  const [expandedBuckets, setExpandedBuckets] = useState<Record<string, boolean>>({});
  const toggleBucket = (bucketName: string) => {
    setExpandedBuckets(prev => ({
      ...prev,
      [bucketName]: !prev[bucketName],
    }));
  };

  // access the authentication context
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title ="OSCAR - Status"
  }, []);

  async function fetchData() {
    setLoading(true);
    await axios.get("/system/status")
    .then((res) => {
      setData(res.data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching status:", err);
      setLoading(false);
    });
  }

  // calculate real total by summing capacities per node
  const cpuTotal = data && data.detail ? data.detail.reduce((acc, node) => acc + parseInt(node.cpuCapacity), 0) : 0;
  const memTotal = data && data.detail ? data.detail.reduce((acc, node) => acc + parseInt(node.memoryCapacity), 0) : 0;

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
                        <span className="text-xl font-bold">{data.numberNodes}</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Total free CPU */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mt-2">
                      <Cpu className={getColorByPercentage(data.cpuFreeTotal, cpuTotal, 30)} />
                      <p className="text-lg font-semibold">
                        Total free CPU:{" "}
                        <span className={`text-xl font-bold ${getColorByPercentage(data.cpuFreeTotal, cpuTotal, 30)}`}>
                            {formatCores(data.cpuFreeTotal)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Max free CPU */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mt-2">
                      <Cpu className={getColorByPercentage(data.cpuMaxFree, cpuTotal, 30)} />
                      <p className="text-lg font-semibold">
                        Maximum free CPU:{" "}
                        <span className={`text-xl font-bold ${getColorByPercentage(data.cpuMaxFree, cpuTotal, 30)}`}>
                          {formatCores(data.cpuMaxFree)}
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
                        <span className="text-xl font-bold">{data.gpusTotal}</span>
                      </p>
                      {data.gpusTotal === 0 ? (
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
                      <MemoryStick className={getColorByPercentage(data.memoryFreeTotal, memTotal, 40)} />
                      <p className="text-lg font-semibold">
                        Total free memory:{" "}
                        <span className={`text-xl font-bold ${getColorByPercentage(data.memoryFreeTotal, memTotal, 40)}`}>
                          {formatBytes(data.memoryFreeTotal)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Max free memory */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mt-2">
                      <MemoryStick className={getColorByPercentage(data.memoryMaxFree, memTotal, 40)} />
                      <p className="text-lg font-semibold">
                        Maximum free memory:{" "}
                        <span className={`text-xl font-bold ${getColorByPercentage(data.memoryMaxFree, memTotal, 40)}`}>
                          {formatBytes(data.memoryMaxFree)}
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
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-base font-medium text-gray-800 flex gap-1">
                        Deployment name: <span>{data.OSCAR.deploymentName}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-base font-medium text-gray-800 flex gap-1">
                        Created on:{" "}
                        <span>
                          {new Date(data.OSCAR.deploymentInfo.creationTimestamp).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-base font-medium text-gray-800 flex gap-1">
                        Strategy: <span>{data.OSCAR.deploymentInfo.strategy}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div
                        className={`text-base font-medium flex gap-1 ${
                          data.OSCAR.deploymentInfo.readyReplicas === data.OSCAR.deploymentInfo.replicas
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Available replicas:{" "}
                        <span>
                          {data.OSCAR.deploymentInfo.readyReplicas} / {data.OSCAR.deploymentInfo.replicas}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div
                        className={`text-base font-medium flex gap-1 ${
                          data.OSCAR.deploymentInfo.unavailableReplicas === 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Not available:{" "}
                        <span>{data.OSCAR.deploymentInfo.unavailableReplicas}</span>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              )}
            </Card>


            {/* Jobs collapsible */}
            {data.OSCAR?.jobsCount ?
              <Card className="w-full mt-6">
                <div
                  onClick={() => toggleSection("jobs")}
                  className="cursor-pointer hover:bg-gray-100 transition px-4 py-3 rounded-md flex justify-between items-center"
                >
                  <CardTitle className="text-lg font-semibold">Jobs</CardTitle>
                  {expandedSections.jobs ? <ChevronDown /> : <ChevronRight />}
                </div>

                {expandedSections.jobs && (
                  <CardContent className="flex flex-wrap md:flex-nowrap gap-4">
                    {/* Active - Blue */}
                    <Card className="flex-1 bg-blue-50 border border-blue-200">
                      <CardContent className="p-4 text-center text-blue-800 font-semibold text-lg">
                        Active{" "}
                        <span className="font-bold ml-1">
                          {data.OSCAR.jobsCount.active}
                        </span>
                      </CardContent>
                    </Card>

                    {/* Failed - Red */}
                    <Card className="flex-1 bg-rose-50 border border-rose-200">
                      <CardContent className="p-4 text-center text-rose-800 font-semibold text-lg">
                        Failed{" "}
                        <span className="font-bold ml-1">
                          {data.OSCAR.jobsCount.failed}
                        </span>
                      </CardContent>
                    </Card>

                    {/* Succeeded - Green */}
                    <Card className="flex-1 bg-emerald-50 border border-emerald-200">
                      <CardContent className="p-4 text-center text-emerald-800 font-semibold text-lg">
                        Succeeded{" "}
                        <span className="font-bold ml-1">
                          {data.OSCAR.jobsCount.succeeded}
                        </span>
                      </CardContent>
                    </Card>
                  </CardContent>
                )}
              </Card>
            : <></>}



            {/* Pods collapsible */}
            {data.OSCAR?.podsInfo?.pods ?
              <Card className="w-full mt-6">
                <div
                  onClick={() => toggleSection("pods")}
                  className="cursor-pointer hover:bg-gray-100 transition px-4 py-3 rounded-md flex justify-between items-center"
                >
                  <CardTitle className="text-lg font-semibold">Pods</CardTitle>
                  {expandedSections.pods ? <ChevronDown /> : <ChevronRight />}
                </div>

                {expandedSections.pods && (
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pod list section */}
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <h2 className="text-sm font-semibold text-gray-700">Total Pods</h2>
                        <p className="text-xl font-bold mb-2">{data.OSCAR.podsInfo.total}</p>
                        
                        {/* Pod list with bold title */}
                        <h2 className="text-sm font-semibold text-gray-700">List of Pods</h2>

                        <ul className="text-sm text-gray-800 space-y-1">
                          {data.OSCAR.podsInfo.pods.map((pod, i) => (
                            <li key={i} className="flex justify-between border-b pb-1">
                              <span className="truncate">{pod.name}</span>
                              <span
                                className={`ml-2 font-semibold ${
                                  pod.state === "Running"
                                    ? "text-green-600"
                                    : pod.state === "Failed"
                                    ? "text-red-600"
                                    : pod.state === "Succeeded"
                                    ? "text-green-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {pod.state}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Count by state */}
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <h2 className="text-sm font-semibold text-gray-700">Summary by state</h2>
                        <ul className="text-sm text-gray-800 space-y-1">
                          {Object.entries(data.OSCAR.podsInfo.states).map(([state, count], i) => {
                            let countColor = "text-gray-800";
                            if (state === "Succeeded" && count > 0) {
                              countColor = "text-green-600";
                            } else if (state === "Failed" && count > 0) {
                              countColor = "text-red-600";
                            }

                            return (
                              <li key={i} className="flex justify-between">
                                <span>{state}</span>
                                <span className={`font-semibold ${countColor}`}>{count}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </CardContent>
                    </Card>
                  </CardContent>
                )}
              </Card>
            :<></>}

          
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
                <div className="flex">
                  <Card className="w-full">
                    <CardContent className="p-4">
                      <div className={`text-base font-medium flex gap-1 ${
                        data.OSCAR.OIDC.enabled ? "text-green-600" : "text-red-600"
                      }`}>
                        OIDC enabled:{" "}
                        <span>{data.OSCAR.OIDC.enabled ? "true" : "false"}</span>
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
                          {data.OSCAR.OIDC.issuers.length > 0
                            ? data.OSCAR.OIDC.issuers.map((issuer, idx) => (
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
                          {data.OSCAR.OIDC.groups.length > 0
                            ? data.OSCAR.OIDC.groups.map((group, idx) => (
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
              Detailed information about the nodes. Currently  {data.detail?.length ?? 0} active node(s).
            </CardDescription>
          </CardHeader>
          
          {/* Info detallada de los nodos*/}
          <CardContent>
            <div className="w-full space-y-4">
              {data.detail && data.detail.map((node, index) => {
                const memoryCapacityGB = (parseInt(node.memoryCapacity) / (1024 ** 3)).toFixed(2);
                const isExpanded = expandedNodes[node.nodeName] || false;

                const isConditionError = (condition: { type: string; status: string }) => {
                  if (condition.type === "Ready") {
                    return condition.status !== "True";
                  } else {
                    return condition.status === "True";
                  }
                };

                return (
                  <Card key={index} className="space-y-2">
                    <div
                      onClick={() => toggleNode(node.nodeName)}
                      className="cursor-pointer hover:bg-gray-100 transition px-4 py-3 rounded-md flex justify-between items-center"
                    >
                      <CardTitle className="text-lg font-semibold">{node.nodeName}</CardTitle>
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
                                <p className="text-xl font-bold">{node.cpuCapacity}</p>
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

                          <div className="border rounded-lg px-3 py-5 shadow-sm">
                            <h2 className="text-lg font-semibold">Node Conditions</h2>
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
                            <DonutChart percentage={parseFloat(node.cpuPercentage)} dangerThreshold={70} />
                            <p className="text-center font-bold text-sm mt-2">
                              {node.cpuPercentage}% Used
                            </p>
                          </div>

                          <div className="border rounded-lg p-4 shadow-sm flex flex-col justify-start">
                            <h2 className="text-lg font-semibold">Memory usage</h2>
                            <DonutChart percentage={parseFloat(node.memoryPercentage)} dangerThreshold={60} />
                            <p className="text-center font-bold text-sm mt-2">
                              {node.memoryPercentage}% Used
                            </p>
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
      {data.MinIO?.buckets ? 
        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle>MinIO</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Detailed information about buckets.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="w-full">
              {/* Approximate max height showing about four cards with scroll */}
              <div className="overflow-y-auto max-h-[280px] pr-1 space-y-4">
                {data.MinIO?.buckets?.slice(0, 50).map((bucket, index) => {
                  const isExpanded = expandedBuckets[bucket.name] || false;

                  return (
                    <Card key={index} className="overflow-hidden transition-all">
                      <div
                        onClick={() => toggleBucket(bucket.name)}
                        className="cursor-pointer hover:bg-gray-100 px-4 py-3 flex justify-between items-center"
                      >
                        <CardTitle className="text-lg font-semibold">{bucket.name}</CardTitle>
                        {isExpanded ? <ChevronDown /> : <ChevronRight />}
                      </div>

                      {isExpanded && (
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mt-2">
                          <div className="space-y-1">
                            <h2 className="text-base font-semibold text-gray-800">Policy</h2>
                            <p className="text-sm font-normal text-gray-600">
                              {bucket.policy_type || "Not defined"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <h2 className="text-base font-semibold text-gray-800">Owner</h2>
                            <p className="text-sm font-normal text-gray-600">
                              {bucket.owner || "Unknown"}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <h2 className="text-base font-semibold text-gray-800">Creation date</h2>
                            <p className="text-sm font-normal text-gray-600">
                              {new Date(bucket.creation_date).toLocaleString()}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <h2 className="text-base font-semibold text-gray-800">Space used</h2>
                            <p className="text-sm font-normal text-gray-600">
                              {formatKilobytes(bucket.size)} 
                            </p>
                          </div>

                          <div className="space-y-1">
                            <h2 className="text-base font-semibold text-gray-800">Number of items</h2>
                            <p className="text-sm font-normal text-gray-600">
                              {bucket.num_objects}
                            </p>
                          </div>

                          {bucket.members && (
                            <div className="md:col-span-2 space-y-1">
                              <h2 className="text-base font-semibold text-gray-800">Members with access</h2>
                              <ul className="list-disc ml-4 text-sm font-normal text-gray-600">
                                {bucket.members.map((member, i) => (
                                  <li key={i}>{member}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      : <></>}
      <div className="h-2" />
      </div>
      }
    </div>
  );
};

export default Cluster;
