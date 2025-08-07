import { db } from '../lib/dbClient.js';

const modernTemplateService = {
  async getTemplates() {
    return db.any('SELECT * FROM quotation_templates ORDER BY id DESC');
  },
  async createTemplate(data) {
    const { name, elements, tags, usage_count, thumbnail } = data;
    return db.one(
      'INSERT INTO quotation_templates (name, elements, tags, usage_count, thumbnail) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, elements, tags, usage_count || 0, thumbnail || null]
    );
  },
  async updateTemplate(id, data) {
    const { name, elements, tags, usage_count, thumbnail } = data;
    return db.one(
      'UPDATE quotation_templates SET name=$1, elements=$2, tags=$3, usage_count=$4, thumbnail=$5 WHERE id=$6 RETURNING *',
      [name, elements, tags, usage_count, thumbnail, id]
    );
  },
  async deleteTemplate(id) {
    return db.none('DELETE FROM quotation_templates WHERE id=$1', [id]);
  },
};

export default modernTemplateService;
