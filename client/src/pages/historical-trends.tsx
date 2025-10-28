import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, BarChart3, Hash, Type, Brain } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartCard } from "@/components/chart-card";
import { ChartSkeleton } from "@/components/loading-skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface TrendData {
  year: number;
  date: string;
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  vocabularyDiversity: number;
  uniqueWords: number;
  rci: number;
}

interface HistoricalResponse {
  titleNumber: number;
  titleName: string;
  trends: TrendData[];
  startYear: number;
  endYear: number;
}

// All CFR title numbers (excluding 35 which doesn't exist)
const ALL_TITLES = [
  { number: 1, name: "General Provisions" },
  { number: 2, name: "The President" },
  { number: 3, name: "Grants and Agreements" },
  { number: 4, name: "Accounts" },
  { number: 5, name: "Administrative Personnel" },
  { number: 6, name: "Domestic Security" },
  { number: 7, name: "Agriculture" },
  { number: 8, name: "Aliens and Nationality" },
  { number: 9, name: "Animals and Animal Products" },
  { number: 10, name: "Energy" },
  { number: 11, name: "Federal Elections" },
  { number: 12, name: "Banks and Banking" },
  { number: 13, name: "Business Credit and Assistance" },
  { number: 14, name: "Aeronautics and Space" },
  { number: 15, name: "Commerce and Foreign Trade" },
  { number: 16, name: "Commercial Practices" },
  { number: 17, name: "Commodity and Securities Exchanges" },
  { number: 18, name: "Conservation of Power and Water Resources" },
  { number: 19, name: "Customs Duties" },
  { number: 20, name: "Employees' Benefits" },
  { number: 21, name: "Food and Drugs" },
  { number: 22, name: "Foreign Relations" },
  { number: 23, name: "Highways" },
  { number: 24, name: "Housing and Urban Development" },
  { number: 25, name: "Indians" },
  { number: 26, name: "Internal Revenue" },
  { number: 27, name: "Alcohol, Tobacco Products and Firearms" },
  { number: 28, name: "Judicial Administration" },
  { number: 29, name: "Labor" },
  { number: 30, name: "Mineral Resources" },
  { number: 31, name: "Money and Finance: Treasury" },
  { number: 32, name: "National Defense" },
  { number: 33, name: "Navigation and Navigable Waters" },
  { number: 34, name: "Education" },
  { number: 36, name: "Parks, Forests, and Public Property" },
  { number: 37, name: "Patents, Trademarks, and Copyrights" },
  { number: 38, name: "Pensions, Bonuses, and Veterans' Relief" },
  { number: 39, name: "Postal Service" },
  { number: 40, name: "Protection of Environment" },
  { number: 41, name: "Public Contracts and Property Management" },
  { number: 42, name: "Public Health" },
  { number: 43, name: "Public Lands: Interior" },
  { number: 44, name: "Emergency Management and Assistance" },
  { number: 45, name: "Public Welfare" },
  { number: 46, name: "Shipping" },
  { number: 47, name: "Telecommunication" },
  { number: 48, name: "Federal Acquisition Regulations System" },
  { number: 49, name: "Transportation" },
  { number: 50, name: "Wildlife and Fisheries" },
];

