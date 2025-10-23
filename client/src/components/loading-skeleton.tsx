import { Card } from "@/components/ui/card";

export function MetricSkeleton() {
  return (
    <Card className="p-6 border-t-4 border-t-muted">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-5 w-5 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-8 w-32 bg-muted animate-pulse rounded" />
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-64 bg-muted/50 animate-pulse rounded" />
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="p-6">
      <div className="h-6 w-48 bg-muted animate-pulse rounded mb-6" />
      <div className="space-y-3">
        <div className="grid grid-cols-5 gap-4 pb-3 border-b">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted animate-pulse rounded" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-4 bg-muted/50 animate-pulse rounded" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
