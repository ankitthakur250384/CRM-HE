import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { TextArea } from '../common/TextArea';
import { Template } from '../../types/template';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Table,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  Upload
} from 'lucide-react';

interface HeaderContent {
  text: string;
  level: 1 | 2 | 3;
  align?: 'left' | 'center' | 'right';
}

interface TextContent {
  text: string;
  align?: 'left' | 'center' | 'right';
}

interface TableContent {
  rows: Array<{
    cells: Array<{
      content: string;
      header?: boolean;
    }>;
  }>;
  styles: {
    borders: boolean;
    striped: boolean;
  };
}

interface ListContent {
  items: string[];
  type: 'ordered' | 'unordered';
}

interface ImageContent {
  url: string;
  alt: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

type ElementContent = HeaderContent | TableContent | ListContent | TextContent | ImageContent;

interface TemplateElement {
  id: string;
  type: 'header' | 'text' | 'table' | 'list' | 'image' | 'divider';
  content: ElementContent;
}

interface VisualTemplateEditorProps {
  template: Template;
  onChange: (updatedTemplate: Template) => void;
}

interface Placeholder {
  key: string;
  category: string;
}

interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

const isHeaderContent = (content: ElementContent): content is HeaderContent => {
  return 'text' in content && 'level' in content;
};

const isTextContent = (content: ElementContent): content is TextContent => {
  return 'text' in content && !('level' in content);
};

const isTableContent = (content: ElementContent): content is TableContent => {
  return 'rows' in content;
};

const isListContent = (content: ElementContent): content is ListContent => {
  return 'items' in content;
};

const isImageContent = (content: ElementContent): content is ImageContent => {
  return 'url' in content;
};

function getCommonPlaceholders(): Placeholder[] {
  return [
    { key: 'company_name', category: 'Company' },
    { key: 'company_address', category: 'Company' },
    { key: 'company_email', category: 'Company' },
    { key: 'company_phone', category: 'Company' },
    { key: 'customer_name', category: 'Customer' },
    { key: 'customer_email', category: 'Customer' },
    { key: 'customer_phone', category: 'Customer' },
    { key: 'quotation_number', category: 'Quotation' },
    { key: 'quotation_date', category: 'Quotation' },
    { key: 'quotation_valid_until', category: 'Quotation' },
    { key: 'quotation_total', category: 'Quotation' }
  ];
}

function getDefaultContentForType(type: TemplateElement['type']): ElementContent {
  switch (type) {
    case 'header':
      return {
        text: 'New Header',
        level: 2,
        align: 'left'
      };
    case 'text':
      return {
        text: 'New text block',
        align: 'left'
      };
    case 'table':
      return {
        rows: [
          {
            cells: [
              { content: 'Header 1', header: true },
              { content: 'Header 2', header: true }
            ]
          },
          {
            cells: [
              { content: 'Cell 1' },
              { content: 'Cell 2' }
            ]
          }
        ],
        styles: {
          borders: true,
          striped: false
        }
      };
    case 'list':
      return {
        items: ['Item 1', 'Item 2'],
        type: 'unordered'
      };
    case 'image':
      return {
        url: '',
        alt: '',
        align: 'center'
      };
    case 'divider':
      return {
        text: ''
      };
    default:
      return {
        text: '',
        align: 'left'
      };
  }
}

export function VisualTemplateEditor({ template, onChange }: VisualTemplateEditorProps) {
  const [elements, setElements] = useState<TemplateElement[]>(() => {
    // Initialize elements from template content if available
    if (template.content) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(template.content, 'text/html');
        // Convert DOM elements to TemplateElements
        return Array.from(doc.body.children).map((node, index) => {
          const type = node.tagName.toLowerCase() === 'img' ? 'image' :
                      node.tagName.toLowerCase() === 'h1' || node.tagName.toLowerCase() === 'h2' || node.tagName.toLowerCase() === 'h3' ? 'header' :
                      node.tagName.toLowerCase() === 'table' ? 'table' :
                      node.tagName.toLowerCase() === 'ul' || node.tagName.toLowerCase() === 'ol' ? 'list' :
                      'text';
          
          return {
            id: `${type}-${index}`,
            type,
            content: getDefaultContentForType(type)
          };
        });
      } catch (error) {
        console.error('Error parsing template content:', error);
        return [];
      }
    }
    return [];
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeState || !imageRef.current || !selectedElement) return;

      const element = elements.find(el => el.id === selectedElement);
      if (!element || !isImageContent(element.content)) return;

      const dx = e.clientX - resizeState.startX;
      const newWidth = Math.max(50, resizeState.startWidth + dx);
      
