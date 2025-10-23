import { Button } from "@/components/ui/button";
import { FileDown, FileJson } from "lucide-react";

interface ExportButtonsProps {
  onExportCSV: () => void;
  onExportJSON: () => void;
  disabled?: boolean;
}

export function ExportButtons({ onExportCSV, onExportJSON, disabled }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onExportCSV}
        disabled={disabled}
        data-testid="button-export-csv"
      >
        <FileDown className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportJSON}
        disabled={disabled}
        data-testid="button-export-json"
      >
        <FileJson className="h-4 w-4 mr-2" />
        Export JSON
      </Button>
    </div>
  );
}
