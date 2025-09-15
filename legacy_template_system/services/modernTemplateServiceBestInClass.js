/**
 * BEST-IN-CLASS MODERN TEMPLATE SERVICE
 * Production-ready service with all enterprise features
 */

import { db } from '../lib/dbClient.js';
import Ajv from 'ajv';

// JSON Schema for template validation
const templateElementSchema = {
  type: 'object',
  required: ['id', 'type'],
  properties: {
    id: { type: 'string', minLength: 1 },
    type: { 
      type: 'string', 
      enum: ['header', 'text', 'field', 'table', 'image', 'terms', 'spacer'] 
    },
    content: { type: 'string' },
    fieldType: { type: 'string' },
    styles: { type: 'object' },
    config: { type: 'object' }
  },
  additionalProperties: false
};

const templateSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string', maxLength: 1000 },
    elements: { 
      type: 'array', 
      items: templateElementSchema,
      maxItems: 50  // Prevent overly complex templates
    },
    styles: { type: 'object' },
    layout: { type: 'object' },
    tags: { 
      type: 'array', 
      items: { type: 'string' },
      maxItems: 20 
    },
    category: { type: 'string', maxLength: 100 },
    thumbnail: { type: 'string' }
  },
  additionalProperties: false
};

const ajv = new Ajv();
const validateTemplate = ajv.compile(templateSchema);

class TemplateValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'TemplateValidationError';
    this.errors = errors;
  }
}

class TemplateNotFoundError extends Error {
  constructor(id) {
    super(`Template not found: ${id}`);
    this.name = 'TemplateNotFoundError';
  }
}

class ConcurrentUpdateError extends Error {
  constructor(id, expectedVersion, actualVersion) {
    super(`Concurrent update detected for template ${id}. Expected version ${expectedVersion}, but current version is ${actualVersion}`);
    this.name = 'ConcurrentUpdateError';
  }
}

