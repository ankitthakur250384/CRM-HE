import { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  Truck, 
  Users, 
  Activity,
  TrendingUp,
  Calendar
} from 'lucide-react';

// Services
import { getLeads } from '../services/leadService';
import { getJobs, getAllOperators } from '../services/jobService';
import { getEquipment as getAllEquipment } from '../services/equipmentService';
import { getDeals } from '../services/dealService';

// Types
import { Lead } from '../types/lead';
import { Job } from '../types/job';
import { Equipment } from '../types/equipment';
import { Deal } from '../types/deal';

// Utils
import { formatCurrency } from '../utils/formatters';

// Components
import { StatCard } from '../components/dashboard/StatCard';
import { RecentActivities } from '../components/dashboard/RecentActivities';
import { BarChart } from '../components/dashboard/BarChart';
import { LineChart } from '../components/dashboard/LineChart';
import { DoughnutChart } from '../components/dashboard/DoughnutChart';

// Store
import { useAuthStore } from '../store/authStore';

export function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  // Initialize with empty arrays to prevent undefined errors
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [operatorCount, setOperatorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      // Only fetch data if we have an authenticated user
      if (!isAuthenticated || !user) {
        console.log('⏸️ Skipping data fetch - user not authenticated');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('🔄 AdminDashboard: Starting data fetch...');
        setError(null);
        
        const [leadsResponse, jobsResponse, equipmentResponse, operatorsResponse, dealsResponse] = await Promise.all([
          getLeads().catch(err => { console.error('Leads error:', err); return []; }),
          getJobs().catch(err => { console.error('Jobs error:', err); return []; }),
          getAllEquipment().catch(err => { console.error('Equipment error:', err); return []; }),
          getAllOperators().catch(err => { console.error('Operators error:', err); return []; }),
          getDeals().catch(err => { console.error('Deals error:', err); return []; }),
        ]);
        
        // Extract data from potentially wrapped responses
        const extractData = (response: any) => {
          if (Array.isArray(response)) {
            return response;
          } else if (response && typeof response === 'object' && response.data && Array.isArray(response.data)) {
            return response.data;
          } else if (response && typeof response === 'object' && response.success && Array.isArray(response.data)) {
            return response.data;
          }
          return [];
        };
        
        const leadsData = extractData(leadsResponse);
        const jobsData = extractData(jobsResponse);
        const equipmentData = extractData(equipmentResponse);
        const operatorsData = extractData(operatorsResponse);
        const dealsData = extractData(dealsResponse);
        
        console.log('🧪 Debug data types after extraction:', {
          leadsData: Array.isArray(leadsData) ? `Array(${leadsData.length})` : typeof leadsData,
          jobsData: Array.isArray(jobsData) ? `Array(${jobsData.length})` : typeof jobsData,
          equipmentData: Array.isArray(equipmentData) ? `Array(${equipmentData.length})` : typeof equipmentData,
          operatorsData: Array.isArray(operatorsData) ? `Array(${operatorsData.length})` : typeof operatorsData,
          dealsData: Array.isArray(dealsData) ? `Array(${dealsData.length})` : typeof dealsData,
        });
        
        console.log('📊 Data fetched successfully:', {
          leads: leadsData.length,
          jobs: jobsData.length,
          equipment: equipmentData.length,
          operators: operatorsData.length,
          deals: dealsData.length
        });
        
        setLeads(leadsData);
        setJobs(jobsData);
        setEquipmentCount(equipmentData.length);
        setOperatorCount(operatorsData.length);
        setEquipment(equipmentData);
        setDeals(dealsData);
      } catch (error: any) {
        console.error('❌ Error fetching dashboard data:', error);
        setError(`Failed to load dashboard data: ${error?.message || error}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated, user]); // Re-run when auth state changes
  
  // Calculate total revenue from won deals with robust error handling
  console.log('🔍 Calculating revenue - deals:', deals, 'type:', typeof deals, 'isArray:', Array.isArray(deals));
  
  let totalRevenue = 0;
  try {
    if (Array.isArray(deals) && deals.length > 0) {
      totalRevenue = deals
        .filter(deal => deal && deal.stage === 'won')
        .reduce((total, deal) => total + (deal.value || 0), 0);
    }
  } catch (error) {
    console.error('Error calculating revenue:', error);
    totalRevenue = 0;
  }

  const equipmentUtilization = Array.isArray(jobs) 
    ? jobs.filter(job => job.status === 'in_progress' || job.status === 'scheduled').length / (equipmentCount || 1) * 100
    : 0;

  // Prepare chart data
  const monthlyRevenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Revenue',
        data: [150000, 200000, 180000, 220000, 250000, totalRevenue > 0 ? totalRevenue : 300000],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  };

  const equipmentStatusData = {
    labels: ['Available', 'In Use', 'Maintenance'],
    datasets: [
      {
        data: [
          Array.isArray(equipment) ? equipment.filter(e => e.status === 'available').length : 0,
          Array.isArray(equipment) ? equipment.filter(e => e.status === 'in_use').length : 0,
          Array.isArray(equipment) ? equipment.filter(e => e.status === 'maintenance').length : 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 146, 60, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(251, 146, 60)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const jobStatusData = {
    labels: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    datasets: [
      {
        label: 'Jobs by Status',
        data: [
          Array.isArray(jobs) ? jobs.filter(j => j.status === 'scheduled').length : 0,
          Array.isArray(jobs) ? jobs.filter(j => j.status === 'in_progress').length : 0,
          Array.isArray(jobs) ? jobs.filter(j => j.status === 'completed').length : 0,
          Array.isArray(jobs) ? jobs.filter(j => j.status === 'cancelled').length : 0,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(107, 114, 128, 0.6)',
          'rgba(239, 68, 68, 0.6)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(107, 114, 128)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('🎯 AdminDashboard render - Data summary:', {
    leads: Array.isArray(leads) ? leads.length : 0,
    deals: Array.isArray(deals) ? deals.length : 0, 
    jobs: Array.isArray(jobs) ? jobs.length : 0,
    equipment: Array.isArray(equipment) ? equipment.length : 0,
    totalRevenue,
    equipmentUtilization
  });

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards at the Top (4 cards in a row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<IndianRupee className="h-5 w-5 text-blue-600" />}
          variant="primary"
        />
        <StatCard
          title="Equipment"
          value={equipmentCount}
          icon={<Truck className="h-5 w-5 text-green-600" />}
          variant="secondary"
        />
        <StatCard
          title="Active Jobs"
          value={jobs.length}
          icon={<Activity className="h-5 w-5 text-purple-600" />}
          variant="success"
        />
        <StatCard
          title="Operators"
          value={operatorCount}
          icon={<Users className="h-5 w-5 text-orange-600" />}
          variant="accent"
        />
      </div>
      
      {/* 2. Charts Section (3 charts in a row) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Status</h3>
          <div style={{ height: '250px' }}>
            <DoughnutChart data={equipmentStatusData} height={250} />
          </div>
        </div>
        
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
          <div style={{ height: '250px' }}>
            <LineChart data={monthlyRevenueData} height={250} />
          </div>
        </div>
        
        {/* Job Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Jobs by Status</h3>
          <div style={{ height: '250px' }}>
            <BarChart data={jobStatusData} height={250} />
          </div>
        </div>
      </div>
      
      {/* 3. Main Content Area (2 columns: Left = Recent Activities, Right = Business Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Activities */}
        <RecentActivities className="h-fit" />
        
        {/* Right Column: Business Analytics Summary */}
        <div className="grid grid-cols-1 gap-6">
          {/* Equipment Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Equipment Summary</h3>
                <Truck className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Available Equipment:</span>
                  <span className="text-sm font-medium text-green-600">
                    {Array.isArray(equipment) ? equipment.filter(e => e.status === 'available').length : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">In Use:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {Array.isArray(equipment) ? equipment.filter(e => e.status === 'in_use').length : 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Under Maintenance:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {Array.isArray(equipment) ? equipment.filter(e => e.status === 'maintenance').length : 0}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm font-medium text-gray-900">Utilization Rate:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {equipmentCount > 0 ? Math.round(equipmentUtilization) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Business Overview */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Business Overview</h3>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Leads:</span>
                  <span className="text-sm font-medium text-blue-600">{leads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Active Deals:</span>
                  <span className="text-sm font-medium text-green-600">{Array.isArray(deals) ? deals.length : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Won Deals:</span>
                  <span className="text-sm font-medium text-green-600">
                    {Array.isArray(deals) ? deals.filter(d => d.stage === 'won').length : 0}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-sm font-medium text-gray-900">Conversion Rate:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {leads.length > 0 ? Math.round((Array.isArray(deals) ? deals.length : 0) / leads.length * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 4. Recent Jobs Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="px-6 py-4">
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No recent jobs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.slice(0, 5).map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{job.customerId || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{job.equipmentIds ? job.equipmentIds[0] : 'None'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(job.scheduledStartDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          job.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                          job.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          job.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {jobs.length > 5 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all {jobs.length} jobs →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}