import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckSquare, Square } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import type { FetchMetadata, AgencyAnalysis } from "@shared/schema";

interface CFRTitle {
  number: number;
  name: string;
  reserved: boolean;
  latest_issue_date: string;
}

export default function Titles() {
  const { toast } = useToast();
  const [selectedTitles, setSelectedTitles] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: agencies = [] } = useQuery<AgencyAnalysis[]>({
    queryKey: ['/api/analysis/agencies'],
  });

  const { data: metadata } = useQuery<FetchMetadata>({
    queryKey: ['/api/metadata'],
  });

  const { data: allTitles = [], isLoading } = useQuery<CFRTitle[]>({
    queryKey: ['/api/ecfr/titles'],
    queryFn: async () => {
      const response = await fetch('https://www.ecfr.gov/api/versioner/v1/titles');
      if (!response.ok) throw new Error('Failed to fetch titles');
      const data = await response.json();
      return data.titles || [];
    },
  });

  // Poll for progress updates when refreshing
  useEffect(() => {
    if (!isRefreshing) return;

    const pollInterval = setInterval(async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/metadata'] });
      const currentMetadata = queryClient.getQueryData<FetchMetadata>(['/api/metadata']);
      
      if (currentMetadata?.status === 'success' || currentMetadata?.status === 'error') {
        setIsRefreshing(false);
        // Invalidate all relevant queries to ensure all pages show updated data
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['/api/analysis/agencies'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/analysis/wordcount'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/analysis/checksums'] }),
        ]);
        
        if (currentMetadata.status === 'success') {
          toast({
            title: "Titles Refreshed",
            description: `Successfully refreshed ${selectedTitles.size} title(s).`,
          });
          setSelectedTitles(new Set());
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
  }, [isRefreshing, selectedTitles.size, toast]);

  const handleToggleTitle = (titleNumber: number) => {
    const newSelected = new Set(selectedTitles);
    if (newSelected.has(titleNumber)) {
      newSelected.delete(titleNumber);
    } else {
      newSelected.add(titleNumber);
    }
    setSelectedTitles(newSelected);
  };

  const handleSelectAll = () => {
    const validTitles = allTitles.filter(t => !t.reserved);
    setSelectedTitles(new Set(validTitles.map(t => t.number)));
  };

  const handleDeselectAll = () => {
    setSelectedTitles(new Set());
  };

  const handleRefreshSelected = async () => {
    if (selectedTitles.size === 0) {
      toast({
        title: "No Titles Selected",
        description: "Please select at least one title to refresh.",
        variant: "destructive",
      });
      return;
    }

    setIsRefreshing(true);
    try {
      await apiRequest('POST', '/api/fetch', {
        titleNumbers: Array.from(selectedTitles),
      });
      toast({
        title: "Refresh Started",
        description: `Refreshing ${selectedTitles.size} selected title(s). This may take a few minutes.`,
      });
    } catch (error) {
      setIsRefreshing(false);
      toast({
        title: "Refresh Failed",
        description: "Failed to start title refresh. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Map agency names to loaded titles
  const loadedTitleNames = new Set(agencies.map(a => a.agency));

  const validTitles = allTitles.filter(t => !t.reserved);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Manage CFR Titles</h1>
              <p className="text-muted-foreground">
                Select specific titles to refresh from the eCFR database
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSelectAll}
                disabled={isRefreshing}
                data-testid="button-select-all"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select All
              </Button>
              <Button
                variant="outline"
                onClick={handleDeselectAll}
                disabled={isRefreshing || selectedTitles.size === 0}
                data-testid="button-deselect-all"
              >
                <Square className="h-4 w-4 mr-2" />
                Deselect All
              </Button>
              <Button
                onClick={handleRefreshSelected}
                disabled={isRefreshing || selectedTitles.size === 0}
                data-testid="button-refresh-selected"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Selected ({selectedTitles.size})
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

      {/* Titles List */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Available Titles ({validTitles.length} total, {loadedTitleNames.size} loaded)
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading titles from eCFR API...
            </div>
          ) : (
            <div className="space-y-2">
              {validTitles.map((title) => {
                const isLoaded = loadedTitleNames.has(title.name);
                const isSelected = selectedTitles.has(title.number);

                return (
                  <div
                    key={title.number}
                    className="flex items-center gap-4 p-4 border rounded-lg hover-elevate transition-colors"
                    data-testid={`title-item-${title.number}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleTitle(title.number)}
                      disabled={isRefreshing}
                      data-testid={`checkbox-title-${title.number}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">Title {title.number}</span>
                        <span className="text-muted-foreground">{title.name}</span>
                        {isLoaded && (
                          <Badge variant="secondary" data-testid={`badge-loaded-${title.number}`}>
                            Loaded
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Latest issue: {new Date(title.latest_issue_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
