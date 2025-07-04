import { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  Truck, 
  Users, 
  Activity
} from 'lucide-react';
import { getLeads } from '../services/leadService';
import { getJobs, getAllOperators } from '../services/jobService';
import { getEquipment as getAllEquipment } from '../services/equipmentService';
import { getDeals } from '../services/dealService';
import { Lead } from '../types/lead';
import { Job } from '../types/job';
import { formatCurrency } from '../utils/formatters';
import { Equipment } from '../types/equipment';
import { Deal } from '../types/deal';
import { StatCard } from '../components/dashboard/StatCard';
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
      {/* Debug: User Auth Status */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800">Auth Debug</h3>
        <p className="text-yellow-700">
          User: {user?.email || 'No user'} | Role: {user?.role || 'No role'} | Authenticated: {isAuthenticated ? 'Yes' : 'No'}
        </p>
        <p className="text-yellow-600 text-sm">
          If user role is undefined, authentication needs to be fixed.
        </p>
      </div>
      
      {/* Stats using StatCard components */}
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
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Equipment Summary</h3>
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
                <span className="text-sm font-medium text-gray-900">Total Equipment:</span>
                <span className="text-sm font-medium text-gray-900">{Array.isArray(equipment) ? equipment.length : 0}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Business Overview</h3>
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
      
      {/* Jobs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Jobs</h3>
        </div>
        <div className="px-6 py-4">
          {jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent jobs</p>
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
                    <tr key={job.id} className="hover:bg-gray-50">
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
      </div>
    </div>
  );
}