import { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Trash2 as DeleteIcon, 
  Move as DragIcon,
  Type as TextIcon,
  Database as FieldIcon,
  Grid as TableIcon,
  Image as ImageIcon,
  Minus as SpacerIcon
} from 'lucide-react';
import { createModernTemplate, type TemplateElement } from '../services/modernTemplateService';
import { useAuthStore } from '../store/authStore';

// Drag item types
const ItemTypes = {
  ELEMENT: 'element',
  PALETTE_ITEM: 'palette_item'
};

// Palette items that can be dragged to create new elements
const paletteItems = [
  { type: 'text', label: 'Text', icon: TextIcon, description: 'Add text content' },
  { type: 'field', label: 'Field', icon: FieldIcon, description: 'Add dynamic field' },
  { type: 'table', label: 'Table', icon: TableIcon, description: 'Add data table' },
  { type: 'image', label: 'Image', icon: ImageIcon, description: 'Add image' },
  { type: 'spacer', label: 'Spacer', icon: SpacerIcon, description: 'Add spacing' }
] as const;

type PaletteItemType = typeof paletteItems[number];

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
      <div className="flex items-center gap-2">
        <IconComponent size={20} className="text-blue-600" />
        <div>
          <div className="font-medium text-sm text-gray-900">
            {item.label}
          </div>
          <div className="text-xs text-gray-500">
            {item.description}
          </div>
        </div>
      </div>
    </div>
  );
}

// Draggable template element
function TemplateElementComponent({ 
  element, 
  index, 
  moveElement, 
  deleteElement, 
  updateElement 
}: {
  element: TemplateElement;
  index: number;
  moveElement: (dragIndex: number, hoverIndex: number) => void;
  deleteElement: (index: number) => void;
  updateElement: (index: number, updates: Partial<TemplateElement>) => void;
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
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveElement(item.index, index);
        item.index = index;
      }
    },
  }));

  const handleContentChange = (newContent: string) => {
    updateElement(index, { content: newContent });
  };

  const renderElementContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md resize-vertical"
            rows={3}
            value={element.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter text content..."
          />
        );
      case 'field':
        return (
          <div>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md mb-2"
              value={element.fieldType || ''}
              onChange={(e) => updateElement(index, { fieldType: e.target.value })}
              placeholder="Field type (e.g., customer.name)"
            />
            <div className="text-sm text-gray-500">
              Dynamic field: {element.fieldType || 'Not set'}
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border-2 border-dashed border-gray-300">
            Table component will display quotation data
          </div>
        );
      case 'image':
        return (
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={element.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Image URL or path..."
          />
        );
      case 'spacer':
        return (
          <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border-2 border-dashed border-gray-300">
            Spacer element (adjustable height)
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
        p-4 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-move
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="flex items-start gap-3">
        <DragIcon size={16} className="text-gray-400 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-medium text-blue-600">
              {element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element
            </div>
            <button
              onClick={() => deleteElement(index)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <DeleteIcon size={16} />
            </button>
          </div>
          {renderElementContent()}
        </div>
      </div>
    </div>
  );
}

// Drop zone for the template canvas
function TemplateCanvas({ 
  elements, 
  setElements 
}: { 
  elements: TemplateElement[]; 
  setElements: React.Dispatch<React.SetStateAction<TemplateElement[]>> 
}) {
  const [, drop] = useDrop(() => ({
    accept: [ItemTypes.PALETTE_ITEM, ItemTypes.ELEMENT],
    drop: (item: { elementType?: string }) => {
      if (item.elementType) {
        // Adding new element from palette
        const newElement: TemplateElement = {
          id: `element_${Date.now()}`,
          type: item.elementType as TemplateElement['type'],
          content: ''
        };
        setElements(prev => [...prev, newElement]);
      }
    },
  }));

  const moveElement = useCallback((dragIndex: number, hoverIndex: number) => {
    setElements(prev => {
      const dragElement = prev[dragIndex];
      const newElements = [...prev];
      newElements.splice(dragIndex, 1);
      newElements.splice(hoverIndex, 0, dragElement);
      return newElements;
    });
  }, [setElements]);

  const deleteElement = useCallback((index: number) => {
    setElements(prev => prev.filter((_, i) => i !== index));
  }, [setElements]);

  const updateElement = useCallback((index: number, updates: Partial<TemplateElement>) => {
    setElements(prev => prev.map((element, i) => 
      i === index ? { ...element, ...updates } : element
    ));
  }, [setElements]);

  return (
    <div
      ref={drop}
      className="min-h-96 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
    >
      {elements.length === 0 ? (
        <div className="flex justify-center items-center h-48 text-gray-500">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Build Your Template</div>
            <div className="text-sm">Drag elements from the palette to get started</div>
          </div>
        </div>
      ) : (
        elements.map((element, index) => (
          <TemplateElementComponent
            key={element.id}
            element={element}
            index={index}
            moveElement={moveElement}
            deleteElement={deleteElement}
            updateElement={updateElement}
          />
        ))
      )}
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
      alert('Please enter a template name');
      return;
    }

    if (elements.length === 0) {
      alert('Please add at least one element to the template');
      return;
    }

    setSaving(true);
    try {
      await createModernTemplate({
        name: templateName.trim(),
        description: templateDescription.trim(),
        elements,
        createdBy: user?.id || 'unknown',
        usage_count: 0,
        tags: []
      });
      
      alert('Template saved successfully!');
      
      // Reset form
      setTemplateName('');
      setTemplateDescription('');
      setElements([]);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Element Palette */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Element Palette</h3>
              <div className="space-y-3">
                {paletteItems.map((item, index) => (
                  <PaletteItem key={index} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Template Canvas */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Template Canvas</h3>
                <button
                  onClick={handleSave}
                  disabled={saving || !templateName.trim() || elements.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
              
              <TemplateCanvas 
                elements={elements} 
                setElements={setElements} 
              />
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
