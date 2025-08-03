import { BaseRepository } from './baseRepository';
import { Template } from '../../types/template';
import { db } from '../../lib/dbClient'; // Use browser-compatible client

export class TemplateRepository extends BaseRepository<Template> {
  constructor() {
    super('quotation_templates');
  }

  async getTemplates(): Promise<Template[]> {
    try {
      const templates = await db.any('SELECT * FROM quotation_templates ORDER BY is_default DESC');
      return templates.map(template => this.convertRowToCamelCase(template));
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }
  
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      const template = await db.oneOrNone('SELECT * FROM quotation_templates WHERE id = $1', [id]);
      return template ? this.convertRowToCamelCase(template) : null;
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      throw error;
    }
  }
  
  async createTemplate(template: Omit<Template, 'id'>): Promise<Template> {
    try {
      const { name, description, content, styles, isDefault, createdBy } = template;
      const result = await db.one(
        `INSERT INTO quotation_templates (name, description, content, styles, is_default, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, description, content, styles, isDefault || false, createdBy]
      );
      return this.convertRowToCamelCase(result);
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }
  
  async updateTemplate(id: string, template: Partial<Template>): Promise<Template> {
    try {
      const { name, description, content, styles, isDefault } = template;
      const result = await db.one(
        `UPDATE quotation_templates SET
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          content = COALESCE($3, content),
          styles = COALESCE($4, styles),
          is_default = COALESCE($5, is_default),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [name, description, content, styles, isDefault, id]
      );
      return this.convertRowToCamelCase(result);
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }
  
  async deleteTemplate(id: string): Promise<void> {
    try {
      await db.none('DELETE FROM quotation_templates WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }
  
  private convertRowToCamelCase(row: any): Template {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      content: row.content,
      styles: row.styles,
      isDefault: row.is_default,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      createdBy: row.created_by
    };
  }
  
}

export default new TemplateRepository();
