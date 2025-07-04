import{p as m}from"./index-DZZNOk26.js";var i={};const n=new m.Pool({host:i.DB_HOST||"localhost",port:parseInt(i.DB_PORT||"5432"),database:i.DB_NAME||"asp_crm",user:i.DB_USER||"postgres",password:i.DB_PASSWORD||"postgres"}),p=async()=>{let s;try{return s=await n.connect(),(await s.query(`
      SELECT 
        d.id,
        d.deal_id,
        d.customer_id,
        d.lead_id,
        d.status,
        d.amount,
        d.notes,
        d.assigned_to,
        d.created_at,
        d.updated_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company as customer_company,
        c.address as customer_address,
        c.designation as customer_designation,
        u.email as assigned_to_email,
        COALESCE(u.display_name, u.email) as assigned_to_display_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.customer_id
      LEFT JOIN users u ON d.assigned_to = u.uid
      ORDER BY d.created_at DESC
    `)).rows.map(e=>({id:e.deal_id,customerId:e.customer_id,leadId:e.lead_id||"",title:e.notes?`Deal for ${e.customer_name||"Customer"}`:e.deal_id,description:e.notes||"",customer:{name:e.customer_name||"Unknown Customer",email:e.customer_email||"",phone:e.customer_phone||"",company:e.customer_company||"",address:e.customer_address||"",designation:e.customer_designation||""},value:parseFloat(e.amount)||0,probability:50,stage:e.status,assignedTo:e.assigned_to||"",assignedToName:e.assigned_to_display_name||e.assigned_to_email||"",expectedCloseDate:new Date().toISOString(),notes:e.notes||"",createdAt:e.created_at||new Date().toISOString(),updatedAt:e.updated_at||new Date().toISOString()}))}catch(t){throw console.error("Error in getDeals:",t),new Error(`Failed to get deals: ${t.message}`)}finally{s&&s.release()}},u=async s=>{let t;try{t=await n.connect();const e=await t.query(`
      SELECT 
        d.id,
        d.deal_id,
        d.customer_id,
        d.lead_id,
        d.status,
        d.amount,
        d.notes,
        d.assigned_to,
        d.created_at,
        d.updated_at,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.company as customer_company,
        c.address as customer_address,
        c.designation as customer_designation,
        u.email as assigned_to_email,
        COALESCE(u.display_name, u.email) as assigned_to_display_name
      FROM deals d
      LEFT JOIN customers c ON d.customer_id = c.customer_id
      LEFT JOIN users u ON d.assigned_to = u.uid
      WHERE d.deal_id = $1
    `,[s]);if(e.rows.length===0)return null;const a=e.rows[0];return{id:a.deal_id,customerId:a.customer_id,leadId:a.lead_id||"",title:a.notes?`Deal for ${a.customer_name||"Customer"}`:a.deal_id,description:a.notes||"",customer:{name:a.customer_name||"Unknown Customer",email:a.customer_email||"",phone:a.customer_phone||"",company:a.customer_company||"",address:a.customer_address||"",designation:a.customer_designation||""},value:parseFloat(a.amount)||0,probability:50,stage:a.status,assignedTo:a.assigned_to||"",assignedToName:a.assigned_to_display_name||a.assigned_to_email||"",createdBy:"",expectedCloseDate:new Date().toISOString(),notes:a.notes||"",createdAt:a.created_at||new Date().toISOString(),updatedAt:a.updated_at||new Date().toISOString()}}catch(e){throw console.error(`Error in getDealById for ID ${s}:`,e),new Error(`Failed to get deal with ID ${s}: ${e.message}`)}finally{t&&t.release()}},g=async s=>{let t;try{t=await n.connect();const e=`deal-${Date.now()}-${Math.floor(Math.random()*1e3)}`,{customerId:a,leadId:o,value:r,stage:d,assignedTo:l,notes:c}=s;return await t.query(`
      INSERT INTO deals (
        deal_id, 
        customer_id, 
        lead_id, 
        status, 
        amount, 
        assigned_to, 
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,[e,a,o||null,d||"qualification",r||0,l,c]),{id:e,customerId:a,leadId:o||"",title:`New Deal ${e}`,description:"",value:parseFloat(r)||0,probability:50,stage:d||"qualification",assignedTo:l||"",assignedToName:"",createdBy:"",expectedCloseDate:new Date().toISOString(),notes:c||"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}catch(e){throw console.error("Error in createDeal:",e),new Error(`Failed to create deal: ${e.message}`)}finally{t&&t.release()}},E=async(s,t)=>{let e;try{if(e=await n.connect(),(await e.query("SELECT deal_id FROM deals WHERE deal_id = $1",[s])).rows.length===0)return null;const o=[],r=[s];let d=2;return t.customerId!==void 0&&(o.push(`customer_id = $${d++}`),r.push(t.customerId)),t.leadId!==void 0&&(o.push(`lead_id = $${d++}`),r.push(t.leadId||null)),t.stage!==void 0&&(o.push(`status = $${d++}`),r.push(t.stage)),t.value!==void 0&&(o.push(`amount = $${d++}`),r.push(t.value)),t.assignedTo!==void 0&&(o.push(`assigned_to = $${d++}`),r.push(t.assignedTo)),t.notes!==void 0&&(o.push(`notes = $${d++}`),r.push(t.notes)),o.push("updated_at = NOW()"),await e.query(`
      UPDATE deals 
      SET ${o.join(", ")} 
      WHERE deal_id = $1
    `,r),await u(s)}catch(a){throw console.error(`Error in updateDeal for ID ${s}:`,a),new Error(`Failed to update deal with ID ${s}: ${a.message}`)}finally{e&&e.release()}},h=async(s,t)=>{let e;try{return e=await n.connect(),(await e.query("SELECT deal_id FROM deals WHERE deal_id = $1",[s])).rows.length===0?null:(await e.query("UPDATE deals SET status = $1, updated_at = NOW() WHERE deal_id = $2",[t,s]),await u(s))}catch(a){throw console.error(`Error in updateDealStage for ID ${s}:`,a),new Error(`Failed to update stage for deal with ID ${s}: ${a.message}`)}finally{e&&e.release()}},y=async s=>{let t;try{return t=await n.connect(),(await t.query("SELECT deal_id FROM deals WHERE deal_id = $1",[s])).rows.length===0?!1:(await t.query("DELETE FROM deals WHERE deal_id = $1",[s]),!0)}catch(e){throw console.error(`Error in deleteDeal for ID ${s}:`,e),new Error(`Failed to delete deal with ID ${s}: ${e.message}`)}finally{t&&t.release()}};export{g as createDeal,y as deleteDeal,u as getDealById,p as getDeals,E as updateDeal,h as updateDealStage};
