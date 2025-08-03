import React, { useState, useEffect } from 'react';
import { Button, Input, Select } from '@mui/material';
import { QuillEditor } from '../components/QuillEditor';
import { getTemplates, saveTemplate } from '../services/templateApi';

const dynamicFields = [
  { label: 'Customer Name', value: '{{customerName}}' },
  { label: 'Quotation Number', value: '{{quotationNumber}}' },
  { label: 'Date', value: '{{quotationDate}}' },
  { label: 'Total', value: '{{total}}' },
  // Add more as needed
];

export default function TemplateBuilder() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    getTemplates().then(setTemplates);
  }, []);

  useEffect(() => {
    setPreview(content);
  }, [content]);

  const handleFieldInsert = (field: string) => {
    setContent(content + ' ' + field);
  };

  const handleSave = async () => {
    const template = { name, description, content, isDefault };
    await saveTemplate(template);
    alert('Template saved!');
  };

  return (
    <div className="template-builder">
      <h1>Quotation Template Builder</h1>
      <div style={{ marginBottom: 16 }}>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Template Name" />
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
        <Select
          native
          value={selectedTemplate?.id || ''}
          onChange={e => {
            const tpl = templates.find(t => t.id === e.target.value);
            setSelectedTemplate(tpl);
            setName(tpl?.name || '');
            setDescription(tpl?.description || '');
            setContent(tpl?.content || '');
            setIsDefault(tpl?.isDefault || false);
          }}
        >
          <option value="">New Template</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
        <Button onClick={() => setSelectedTemplate(null)}>New</Button>
      </div>
      <div style={{ display: 'flex', gap: 32 }}>
        <div style={{ flex: 1 }}>
          <QuillEditor value={content} onChange={setContent} />
          <div style={{ marginTop: 8 }}>
            {dynamicFields.map(f => (
              <Button key={f.value} onClick={() => handleFieldInsert(f.value)}>{f.label}</Button>
            ))}
          </div>
          <Button variant="contained" color="primary" onClick={handleSave} style={{ marginTop: 16 }}>Save Template</Button>
        </div>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: 16 }}>
          <h2>Live Preview</h2>
          <div dangerouslySetInnerHTML={{ __html: preview }} />
        </div>
      </div>
    </div>
  );
}
