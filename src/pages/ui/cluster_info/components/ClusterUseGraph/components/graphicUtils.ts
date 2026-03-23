import { ClusterLog } from "@/models/clusterLogs";

export type Scale = 'seconds' | 'minutes' | 'hours' | 'days';
export type DatasetType = 'avgLatency' | 'invocations';

export const DATASET_LABELS: Record<DatasetType, string> = {
  invocations: 'Invocations',
  avgLatency: 'Avg. Latency (ms)',
};

export function groupLogsByLabel(
  logs: ClusterLog[],
  scale: Scale
): Map<string, ClusterLog[]> {
  const map = new Map<string, ClusterLog[]>();
  for (const log of logs) {
    const label = formatTimestamp(log.timestamp, scale);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(log);
  }
  return map;
}

function formatTimestamp(timestamp: string, scale: Scale): string {
  switch (scale) {
    case 'seconds': return reduceToSecond(timestamp);
    case 'minutes': return reduceToMinute(timestamp);
    case 'hours':   return reduceToHour(timestamp);
    case 'days':    return reduceToDay(timestamp);
  }
}

const reduceToDay = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const reduceToHour = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit' });
};

const reduceToMinute = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const reduceToSecond = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};


