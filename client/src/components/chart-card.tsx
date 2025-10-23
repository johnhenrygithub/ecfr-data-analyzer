import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function ChartCard({ title, description, icon: Icon, children }: ChartCardProps) {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="w-full">
        {children}
      </div>
    </Card>
  );
}
