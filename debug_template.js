const { Client } = require('pg');

async function debugTemplate() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'asp_crm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'crmdb@21',
    ssl: false
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get templates
    const result = await client.query('SELECT id, name, elements FROM enhanced_templates WHERE is_active = true LIMIT 3');
    
    console.log('\n=== TEMPLATES IN DATABASE ===');
    for (const template of result.rows) {
      console.log(`\nTemplate: ${template.name} (${template.id})`);
      console.log('Elements:', JSON.stringify(template.elements, null, 2));
      
      if (template.elements && Array.isArray(template.elements)) {
        console.log('Element types:', template.elements.map(el => el.type));
        console.log('Element visible flags:', template.elements.map(el => el.visible));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

debugTemplate();