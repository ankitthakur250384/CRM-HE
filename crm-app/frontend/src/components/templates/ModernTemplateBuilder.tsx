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
  AlignLeft, AlignCenter, AlignRight, Plus
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
    width?: string;
    height?: string;
    maxWidth?: string;
    minHeight?: string;
  };
  config?: {
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
    options?: string[];
    // Table configuration
    columns?: string[];
    rows?: string[][];
    showHeader?: boolean;
    columnWidths?: string[];
    // Image configuration
    src?: string;
    alt?: string;
    uploadedFile?: File;
    aspectRatio?: string;
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
  { value: '{{company_phone}}', label: 'Company Phone' },
  { value: '{{company_email}}', label: 'Company Email' },
  { value: '{{customer_name}}', label: 'Customer Name' },
  { value: '{{customer_address}}', label: 'Customer Address' },
  { value: '{{customer_phone}}', label: 'Customer Phone' },
  { value: '{{customer_email}}', label: 'Customer Email' },
  { value: '{{quotation_number}}', label: 'Quotation Number' },
  { value: '{{quotation_date}}', label: 'Quotation Date' },
  { value: '{{quotation_validity}}', label: 'Quotation Validity' },
  { value: '{{total_amount}}', label: 'Total Amount' },
  { value: '{{total_amount_words}}', label: 'Total Amount (in words)' },
  { value: '{{gst_amount}}', label: 'GST Amount' },
  { value: '{{final_amount}}', label: 'Final Amount' }
];

