import { db } from '../lib/dbClient.js';

export class TemplateBuilderService {
  
  // Save a new template from the template builder
  async saveTemplate(templateData) {
    try {
      const {
        name,
        description,
        elements,
        styles,
        layout,
        category = 'general',
        isDefault = false,
        createdBy
      } = templateData;

      // Validate required fields
      if (!name || !name.trim()) {
        throw new Error('Template name is required');
      }

      if (!elements || !Array.isArray(elements)) {
        throw new Error('Template elements are required');
      }

      // If setting as default, unset other defaults first
      if (isDefault) {
        await this.unsetOtherDefaults();
      }

      // Generate search vector for template content
      const searchContent = this.generateSearchContent(elements, name, description);

      const result = await db.one(`
        INSERT INTO quotation_templates (
          name, 
          description, 
          elements, 
          styles, 
          layout, 
          category, 
          is_default, 
          is_active,
          created_by,
          search_vector
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, to_tsvector('english', $10))
        RETURNING *
      `, [
        name.trim(),
        description || '',
        JSON.stringify(elements),
        JSON.stringify(styles || {}),
        JSON.stringify(layout || {}),
        category,
        isDefault,
        true,
        createdBy,
        searchContent
      ]);

      console.log('✅ Template saved successfully:', result.id);
      return this.formatTemplateResponse(result);

    } catch (error) {
      console.error('❌ Error saving template:', error);
      throw error;
    }
  }

  // Update an existing template
  async updateTemplate(templateId, templateData) {
    try {
      const {
        name,
        description,
        elements,
        styles,
        layout,
        category,
        isDefault
      } = templateData;

      // If setting as default, unset other defaults first
      if (isDefault) {
        await this.unsetOtherDefaults(templateId);
      }

      // Generate search vector
      const searchContent = this.generateSearchContent(elements, name, description);

      const result = await db.one(`
        UPDATE quotation_templates SET
          name = COALESCE($2, name),
          description = COALESCE($3, description),
          elements = COALESCE($4, elements),
          styles = COALESCE($5, styles),
          layout = COALESCE($6, layout),
          category = COALESCE($7, category),
          is_default = COALESCE($8, is_default),
          updated_at = CURRENT_TIMESTAMP,
          search_vector = CASE WHEN $9 IS NOT NULL THEN to_tsvector('english', $9) ELSE search_vector END,
          version = version + 1
        WHERE id = $1 AND is_active = true
        RETURNING *
      `, [
        templateId,
        name?.trim(),
        description,
        elements ? JSON.stringify(elements) : null,
        styles ? JSON.stringify(styles) : null,
        layout ? JSON.stringify(layout) : null,
        category,
        isDefault,
        searchContent
      ]);

      console.log('✅ Template updated successfully:', result.id);
      return this.formatTemplateResponse(result);

    } catch (error) {
      console.error('❌ Error updating template:', error);
      throw error;
    }
  }

  // Get all templates
  async getTemplates(options = {}) {
    try {
      const {
        category,
        isActive = true,
        includeInactive = false,
        limit = 50,
        offset = 0,
        searchTerm
      } = options;

      let query = 'SELECT * FROM quotation_templates';
      let conditions = [];
      let params = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (!includeInactive) {
        conditions.push(`is_active = $${paramIndex++}`);
        params.push(isActive);
      }

      if (category) {
        conditions.push(`category = $${paramIndex++}`);
        params.push(category);
      }

      if (searchTerm) {
        conditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex++})`);
        params.push(searchTerm);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY is_default DESC, usage_count DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const templates = await db.any(query, params);
      return templates.map(template => this.formatTemplateResponse(template));

    } catch (error) {
      console.error('❌ Error fetching templates:', error);
      throw error;
    }
  }

  // Get template by ID
  async getTemplateById(templateId) {
    try {
      const template = await db.oneOrNone(
        'SELECT * FROM quotation_templates WHERE id = $1 AND is_active = true',
        [templateId]
      );

      if (!template) {
        return null;
      }

      return this.formatTemplateResponse(template);

    } catch (error) {
      console.error('❌ Error fetching template:', error);
      throw error;
    }
  }

  // Get default template
  async getDefaultTemplate() {
    try {
      const template = await db.oneOrNone(
        'SELECT * FROM quotation_templates WHERE is_default = true AND is_active = true ORDER BY created_at DESC LIMIT 1'
      );

      return template ? this.formatTemplateResponse(template) : null;

    } catch (error) {
      console.error('❌ Error fetching default template:', error);
      return null;
    }
  }

  // Delete template (soft delete)
  async deleteTemplate(templateId) {
    try {
      await db.none(
        'UPDATE quotation_templates SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [templateId]
      );

      console.log('✅ Template deleted successfully:', templateId);
      return true;

    } catch (error) {
      console.error('❌ Error deleting template:', error);
      throw error;
    }
  }

  // Duplicate template
  async duplicateTemplate(templateId, newName) {
    try {
      const originalTemplate = await this.getTemplateById(templateId);
      if (!originalTemplate) {
        throw new Error('Original template not found');
      }

      const duplicateData = {
        name: newName || `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        elements: originalTemplate.elements,
        styles: originalTemplate.styles,
        layout: originalTemplate.layout,
        category: originalTemplate.category,
        isDefault: false, // Never make duplicates default
        createdBy: originalTemplate.createdBy
      };

