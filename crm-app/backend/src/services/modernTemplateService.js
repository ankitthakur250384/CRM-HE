import { db } from '../lib/dbClient.js';

const modernTemplateService = {
  async getTemplates() {
    const templates = await db.any(`
      SELECT 
        id,
        name,
        description,
        content,
        elements,
        is_default as "isDefault",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt",
        usage_count,
        tags,
        thumbnail
      FROM quotation_templates 
      ORDER BY created_at DESC
    `);
    
    // Parse elements JSON if it exists
    return templates.map(template => ({
      ...template,
      elements: template.elements || [],
      usage_count: template.usage_count || 0,
      tags: template.tags || []
    }));
  },
  
  async createTemplate(data) {
    const { name, description, elements, tags, usage_count, thumbnail, createdBy } = data;
    return db.one(`
      INSERT INTO quotation_templates (
        name, 
        description, 
        content, 
        elements, 
        tags, 
        usage_count, 
        thumbnail,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING 
        id,
        name,
        description,
        content,
        elements,
        is_default as "isDefault",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt",
        usage_count,
        tags,
        thumbnail
    `, [
      name, 
      description || '', 
      '', // content can be empty for modern templates
      JSON.stringify(elements || []), 
      tags || [], 
      usage_count || 0, 
      thumbnail || null,
      createdBy || 'system'
    ]);
  },
  
  async updateTemplate(id, data) {
    const { name, description, elements, tags, usage_count, thumbnail } = data;
    return db.one(`
      UPDATE quotation_templates 
      SET 
        name = $1, 
        description = $2,
        elements = $3, 
        tags = $4, 
        usage_count = $5, 
        thumbnail = $6,
        updated_at = NOW()
      WHERE id = $7 
      RETURNING 
        id,
        name,
        description,
        content,
        elements,
        is_default as "isDefault",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt",
        usage_count,
        tags,
        thumbnail
    `, [
      name, 
      description, 
      JSON.stringify(elements || []), 
      tags || [], 
      usage_count || 0, 
      thumbnail,
      id
    ]);
  },
  
  async deleteTemplate(id) {
    return db.none('DELETE FROM quotation_templates WHERE id = $1', [id]);
  },
  
  async getTemplateById(id) {
    const template = await db.oneOrNone(`
      SELECT 
        id,
        name,
        description,
        content,
        elements,
        is_default as "isDefault",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt",
        usage_count,
        tags,
        thumbnail
      FROM quotation_templates 
      WHERE id = $1
    `, [id]);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    return {
      ...template,
      elements: template.elements || [],
      usage_count: template.usage_count || 0,
      tags: template.tags || []
    };
  }
};

export default modernTemplateService;
