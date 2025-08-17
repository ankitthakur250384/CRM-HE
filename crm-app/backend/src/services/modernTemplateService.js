import { db } from '../lib/dbClient.js';

const modernTemplateService = {
  // Get templates with search, pagination, and filtering
  async getTemplates(options = {}) {
    const { 
      search = '', 
      category = null, 
      isActive = true, 
      limit = 20, 
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;
    
    let query;
    let params;
    
    if (search && search.trim()) {
      // Use full-text search function
      query = `
        SELECT * FROM search_templates($1, $2, $3)
        ${category ? 'WHERE category = $4' : ''}
      `;
      params = [search.trim(), limit, offset];
      if (category) params.push(category);
    } else {
      // Regular query with filters
      query = `
        SELECT 
          id, name, description, content, elements, styles, layout,
          tags, thumbnail, category, usage_count, is_default as "isDefault",
          is_active as "isActive", version, created_by as "createdBy",
          created_at as "createdAt", updated_at as "updatedAt"
        FROM quotation_templates 
        WHERE is_active = $1 
        ${category ? 'AND category = $2' : ''}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${category ? 3 : 2} OFFSET $${category ? 4 : 3}
      `;
      params = [isActive];
      if (category) params.push(category);
      params.push(limit, offset);
    }
    
    const templates = await db.any(query, params);
    
    // Ensure proper data types
    return templates.map(template => ({
      ...template,
      elements: template.elements || [],
      styles: template.styles || {},
      layout: template.layout || {},
      tags: template.tags || [],
      usage_count: template.usage_count || 0
    }));
  },
  
  // Create template with optimistic locking and validation
  async createTemplate(data) {
    const { 
      name, description, elements = [], styles = {}, layout = {},
      tags = [], category = 'general', thumbnail, createdBy 
    } = data;
    
    // Validate required fields
    if (!name || !name.trim()) {
      throw new Error('Template name is required');
    }
    
    if (name.length > 255) {
      throw new Error('Template name must be 255 characters or less');
    }
    
    // Validate JSON sizes (matching DB constraints)
    if (JSON.stringify(elements).length > 524288) { // 512KB
      throw new Error('Template elements too large (max 512KB)');
    }
    
    if (JSON.stringify(styles).length > 65536) { // 64KB
      throw new Error('Template styles too large (max 64KB)');
    }
    
    // Ensure we use a valid user ID
    let validCreatedBy = createdBy || 'usr_admin01';
    if (validCreatedBy === 'dev-user' || validCreatedBy === 'system') {
      validCreatedBy = 'usr_admin01';
    }
    
    try {
      return await db.one(`
        INSERT INTO quotation_templates (
          name, description, content, elements, styles, layout,
          tags, thumbnail, category, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING 
          id, name, description, content, elements, styles, layout,
          tags, thumbnail, category, usage_count, is_default as "isDefault",
          is_active as "isActive", version, created_by as "createdBy",
          created_at as "createdAt", updated_at as "updatedAt"
      `, [
        name.trim(),
        description || '',
        '', // content for backward compatibility
        JSON.stringify(elements),
        JSON.stringify(styles),
        JSON.stringify(layout),
        tags,
        thumbnail || null,
        category,
        validCreatedBy
      ]);
    } catch (error) {
      if (error.code === '23503') {
        throw new Error(`Template creation failed: User '${validCreatedBy}' does not exist in the database.`);
      }
      if (error.code === '23514') {
        throw new Error('Template validation failed: ' + error.detail);
      }
      throw error;
    }
  },
  
  // Update template with optimistic locking
  async updateTemplate(id, data, expectedVersion = null) {
    const { 
      name, description, elements, styles, layout,
      tags, thumbnail, category 
    } = data;
    
    // Validate inputs similar to create
    if (name && name.length > 255) {
      throw new Error('Template name must be 255 characters or less');
    }
    
    // Build dynamic update query
    const updateFields = [];
    const params = [];
    let paramCount = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      params.push(name.trim());
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      params.push(description);
    }
    if (elements !== undefined) {
      updateFields.push(`elements = $${paramCount++}`);
      params.push(JSON.stringify(elements));
    }
    if (styles !== undefined) {
      updateFields.push(`styles = $${paramCount++}`);
      params.push(JSON.stringify(styles));
    }
    if (layout !== undefined) {
      updateFields.push(`layout = $${paramCount++}`);
      params.push(JSON.stringify(layout));
    }
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramCount++}`);
      params.push(tags);
    }
    if (thumbnail !== undefined) {
      updateFields.push(`thumbnail = $${paramCount++}`);
      params.push(thumbnail);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramCount++}`);
      params.push(category);
    }
    
    // Always increment version for optimistic locking
    updateFields.push(`version = version + 1`);
    
    // Build WHERE clause with optional version check
    let whereClause = `id = $${paramCount++}`;
    params.push(id);
    
    if (expectedVersion !== null) {
      whereClause += ` AND version = $${paramCount++}`;
      params.push(expectedVersion);
    }
    
    const query = `
      UPDATE quotation_templates 
      SET ${updateFields.join(', ')}
      WHERE ${whereClause} AND is_active = TRUE
      RETURNING 
        id, name, description, content, elements, styles, layout,
        tags, thumbnail, category, usage_count, is_default as "isDefault",
        is_active as "isActive", version, created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    try {
      const result = await db.oneOrNone(query, params);
      
      if (!result) {
        if (expectedVersion !== null) {
          throw new Error('Template update failed: Version conflict (template was modified by another user)');
        } else {
          throw new Error('Template not found or inactive');
        }
      }
      
      return result;
    } catch (error) {
      if (error.code === '23514') {
        throw new Error('Template validation failed: ' + error.detail);
      }
      throw error;
    }
  },
  
  // Soft delete template
  async deleteTemplate(id) {
    const result = await db.oneOrNone(`
      UPDATE quotation_templates 
      SET is_active = FALSE, version = version + 1
      WHERE id = $1 AND is_active = TRUE
      RETURNING id
    `, [id]);
    
    if (!result) {
      throw new Error('Template not found or already deleted');
    }
    
    return true;
  },
  
  // Get single template by ID
  async getTemplateById(id) {
    const template = await db.oneOrNone(`
      SELECT 
        id, name, description, content, elements, styles, layout,
        tags, thumbnail, category, usage_count, is_default as "isDefault",
        is_active as "isActive", version, created_by as "createdBy",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM quotation_templates 
      WHERE id = $1 AND is_active = TRUE
    `, [id]);
    
    if (!template) {
      throw new Error('Template not found');
    }
    
    return {
      ...template,
      elements: template.elements || [],
      styles: template.styles || {},
      layout: template.layout || {},
      tags: template.tags || [],
      usage_count: template.usage_count || 0
    };
  },
  
  // Set default template (uses database function)
  async setDefaultTemplate(id) {
    try {
      await db.none('SELECT set_default_template($1)', [id]);
      return true;
    } catch (error) {
      throw new Error('Failed to set default template: ' + error.message);
    }
  },
  
  // Increment usage count (uses database function)
  async incrementUsage(id) {
    const result = await db.oneOrNone('SELECT increment_template_usage($1) as success', [id]);
    
    if (!result || !result.success) {
      throw new Error('Template not found or inactive');
    }
    
    return true;
  },
  
  // Get template history
  async getTemplateHistory(id, limit = 10, offset = 0) {
    return db.any(`
      SELECT 
        id, template_id as "templateId", snapshot, change_type as "changeType",
        change_summary as "changeSummary", changed_by as "changedBy",
        changed_at as "changedAt", version_number as "versionNumber"
      FROM template_history 
      WHERE template_id = $1 
      ORDER BY changed_at DESC 
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);
  },
  
  // Get template categories
  async getCategories() {
    return db.any(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM quotation_templates 
      WHERE is_active = TRUE
      GROUP BY category
      ORDER BY count DESC, category ASC
    `);
  },
  
  // Get template statistics
  async getStatistics() {
    return db.one(`
      SELECT 
        COUNT(*) as total_templates,
        COUNT(*) FILTER (WHERE is_active = TRUE) as active_templates,
        COUNT(*) FILTER (WHERE is_default = TRUE) as default_templates,
        AVG(usage_count) as avg_usage,
        MAX(usage_count) as max_usage,
        COUNT(DISTINCT category) as total_categories
      FROM quotation_templates
    `);
  }
};

export default modernTemplateService;