const modernTemplateService = {
  /**
   * Get templates with advanced filtering and pagination
   */
  async getTemplates(options = {}) {
    const {
      search = '',
      category = null,
      tags = null,
      isActive = true,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    let query = `
      SELECT 
        id,
        name,
        description,
        thumbnail,
        category,
        tags,
        usage_count,
        is_default as "isDefault",
        is_active as "isActive",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
      FROM quotation_templates 
      WHERE is_active = $1
    `;
    
    const params = [isActive];
    let paramIndex = 2;

    // Add search filter
    if (search && search.trim()) {
      query += ` AND search_vector @@ plainto_tsquery('english', $${paramIndex})`;
      params.push(search.trim());
      paramIndex++;
    }

    // Add category filter
    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Add tags filter
    if (tags && Array.isArray(tags)) {
      query += ` AND tags && $${paramIndex}`;
      params.push(tags);
      paramIndex++;
    }

    // Add sorting
    const validSortColumns = ['created_at', 'updated_at', 'usage_count', 'name'];
    const validSortOrders = ['ASC', 'DESC'];
    
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
    } else {
      query += ` ORDER BY created_at DESC`;
    }

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const templates = await db.any(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM quotation_templates 
      WHERE is_active = $1
    `;
    const countParams = [isActive];
    let countParamIndex = 2;

    if (search && search.trim()) {
      countQuery += ` AND search_vector @@ plainto_tsquery('english', $${countParamIndex})`;
      countParams.push(search.trim());
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (tags && Array.isArray(tags)) {
      countQuery += ` AND tags && $${countParamIndex}`;
      countParams.push(tags);
    }

    const [{ total }] = await db.any(countQuery, countParams);

    return {
      templates: templates.map(template => ({
        ...template,
        tags: template.tags || [],
        usage_count: template.usage_count || 0
      })),
      pagination: {
        total: parseInt(total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(total)
      }
    };
  },

  /**
   * Create template with validation and audit
   */
  async createTemplate(data, createdBy = 'usr_admin01') {
    // Validate input data
    if (!validateTemplate(data)) {
      throw new TemplateValidationError(
        'Template validation failed',
        validateTemplate.errors
      );
    }

    const {
      name,
      description = '',
      elements = [],
      styles = {},
      layout = {},
      tags = [],
      category = 'general',
      thumbnail = null
    } = data;

    // Ensure created_by user exists
    const validCreatedBy = await this._ensureValidUser(createdBy);

    try {
      const template = await db.one(`
        INSERT INTO quotation_templates (
          name, 
          description, 
          content,
          elements, 
          styles,
          layout,
          tags, 
          category,
          thumbnail,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING 
          id,
          name,
          description,
          content,
          elements,
          styles,
          layout,
          tags,
          category,
          thumbnail,
          usage_count,
          is_default as "isDefault",
          is_active as "isActive",
          created_by as "createdBy",
          created_at as "createdAt",
          updated_at as "updatedAt",
          version
      `, [
        name,
        description,
        '', // Legacy content field
        JSON.stringify(elements),
        JSON.stringify(styles),
        JSON.stringify(layout),
        tags,
        category,
        thumbnail,
        validCreatedBy
      ]);

      return {
        ...template,
        elements: template.elements || [],
        styles: template.styles || {},
        layout: template.layout || {},
        tags: template.tags || [],
        usage_count: template.usage_count || 0
      };
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error(`Template with name '${name}' already exists`);
      }
      throw error;
    }
  },

  /**
   * Update template with optimistic locking
   */
  async updateTemplate(id, data, expectedVersion) {
    // Validate input data
    if (!validateTemplate(data)) {
      throw new TemplateValidationError(
        'Template validation failed',
        validateTemplate.errors
      );
    }

    const {
      name,
      description,
      elements,
      styles,
      layout,
      tags,
      category,
      thumbnail
    } = data;

    try {
      const template = await db.one(`
        UPDATE quotation_templates 
        SET 
          name = $1, 
          description = $2,
          elements = $3,
          styles = $4,
          layout = $5,
          tags = $6,
          category = $7,
          thumbnail = $8,
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9 AND version = $10 AND is_active = TRUE
        RETURNING 
          id,
          name,
          description,
          content,
          elements,
          styles,
          layout,
          tags,
          category,
          thumbnail,
          usage_count,
          is_default as "isDefault",
          is_active as "isActive",
          created_by as "createdBy",
          created_at as "createdAt",
          updated_at as "updatedAt",
          version
      `, [
        name,
        description,
        JSON.stringify(elements || []),
        JSON.stringify(styles || {}),
        JSON.stringify(layout || {}),
        tags || [],
        category,
        thumbnail,
        id,
        expectedVersion
      ]);

      return {
        ...template,
        elements: template.elements || [],
        styles: template.styles || {},
        layout: template.layout || {},
        tags: template.tags || [],
        usage_count: template.usage_count || 0
      };
    } catch (error) {
      if (error.code === '02000') { // No data found
        // Check if template exists but version mismatch
        const currentTemplate = await this.getTemplateById(id);
        if (currentTemplate) {
          throw new ConcurrentUpdateError(id, expectedVersion, currentTemplate.version);
        } else {
          throw new TemplateNotFoundError(id);
        }
      }
      throw error;
    }
  },

  /**
   * Soft delete template
   */
  async deleteTemplate(id) {
    const result = await db.result(
      'UPDATE quotation_templates SET is_active = FALSE, version = version + 1 WHERE id = $1 AND is_active = TRUE',
      [id]
    );

    if (result.rowCount === 0) {
      throw new TemplateNotFoundError(id);
    }

    return true;
  },

  /**
   * Get template by ID with full details
   */
  async getTemplateById(id) {
    const template = await db.oneOrNone(`
      SELECT 
        id,
        name,
        description,
        content,
        elements,
        styles,
        layout,
        tags,
        category,
        thumbnail,
        usage_count,
        is_default as "isDefault",
        is_active as "isActive",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt",
        version
      FROM quotation_templates 
      WHERE id = $1 AND is_active = TRUE
    `, [id]);

    if (!template) {
      throw new TemplateNotFoundError(id);
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

  /**
   * Set default template (only one can be default)
   */
  async setDefaultTemplate(id) {
    try {
      await db.func('set_default_template', [id]);
      return true;
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new TemplateNotFoundError(id);
      }
      throw error;
    }
  },

  /**
   * Increment usage count
   */
  async incrementUsage(id) {
    const result = await db.func('increment_template_usage', [id]);
    if (!result) {
      throw new TemplateNotFoundError(id);
    }
    return true;
  },

  /**
   * Get template history
   */
  async getTemplateHistory(id, limit = 10) {
    return await db.any(`
      SELECT 
        id,
        snapshot,
        change_type as "changeType",
        change_summary as "changeSummary",
        changed_by as "changedBy",
        changed_at as "changedAt",
        version_number as "versionNumber"
      FROM template_history 
      WHERE template_id = $1 
      ORDER BY changed_at DESC 
      LIMIT $2
    `, [id, limit]);
  },

  /**
   * Search templates with full-text search
   */
  async searchTemplates(query, limit = 20, offset = 0) {
    return await db.func('search_templates', [query, limit, offset]);
  },

  /**
   * Get template analytics
   */
  async getAnalytics() {
    const stats = await db.one(`
      SELECT 
        COUNT(*) as total_templates,
        COUNT(*) FILTER (WHERE is_active = TRUE) as active_templates,
        COUNT(*) FILTER (WHERE is_default = TRUE) as default_templates,
        AVG(usage_count) as avg_usage_count,
        MAX(usage_count) as max_usage_count,
        COUNT(DISTINCT category) as categories_count,
        COUNT(DISTINCT created_by) as creators_count
      FROM quotation_templates
    `);

    const topTemplates = await db.any(`
      SELECT id, name, usage_count 
      FROM quotation_templates 
      WHERE is_active = TRUE 
      ORDER BY usage_count DESC 
      LIMIT 5
    `);

    const categoriesStats = await db.any(`
      SELECT 
        category, 
        COUNT(*) as count,
        AVG(usage_count) as avg_usage
      FROM quotation_templates 
      WHERE is_active = TRUE 
      GROUP BY category 
      ORDER BY count DESC
    `);

    return {
      overview: {
        totalTemplates: parseInt(stats.total_templates),
        activeTemplates: parseInt(stats.active_templates),
        defaultTemplates: parseInt(stats.default_templates),
        avgUsageCount: parseFloat(stats.avg_usage_count) || 0,
        maxUsageCount: parseInt(stats.max_usage_count) || 0,
        categoriesCount: parseInt(stats.categories_count),
        creatorsCount: parseInt(stats.creators_count)
      },
      topTemplates: topTemplates.map(t => ({
        ...t,
        usage_count: parseInt(t.usage_count)
      })),
      categoriesStats: categoriesStats.map(c => ({
        ...c,
        count: parseInt(c.count),
        avg_usage: parseFloat(c.avg_usage) || 0
      }))
    };
  },

  /**
   * Ensure user exists for FK constraint
   */
  async _ensureValidUser(userId) {
    const user = await db.oneOrNone('SELECT uid FROM users WHERE uid = $1', [userId]);
    if (!user) {
      // Fallback to admin user
      const adminUser = await db.oneOrNone('SELECT uid FROM users WHERE role = $1 LIMIT 1', ['admin']);
      return adminUser ? adminUser.uid : 'usr_admin01';
    }
    return userId;
  }
};

export default modernTemplateService;
export { TemplateValidationError, TemplateNotFoundError, ConcurrentUpdateError };
