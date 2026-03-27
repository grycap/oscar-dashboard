import { getClusterServiceLogsApi } from "@/api/logs/getClusterServiceLogs";
import ExpandCard from "@/components/ExpandCard";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { ClusterLog } from "@/models/clusterLogs";
import { AlertCircle, LoaderPinwheel, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartData, ChartOptions } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DATASET_LABELS, DatasetType, groupLogsByLabel, Scale } from "./components/graphicUtils";


import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import zoomPlugin from 'chartjs-plugin-zoom';
import OscarColors from "@/styles";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  zoomPlugin
);

export interface LineProps {
  options: ChartOptions<'line'>;
  data: ChartData<'line'>;
}

const lineChartOptions: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Cluster Usage Over Time',
    },
    zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'xy',
        }
      }
  },
};





function ClusterUseGraph() {
  const [expandedSections, setExpandedSections] = useState(false);
  const [logs, setLogs] = useState<Array<ClusterLog>>([]);
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [scale, setScale] = useState<Scale>('seconds');
  const [datasetType, setDatasetType] = useState<DatasetType>('avgLatency');
  const chartRef = useRef<any>(null);

  const chartData = useMemo<LineProps>(() => {
    let labels: string[];
    let data: number[];

    const grouped = groupLogsByLabel(logs, scale);
    labels = Array.from(grouped.keys());
    if (datasetType === 'avgLatency') {
      data = Array.from(grouped.values()).map(group => {
        const sum = group.reduce((acc, l) => acc + (parseFloat(l.latency) || 0), 0);
        return Math.round((sum / group.length) * 100) / 100;
      });
    } else {
      data = Array.from(grouped.values()).map(group => group.length);
    }

    return {
      options: lineChartOptions,
      data: {
        labels,
        datasets: [
          {
            label: DATASET_LABELS[datasetType],
            data,
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
          },
        ],
      },
    };
  }, [logs, scale, datasetType]);

  function loadLogs() {
    setLoading(true);
    getClusterServiceLogsApi().then((logs) => {
      setLogs(Array.isArray(logs) ? logs : []);
    }).catch(() => {
      setLoadingError(true);
    }).finally(() => {
      setLoading(false);
    });
  }

  useEffect(() => {
    if (!expandedSections) return;
    loadLogs();
  }, [expandedSections]);


  function loadingErrorView() {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 text-red-600">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm font-medium">Failed to load logs</p>
        <button
          onClick={loadLogs}
          className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  function loadingAnimation() {
    return (
      <div className="flex justify-center items-center">
        <LoaderPinwheel className="animate-spin" size={40} color={OscarColors.Green3} />
      </div>
    );
  }

  return (
    <ExpandCard title="Usage Graphic" className="w-full mt-6" setExpandedState={setExpandedSections}>
      <CardContent className="grid grid-cols-1 gap-4 mt-5">
        <Card>
          <CardContent className="p-4 flex flex-col gap-4 overflow-x-auto">
            <div className="grid grid-rows-[auto_1fr_auto] gap-4 min-h-[300px] min-w-[500px]">
              {/* Top toolbar */}
              <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide pr-1">Info</span>
                  <Separator orientation="vertical" className="h-5" />
                  {(Object.keys(DATASET_LABELS) as DatasetType[]).map((d) => (
                    <Button
                      key={d}
                      variant={datasetType === d ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setDatasetType(d)}
                      className={datasetType === d ? '' : 'text-gray-500 hover:text-gray-800'}
                    >
                      {DATASET_LABELS[d]}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadLogs}
                  disabled={loading}
                  className="h-8 w-8 shrink-0"
                  tooltipLabel="Refresh logs"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </Button>
              </div>

              {/* Chart */}
              {expandedSections && !loading && loadingError && loadingErrorView()}
              {loading && loadingAnimation()}
              {!loading && !loadingError && (
              <Line className="min-h-20" ref={chartRef} options={chartData.options} data={chartData.data} />
              )}

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide pr-1">Scale</span>
                  <Separator orientation="vertical" className="h-5" />
                  {(['seconds', 'minutes', 'hours', 'days'] as Scale[]).map((s) => (
                    <Button
                      key={s}
                      variant={scale === s ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setScale(s)}
                      className={`capitalize ${scale === s ? '' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => chartRef.current?.resetZoom()}
                  className="text-blue-400 hover:text-blue-700"
                >
                  Reset Zoom
                </Button>
              </div>
            </div>
            
          </CardContent>
        </Card>
      </CardContent>
    </ExpandCard>
  );
  
}

export default ClusterUseGraph;