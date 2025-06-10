import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, IndianRupee, User, Clock, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Toast } from '../components/common/Toast';
import { Badge } from '../components/common/Badge';
import { getDealById, updateDealStage } from '../services/dealService';
import { Deal } from '../types/deal';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatters';

const STAGE_OPTIONS = [
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export function DealDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  useEffect(() => {
    if (id) {
      fetchDeal();
    }
  }, [id]);

  const fetchDeal = async () => {
    try {
      setIsLoading(true);
      const dealData = await getDealById(id!);
      if (!dealData) {
        showToast('Deal not found', 'error');
        navigate('/deals');
        return;
      }
      setDeal(dealData);
    } catch (error) {
      console.error('Error fetching deal:', error);
      showToast('Error fetching deal details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageChange = async (newStage: Deal['stage']) => {
    if (!deal) return;

    try {
      const updatedDeal = await updateDealStage(deal.id, newStage);
      if (updatedDeal) {
        setDeal(updatedDeal);
        showToast(`Deal stage updated to ${newStage}`, 'success');
      }
    } catch (error) {
      console.error('Error updating deal stage:', error);
      showToast('Error updating deal stage', 'error');
    }
  };

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-8 text-gray-500">
        Deal not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/deals')}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Deals
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Deal Details
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Deal Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{deal.title}</h3>
                <p className="mt-1 text-gray-500">{deal.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-500">Deal Value</div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(deal.value)}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">Stage</div>
                  <div className="mt-1">
                    <Select
                      value={deal.stage}
                      onChange={(value) => handleStageChange(value as Deal['stage'])}
                      options={STAGE_OPTIONS}
                      className="w-[200px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">Created On</div>
                  <div className="mt-1 text-gray-900">
                    {new Date(deal.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">Expected Close Date</div>
                  <div className="mt-1 text-gray-900">
                    {new Date(deal.expectedCloseDate).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">Probability</div>
                  <div className="mt-1 text-gray-900">{deal.probability}%</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">Assigned To</div>
                  <div className="mt-1 text-gray-900">{deal.assignedTo}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {deal.notes || 'No notes available.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium">{deal.customer.name}</div>
                  <div className="text-sm text-gray-500">{deal.customer.designation}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div className="text-gray-600">{deal.customer.company}</div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <div className="text-gray-600">{deal.customer.email}</div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-gray-400" />
                <div className="text-gray-600">{deal.customer.phone}</div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div className="text-gray-600">{deal.customer.address}</div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={() => navigate(`/quotations/create?dealId=${deal.id}`)}
              >
                Create Quotation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
} 