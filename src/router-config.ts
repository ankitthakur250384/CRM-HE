// router-config.ts
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { AdminDashboard } from './pages/AdminDashboard';
import { SalesAgentDashboard } from './pages/SalesAgentDashboard';
import { OperationsManagerDashboard } from './pages/OperationsManagerDashboard';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { LeadManagement } from './pages/LeadManagement';
import { QuotationManagement } from './pages/QuotationManagement';
import { QuotationCreation } from './pages/QuotationCreation';
import { JobScheduling } from './pages/JobScheduling';
import { SiteAssessment } from './pages/SiteAssessment';
import { JobSummaryFeedback } from './pages/JobSummaryFeedback';
import { EquipmentManagement } from './pages/EquipmentManagement';
import { ServicesManagement } from './pages/ServicesManagement';
import { UserManagement } from './pages/UserManagement';
import { Config } from './pages/Config';
import { Customers } from './pages/Customers';
import { Deals } from './pages/Deals';
import { DealDetails } from './pages/DealDetails';
import { QuotationTemplates } from './pages/QuotationTemplates';
import { QuotationTemplateEditor } from './pages/QuotationTemplateEditor';
import { ProtectedRoute } from './components/auth/SimpleProtectedRoute';
import { Navigate } from 'react-router-dom';

// This file is prepared for future React Router v7 compatibility
// It is not used yet but can be integrated when needed

export const routerConfig = [
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />
          },
          {
            path: 'dashboard',
            element: <DashboardRouter />
          },
          // Admin Only Routes
          {
            path: 'admin/users',
            element: <ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>
          },
          {
            path: 'admin/config',
            element: <ProtectedRoute allowedRoles={['admin']}><Config /></ProtectedRoute>
          },
          {
            path: 'admin/equipment',
            element: <ProtectedRoute allowedRoles={['admin', 'operations_manager']}><EquipmentManagement /></ProtectedRoute>
          },
          {
            path: 'admin/services',
            element: <ProtectedRoute allowedRoles={['admin', 'operations_manager']}><ServicesManagement /></ProtectedRoute>
          },
          {
            path: 'admin/quotation-templates',
            element: <ProtectedRoute allowedRoles={['admin', 'sales_agent']}><QuotationTemplates /></ProtectedRoute>
          },
          {
            path: 'admin/quotation-templates/edit/:id',
            element: <ProtectedRoute allowedRoles={['admin', 'sales_agent']}><QuotationTemplateEditor /></ProtectedRoute>
          },
          // Shared Routes for Multiple Roles
          {
            path: 'leads',
            element: <ProtectedRoute allowedRoles={['admin', 'sales_agent', 'operations_manager']}><LeadManagement /></ProtectedRoute>
          },
          {
            path: 'customers',
            element: <ProtectedRoute allowedRoles={['admin', 'sales_agent', 'operations_manager']}><Customers /></ProtectedRoute>
          },
          {
            path: 'deals',
            element: <ProtectedRoute allowedRoles={['admin', 'sales_agent', 'operations_manager']}><Deals /></ProtectedRoute>
          },
          {
            path: 'deals/:id',
            element: <ProtectedRoute allowedRoles={['admin', 'sales_agent', 'operations_manager']}><DealDetails /></ProtectedRoute>
          },
          {
            path: 'quotations',
            element: <ProtectedRoute allowedRoles={['admin', 'sales_agent', 'operations_manager']}><QuotationManagement /></ProtectedRoute>
          },
          {
            path: 'quotations/create',
            element: <ProtectedRoute allowedRoles={['admin', 'sales_agent']}><QuotationCreation /></ProtectedRoute>
          },
          {
            path: 'jobs',
            element: <ProtectedRoute allowedRoles={['admin', 'operations_manager', 'operator']}><JobScheduling /></ProtectedRoute>
          },
          {
            path: 'site-assessments',
            element: <ProtectedRoute allowedRoles={['admin', 'operations_manager', 'operator']}><SiteAssessment /></ProtectedRoute>
          },
          {
            path: 'job-summary',
            element: <ProtectedRoute allowedRoles={['admin', 'operations_manager', 'operator']}><JobSummaryFeedback /></ProtectedRoute>
          },
          // Catch All - Redirect to Dashboard
          {
            path: '*',
            element: <Navigate to="/dashboard" replace />
          }
        ]
      }
    ]
  }
] as RouteObject[];

// Helper component for routing to the correct dashboard based on user role
function DashboardRouter() {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'sales_agent':
      return <SalesAgentDashboard />;
    case 'operations_manager':
      return <OperationsManagerDashboard />;
    case 'operator':
      return <OperatorDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}

// Create a router instance with the routes
export const router = createBrowserRouter(routerConfig);
