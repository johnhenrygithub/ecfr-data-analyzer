import { Link, useLocation } from "wouter";
import { BarChart3, FileText, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold hover-elevate px-3 py-1 rounded-md" data-testid="link-home">
              eCFR Data Analyzer
            </Link>
            <div className="flex gap-2">
              <Link href="/">
                <Button
                  variant={location === '/' ? 'secondary' : 'ghost'}
                  size="sm"
                  data-testid="link-dashboard"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/analysis">
                <Button
                  variant={location === '/analysis' ? 'secondary' : 'ghost'}
                  size="sm"
                  data-testid="link-analysis"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Analysis
                </Button>
              </Link>
              <Link href="/titles">
                <Button
                  variant={location === '/titles' ? 'secondary' : 'ghost'}
                  size="sm"
                  data-testid="link-titles"
                >
                  <List className="h-4 w-4 mr-2" />
                  Titles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
