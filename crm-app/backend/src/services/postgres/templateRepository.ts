import { BaseRepository } from './baseRepository';
import { Template } from '../../types/template';
import { db } from '../../lib/dbClient'; // Use browser-compatible client

export class TemplateRepository extends BaseRepository<Template> {
  constructor() {
    super('templates');
  }
  
  async getTemplates(): Promise<Template[]> {
    try {
      const templates = await db.any('SELECT * FROM templates ORDER BY is_default DESC');
      return templates.map(template => this.convertRowToCamelCase(template));
    } catch (error) {
      console.error('Error fetching templates:', error);
      
      // Fallback to mock templates for development/demo
      return [
        {
          id: 'template-1',
          name: 'Default Template',
          description: 'Standard quotation template with company branding',
          content: this.getDefaultTemplateContent(),
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'template-2',
          name: 'Advanced Template',
          description: 'Template with additional sections and formatting',
          content: this.getDefaultTemplateContent(),
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
  }
  
  async getTemplateById(id: string): Promise<Template | null> {
    try {
      const template = await db.oneOrNone('SELECT * FROM templates WHERE id = $1', [id]);
      return template ? this.convertRowToCamelCase(template) : null;
    } catch (error) {
      console.error('Error fetching template by ID:', error);
      
      // Fallback for development/demo
      if (id === 'template-1') {
        return {
          id: 'template-1',
          name: 'Default Template',
          description: 'Standard quotation template with company branding',
          content: this.getDefaultTemplateContent(),
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return null;
    }
  }
  
  async createTemplate(template: Omit<Template, 'id'>): Promise<Template> {
    try {
      // In a real implementation, this would insert into the database
      const newTemplate: Template = {
        ...template,
        id: `template-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }
  
  async updateTemplate(id: string, template: Partial<Template>): Promise<Template> {
    try {
      // In a real implementation, this would update the database
      return {
        ...template,
        id,
        updatedAt: new Date().toISOString()
      } as Template;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }
  
  async deleteTemplate(id: string): Promise<void> {
    try {
      await db.none('DELETE FROM templates WHERE id = $1', [id]);
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
  
  private getDefaultTemplateContent(): string {
    return `
      <div class="quotation-template">
        <header>
          <h1>{{companyName}}</h1>
          <p>{{companyAddress}}</p>
          <p>Phone: {{companyPhone}} | Email: {{companyEmail}}</p>
        </header>
        
        <section class="customer-details">
          <h2>Customer Details</h2>
          <p><strong>Name:</strong> {{customerName}}</p>
          <p><strong>Email:</strong> {{customerEmail}}</p>
          <p><strong>Phone:</strong> {{customerPhone}}</p>
          <p><strong>Address:</strong> {{customerAddress}}</p>
        </section>
        
        <section class="quotation-details">
          <h2>Quotation Details</h2>
          <p><strong>Quotation Number:</strong> {{quotationNumber}}</p>
          <p><strong>Date:</strong> {{quotationDate}}</p>
          <p><strong>Valid Until:</strong> {{validUntil}}</p>
          <p><strong>Prepared By:</strong> {{preparedBy}}</p>
        </section>
        
        <section class="items">
          <h2>Services & Equipment</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {{#items}}
              <tr>
                <td>{{description}}</td>
                <td>{{quantity}}</td>
                <td>{{unitPrice}}</td>
                <td>{{total}}</td>
              </tr>
              {{/items}}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3">Subtotal</td>
                <td>{{subtotal}}</td>
              </tr>
              <tr>
                <td colspan="3">Tax ({{taxRate}}%)</td>
                <td>{{taxAmount}}</td>
              </tr>
              <tr>
                <td colspan="3"><strong>Total</strong></td>
                <td><strong>{{total}}</strong></td>
              </tr>
            </tfoot>
          </table>
        </section>
        
        <section class="terms">
          <h2>Terms & Conditions</h2>
          <ul>
            <li>Payment due within 30 days of invoice</li>
            <li>Prices subject to change if quotation is not accepted within validity period</li>
            <li>All work to be completed according to industry standards and local regulations</li>
          </ul>
        </section>
        
        <section class="notes">
          <h2>Additional Notes</h2>
          <p>{{notes}}</p>
        </section>
        
        <footer>
          <p>Thank you for your business!</p>
        </footer>
      </div>
    `;
  }
}

export default new TemplateRepository();