      return await this.saveTemplate(duplicateData);

    } catch (error) {
      console.error('❌ Error duplicating template:', error);
      throw error;
    }
  }

  // Set template as default
  async setAsDefault(templateId) {
    try {
      // First unset other defaults
      await this.unsetOtherDefaults(templateId);

      // Set this template as default
      const result = await db.one(
        'UPDATE quotation_templates SET is_default = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = true RETURNING *',
        [templateId]
      );

      console.log('✅ Template set as default:', templateId);
      return this.formatTemplateResponse(result);

    } catch (error) {
      console.error('❌ Error setting template as default:', error);
      throw error;
    }
  }

  // Private helper methods

  // Unset other default templates
  async unsetOtherDefaults(excludeId = null) {
    try {
      let query = 'UPDATE quotation_templates SET is_default = false WHERE is_default = true';
      let params = [];

      if (excludeId) {
        query += ' AND id != $1';
        params.push(excludeId);
      }

      await db.none(query, params);
    } catch (error) {
      console.error('❌ Error unsetting other defaults:', error);
    }
  }

  // Generate search content from template elements
  generateSearchContent(elements, name, description) {
    try {
      let searchContent = [name, description].filter(Boolean).join(' ');

      if (elements && Array.isArray(elements)) {
        const elementText = elements.map(element => {
          const content = element.content || '';
          const type = element.type || '';
          return `${type} ${content}`;
        }).join(' ');

        searchContent += ' ' + elementText;
      }

      return searchContent.trim();
    } catch (error) {
      console.error('❌ Error generating search content:', error);
      return name || '';
    }
  }

  // Format template response
  formatTemplateResponse(template) {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      elements: typeof template.elements === 'string' ? JSON.parse(template.elements) : template.elements,
      styles: typeof template.styles === 'string' ? JSON.parse(template.styles) : template.styles,
      layout: typeof template.layout === 'string' ? JSON.parse(template.layout) : template.layout,
      category: template.category,
      tags: template.tags,
      thumbnail: template.thumbnail,
      usageCount: template.usage_count,
      isDefault: template.is_default,
      isActive: template.is_active,
      version: template.version,
      createdBy: template.created_by,
      createdAt: template.created_at,
      updatedAt: template.updated_at
    };
  }

  // Validate template elements structure
  validateTemplateElements(elements) {
    if (!Array.isArray(elements)) {
      throw new Error('Elements must be an array');
    }

    for (const element of elements) {
      if (!element.type) {
        throw new Error('Each element must have a type');
      }

      if (!element.id) {
        throw new Error('Each element must have an id');
      }

      // Validate specific element types
      switch (element.type) {
        case 'table':
          if (!element.config || !element.config.rows) {
            throw new Error('Table elements must have config.rows');
          }
          break;
        
        case 'text':
        case 'header':
        case 'terms':
          if (typeof element.content !== 'string') {
            throw new Error(`${element.type} elements must have string content`);
          }
          break;
      }
    }

    return true;
  }
}

export default new TemplateBuilderService();
