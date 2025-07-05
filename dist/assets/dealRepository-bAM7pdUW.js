import{q as l,g as p}from"./dbConnection-DFMSfmeB.js";import"./index-DVJ1rf7s.js";const h=async()=>{try{console.log("Getting all deals directly from PostgreSQL database");const s=await l(`
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
    `);return console.log(`Successfully fetched ${s.rows.length} deals from database`),s.rows.map(e=>({id:e.id,title:e.title,description:e.description||"",value:typeof e.value=="number"?e.value:parseFloat(e.value),probability:typeof e.probability=="number"?e.probability:e.probability?parseFloat(e.probability):0,stage:e.stage,leadId:e.lead_id,customerId:e.customer_id,customer:{name:e.customer_name||"Unknown Customer",email:e.customer_email||"",phone:e.customer_phone||"",company:e.customer_company||"",address:e.customer_address||"",designation:e.customer_designation||""},expectedCloseDate:e.expected_close_date,createdBy:e.created_by,assignedTo:e.assigned_to||"",assignedToName:e.assigned_to_name||"",createdAt:e.created_at,updatedAt:e.updated_at,notes:e.notes||""}))}catch(s){throw console.error("Error fetching deals:",s),s}},f=async s=>{var e;const a=await p();try{await a.query("BEGIN"),console.log("Creating deal in PostgreSQL database");const t=(await a.query(`
      INSERT INTO deals (
        lead_id, customer_id, title, description, value,
        stage, created_by, assigned_to, probability,
        expected_close_date, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `,[s.leadId,s.customerId,s.title,s.description,s.value,s.stage,s.createdBy,s.assignedTo,s.probability,s.expectedCloseDate,s.notes])).rows[0],r=await a.query("SELECT * FROM customers WHERE id = $1",[t.customer_id]),i=t.assigned_to?await a.query("SELECT display_name FROM users WHERE uid = $1",[t.assigned_to]):{rows:[]};await a.query("COMMIT");const n=r.rows[0]||{},u=((e=i.rows[0])==null?void 0:e.display_name)||"",o={id:t.id,title:t.title,description:t.description||"",value:typeof t.value=="number"?t.value:parseFloat(t.value),probability:typeof t.probability=="number"?t.probability:parseFloat(t.probability||0),stage:t.stage,leadId:t.lead_id,customerId:t.customer_id,customer:{name:n.name||"Unknown Customer",email:n.email||"",phone:n.phone||"",company:n.company_name||"",address:n.address||"",designation:n.designation||""},expectedCloseDate:t.expected_close_date,createdBy:t.created_by,assignedTo:t.assigned_to||"",assignedToName:u,createdAt:t.created_at,updatedAt:t.updated_at,notes:t.notes||""};return console.log("Deal created successfully:",o.id),o}catch(d){throw await a.query("ROLLBACK"),console.error("Error creating deal:",d),d}finally{a.release()}},T=async(s,a)=>{var e;try{if(!s)throw new Error("Invalid deal ID provided");console.log(`Updating deal ${s} stage to ${a} in database`);const d=await l("UPDATE deals SET stage = $1, updated_at = NOW() WHERE id = $2 RETURNING *",[a,s]);if(d.rows.length===0)return console.warn(`Deal ${s} not found when updating stage to ${a}`),null;const t=d.rows[0],r=await l("SELECT * FROM customers WHERE id = $1",[t.customer_id]),i=t.assigned_to?await l("SELECT display_name FROM users WHERE uid = $1",[t.assigned_to]):{rows:[]},n=r.rows[0]||{},u=((e=i.rows[0])==null?void 0:e.display_name)||"",o={id:t.id,title:t.title,description:t.description||"",value:typeof t.value=="number"?t.value:parseFloat(t.value),probability:typeof t.probability=="number"?t.probability:parseFloat(t.probability||0),stage:t.stage,leadId:t.lead_id,customerId:t.customer_id,customer:{name:n.name||"Unknown Customer",email:n.email||"",phone:n.phone||"",company:n.company_name||"",address:n.address||"",designation:n.designation||""},expectedCloseDate:t.expected_close_date,createdBy:t.created_by,assignedTo:t.assigned_to||"",assignedToName:u,createdAt:t.created_at,updatedAt:t.updated_at,notes:t.notes||""};return console.log(`Deal ${s} stage updated successfully to ${a}`),o}catch(d){throw console.error(`Error updating deal ${s} stage to ${a}:`,d),d}},E=async s=>{try{if(!s)throw new Error("Invalid deal ID provided");console.log(`Getting deal ${s} from database`);const a=await l(`
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
    `,[s]);if(a.rows.length===0)return console.log(`Deal ${s} not found in database`),null;const e=a.rows[0],d={id:e.id,title:e.title,description:e.description||"",value:typeof e.value=="number"?e.value:parseFloat(e.value),probability:typeof e.probability=="number"?e.probability:parseFloat(e.probability||0),stage:e.stage,leadId:e.lead_id,customerId:e.customer_id,customer:{name:e.customer_name||"Unknown Customer",email:e.customer_email||"",phone:e.customer_phone||"",company:e.customer_company||"",address:e.customer_address||"",designation:e.customer_designation||""},expectedCloseDate:e.expected_close_date,createdBy:e.created_by,assignedTo:e.assigned_to||"",assignedToName:e.assigned_to_name||"",createdAt:e.created_at,updatedAt:e.updated_at,notes:e.notes||""};return console.log(`Deal ${s} retrieved successfully`),d}catch(a){throw console.error(`Error fetching deal ${s}:`,a),a}},C=async(s,a)=>{var d;const e=await p();try{if(await e.query("BEGIN"),console.log(`Updating deal ${s} in database`),(await e.query("SELECT * FROM deals WHERE id = $1",[s])).rowCount===0)return console.log(`Deal ${s} not found for update`),null;const r=[],i=[];let n=1;if(a.title!==void 0&&(r.push(`title = $${n++}`),i.push(a.title)),a.description!==void 0&&(r.push(`description = $${n++}`),i.push(a.description)),a.value!==void 0&&(r.push(`value = $${n++}`),i.push(a.value)),a.probability!==void 0&&(r.push(`probability = $${n++}`),i.push(a.probability)),a.stage!==void 0&&(r.push(`stage = $${n++}`),i.push(a.stage)),a.expectedCloseDate!==void 0&&(r.push(`expected_close_date = $${n++}`),i.push(a.expectedCloseDate)),a.assignedTo!==void 0&&(r.push(`assigned_to = $${n++}`),i.push(a.assignedTo)),a.notes!==void 0&&(r.push(`notes = $${n++}`),i.push(a.notes)),r.push("updated_at = NOW()"),i.push(s),r.length===1)return console.log(`No fields to update for deal ${s}`),E(s);const o=(await e.query(`
      UPDATE deals
      SET ${r.join(", ")}
      WHERE id = $${n}
      RETURNING *
    `,i)).rows[0],m=await e.query("SELECT * FROM customers WHERE id = $1",[o.customer_id]),_=o.assigned_to?await e.query("SELECT display_name FROM users WHERE uid = $1",[o.assigned_to]):{rows:[]};await e.query("COMMIT");const c=m.rows[0]||{},y=((d=_.rows[0])==null?void 0:d.display_name)||"",g={id:o.id,title:o.title,description:o.description||"",value:typeof o.value=="number"?o.value:parseFloat(o.value),probability:typeof o.probability=="number"?o.probability:parseFloat(o.probability||0),stage:o.stage,leadId:o.lead_id,customerId:o.customer_id,customer:{name:c.name||"Unknown Customer",email:c.email||"",phone:c.phone||"",company:c.company_name||"",address:c.address||"",designation:c.designation||""},expectedCloseDate:o.expected_close_date,createdBy:o.created_by,assignedTo:o.assigned_to||"",assignedToName:y,createdAt:o.created_at,updatedAt:o.updated_at,notes:o.notes||""};return console.log(`Deal ${s} updated successfully`),g}catch(t){throw await e.query("ROLLBACK"),console.error(`Error updating deal ${s}:`,t),t}finally{e.release()}},w=async s=>{try{if(!s)throw new Error("Invalid deal ID provided");console.log(`Deleting deal ${s} from database`);const e=(await l("DELETE FROM deals WHERE id = $1 RETURNING id",[s])).rows.length>0;return e?console.log(`Deal ${s} deleted successfully`):console.warn(`Deal ${s} not found for deletion`),e}catch(a){throw console.error(`Error deleting deal ${s}:`,a),a}};export{f as createDeal,w as deleteDeal,E as getDealById,h as getDeals,C as updateDeal,T as updateDealStage};
