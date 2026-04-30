import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

type QuotaMetricCardProps = {
  icon: ReactNode;
  label: string;
  max: string;
  used?: string;
  percentage?: number;
};

function QuotaMetricCard({ icon, label, max, used, percentage }: QuotaMetricCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span className="text-slate-900 dark:text-slate-50">{icon}</span>
            <span className="truncate">{label}</span>
          </div>
          {percentage !== undefined && (
            <Badge variant={percentage >= 80 ? "destructive" : "secondary"}>{percentage}% used</Badge>
          )}
        </div>

        <div className="mt-3 text-xl font-semibold text-slate-950 dark:text-slate-50">{max}</div>
        {used !== undefined && (
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Used: {used}</div>
        )}
        {percentage !== undefined && (
          <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-2 rounded-full ${percentage >= 80 ? "bg-red-500" : "bg-[#009688]"}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuotaMetricCard;
