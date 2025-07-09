import{q as c,g as m}from"./index-B3DxmTIK.js";const h=async()=>{try{console.log("Getting all deals directly from PostgreSQL database");const s=await c(`
      SELECT d.*, 
             COALESCE(c.name, l.customer_name, 'Unknown Customer') as customer_name,
             COALESCE(c.email, l.email, '') as customer_email,
             COALESCE(c.phone, l.phone, '') as customer_phone,
             COALESCE(c.company_name, l.company_name, '') as customer_company,
             COALESCE(c.address, '') as customer_address,
             COALESCE(c.designation, l.designation, '') as customer_designation,
             u1.display_name as assigned_to_name,
             u2.display_name as created_by_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN leads l ON d.lead_id = l.id
      LEFT JOIN users u1 ON d.assigned_to = u1.uid
      LEFT JOIN users u2 ON d.created_by = u2.uid
      ORDER BY d.created_at DESC
    `);return console.log(`Successfully fetched ${s.rows.length} deals from database`),s.rows.map(e=>({id:e.id,title:e.title,description:e.description||"",value:typeof e.value=="number"?e.value:parseFloat(e.value),probability:typeof e.probability=="number"?e.probability:e.probability?parseFloat(e.probability):0,stage:e.stage,leadId:e.lead_id,customerId:e.customer_id,customer:{name:e.customer_name||"Unknown Customer",email:e.customer_email||"",phone:e.customer_phone||"",company:e.customer_company||"",address:e.customer_address||"",designation:e.customer_designation||""},expectedCloseDate:e.expected_close_date,createdBy:e.created_by,assignedTo:e.assigned_to||"",assignedToName:e.assigned_to_name||"",createdAt:e.created_at,updatedAt:e.updated_at,notes:e.notes||""}))}catch(s){throw console.error("Error fetching deals:",s),s}},f=async s=>{var e;const t=await m();try{await t.query("BEGIN"),console.log("Creating deal in PostgreSQL database");const a=(await t.query(`
      INSERT INTO deals (
        lead_id, customer_id, title, description, value,
        stage, created_by, assigned_to, probability,
        expected_close_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,[s.leadId,s.customerId,s.title,s.description,s.value,s.stage,s.createdBy,s.assignedTo,s.probability,s.expectedCloseDate,s.notes])).rows[0],r=await t.query("SELECT * FROM customers WHERE id = $1",[a.customer_id]),i=a.assigned_to?await t.query("SELECT display_name FROM users WHERE uid = $1",[a.assigned_to]):{rows:[]};await t.query("COMMIT");const d=r.rows[0]||{},u=((e=i.rows[0])==null?void 0:e.display_name)||"",n={id:a.id,title:a.title,description:a.description||"",value:typeof a.value=="number"?a.value:parseFloat(a.value),probability:typeof a.probability=="number"?a.probability:parseFloat(a.probability||0),stage:a.stage,leadId:a.lead_id,customerId:a.customer_id,customer:{name:d.name||"Unknown Customer",email:d.email||"",phone:d.phone||"",company:d.company_name||"",address:d.address||"",designation:d.designation||""},expectedCloseDate:a.expected_close_date,createdBy:a.created_by,assignedTo:a.assigned_to||"",assignedToName:u,createdAt:a.created_at,updatedAt:a.updated_at,notes:a.notes||""};return console.log("Deal created successfully:",n.id),n}catch(o){throw await t.query("ROLLBACK"),console.error("Error creating deal:",o),o}finally{t.release()}},$=async(s,t)=>{var e;try{if(!s)throw new Error("Invalid deal ID provided");console.log(`Updating deal ${s} stage to ${t} in database`);const o=await c("UPDATE deals SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *",[t,s]);if(o.rows.length===0)return console.warn(`Deal ${s} not found when updating stage to ${t}`),null;const a=o.rows[0],r=await c("SELECT * FROM customers WHERE id = $1",[a.customer_id]),i=a.assigned_to?await c("SELECT display_name FROM users WHERE uid = $1",[a.assigned_to]):{rows:[]},d=r.rows[0]||{},u=((e=i.rows[0])==null?void 0:e.display_name)||"",n={id:a.id,title:a.title,description:a.description||"",value:typeof a.value=="number"?a.value:parseFloat(a.value),probability:typeof a.probability=="number"?a.probability:parseFloat(a.probability||0),stage:a.stage,leadId:a.lead_id,customerId:a.customer_id,customer:{name:d.name||"Unknown Customer",email:d.email||"",phone:d.phone||"",company:d.company_name||"",address:d.address||"",designation:d.designation||""},expectedCloseDate:a.expected_close_date,createdBy:a.created_by,assignedTo:a.assigned_to||"",assignedToName:u,createdAt:a.created_at,updatedAt:a.updated_at,notes:a.notes||""};return console.log(`Deal ${s} stage updated successfully to ${t}`),n}catch(o){throw console.error(`Error updating deal ${s} stage to ${t}:`,o),o}},E=async s=>{try{if(!s)throw new Error("Invalid deal ID provided");console.log(`Getting deal ${s} from database`);const t=await c(`
      SELECT d.*, 
             c.name as customer_name, 
             c.email as customer_email,
             c.phone as customer_phone,
             c.company_name as customer_company,
             c.address as customer_address,
             c.designation as customer_designation,
             u1.display_name as assigned_to_name,
             u2.display_name as created_by_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN users u1 ON d.assigned_to = u1.uid
      LEFT JOIN users u2 ON d.created_by = u2.uid
      WHERE d.id = $1
    `,[s]);if(t.rows.length===0)return console.log(`Deal ${s} not found in database`),null;const e=t.rows[0],o={id:e.id,title:e.title,description:e.description||"",value:typeof e.value=="number"?e.value:parseFloat(e.value),probability:typeof e.probability=="number"?e.probability:parseFloat(e.probability||0),stage:e.stage,leadId:e.lead_id,customerId:e.customer_id,customer:{name:e.customer_name||"Unknown Customer",email:e.customer_email||"",phone:e.customer_phone||"",company:e.customer_company||"",address:e.customer_address||"",designation:e.customer_designation||""},expectedCloseDate:e.expected_close_date,createdBy:e.created_by,assignedTo:e.assigned_to||"",assignedToName:e.assigned_to_name||"",createdAt:e.created_at,updatedAt:e.updated_at,notes:e.notes||""};return console.log(`Deal ${s} retrieved successfully`),o}catch(t){throw console.error(`Error fetching deal ${s}:`,t),t}},T=async s=>{try{if(!s||typeof s!="string")throw new Error("Invalid deal title provided");return(await c(`
      SELECT d.*, 
             c.name as customer_name, 
             c.email as customer_email,
             c.phone as customer_phone,
             c.company_name as customer_company,
             c.address as customer_address,
             c.designation as customer_designation,
             u1.display_name as assigned_to_name,
             u2.display_name as created_by_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN users u1 ON d.assigned_to = u1.uid
      LEFT JOIN users u2 ON d.created_by = u2.uid
      WHERE d.title ILIKE $1
      ORDER BY 
        CASE WHEN d.title = $2 THEN 1 ELSE 2 END,  -- Exact matches first
        d.created_at DESC
    `,[`%${s}%`,s])).rows.map(o=>({id:o.id,title:o.title,description:o.description||"",value:typeof o.value=="number"?o.value:parseFloat(o.value),probability:typeof o.probability=="number"?o.probability:parseFloat(o.probability||0),stage:o.stage,leadId:o.lead_id,customerId:o.customer_id,customer:{name:o.customer_name||"Unknown Customer",email:o.customer_email||"",phone:o.customer_phone||"",company:o.customer_company||"",address:o.customer_address||"",designation:o.customer_designation||""},expectedCloseDate:o.expected_close_date,createdBy:o.created_by,assignedTo:o.assigned_to||"",assignedToName:o.assigned_to_name||"",createdAt:o.created_at,updatedAt:o.updated_at,notes:o.notes||""}))}catch(t){throw console.error(`Error finding deals by title "${s}":`,t),t}},N=async s=>{try{if(!s||typeof s!="string")throw new Error("Invalid deal title provided");const t=await c(`
      SELECT d.*, 
             c.name as customer_name, 
             c.email as customer_email,
             c.phone as customer_phone,
             c.company_name as customer_company,
             c.address as customer_address,
             c.designation as customer_designation,
             u1.display_name as assigned_to_name,
             u2.display_name as created_by_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.id
      LEFT JOIN users u1 ON d.assigned_to = u1.uid
      LEFT JOIN users u2 ON d.created_by = u2.uid
      WHERE d.title = $1
      ORDER BY d.created_at DESC
      LIMIT 1
    `,[s]);if(t.rows.length===0)return null;const e=t.rows[0];return{id:e.id,title:e.title,description:e.description||"",value:typeof e.value=="number"?e.value:parseFloat(e.value),probability:typeof e.probability=="number"?e.probability:parseFloat(e.probability||0),stage:e.stage,leadId:e.lead_id,customerId:e.customer_id,customer:{name:e.customer_name||"Unknown Customer",email:e.customer_email||"",phone:e.customer_phone||"",company:e.customer_company||"",address:e.customer_address||"",designation:e.customer_designation||""},expectedCloseDate:e.expected_close_date,createdBy:e.created_by,assignedTo:e.assigned_to||"",assignedToName:e.assigned_to_name||"",createdAt:e.created_at,updatedAt:e.updated_at,notes:e.notes||""}}catch(t){throw console.error(`Error getting deal by title "${s}":`,t),t}},O=async(s,t)=>{var o;const e=await m();try{if(await e.query("BEGIN"),console.log(`Updating deal ${s} in database`),(await e.query("SELECT * FROM deals WHERE id = $1",[s])).rowCount===0)return console.log(`Deal ${s} not found for update`),null;const r=[],i=[];let d=1;if(t.title!==void 0&&(r.push(`title = $${d++}`),i.push(t.title)),t.description!==void 0&&(r.push(`description = $${d++}`),i.push(t.description)),t.value!==void 0&&(r.push(`value = $${d++}`),i.push(t.value)),t.probability!==void 0&&(r.push(`probability = $${d++}`),i.push(t.probability)),t.stage!==void 0&&(r.push(`stage = $${d++}`),i.push(t.stage)),t.expectedCloseDate!==void 0&&(r.push(`expected_close_date = $${d++}`),i.push(t.expectedCloseDate)),t.assignedTo!==void 0&&(r.push(`assigned_to = $${d++}`),i.push(t.assignedTo)),t.notes!==void 0&&(r.push(`notes = $${d++}`),i.push(t.notes)),r.push("updated_at = NOW()"),i.push(s),r.length===1)return console.log(`No fields to update for deal ${s}`),E(s);const n=(await e.query(`
      UPDATE deals
      SET ${r.join(", ")}
      WHERE id = $${d}
      RETURNING *
    `,i)).rows[0],p=await e.query("SELECT * FROM customers WHERE id = $1",[n.customer_id]),_=n.assigned_to?await e.query("SELECT display_name FROM users WHERE uid = $1",[n.assigned_to]):{rows:[]};await e.query("COMMIT");const l=p.rows[0]||{},y=((o=_.rows[0])==null?void 0:o.display_name)||"",g={id:n.id,title:n.title,description:n.description||"",value:typeof n.value=="number"?n.value:parseFloat(n.value),probability:typeof n.probability=="number"?n.probability:parseFloat(n.probability||0),stage:n.stage,leadId:n.lead_id,customerId:n.customer_id,customer:{name:l.name||"Unknown Customer",email:l.email||"",phone:l.phone||"",company:l.company_name||"",address:l.address||"",designation:l.designation||""},expectedCloseDate:n.expected_close_date,createdBy:n.created_by,assignedTo:n.assigned_to||"",assignedToName:y,createdAt:n.created_at,updatedAt:n.updated_at,notes:n.notes||""};return console.log(`Deal ${s} updated successfully`),g}catch(a){throw await e.query("ROLLBACK"),console.error(`Error updating deal ${s}:`,a),a}finally{e.release()}},C=async s=>{try{if(!s)throw new Error("Invalid deal ID provided");console.log(`Deleting deal ${s} from database`);const e=(await c("DELETE FROM deals WHERE id = $1 RETURNING id",[s])).rows.length>0;return e?console.log(`Deal ${s} deleted successfully`):console.warn(`Deal ${s} not found for deletion`),e}catch(t){throw console.error(`Error deleting deal ${s}:`,t),t}};export{f as createDeal,C as deleteDeal,T as findDealsByTitle,E as getDealById,N as getDealByTitle,h as getDeals,O as updateDeal,$ as updateDealStage};
