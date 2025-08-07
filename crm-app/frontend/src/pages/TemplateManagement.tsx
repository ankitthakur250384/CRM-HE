/**
 * Template Management Page
 * Modern interface for creating and managing quotation templates
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Copy, 
  Upload,
  Search,
  Grid,
  List,
  Star,
  Clock,
  User
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { TemplateBuilder } from '../components/templates/TemplateBuilder';
import { Toast } from '../components/common/Toast';
import { 
  getModernTemplates, 
  createModernTemplate, 
  updateModernTemplate, 
  deleteModernTemplate,
  ModernTemplate 
} from '../services/modernTemplateService';

export const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<ModernTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ModernTemplate | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [toast, setToast] = useState<{ show: boolean; title: string; variant?: 'success' | 'error' }>({ 
    show: false, 
    title: '' 
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const fetchedTemplates = await getModernTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      showToast('Error loading templates', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowBuilder(true);
  };

  const handleEditTemplate = (template: ModernTemplate) => {
    setSelectedTemplate(template);
    setShowBuilder(true);
  };

  const handleSaveTemplate = async (templateData: { name: string; elements: any[] }) => {
    try {
      if (selectedTemplate) {
        // Update existing template
        const updatedTemplate = await updateModernTemplate(selectedTemplate.id, {
          ...templateData,
          updatedAt: new Date().toISOString()
        });
        setTemplates(prev => 
          prev.map(t => 
            t.id === selectedTemplate.id ? updatedTemplate : t
          )
        );
        showToast('Template updated successfully', 'success');
      } else {
        // Create new template
        const newTemplate = await createModernTemplate({
          ...templateData,
          description: '',
          createdBy: 'Current User',
          usage_count: 0,
          tags: []
        });
        setTemplates(prev => [newTemplate, ...prev]);
        showToast('Template created successfully', 'success');
      }
      setShowBuilder(false);
    } catch (error) {
      console.error('Error saving template:', error);
      showToast('Error saving template', 'error');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteModernTemplate(templateId);
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        showToast('Template deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting template:', error);
        showToast('Error deleting template', 'error');
      }
    }
  };

  const handleDuplicateTemplate = async (template: ModernTemplate) => {
    try {
      const duplicatedTemplate = await createModernTemplate({
        ...template,
        name: `${template.name} (Copy)`,
        createdBy: 'Current User',
        usage_count: 0,
        isDefault: false
      });
      setTemplates(prev => [duplicatedTemplate, ...prev]);
      showToast('Template duplicated successfully', 'success');
    } catch (error) {
      console.error('Error duplicating template:', error);
      showToast('Error duplicating template', 'error');
    }
  };

  const handlePreviewTemplate = (template: ModernTemplate) => {
    // TODO: Implement template preview modal
    console.log('Preview template:', template);
  };

  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterTag === 'all' || template.tags?.includes(filterTag);
    return matchesSearch && matchesFilter;
  });

  const uniqueTags = ['all', ...new Set(templates.flatMap(t => t.tags || []))];

  if (showBuilder) {
    return (
      <TemplateBuilder
        onSave={handleSaveTemplate}
        initialTemplate={selectedTemplate ? {
          name: selectedTemplate.name,
          elements: selectedTemplate.elements
        } : undefined}
      />
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600 mt-1">Create and manage quotation templates</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            leftIcon={<Upload />}
          >
            Import
          </Button>
          <Button
            onClick={handleCreateTemplate}
            leftIcon={<Plus />}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            Create Template
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterTag}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterTag(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {uniqueTags.map(tag => (
              <option key={tag} value={tag}>
                {tag === 'all' ? 'All Categories' : tag.charAt(0).toUpperCase() + tag.slice(1)}
              </option>
            ))}
          </select>
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'accent' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'accent' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Templates Grid/List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {filteredTemplates.map(template => (
            <Card 
              key={template.id} 
              className={`group hover:shadow-lg transition-all duration-200 ${
                template.isDefault ? 'ring-2 ring-primary-200' : ''
              } ${
                viewMode === 'list' ? 'flex-row' : ''
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary-600" />
                        {template.isDefault && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreviewTemplate(template)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-sm text-gray-600">{template.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Tags */}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{template.createdBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* Usage Stats */}
                      <div className="text-sm text-gray-500">
                        Used {template.usage_count || 0} times
                      </div>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-between p-4 w-full">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary-600" />
                      {template.isDefault && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span>By {template.createdBy}</span>
                        <span>Updated {new Date(template.updatedAt).toLocaleDateString()}</span>
                        <span>Used {template.usage_count || 0} times</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!template.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-2">
            {searchTerm || filterTag !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first template.'
            }
          </p>
          <p className="text-gray-500 mb-4">You can create a new template from here. Click the button below to get started.</p>
          {!searchTerm && filterTag === 'all' && (
            <Button
              onClick={handleCreateTemplate}
              leftIcon={<Plus />}
            >
              Create Your First Template
            </Button>
          )}
        </div>
      )}

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
};
