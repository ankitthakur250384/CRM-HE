/**
 * Modern Template Builder Component
 * Drag-and-drop template creation with real-time preview
 */

import React, { useState, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Layout, 
  Type, 
  Image as ImageIcon, 
  Table, 
  Calendar, 
  DollarSign, 
  User, 
  Building, 
  Phone,
  Mail,
  MapPin,
  Hash,
  FileText,
  Trash2,
  Eye,
  Save,
  Settings,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';

// Template element types
interface TemplateElement {
  id: string;
  type: 'text' | 'field' | 'table' | 'image' | 'spacer' | 'line' | 'signature';
  content?: string;
  fieldType?: string;
  styles?: {
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
    textAlign?: 'left' | 'center' | 'right';
    color?: string;
    backgroundColor?: string;
    padding?: number;
    margin?: number;
  };
  props?: Record<string, any>;
}

// Available field types for quotations
const FIELD_TYPES = [
  { type: 'customer.name', label: 'Customer Name', icon: User },
  { type: 'customer.company', label: 'Company', icon: Building },
  { type: 'customer.email', label: 'Email', icon: Mail },
  { type: 'customer.phone', label: 'Phone', icon: Phone },
  { type: 'customer.address', label: 'Address', icon: MapPin },
  { type: 'quotation.id', label: 'Quotation ID', icon: Hash },
  { type: 'quotation.date', label: 'Date', icon: Calendar },
  { type: 'quotation.validUntil', label: 'Valid Until', icon: Calendar },
  { type: 'quotation.totalAmount', label: 'Total Amount', icon: DollarSign },
  { type: 'quotation.workingCost', label: 'Working Cost', icon: DollarSign },
  { type: 'quotation.mobDemobCost', label: 'Mob/Demob Cost', icon: DollarSign },
  { type: 'quotation.foodAccomCost', label: 'Food & Accommodation', icon: DollarSign },
  { type: 'quotation.gstAmount', label: 'GST Amount', icon: DollarSign },
  { type: 'quotation.machineType', label: 'Machine Type', icon: FileText },
  { type: 'quotation.numberOfDays', label: 'Number of Days', icon: Hash },
  { type: 'quotation.workingHours', label: 'Working Hours', icon: Hash },
];

// Draggable component types
const COMPONENT_TYPES = [
  { type: 'text', label: 'Text Block', icon: Type, description: 'Add custom text content' },
  { type: 'field', label: 'Dynamic Field', icon: FileText, description: 'Insert quotation data' },
  { type: 'table', label: 'Data Table', icon: Table, description: 'Display tabular data' },
  { type: 'image', label: 'Image/Logo', icon: ImageIcon, description: 'Add company logo or images' },
  { type: 'spacer', label: 'Spacer', icon: Layout, description: 'Add vertical spacing' },
  { type: 'line', label: 'Divider Line', icon: Layout, description: 'Add horizontal line' },
  { type: 'signature', label: 'Signature Block', icon: User, description: 'Add signature area' },
];

// Draggable component item
const DraggableComponent: React.FC<{ 
  component: typeof COMPONENT_TYPES[0]; 
  onAdd: (type: string) => void;
}> = ({ component, onAdd }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: { componentType: component.type },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        onAdd(component.type);
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const IconComponent = component.icon;

  return (
    <div
      ref={drag}
      className={`p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-all duration-200 ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={() => onAdd(component.type)}
    >
      <div className="flex items-center gap-2 mb-2">
        <IconComponent className="h-4 w-4 text-primary-600" />
        <span className="font-medium text-sm">{component.label}</span>
      </div>
      <p className="text-xs text-gray-500">{component.description}</p>
    </div>
  );
};

// Template element editor
const ElementEditor: React.FC<{
  element: TemplateElement;
  onUpdate: (element: TemplateElement) => void;
  onDelete: () => void;
}> = ({ element, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);

  const updateStyles = (newStyles: Partial<TemplateElement['styles']>) => {
    onUpdate({
      ...element,
      styles: { ...element.styles, ...newStyles }
    });
  };

  const updateContent = (content: string) => {
    onUpdate({ ...element, content });
  };

  const updateFieldType = (fieldType: string) => {
    onUpdate({ ...element, fieldType });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-2 group hover:border-primary-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize">{element.type}</span>
          {element.type === 'field' && element.fieldType && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
              {FIELD_TYPES.find(f => f.type === element.fieldType)?.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
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

      {/* Style Editor */}
      {isEditing && (
        <div className="bg-gray-50 p-3 rounded-md space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Text Alignment */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alignment</label>
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                {[
                  { value: 'left', icon: AlignLeft },
                  { value: 'center', icon: AlignCenter },
                  { value: 'right', icon: AlignRight }
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateStyles({ textAlign: value as any })}
                    className={`flex-1 p-2 text-xs ${
                      element.styles?.textAlign === value
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-3 w-3 mx-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
              <Input
                type="number"
                value={element.styles?.fontSize || 14}
                onChange={(e) => updateStyles({ fontSize: parseInt(e.target.value) })}
                min="8"
                max="72"
                className="text-xs"
              />
            </div>
          </div>

          {/* Text Style Buttons */}
          <div className="flex gap-1">
            {[
              { prop: 'fontWeight', value: 'bold', icon: Bold },
              { prop: 'fontStyle', value: 'italic', icon: Italic },
              { prop: 'textDecoration', value: 'underline', icon: Underline }
            ].map(({ prop, value, icon: Icon }) => {
              const current = element.styles?.[prop as keyof typeof element.styles];
              return (
                <Button
                  key={prop}
                  size="sm"
                  variant={current === value ? 'accent' : 'ghost'}
                  onClick={() => updateStyles({ [prop]: current === value ? 'normal' : value })}
                >
                  <Icon className="h-3 w-3" />
                </Button>
              );
            })}
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
              <input
                type="color"
                value={element.styles?.color || '#000000'}
                onChange={(e) => updateStyles({ color: e.target.value })}
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
              <input
                type="color"
                value={element.styles?.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
                className="w-full h-8 border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Template preview component
const TemplatePreview: React.FC<{ elements: TemplateElement[] }> = ({ elements }) => {
  const renderElement = (element: TemplateElement) => {
    const style = {
      fontSize: element.styles?.fontSize || 14,
      fontWeight: element.styles?.fontWeight || 'normal',
      fontStyle: element.styles?.fontStyle || 'normal',
      textDecoration: element.styles?.textDecoration || 'none',
      textAlign: element.styles?.textAlign || 'left',
      color: element.styles?.color || '#000000',
      backgroundColor: element.styles?.backgroundColor || 'transparent',
      padding: element.styles?.padding || 0,
      margin: element.styles?.margin || 0,
    };

    switch (element.type) {
      case 'text':
        return (
          <div style={style} className="mb-2">
            {element.content || 'Sample text content'}
          </div>
        );

      case 'field':
        const fieldInfo = FIELD_TYPES.find(f => f.type === element.fieldType);
        return (
          <div style={style} className="mb-2 bg-blue-50 border border-blue-200 px-2 py-1 rounded inline-block">
            {fieldInfo ? `{${fieldInfo.label}}` : '{Select Field}'}
          </div>
        );

      case 'table':
        return (
          <div style={style} className="mb-4">
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
          <div style={style} className="mb-4 border-2 border-dashed border-gray-300 p-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Company Logo / Image</p>
          </div>
        );

      case 'spacer':
        return <div style={{ height: element.styles?.padding || 20 }} className="mb-2" />;

      case 'line':
        return <hr style={style} className="mb-4 border-gray-300" />;

      case 'signature':
        return (
          <div style={style} className="mb-4 border border-gray-300 p-4">
            <p className="text-gray-600 mb-8">Signature:</p>
            <div className="border-b border-gray-300 w-64"></div>
            <p className="text-sm text-gray-500 mt-2">Authorized Signatory</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-8 border border-gray-200 rounded-lg min-h-[600px]">
      <div className="max-w-4xl mx-auto">
        {elements.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p>Start building your template by dragging components from the left panel</p>
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
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const elementIdCounter = useRef(0);

  const generateElementId = () => {
    elementIdCounter.current += 1;
    return `element_${elementIdCounter.current}`;
  };

  const addElement = useCallback((type: string) => {
    const newElement: TemplateElement = {
      id: generateElementId(),
      type: type as any,
      content: type === 'text' ? 'Sample text' : undefined,
      styles: {
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'left',
        color: '#000000',
        backgroundColor: 'transparent',
        padding: 0,
        margin: 0,
      }
    };

    setElements(prev => [...prev, newElement]);
  }, []);

  const updateElement = useCallback((updatedElement: TemplateElement) => {
    setElements(prev => 
      prev.map(el => el.id === updatedElement.id ? updatedElement : el)
    );
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  }, [selectedElementId]);

  // moveElement is not used, so removed to clean up warnings

  const handleSave = () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }
    onSave({ name: templateName, elements });
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'component',
    drop: () => ({ name: 'TemplateBuilder' }),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <DndProvider backend={HTML5Backend}>
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
                {COMPONENT_TYPES.map(component => (
                  <DraggableComponent
                    key={component.type}
                    component={component}
                    onAdd={addElement}
                  />
                ))}
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
              <>
                {/* Template Editor */}
                <div 
                  ref={drop}
                  className={`flex-1 p-6 overflow-y-auto ${isOver ? 'bg-blue-50' : ''}`}
                >
                  <div className="max-w-4xl mx-auto">
                    <Card>
                      <CardHeader>
                        <CardTitle>Template Structure</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {elements.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <Grid className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p>Drag components here to start building your template</p>
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
              </>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};
