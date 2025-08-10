import React, { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Trash2 as DeleteIcon, 
  Move as DragIcon,
  Type as TextIcon,
  Database as FieldIcon,
  Grid as TableIcon,
  Image as ImageIcon,
  Minus as SpacerIcon,
  Save,
  Eye,
  Upload,
  FileText,
  Plus
} from 'lucide-react';
import { createModernTemplate, type TemplateElement } from '../services/modernTemplateService';
import { useAuthStore } from '../store/authStore';

// Simple toast notification using global function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  if ((window as any).showToast) {
    (window as any).showToast(message, type);
  } else {
    // Fallback to alert if toast system isn't loaded
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      alert(message);
    }
  }
};

// Drag item types
const ItemTypes = {
  ELEMENT: 'element',
  PALETTE_ITEM: 'palette_item'
};

// Enhanced palette items
const paletteItems = [
  { type: 'text', label: 'Text Block', icon: TextIcon, description: 'Add custom text content' },
  { type: 'field', label: 'Dynamic Field', icon: FieldIcon, description: 'Insert quotation data' },
  { type: 'table', label: 'Data Table', icon: TableIcon, description: 'Display tabular data' },
  { type: 'image', label: 'Image/Logo', icon: ImageIcon, description: 'Add company logo or images' },
  { type: 'spacer', label: 'Spacer', icon: SpacerIcon, description: 'Add vertical spacing' }
] as const;

type PaletteItemType = typeof paletteItems[number];

// Sample data for table preview
const sampleTableData = [
  { item: 'Mobile Crane 50T', quantity: 1, rate: '₹4,000/day', amount: '₹120,000' },
  { item: 'Operator Services', quantity: 1, rate: '₹500/day', amount: '₹15,000' },
  { item: 'Transportation', quantity: 1, rate: '₹2,000/km', amount: '₹50,000' },
  { item: 'Setup & Breakdown', quantity: 1, rate: '₹8,000', amount: '₹8,000' }
];

// Field options for dynamic fields
const fieldOptions = [
  { value: 'customer_name', label: 'Customer Name' },
  { value: 'customer_address', label: 'Customer Address' },
  { value: 'customer_phone', label: 'Customer Phone' },
  { value: 'quotation_number', label: 'Quotation Number' },
  { value: 'quotation_date', label: 'Quotation Date' },
  { value: 'validity_date', label: 'Validity Date' },
  { value: 'equipment_type', label: 'Equipment Type' },
  { value: 'total_amount', label: 'Total Amount' },
  { value: 'company_name', label: 'Company Name' },
  { value: 'company_address', label: 'Company Address' }
];

