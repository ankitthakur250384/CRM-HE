import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  Eye,
  Download,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    monthly: Array<{ month: string; value: number }>;
  };
  leads: {
    total: number;
    conversion: number;
    sources: Array<{ source: string; count: number; color: string }>;
  };
  deals: {
    pipeline: Array<{ stage: string; value: number; count: number }>;
    won: number;
    lost: number;
  };
  equipment: {
    utilization: number;
    maintenance: Array<{ equipment: string; status: string; nextMaintenance: string }>;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // Simulated data for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnalyticsData({
        revenue: {
          total: 2500000,
          growth: 12.5,
          monthly: [
            { month: 'Jan', value: 180000 },
            { month: 'Feb', value: 220000 },
            { month: 'Mar', value: 195000 },
            { month: 'Apr', value: 260000 },
            { month: 'May', value: 235000 },
            { month: 'Jun', value: 280000 },
          ]
        },
        leads: {
          total: 156,
          conversion: 23.5,
          sources: [
            { source: 'Website', count: 45, color: COLORS[0] },
            { source: 'Referrals', count: 32, color: COLORS[1] },
            { source: 'Cold Calls', count: 28, color: COLORS[2] },
            { source: 'Social Media', count: 23, color: COLORS[3] },
            { source: 'Trade Shows', count: 18, color: COLORS[4] },
            { source: 'Others', count: 10, color: COLORS[5] },
          ]
        },
        deals: {
          pipeline: [
            { stage: 'Qualification', value: 450000, count: 12 },
            { stage: 'Proposal', value: 680000, count: 8 },
            { stage: 'Negotiation', value: 320000, count: 5 },
            { stage: 'Won', value: 920000, count: 15 },
            { stage: 'Lost', value: 180000, count: 6 },
          ],
          won: 15,
          lost: 6
        },
        equipment: {
          utilization: 78.5,
          maintenance: [
            { equipment: 'Crane A1', status: 'Active', nextMaintenance: '2025-09-15' },
            { equipment: 'Crane B2', status: 'Maintenance', nextMaintenance: '2025-08-30' },
            { equipment: 'Crane C3', status: 'Active', nextMaintenance: '2025-10-01' },
          ]
        }
      });
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your business performance and insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`₹${(analyticsData.revenue.total / 100000).toFixed(1)}L`}
          growth={analyticsData.revenue.growth}
          icon={<DollarSign className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="Total Leads"
          value={analyticsData.leads.total.toString()}
          growth={15.3}
          icon={<Users className="h-6 w-6" />}
          color="green"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${analyticsData.leads.conversion}%`}
          growth={-2.1}
          icon={<Target className="h-6 w-6" />}
          color="orange"
        />
        <MetricCard
          title="Equipment Utilization"
          value={`${analyticsData.equipment.utilization}%`}
          growth={5.8}
          icon={<Calendar className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <Eye className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3">
            {analyticsData.revenue.monthly.map((item) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{item.month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(item.value / 300000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{(item.value / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <Filter className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3">
            {analyticsData.leads.sources.map((source) => {
              const percentage = (source.count / analyticsData.leads.total) * 100;
              return (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: source.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-600">{source.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: source.color 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {source.count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Pipeline</h3>
          <div className="space-y-4">
            {analyticsData.deals.pipeline.map((stage) => {
              const maxValue = Math.max(...analyticsData.deals.pipeline.map(s => s.value));
              const percentage = (stage.value / maxValue) * 100;
              return (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">{stage.stage}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{(stage.value / 1000).toFixed(0)}K ({stage.count})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equipment Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Status</h3>
          <div className="space-y-4">
            {analyticsData.equipment.maintenance.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.equipment}</p>
                  <p className="text-sm text-gray-600">Next: {item.nextMaintenance}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  item.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  growth: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function MetricCard({ title, value, growth, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]} text-white`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center mt-4">
        {growth >= 0 ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ml-1 ${
          growth >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {Math.abs(growth)}%
        </span>
        <span className="text-sm text-gray-600 ml-1">vs last period</span>
      </div>
    </div>
  );
}
