import axios from 'axios';

export async function getTemplates() {
  const res = await axios.get('/api/templates');
  return res.data.data;
}

export async function saveTemplate(template: any) {
  const res = await axios.post('/api/templates', template);
  return res.data.data;
}
