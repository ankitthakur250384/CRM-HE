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
    <Card className="h-full">
      <CardContent className="p-4 sm:p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-auto">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 sm:h-5 w-4 sm:w-5 flex-shrink-0" />
              <span className="break-words">{template.name}</span>
            </h3>
            {template.description && (
              <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2">
                {template.description}
              </p>
            )}
            {template.isDefault && (
              <span className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Default Template
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            className="flex-1 sm:flex-none"
            onClick={onEdit}
          >
            <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="flex-1 sm:flex-none"
            onClick={onPreview}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          {!template.isDefault && (
            <>
              <Button
                variant="outline"
                size="xs"
                className="flex-1 sm:flex-none"
                onClick={onSetDefault}
              >
                <Copy className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Set Default</span>
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="flex-1 sm:flex-none"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}