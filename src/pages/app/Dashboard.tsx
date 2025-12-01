/**
 * DASHBOARD PAGE COMPONENT
 * 
 * Main dashboard displaying campaign analytics, statistics, and recent activity.
 * Includes real-time metrics and performance chart visualization.
 * 
 * FEATURES:
 * - Real-time statistics (total sent, open rate, click rate, active contacts)
 * - Performance chart showing open/click rates over time
 * - Recent campaigns list
 * - Quick action buttons
 * - Auto-refresh every 30 seconds
 * 
 * DATA SOURCES:
 * - Campaigns table: Aggregated campaign metrics
 * - Email_events table: Individual event data for time-series analytics
 * - Contacts table: Active contact count
 */

import { useState, useEffect } from "react";
import { TrendingUp, Mail, Users, MousePointer, MailOpen } from "lucide-react";
import { AppLayout } from "../../components/app/AppLayout";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../lib/supabase";
import { PerformanceChart, DayMetrics } from "../../components/dashboard/PerformanceChart";
import toast from "react-hot-toast";

/**
 * DASHBOARD COMPONENT
 */
export function Dashboard() {
  const { profile, user } = useAuth();
  
  // STATE: Dashboard statistics
  const [stats, setStats] = useState({
    totalSent: "0",
    openRate: "0%",
    clickRate: "0%",
    activeContacts: "0",
  });
  
  // STATE: Recent campaigns list
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  
  // STATE: Loading states
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  
  // STATE: Chart data and time range
  const [timeRange, setTimeRange] = useState<number>(7);
  const [chartData, setChartData] = useState<DayMetrics[]>([]);

  /**
   * EFFECT: Fetch dashboard data on mount and time range change
   */
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchAnalyticsData(timeRange);
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchAnalyticsData(timeRange);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, timeRange]);

  /**
   * FETCH DASHBOARD DATA
   * 
   * Retrieves overall statistics and recent campaigns from database
   */
  const fetchDashboardData = async () => {
    try {
      // Fetch campaigns with real data from database
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "sent")
        .order("sent_at", { ascending: false });

      // Calculate totals from actual campaign data
      const totalSent =
        campaigns?.reduce((sum, c) => sum + (c.recipients_count || 0), 0) || 0;
      const totalOpens =
        campaigns?.reduce((sum, c) => sum + (c.opens || 0), 0) || 0;
      const totalClicks =
        campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;

      const openRate =
        totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : "0.0";
      const clickRate =
        totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : "0.0";

      // Fetch active contacts count
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id", { count: "exact" })
        .eq("user_id", user?.id)
        .eq("status", "active");

      setStats({
        totalSent: totalSent.toLocaleString(),
        openRate: `${openRate}%`,
        clickRate: `${clickRate}%`,
        activeContacts: (contacts?.length || 0).toLocaleString(),
      });

      // Map recent campaigns with real data
      setRecentCampaigns(
        campaigns?.slice(0, 5).map((c) => ({
          name: c.name,
          sent: (c.recipients_count || 0).toLocaleString(),
          opens: (c.opens || 0).toLocaleString(),
          clicks: (c.clicks || 0).toLocaleString(),
          date: new Date(c.sent_at).toLocaleDateString(),
        })) || []
      );
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * FETCH ANALYTICS DATA
   * 
   * Retrieves time-series data for performance chart
   * Aggregates campaign metrics by day for the selected time range
   * 
   * @param days - Number of days to fetch (7, 30, or 90)
   */
  const fetchAnalyticsData = async (days: number) => {
    try {
      setChartLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch campaigns within date range
      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "sent")
        .gte("sent_at", startDate.toISOString())
        .lte("sent_at", endDate.toISOString())
        .order("sent_at", { ascending: true });

      if (error) throw error;

      // Initialize data structure for all days in range
      const dailyMetrics = new Map<string, DayMetrics>();
      
      // Create entries for each day in the range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const fullDate = d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        dailyMetrics.set(dateKey, {
          date: shortDate,
          fullDate: fullDate,
          sent: 0,
          opens: 0,
          clicks: 0,
          openRate: 0,
          clickRate: 0,
        });
      }

      // Aggregate campaign data by day
      campaigns?.forEach((campaign) => {
        const sentDate = new Date(campaign.sent_at).toISOString().split('T')[0];
        const dayData = dailyMetrics.get(sentDate);
        
        if (dayData) {
          dayData.sent += campaign.recipients_count || 0;
          dayData.opens += campaign.opens || 0;
          dayData.clicks += campaign.clicks || 0;
        }
      });

      // Calculate rates for each day
      const chartDataArray: DayMetrics[] = [];
      dailyMetrics.forEach((dayData) => {
        if (dayData.sent > 0) {
          dayData.openRate = (dayData.opens / dayData.sent) * 100;
          dayData.clickRate = (dayData.clicks / dayData.sent) * 100;
        }
        chartDataArray.push(dayData);
      });

      setChartData(chartDataArray);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to load analytics data");
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  /**
   * HANDLE TIME RANGE CHANGE
   * 
   * Updates chart when user selects different time range
   */
  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(Number(e.target.value));
  };

  /**
   * STATS DISPLAY CONFIGURATION
   * 
   * Defines the statistics cards shown at the top of dashboard
   */
  const statsDisplay = [
    {
      name: "Total Sent",
      value: stats.totalSent,
      change: "+12.5%",
      trend: "up",
      icon: Mail,
      color: "text-gold",
    },
    {
      name: "Open Rate",
      value: stats.openRate,
      change: "+2.1%",
      trend: "up",
      icon: MailOpen,
      color: "text-purple",
    },
    {
      name: "Click Rate",
      value: stats.clickRate,
      change: "+4.2%",
      trend: "up",
      icon: MousePointer,
      color: "text-gold",
    },
    {
      name: "Active Contacts",
      value: stats.activeContacts,
      change: "+156",
      trend: "up",
      icon: Users,
      color: "text-purple",
    },
  ];

  return (
    <AppLayout currentPath="/app">
      <div className="p-8">
        {/* HEADER SECTION */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">
            Welcome back, {profile?.full_name || "there"}
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your email campaigns today.
          </p>
        </div>

        {/* STATISTICS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 bg-gray-50 rounded-lg ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                  <p className="text-3xl font-serif font-bold">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* PERFORMANCE OVERVIEW AND QUICK ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* PERFORMANCE OVERVIEW CHART */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">
                Performance Overview
              </h2>
              <select 
                className="input-base w-auto"
                value={timeRange}
                onChange={handleTimeRangeChange}
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            
            {/* PERFORMANCE CHART COMPONENT */}
            <PerformanceChart data={chartData} loading={chartLoading} />
          </div>

          {/* QUICK ACTIONS SIDEBAR */}
          <div className="card">
            <h2 className="text-xl font-serif font-bold mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/app/campaigns" className="block">
                <Button variant="primary" size="md" fullWidth>
                  Create Campaign
                </Button>
              </a>
              <a href="/app/contacts" className="block">
                <Button variant="secondary" size="md" fullWidth>
                  Import Contacts
                </Button>
              </a>
              <a href="/app/templates" className="block">
                <Button variant="secondary" size="md" fullWidth>
                  Browse Templates
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* RECENT CAMPAIGNS TABLE */}
        <div className="card">
          <h2 className="text-xl font-serif font-bold mb-6">
            Recent Campaigns
          </h2>
          {recentCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No campaigns sent yet</p>
              <p className="text-sm text-gray-500">
                Create your first campaign to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                      Campaign
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                      Sent
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                      Opens
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                      Clicks
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentCampaigns.map((campaign, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{campaign.name}</td>
                      <td className="py-3 px-4">{campaign.sent}</td>
                      <td className="py-3 px-4">{campaign.opens}</td>
                      <td className="py-3 px-4">{campaign.clicks}</td>
                      <td className="py-3 px-4 text-gray-600">{campaign.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}