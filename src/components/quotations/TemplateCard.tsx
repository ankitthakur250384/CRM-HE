import React from 'react';
import { Card, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Template } from '../../types/template';
import { Edit2, Eye, Copy, Trash2, FileText } from 'lucide-react';

interface TemplateCardProps {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
  onSetDefault: () => void;
}

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onPreview,
  onSetDefault
}: TemplateCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {template.name}
            </h3>
            {template.description && (
              <p className="mt-1 text-sm text-gray-500">{template.description}</p>
            )}
            {template.isDefault && (
              <span className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Default Template
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          {!template.isDefault && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onSetDefault}
              >
                <Copy className="h-4 w-4 mr-2" />
                Set as Default
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 