      handleElementChange(selectedElement, {
        ...element.content,
        width: `${newWidth}px`
      });
    };

    const handleMouseUp = () => {
      setResizeState(null);
    };

    if (resizeState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState, selectedElement, elements]);

  useEffect(() => {
    if (resizeState) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [resizeState]);

  const handleAddElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: `${type}-${Date.now()}`,
      type,
      content: getDefaultContentForType(type)
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const handleAddImage = () => {
    const newElement: TemplateElement = {
      id: `image-${Date.now()}`,
      type: 'image',
      content: {
        url: '',
        alt: '',
        align: 'center'
      }
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const handleElementChange = (id: string, content: ElementContent) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, content } : el
    ));
  };

  const handleMoveElement = (id: string, direction: 'up' | 'down') => {
    const index = elements.findIndex(el => el.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === elements.length - 1)
    ) return;

    const newElements = [...elements];
    const element = newElements[index];
    if (direction === 'up') {
      newElements[index] = newElements[index - 1];
      newElements[index - 1] = element;
    } else {
      newElements[index] = newElements[index + 1];
      newElements[index + 1] = element;
    }
    setElements(newElements);
  };

  const handleDeleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const handleImageUpload = async (file: File, elementId: string) => {
    try {
      // For now, we'll use a simple FileReader to get a data URL
      // In a production environment, you would upload this to a server
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const element = elements.find(el => el.id === elementId);
        if (element && isImageContent(element.content)) {
          handleElementChange(elementId, {
            ...element.content,
            url
          } as ImageContent);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const renderElementContent = (element: TemplateElement) => {
    if (element.type === 'header' && isHeaderContent(element.content)) {
      return (
        <div style={{ textAlign: element.content.align }}>
          {element.content.level === 1 && (
            <h1 className="text-3xl font-bold">{element.content.text}</h1>
          )}
          {element.content.level === 2 && (
            <h2 className="text-2xl font-semibold">{element.content.text}</h2>
          )}
          {element.content.level === 3 && (
            <h3 className="text-xl font-medium">{element.content.text}</h3>
          )}
        </div>
      );
    }

    if (element.type === 'table' && isTableContent(element.content)) {
      return (
        <table className="w-full border-collapse">
          <tbody>
            {element.content.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.cells.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`border p-2 ${
                      cell.header ? 'font-semibold bg-gray-50' : ''
                    }`}
                  >
                    {cell.content}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (element.type === 'image' && isImageContent(element.content)) {
      return (
        <div 
          className={`text-${element.content.align || 'center'} relative group`}
          style={{ userSelect: resizeState ? 'none' : undefined }}
        >
          <div className="relative inline-block">
            {element.content.url ? (
              <>
                <img 
                  ref={selectedElement === element.id ? imageRef : null}
                  src={element.content.url} 
                  alt={element.content.alt}
                  style={{ 
                    maxWidth: '100%',
                    width: element.content.width || 'auto',
                    display: 'inline-block',
                    cursor: selectedElement === element.id ? 'move' : 'pointer'
                  }}
                />
                {selectedElement === element.id && (
                  <>
                    <div
                      className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-ew-resize right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (!imageRef.current) return;
                        
                        const rect = imageRef.current.getBoundingClientRect();
                        setResizeState({
                          isResizing: true,
                          startX: e.clientX,
                          startY: e.clientY,
                          startWidth: rect.width,
                          startHeight: rect.height
                        });
                      }}
                    />
                    <div className="absolute left-1/2 -bottom-6 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {Math.round(imageRef.current?.getBoundingClientRect().width || 0)}px
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Click to upload an image</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderElementEditor = (element: TemplateElement) => {
    if (!element) return null;

    switch (element.type) {
      case 'header':
        if (!isHeaderContent(element.content)) return null;
        return (
          <div className="space-y-4">
            <Input
              label="Text"
              value={element.content.text}
              onChange={(e) => handleElementChange(element.id, {
                ...element.content,
                text: e.target.value
              })}
            />
            <Select
              label="Level"
              value={element.content.level.toString()}
              options={[
                { value: '1', label: 'Heading 1 (Large)' },
                { value: '2', label: 'Heading 2 (Medium)' },
                { value: '3', label: 'Heading 3 (Small)' }
              ]}
              onChange={value => handleElementChange(element.id, {
                ...element.content,
                level: parseInt(value, 10) as 1 | 2 | 3
              })}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Alignment:</span>
              <Button
                variant={element.content.align === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleElementChange(element.id, {
                  ...element.content,
                  align: 'left'
                })}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={element.content.align === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleElementChange(element.id, {
                  ...element.content,
                  align: 'center'
                })}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={element.content.align === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleElementChange(element.id, {
                  ...element.content,
                  align: 'right'
                })}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'text':
        if (!isTextContent(element.content)) return null;
        return (
          <div className="space-y-4">
            <TextArea
              label="Text"
              value={element.content.text}
              onChange={(e) => handleElementChange(element.id, {
                ...element.content,
                text: e.target.value
              })}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Alignment:</span>
              <Button
                variant={element.content.align === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleElementChange(element.id, {
                  ...element.content,
                  align: 'left'
                })}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={element.content.align === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleElementChange(element.id, {
                  ...element.content,
                  align: 'center'
                })}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={element.content.align === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleElementChange(element.id, {
                  ...element.content,
                  align: 'right'
                })}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'table':
        if (!isTableContent(element.content)) return null;
        return (
          <div className="space-y-4">
            {element.content.rows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2">
                {row.cells.map((cell, cellIndex) => (
                  <Input
                    key={cellIndex}
                    value={cell.content}
                    onChange={e => {
                      if (!isTableContent(element.content)) return;
                      const newRows = [...element.content.rows];
                      newRows[rowIndex].cells[cellIndex].content = e.target.value;
                      handleElementChange(element.id, {
                        ...element.content,
                        rows: newRows
                      } as TableContent);
                    }}
                  />
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!isTableContent(element.content)) return;
                    const newRows = [...element.content.rows];
                    newRows[rowIndex].cells.push({ content: '' });
                    handleElementChange(element.id, {
                      ...element.content,
                      rows: newRows
                    } as TableContent);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                if (!isTableContent(element.content)) return;
                const newRows = [...element.content.rows];
                newRows.push({
                  cells: [{ content: '' }]
                });
                handleElementChange(element.id, {
                  ...element.content,
                  rows: newRows
                } as TableContent);
              }}
            >
              Add Row
            </Button>
          </div>
        );

      case 'list':
        if (!isListContent(element.content)) return null;
        return (
          <div className="space-y-4">
            {/* ... list editor ... */}
          </div>
        );

      case 'image':
        if (!isImageContent(element.content)) return null;
        return (
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(file, element.id);
                }
              }}
            />
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>

            <Input
              label="Image URL"
              value={element.content.url}
              onChange={(e) => handleElementChange(element.id, {
                ...element.content,
                url: e.target.value
              })}
              placeholder="Enter image URL or upload an image"
            />

            <Input
              label="Alt Text"
              value={element.content.alt}
              onChange={(e) => handleElementChange(element.id, {
                ...element.content,
                alt: e.target.value
              })}
              placeholder="Enter image description"
            />

            <Input
              label="Width"
              value={element.content.width || ''}
              onChange={(e) => handleElementChange(element.id, {
                ...element.content,
                width: e.target.value
              })}
              placeholder="e.g., 100%, 300px"
            />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Alignment:</span>
              <Button
                variant={element.content.align === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleElementChange(element.id, {
                  ...element.content,
                  align: 'left'
                })}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={element.content.align === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleElementChange(element.id, {
                  ...element.content,
                  align: 'center'
                })}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={element.content.align === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleElementChange(element.id, {
                  ...element.content,
                  align: 'right'
                })}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-5 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Add Elements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('header')}
                className="flex items-center gap-2"
              >
                <Type className="h-4 w-4" />
                Header
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('text')}
                className="flex items-center gap-2"
              >
                <AlignLeft className="h-4 w-4" />
                Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('table')}
                className="flex items-center gap-2"
              >
                <Table className="h-4 w-4" />
                Table
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('list')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                List
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddElement('image')}
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Image
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Properties Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedElement ? (
              renderElementEditor(elements.find(el => el.id === selectedElement)!)
            ) : (
              <p className="text-gray-500 text-sm">Select an element to edit its properties</p>
            )}
          </CardContent>
        </Card>

        {/* Placeholders */}
        <Card>
          <CardHeader>
            <CardTitle>Available Placeholders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {getCommonPlaceholders().map(placeholder => (
                <div
                  key={placeholder.key}
                  className="text-xs bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (selectedElement) {
                      const element = elements.find(el => el.id === selectedElement);
                      if (element && (isHeaderContent(element.content) || isTextContent(element.content))) {
                        handleElementChange(element.id, {
                          ...element.content,
                          text: `{{${placeholder.key}}}`
                        });
                      }
                    }
                  }}
                >
                  {`{{${placeholder.key}}}`}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <div className="col-span-7">
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[600px] p-6 border rounded-lg">
              {elements.map((element, index) => (
                <div
                  key={element.id}
                  className={`relative group p-2 ${
                    selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedElement(element.id)}
                >
                  <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveElement(element.id, 'up');
                      }}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveElement(element.id, 'down');
                      }}
                      disabled={index === elements.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteElement(element.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {renderElementContent(element)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}