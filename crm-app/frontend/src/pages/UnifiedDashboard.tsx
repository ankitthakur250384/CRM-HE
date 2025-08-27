import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  BarChart3, 
  Activity,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Store
import { useAuthStore } from '../store/authStore';

// Services
import { dashboardService, DashboardAnalytics, RevenueChartData, PipelineData } from '../services/dashboardService';

// Components
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';

// Types
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

// Enhanced Metric Card Component
function MetricCard({ title, value, change, icon, color, subtitle }: MetricCardProps) {
  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const sign = isPositive ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
        
        {change !== undefined && (
          <div className="mt-4 flex items-center">
            {change >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ml-1 ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatChange(change)}
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick Stats Component
function QuickStats({ analytics }: { analytics: DashboardAnalytics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Revenue"
        value={`$${analytics.revenue.total.toLocaleString()}`}
        change={analytics.revenue.growth}
        icon={<DollarSign className="text-white" size={20} />}
        color="bg-green-500"
        subtitle={`${analytics.revenue.dealsCount} deals closed`}
      />
      
      <MetricCard
        title="Active Leads"
        value={analytics.leads.total.toLocaleString()}
        change={analytics.leads.qualificationRate}
        icon={<Users className="text-white" size={20} />}
        color="bg-blue-500"
        subtitle={`${analytics.leads.qualified} qualified`}
      />
      
      <MetricCard
        title="Deal Win Rate"
        value={`${analytics.deals.winRate.toFixed(1)}%`}
        change={analytics.deals.winRate - 50} // Assuming 50% as baseline
        icon={<Target className="text-white" size={20} />}
        color="bg-purple-500"
        subtitle={`${analytics.deals.won}/${analytics.deals.total} won`}
      />
      
      <MetricCard
        title="Avg Deal Size"
        value={`$${analytics.revenue.avgDealSize.toLocaleString()}`}
        icon={<BarChart3 className="text-white" size={20} />}
        color="bg-orange-500"
        subtitle={`${analytics.deals.avgCycleDays} days avg cycle`}
      />
    </div>
  );
}

// Revenue Chart Component
function RevenueChart({ data }: { data: RevenueChartData[] }) {
  const maxRevenue = Math.max(...data.map(item => item.revenue));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Revenue Trend (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.slice(0, 6).map((month) => {
            const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
            
            return (
              <div key={month.month} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{month.monthName}</span>
                  <span className="font-semibold">${month.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {month.deals} deals
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Pipeline Overview Component
function PipelineOverview({ data }: { data: PipelineData[] }) {
  const maxValue = Math.max(...data.map(stage => stage.value));
  const colors = ['bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-green-500'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Sales Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => {
            const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
            const color = colors[index % colors.length];
            
            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{stage.stage}</span>
                  <div className="text-right">
                    <div className="font-semibold">${stage.value.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{stage.count} deals</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`${color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Activities Component
function RecentActivities({ activities }: { activities: DashboardAnalytics['recentActivities'] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-500" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No recent activities found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-blue" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                {activity.type === 'lead' && <Target className="text-brand-blue" size={16} />}
                {activity.type === 'deal' && <BarChart3 className="text-brand-blue" size={16} />}
                {activity.type === 'customer' && <Users className="text-brand-blue" size={16} />}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{activity.title}</div>
                <div className="text-sm text-gray-500">
                  {activity.status} • {activity.createdBy} • {new Date(activity.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Unified Dashboard Component
export function UnifiedDashboard() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [chartData, setChartData] = useState<{
    revenueData: RevenueChartData[];
    pipelineData: PipelineData[];
  }>({
    revenueData: [],
    pipelineData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [serverError, setServerError] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setConnectionError(false);
      setAuthError(false);
      setServerError(false);
      
      const [analyticsData, revenueData, pipelineData] = await Promise.all([
        dashboardService.getDashboardAnalytics(timeRange),
        dashboardService.getRevenueChart(12),
        dashboardService.getPipelineOverview()
      ]);

      setAnalytics(analyticsData);
      setChartData({ revenueData, pipelineData });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      
      // Check if it's an authentication error
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setAuthError(true);
        setError('You need to log in to view the dashboard. Please sign in and try again.');
      }
      // Check if it's a server error
      else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
        setServerError(true);
        setError('Server error occurred. The dashboard data might be temporarily unavailable. Please try refreshing.');
      }
      // Check if it's a connection error
      else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        setConnectionError(true);
        setError('Unable to connect to server. Please check if the backend service is running.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {authError ? 'Authentication Required' : serverError ? 'Server Error' : connectionError ? 'Connection Error' : 'Error Loading Dashboard'}
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        {authError && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 mb-3">
              <strong>Please log in:</strong> The dashboard requires authentication to display your data.
            </p>
            <a 
              href="/login" 
              className="inline-flex items-center px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors"
            >
              Go to Login Page
            </a>
          </div>
        )}
        {serverError && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-800">
              <strong>Server Issue:</strong> The backend database queries might have issues. 
              This is likely due to database schema mismatches or missing data.
              Try rebuilding the containers or check server logs.
            </p>
          </div>
        )}
        {connectionError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Troubleshooting:</strong> The backend server might be starting up or not running. 
              If running in Docker, try rebuilding the containers with the latest code.
            </p>
          </div>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-brand-blue text-white px-4 py-2 rounded-lg hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
        >
          {refreshing ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No dashboard data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { label: '7D', days: 7 },
              { label: '30D', days: 30 },
              { label: '90D', days: 90 }
            ].map(({ label, days }) => (
              <button
                key={days}
                onClick={() => handleTimeRangeChange(days)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  timeRange === days
                    ? 'bg-white text-brand-blue shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats analytics={analytics} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RevenueChart data={chartData.revenueData} />
        <PipelineOverview data={chartData.pipelineData} />
      </div>

      {/* Recent Activities */}
      <RecentActivities activities={analytics.recentActivities} />
    </div>
  );
}
