import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { ExportButtons } from "@/components/export-buttons";
import { TableSkeleton } from "@/components/loading-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Footer } from "@/components/footer";
import type { AgencyAnalysis } from "@shared/schema";

export default function Analysis() {
  const { toast } = useToast();

  const { data: agencies, isLoading } = useQuery<AgencyAnalysis[]>({
    queryKey: ['/api/analysis/agencies'],
  });

  const handleExportCSV = () => {
    if (!agencies || agencies.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Agency', 'Total Words', 'Avg Words', 'Regulations', 'RCI', 'Avg Sentence Length', 'Vocabulary Diversity', 'Checksum'];
    const rows = agencies.map(a => [
      a.agency,
      a.totalWordCount,
      a.averageWordCount,
      a.regulationCount,
      a.rci.toFixed(2),
      a.avgSentenceLength.toFixed(2),
      a.vocabularyDiversity.toFixed(4),
      a.checksum,
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecfr-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CSV Exported",
      description: "Analysis data exported successfully.",
    });
  };

  const handleExportJSON = () => {
    if (!agencies || agencies.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }

    const json = JSON.stringify(agencies, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecfr-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "JSON Exported",
      description: "Analysis data exported successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analysis Results</h1>
              <p className="text-muted-foreground">
                Comprehensive regulatory analysis across all agencies
              </p>
            </div>
            <ExportButtons
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
              disabled={isLoading || !agencies || agencies.length === 0}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="wordcount" data-testid="tab-wordcount">Word Count</TabsTrigger>
            <TabsTrigger value="complexity" data-testid="tab-complexity">Complexity</TabsTrigger>
            <TabsTrigger value="checksums" data-testid="tab-checksums">Checksums</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {isLoading ? (
              <TableSkeleton rows={10} />
            ) : (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">All Agencies - Complete Analysis</h2>
                <DataTable
                  columns={[
                    { header: 'Agency', accessor: 'agency', sortable: true },
                    { header: 'Regulations', accessor: 'regulationCount', sortable: true, mono: true },
                    { header: 'Total Words', accessor: (row) => row.totalWordCount.toLocaleString(), sortable: true },
                    { header: 'Avg Words', accessor: (row) => Math.round(row.averageWordCount).toLocaleString(), sortable: true },
                    { header: 'RCI', accessor: (row) => row.rci.toFixed(2), sortable: true, mono: true },
                  ]}
                  data={agencies || []}
                  testId="table-overview"
                />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="wordcount">
            {isLoading ? (
              <TableSkeleton rows={10} />
            ) : (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Word Count Analysis</h2>
                <DataTable
                  columns={[
                    { header: 'Agency', accessor: 'agency', sortable: true },
                    { header: 'Total Words', accessor: (row) => row.totalWordCount.toLocaleString(), sortable: true },
                    { header: 'Average Words', accessor: (row) => Math.round(row.averageWordCount).toLocaleString(), sortable: true },
                    { header: 'Regulations', accessor: 'regulationCount', sortable: true, mono: true },
                  ]}
                  data={agencies || []}
                  testId="table-wordcount"
                />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="complexity">
            {isLoading ? (
              <TableSkeleton rows={10} />
            ) : (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Regulatory Complexity Index</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  RCI = Average Sentence Length × Vocabulary Diversity (unique words / total words)
                </p>
                <DataTable
                  columns={[
                    { header: 'Agency', accessor: 'agency', sortable: true },
                    { header: 'RCI Score', accessor: (row) => row.rci.toFixed(2), sortable: true, mono: true },
                    { header: 'Avg Sentence Length', accessor: (row) => row.avgSentenceLength.toFixed(2), sortable: true, mono: true },
                    { header: 'Vocabulary Diversity', accessor: (row) => row.vocabularyDiversity.toFixed(4), sortable: true, mono: true },
                  ]}
                  data={agencies || []}
                  testId="table-complexity"
                />
              </Card>
            )}
          </TabsContent>

          <TabsContent value="checksums">
            {isLoading ? (
              <TableSkeleton rows={10} />
            ) : (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-6">Data Integrity Checksums</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  SHA-256 checksums for detecting content changes
                </p>
                <DataTable
                  columns={[
                    { header: 'Agency', accessor: 'agency', sortable: true },
                    { header: 'Checksum', accessor: 'checksum', mono: true },
                    { header: 'Regulations', accessor: 'regulationCount', sortable: true, mono: true },
                  ]}
                  data={agencies || []}
                  testId="table-checksums"
                />
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
