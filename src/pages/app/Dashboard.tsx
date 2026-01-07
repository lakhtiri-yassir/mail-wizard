/**
 * ============================================================================
 * Dashboard Component - CLEANED VERSION
 * ============================================================================
 * 
 * Analytics dashboard with:
 * - Stats overview (campaigns, contacts, emails sent, opens, clicks)
 * - Time-based analytics charts
 * - Date range selector (Today, Yesterday, Last 7 Days, Last 30 Days, Custom)
 * - Recent campaigns table
 * 
 * Quick Start Guide removed - see /tutorial page for complete guide
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Users,
  TrendingUp,
  MousePointerClick,
  Calendar,
  ChevronDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { AppLayout } from '../../components/app/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalCampaigns: number;
  totalContacts: number;
  emailsSent: number;
  totalOpens: number;
  totalClicks: number;
  recentCampaigns: any[];
}

interface TimeSeriesDataPoint {
  date: string;
  opens: number;
  clicks: number;
}

type DateRange = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    totalContacts: 0,
    emailsSent: 0,
    totalOpens: 0,
    totalClicks: 0,
    recentCampaigns: [],
  });
  
  // Time series data and date range
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>('last30days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (user) {
      loadTimeSeriesData();
    }
  }, [user, selectedDateRange, customStartDate, customEndDate]);

  async function loadDashboardData() {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch contacts
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Calculate total opens and clicks from email_events table
      let totalOpens = 0;
      let totalClicks = 0;

      if (campaigns && campaigns.length > 0) {
        const campaignIds = campaigns.map(c => c.id);
        
        // Get analytics data from email_events table filtered by user's campaigns
        const { data: analytics } = await supabase
          .from('email_events')
          .select('event_type')
          .in('campaign_id', campaignIds);

        if (analytics) {
          totalOpens = analytics.filter(a => a.event_type === 'open').length;
          totalClicks = analytics.filter(a => a.event_type === 'click').length;
        }
      }

      const totalCampaigns = campaigns?.length || 0;
      const emailsSent = campaigns?.reduce((sum, c) => sum + (c.recipients_count || 0), 0) || 0;

      setStats({
        totalCampaigns,
        totalContacts: contactCount || 0,
        emailsSent,
        totalOpens,
        totalClicks,
        recentCampaigns: campaigns?.slice(0, 5) || [],
      });
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  // Load time series data based on date range
  async function loadTimeSeriesData() {
    if (!user) return;

    try {
      const { startDate, endDate } = getDateRangeBounds();

      // First get user's campaigns to filter analytics
      const { data: userCampaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id);

      if (!userCampaigns || userCampaigns.length === 0) {
        setTimeSeriesData([]);
        return;
      }

      const campaignIds = userCampaigns.map(c => c.id);

      // Fetch email events within date range filtered by user's campaigns
      const { data: analytics } = await supabase
        .from('email_events')
        .select('event_type, timestamp, campaign_id')
        .in('campaign_id', campaignIds)
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .order('timestamp', { ascending: true });

      if (!analytics || analytics.length === 0) {
        setTimeSeriesData([]);
        return;
      }

      // Group by date
      const dataByDate = new Map<string, { opens: number; clicks: number }>();

      // Initialize all dates in range with zero values
      const dates = generateDateRange(startDate, endDate);
      dates.forEach(date => {
        dataByDate.set(date, { opens: 0, clicks: 0 });
      });

      // Populate with actual data
      analytics.forEach(event => {
        const date = new Date(event.timestamp).toISOString().split('T')[0];
        const current = dataByDate.get(date) || { opens: 0, clicks: 0 };
        
        if (event.event_type === 'open') {
          current.opens++;
        } else if (event.event_type === 'click') {
          current.clicks++;
        }
        
        dataByDate.set(date, current);
      });

      // Convert to array
      const timeSeriesArray: TimeSeriesDataPoint[] = Array.from(dataByDate.entries()).map(
        ([date, data]) => ({
          date,
          opens: data.opens,
          clicks: data.clicks,
        })
      );

      setTimeSeriesData(timeSeriesArray);
    } catch (error) {
      console.error('Failed to load time series data:', error);
      setTimeSeriesData([]);
    }
  }

  // Generate date range array
  function generateDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  // Get date range bounds based on selection
  function getDateRangeBounds(): { startDate: string; endDate: string } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch (selectedDateRange) {
      case 'today':
        startDate = new Date(today);
        break;
      case 'yesterday':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'last30days':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 29);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 6);
        }
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 6);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  // Format date for display
  function formatDateForDisplay(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    if (selectedDateRange === 'last7days' || selectedDateRange === 'last30days') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Handle date range change
  function handleDateRangeChange(range: DateRange) {
    setSelectedDateRange(range);
    if (range !== 'custom') {
      setShowDatePicker(false);
    }
  }

  // Apply custom date range
  function applyCustomDateRange() {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    setSelectedDateRange('custom');
    setShowDatePicker(false);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-gold border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your email campaign analytics.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Total Campaigns */}
          <div className="bg-white rounded-lg border-2 border-black shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple bg-opacity-10 rounded-lg">
                <Mail className="text-purple" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalCampaigns}</div>
            <div className="text-sm text-gray-600">Total Campaigns</div>
          </div>

          {/* Total Contacts */}
          <div className="bg-white rounded-lg border-2 border-black shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gold bg-opacity-10 rounded-lg">
                <Users className="text-gold" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalContacts}</div>
            <div className="text-sm text-gray-600">Total Contacts</div>
          </div>

          {/* Emails Sent */}
          <div className="bg-white rounded-lg border-2 border-black shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 bg-opacity-10 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.emailsSent}</div>
            <div className="text-sm text-gray-600">Emails Sent</div>
          </div>

          {/* Total Opens */}
          <div className="bg-white rounded-lg border-2 border-black shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 bg-opacity-10 rounded-lg">
                <Mail className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalOpens}</div>
            <div className="text-sm text-gray-600">Total Opens</div>
          </div>

          {/* Total Clicks */}
          <div className="bg-white rounded-lg border-2 border-black shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple bg-opacity-10 rounded-lg">
                <MousePointerClick className="text-purple" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.totalClicks}</div>
            <div className="text-sm text-gray-600">Total Clicks</div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-lg border-2 border-black shadow-lg p-6 mb-8">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-purple" size={20} />
              <span className="font-semibold">Time Period:</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDateRangeChange('today')}
                className={`px-4 py-2 rounded-lg border-2 border-black font-medium transition-colors ${
                  selectedDateRange === 'today'
                    ? 'bg-purple text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                Today
              </button>
              
              <button
                onClick={() => handleDateRangeChange('yesterday')}
                className={`px-4 py-2 rounded-lg border-2 border-black font-medium transition-colors ${
                  selectedDateRange === 'yesterday'
                    ? 'bg-purple text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                Yesterday
              </button>
              
              <button
                onClick={() => handleDateRangeChange('last7days')}
                className={`px-4 py-2 rounded-lg border-2 border-black font-medium transition-colors ${
                  selectedDateRange === 'last7days'
                    ? 'bg-purple text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                Last 7 Days
              </button>
              
              <button
                onClick={() => handleDateRangeChange('last30days')}
                className={`px-4 py-2 rounded-lg border-2 border-black font-medium transition-colors ${
                  selectedDateRange === 'last30days'
                    ? 'bg-purple text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                Last 30 Days
              </button>
              
              <button
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  if (!showDatePicker) {
                    setSelectedDateRange('custom');
                  }
                }}
                className={`px-4 py-2 rounded-lg border-2 border-black font-medium transition-colors flex items-center gap-2 ${
                  selectedDateRange === 'custom'
                    ? 'bg-purple text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                Custom Range
                <ChevronDown
                  size={16}
                  className={`transform transition-transform ${showDatePicker ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Custom Date Picker */}
            {showDatePicker && (
              <div className="flex flex-wrap items-end gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border-2 border-black rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    className="px-3 py-2 border-2 border-black rounded-lg"
                  />
                </div>
                
                <button
                  onClick={applyCustomDateRange}
                  className="px-6 py-2 bg-purple text-white font-medium rounded-lg border-2 border-black hover:bg-opacity-90 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Opens Over Time */}
          <div className="bg-white rounded-lg border-2 border-black shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-purple" />
              Opens Over Time
            </h3>
            <div className="h-64">
              <TimeSeriesChart
                data={timeSeriesData}
                dataKey="opens"
                color="#57377d"
                formatDate={formatDateForDisplay}
              />
            </div>
          </div>

          {/* Clicks Over Time */}
          <div className="bg-white rounded-lg border-2 border-black shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MousePointerClick size={20} className="text-gold" />
              Clicks Over Time
            </h3>
            <div className="h-64">
              <TimeSeriesChart
                data={timeSeriesData}
                dataKey="clicks"
                color="#f3ba42"
                formatDate={formatDateForDisplay}
              />
            </div>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg border-2 border-black shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recent Campaigns</h2>
          
          {stats.recentCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Mail size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No campaigns yet</p>
              <button
                onClick={() => navigate('/campaigns/new')}
                className="px-6 py-3 bg-purple text-white font-medium rounded-lg border-2 border-black hover:bg-opacity-90 transition-colors"
              >
                Create First Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Recipients</th>
                    <th className="text-left py-3 px-4 font-semibold">Sent Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCampaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{campaign.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            campaign.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : campaign.status === 'draft'
                              ? 'bg-gray-100 text-gray-800'
                              : campaign.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{campaign.recipients_count || 0}</td>
                      <td className="py-3 px-4">
                        {campaign.sent_at
                          ? new Date(campaign.sent_at).toLocaleDateString()
                          : '-'}
                      </td>
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

// ============================================================================
// TIME SERIES CHART COMPONENT (Using Recharts)
// ============================================================================

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  dataKey: 'opens' | 'clicks';
  color: string;
  formatDate: (date: string) => string;
}

/**
 * CUSTOM TOOLTIP
 */
const CustomTooltip = ({ active, payload, dataKey }: any) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white border-2 border-black rounded-lg p-3 shadow-lg">
      <p className="font-sans text-sm font-semibold mb-2">{formattedDate}</p>
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: dataKey === 'opens' ? '#57377d' : '#f3ba42' }}
        />
        <span className="font-sans text-sm">
          {dataKey === 'opens' ? 'Opens' : 'Clicks'}: {' '}
          <span className="font-semibold">{data[dataKey].toLocaleString()}</span>
        </span>
      </div>
    </div>
  );
};

function TimeSeriesChart({ data, dataKey, color, formatDate }: TimeSeriesChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="mb-2">No analytics data available</p>
          <p className="text-sm">Send some campaigns to see your analytics here</p>
        </div>
      </div>
    );
  }

  // Transform data for Recharts
  const chartData = data.map(point => ({
    date: point.date,
    displayDate: formatDate(point.date),
    [dataKey]: point[dataKey]
  }));

  // Calculate total
  const total = data.reduce((sum, d) => sum + d[dataKey], 0);

  return (
    <div className="h-full flex flex-col">
      {/* Chart Area */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            {/* Grid */}
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            {/* X-Axis */}
            <XAxis
              dataKey="displayDate"
              stroke="#000000"
              style={{
                fontSize: '12px',
                fontFamily: 'DM Sans, sans-serif'
              }}
              tick={{ fill: '#000000' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            
            {/* Y-Axis */}
            <YAxis
              stroke="#000000"
              style={{
                fontSize: '12px',
                fontFamily: 'DM Sans, sans-serif'
              }}
              tick={{ fill: '#000000' }}
              allowDecimals={false}
            />
            
            {/* Tooltip */}
            <Tooltip content={<CustomTooltip dataKey={dataKey} />} />
            
            {/* Line */}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Total Label */}
      <div className="mt-2 text-center text-sm font-medium text-gray-700">
        Total {dataKey === 'opens' ? 'Opens' : 'Clicks'}: {total.toLocaleString()}
      </div>
    </div>
  );
}