export default function HistoricalTrends() {
  const { toast } = useToast();
  const [selectedTitle, setSelectedTitle] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingYear, setProcessingYear] = useState<number | null>(null);
  const [totalYears, setTotalYears] = useState<number>(0);

  const currentYearValue = new Date().getFullYear();
  // Default to last 5 years for faster loading (user can adjust if needed)
  const startYear = currentYearValue - 4; // Last 5 years including current

  const { data: historicalData, refetch } = useQuery<HistoricalResponse>({
    queryKey: ['/api/historical/title', selectedTitle, startYear, currentYearValue],
    queryFn: async () => {
      if (!selectedTitle) throw new Error("No title selected");
      const response = await fetch(`/api/historical/title/${selectedTitle}?start_year=${startYear}&end_year=${currentYearValue}`);
      if (!response.ok) throw new Error("Failed to fetch historical data");
      return response.json();
    },
    enabled: false, // Don't auto-fetch, only on button click
  });

  const handleLoadTrends = async () => {
    if (!selectedTitle) return;

    setIsLoading(true);
    setProcessingYear(null);
    setTotalYears(currentYearValue - startYear + 1);

    // Simulate progress updates (since we can't get real-time progress from backend)
    const progressInterval = setInterval(() => {
      setProcessingYear(prev => {
        if (prev === null) return startYear;
        if (prev >= currentYearValue) return prev;
        return prev + 1;
      });
    }, 2000);

    try {
      const result = await refetch();
      
      // Check if we got any data back
      if (!result.data || result.data.trends.length === 0) {
        toast({
          title: "Historical Data Unavailable",
          description: "The eCFR API's historical data service is experiencing issues. Please try again later or select a different title.",
          variant: "destructive",
        });
      } else if (result.data.trends.length < (currentYearValue - startYear + 1)) {
        toast({
          title: "Partial Data Retrieved",
          description: `Only ${result.data.trends.length} of ${currentYearValue - startYear + 1} years could be fetched. The eCFR API may be experiencing issues.`,
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Load Historical Data",
        description: "The eCFR API is not responding. This service may be temporarily unavailable.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
      setProcessingYear(null);
    }
  };

  const trends = historicalData?.trends || [];
  
  // Calculate growth rate with guards against division by zero
  const growthData = trends.map((trend, idx) => {
    if (idx === 0) return { ...trend, growthRate: 0 };
    const prevWordCount = trends[idx - 1].wordCount;
    // Guard against division by zero or missing data
    if (!prevWordCount || prevWordCount === 0) {
      return { ...trend, growthRate: 0 };
    }
    const growthRate = ((trend.wordCount - prevWordCount) / prevWordCount) * 100;
    return { ...trend, growthRate };
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-2">Historical Trends</h1>
          <p className="text-lg text-muted-foreground">
            View annual changes in CFR regulations over the last 5 years
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Title Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select CFR Title</CardTitle>
            <CardDescription>
              Choose a title to view annual trends from the last 5 years. Processing time: 5-15 seconds for small titles, 1-2 minutes for Title 40.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select
                  value={selectedTitle?.toString() || ""}
                  onValueChange={(value) => setSelectedTitle(parseInt(value))}
                  disabled={isLoading}
                >
                  <SelectTrigger data-testid="select-title">
                    <SelectValue placeholder="Select a title..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_TITLES.map((title) => (
                      <SelectItem key={title.number} value={title.number.toString()}>
                        Title {title.number}: {title.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleLoadTrends}
                disabled={!selectedTitle || isLoading}
                size="lg"
                data-testid="button-load-trends"
              >
                <TrendingUp className={`h-4 w-4 mr-2 ${isLoading ? 'animate-pulse' : ''}`} />
                Load Trends
              </Button>
            </div>

            {/* Progress Indicator */}
            {isLoading && processingYear && (
              <div className="mt-6 space-y-2" data-testid="progress-indicator">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Processing year {processingYear}...
                  </span>
                  <span className="font-medium">
                    {processingYear - startYear + 1} / {totalYears}
                  </span>
                </div>
                <Progress 
                  value={((processingYear - startYear + 1) / totalYears) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : trends.length > 0 ? (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {historicalData?.titleName}
              </h2>
              <p className="text-muted-foreground">
                Showing trends from {historicalData?.startYear} to {historicalData?.endYear} ({trends.length} data points)
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Word Count Over Time */}
              <ChartCard
                title="Word Count Evolution"
                description="Total word count changes over time"
                icon={Hash}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="year" 
                      className="text-xs"
                    />
                    <YAxis 
                      className="text-xs"
                      tickFormatter={formatNumber}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="wordCount" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      name="Word Count"
                      dot={{ fill: 'hsl(var(--chart-1))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Complexity (RCI) Over Time */}
              <ChartCard
                title="Regulatory Complexity Index (RCI)"
                description="Complexity trend analysis"
                icon={Brain}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="year" 
                      className="text-xs"
                    />
                    <YAxis 
                      className="text-xs"
                      tickFormatter={(value) => value.toFixed(1)}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      formatter={(value: number) => value.toFixed(2)}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rci" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                      name="RCI"
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Sentence Count Over Time */}
              <ChartCard
                title="Sentence Count Trends"
                description="Total sentences over time"
                icon={Type}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="year" 
                      className="text-xs"
                    />
                    <YAxis 
                      className="text-xs"
                      tickFormatter={formatNumber}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sentenceCount" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                      name="Sentences"
                      dot={{ fill: 'hsl(var(--chart-3))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Annual Growth Rate */}
              <ChartCard
                title="Annual Growth Rate"
                description="Year-over-year percentage change"
                icon={BarChart3}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="year" 
                      className="text-xs"
                    />
                    <YAxis 
                      className="text-xs"
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      formatter={(value: number) => `${value.toFixed(2)}%`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="growthRate" 
                      stroke="hsl(var(--chart-4))" 
                      strokeWidth={2}
                      name="Growth Rate (%)"
                      dot={{ fill: 'hsl(var(--chart-4))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                Select a title and click "Load Trends" to view historical data
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
