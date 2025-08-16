/**
 * Modern Template Builder - SOTA Implementation
 * Complete drag-and-drop template builder with preview, editing, and persistence
 */

import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Trash2, Move, Type, Database, Grid, Image, Minus, Save, Eye,
  FileText, Settings, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { ModernTemplate, TemplateElement } from '../../services/modernTemplateService';
import TemplatePreviewModal from './TemplatePreviewModal';

// Drag item types
const ItemTypes = {
  ELEMENT: 'element',
  PALETTE_ITEM: 'palette_item'
};

// Enhanced element interface with styling and configuration
export interface EnhancedTemplateElement extends TemplateElement {
  style?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    textAlign?: 'left' | 'center' | 'right';
    border?: string;
    borderRadius?: string;
  };
  config?: {
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
    options?: string[];
  };
}

interface ModernTemplateBuilderProps {
  template?: ModernTemplate;
  onSave: (template: Omit<ModernTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

// Palette items for the template builder
const paletteItems = [
  { 
    type: 'header', 
    label: 'Header Section', 
    icon: Type, 
    description: 'Company logo and title',
    defaultContent: 'Company Header'
  },
  { 
    type: 'text', 
    label: 'Text Block', 
    icon: Type, 
    description: 'Add custom text content',
    defaultContent: 'Your text content here'
  },
  { 
    type: 'field', 
    label: 'Dynamic Field', 
    icon: Database, 
    description: 'Insert quotation data',
    defaultContent: '{{customer_name}}'
  },
  { 
    type: 'table', 
    label: 'Data Table', 
    icon: Grid, 
    description: 'Display equipment and pricing',
    defaultContent: 'Equipment Table'
  },
  { 
    type: 'terms', 
    label: 'Terms & Conditions', 
    icon: FileText, 
    description: 'Legal terms and conditions',
    defaultContent: 'Terms and Conditions'
  },
  { 
    type: 'image', 
    label: 'Image/Logo', 
    icon: Image, 
    description: 'Company logo or images',
    defaultContent: 'Image Placeholder'
  },
  { 
    type: 'spacer', 
    label: 'Spacer', 
    icon: Minus, 
    description: 'Add vertical spacing',
    defaultContent: ''
  }
] as const;

// Field options for dynamic content
const fieldOptions = [
  { value: '{{company_name}}', label: 'Company Name' },
  { value: '{{company_address}}', label: 'Company Address' },
  { value: '{{customer_name}}', label: 'Customer Name' },
  { value: '{{customer_address}}', label: 'Customer Address' },
  { value: '{{quotation_number}}', label: 'Quotation Number' },
  { value: '{{quotation_date}}', label: 'Quotation Date' },
  { value: '{{total_amount}}', label: 'Total Amount' }
];

// Draggable palette item
function PaletteItem({ item }: { item: typeof paletteItems[number] }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PALETTE_ITEM,
    item: { elementType: item.type, defaultContent: item.defaultContent },
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

// Element editor panel
function ElementEditor({ 
  element, 
  onUpdate, 
  onClose 
}: { 
  element: EnhancedTemplateElement;
  onUpdate: (updates: Partial<EnhancedTemplateElement>) => void;
  onClose: () => void;
}) {
  const [localElement, setLocalElement] = useState(element);
  const [hasChanges, setHasChanges] = useState(false);

  const handleStyleChange = (styleKey: string, value: string) => {
    setLocalElement(prev => ({
      ...prev,
      style: { ...prev.style, [styleKey]: value }
    }));
    setHasChanges(true);
  };

  const handleContentChange = (content: string) => {
    setLocalElement(prev => ({ ...prev, content }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localElement);
    onClose();
    console.log('💾 Element changes saved');
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmCancel) return;
    }
    onClose();
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Edit Element</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>

      <div className="space-y-4">
        {/* Content Editor */}
        <div>
          <div className="block text-sm font-medium text-gray-700 mb-1">Content</div>
          {element.type === 'field' ? (
            <select
              value={localElement.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a field</option>
              {fieldOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <TextArea
              value={localElement.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={3}
              placeholder="Enter content..."
            />
          )}
        </div>

        {/* Styling Options */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Styling</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Font Size</div>
              <select
                value={localElement.style?.fontSize || '14px'}
                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
              </select>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Font Weight</div>
              <select
                value={localElement.style?.fontWeight || 'normal'}
                onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="600">Semi Bold</option>
                <option value="300">Light</option>
              </select>
            </div>
          </div>

          <div>
            <div className="block text-sm font-medium text-gray-700 mb-1">Text Alignment</div>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(align => (
                <Button
                  key={align}
                  variant={localElement.style?.textAlign === align ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleStyleChange('textAlign', align)}
                >
                  {align === 'left' && <AlignLeft size={16} />}
                  {align === 'center' && <AlignCenter size={16} />}
                  {align === 'right' && <AlignRight size={16} />}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="block text-sm font-medium text-gray-700 mb-1">Text Color</div>
            <Input
              type="color"
              value={localElement.style?.color || '#000000'}
              onChange={(e) => handleStyleChange('color', e.target.value)}
            />
          </div>

          <div>
            <div className="block text-sm font-medium text-gray-700 mb-1">Background Color</div>
            <Input
              type="color"
              value={localElement.style?.backgroundColor || '#ffffff'}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Padding</div>
              <Input
                value={localElement.style?.padding || '8px'}
                onChange={(e) => handleStyleChange('padding', e.target.value)}
                placeholder="8px"
              />
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Margin</div>
              <Input
                value={localElement.style?.margin || '0px'}
                onChange={(e) => handleStyleChange('margin', e.target.value)}
                placeholder="0px"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1" disabled={!hasChanges}>
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </Button>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// Template canvas element
function CanvasElement({ 
  element, 
  index, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  onEdit,
  isFirst,
  isLast
}: {
  element: EnhancedTemplateElement;
  index: number;
  onDelete: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (element: EnhancedTemplateElement, index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const elementStyle = {
    fontSize: element.style?.fontSize || '14px',
    fontWeight: element.style?.fontWeight || 'normal',
    color: element.style?.color || '#000000',
    backgroundColor: element.style?.backgroundColor || 'transparent',
    padding: element.style?.padding || '8px',
    margin: element.style?.margin || '0px',
    textAlign: element.style?.textAlign || 'left',
  } as React.CSSProperties;

  const renderElementContent = () => {
    switch (element.type) {
      case 'header':
        return (
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded">
            <h1 className="text-2xl font-bold" style={elementStyle}>
              {element.content || 'Company Header'}
            </h1>
          </div>
        );
      
      case 'text':
        return (
          <div style={elementStyle}>
            {element.content || 'Text content'}
          </div>
        );
      
      case 'field':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2" style={elementStyle}>
            <span className="text-yellow-700">
              {element.content || '{{field_name}}'}
            </span>
          </div>
        );
      
      case 'table':
        return (
          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 p-2 text-left">Equipment</th>
                  <th className="border border-gray-300 p-2 text-left">Capacity</th>
                  <th className="border border-gray-300 p-2 text-left">Duration</th>
                  <th className="border border-gray-300 p-2 text-left">Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">Mobile Crane</td>
                  <td className="border border-gray-300 p-2">100MT</td>
                  <td className="border border-gray-300 p-2">1 Month</td>
                  <td className="border border-gray-300 p-2">₹7,85,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center bg-gray-50">
            <Image size={48} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Image Placeholder</p>
            <p className="text-xs text-gray-400">{element.content || 'Click to upload image'}</p>
          </div>
        );
      
      case 'terms':
        return (
          <div className="bg-gray-50 border border-gray-200 rounded p-4" style={elementStyle}>
            <h3 className="font-semibold mb-2">Terms & Conditions</h3>
            <div className="text-sm text-gray-700">
              {element.content || 'Terms and conditions content will appear here...'}
            </div>
          </div>
        );
      
      case 'spacer':
        return (
          <div 
            className="border-2 border-dashed border-gray-300 bg-gray-50"
            style={{ height: element.content || '20px' }}
          >
            <div className="text-center text-xs text-gray-400 leading-5">
              Spacer ({element.content || '20px'})
            </div>
          </div>
        );
      
      default:
        return <div>Unknown element type</div>;
    }
  };

  return (
    <div className="group relative border border-gray-200 rounded-lg p-2 mb-2 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
      {/* Element Controls */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-sm border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(element, index)}
          className="p-1 h-6 w-6"
        >
          <Settings size={12} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMoveUp(index)}
          disabled={isFirst}
          className="p-1 h-6 w-6"
        >
          <ArrowUp size={12} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onMoveDown(index)}
          disabled={isLast}
          className="p-1 h-6 w-6"
        >
          <ArrowDown size={12} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(index)}
          className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
        >
          <Trash2 size={12} />
        </Button>
      </div>

      {/* Element Content */}
      <div className="pointer-events-none">
        {renderElementContent()}
      </div>

      {/* Drag Handle */}
      <div className="absolute left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-1">
        <Move size={12} className="text-gray-400" />
      </div>
    </div>
  );
}

// Template canvas with drop zone
function TemplateCanvas({ 
  elements, 
  onElementsChange, 
  onEditElement 
}: {
  elements: EnhancedTemplateElement[];
  onElementsChange: (elements: EnhancedTemplateElement[]) => void;
  onEditElement: (element: EnhancedTemplateElement, index: number) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.PALETTE_ITEM,
    drop: (item: { elementType: string; defaultContent: string }) => {
      const newElement: EnhancedTemplateElement = {
        id: `element-${Date.now()}`,
        type: item.elementType as any,
        content: item.defaultContent || '',
        style: {
          fontSize: '14px',
          fontWeight: 'normal',
          color: '#000000',
          backgroundColor: 'transparent',
          padding: '8px',
          margin: '4px 0',
          textAlign: 'left'
        }
      };
      
      onElementsChange([...elements, newElement]);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleElementDelete = (index: number) => {
    onElementsChange(elements.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newElements = [...elements];
      [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
      onElementsChange(newElements);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < elements.length - 1) {
      const newElements = [...elements];
      [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
      onElementsChange(newElements);
    }
  };

  return (
    <div
      ref={drop}
      className={`
        min-h-96 p-4 border-2 border-dashed rounded-lg
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}
        transition-colors duration-200
      `}
    >
      {elements.length === 0 ? (
        <div className="text-center py-12">
          <Type size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Start Building Your Template
          </h3>
          <p className="text-gray-500">
            Drag elements from the palette to create your quotation template
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {elements.map((element, index) => (
            <CanvasElement
              key={element.id}
              element={element}
              index={index}
              onDelete={handleElementDelete}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onEdit={onEditElement}
              isFirst={index === 0}
              isLast={index === elements.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Modern Template Builder Component
export default function ModernTemplateBuilder({ 
  template, 
  onSave, 
  onCancel
}: ModernTemplateBuilderProps) {
  const [templateName, setTemplateName] = useState(template?.name || '');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [elements, setElements] = useState<EnhancedTemplateElement[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingElement, setEditingElement] = useState<{ element: EnhancedTemplateElement; index: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load template data when component mounts or template prop changes
  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      
      // Convert template elements to enhanced elements with default styling
      const enhancedElements: EnhancedTemplateElement[] = (template.elements || []).map(el => ({
        ...el,
        style: {
          fontSize: '14px',
          fontWeight: 'normal',
          color: '#000000',
          backgroundColor: 'transparent',
          padding: '8px',
          margin: '4px 0',
          textAlign: 'left',
          ...((el as any).style || {})
        }
      }));
      
      setElements(enhancedElements);
    }
  }, [template]);

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (elements.length === 0) {
      alert('Please add at least one element to the template');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: templateName.trim(),
        description: templateDescription.trim(),
        elements: elements.map(el => ({
          id: el.id,
          type: el.type,
          content: el.content,
          fieldType: el.fieldType,
          style: el.style,
          config: el.config
        })),
        tags: template?.tags || [],
        usage_count: template?.usage_count || 0,
        createdBy: template?.createdBy || 'current-user'
      };

      await onSave(templateData);
      
      // Show success feedback
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('✅ Template saved successfully');
    } catch (error) {
      console.error('❌ Error saving template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (elements.length === 0) {
      alert('Please add elements to preview the template');
      return;
    }
    setShowPreview(true);
    console.log('🔍 Opening preview for template:', templateName);
  };

  const handleEditElement = (element: EnhancedTemplateElement, index: number) => {
    setEditingElement({ element, index });
  };

  const handleElementEditorUpdate = (updates: Partial<EnhancedTemplateElement>) => {
    if (editingElement) {
      const newElements = [...elements];
      newElements[editingElement.index] = { ...newElements[editingElement.index], ...updates };
      setElements(newElements);
      console.log('🎨 Element updated:', updates);
    }
  };

  const handleElementEditorClose = () => {
    setEditingElement(null);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-100">
        {/* Success notification */}
        {saveSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            ✅ Template saved successfully!
          </div>
        )}

        {/* Left Sidebar - Element Palette */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Template Elements</h2>
            <p className="text-sm text-gray-600 mb-4">
              Drag elements to the canvas to build your template
            </p>
            
            <div className="space-y-3">
              {paletteItems.map((item) => (
                <PaletteItem key={item.type} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template Name"
                  className="text-lg font-semibold mb-2"
                />
                <Input
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Template Description (optional)"
                  className="text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handlePreview}
                  disabled={elements.length === 0}
                  title="Preview template with sample data"
                >
                  <Eye size={16} className="mr-2" />
                  Preview
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={saving || !templateName.trim() || elements.length === 0}
                  title="Save template to database"
                >
                  <Save size={16} className="mr-2" />
                  {saving ? 'Saving...' : 'Save Template'}
                </Button>
                
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            <TemplateCanvas
              elements={elements}
              onElementsChange={setElements}
              onEditElement={handleEditElement}
            />
          </div>
        </div>

        {/* Right Sidebar - Element Editor */}
        {editingElement && (
          <ElementEditor
            element={editingElement.element}
            onUpdate={handleElementEditorUpdate}
            onClose={handleElementEditorClose}
          />
        )}

        {/* Template Preview Modal */}
        <TemplatePreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          elements={elements}
          templateName={templateName}
        />
      </div>
    </DndProvider>
  );
}
