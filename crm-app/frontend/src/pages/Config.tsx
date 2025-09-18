import { useState } from 'react';
import { 
  Settings, 
  FileText, 
  Users, 
  Wrench, 
  Calendar, 
  Database,
  Shield,
  Zap,
  Palette,
  Activity,
  BarChart3
} from 'lucide-react';
import { QuotationConfig } from '../components/config/QuotationConfig';
import { ResourceRatesConfig } from '../components/config/ResourceRatesConfig';
import { AdditionalParamsConfig } from '../components/config/AdditionalParamsConfig';
import { DefaultTemplateConfig } from '../components/config/DefaultTemplateConfig';
import { DatabaseConfig } from '../components/config/DatabaseConfig';
import { useAuthStore } from '../store/authStore';

const configTabs = [
  {
    id: 'templates',
    label: 'Templates',
    icon: FileText,
    description: 'Manage quotation templates and defaults',
    component: DefaultTemplateConfig,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'quotations',
    label: 'Quotations',
    icon: Calendar,
    description: 'Configure quotation order types and settings',
    component: QuotationConfig,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'resources',
    label: 'Resources',
    icon: Users,
    description: 'Set resource rates and pricing',
    component: ResourceRatesConfig,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'parameters',
    label: 'Parameters',
    icon: Wrench,
    description: 'Additional system parameters',
    component: AdditionalParamsConfig,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'database',
    label: 'Database',
    icon: Database,
    description: 'Database connection settings',
    component: DatabaseConfig,
    color: 'from-indigo-500 to-purple-500'
  }
];

export function Config() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('templates');

  if (!user || (user.role !== 'admin' && user.role !== 'operations_manager')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white/70 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/20">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 max-w-md">
            You don't have the necessary permissions to access the configuration panel. 
            Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const ActiveComponent = configTabs.find(tab => tab.id === activeTab)?.component || DefaultTemplateConfig;
  const activeTabData = configTabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border-b border-white/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl">
                  <Settings className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  System Configuration
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Manage and customize your ASP Cranes CRM system
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">System Online</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <BarChart3 className="h-5 w-5" />
                <span className="text-sm">Performance: Excellent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Palette className="h-5 w-5 mr-2 text-purple-600" />
                Configuration Modules
              </h3>
              <nav className="space-y-3">
                {configTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
                        isActive 
                          ? 'bg-white shadow-lg border border-white/40 transform scale-[1.02]' 
                          : 'hover:bg-white/50 hover:shadow-md border border-transparent'
                      }`}
                    >
                      {isActive && (
                        <div className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-10 rounded-2xl`}></div>
                      )}
                      <div className="relative flex items-start space-x-4">
                        <div className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${
                          isActive 
                            ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className={`font-semibold transition-colors duration-300 ${
                            isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                          }`}>
                            {tab.label}
                          </h4>
                          <p className={`text-sm mt-1 transition-colors duration-300 ${
                            isActive ? 'text-gray-600' : 'text-gray-500 group-hover:text-gray-600'
                          }`}>
                            {tab.description}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Quick Stats */}
              <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                  Quick Stats
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Templates</span>
                    <span className="font-medium text-gray-900">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Equipment Types</span>
                    <span className="font-medium text-gray-900">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="font-medium text-gray-900">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-0">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              {/* Content Header */}
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${activeTabData?.color} opacity-5`}></div>
                <div className="relative px-8 py-6 border-b border-gray-200/50">
                  <div className="flex items-center space-x-4">
                    {activeTabData && (
                      <>
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${activeTabData.color} text-white shadow-lg`}>
                          <activeTabData.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">
                            {activeTabData.label} Configuration
                          </h2>
                          <p className="text-gray-600 mt-1">
                            {activeTabData.description}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-8">
                <div className="relative">
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 rounded-2xl"></div>
                  
                  {/* Content */}
                  <div className="relative">
                    <ActiveComponent />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>
    </div>
  );
}