// Draggable palette item
function PaletteItem({ item }: { item: PaletteItemType }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PALETTE_ITEM,
    item: { elementType: item.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const IconComponent = item.icon;

  return (
    <div 
      ref={drag}
      className={`
        cursor-move p-3 bg-white border border-gray-200 rounded-lg shadow-sm
        hover:shadow-md hover:border-blue-300 transition-all duration-200
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="flex items-center gap-3">
        <IconComponent size={20} className="text-blue-600" />
        <div>
          <div className="font-medium text-sm text-gray-900">{item.label}</div>
          <div className="text-xs text-gray-500">{item.description}</div>
        </div>
      </div>
    </div>
  );
}

// Template canvas where elements are dropped and arranged
function TemplateCanvas({ 
  elements, 
  setElements 
}: { 
  elements: TemplateElement[], 
  setElements: React.Dispatch<React.SetStateAction<TemplateElement[]>>
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.PALETTE_ITEM,
    drop: (item: { elementType: string }, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      const newElement: TemplateElement = {
        id: `element-${Date.now()}`,
        type: item.elementType as 'text' | 'field' | 'table' | 'image' | 'spacer',
        content: '',
        fieldType: undefined
      };
      
      setElements(prev => [...prev, newElement]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const moveElement = useCallback((dragIndex: number, dropIndex: number) => {
    setElements(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(dragIndex, 1);
      result.splice(dropIndex, 0, removed);
      return result;
    });
  }, [setElements]);

  const updateElement = useCallback((index: number, updates: Partial<TemplateElement>) => {
    setElements(prev => prev.map((el, i) => i === index ? { ...el, ...updates } : el));
  }, [setElements]);

  const removeElement = useCallback((index: number) => {
    setElements(prev => prev.filter((_, i) => i !== index));
  }, [setElements]);

  return (
    <div 
      ref={drop}
      className={`
        min-h-[500px] border-2 border-dashed rounded-lg p-4 transition-colors
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}
      `}
    >
      {elements.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          <DragIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Drop elements here to build your template</p>
          <p className="text-sm">Drag items from the palette to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {elements.map((element, index) => (
            <TemplateElementEditor
              key={element.id}
              element={element}
              index={index}
              moveElement={moveElement}
              updateElement={updateElement}
              removeElement={removeElement}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Individual template element editor
function TemplateElementEditor({
  element,
  index,
  moveElement,
  updateElement,
  removeElement
}: {
  element: TemplateElement;
  index: number;
  moveElement: (dragIndex: number, dropIndex: number) => void;
  updateElement: (index: number, updates: Partial<TemplateElement>) => void;
  removeElement: (index: number) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ELEMENT,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: ItemTypes.ELEMENT,
    drop: (item: { index: number }) => {
      if (item.index !== index) {
        moveElement(item.index, index);
      }
    },
  }));

  const handleContentChange = (content: string) => {
    updateElement(index, { content });
  };

  const renderElementContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <div>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md resize-vertical font-mono text-sm"
              rows={4}
              value={element.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter your text content here..."
            />
            <div className="mt-2 p-3 bg-gray-50 border rounded-md">
              <div className="text-xs text-gray-600 mb-1">Preview:</div>
              <div className="text-sm whitespace-pre-wrap">
                {element.content || 'Your text will appear here...'}
              </div>
            </div>
          </div>
        );
      case 'field':
        return (
          <div>
            <select
              className="w-full p-3 border border-gray-300 rounded-md mb-3"
              value={element.fieldType || ''}
              onChange={(e) => updateElement(index, { fieldType: e.target.value })}
            >
              <option value="">Select a field...</option>
              {fieldOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-xs text-blue-600 mb-1">Dynamic Field:</div>
              <div className="font-mono text-sm text-blue-800">
                {element.fieldType ? `{{${element.fieldType}}}` : 'Select a field above'}
              </div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Title
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={element.content || 'Cost Breakdown'}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Table title..."
              />
            </div>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-left font-medium">Qty</th>
                    <th className="px-3 py-2 text-left font-medium">Rate</th>
                    <th className="px-3 py-2 text-left font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleTableData.map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">{row.item}</td>
                      <td className="px-3 py-2">{row.quantity}</td>
                      <td className="px-3 py-2">{row.rate}</td>
                      <td className="px-3 py-2 font-medium">{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              This table will display actual quotation data when used in templates
            </div>
          </div>
        );
      case 'image':
        return (
          <div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Source
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                  value={element.content || ''}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter image URL or upload an image..."
                />
                <button
                  type="button"
                  onClick={() => document.getElementById(`file-input-${element.id}`)?.click()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                >
                  <Upload size={16} />
                  Upload
                </button>
                <input
                  id={`file-input-${element.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        handleContentChange(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div>
            {element.content && (
              <div className="mt-3 p-3 bg-gray-50 border rounded-md">
                <div className="text-xs text-gray-600 mb-2">Preview:</div>
                <img
                  src={element.content}
                  alt="Template image"
                  className="max-w-full h-32 object-contain border rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        );
      case 'spacer':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spacer Height
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={element.content || 'medium'}
              onChange={(e) => handleContentChange(e.target.value)}
            >
              <option value="small">Small (20px)</option>
              <option value="medium">Medium (40px)</option>
              <option value="large">Large (60px)</option>
              <option value="xlarge">Extra Large (100px)</option>
            </select>
            <div className="mt-3 p-3 bg-gray-50 border rounded-md">
              <div className="text-xs text-gray-600 mb-2">Preview:</div>
              <div 
                className="bg-gray-200 border-2 border-dashed border-gray-400 rounded"
                style={{
                  height: element.content === 'small' ? '20px' : 
                         element.content === 'large' ? '60px' :
                         element.content === 'xlarge' ? '100px' : '40px'
                }}
              />
            </div>
          </div>
        );
      default:
        return <div>Unknown element type</div>;
    }
  };

  return (
    <div 
      ref={(node) => drag(drop(node))}
      className={`
        bg-white border border-gray-200 rounded-lg p-4 shadow-sm
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        hover:shadow-md transition-shadow
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DragIcon size={16} className="text-gray-400 cursor-move" />
          <span className="font-medium text-sm text-gray-700 capitalize">
            {element.type} Element
          </span>
        </div>
        <button
          onClick={() => removeElement(index)}
          className="text-red-500 hover:text-red-700 p-1"
          title="Remove element"
        >
          <DeleteIcon size={16} />
        </button>
      </div>
      
      {renderElementContent()}
    </div>
  );
}

export default function TemplateBuilder() {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();

  const handleSave = async () => {
    if (!templateName.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }

    if (elements.length === 0) {
      showToast('Please add at least one element to the template', 'error');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: templateName.trim(),
        description: templateDescription.trim(),
        elements,
        createdBy: user?.id || 'unknown',
        usage_count: 0,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Saving template:', templateData);
      
      await createModernTemplate(templateData);
      
      showToast('Template saved successfully!');
      
      // Reset form
      setTemplateName('');
      setTemplateDescription('');
      setElements([]);
      
    } catch (error) {
      console.error('Error saving template:', error);
      showToast(`Failed to save template: ${(error as Error).message || 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addElement = (type: 'text' | 'field' | 'table' | 'image' | 'spacer') => {
    const newElement: TemplateElement = {
      id: `element-${Date.now()}`,
      type,
      content: '',
      fieldType: undefined
    };
    setElements([...elements, newElement]);
  };

  const renderPreviewElement = (element: TemplateElement) => {
    switch (element.type) {
      case 'text':
        return (
          <div className="text-sm">
            {element.content || 'Sample text content will appear here...'}
          </div>
        );
      case 'field':
        return (
          <div className="text-sm bg-blue-50 px-2 py-1 rounded border">
            <span className="font-mono text-blue-800">
              {element.fieldType ? `{{${element.fieldType}}}` : 'Dynamic Field'}
            </span>
          </div>
        );
      case 'table':
        return (
          <div>
            <div className="font-medium text-sm mb-2">
              {element.content || 'Cost Breakdown'}
            </div>
            <table className="w-full text-xs border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-1 text-left border">Item</th>
                  <th className="px-2 py-1 text-left border">Qty</th>
                  <th className="px-2 py-1 text-left border">Rate</th>
                  <th className="px-2 py-1 text-left border">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sampleTableData.slice(0, 3).map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 border">{row.item}</td>
                    <td className="px-2 py-1 border">{row.quantity}</td>
                    <td className="px-2 py-1 border">{row.rate}</td>
                    <td className="px-2 py-1 border font-medium">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'image':
        return (
          <div className="border border-gray-200 rounded p-2">
            {element.content ? (
              <img
                src={element.content}
                alt="Template image"
                className="max-w-full h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="h-16 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                Image placeholder
              </div>
            )}
          </div>
        );
      case 'spacer':
        return (
          <div 
            className="bg-gray-100 border-2 border-dashed border-gray-300 rounded"
            style={{
              height: element.content === 'small' ? '10px' : 
                     element.content === 'large' ? '30px' :
                     element.content === 'xlarge' ? '50px' : '20px'
            }}
          />
        );
      default:
        return <div className="text-xs text-gray-400">Unknown element</div>;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Modern Template Builder
          </h1>
          <p className="text-gray-600">
            Create dynamic quotation templates with drag-and-drop elements
          </p>
        </div>

        {/* Template metadata */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter template name..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter template description..."
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Element Palette */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-4">Element Palette</h3>
              <div className="space-y-3">
                {paletteItems.map((item, index) => (
                  <PaletteItem key={index} item={item} />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => addElement('text')}
                  className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded-md text-sm flex items-center gap-2"
                >
                  <Plus size={14} />
                  Add Text Block
                </button>
                <button
                  onClick={() => addElement('table')}
                  className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded-md text-sm flex items-center gap-2"
                >
                  <Plus size={14} />
                  Add Table
                </button>
                <button
                  onClick={() => addElement('image')}
                  className="w-full px-3 py-2 text-left bg-gray-50 hover:bg-gray-100 rounded-md text-sm flex items-center gap-2"
                >
                  <Plus size={14} />
                  Add Image
                </button>
              </div>
            </div>
          </div>

          {/* Template Canvas */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Template Canvas</h3>
                <button
                  onClick={handleSave}
                  disabled={saving || !templateName.trim() || elements.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Template
                    </>
                  )}
                </button>
              </div>
              
              <TemplateCanvas 
                elements={elements} 
                setElements={setElements} 
              />
            </div>
          </div>

          {/* Live Preview - WYSIWYG Paper Format */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye size={16} />
                Live Preview
              </h3>
              
              <div className="bg-gray-50 p-4 rounded-md border-2 border-dashed border-gray-300 min-h-[600px]">
                <div className="bg-white shadow-sm rounded p-4 space-y-4" style={{ transform: 'scale(0.8)', transformOrigin: 'top left' }}>
                  {elements.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Add elements to see live preview</p>
                    </div>
                  ) : (
                    elements.map((element) => (
                      <div key={element.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                        {renderPreviewElement(element)}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                This preview shows how your template will appear in quotations
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
