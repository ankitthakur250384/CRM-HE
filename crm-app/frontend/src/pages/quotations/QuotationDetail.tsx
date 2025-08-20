import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import QuotationPrintSystem from '../../components/quotations/QuotationPrintSystem';
import { ArrowLeft, Edit, FileText, Settings } from 'lucide-react';

interface Quotation {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  machine_type: string;
  order_type: string;
  number_of_days: number;
  working_hours: number;
  status: string;
  total_cost: number;
  created_at: string;
}

const QuotationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchQuotation(parseInt(id));
    }
  }, [id]);

  const fetchQuotation = async (quotationId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/quotations/${quotationId}`);
      const data = await response.json();

      if (data.success) {
        setQuotation(data.quotation);
      } else {
        setError(data.error || 'Failed to fetch quotation');
      }
    } catch (error) {
      console.error('Error fetching quotation:', error);
      setError('Failed to fetch quotation');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
        <div className="flex items-center">
          <div className="text-red-800">
            <h3 className="font-semibold">Error</h3>
            <p className="mt-2">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Button>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-6">
        <div className="text-yellow-800">
          <h3 className="font-semibold">Quotation Not Found</h3>
          <p className="mt-2">The requested quotation could not be found.</p>
        </div>
        <div className="mt-4">
          <Button onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => navigate('/quotations')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Quotation #{quotation.id}
                </h1>
                <p className="text-gray-600">
                  Created on {formatDate(quotation.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                quotation.status === 'approved' ? 'bg-green-100 text-green-800' :
                quotation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
              </span>
              <Button onClick={() => navigate(`/quotations/${quotation.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quotation Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Quotation Summary
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <div className="mt-1">
                    <p className="text-sm text-gray-900 font-medium">{quotation.customer_name}</p>
                    {quotation.customer_email && (
                      <p className="text-sm text-gray-600">{quotation.customer_email}</p>
                    )}
                    {quotation.customer_phone && (
                      <p className="text-sm text-gray-600">{quotation.customer_phone}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Machine Type</label>
                    <p className="mt-1 text-sm text-gray-900">{quotation.machine_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Type</label>
                    <p className="mt-1 text-sm text-gray-900">{quotation.order_type}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">{quotation.number_of_days} days</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Working Hours</label>
                    <p className="mt-1 text-sm text-gray-900">{quotation.working_hours} hours/day</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Cost</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(quotation.total_cost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Print System */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Print & Export Options
              </h2>
              <QuotationPrintSystem 
                quotationId={quotation.id}
                onClose={() => navigate('/quotations')}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => navigate(`/quotations/${quotation.id}/edit`)}
              className="flex items-center justify-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Quotation</span>
            </Button>
            <Button 
              onClick={() => {
                // Create a new quotation based on this one
                navigate('/quotations/new', { 
                  state: { copyFrom: quotation.id } 
                });
              }}
              className="flex items-center justify-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Duplicate Quotation</span>
            </Button>
            <Button 
              onClick={() => navigate('/templates')}
              className="flex items-center justify-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Manage Templates</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDetail;