// Table field options for dynamic table content
const tableFieldOptions = [
  { value: '{{item_name}}', label: 'Item/Equipment Name' },
  { value: '{{item_description}}', label: 'Item Description' },
  { value: '{{item_model}}', label: 'Model/Type' },
  { value: '{{item_capacity}}', label: 'Capacity/Specification' },
  { value: '{{item_quantity}}', label: 'Quantity' },
  { value: '{{item_unit}}', label: 'Unit (hrs/days/months)' },
  { value: '{{item_rate}}', label: 'Rate per Unit' },
  { value: '{{item_amount}}', label: 'Line Amount' },
  { value: '{{item_duration}}', label: 'Duration' },
  { value: '{{item_location}}', label: 'Location' },
  { value: '{{item_operator}}', label: 'Operator Required' },
  { value: '{{item_fuel}}', label: 'Fuel Included' },
  { value: '{{item_transport}}', label: 'Transport Cost' },
  { value: '{{item_tax}}', label: 'Tax %' },
  { value: '{{item_remarks}}', label: 'Remarks/Notes' }
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

  const handleConfigChange = (configKey: string, value: any) => {
    setLocalElement(prev => ({
      ...prev,
      config: { ...prev.config, [configKey]: value }
    }));
    setHasChanges(true);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setLocalElement(prev => ({
        ...prev,
        config: { ...prev.config, src, uploadedFile: file }
      }));
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
  };

  const addTableRow = () => {
    const columns = localElement.config?.columns || ['Column 1', 'Column 2', 'Column 3'];
    const newRow = new Array(columns.length).fill('');
    setLocalElement(prev => ({
      ...prev,
      config: {
        ...prev.config,
        rows: [...(prev.config?.rows || []), newRow]
      }
    }));
    setHasChanges(true);
  };

  const addTableColumn = () => {
    const columns = localElement.config?.columns || [];
    const rows = localElement.config?.rows || [];
    setLocalElement(prev => ({
      ...prev,
      config: {
        ...prev.config,
        columns: [...columns, `Column ${columns.length + 1}`],
        rows: rows.map(row => [...row, ''])
      }
    }));
    setHasChanges(true);
  };

  const updateTableCell = (rowIndex: number, colIndex: number, value: string) => {
    const rows = [...(localElement.config?.rows || [])];
    rows[rowIndex][colIndex] = value;
    setLocalElement(prev => ({
      ...prev,
      config: { ...prev.config, rows }
    }));
    setHasChanges(true);
  };

  const updateTableHeader = (colIndex: number, value: string) => {
    const columns = [...(localElement.config?.columns || [])];
    columns[colIndex] = value;
    setLocalElement(prev => ({
      ...prev,
      config: { ...prev.config, columns }
    }));
    setHasChanges(true);
  };

  const removeTableRow = (rowIndex: number) => {
    if ((localElement.config?.rows?.length || 0) > 1) {
      const rows = localElement.config?.rows?.filter((_, index) => index !== rowIndex) || [];
      setLocalElement(prev => ({
        ...prev,
        config: { ...prev.config, rows }
      }));
      setHasChanges(true);
    }
  };

  const removeTableColumn = (colIndex: number) => {
    if ((localElement.config?.columns?.length || 0) > 1) {
      const columns = localElement.config?.columns?.filter((_, index) => index !== colIndex) || [];
      const rows = localElement.config?.rows?.map(row => row.filter((_, index) => index !== colIndex)) || [];
      setLocalElement(prev => ({
        ...prev,
        config: { ...prev.config, columns, rows }
      }));
      setHasChanges(true);
    }
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
    <div className="w-96 bg-white border-l border-gray-200 p-4 overflow-y-auto max-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Edit Element</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-700 hover:text-gray-900 hover:bg-gray-100">×</Button>
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
          ) : element.type === 'table' ? (
            <div className="text-sm text-gray-600">
              Configure table structure below
            </div>
          ) : element.type === 'image' ? (
            <div className="text-sm text-gray-600">
              Upload or configure image below
            </div>
          ) : (
            <TextArea
              value={localElement.content || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={3}
              placeholder="Enter content..."
            />
          )}
        </div>

        {/* Table Configuration */}
        {element.type === 'table' && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Table Configuration</h4>
            
            <div className="flex gap-2">
              <Button onClick={addTableColumn} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Plus size={14} /> Add Column
              </Button>
              <Button onClick={addTableRow} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus size={14} /> Add Row
              </Button>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">Headers</div>
              {(localElement.config?.columns || []).map((column, colIndex) => (
                <div key={colIndex} className="flex gap-2 mb-2">
                  <Input
                    value={column}
                    onChange={(e) => updateTableHeader(colIndex, e.target.value)}
                    placeholder={`Column ${colIndex + 1}`}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => removeTableColumn(colIndex)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    disabled={(localElement.config?.columns?.length || 0) <= 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">Data Rows</div>
              <div className="mb-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                💡 <strong>Tip:</strong> Use dynamic fields like {'{{item_name}}'}, {'{{item_rate}}'}, {'{{item_amount}}'} for auto-populated data
              </div>
              {(localElement.config?.rows || []).map((row, rowIndex) => (
                <div key={rowIndex} className="border border-gray-200 rounded p-2 mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Row {rowIndex + 1}</span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          // Add a row with placeholder fields
                          const columns = localElement.config?.columns || [];
                          const suggestedRow = columns.map((col) => {
                            if (col.toLowerCase().includes('equipment') || col.toLowerCase().includes('item')) return '{{item_name}}';
                            if (col.toLowerCase().includes('capacity') || col.toLowerCase().includes('spec')) return '{{item_capacity}}';
                            if (col.toLowerCase().includes('quantity')) return '{{item_quantity}}';
                            if (col.toLowerCase().includes('rate')) return '{{item_rate}}';
                            if (col.toLowerCase().includes('amount')) return '{{item_amount}}';
                            if (col.toLowerCase().includes('duration')) return '{{item_duration}}';
                            return '';
                          });
                          setLocalElement(prev => ({
                            ...prev,
                            config: {
                              ...prev.config,
                              rows: [...(prev.config?.rows || []), suggestedRow]
                            }
                          }));
                          setHasChanges(true);
                        }}
                        size="sm"
                        className="text-xs bg-green-600 hover:bg-green-700 text-white"
                      >
                        + Field Row
                      </Button>
                      <Button
                        onClick={() => removeTableRow(rowIndex)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        disabled={(localElement.config?.rows?.length || 0) <= 1}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                  {row.map((cell, colIndex) => (
                    <div key={colIndex} className="mb-1 relative">
                      <Input
                        value={cell}
                        onChange={(e) => updateTableCell(rowIndex, colIndex, e.target.value)}
                        placeholder={`${localElement.config?.columns?.[colIndex] || `Column ${colIndex + 1}`}`}
                        className="mb-1"
                      />
                      {/* Quick field buttons */}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {tableFieldOptions.slice(0, 3).map(field => (
                          <button
                            key={field.value}
                            onClick={() => updateTableCell(rowIndex, colIndex, field.value)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            {field.label.split(' ')[0]}
                          </button>
                        ))}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              updateTableCell(rowIndex, colIndex, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="text-xs px-1 py-1 border border-gray-300 rounded"
                        >
                          <option value="">More Fields...</option>
                          {tableFieldOptions.map(field => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Configuration */}
        {element.type === 'image' && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Image Configuration</h4>
            
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Upload Image</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {localElement.config?.src && (
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-1">Preview</div>
                <img 
                  src={localElement.config.src} 
                  alt="Preview" 
                  className="w-full max-w-xs border border-gray-300 rounded"
                />
              </div>
            )}

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Alt Text</div>
              <Input
                value={localElement.config?.alt || ''}
                onChange={(e) => handleConfigChange('alt', e.target.value)}
                placeholder="Image description"
              />
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Aspect Ratio</div>
              <select
                value={localElement.config?.aspectRatio || 'auto'}
                onChange={(e) => handleConfigChange('aspectRatio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto</option>
                <option value="1/1">Square (1:1)</option>
                <option value="16/9">Widescreen (16:9)</option>
                <option value="4/3">Standard (4:3)</option>
                <option value="3/2">Photo (3:2)</option>
              </select>
            </div>
          </div>
        )}

        {/* Sizing Options */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Size & Layout</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Width</div>
              <Input
                value={localElement.style?.width || 'auto'}
                onChange={(e) => handleStyleChange('width', e.target.value)}
                placeholder="auto, 100px, 50%"
              />
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Height</div>
              <Input
                value={localElement.style?.height || 'auto'}
                onChange={(e) => handleStyleChange('height', e.target.value)}
                placeholder="auto, 100px, 50%"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Max Width</div>
              <Input
                value={localElement.style?.maxWidth || '100%'}
                onChange={(e) => handleStyleChange('maxWidth', e.target.value)}
                placeholder="100%, 500px"
              />
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Min Height</div>
              <Input
                value={localElement.style?.minHeight || 'auto'}
                onChange={(e) => handleStyleChange('minHeight', e.target.value)}
                placeholder="auto, 50px"
              />
            </div>
          </div>
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
                  className={localElement.style?.textAlign === align 
                    ? "text-white bg-blue-600" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }
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
          <Button 
            onClick={handleSave} 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={!hasChanges}
          >
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleCancel}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
          >
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
  onUpdateElement,
  onMoveUp, 
  onMoveDown, 
  onEdit,
  isFirst,
  isLast
}: {
  element: EnhancedTemplateElement;
  index: number;
  onDelete: (index: number) => void;
  onUpdateElement: (index: number, updates: Partial<EnhancedTemplateElement>) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (element: EnhancedTemplateElement, index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeMode, setResizeMode] = useState<'both' | 'width' | 'height'>('both');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const elementRef = React.useRef<HTMLDivElement>(null);

  const handleResizeStart = (e: React.MouseEvent, mode: 'both' | 'width' | 'height' = 'both') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeMode(mode);
    
    const rect = elementRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height
      });
    }
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !elementRef.current) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    let newWidth = dragStart.width;
    let newHeight = dragStart.height;
    
    if (resizeMode === 'both' || resizeMode === 'width') {
      newWidth = Math.max(100, dragStart.width + deltaX);
    }
    
    if (resizeMode === 'both' || resizeMode === 'height') {
      newHeight = Math.max(100, dragStart.height + deltaY);
    }
    
    // Update the element style directly for immediate visual feedback
    if (resizeMode === 'both' || resizeMode === 'width') {
      elementRef.current.style.width = `${newWidth}px`;
    }
    if (resizeMode === 'both' || resizeMode === 'height') {
      elementRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleResizeEnd = () => {
    if (!isResizing || !elementRef.current) return;
    setIsResizing(false);
    
    // Update the element's style in the state
    const newWidth = elementRef.current.style.width;
    const newHeight = elementRef.current.style.height;
    
    onUpdateElement(index, {
      style: {
        ...element.style,
        width: newWidth,
        height: newHeight
      }
    });
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, dragStart]);
  const elementStyle = {
    fontSize: element.style?.fontSize || '14px',
    fontWeight: element.style?.fontWeight || 'normal',
    color: element.style?.color && element.style?.color !== '#ffffff' ? element.style.color : '#222',
    backgroundColor: element.style?.backgroundColor || '#fff',
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
        const columns = element.config?.columns || ['Column 1', 'Column 2', 'Column 3'];
        const rows = element.config?.rows || [['Sample Data 1', 'Sample Data 2', 'Sample Data 3']];
        const showHeader = element.config?.showHeader !== false;
        
        return (
          <div 
            className="border border-gray-300 rounded overflow-hidden"
            style={{
              width: element.style?.width || 'auto',
              maxWidth: element.style?.maxWidth || '100%'
            }}
          >
            <table className="w-full" style={element.style}>
              {showHeader && (
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((column, colIndex) => (
                      <th 
                        key={colIndex}
                        className="border border-gray-300 p-2 text-left font-medium text-gray-900"
                        style={{ 
                          width: element.config?.columnWidths?.[colIndex] || 'auto',
                          fontSize: element.style?.fontSize || '14px',
                          color: element.style?.color || '#1f2937'
                        }}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, colIndex) => (
                      <td 
                        key={colIndex}
                        className="border border-gray-300 p-2 text-gray-700"
                        style={{ 
                          width: element.config?.columnWidths?.[colIndex] || 'auto',
                          fontSize: element.style?.fontSize || '14px',
                          color: element.style?.color || '#374151',
                          textAlign: element.style?.textAlign || 'left'
                        }}
                      >
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'image':
        if (element.config?.src) {
          return (
            <div 
              ref={elementRef}
              className="relative border border-gray-300 rounded overflow-hidden group/image"
              style={{
                width: element.style?.width || '200px',
                height: element.style?.height || '150px',
                maxWidth: element.style?.maxWidth || '100%',
                textAlign: element.style?.textAlign || 'center',
                minWidth: '100px',
                minHeight: '100px'
              }}
            >
              <img 
                src={element.config.src}
                alt={element.config.alt || 'Uploaded image'}
                className="w-full h-full object-contain pointer-events-none"
                style={{
                  aspectRatio: element.config.aspectRatio || 'auto'
                }}
              />
              
              {/* Visible resize controls */}
              <div className="absolute inset-0 opacity-0 group-hover/image:opacity-100 transition-opacity bg-black bg-opacity-10">
                {/* Corner resize handle - bottom right */}
                <div 
                  className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 border-2 border-white cursor-nw-resize hover:bg-blue-700 shadow-lg flex items-center justify-center"
                  onMouseDown={(e) => handleResizeStart(e, 'both')}
                  style={{ transform: 'translate(3px, 3px)' }}
                  title="Drag to resize both width and height"
                >
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                
                {/* Bottom edge resize handle */}
                <div 
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-blue-600 border-2 border-white cursor-n-resize hover:bg-blue-700 shadow-lg"
                  onMouseDown={(e) => handleResizeStart(e, 'height')}
                  style={{ transform: 'translateX(-50%) translateY(3px)' }}
                  title="Drag to resize height only"
                >
                  <div className="w-2 h-0.5 bg-white mx-auto mt-0.5"></div>
                </div>
                
                {/* Right edge resize handle */}
                <div 
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-6 bg-blue-600 border-2 border-white cursor-e-resize hover:bg-blue-700 shadow-lg"
                  onMouseDown={(e) => handleResizeStart(e, 'width')}
                  style={{ transform: 'translateY(-50%) translateX(3px)' }}
                  title="Drag to resize width only"
                >
                  <div className="h-2 w-0.5 bg-white mx-auto mt-1"></div>
                </div>
                
                {/* Size indicator */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {element.style?.width || '200px'} × {element.style?.height || '150px'}
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div 
            ref={elementRef}
            className="relative border-2 border-dashed border-gray-300 rounded p-4 text-center bg-gray-50 group/image"
            style={{
              width: element.style?.width || '200px',
              height: element.style?.height || '150px',
              maxWidth: element.style?.maxWidth || '100%',
              minHeight: '120px',
              minWidth: '150px'
            }}
          >
            <div className="flex flex-col items-center justify-center h-full pointer-events-none">
              <Image size={48} className="text-gray-400 mb-2" />
              <div className="text-sm text-gray-500">
                {element.content || 'Click to upload image'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Hover to resize • Use settings to upload
              </div>
            </div>
            
            {/* Resize handles for placeholder */}
            <div className="absolute inset-0 opacity-0 group-hover/image:opacity-100 transition-opacity bg-blue-50 bg-opacity-20">
              <div 
                className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 border-2 border-white cursor-nw-resize hover:bg-blue-700 shadow-lg flex items-center justify-center"
                onMouseDown={(e) => handleResizeStart(e, 'both')}
                style={{ transform: 'translate(3px, 3px)' }}
                title="Drag to resize both width and height"
              >
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
              
              {/* Size indicator */}
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                {element.style?.width || '200px'} × {element.style?.height || '150px'}
              </div>
            </div>
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
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-lg border border-gray-300 p-1">
        <button
          onClick={() => onEdit(element, index)}
          className="p-1 h-6 w-6 rounded hover:bg-blue-50 transition-colors"
          style={{ 
            color: '#374151', 
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Edit Element"
        >
          <Settings size={12} color="#374151" />
        </button>
        
        <button
          onClick={() => onMoveUp(index)}
          disabled={isFirst}
          className="p-1 h-6 w-6 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
          style={{ 
            color: isFirst ? '#9ca3af' : '#374151', 
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Move Up"
        >
          <ArrowUp size={12} color={isFirst ? '#9ca3af' : '#374151'} />
        </button>
        
        <button
          onClick={() => onMoveDown(index)}
          disabled={isLast}
          className="p-1 h-6 w-6 rounded hover:bg-green-50 transition-colors disabled:opacity-50"
          style={{ 
            color: isLast ? '#9ca3af' : '#374151', 
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Move Down"
        >
          <ArrowDown size={12} color={isLast ? '#9ca3af' : '#374151'} />
        </button>
        
        <button
          onClick={() => onDelete(index)}
          className="p-1 h-6 w-6 rounded hover:bg-red-50 transition-colors"
          style={{ 
            color: '#dc2626', 
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Delete Element"
        >
          <Trash2 size={12} color="#dc2626" />
        </button>
      </div>

      {/* Element Content */}
      <div className="pointer-events-none">
        {renderElementContent()}
      </div>

      {/* Drag Handle */}
      <div className="absolute left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-move p-1">
        <Move size={12} className="text-gray-600 hover:text-gray-800" />
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
      const getDefaultConfig = (type: string) => {
        switch (type) {
          case 'table':
            return {
              columns: ['Equipment/Service', 'Specification', 'Quantity', 'Rate per Unit', 'Amount'],
              rows: [
                ['{{item_name}}', '{{item_capacity}}', '{{item_quantity}}', '{{item_rate}}', '{{item_amount}}'],
                ['Mobile Crane', '100MT Capacity', '1 Month', '₹7,85,000', '₹7,85,000']
              ],
              showHeader: true,
              columnWidths: ['25%', '25%', '15%', '17.5%', '17.5%']
            };
          case 'image':
            return {
              src: '',
              alt: 'Image',
              aspectRatio: 'auto'
            };
          case 'field':
            return {
              placeholder: 'Enter field value',
              required: false,
              defaultValue: ''
            };
          default:
            return {};
        }
      };

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
          textAlign: 'left',
          width: 'auto',
          height: 'auto',
          maxWidth: '100%'
        },
        config: getDefaultConfig(item.elementType)
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

  const handleElementUpdate = (index: number, updates: Partial<EnhancedTemplateElement>) => {
    const newElements = [...elements];
    newElements[index] = { ...newElements[index], ...updates };
    onElementsChange(newElements);
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
              onUpdateElement={handleElementUpdate}
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
  const [error, setError] = useState<string | null>(null);

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
      setError('Please enter a template name');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (elements.length === 0) {
      setError('Please add at least one element to the template');
      setTimeout(() => setError(null), 3000);
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
        createdBy: template?.createdBy || 'current-user',
        version: template?.version || 1,
        isDefault: template?.isDefault || false,
        isActive: template?.isActive !== false,
        category: template?.category || 'general',
        styles: template?.styles || {},
        layout: template?.layout || {},
        thumbnail: template?.thumbnail,
        content: template?.content || ''
      };

      await onSave(templateData);
      
      // Show success feedback
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      console.log('✅ Template saved successfully');
    } catch (error) {
      console.error('❌ Error saving template:', error);
      setError('Failed to save template. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (elements.length === 0) {
      setError('Please add elements to preview the template');
      setTimeout(() => setError(null), 3000);
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
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 disabled:text-gray-400"
                >
                  <Eye size={16} className="mr-2" />
                  Preview
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={saving || !templateName.trim() || elements.length === 0}
                  title="Save template to database"
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
                >
                  <Save size={16} className="mr-2" />
                  {saving ? 'Saving...' : 'Save Template'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={onCancel}
                  className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
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

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
            ✅ Template saved successfully!
          </div>
        )}
        
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50">
            ❌ {error}
          </div>
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
