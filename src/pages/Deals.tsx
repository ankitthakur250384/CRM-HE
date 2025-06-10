import React, { useState, useEffect, ReactNode } from 'react';
import type {
  DragDropContext as DragDropContextType,
  Droppable as DroppableType,
  Draggable as DraggableType,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DroppableStateSnapshot,
  DraggableStateSnapshot
} from '@hello-pangea/dnd';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  ArrowRight,
  Search,
  Plus,
  Building2,
  IndianRupee,
  MoreVertical
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { Deal, DealStage } from '../types/deal';
import { getDeals, updateDealStage } from '../services/dealService';
import { formatCurrency } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const STAGE_COLORS = {
  qualification: 'bg-blue-100 text-blue-800',
  proposal: 'bg-yellow-100 text-yellow-800',
  negotiation: 'bg-purple-100 text-purple-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800'
};

const STAGE_CONFIGS = [
  { id: 'qualification', label: 'Qualification', color: 'bg-blue-50' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-50' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-50' },
  { id: 'won', label: 'Won', color: 'bg-green-50' },
  { id: 'lost', label: 'Lost', color: 'bg-red-50' }
];

export function Deals() {
  const { user } = useAuthStore();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ show: boolean; title: string; variant?: 'success' | 'error' | 'warning' }>({
    show: false,
    title: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const data = await getDeals();
      setDeals(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching deals:', error);
      showToast('Error fetching deals', 'error');
      setIsLoading(false);
    }
  };

  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStage = destination.droppableId as DealStage;

    try {
      const updatedDeal = await updateDealStage(draggableId, newStage);
      if (updatedDeal) {
        setDeals(prev => 
          prev.map(deal => 
            deal.id === draggableId ? updatedDeal : deal
          )
        );
        showToast(`Deal moved to ${newStage}`, 'success');
      }
    } catch (error) {
      console.error('Error updating deal stage:', error);
      showToast('Error updating deal stage', 'error');
    }
  };

  const filteredDeals = deals.filter(deal =>
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDealsByStage = (stage: DealStage) => 
    filteredDeals.filter(deal => deal.stage === stage);

  const calculateStageTotal = (stage: DealStage) =>
    getDealsByStage(stage).reduce((sum, deal) => sum + deal.value, 0);

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Deals Pipeline</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px]"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-5 gap-4">
            {STAGE_CONFIGS.map((stage) => (
              <div key={stage.id} className={`rounded-lg ${stage.color} p-4`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">{stage.label}</h3>
                  <Badge variant="outline">
                    {formatCurrency(calculateStageTotal(stage.id as DealStage))}
                  </Badge>
                </div>
                
                <Droppable droppableId={stage.id}>
                  {(
                    provided: DroppableProvided,
                    snapshot: DroppableStateSnapshot
                  ): ReactNode => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-3 min-h-[500px]"
                    >
                      {getDealsByStage(stage.id as DealStage).map((deal, index) => (
                        <Draggable key={deal.id} draggableId={deal.id} index={index}>
                          {(
                            provided: DraggableProvided,
                            snapshot: DraggableStateSnapshot
                          ): ReactNode => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <h4 className="font-medium text-gray-900 line-clamp-2">
                                    {deal.title}
                                  </h4>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Building2 className="h-4 w-4 mr-1" />
                                    {deal.customer.company || 'No company'}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/deals/${deal.id}`)}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center text-gray-500">
                                    <Users className="h-4 w-4 mr-1" />
                                    {deal.customer.name}
                                  </div>
                                  <div className="font-medium text-gray-900">
                                    {formatCurrency(deal.value)}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2 text-sm">
                                  <div className="flex items-center text-gray-500">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                  </div>
                                  <Badge>
                                    {Math.round(deal.probability)}%
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

