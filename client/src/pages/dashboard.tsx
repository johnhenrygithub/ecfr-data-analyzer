import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/metric-card";
import { ChartCard } from "@/components/chart-card";
import { MetricSkeleton, ChartSkeleton } from "@/components/loading-skeleton";
import { Building2, FileText, Clock, Hash, RefreshCw, BarChart3, TrendingUp, PieChart, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RePieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import type { AgencyAnalysis, FetchMetadata } from "@shared/schema";

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const { data: metadata, isLoading: metadataLoading, refetch: refetchMetadata } = useQuery<FetchMetadata>({
    queryKey: ['/api/metadata'],
  });

  const { data: agencies, isLoading: agenciesLoading, refetch: refetchAgencies } = useQuery<AgencyAnalysis[]>({
    queryKey: ['/api/analysis/agencies'],
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await apiRequest('POST', '/api/fetch', {});
      toast({
        title: "Data Refresh Started",
        description: "Fetching all CFR titles from the eCFR API. This will take several minutes.",
      });
    } catch (error) {
      setIsRefreshing(false);
      toast({
        title: "Refresh Failed",
        description: "Failed to start eCFR data fetch. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Poll for progress updates when refreshing
  useEffect(() => {
    if (!isRefreshing) return;

    const pollInterval = setInterval(async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/metadata'] });
      const currentMetadata = queryClient.getQueryData<FetchMetadata>(['/api/metadata']);
      
      if (currentMetadata?.status === 'success' || currentMetadata?.status === 'error') {
        setIsRefreshing(false);
        await queryClient.invalidateQueries({ queryKey: ['/api/analysis/agencies'] });
        
        if (currentMetadata.status === 'success') {
          toast({
            title: "Data Refreshed",
            description: `Successfully loaded ${currentMetadata.totalRegulations} CFR titles.`,
          });
        } else {
          toast({
            title: "Refresh Failed",
            description: currentMetadata.errorMessage || "An error occurred during fetch.",
            variant: "destructive",
          });
        }
        clearInterval(pollInterval);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [isRefreshing, toast]);

  const totalAgencies = agencies?.length || 0;
  const totalWords = agencies?.reduce((sum, a) => sum + a.totalWordCount, 0) || 0;
  const avgRCI = agencies && agencies.length > 0
    ? (agencies.reduce((sum, a) => sum + a.rci, 0) / agencies.length).toFixed(2)
    : '0.00';

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const topAgenciesByWords = agencies?.slice().sort((a, b) => b.totalWordCount - a.totalWordCount).slice(0, 10) || [];
  const topAgenciesByRCI = agencies?.slice().sort((a, b) => b.rci - a.rci).slice(0, 10) || [];
  
  const pieData = agencies?.slice().sort((a, b) => b.regulationCount - a.regulationCount).slice(0, 5).map(a => ({
    name: a.agency,
    value: a.regulationCount,
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">eCFR Data Analyzer</h1>
              <p className="text-lg text-muted-foreground">
                Analyze U.S. Electronic Code of Federal Regulations with advanced metrics and insights
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {metadata && (
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Last updated: {new Date(metadata.lastFetchAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                size="lg"
                data-testid="button-refresh-data"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
            </div>
          </div>
          
          {/* Progress Indicator */}
          {metadata?.status === 'in_progress' && metadata.progressTotal && metadata.progressTotal > 0 && (
            <div className="mt-6 space-y-2" data-testid="progress-indicator">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {metadata.currentTitle || 'Loading...'}
                </span>
                <span className="font-medium">
                  {metadata.progressCurrent || 0} / {metadata.progressTotal}
                </span>
              </div>
              <Progress 
                value={((metadata.progressCurrent || 0) / metadata.progressTotal) * 100} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metadataLoading || agenciesLoading ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Agencies"
                value={totalAgencies}
                icon={Building2}
                color="border-t-chart-1"
              />
              <MetricCard
                title="Total Regulations"
                value={metadata?.totalRegulations.toLocaleString() || '0'}
                icon={FileText}
                color="border-t-chart-2"
              />
              <MetricCard
                title="Total Words"
                value={totalWords.toLocaleString()}
                icon={Hash}
                color="border-t-chart-3"
              />
              <MetricCard
                title="Avg Complexity (RCI)"
                value={avgRCI}
                icon={Activity}
                color="border-t-chart-4"
              />
            </>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Word Count Chart */}
          {agenciesLoading ? (
            <ChartSkeleton />
          ) : (
            <ChartCard
              title="Word Count by Agency"
              description="Top 10 agencies by total word count"
              icon={BarChart3}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topAgenciesByWords}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis
                    dataKey="agency"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="totalWordCount" fill="hsl(var(--chart-1))" name="Total Words" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* RCI Chart */}
          {agenciesLoading ? (
            <ChartSkeleton />
          ) : (
            <ChartCard
              title="Regulatory Complexity Index"
              description="Top 10 agencies by RCI (sentence length × vocabulary diversity)"
              icon={TrendingUp}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topAgenciesByRCI}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis
                    dataKey="agency"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="rci" fill="hsl(var(--chart-2))" name="RCI Score" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Regulation Count Distribution */}
          {agenciesLoading ? (
            <ChartSkeleton />
          ) : (
            <ChartCard
              title="Regulation Distribution"
              description="Top 5 agencies by number of regulations"
              icon={PieChart}
            >
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Vocabulary Diversity Chart */}
          {agenciesLoading ? (
            <ChartSkeleton />
          ) : (
            <ChartCard
              title="Vocabulary Diversity"
              description="Average sentence length vs vocabulary diversity by agency"
              icon={Activity}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={topAgenciesByRCI}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis
                    dataKey="agency"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avgSentenceLength" stroke="hsl(var(--chart-3))" name="Avg Sentence Length" strokeWidth={2} />
                  <Line type="monotone" dataKey="vocabularyDiversity" stroke="hsl(var(--chart-4))" name="Vocabulary Diversity" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </div>
    </div>
  );
}
