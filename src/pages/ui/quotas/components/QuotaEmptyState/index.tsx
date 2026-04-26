import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

type QuotaEmptyStateProps = {
  hasSearched: boolean;
  adminMode: boolean;
};

function QuotaEmptyState({ hasSearched, adminMode }: QuotaEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-[280px] items-center justify-center px-4 py-8">
        <div className="max-w-[520px] text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            <Search size={22} />
          </div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
            {hasSearched ? "No quota loaded" : adminMode ? "Load a user quota" : "Your quota will appear here"}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {adminMode
              ? "Enter the exact user ID and load the current quota from /system/quotas/user."
              : "Use refresh to load your current quota from /system/quotas/user."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default QuotaEmptyState;
