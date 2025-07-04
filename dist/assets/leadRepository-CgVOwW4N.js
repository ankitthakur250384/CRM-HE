import{p as m}from"./index-DZZNOk26.js";var c={};const i=new m.Pool({host:c.DB_HOST||"localhost",port:parseInt(c.DB_PORT||"5432"),database:c.DB_NAME||"asp_crm",user:c.DB_USER||"postgres",password:c.DB_PASSWORD||"postgres"}),h=async()=>{let r;try{return r=await i.connect(),(await r.query(`
      SELECT 
        l.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company as customer_company,
        c.address as customer_address,
        c.designation as customer_designation
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.customer_id
      ORDER BY l.created_at DESC
    `)).rows.map(e=>({id:e.lead_id,customerId:e.customer_id,title:e.title||`Lead for ${e.customer_name||"Customer"}`,description:e.description||"",customer:{name:e.customer_name||"Unknown Customer",email:e.customer_email||"",phone:e.customer_phone||"",company:e.customer_company||"",address:e.customer_address||"",designation:e.customer_designation||""},status:e.status||"new",source:e.source||"direct",assignedTo:e.assigned_to||"",notes:e.notes||"",createdAt:e.created_at||new Date().toISOString(),updatedAt:e.updated_at||new Date().toISOString()}))}catch(t){throw console.error("Error in getLeads:",t),new Error(`Failed to get leads: ${t.message}`)}finally{r&&r.release()}},p=async r=>{let t;try{t=await i.connect();const e=await t.query(`
      SELECT 
        l.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company as customer_company,
        c.address as customer_address,
        c.designation as customer_designation
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.customer_id
      WHERE l.lead_id = $1
    `,[r]);if(e.rows.length===0)return null;const s=e.rows[0];return{id:s.lead_id,customerId:s.customer_id,title:s.title||`Lead for ${s.customer_name||"Customer"}`,description:s.description||"",customer:{name:s.customer_name||"Unknown Customer",email:s.customer_email||"",phone:s.customer_phone||"",company:s.customer_company||"",address:s.customer_address||"",designation:s.customer_designation||""},status:s.status||"new",source:s.source||"direct",assignedTo:s.assigned_to||"",notes:s.notes||"",createdAt:s.created_at||new Date().toISOString(),updatedAt:s.updated_at||new Date().toISOString()}}catch(e){throw console.error(`Error in getLeadById for ID ${r}:`,e),new Error(`Failed to get lead with ID ${r}: ${e.message}`)}finally{t&&t.release()}},$=async r=>{let t;try{t=await i.connect();const e=`lead-${Date.now()}-${Math.floor(Math.random()*1e3)}`,{customerId:s,title:o,description:a,status:n,source:d,assignedTo:u,notes:l}=r;return await t.query(`
      INSERT INTO leads (
        lead_id, 
        customer_id, 
        title, 
        description, 
        status, 
        source, 
        assigned_to, 
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,[e,s,o,a,n||"new",d||"direct",u,l]),{id:e,customerId:s,title:o,description:a,status:n||"new",source:d||"direct",assignedTo:u||"",notes:l||"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}catch(e){throw console.error("Error in createLead:",e),new Error(`Failed to create lead: ${e.message}`)}finally{t&&t.release()}},g=async(r,t)=>{let e;try{if(e=await i.connect(),(await e.query("SELECT lead_id FROM leads WHERE lead_id = $1",[r])).rows.length===0)return null;const o=[],a=[r];let n=2;return t.customerId!==void 0&&(o.push(`customer_id = $${n++}`),a.push(t.customerId)),t.title!==void 0&&(o.push(`title = $${n++}`),a.push(t.title)),t.description!==void 0&&(o.push(`description = $${n++}`),a.push(t.description)),t.status!==void 0&&(o.push(`status = $${n++}`),a.push(t.status)),t.source!==void 0&&(o.push(`source = $${n++}`),a.push(t.source)),t.assignedTo!==void 0&&(o.push(`assigned_to = $${n++}`),a.push(t.assignedTo)),t.notes!==void 0&&(o.push(`notes = $${n++}`),a.push(t.notes)),o.push("updated_at = NOW()"),await e.query(`
      UPDATE leads 
      SET ${o.join(", ")} 
      WHERE lead_id = $1
    `,a),await p(r)}catch(s){throw console.error(`Error in updateLead for ID ${r}:`,s),new Error(`Failed to update lead with ID ${r}: ${s.message}`)}finally{e&&e.release()}},E=async r=>{let t;try{return t=await i.connect(),(await t.query("SELECT lead_id FROM leads WHERE lead_id = $1",[r])).rows.length===0?!1:(await t.query("DELETE FROM leads WHERE lead_id = $1",[r]),!0)}catch(e){throw console.error(`Error in deleteLead for ID ${r}:`,e),new Error(`Failed to delete lead with ID ${r}: ${e.message}`)}finally{t&&t.release()}};export{$ as createLead,E as deleteLead,p as getLeadById,h as getLeads,g as updateLead};
