import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, color = "border-t-primary" }: MetricCardProps) {
  return (
    <Card className={`p-6 border-t-4 ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className="h-5 w-5 text-muted-foreground" data-testid={`icon-${title.toLowerCase().replace(/\s+/g, '-')}`} />
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-bold font-mono" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {value}
        </div>
        {trend && (
          <div className={`text-sm flex items-center gap-1 ${trend.positive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
