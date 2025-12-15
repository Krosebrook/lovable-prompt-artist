import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { MetricsCard } from "@/components/analytics/MetricsCard";
import { ChartWrapper } from "@/components/analytics/ChartWrapper";
import { ActivityTimeline } from "@/components/analytics/ActivityTimeline";
import { FileText, Image, Share2, Eye } from "lucide-react";
import { format, subDays } from "date-fns";

const Analytics = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    scriptsGenerated: 0,
    storyboardsGenerated: 0,
    totalShares: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadAnalytics();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load analytics events
      const { data: analytics } = await (supabase as any)
        .from('project_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analytics) {
        // Calculate metrics
        const uniqueProjects = new Set(analytics.map((a: any) => a.project_id)).size;
        const scripts = analytics.filter((a: any) => a.event_type === 'script_generated').length;
        const storyboards = analytics.filter((a: any) => a.event_type === 'storyboard_generated').length;
        const shares = analytics.filter((a: any) => a.event_type === 'project_shared').length;

        setMetrics({
          totalProjects: uniqueProjects,
          scriptsGenerated: scripts,
          storyboardsGenerated: storyboards,
          totalShares: shares
        });

        // Prepare chart data (last 30 days)
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const date = subDays(new Date(), 29 - i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const count = analytics.filter((a: any) => 
            format(new Date(a.created_at), 'yyyy-MM-dd') === dateStr
          ).length;
          return {
            date: format(date, 'MMM dd'),
            value: count
          };
        });

        setChartData(last30Days);
        setRecentActivity(analytics.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <MetricsCard
            title="Total Projects"
            value={metrics.totalProjects}
            icon={FileText}
          />
          <MetricsCard
            title="Scripts Generated"
            value={metrics.scriptsGenerated}
            icon={FileText}
          />
          <MetricsCard
            title="Storyboards Created"
            value={metrics.storyboardsGenerated}
            icon={Image}
          />
          <MetricsCard
            title="Projects Shared"
            value={metrics.totalShares}
            icon={Share2}
          />
        </div>

        {/* Chart */}
        <div className="mb-8">
          <ChartWrapper
            title="Activity Over Time"
            description="Your activity in the last 30 days"
            data={chartData}
          />
        </div>

        {/* Recent Activity */}
        <ActivityTimeline activities={recentActivity} />
      </div>
    </div>
  );
};

export default Analytics;
