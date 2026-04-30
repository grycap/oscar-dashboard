import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function QuotaLoadingState() {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="p-4 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-full max-w-[360px]" />
        </CardHeader>
        <CardContent className="flex justify-end gap-2 p-4 pt-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-7 w-24" />
              <Skeleton className="mt-2 h-4 w-28" />
              <Skeleton className="mt-3 h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default QuotaLoadingState;
