/**
 * Simple Template Builder Component
 * Click-to-add template creation with preview
 */

import React, { useState } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  Table, 
  FileText,
  Trash2,
  Eye,
  Save,
  Plus,
  Minus
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';

// Template element types
interface TemplateElement {
  id: string;
  type: 'text' | 'field' | 'table' | 'image' | 'spacer';
  content?: string;
  fieldType?: string;
}

// Available field types for quotations
const FIELD_TYPES = [
  { type: 'customer.name', label: 'Customer Name' },
  { type: 'customer.company', label: 'Company' },
  { type: 'customer.email', label: 'Email' },
  { type: 'customer.phone', label: 'Phone' },
  { type: 'quotation.id', label: 'Quotation ID' },
  { type: 'quotation.date', label: 'Date' },
  { type: 'quotation.totalAmount', label: 'Total Amount' },
];

// Component types
const COMPONENT_TYPES = [
  { type: 'text', label: 'Text Block', icon: Type, description: 'Add custom text content' },
  { type: 'field', label: 'Dynamic Field', icon: FileText, description: 'Insert quotation data' },
  { type: 'table', label: 'Data Table', icon: Table, description: 'Display tabular data' },
  { type: 'image', label: 'Image/Logo', icon: ImageIcon, description: 'Add company logo or images' },
  { type: 'spacer', label: 'Spacer', icon: Minus, description: 'Add vertical spacing' },
];

// Element Editor Component
const ElementEditor: React.FC<{
  element: TemplateElement;
  onUpdate: (element: TemplateElement) => void;
  onDelete: () => void;
}> = ({ element, onUpdate, onDelete }) => {
  const updateContent = (content: string) => {
    onUpdate({ ...element, content });
  };

  const updateFieldType = (fieldType: string) => {
    onUpdate({ ...element, fieldType });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-2 group hover:border-blue-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize text-gray-800">{element.type}</span>
          {element.type === 'field' && element.fieldType && (
            <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded">
              {FIELD_TYPES.find(f => f.type === element.fieldType)?.label}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Content Editor */}
      {element.type === 'text' && (
        <Input
          value={element.content || ''}
          onChange={(e) => updateContent(e.target.value)}
          placeholder="Enter text content..."
          className="mb-3"
        />
      )}

      {element.type === 'field' && (
        <select
          value={element.fieldType || ''}
          onChange={(e) => updateFieldType(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md mb-3"
        >
          <option value="">Select a field...</option>
          {FIELD_TYPES.map(field => (
            <option key={field.type} value={field.type}>
              {field.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

// Template Preview Component
const TemplatePreview: React.FC<{ elements: TemplateElement[] }> = ({ elements }) => {
  const renderElement = (element: TemplateElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div className="mb-2 text-gray-900">
            {element.content || 'Sample text content'}
          </div>
        );

      case 'field':
        const fieldInfo = FIELD_TYPES.find(f => f.type === element.fieldType);
        return (
          <div className="mb-2 bg-blue-100 border border-blue-300 px-2 py-1 rounded inline-block text-blue-900">
            {fieldInfo ? `{${fieldInfo.label}}` : '{Select Field}'}
          </div>
        );

      case 'table':
        return (
          <div className="mb-4">
            <table className="w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-2 py-1 text-left">Item</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Quantity</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Rate</th>
                  <th className="border border-gray-300 px-2 py-1 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-1">Equipment Name</td>
                  <td className="border border-gray-300 px-2 py-1">1</td>
                  <td className="border border-gray-300 px-2 py-1">1000</td>
                  <td className="border border-gray-300 px-2 py-1">1000</td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 'image':
        return (
          <div className="mb-4 border-2 border-dashed border-gray-300 p-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-700">Company Logo / Image</p>
          </div>
        );

      case 'spacer':
        return <div style={{ height: 20 }} className="mb-2" />;

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-8 border border-gray-200 rounded-lg min-h-[600px]">
      <div className="max-w-4xl mx-auto">
        {elements.length === 0 ? (
          <div className="text-center text-gray-700 py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p>Start building your template by adding components</p>
          </div>
        ) : (
          elements.map((element) => (
            <div key={element.id}>
              {renderElement(element)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Main Template Builder Component
export const TemplateBuilder: React.FC<{
  onSave: (template: { name: string; elements: TemplateElement[] }) => void;
  initialTemplate?: { name: string; elements: TemplateElement[] };
}> = ({ onSave, initialTemplate }) => {
  const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
  const [elements, setElements] = useState<TemplateElement[]>(initialTemplate?.elements || []);
  const [showPreview, setShowPreview] = useState(false);
  let elementIdCounter = 0;

  const generateElementId = () => {
    elementIdCounter += 1;
    return `element_${elementIdCounter}_${Date.now()}`;
  };

  const addElement = (type: string) => {
    const newElement: TemplateElement = {
      id: generateElementId(),
      type: type as any,
      content: type === 'text' ? 'Sample text' : undefined,
    };

    setElements(prev => [...prev, newElement]);
  };

  const updateElement = (updatedElement: TemplateElement) => {
    setElements(prev => 
      prev.map(el => el.id === updatedElement.id ? updatedElement : el)
    );
  };

  const deleteElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    onSave({ name: templateName, elements });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Template Builder</h1>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name..."
              className="w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowPreview(!showPreview)}
              leftIcon={<Eye />}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={handleSave}
              leftIcon={<Save />}
            >
              Save Template
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {!showPreview && (
          <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Components</h3>
            <div className="grid grid-cols-1 gap-3">
              {COMPONENT_TYPES.map(component => {
                const IconComponent = component.icon;
                return (
                  <div
                    key={component.type}
                    className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => addElement(component.type)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent className="h-4 w-4 text-blue-700" />
                      <span className="font-semibold text-base text-gray-900">{component.label}</span>
                    </div>
                    <p className="text-xs text-gray-900 font-medium">{component.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {showPreview ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <TemplatePreview elements={elements} />
            </div>
          ) : (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Template Structure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {elements.length === 0 ? (
                      <div className="text-center py-12">
                        <Plus className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                        <p className="text-lg text-gray-900 font-semibold">Click on components from the left panel to add them to your template</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {elements.map((element) => (
                          <ElementEditor
                            key={element.id}
                            element={element}
                            onUpdate={updateElement}
                            onDelete={() => deleteElement(element.id)}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
