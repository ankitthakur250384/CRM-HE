const { pool } = require('./src/lib/dbConnection.js');

async function checkTemplate() {
  try {
    const result = await pool.query('SELECT id, name, elements, content FROM quotation_templates WHERE id = $1', ['qtpl_a650c77a']);
    
    if (result.rows[0]) {
      console.log('Template found!');
      console.log('ID:', result.rows[0].id);
      console.log('Name:', result.rows[0].name);
      console.log('Has content:', !!result.rows[0].content);
      console.log('Has elements:', !!result.rows[0].elements);
      
      if (result.rows[0].elements) {
        console.log('\nElements structure:');
        const elements = result.rows[0].elements;
        console.log('Elements type:', typeof elements);
        if (Array.isArray(elements)) {
          console.log('Elements count:', elements.length);
          console.log('First element:', JSON.stringify(elements[0], null, 2));
        } else {
          console.log('Elements preview:', JSON.stringify(elements, null, 2).substring(0, 300));
        }
      }
      
      if (result.rows[0].content) {
        console.log('\nContent preview:', result.rows[0].content.substring(0, 200));
      }
    } else {
      console.log('Template not found!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkTemplate();
